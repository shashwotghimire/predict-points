import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import {
  clearAuthTokens,
  getAccessToken,
  getRefreshToken,
  setAuthTokens,
} from "@/lib/api/auth-tokens";

const rawBase =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:3001";

const baseURL = `${rawBase.replace(/\/$/, "")}/api/v1`;

type RetriableRequestConfig = InternalAxiosRequestConfig & { _retry?: boolean };

let refreshPromise: Promise<string | null> | null = null;

const createRefreshPromise = async () => {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;

  try {
    const { data } = await api.post(
      "/auth/refresh",
      { refreshToken },
      {
        params: { transport: "body" },
        headers: { "x-auth-transport": "body" },
      },
    );

    const nextAccess = data?.accessToken as string | undefined;
    const nextRefresh = data?.refreshToken as string | undefined;

    if (!nextAccess || !nextRefresh) {
      clearAuthTokens();
      return null;
    }

    setAuthTokens({ accessToken: nextAccess, refreshToken: nextRefresh });
    return nextAccess;
  } catch {
    clearAuthTokens();
    return null;
  }
};

export const api = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const accessToken = getAccessToken();
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
    config.headers["x-auth-transport"] = "body";
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetriableRequestConfig | undefined;
    if (!originalRequest || error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    if ((originalRequest.url || "").includes("/auth/refresh")) {
      clearAuthTokens();
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    if (!refreshPromise) {
      refreshPromise = createRefreshPromise().finally(() => {
        refreshPromise = null;
      });
    }

    const nextAccess = await refreshPromise;
    if (!nextAccess) {
      return Promise.reject(error);
    }

    originalRequest.headers = originalRequest.headers || {};
    originalRequest.headers.Authorization = `Bearer ${nextAccess}`;
    originalRequest.headers["x-auth-transport"] = "body";
    return api(originalRequest);
  },
);

export { setAuthTokens, clearAuthTokens };
