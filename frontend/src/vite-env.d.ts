/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_ROOT?: string;
  readonly VITE_BASE_PATH?: string;
  /** ISO-8601 instant when public teams/leaderboard/judge/qa/polls and /display/* unlock. Omit to leave them open. */
  readonly VITE_PUBLIC_EVENT_MODULES_OPEN_AT?: string;
  readonly VITE_WHATSAPP_URL?: string;
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
  /** Origin for legacy `/uploads/...` paths when the API is on another host (e.g. https://api.example.com). */
  readonly VITE_ASSET_ORIGIN?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
