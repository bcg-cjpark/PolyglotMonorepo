/// <reference types="vite/client" />

interface ImportMetaEnv {
  // Vite dev server 프록시 타깃 (vite.config.ts에서만 사용, 브라우저 코드에서는 참조 금지)
  readonly VITE_API_TARGET?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
