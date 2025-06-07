"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Music, Plus, Search, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { fetchRooms } from "@/lib/api";

interface Room {
  id: string;
  name: string;
  description: string;
  currentUsers: number;
  maxUsers: number;
  isPublic: boolean;
  tags: string[];
  owner: {
    name: string;
    avatar: string;
  };
  currentTrack: string;
  createdAt: string;
}

export default function RoomsPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth/login");
      return;
    }

    if (user) {
      loadRooms();
    }
  }, [user, authLoading, router]);

  const loadRooms = async () => {
    try {
      setLoading(true);
      const data = await fetchRooms();
      setRooms(data.rooms || []);
    } catch (error) {
      console.error("Error loading rooms:", error);
      setError("Không thể tải danh sách phòng");
    } finally {
      setLoading(false);
    }
  };

  const filteredRooms = rooms.filter(
    (room) =>
      room.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      room.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      room.tags.some((tag) =>
        tag.toLowerCase().includes(searchTerm.toLowerCase())
      )
  );

  const handleCreateRoom = () => {
    router.push("/rooms/create");
  };

  const handleJoinRoom = (roomId: string) => {
    router.push(`/rooms/${roomId}`);
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="flex items-center space-x-2">
            <Music className="h-8 w-8 text-purple-600" />
            <h1 className="text-2xl font-bold text-gray-800">Lofi Room</h1>
          </Link>

          <div className="flex items-center space-x-4">
            <span className="text-gray-600">Xin chào, {user.name}</span>
            <Avatar>
              <AvatarImage src={user.avatar || "/placeholder.svg"} />
              <AvatarFallback>{user.name[0]}</AvatarFallback>
            </Avatar>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Search and Create */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Tìm kiếm phòng..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-white/80 backdrop-blur-sm"
            />
          </div>
          <Button
            onClick={handleCreateRoom}
            className="flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Tạo phòng mới</span>
          </Button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-6">
            {error}
            <Button
              variant="outline"
              size="sm"
              onClick={loadRooms}
              className="ml-4"
            >
              Thử lại
            </Button>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
            <span className="ml-2 text-gray-600">
              Đang tải danh sách phòng...
            </span>
          </div>
        )}

        {/* Rooms Grid */}
        {!loading && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRooms.map((room) => (
              <Card
                key={room.id}
                className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-shadow"
              >
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-lg mb-2">
                        {room.name}
                      </CardTitle>
                      <CardDescription className="text-sm">
                        {room.description}
                      </CardDescription>
                    </div>
                    <Badge variant="secondary" className="ml-2">
                      {room.currentUsers}/{room.maxUsers}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Current Track */}
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Music className="h-4 w-4" />
                    <span>{room.currentTrack}</span>
                  </div>

                  {/* Owner */}
                  <div className="flex items-center space-x-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage
                        src={room.owner.avatar || "/placeholder.svg"}
                      />
                      <AvatarFallback>{room.owner.name[0]}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm text-gray-600">
                      {room.owner.name}
                    </span>
                    <span className="text-xs text-gray-400">
                      • {room.createdAt}
                    </span>
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1">
                    {room.tags.map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>

                  {/* Join Button */}
                  <Button
                    className="w-full"
                    onClick={() => handleJoinRoom(room.id)}
                    disabled={room.currentUsers >= room.maxUsers}
                  >
                    {room.currentUsers >= room.maxUsers
                      ? "Phòng đầy"
                      : "Tham gia"}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredRooms.length === 0 && !error && (
          <div className="text-center py-12">
            <Music className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">
              {searchTerm ? "Không tìm thấy phòng nào" : "Chưa có phòng nào"}
            </h3>
            <p className="text-gray-500 mb-4">
              {searchTerm
                ? "Hãy thử tìm kiếm với từ khóa khác hoặc tạo phòng mới"
                : "Hãy tạo phòng đầu tiên để bắt đầu"}
            </p>
            <Button onClick={handleCreateRoom}>
              {searchTerm ? "Tạo phòng mới" : "Tạo phòng đầu tiên"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
