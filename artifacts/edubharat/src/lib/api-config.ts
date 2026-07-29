export const CLOUD_RUN_BACKEND_URL = "https://ais-dev-koiapvrmz3v6zvdsll5pvu-313361691370.asia-east1.run.app";

export function getApiBaseUrl(): string {
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL.replace(/\/$/, "");
  }
  // Standard relative API base (works on Firebase Hosting rewrites, local dev, Replit, and Cloud Run directly)
  return (import.meta.env.BASE_URL ?? "/").replace(/\/$/, "");
}

export const BASE_API_URL = getApiBaseUrl();
