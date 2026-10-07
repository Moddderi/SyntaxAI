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

### OpenAI API key

| Mode | How to configure |
|------|------------------|
| `npm run dev` | Copy `.env.example` → `.env`, set `VITE_OPENAI_API_KEY` |
| `build:chrome` / `build:firefox` | **Settings → OpenAI** — key is saved in `chrome.storage.local` (not baked into the bundle) |

**Security:** `dist/` and `dist-firefox/` are gitignored — do not commit build output. If a key was ever committed, [rotate it](https://platform.openai.com/api-keys) before pushing again. After fixing history, `git push` should pass GitHub secret scanning.

## Browsers

| Feature        | Chrome              | Firefox                          |
|----------------|---------------------|----------------------------------|
| Capture UI     | Side Panel API      | Sidebar (`sidebar_action`)       |
| Library        | Options / dashboard | Options tab (`options_ui`)       |
| Notes storage  | `chrome.storage`    | same WebExtension API            |
