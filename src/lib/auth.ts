import type { NextRequest } from "next/server"
import jwt from "jsonwebtoken"
import clientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function getAuthUser(request: NextRequest) {
  try {
    // Lấy token từ header
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      // Nếu không có token trong header, thử lấy từ cookie
      const token = request.cookies.get("token")?.value
      if (!token) return null

      return verifyToken(token)
    }

    const token = authHeader.split(" ")[1]
    return verifyToken(token)
  } catch (error) {
    console.error("Auth error:", error)
    return null
  }
}

async function verifyToken(token: string) {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "default-secret") as {
      userId: string
      email: string
    }

    // Lấy thông tin user từ database
    const client = await clientPromise
    const db = client.db()
    const user = await db.collection("users").findOne({ _id: new ObjectId(decoded.userId) })

    if (!user) return null

    return {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      avatar: user.avatar_url || "/placeholder.svg?height=40&width=40",
    }
  } catch (error) {
    return null
  }
}
