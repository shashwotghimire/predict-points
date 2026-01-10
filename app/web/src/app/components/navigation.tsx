"use client";

import { useRouter } from "next/navigation";
import { TrendingUp, Users, Gift, LogOut, Settings } from "lucide-react";
import { useAuth } from "../contexts/auth-context";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface NavigationProps {
  currentPage: "predictions" | "leaderboard" | "rewards";
  setCurrentPage: (page: "predictions" | "leaderboard" | "rewards") => void;
  userPoints: number;
}

export default function Navigation({
  currentPage,
  setCurrentPage,
  userPoints,
}: NavigationProps) {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const handleSettingsClick = () => {
    router.push("/settings");
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
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-8 h-8 rounded bg-primary text-primary-foreground font-bold text-sm">
              PP
            </div>
            <span className="font-semibold text-lg hidden sm:inline">
              PredictPoints
            </span>
          </div>

          <div className="flex items-center gap-1 sm:gap-2">
            <Button
              variant={currentPage === "predictions" ? "default" : "ghost"}
              size="sm"
              onClick={() => setCurrentPage("predictions")}
              className="gap-2"
            >
              <TrendingUp className="w-4 h-4" />
              <span className="hidden sm:inline">Predictions</span>
            </Button>
            <Button
              variant={currentPage === "leaderboard" ? "default" : "ghost"}
              size="sm"
              onClick={() => setCurrentPage("leaderboard")}
              className="gap-2"
            >
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Leaderboard</span>
            </Button>
            <Button
              variant={currentPage === "rewards" ? "default" : "ghost"}
              size="sm"
              onClick={() => setCurrentPage("rewards")}
              className="gap-2"
            >
              <Gift className="w-4 h-4" />
              <span className="hidden sm:inline">Rewards</span>
            </Button>
          </div>

          <div className="flex items-center gap-4 ml-4">
            <div className="text-right hidden sm:block">
              <p className="text-xs text-muted-foreground">Your Points</p>
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
                <div className="px-2 py-1.5">
                  <p className="font-semibold text-sm">{user?.name}</p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuSeparator />
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleSettingsClick}
                  className="gap-2 cursor-pointer"
                >
                  <Settings className="w-4 h-4" />
                  Account Settings
                </DropdownMenuItem>
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
    </nav>
  );
}
