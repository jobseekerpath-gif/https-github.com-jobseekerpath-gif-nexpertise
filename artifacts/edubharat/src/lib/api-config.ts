export const CLOUD_RUN_BACKEND_URL = "https://ais-dev-koiapvrmz3v6zvdsll5pvu-313361691370.asia-east1.run.app";

export function getApiBaseUrl(): string {
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL.replace(/\/$/, "");
  }
  if (typeof window !== "undefined") {
    const hostname = window.location.hostname;
    // If running on Firebase Hosting (*.web.app or *.firebaseapp.com) or external custom domain static host,
    // route API calls directly to the Cloud Run backend server.
    if (hostname.includes("web.app") || hostname.includes("firebaseapp.com")) {
      return CLOUD_RUN_BACKEND_URL;
    }
  }
  return (import.meta.env.BASE_URL ?? "/").replace(/\/$/, "");
}

export const BASE_API_URL = getApiBaseUrl();
