import { type NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId, UUID } from "mongodb";
import { randomUUID } from "crypto";

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

    // Lấy thông tin phòng
    const room = await db
      .collection("rooms")
      .findOne({ _id: new ObjectId(roomId) });

    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    // Lấy thông tin owner
    const owner = await db.collection("users").findOne({ _id: room.owner_id });

    // Lấy danh sách người tham gia
    const participants = await db
      .collection("room_participants")
      .find({ room_id: new ObjectId(roomId) })
      .toArray();

    // Lấy thông tin user cho mỗi người tham gia
    const participantsWithUserInfo = await Promise.all(
      participants.map(async (participant) => {
        const user = await db
          .collection("users")
          .findOne({ _id: participant.user_id });
        if (!user) {
          throw new Error(
            `User not found for participant ${participant.user_id}`
          );
        }
        return {
          id: randomUUID(),
          name: user.name,
          avatar: user.avatar_url || "/placeholder.svg?height=40&width=40",
          position: { x: participant.position_x, y: participant.position_y },
          isMuted: participant.is_muted,
          isOwner: user._id.toString() === room.owner_id.toString(),
        };
      })
    );

    // Lấy tin nhắn trong phòng
    const messages = await db
      .collection("chat_messages")
      .find({ room_id: new ObjectId(roomId) })
      .sort({ created_at: 1 })
      .limit(50)
      .toArray();

    // Format tin nhắn
    const formattedMessages = await Promise.all(
      messages.map(async (message) => {
        const user = await db
          .collection("users")
          .findOne({ _id: message.user_id });
        if (!user) {
          throw new Error(`User not found for message ${message._id}`);
        }
        return {
          id: message._id.toString(),
          userId: user._id.toString(),
          userName: user.name,
          content: message.content,
          timestamp: formatTime(message.created_at),
        };
      })
    );

    return NextResponse.json({
      room: {
        id: room._id.toString(),
        name: room.name,
        description: room.description,
        maxUsers: room.max_users,
        currentUsers: room.current_users,
        isPublic: room.is_public,
        tags: room.tags || [],
        currentTrack: room.current_track,
        backgroundTheme: room.background_theme,
        owner: owner
          ? {
              id: owner._id.toString(),
              name: owner.name,
              avatar: owner.avatar_url || "/placeholder.svg?height=40&width=40",
            }
          : null,
        createdAt: room.created_at,
      },
      participants: participantsWithUserInfo,
      messages: formattedMessages,
    });
  } catch (error) {
    console.error("Get room error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Helper function để format thời gian
function formatTime(date: Date): string {
  return date.toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}
