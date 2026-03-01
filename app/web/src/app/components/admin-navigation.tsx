"use client";

import { LogOut, Search, Settings } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
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

interface AdminNavigationProps {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
}

export default function AdminNavigation({
  searchTerm,
  setSearchTerm,
}: AdminNavigationProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const isAdmin = user?.role === "ADMIN" || user?.role === "SUPER_ADMIN";

  const initials =
    user?.name
      ?.split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase() || "A";

  const handleLogout = () => {
    logout();
    router.push("/admin/login");
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur supports-backdrop-filter:bg-card/85">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex min-h-16 items-center justify-between gap-3 py-3">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded bg-primary text-sm font-bold text-primary-foreground">
              PP
            </div>
            <div>
              <p className="text-base font-semibold sm:text-lg">PredictPoints</p>
              <p className="text-[11px] text-muted-foreground">Admin Panel</p>
            </div>
          </div>

          <div className="relative hidden w-full max-w-md md:flex">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search markets or users"
              className="pl-9"
            />
          </div>

          {isAdmin ? (
            <div className="hidden items-center gap-2 md:flex">
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

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-10 w-10 rounded-full p-0">
                {user?.profilePicture ? (
                  <img
                    src={user.profilePicture || "/placeholder.svg"}
                    alt={user.name}
                    className="h-10 w-10 rounded-full border border-border object-cover"
                  />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-linear-to-br from-primary to-accent text-sm font-bold text-white">
                    {initials}
                  </div>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="space-y-1 px-2 py-1.5">
                <p className="text-sm font-semibold">{user?.name}</p>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
                <Badge variant="default">{user?.role}</Badge>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push("/settings")} className="gap-2">
                <Settings className="h-4 w-4" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleLogout} className="gap-2 text-destructive">
                <LogOut className="h-4 w-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  );
}
