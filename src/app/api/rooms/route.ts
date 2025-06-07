import { type NextRequest, NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import type { Room } from "@/models/room"
import { ObjectId } from "mongodb"
import { getAuthUser } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const roomData = await request.json()
    const { name, description, maxUsers, isPublic, tags } = roomData

    if (!name) {
      return NextResponse.json({ error: "Room name is required" }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db()
    const roomsCollection = db.collection<Room>("rooms")

    // Tạo room mới
    const newRoom: Room = {
      name,
      description: description || "",
      owner_id: new ObjectId(user.id),
      max_users: maxUsers || 20,
      is_public: isPublic !== undefined ? isPublic : true,
      tags: tags || [],
      current_users: 0,
      background_theme: "default",
      created_at: new Date(),
      updated_at: new Date(),
    }

    const result = await roomsCollection.insertOne(newRoom)

    return NextResponse.json({
      success: true,
      roomId: result.insertedId.toString(),
      room: {
        ...newRoom,
        _id: result.insertedId,
      },
    })
  } catch (error) {
    console.error("Create room error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const client = await clientPromise
    const db = client.db()
    const roomsCollection = db.collection<Room>("rooms")
    const usersCollection = db.collection("users")

    // Lấy danh sách phòng công khai
    const rooms = await roomsCollection.find({ is_public: true }).limit(20).toArray()

    // Lấy thông tin owner cho mỗi phòng
    const roomsWithOwners = await Promise.all(
      rooms.map(async (room) => {
        const owner = await usersCollection.findOne({ _id: room.owner_id })

        return {
          id: room._id.toString(),
          name: room.name,
          description: room.description || "",
          currentUsers: room.current_users,
          maxUsers: room.max_users,
          isPublic: room.is_public,
          tags: room.tags || [],
          owner: {
            name: owner?.name || "Unknown",
            avatar: owner?.avatar_url || "/placeholder.svg?height=32&width=32",
          },
          currentTrack: room.current_track || "No music playing",
          createdAt: formatTimeAgo(room.created_at),
        }
      }),
    )

    return NextResponse.json({ rooms: roomsWithOwners })
  } catch (error) {
    console.error("Get rooms error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// Helper function để format thời gian
function formatTimeAgo(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.round(diffMs / 60000)

  if (diffMins < 60) {
    return `${diffMins} phút trước`
  }

  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) {
    return `${diffHours} giờ trước`
  }

  const diffDays = Math.floor(diffHours / 24)
  return `${diffDays} ngày trước`
}
