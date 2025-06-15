"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import {
  Music,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Volume2,
  VolumeX,
  Volume1,
  Shuffle,
  Repeat,
  List,
  Heart,
  MoreHorizontal,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
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

interface MusicPlayerProps {
  roomId: string;
  currentTrack: Track | null;
  playlist: Track[];
  isPlaying: boolean;
  setIsPlaying: (isPlaying: boolean) => void;
  volume: number;
  isOwner: boolean;
  onPlay: () => void;
  onPause: () => void;
  onNext: () => void;
  onPrevious: () => void;
  onVolumeChange: (volume: number) => void;
  onTrackSelect: (track: Track) => void;
  onPlaylistToggle: () => void;
  onAddToPlaylist: (trackId: string) => void;
  showPlaylist: boolean;
}

export function MusicPlayer({
  roomId,
  currentTrack,
  playlist,
  isPlaying,
  setIsPlaying,
  volume,
  isOwner,
  onPlay,
  onPause,
  onNext,
  onPrevious,
  onVolumeChange,
  onTrackSelect,
  onPlaylistToggle,
  onAddToPlaylist,
  showPlaylist,
}: MusicPlayerProps) {
  const [isStarted, setIsStarted] = useState(false);

  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isShuffle, setIsShuffle] = useState(false);
  const [repeatMode, setRepeatMode] = useState<"none" | "one" | "all">("none");
  const [isFavorite, setIsFavorite] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Audio event handlers
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadStart = () => setIsLoading(true);
    const handleCanPlay = () => setIsLoading(false);
    const handleLoadedMetadata = () => setDuration(audio.duration);
    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleEnded = () => {
      if (repeatMode === "one") {
        audio.currentTime = 0;
        audio.play();
      } else {
        onNext();
      }
    };

    audio.addEventListener("loadstart", handleLoadStart);
    audio.addEventListener("canplay", handleCanPlay);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("loadstart", handleLoadStart);
      audio.removeEventListener("canplay", handleCanPlay);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("ended", handleEnded);
    };
  }, [repeatMode, onNext]);

  // Sync audio with props
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying && isStarted) {
      audio.play().catch(console.error);
    } else {
      audio.pause();
    }
  }, [isPlaying]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentTrack) return;

    console.log("Current track changed:", currentTrack);
    if (isStarted) {
      if (isPlaying) {
        audio.play().catch(console.error);
      } else {
        setIsPlaying(true);
      }
      setCurrentTime(0);
      setDuration(currentTrack.duration);
      setIsLoading(false);
      setIsFavorite(false);
      setIsShuffle(false);
      setRepeatMode("none");
    }
  }, [currentTrack]);

  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.volume = volume / 100;
    }
  }, [volume]);

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const handleSeek = (value: number[]) => {
    const audio = audioRef.current;
    if (audio && isOwner) {
      audio.currentTime = value[0];
      setCurrentTime(value[0]);
    }
  };

  const getVolumeIcon = () => {
    if (volume === 0) return VolumeX;
    if (volume < 50) return Volume1;
    return Volume2;
  };

  const VolumeIcon = getVolumeIcon();

  return (
    <div className="space-y-4">
      {/* Hidden audio element */}
      {currentTrack && (
        <audio ref={audioRef} src={currentTrack.url} preload="metadata" />
      )}

      {/* Main Player */}
      {!isStarted ? (
        <>
          <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-4 text-center">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                Nhấn nút "Bắt đầu" để phát nhạc
              </h3>
              <Button
                size="lg"
                onClick={() => {
                  setIsStarted(true);
                  if (currentTrack) {
                    setIsPlaying(true);
                    setCurrentTime(0);
                    setDuration(currentTrack.duration);
                    audioRef.current?.play().catch(console.error);
                    setIsLoading(false);
                    setIsFavorite(false);
                    setIsShuffle(false);
                    setRepeatMode("none");
                  }
                }}
              >
                Bắt đầu
              </Button>
            </CardContent>
          </Card>
        </>
      ) : (
        <>
          <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-4">
              {currentTrack ? (
                <div className="space-y-4">
                  {/* Track Info */}
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-400 rounded-lg flex items-center justify-center">
                      {currentTrack.cover ? (
                        <img
                          src={currentTrack.cover || "/placeholder.svg"}
                          alt={currentTrack.title}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : (
                        <Music className="h-6 w-6 text-white" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-800 truncate">
                        {currentTrack.title}
                      </h3>
                      <p className="text-sm text-gray-600 truncate">
                        {currentTrack.artist}
                      </p>
                      <Badge variant="outline" className="text-xs mt-1">
                        {currentTrack.genre}
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setIsFavorite(!isFavorite)}
                        className={
                          isFavorite ? "text-red-500" : "text-gray-400"
                        }
                      >
                        <Heart
                          className={`h-4 w-4 ${
                            isFavorite ? "fill-current" : ""
                          }`}
                        />
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="sm" variant="ghost">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          {isOwner && (
                            <DropdownMenuItem
                              onClick={() => {
                                if (isOwner && currentTrack) {
                                  handleAddToPlaylist(
                                    currentTrack.id,
                                    roomId,
                                    onAddToPlaylist
                                  );
                                }
                              }}
                            >
                              Thêm vào playlist
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem>Chia sẻ</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem>Thông tin bài hát</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-2">
                    <Slider
                      value={[currentTime]}
                      max={duration || 100}
                      step={1}
                      onValueChange={handleSeek}
                      disabled={!isOwner || isLoading}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>{formatTime(currentTime)}</span>
                      <span>{formatTime(duration)}</span>
                    </div>
                  </div>

                  {/* Controls */}
                  <div className="flex items-center justify-between">
                    {/* Left controls */}
                    <div className="flex items-center space-x-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setIsShuffle(!isShuffle)}
                        className={
                          isShuffle ? "text-purple-600" : "text-gray-400"
                        }
                        disabled={!isOwner}
                      >
                        <Shuffle className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          const modes: Array<"none" | "one" | "all"> = [
                            "none",
                            "one",
                            "all",
                          ];
                          const currentIndex = modes.indexOf(repeatMode);
                          const nextMode =
                            modes[(currentIndex + 1) % modes.length];
                          setRepeatMode(nextMode);
                        }}
                        className={
                          repeatMode !== "none"
                            ? "text-purple-600"
                            : "text-gray-400"
                        }
                        disabled={!isOwner}
                      >
                        <Repeat className="h-4 w-4" />
                        {repeatMode === "one" && (
                          <span className="text-xs ml-1">1</span>
                        )}
                      </Button>
                    </div>

                    {/* Main controls */}
                    <div className="flex items-center space-x-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={onPrevious}
                        disabled={!isOwner || isLoading}
                      >
                        <SkipBack className="h-4 w-4" />
                      </Button>
                      <Button
                        size="lg"
                        onClick={isPlaying ? onPause : onPlay}
                        disabled={!isOwner || isLoading}
                        className="rounded-full w-12 h-12"
                      >
                        {isLoading ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : isPlaying ? (
                          <Pause className="h-5 w-5" />
                        ) : (
                          <Play className="h-5 w-5" />
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={onNext}
                        disabled={!isOwner || isLoading}
                      >
                        <SkipForward className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* Right controls */}
                    <div className="flex items-center space-x-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={onPlaylistToggle}
                      >
                        <List className="h-4 w-4" />
                      </Button>
                      <div className="flex items-center space-x-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onVolumeChange(volume > 0 ? 0 : 70)}
                        >
                          <VolumeIcon className="h-4 w-4" />
                        </Button>
                        <div className="w-20">
                          <Slider
                            value={[volume]}
                            max={100}
                            step={1}
                            onValueChange={(value) => onVolumeChange(value[0])}
                            className="w-full"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Owner indicator */}
                  {!isOwner && (
                    <div className="text-center">
                      <Badge variant="secondary" className="text-xs">
                        Chỉ chủ phòng mới có thể điều khiển nhạc
                      </Badge>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Music className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Chưa có bài hát nào được chọn</p>
                  {isOwner && (
                    <Button
                      size="sm"
                      className="mt-2"
                      onClick={onPlaylistToggle}
                    >
                      Chọn nhạc
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Playlist */}
          {showPlaylist && (
            <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold">
                    Playlist ({playlist.length} bài)
                  </h3>
                  <Button size="sm" variant="ghost" onClick={onPlaylistToggle}>
                    Đóng
                  </Button>
                </div>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {playlist.map((track, index) => (
                    <div
                      key={track.id}
                      className={`flex items-center space-x-3 p-2 rounded-lg cursor-pointer transition-colors ${
                        currentTrack?.id === track.id
                          ? "bg-purple-100 border border-purple-200"
                          : "hover:bg-gray-100"
                      }`}
                      onClick={() => isOwner && onTrackSelect(track)}
                    >
                      <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-pink-400 rounded flex items-center justify-center text-white text-xs font-semibold">
                        {currentTrack?.id === track.id && isPlaying ? (
                          <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          index + 1
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">
                          {track.title}
                        </p>
                        <p className="text-xs text-gray-600 truncate">
                          {track.artist}
                        </p>
                      </div>
                      <div className="text-xs text-gray-500">
                        {formatTime(track.duration)}
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {track.genre}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
