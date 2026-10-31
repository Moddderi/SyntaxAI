/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_EXTENSION_TARGET?: 'chrome' | 'firefox';
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module '*.svg' {
  const src: string;
  export default src;
}
