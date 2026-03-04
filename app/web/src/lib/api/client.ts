import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { clearAuthTokens, setAuthTokens } from "@/lib/api/auth-tokens";
import { apiBaseUrl } from "@/lib/api/config";

type RetriableRequestConfig = InternalAxiosRequestConfig & { _retry?: boolean };

let refreshPromise: Promise<boolean> | null = null;

const createRefreshPromise = async () => {
  try {
    const { data } = await api.post("/auth/refresh");
    if (data?.accessToken || data?.refreshToken) {
      setAuthTokens({
        accessToken: (data?.accessToken as string | undefined) ?? null,
        refreshToken: (data?.refreshToken as string | undefined) ?? null,
      });
    }
    return true;
  } catch {
    clearAuthTokens();
    return false;
  }
};

export const api = axios.create({
  baseURL: apiBaseUrl,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetriableRequestConfig | undefined;
    if (
      !originalRequest ||
      error.response?.status !== 401 ||
      originalRequest._retry
    ) {
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

    const refreshed = await refreshPromise;
    if (!refreshed) {
      return Promise.reject(error);
    }

    return api(originalRequest);
  },
);

export { setAuthTokens, clearAuthTokens };
