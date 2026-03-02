const rawApiBase =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:3001";

export const apiOrigin = rawApiBase
  .replace(/\/$/, "")
  .replace(/\/api\/v1$/, "");

export const apiBaseUrl = `${apiOrigin}/api/v1`;
