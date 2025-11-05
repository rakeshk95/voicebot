/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
  readonly VITE_BACKEND_URL: string;
  readonly VITE_WEBHOOK_URL: string;
  readonly VITE_ENV: string;
  readonly VITE_WEBHOOK_TOKEN?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}