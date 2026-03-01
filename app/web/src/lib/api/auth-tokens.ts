let accessToken: string | null = null;
let refreshToken: string | null = null;
const ACCESS_KEY = "pp_access_token";
const REFRESH_KEY = "pp_refresh_token";

function canUseStorage() {
  return typeof window !== "undefined" && Boolean(window.sessionStorage);
}

function hydrateFromStorage() {
  if (!canUseStorage()) return;
  if (!accessToken) {
    accessToken = window.sessionStorage.getItem(ACCESS_KEY);
  }
  if (!refreshToken) {
    refreshToken = window.sessionStorage.getItem(REFRESH_KEY);
  }
}

export function setAuthTokens(tokens: {
  accessToken?: string | null;
  refreshToken?: string | null;
}) {
  hydrateFromStorage();
  if (typeof tokens.accessToken !== "undefined") {
    accessToken = tokens.accessToken;
    if (canUseStorage()) {
      if (accessToken) window.sessionStorage.setItem(ACCESS_KEY, accessToken);
      else window.sessionStorage.removeItem(ACCESS_KEY);
    }
  }

  if (typeof tokens.refreshToken !== "undefined") {
    refreshToken = tokens.refreshToken;
    if (canUseStorage()) {
      if (refreshToken) window.sessionStorage.setItem(REFRESH_KEY, refreshToken);
      else window.sessionStorage.removeItem(REFRESH_KEY);
    }
  }
}

export function getAccessToken() {
  hydrateFromStorage();
  return accessToken;
}

export function getRefreshToken() {
  hydrateFromStorage();
  return refreshToken;
}

export function clearAuthTokens() {
  accessToken = null;
  refreshToken = null;
  if (canUseStorage()) {
    window.sessionStorage.removeItem(ACCESS_KEY);
    window.sessionStorage.removeItem(REFRESH_KEY);
  }
}
