# Store publishing guide

Both artifacts are produced by `npm run package:all` into `release/`:

- `syntaxai-chrome-<version>.zip` → Chrome Web Store
- `syntaxai-firefox-<version>.zip` → addons.mozilla.org (AMO)

Before every release: bump `version` in `package.json`, `manifest.json`, `manifest.firefox.json` (the packager fails on mismatch), run `npm test && npm run typecheck`, then `npm run package:all`.

## Chrome Web Store

1. Developer account: <https://chrome.google.com/webstore/devconsole> → sign in with a Google account that has 2-Step Verification → accept the developer agreement → pay the one-time **$5** registration fee. Fill in publisher name, contact email (verify it) and, if you want a "trader/non-trader" label, the EU DSA info.
2. **New item** → upload `release/syntaxai-chrome-<version>.zip`.
3. **Store listing**: name, summary (≤132 chars), detailed description, category *Developer Tools*, language. Assets: 128×128 icon, at least one screenshot (1280×800 or 640×400, up to 5), small promo tile 440×280.
4. **Privacy** tab:
   - Single purpose: "Capture code and text from web pages and turn them into AI-structured notes in a personal library."
   - Permission justifications: `storage` (notes, settings, sign-in token), `activeTab` + `scripting` (read the selection only when the user triggers capture), `contextMenus` ("Add to SyntaxAI"), `alarms` (background sync), `sidePanel` (capture UI), host permissions `syntaxai.app` / `api.syntaxai.app` (sign-in and API).
   - Remote code: **No** (all code is bundled).
   - Data usage: tick *Personally identifiable information* (email/name), *Authentication information*, *Website content* (the text/screenshot the user captures). Certify: not sold, not used for unrelated purposes, not used for creditworthiness (Limited Use).
   - Privacy policy URL: `https://syntaxai.app/privacy`.
5. **Distribution**: visibility Public, regions, free. Submit for review (typically 1–3 days; first submissions with `scripting`/host permissions can take longer).
6. After approval copy the listing URL into `NEXT_PUBLIC_CHROME_STORE_URL` on the web deployment and redeploy.

## Firefox (AMO)

1. Account: <https://addons.mozilla.org/developers/> → sign in / create a Firefox Account (enable 2FA) → accept the Distribution Agreement.
2. **Submit a New Add-on** → *On this site* (listed) → upload `release/syntaxai-firefox-<version>.zip`. The add-on ID is `syntaxai@syntaxai.app` (set in `manifest.firefox.json`; never change it after the first upload).
3. The validator should show 0 errors. Known, expected warnings: `sidePanel.open` (feature-detected, Chrome-only path) and `innerHTML` in the bundled UI libraries.
4. Source code: the bundle is minified by Vite, so AMO reviewers may ask for sources. Attach a zip of the repo (without `node_modules`, `dist*`, `release`) and these build instructions: `npm ci && npm run build:firefox`, Node 20+.
5. Listing: name, summary, description, category *Developer Tools* / *Productivity*, screenshots, support email/URL, privacy policy `https://syntaxai.app/privacy`. In "Notes to reviewer" explain: sign-in happens via `https://syntaxai.app` (the content script on that domain hands the device token to the extension); AI calls go to `https://api.syntaxai.app`; data-collection disclosure matches `data_collection_permissions`.
6. Review is usually hours to a few days. Copy the add-on URL into `NEXT_PUBLIC_FIREFOX_ADDON_URL` afterwards.

Minimum versions: Firefox 140 desktop / 142 Android (required for `data_collection_permissions`), Chrome 116.

## Updating

Bump version → `npm run package:all` → upload the new zip in each console (Chrome: *Package → Upload new package*; AMO: *Upload New Version*).
