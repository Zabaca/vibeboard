/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_CEREBRAS_API_KEY: string
  readonly VITE_PUBLIC_POSTHOG_KEY: string
  readonly VITE_PUBLIC_POSTHOG_HOST: string
  readonly VITE_ENABLE_POSTHOG_DEV?: string
  // more env variables...
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}