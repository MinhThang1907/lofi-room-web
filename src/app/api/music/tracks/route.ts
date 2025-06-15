import { type NextRequest, NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"

export async function GET(request: NextRequest) {
  try {
    const client = await clientPromise
    const db = client.db()

    // Lấy danh sách tracks từ database
    const tracks = await db.collection("music_tracks").find({}).toArray()

    const formattedTracks = tracks.map((track) => ({
      id: track._id.toString(),
      title: track.title,
      artist: track.artist || "Unknown Artist",
      url: track.url,
      duration: track.duration || 180,
      genre: track.genre || "lofi",
      cover: track.cover_url || null,
    }))

    return NextResponse.json({ tracks: formattedTracks })
  } catch (error) {
    console.error("Get tracks error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
