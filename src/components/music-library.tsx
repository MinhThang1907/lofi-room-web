"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Music, Search, Plus, Play, Clock } from "lucide-react";
import { handleAddToPlaylist } from "./utils/handleMusic";

interface Track {
  id: string;
  title: string;
  artist: string;
  url: string;
  duration: number;
  genre: string;
  cover?: string;
}

interface MusicLibraryProps {
  roomId: string;
  onTrackSelect: (track: Track) => void;
  onAddToPlaylist: (trackId: string) => void;
  isOwner: boolean;
}

export function MusicLibrary({
  roomId,
  onTrackSelect,
  onAddToPlaylist,
  isOwner,
}: MusicLibraryProps) {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [filteredTracks, setFilteredTracks] = useState<Track[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedGenre, setSelectedGenre] = useState<string>("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTracks();
  }, []);

  useEffect(() => {
    filterTracks();
  }, [tracks, searchTerm, selectedGenre]);

  const loadTracks = async () => {
    try {
      const response = await fetch("/api/music/tracks");
      const data = await response.json();
      setTracks(data.tracks || []);
    } catch (error) {
      console.error("Error loading tracks:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterTracks = () => {
    let filtered = tracks;

    if (searchTerm) {
      filtered = filtered.filter(
        (track) =>
          track.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          track.artist.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedGenre !== "all") {
      filtered = filtered.filter((track) => track.genre === selectedGenre);
    }

    setFilteredTracks(filtered);
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const genres = [
    "all",
    ...Array.from(new Set(tracks.map((track) => track.genre))),
  ];

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Đang tải thư viện nhạc...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Music className="h-5 w-5" />
          <span>Thư viện nhạc</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Tìm kiếm bài hát, nghệ sĩ..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Genre Filter */}
        <Tabs value={selectedGenre} onValueChange={setSelectedGenre}>
          <TabsList className="grid w-full grid-cols-4">
            {genres.slice(0, 4).map((genre) => (
              <TabsTrigger key={genre} value={genre} className="text-xs">
                {genre === "all" ? "Tất cả" : genre}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {/* Track List */}
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {filteredTracks.length === 0 ? (
            <div className="text-center py-8">
              <Music className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Không tìm thấy bài hát nào</p>
            </div>
          ) : (
            filteredTracks.map((track) => (
              <div
                key={track.id}
                className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-gray-50 transition-colors"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-400 rounded-lg flex items-center justify-center">
                  {track.cover ? (
                    <img
                      src={track.cover || "/placeholder.svg"}
                      alt={track.title}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  ) : (
                    <Music className="h-6 w-6 text-white" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm truncate">
                    {track.title}
                  </h4>
                  <p className="text-xs text-gray-600 truncate">
                    {track.artist}
                  </p>
                  <div className="flex items-center space-x-2 mt-1">
                    <Badge variant="outline" className="text-xs">
                      {track.genre}
                    </Badge>
                    <div className="flex items-center text-xs text-gray-500">
                      <Clock className="h-3 w-3 mr-1" />
                      {formatTime(track.duration)}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {isOwner && (
                    <>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onTrackSelect(track)}
                        title="Phát ngay"
                      >
                        <Play className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          if (isOwner) {
                            handleAddToPlaylist(
                              track.id,
                              roomId,
                              onAddToPlaylist
                            );
                          }
                        }}
                        title="Thêm vào playlist"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
