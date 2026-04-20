"use client";

import type React from "react";

import { createContext, useContext, useMemo, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { apiOrigin } from "@/lib/api/config";

export type UserRole = "ADMIN" | "USER" | "SUPER_ADMIN" | "MODERATOR";

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  profilePicture?: string;
}

interface AuthApiResponse {
  user: User;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (email: string, password: string, name: string) => Promise<User>;
  startGoogleLogin: () => void;
  logout: () => Promise<void>;
  updateProfile: (name: string, profilePicture?: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const subscribe = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const pathname = usePathname();
  const isClient = useSyncExternalStore(
    subscribe,
    getClientSnapshot,
    getServerSnapshot
  );
  const isPublicRoute =
    pathname === "/" ||
    pathname === "/landing" ||
    pathname === "/login" ||
    pathname === "/admin/login" ||
    pathname === "/auth/callback" ||
    pathname === "/register";

  const meQuery = useQuery({
    queryKey: ["auth", "me"],
    enabled: isClient,
    retry: false,
    queryFn: async () => {
      try {
        const { data } = await api.get("/auth/me");
        return data as User;
      } catch {
        if (isPublicRoute) {
          return null;
        }

        try {
          await api.post("/auth/refresh");
          const { data } = await api.get("/auth/me");
          return data as User;
        } catch {
          return null;
        }
      }
    },
  });

  const authMutation = useMutation({
    mutationFn: async (
      payload:
        | { mode: "login"; email: string; password: string }
        | { mode: "register"; email: string; password: string; name: string }
    ) => {
      if (payload.mode === "login") {
        const { data } = await api.post("/auth/login", {
          email: payload.email,
          password: payload.password,
        });
        return data as AuthApiResponse;
      }

      const { data } = await api.post("/auth/register", {
        email: payload.email,
        password: payload.password,
        name: payload.name,
      });
      return data as AuthApiResponse;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["auth", "me"], data.user);
    },
  });

  const login = async (email: string, password: string) => {
    const result = await authMutation.mutateAsync({ mode: "login", email, password });
    return result.user;
  };

  const register = async (email: string, password: string, name: string) => {
    const result = await authMutation.mutateAsync({ mode: "register", email, password, name });
    return result.user;
  };

  const startGoogleLogin = () => {
    window.location.href = `${apiOrigin}/api/v1/auth/google/start`;
  };

  const logout = async () => {
    try {
      await api.post("/auth/logout");
    } finally {
      queryClient.setQueryData(["auth", "me"], null);
      queryClient.invalidateQueries({ queryKey: ["auth"] });
    }
  };

  const updateProfile = (name: string, profilePicture?: string) => {
    const current = meQuery.data;
    if (!current) return;
    queryClient.setQueryData(["auth", "me"], {
      ...current,
      name,
      profilePicture,
    });
  };

  const value = useMemo(
    () => ({
      user: meQuery.data ?? null,
      isLoading: !isClient || meQuery.isLoading || authMutation.isPending,
      login,
      register,
      startGoogleLogin,
      logout,
      updateProfile,
    }),
    [isClient, meQuery.data, meQuery.isLoading, authMutation.isPending]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
