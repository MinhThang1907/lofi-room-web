"use client";

import type React from "react";
import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Music,
  Users,
  MessageCircle,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Play,
  Pause,
  SkipForward,
  ArrowLeft,
  Send,
  Settings,
  Loader2,
  Wifi,
  WifiOff,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useSocket } from "@/hooks/useSocket";
import { fetchRoom } from "@/lib/api";
import { useChatScroll } from "@/hooks/useChatScroll";

interface User {
  id: string;
  name: string;
  avatar: string;
  position: { x: number; y: number };
  isMuted: boolean;
  isOwner?: boolean;
}

interface Message {
  id: string;
  userId: string;
  userName: string;
  content: string;
  timestamp: string;
}

interface RoomData {
  id: string;
  name: string;
  description: string;
  maxUsers: number;
  currentUsers: number;
  isPublic: boolean;
  tags: string[];
  currentTrack: string;
  backgroundTheme: string;
  owner: {
    id: string;
    name: string;
    avatar: string;
  };
  createdAt: string;
}

export default function RoomPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const {
    socket,
    isConnected,
    joinRoom,
    leaveRoom,
    sendMessage,
    toggleMute,
    moveUser,
  } = useSocket();

  const [room, setRoom] = useState<RoomData | null>(null);
  const [roomUsers, setRoomUsers] = useState<User[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isMuted, setIsMuted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [volume, setVolume] = useState(70);
  const [currentTrack, setCurrentTrack] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const hasJoinedRoom = useRef(false);
  const {
    chatContainerRef,
    messagesEndRef,
    hasNewMessage,
    isUserAtBottom,
    scrollToBottom,
    handleNewMessageClick,
  } = useChatScroll({
    messages,
    currentUserId: user?.id,
  });

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth/login");
      return;
    }

    if (user && params.id) {
      loadRoomData();
    }
  }, [user, authLoading, params.id, router]);

  useEffect(() => {
    if (socket && room && isConnected && !hasJoinedRoom.current) {
      console.log("Setting up socket listeners and joining room");
      hasJoinedRoom.current = true;

      // Join room via Socket.IO
      joinRoom(room.id);

      // Listen for socket events
      const handleRoomJoined = (data: any) => {
        console.log("Room joined event:", data);
        setRoomUsers(data.users || []);
        setCurrentTrack(data.currentTrack);
        setIsPlaying(data.isPlaying);
      };

      const handleUserJoined = (data: any) => {
        console.log("User joined event:", data.user);
        setRoomUsers((prev) => {
          // Check if user already exists
          const exists = prev.some((u) => u.id === data.user.id);
          if (exists) return prev;
          return [...prev, data.user];
        });
      };

      const handleUserLeft = (data: any) => {
        console.log("User left event:", data.userId);
        setRoomUsers((prev) => prev.filter((user) => user.id !== data.userId));
      };

      const handleNewMessage = (message: any) => {
        console.log("New message event:", message);
        setMessages((prev) => {
          // Check if message already exists
          const exists = prev.some((m) => m.id === message.id);
          if (exists) return prev;
          return [...prev, message];
        });
      };

      const handleUserMoved = (data: any) => {
        setRoomUsers((prev) =>
          prev.map((user) =>
            user.id === data.userId
              ? { ...user, position: data.position }
              : user
          )
        );
      };

      const handleUserMuteChanged = (data: any) => {
        setRoomUsers((prev) =>
          prev.map((user) =>
            user.id === data.userId ? { ...user, isMuted: data.isMuted } : user
          )
        );
      };

      const handleMusicStateChanged = (data: any) => {
        setCurrentTrack(data.currentTrack);
        setIsPlaying(data.isPlaying);
      };

      const handleError = (error: any) => {
        console.error("Socket error:", error);
        setError(error.message);
      };

      // Add event listeners
      socket.on("room-joined", handleRoomJoined);
      socket.on("user-joined", handleUserJoined);
      socket.on("user-left", handleUserLeft);
      socket.on("new-message", handleNewMessage);
      socket.on("user-moved", handleUserMoved);
      socket.on("user-mute-changed", handleUserMuteChanged);
      socket.on("music-state-changed", handleMusicStateChanged);
      socket.on("error", handleError);

      return () => {
        // Clean up socket listeners
        socket.off("room-joined", handleRoomJoined);
        socket.off("user-joined", handleUserJoined);
        socket.off("user-left", handleUserLeft);
        socket.off("new-message", handleNewMessage);
        socket.off("user-moved", handleUserMoved);
        socket.off("user-mute-changed", handleUserMuteChanged);
        socket.off("music-state-changed", handleMusicStateChanged);
        socket.off("error", handleError);

        hasJoinedRoom.current = false;
        leaveRoom();
      };
    }
  }, [socket, room, isConnected, joinRoom, leaveRoom]);

  // Thêm useEffect để theo dõi scroll position

  // Cập nhật useEffect cho messages
  useEffect(() => {
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];

      // Nếu tin nhắn mới không phải của user hiện tại và user không ở cuối
      if (lastMessage.userId !== user?.id && !isUserAtBottom) {
        // setHasNewMessage(true)
      } else {
        // Auto scroll nếu là tin nhắn của user hoặc user đang ở cuối
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "end",
            inline: "nearest",
          });
        }, 100);
      }
    }
  }, [messages, user?.id, isUserAtBottom]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({
        behavior: "smooth",
        block: "end",
        inline: "nearest",
      });
    }
  }, [messages]);

  const loadRoomData = async () => {
    try {
      setLoading(true);
      const data = await fetchRoom(params.id as string);
      setRoom(data.room);
      setMessages(data.messages || []);
      setCurrentTrack(data.room.currentTrack || "No music playing");
    } catch (error) {
      console.error("Error loading room:", error);
      setError("Không thể tải thông tin phòng");
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!newMessage.trim() || !room || !isConnected) return;

      console.log("Sending message via socket:", newMessage);
      sendMessage(room.id, newMessage);
      setNewMessage("");
    },
    [newMessage, room, isConnected, sendMessage]
  );

  const handleToggleMute = useCallback(() => {
    if (room && isConnected) {
      const newMutedState = !isMuted;
      setIsMuted(newMutedState);
      toggleMute(room.id, newMutedState);
    }
  }, [room, isConnected, isMuted, toggleMute]);

  const handleRoomClick = useCallback(
    (event: React.MouseEvent) => {
      if (event.target === event.currentTarget && user && room && isConnected) {
        const rect = event.currentTarget.getBoundingClientRect();
        const newPosition = {
          x: event.clientX - rect.left,
          y: event.clientY - rect.top,
        };

        // Update local state immediately for better UX
        setRoomUsers((prev) =>
          prev.map((u) =>
            u.id === user.id ? { ...u, position: newPosition } : u
          )
        );

        // Send to server
        moveUser(room.id, newPosition);
      }
    },
    [user, room, isConnected, moveUser]
  );

  if (authLoading || loading) {
    return (
      <div className="h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
        <span className="ml-2 text-gray-600">Đang tải phòng...</span>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (error || !room) {
    return (
      <div className="h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Không thể tải phòng
          </h2>
          <p className="text-gray-600 mb-4">{error || "Phòng không tồn tại"}</p>
          <Link href="/rooms">
            <Button>Quay lại danh sách phòng</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 flex flex-col">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 p-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Link href="/rooms">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Rời phòng
              </Button>
            </Link>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl font-bold text-gray-800">{room.name}</h1>
                {isConnected ? (
                  <span title="Đã kết nối real-time">
                    <Wifi className="h-4 w-4 text-green-500" />
                  </span>
                ) : (
                  <span title="Mất kết nối real-time">
                    <WifiOff className="h-4 w-4 text-red-500" />
                  </span>
                )}
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Users className="h-4 w-4" />
                <span>{roomUsers.length} người</span>
                {room.tags.map((tag) => (
                  <Badge key={tag} variant="outline">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          <Button variant="ghost" size="sm">
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </header>

      <div className="flex-1 flex">
        {/* Main Room Area */}
        <div className="flex-1 relative">
          {/* Room Background */}
          <div
            className="w-full h-full bg-gradient-to-b from-blue-100 to-green-100 relative overflow-hidden cursor-pointer"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fillRule='evenodd'%3E%3Cg fill='%23ffffff' fillOpacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}
            onClick={handleRoomClick}
          >
            {/* Room Decorations */}
            <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-green-200/50 to-transparent pointer-events-none"></div>

            {/* Users in Room */}
            {roomUsers.map((roomUser) => (
              <div
                key={roomUser.id}
                className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer"
                style={{
                  left: roomUser.position.x,
                  top: roomUser.position.y,
                }}
              >
                <div className="relative">
                  <Avatar className="h-12 w-12 border-2 border-white shadow-lg">
                    <AvatarImage src={roomUser.avatar || "/placeholder.svg"} />
                    <AvatarFallback>{roomUser.name[0]}</AvatarFallback>
                  </Avatar>

                  {/* Mute indicator */}
                  {roomUser.isMuted && (
                    <div className="absolute -top-1 -right-1 bg-red-500 rounded-full p-1">
                      <MicOff className="h-3 w-3 text-white" />
                    </div>
                  )}

                  {/* Owner crown */}
                  {roomUser.isOwner && (
                    <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                      <div className="text-yellow-500 text-lg">👑</div>
                    </div>
                  )}

                  {/* Current user indicator */}
                  {roomUser.id === user?.id && (
                    <div className="absolute -bottom-1 -right-1 bg-blue-500 rounded-full p-1">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                  )}

                  {/* Name tag */}
                  <div className="absolute top-14 left-1/2 transform -translate-x-1/2 bg-black/70 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                    {roomUser.name}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Music Player */}
          <div className="absolute bottom-4 left-4 right-4">
            <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg">
              <CardContent className="p-4">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setIsPlaying(!isPlaying)}
                    >
                      {isPlaying ? (
                        <Pause className="h-4 w-4" />
                      ) : (
                        <Play className="h-4 w-4" />
                      )}
                    </Button>
                    <Button size="sm" variant="ghost">
                      <SkipForward className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <Music className="h-4 w-4 text-purple-600" />
                      <span className="font-medium">{currentTrack}</span>
                    </div>
                    <div className="mt-1 bg-gray-200 rounded-full h-1">
                      <div className="bg-purple-600 h-1 rounded-full w-1/3"></div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setVolume(volume > 0 ? 0 : 70)}
                    >
                      {volume > 0 ? (
                        <Volume2 className="h-4 w-4" />
                      ) : (
                        <VolumeX className="h-4 w-4" />
                      )}
                    </Button>
                    <span className="text-sm text-gray-600 w-8">{volume}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Chat Sidebar */}
        <div className="w-80 bg-white/80 backdrop-blur-sm border-l border-gray-200 flex flex-col">
          {/* Chat Header */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <MessageCircle className="h-5 w-5 text-purple-600" />
                <h3 className="font-semibold">Chat</h3>
              </div>
              {isConnected ? (
                <Badge variant="default" className="text-xs">
                  Real-time
                </Badge>
              ) : (
                <Badge variant="destructive" className="text-xs">
                  Offline
                </Badge>
              )}
            </div>
          </div>

          {/* Messages */}
          <div
            ref={chatContainerRef}
            className="flex-1 overflow-y-auto p-4 space-y-3 scroll-smooth relative chat-scrollbar"
            style={{
              maxHeight: "calc(100vh - 280px)",
              scrollBehavior: "smooth",
            }}
          >
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <MessageCircle className="h-12 w-12 mb-2 opacity-50" />
                <p className="text-sm">Chưa có tin nhắn nào</p>
                <p className="text-xs">Hãy bắt đầu cuộc trò chuyện!</p>
              </div>
            ) : (
              <>
                {messages.map((message, index) => (
                  <div
                    key={message.id}
                    className={`flex space-x-2 message-enter ${
                      message.userId === user?.id
                        ? "flex-row-reverse space-x-reverse"
                        : ""
                    }`}
                  >
                    <Avatar className="h-8 w-8 flex-shrink-0">
                      <AvatarImage src="/placeholder.svg?height=32&width=32" />
                      <AvatarFallback
                        className={
                          message.userId === user?.id
                            ? "bg-blue-500 text-white"
                            : ""
                        }
                      >
                        {message.userName[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div
                      className={`flex-1 max-w-[80%] ${
                        message.userId === user?.id ? "text-right" : ""
                      }`}
                    >
                      <div
                        className={`flex items-center space-x-2 ${
                          message.userId === user?.id ? "justify-end" : ""
                        }`}
                      >
                        <span className="font-medium text-sm">
                          {message.userName}
                        </span>
                        <span className="text-xs text-gray-500">
                          {message.timestamp}
                        </span>
                      </div>
                      <div
                        className={`mt-1 p-2 rounded-lg text-sm ${
                          message.userId === user?.id
                            ? "bg-blue-500 text-white ml-auto"
                            : "bg-gray-100 text-gray-700"
                        }`}
                        style={{ wordBreak: "break-word" }}
                      >
                        {message.content}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} className="h-1" />
              </>
            )}
            {/* New message indicator */}
            {hasNewMessage && (
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10">
                <Button
                  size="sm"
                  variant="default"
                  className="bg-blue-500 hover:bg-blue-600 text-white shadow-lg pulse-blue"
                  onClick={handleNewMessageClick}
                >
                  <MessageCircle className="h-4 w-4 mr-1" />
                  Tin nhắn mới
                </Button>
              </div>
            )}
          </div>

          {/* Message Input */}
          <div className="p-4 border-t border-gray-200">
            <form onSubmit={handleSendMessage} className="flex space-x-2">
              <Input
                placeholder="Nhập tin nhắn..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                className="flex-1"
                disabled={!isConnected}
              />
              <Button
                type="submit"
                size="sm"
                disabled={!isConnected || !newMessage.trim()}
              >
                <Send className="h-4 w-4" />
              </Button>
            </form>

            {/* Voice Controls */}
            <div className="flex items-center justify-between mt-3">
              <Button
                variant={isMuted ? "destructive" : "default"}
                size="sm"
                onClick={handleToggleMute}
                disabled={!isConnected}
              >
                {isMuted ? (
                  <MicOff className="h-4 w-4" />
                ) : (
                  <Mic className="h-4 w-4" />
                )}
                {isMuted ? "Bật mic" : "Tắt mic"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
