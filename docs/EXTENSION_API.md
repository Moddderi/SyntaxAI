# SyntaxAI Web → Extension integration (v1)

Production split:

| Role | Host |
|------|------|
| Marketing + login UI + `POST /api/device-token` | **`https://syntaxai.app`** (Vercel) |
| Heavy API: session, notes, AI, feedback | **`https://api.syntaxai.app`** (Railway) |
| Database | Neon |

Beta: **login required**, **no billing/limits**, notes are **local-first** then sync to account.

```ts
export const SITE_URL = 'https://syntaxai.app';
export const API_BASE = 'https://api.syntaxai.app'; // NOT the Vercel host
```

Call **`API_BASE`** for all Bearer traffic. Hitting `syntaxai.app/api/v1/*` burns Vercel CDN/functions.

---

## What the web already does

| Piece | Status |
|--------|--------|
| Google / GitHub login | ✅ site |
| Device token `sat_…` (~1 year) | ✅ `POST ${SITE_URL}/api/device-token` (cookie) |
| Handoff page | ✅ `https://syntaxai.app/auth/extension` |
| `postMessage` after mint | ✅ see payload below |
| Session for extension | ✅ `GET ${API_BASE}/api/v1/session` |
| Notes pull / push | ✅ `GET` / `POST ${API_BASE}/api/v1/notes` |
| Free/Pro enforcement | ❌ off (`billing.enabled: false`) |

---

## 1. Auth (must wire first)

### Open login from extension

```ts
chrome.tabs.create({ url: 'https://syntaxai.app/auth/extension' });
// or /auth/signin?next=/auth/extension if you prefer
```

### Capture token (content script on syntaxai.app)

Web page does:

```js
window.postMessage({
  source: 'syntaxai-web',
  type: 'syntaxai:auth',
  version: 1,
  token: 'sat_…',
  expiresAt: 'ISO',
  userId: '…',
}, window.location.origin);
```

Extension content script (match `https://syntaxai.app/*`):

```ts
window.addEventListener('message', (event) => {
  if (event.origin !== 'https://syntaxai.app') return;
  const data = event.data;
  if (data?.source !== 'syntaxai-web' || data?.type !== 'syntaxai:auth') return;

  chrome.runtime.sendMessage({
    type: 'SYNTAXAI_AUTH',
    token: data.token,
    expiresAt: data.expiresAt,
    userId: data.userId,
  });
});
```

Background / service worker: save to `chrome.storage.local`, e.g.:

```ts
{
  syntaxai_device_token: 'sat_…',
  syntaxai_token_expires_at: '…',
  syntaxai_user_id: '…',
}
```

### Gate the product

- **No token** → only “Sign in” (open auth tab). Do not sync.
- **Has token** → all beta features; ignore Free/Pro limits while `billing.enabled === false`.

### API auth header

```http
Authorization: Bearer sat_…
```

Check session (startup / popup open):

```http
GET https://api.syntaxai.app/api/v1/session
```

Example response:

```json
{
  "user": { "id": "…", "email": "…", "name": "…", "plan": "free" },
    "billing": { "enabled": false, "limits": null },
  "sync": { "notesPath": "/api/v1/notes", "strategy": "local-first" },
  "ai": {
    "analyzeSnippetPath": "/api/v1/ai/analyze-snippet",
    "analyzeMixedPath": "/api/v1/ai/analyze-mixed"
  }
}
```

`401` → clear token, show Sign in again.

Also: `GET /api/me` (same Bearer) for a lighter profile.

Update display name from the extension account menu:

```http
PATCH https://syntaxai.app/api/v1/me
Content-Type: application/json
Authorization: Bearer sat_…

{ "name": "Oleh" }
```

Response: `{ "id", "email", "name", "plan" }`.

### Manifest

- Content script: `https://syntaxai.app/*` (and `http://localhost:3000/*` for local web if needed).
- Host permissions: `https://syntaxai.app/*` and `https://api.syntaxai.app/*`.

---

