import { type NextRequest, NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import { getAuthUser } from "@/lib/auth"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const roomId = params.id
    if (!ObjectId.isValid(roomId)) {
      return NextResponse.json({ error: "Invalid room ID" }, { status: 400 })
    }

    const { content } = await request.json()
    if (!content || typeof content !== "string") {
      return NextResponse.json({ error: "Message content is required" }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db()

    // Kiểm tra phòng tồn tại
    const room = await db.collection("rooms").findOne({ _id: new ObjectId(roomId) })
    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 })
    }

    // Kiểm tra user đã tham gia phòng
    const participant = await db.collection("room_participants").findOne({
      room_id: new ObjectId(roomId),
      user_id: new ObjectId(user.id),
    })

    if (!participant) {
      // Tự động thêm user vào phòng nếu chưa tham gia
      await db.collection("room_participants").insertOne({
        room_id: new ObjectId(roomId),
        user_id: new ObjectId(user.id),
        position_x: 200 + Math.floor(Math.random() * 400),
        position_y: 200 + Math.floor(Math.random() * 300),
        is_muted: false,
        joined_at: new Date(),
      })

      // Cập nhật số người trong phòng
      await db.collection("rooms").updateOne({ _id: new ObjectId(roomId) }, { $inc: { current_users: 1 } })
    }

    // Tạo tin nhắn mới
    const message = {
      room_id: new ObjectId(roomId),
      user_id: new ObjectId(user.id),
      content,
      message_type: "text",
      created_at: new Date(),
    }

    const result = await db.collection("chat_messages").insertOne(message)

    return NextResponse.json({
      success: true,
      message: {
        id: result.insertedId.toString(),
        userId: user.id,
        userName: user.name,
        content,
        timestamp: new Date().toLocaleTimeString("vi-VN", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      },
    })
  } catch (error) {
    console.error("Send message error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
