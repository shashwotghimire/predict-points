"use client";

import type React from "react";

import { createContext, useContext, useState, useEffect } from "react";

export interface User {
  id: string;
  email: string;
  name: string;
  profilePicture?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  updateProfile: (name: string, profilePicture?: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load user from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("predictpoints_user");
    if (stored) {
      setUser(JSON.parse(stored));
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    // Simple mock auth - in production, validate against backend
    const stored = localStorage.getItem("predictpoints_users");
    const users = stored ? JSON.parse(stored) : [];
    const foundUser = users.find(
      (u: any) => u.email === email && u.password === password
    );

    if (!foundUser) {
      throw new Error("Invalid email or password");
    }

    const userData: User = {
      id: foundUser.id,
      email: foundUser.email,
      name: foundUser.name,
      profilePicture: foundUser.profilePicture,
    };

    setUser(userData);
    localStorage.setItem("predictpoints_user", JSON.stringify(userData));
  };

  const register = async (email: string, password: string, name: string) => {
    const stored = localStorage.getItem("predictpoints_users");
    const users = stored ? JSON.parse(stored) : [];

    if (users.find((u: any) => u.email === email)) {
      throw new Error("Email already registered");
    }

    const newUser = {
      id: crypto.randomUUID(),
      email,
      password,
      name,
      profilePicture: undefined,
    };

    users.push(newUser);
    localStorage.setItem("predictpoints_users", JSON.stringify(users));

    const userData: User = {
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
    };

    setUser(userData);
    localStorage.setItem("predictpoints_user", JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("predictpoints_user");
  };

  const updateProfile = (name: string, profilePicture?: string) => {
    if (!user) return;

    const updated: User = {
      ...user,
      name,
      profilePicture,
    };

    setUser(updated);
    localStorage.setItem("predictpoints_user", JSON.stringify(updated));

    // Update in users list
    const stored = localStorage.getItem("predictpoints_users");
    const users = stored ? JSON.parse(stored) : [];
    const userIndex = users.findIndex((u: any) => u.id === user.id);
    if (userIndex !== -1) {
      users[userIndex].name = name;
      users[userIndex].profilePicture = profilePicture;
      localStorage.setItem("predictpoints_users", JSON.stringify(users));
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, isLoading, login, register, logout, updateProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
