"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { io, type Socket } from "socket.io-client";
import { useAuth } from "./useAuth";

interface UseSocketReturn {
  socket: Socket | null;
  isConnected: boolean;
  joinRoom: (roomId: string) => void;
  leaveRoom: () => void;
  sendMessage: (roomId: string, message: string) => void;
  toggleMute: (roomId: string, isMuted: boolean) => void;
  moveUser: (roomId: string, position: { x: number; y: number }) => void;
}

export function useSocket(): UseSocketReturn {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const { user } = useAuth();
  const socketRef = useRef<Socket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const cleanup = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (socketRef.current) {
      socketRef.current.removeAllListeners();
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    setSocket(null);
    setIsConnected(false);
  }, []);

  const connect = useCallback(() => {
    if (!user || socketRef.current) return;

    const token = localStorage.getItem("token");
    if (!token) return;

    console.log("Connecting to Socket.IO server...");

    const newSocket = io(process.env.NEXT_PUBLIC_SOCKET_URL, {
      auth: { token },
      transports: ["websocket", "polling"],
      forceNew: true,
      // Xóa path configuration
    });

    newSocket.on("connect", () => {
      console.log("Connected to Socket.IO server");
      setIsConnected(true);
    });

    newSocket.on("disconnect", (reason) => {
      console.log("Disconnected from Socket.IO server:", reason);
      setIsConnected(false);

      // Auto-reconnect after 3 seconds if not manual disconnect
      if (reason !== "io client disconnect") {
        reconnectTimeoutRef.current = setTimeout(() => {
          if (!socketRef.current || !socketRef.current.connected) {
            console.log("Attempting to reconnect...");
            newSocket.connect();
          }
        }, 3000);
      }
    });

    newSocket.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
      setIsConnected(false);
    });

    socketRef.current = newSocket;
    setSocket(newSocket);
  }, [user]);

  useEffect(() => {
    if (user) {
      connect();
    } else {
      cleanup();
    }

    return cleanup;
  }, [user, connect, cleanup]);

  const joinRoom = useCallback((roomId: string) => {
    if (socketRef.current && socketRef.current.connected) {
      console.log("Joining room:", roomId);
      socketRef.current.emit("join-room", { roomId });
    }
  }, []);

  const leaveRoom = useCallback(() => {
    if (socketRef.current && socketRef.current.connected) {
      console.log("Leaving room");
      socketRef.current.emit("leave-room");
    }
  }, []);

  const sendMessage = useCallback((roomId: string, message: string) => {
    if (socketRef.current && socketRef.current.connected) {
      console.log("Sending message:", message);
      socketRef.current.emit("send-message", { roomId, message });
    }
  }, []);

  const toggleMute = useCallback((roomId: string, isMuted: boolean) => {
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit("toggle-mute", { roomId, isMuted });
    }
  }, []);

  const moveUser = useCallback(
    (roomId: string, position: { x: number; y: number }) => {
      if (socketRef.current && socketRef.current.connected) {
        socketRef.current.emit("user-move", { roomId, position });
      }
    },
    []
  );

  return {
    socket,
    isConnected,
    joinRoom,
    leaveRoom,
    sendMessage,
    toggleMute,
    moveUser,
  };
}
