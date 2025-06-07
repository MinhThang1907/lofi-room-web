"use client";

import type React from "react";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Music, Users, ArrowLeft, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { createRoom } from "@/lib/api";

export default function CreateRoomPage() {
  const [roomData, setRoomData] = useState({
    name: "",
    description: "",
    maxUsers: 20,
    isPublic: true,
    tags: [] as string[],
  });
  const [newTag, setNewTag] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth/login");
    }
  }, [user, authLoading, router]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setRoomData((prev) => ({
      ...prev,
      [name]: name === "maxUsers" ? Number.parseInt(value) || 1 : value,
    }));
  };

  const addTag = () => {
    if (
      newTag.trim() &&
      !roomData.tags.includes(newTag.trim()) &&
      roomData.tags.length < 5
    ) {
      setRoomData((prev) => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()],
      }));
      setNewTag("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setRoomData((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove),
    }));
  };

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!roomData.name.trim()) {
      setError("Tên phòng không được để trống");
      return;
    }

    if (roomData.maxUsers < 1 || roomData.maxUsers > 50) {
      setError("Số người tối đa phải từ 1 đến 50");
      return;
    }

    setIsLoading(true);

    try {
      const data = await createRoom(roomData);
      router.push(`/rooms/${data.roomId}`);
    } catch (error) {
      console.error("Create room error:", error);
      setError("Tạo phòng thất bại, vui lòng thử lại");
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading || !user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200">
        <div className="container mx-auto px-4 py-4 flex items-center space-x-4">
          <Link href="/rooms">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Quay lại
            </Button>
          </Link>
          <div className="flex items-center space-x-2">
            <Music className="h-6 w-6 text-purple-600" />
            <h1 className="text-xl font-bold text-gray-800">Tạo phòng mới</h1>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
          <CardHeader>
            <CardTitle>Thiết lập phòng của bạn</CardTitle>
            <CardDescription>
              Tạo một không gian thư giãn cho bạn và bạn bè
            </CardDescription>
          </CardHeader>

          <CardContent>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-6">
                {error}
              </div>
            )}

            <form onSubmit={handleCreateRoom} className="space-y-6">
              {/* Room Name */}
              <div className="space-y-2">
                <Label htmlFor="name">Tên phòng *</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="Ví dụ: Chill Study Session"
                  value={roomData.name}
                  onChange={handleInputChange}
                  required
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Mô tả</Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="Mô tả ngắn về phòng của bạn..."
                  value={roomData.description}
                  onChange={handleInputChange}
                  rows={3}
                />
              </div>

              {/* Max Users */}
              <div className="space-y-2">
                <Label htmlFor="maxUsers">Số người tối đa</Label>
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4 text-gray-400" />
                  <Input
                    id="maxUsers"
                    name="maxUsers"
                    type="number"
                    min="1"
                    max="50"
                    value={roomData.maxUsers}
                    onChange={handleInputChange}
                    className="w-24"
                  />
                  <span className="text-sm text-gray-600">người</span>
                </div>
              </div>

              {/* Public/Private */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Phòng công khai</Label>
                  <p className="text-sm text-gray-600">
                    Cho phép mọi người tìm thấy và tham gia phòng
                  </p>
                </div>
                <Switch
                  checked={roomData.isPublic}
                  onCheckedChange={(checked) =>
                    setRoomData((prev) => ({ ...prev, isPublic: checked }))
                  }
                />
              </div>

              {/* Tags */}
              <div className="space-y-2">
                <Label>Tags (tối đa 5)</Label>
                <div className="flex space-x-2">
                  <Input
                    placeholder="Thêm tag..."
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyPress={(e) =>
                      e.key === "Enter" && (e.preventDefault(), addTag())
                    }
                    disabled={roomData.tags.length >= 5}
                  />
                  <Button
                    type="button"
                    onClick={addTag}
                    disabled={roomData.tags.length >= 5}
                  >
                    Thêm
                  </Button>
                </div>

                {roomData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {roomData.tags.map((tag) => (
                      <Badge
                        key={tag}
                        variant="secondary"
                        className="flex items-center space-x-1"
                      >
                        <span>{tag}</span>
                        <button
                          type="button"
                          onClick={() => removeTag(tag)}
                          className="ml-1 hover:text-red-500"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full"
                disabled={isLoading || !roomData.name.trim()}
              >
                {isLoading ? "Đang tạo phòng..." : "Tạo phòng"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
