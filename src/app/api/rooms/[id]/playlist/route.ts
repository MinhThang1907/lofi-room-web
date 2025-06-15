import { type NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function GET(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const params = await context.params;
    const roomId = params.id;

    if (!ObjectId.isValid(roomId)) {
      return NextResponse.json({ error: "Invalid room ID" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db();

    // Lấy playlist của room
    const playlistItems = await db
      .collection("room_playlists")
      .find({ room_id: new ObjectId(roomId) })
      .sort({ play_order: 1 })
      .toArray();

    // Lấy thông tin chi tiết của từng track
    const trackIds = playlistItems.map((item) => item.track_id);
    const tracks = await db
      .collection("music_tracks")
      .find({ _id: { $in: trackIds } })
      .toArray();

    // Kết hợp thông tin
    const playlist = playlistItems.map((item) => {
      const track: any = tracks.find((t) => t._id.equals(item.track_id));
      return {
        id: track._id.toString(),
        title: track.title,
        artist: track.artist || "Unknown Artist",
        url: track.url,
        duration: track.duration || 180,
        genre: track.genre || "lofi",
        cover: track.cover_url || null,
        playOrder: item.play_order,
      };
    });

    return NextResponse.json({ playlist });
  } catch (error) {
    console.error("Get playlist error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const params = await context.params;
    const roomId = params.id;
    const { trackId } = await request.json();

    if (!ObjectId.isValid(roomId) || !ObjectId.isValid(trackId)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db();

    // Lấy order cao nhất hiện tại
    const lastItem = await db
      .collection("room_playlists")
      .findOne({ room_id: new ObjectId(roomId) }, { sort: { play_order: -1 } });

    const nextOrder = (lastItem?.play_order || 0) + 1;

    // Thêm track vào playlist
    await db.collection("room_playlists").insertOne({
      room_id: new ObjectId(roomId),
      track_id: new ObjectId(trackId),
      play_order: nextOrder,
      added_at: new Date(),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Add to playlist error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
