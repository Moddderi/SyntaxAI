# SyntaxAI Extension

AI-powered developer notebook (Chrome + Firefox).

## Build

```bash
npm install
npm run build:chrome   # → dist/ (Chrome, Edge)
npm run build:firefox  # → dist-firefox/ (Firefox)
npm run build:all      # оба сразу перед проверкой в двух браузерах
```

### Ежедневная разработка

| Задача | Команда | Куда грузить |
|--------|---------|--------------|
| Watch только Chrome | `npm run dev` | `dist/` → chrome://extensions |
| Разовая сборка Chrome | `npm run build:chrome` | `dist/` |
| Разовая сборка Firefox | `npm run build:firefox` | `dist-firefox/` → about:debugging |
| Проверить оба браузера | `npm run build:all` | обе папки |

После правок кода: **Chrome** при `npm run dev` обновляется сам (кнопка Reload на chrome://extensions). **Firefox** — снова `npm run build:firefox` и Reload на about:debugging (или перезагрузить temporary add-on).

## Load locally

### Chrome / Edge

1. Open `chrome://extensions`
2. Enable **Developer mode**
3. **Load unpacked** → select the `dist` folder

### Firefox

1. Build: `npm run build:firefox`
2. Open `about:debugging` → **This Firefox** → **Load Temporary Add-on…**
3. Choose **`dist-firefox/manifest.json`**

If Firefox shows *「background.service_worker is currently disabled」* — rebuild with `npm run build:firefox` (Firefox uses `background.scripts`, not a service worker).

Or with [web-ext](https://extensionworkshop.com/documentation/develop/getting-started-with-web-ext/):

```bash
npm install -D web-ext
npm run firefox:run
```

## Dev watch

```bash
npm run dev
```

Reload the extension in the browser after changes.

### AI (server key)

End users **never** paste an OpenAI key. The extension calls `https://api.syntaxai.app/api/v1/ai/*` (Railway) with the device token after sign-in. The production key is `OPENAI_API_KEY` on **syntaxai-web** (Railway / `.env.local`) — never in the extension bundle.

**Security:** `dist/` and `dist-firefox/` are gitignored — do not commit build output.

### Permissions (store review)

| Permission | Why |
|------------|-----|
| `storage` | Notes, settings, sign-in token |
| `activeTab` + `scripting` | Read the user's selection **only** when they trigger capture (shortcut / context menu); the capture script is injected on demand |
| `contextMenus` | "Add to SyntaxAI" |
| `alarms` | Background notes sync |
| `sidePanel` (Chrome) | Capture panel |
| Host `syntaxai.app`, `www.syntaxai.app`, `api.syntaxai.app` | Sign-in handoff + API |

There is no `<all_urls>` / `tabs` permission and no always-on content script outside syntaxai.app.

## Testing

```bash
npm test          # vitest (tech detection, sync mapper, auth storage)
npm run typecheck
```

## Release

```bash
npm run package:all     # builds + zips → release/syntaxai-chrome-<v>.zip, release/syntaxai-firefox-<v>.zip
npm run lint:firefox    # web-ext lint on dist-firefox (needs network once for npx)
```

Bump `version` in `package.json`, `manifest.json` **and** `manifest.firefox.json` together — `package-extension.mjs` refuses to zip on a mismatch. Store submission guide: `docs/STORE_PUBLISHING.md`.

## Browsers

| Feature        | Chrome              | Firefox                          |
|----------------|---------------------|----------------------------------|
| Capture UI     | Side Panel API      | Sidebar (`sidebar_action`)       |
| Library        | Options / dashboard | Options tab (`options_ui`)       |
| Notes storage  | `chrome.storage`    | same WebExtension API            |
