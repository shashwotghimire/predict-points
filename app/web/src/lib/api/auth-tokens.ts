let accessToken: string | null = null;
let refreshToken: string | null = null;

export function setAuthTokens(tokens: {
  accessToken?: string | null;
  refreshToken?: string | null;
}) {
  if (typeof tokens.accessToken !== "undefined") {
    accessToken = tokens.accessToken;
  }

  if (typeof tokens.refreshToken !== "undefined") {
    refreshToken = tokens.refreshToken;
  }
}

export function getAccessToken() {
  return accessToken;
}

export function getRefreshToken() {
  return refreshToken;
}

export function clearAuthTokens() {
  accessToken = null;
  refreshToken = null;
}
