"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Music, Users, MessageCircle, Play, Pause } from "lucide-react";
import Link from "next/link";

export default function LandingPage() {
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50">
      {/* Header */}
      <header className="container mx-auto px-4 py-6 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <Music className="h-8 w-8 text-purple-600" />
          <h1 className="text-2xl font-bold text-gray-800">Lofi Room</h1>
        </div>
        <div className="space-x-4">
          <Link href="/auth/login">
            <Button variant="outline">Đăng nhập</Button>
          </Link>
          <Link href="/auth/register">
            <Button>Đăng ký</Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h2 className="text-5xl font-bold text-gray-800 mb-6">
          Không gian âm nhạc thư giãn
          <br />
          <span className="text-purple-600">kết nối con người</span>
        </h2>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          Thoát khỏi sự ồn ào của mạng xã hội. Tìm thấy sự tập trung và những
          kết nối đồng điệu trong không gian ảo thẩm mỹ với âm nhạc Lofi.
        </p>

        {/* Demo Music Player */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 max-w-md mx-auto mb-8 shadow-lg">
          <div className="flex items-center space-x-4">
            <Button
              size="lg"
              onClick={() => setIsPlaying(!isPlaying)}
              className="rounded-full w-16 h-16"
            >
              {isPlaying ? (
                <Pause className="h-6 w-6" />
              ) : (
                <Play className="h-6 w-6" />
              )}
            </Button>
            <div className="flex-1">
              <p className="font-semibold text-gray-800">Chill Lofi Beats</p>
              <p className="text-sm text-gray-600">Relaxing Study Music</p>
            </div>
          </div>
          <div className="mt-4 bg-gray-200 rounded-full h-2">
            <div className="bg-purple-600 h-2 rounded-full w-1/3"></div>
          </div>
        </div>

        <Link href="/rooms">
          <Button size="lg" className="text-lg px-8 py-4">
            Khám phá ngay
          </Button>
        </Link>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-20">
        <h3 className="text-3xl font-bold text-center text-gray-800 mb-12">
          Tính năng nổi bật
        </h3>
        <div className="grid md:grid-cols-3 gap-8">
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader>
              <Users className="h-12 w-12 text-purple-600 mb-4" />
              <CardTitle>Phòng ảo tương tác</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-base">
                Tạo hoặc tham gia các phòng ảo với avatar 2D, tương tác với bạn
                bè trong không gian thẩm mỹ.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader>
              <MessageCircle className="h-12 w-12 text-purple-600 mb-4" />
              <CardTitle>Chat & Voice</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-base">
                Trò chuyện qua text hoặc voice chat trong thời gian thực, chia
                sẻ cảm xúc và kết nối sâu sắc.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader>
              <Music className="h-12 w-12 text-purple-600 mb-4" />
              <CardTitle>Nhạc Lofi chất lượng</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-base">
                Thưởng thức các đài nhạc Lofi được tuyển chọn, hỗ trợ học tập và
                làm việc hiệu quả.
              </CardDescription>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="bg-purple-600 rounded-3xl p-12 text-white">
          <h3 className="text-3xl font-bold mb-4">
            Sẵn sàng tham gia cộng đồng?
          </h3>
          <p className="text-xl mb-8 opacity-90">
            Hàng trăm người đang chờ bạn trong các phòng Lofi
          </p>
          <Link href="/auth/register">
            <Button size="lg" variant="secondary" className="text-lg px-8 py-4">
              Tạo tài khoản miễn phí
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 text-center text-gray-600">
        <p>&copy; 2025 Lofi Room. Tất cả quyền được bảo lưu.</p>
      </footer>
    </div>
  );
}
