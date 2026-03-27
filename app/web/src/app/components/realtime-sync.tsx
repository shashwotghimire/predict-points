"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { io } from "socket.io-client";
import { useAuth } from "@/app/contexts/auth-context";
import { apiOrigin } from "@/lib/api/config";
import type { RealtimeSyncPayload, RealtimeTopic } from "@/lib/realtime/types";

const shouldLogWs =
  process.env.NEXT_PUBLIC_WS_LOGS === "true" ||
  process.env.NODE_ENV !== "production";

function invalidateByTopic(
  topic: RealtimeTopic,
  payload: RealtimeSyncPayload,
  queryClient: ReturnType<typeof useQueryClient>,
) {
  if (topic === "markets") {
    void queryClient.invalidateQueries({ queryKey: ["markets"] });
    return;
  }

  if (topic === "market") {
    if (payload.marketId) {
      void queryClient.invalidateQueries({
        queryKey: ["market", payload.marketId],
      });
      return;
    }
    void queryClient.invalidateQueries({ queryKey: ["market"] });
    return;
  }

  if (topic === "activity") {
    void queryClient.invalidateQueries({ queryKey: ["activity"] });
    return;
  }

  if (topic === "leaderboard") {
    void queryClient.invalidateQueries({ queryKey: ["leaderboard"] });
    return;
  }

  if (topic === "user-points") {
    if (payload.userId) {
      void queryClient.invalidateQueries({
        queryKey: ["user-points", payload.userId],
      });
      return;
    }
    void queryClient.invalidateQueries({ queryKey: ["user-points"] });
    return;
  }

  if (topic === "user-predictions") {
    void queryClient.invalidateQueries({ queryKey: ["user-predictions"] });
    return;
  }

  if (topic === "user-rewards") {
    void queryClient.invalidateQueries({ queryKey: ["user-rewards"] });
    return;
  }

  if (topic === "rewards-catalog") {
    void queryClient.invalidateQueries({ queryKey: ["rewards-catalog"] });
    return;
  }

  if (topic === "admin-users") {
    void queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    return;
  }

  if (topic === "predictions") {
    void queryClient.invalidateQueries({ queryKey: ["predictions"] });
  }
}

export function RealtimeSync() {
  const queryClient = useQueryClient();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) {
      return;
    }

    if (shouldLogWs) {
      console.info("[ws] connecting", { origin: apiOrigin, path: "/ws" });
    }

    const socket = io(apiOrigin, {
      path: "/ws",
      withCredentials: true,
    });

    socket.on("connect", () => {
      if (!shouldLogWs) return;
      console.info("[ws] connected", {
        socketId: socket.id,
        transport: socket.io.engine.transport.name,
      });
    });

    socket.on("sync:ready", (payload: { timestamp?: string }) => {
      if (!shouldLogWs) return;
      console.info("[ws] rx sync:ready", payload);
    });

    socket.on("sync", (payload: RealtimeSyncPayload) => {
      if (shouldLogWs) {
        console.info("[ws] rx sync", payload);
      }

      if (!Array.isArray(payload?.topics)) return;

      for (const topic of payload.topics) {
        invalidateByTopic(topic, payload, queryClient);
      }
    });

    socket.on("disconnect", (reason) => {
      if (!shouldLogWs) return;
      console.info("[ws] disconnected", { reason });
    });

    socket.on("connect_error", (error) => {
      if (!shouldLogWs) return;
      console.error("[ws] connect_error", error);
    });

    return () => {
      if (shouldLogWs) {
        console.info("[ws] disconnecting", { socketId: socket.id });
      }
      socket.disconnect();
    };
  }, [isLoading, queryClient, user?.id, user?.role]);

  return null;
}
