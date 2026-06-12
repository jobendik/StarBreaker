// Minimal Vite env typings (we only use BASE_URL for asset paths under the
// GitHub Pages base). Avoids depending on `vite/client` resolution.
interface ImportMetaEnv {
  readonly BASE_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
