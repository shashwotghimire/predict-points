"use client";

import { usePathname, useRouter } from "next/navigation";
import {
  Activity,
  ShieldCheck,
  Gift,
  Landmark,
  LogOut,
  Search,
  Settings,
  TrendingUp,
  Trophy,
} from "lucide-react";
import { useAuth } from "../contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

interface NavigationProps {
  currentPage: "predictions" | "activity" | "leaderboard" | "rewards";
  setCurrentPage: (
    page: "predictions" | "activity" | "leaderboard" | "rewards"
  ) => void;
  userPoints: number;
  selectedCategory: "trending" | "politics" | "sports";
  setSelectedCategory: (category: "trending" | "politics" | "sports") => void;
  searchTerm: string;
  setSearchTerm: (value: string) => void;
}

export default function Navigation({
  currentPage,
  setCurrentPage,
  userPoints,
  selectedCategory,
  setSelectedCategory,
  searchTerm,
  setSearchTerm,
}: NavigationProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const router = useRouter();
  const isAdmin = user?.role === "ADMIN" || user?.role === "SUPER_ADMIN";

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const initials =
    user?.name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase() || "U";

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur supports-backdrop-filter:bg-card/85">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex min-h-16 items-center justify-between gap-3 py-3">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center h-9 w-9 rounded bg-primary text-primary-foreground font-bold text-sm">
              PP
            </div>
            <div>
              <p className="font-semibold text-base sm:text-lg">PredictPoints</p>
              <p className="text-[11px] text-muted-foreground">Points market</p>
            </div>
          </div>

          <div className="hidden md:flex max-w-md w-full relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search events"
              className="pl-9"
            />
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            {isAdmin ? (
              <div className="hidden items-center gap-2 lg:flex">
                <Button
                  variant={pathname.startsWith("/dashboard") ? "default" : "outline"}
                  size="sm"
                  onClick={() => router.push("/dashboard")}
                >
                  Dashboard
                </Button>
                <Button
                  variant={pathname.startsWith("/admin") ? "default" : "outline"}
                  size="sm"
                  onClick={() => router.push("/admin")}
                >
                  Admin Panel
                </Button>
              </div>
            ) : null}

            <div className="text-right hidden sm:block">
              <p className="text-xs text-muted-foreground">Total Points</p>
              <p className="text-lg font-semibold text-primary">
                {userPoints.toLocaleString()}
              </p>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="rounded-full h-10 w-10 p-0"
                >
                  {user?.profilePicture ? (
                    <img
                      src={user.profilePicture || "/placeholder.svg"}
                      alt={user.name}
                      className="h-10 w-10 rounded-full object-cover border border-border"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-linear-to-br from-primary to-accent flex items-center justify-center text-white font-bold text-sm">
                      {initials}
                    </div>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-2 py-1.5 space-y-1">
                  <p className="font-semibold text-sm">{user?.name}</p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                  <Badge variant={user?.role === "ADMIN" ? "default" : "secondary"}>
                    {user?.role}
                  </Badge>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => router.push("/settings")}
                  className="gap-2 cursor-pointer"
                >
                  <Settings className="w-4 h-4" />
                  Profile
                </DropdownMenuItem>
                {isAdmin ? (
                  <DropdownMenuItem
                    onClick={() => router.push("/admin")}
                    className="gap-2 cursor-pointer"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    Admin Panel
                  </DropdownMenuItem>
                ) : null}
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="gap-2 cursor-pointer text-destructive"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      <div className="w-full border-t border-border" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-center gap-4 py-3">
          <div className="flex items-center gap-2">
            <Button
              variant={
                currentPage === "predictions" && selectedCategory === "trending"
                  ? "default"
                  : "ghost"
              }
              size="sm"
              onClick={() => {
                setCurrentPage("predictions");
                setSelectedCategory("trending");
              }}
              className="gap-2"
            >
              <TrendingUp className="h-4 w-4" /> Trending
            </Button>
            <Button
              variant={
                currentPage === "predictions" && selectedCategory === "politics"
                  ? "default"
                  : "ghost"
              }
              size="sm"
              onClick={() => {
                setCurrentPage("predictions");
                setSelectedCategory("politics");
              }}
              className="gap-2"
            >
              <Landmark className="h-4 w-4" /> Politics
            </Button>
            <Button
              variant={
                currentPage === "predictions" && selectedCategory === "sports"
                  ? "default"
                  : "ghost"
              }
              size="sm"
              onClick={() => {
                setCurrentPage("predictions");
                setSelectedCategory("sports");
              }}
              className="gap-2"
            >
              <Trophy className="h-4 w-4" /> Sports
            </Button>
          </div>

          <div className="h-7 w-px bg-border" />

          <div className="flex items-center gap-2">
            <Button
              variant={currentPage === "activity" ? "default" : "ghost"}
              size="sm"
              onClick={() => setCurrentPage("activity")}
              className="gap-2"
            >
              <Activity className="h-4 w-4" /> Activity
            </Button>
            <Button
              variant={currentPage === "rewards" ? "default" : "ghost"}
              size="sm"
              onClick={() => setCurrentPage("rewards")}
              className="gap-2"
            >
              <Gift className="h-4 w-4" /> Rewards
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}