## 2. Notes sync (local-first)

Keep current local storage as source of truth for UI speed.

### Write path

1. Save note locally immediately.
2. Queue dirty note ids.
3. Background flush:

```http
POST https://syntaxai.app/api/v1/notes
Content-Type: application/json
Authorization: Bearer sat_…

{
  "notes": [
    {
      "id": "client-uuid",
      "title": "",
      "content": "",
      "tags": ["tag"],
      "pageUrl": "https://…",
      "stack": ["react"] | null,
      "updatedAt": "2026-10-31T16:46:32.840Z",
      "deleted": false
    }
  ]
}
```

Rules:

- `id` — generate on client (stable UUID), max 64 chars.
- `updatedAt` — ISO datetime (Zod `.datetime()`).
- Soft delete: `"deleted": true` (not `deletedAt` on push).
- Max **200** notes per request.
- Server **last-write-wins** on `updatedAt`; older pushes are skipped.

Response:

```json
{ "ok": true, "applied": 1, "skipped": 0, "serverTime": "…" }
```

### Read path

```http
GET https://syntaxai.app/api/v1/notes
GET https://syntaxai.app/api/v1/notes?since=2026-10-31T12:00:00.000Z
```

Response:

```json
{
  "notes": [
    {
      "id": "…",
      "title": "",
      "content": "",
      "tags": [],
      "pageUrl": null,
      "stack": null,
      "createdAt": "…",
      "updatedAt": "…",
      "deletedAt": null
    }
  ],
  "serverTime": "…"
}
```

Merge into local store by `id` / `updatedAt`. If `deletedAt` set → remove or hide locally. Store last successful `serverTime` (or max `updatedAt`) as `since` cursor.

Suggested triggers: extension startup, popup/sidepanel focus, after push, every N minutes.

---

## 3. Config constants (extension)

```ts
// src/constants/api.ts
export const SITE_URL = 'https://syntaxai.app';
export const API_BASE_URL = 'https://api.syntaxai.app';
export const AUTH_URL = `${SITE_URL}/auth/extension`;
export const UPGRADE_URL = `${SITE_URL}/pricing`;
```

---

## 4. AI proxy

Requires sign-in (`Authorization: Bearer sat_…`). OpenAI key stays on the server (`OPENAI_API_KEY` in syntaxai-web).

| Method | Path | Body |
|--------|------|------|
| `POST` | `/api/v1/ai/analyze-snippet` | `{ locale, promptOrCode, imagesBase64? }` |
| `POST` | `/api/v1/ai/analyze-mixed` | `{ locale, pageContext }` |
| `POST` | `/api/v1/feedback` | `{ type: 'feedback' \| 'bug', locale?, email?, …fields }` → email to `hello@syntaxai.app` via Resend |

Response: `{ result: … }` for AI; `{ ok: true }` for feedback. Extension normalizes tech/topics locally after AI calls.

---

## 5. Do not implement yet

- Usage counters / Free 30 notes / Pro gates (wait until `billing.enabled: true`).
- Polar checkout flows beyond linking to `/pricing`.

---

## 6. Smoke checklist (extension)

1. Fresh install → Sign in CTA only.
2. Click Sign in → tab `syntaxai.app/auth/extension` → after Google, content script receives `syntaxai:auth`.
3. Token in `storage.local`; `GET /api/v1/session` → 200.
4. Create note offline-feel → appears in UI instantly → Network shows `POST /api/v1/notes`.
5. Second browser / reinstall → Sign in → `GET /api/v1/notes` restores notes.
6. Delete note → push with `deleted: true` → other client pull hides it.
7. Signed in → paste snippet / capture → Network shows `POST /api/v1/ai/analyze-snippet` or `analyze-mixed` (not `api.openai.com`).

---

## 7. Web reference

Full copy also in `syntaxai-web` README → **Extension API (v1)**.  
Handoff UI: `src/components/auth/ExtensionHandoff.tsx`.  
Schemas: `src/lib/note-types.ts`.
