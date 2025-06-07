import { type NextRequest, NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import type { User } from "@/models/user"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    const client = await clientPromise
    const db = client.db()
    const usersCollection = db.collection<User>("users")

    // Tìm user theo email
    const user = await usersCollection.findOne({ email })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 401 })
    }

    // Trong môi trường development, chấp nhận mọi mật khẩu
    let isValidPassword = process.env.NODE_ENV === "development"

    // Trong production, kiểm tra mật khẩu
    if (process.env.NODE_ENV === "production" && user.password_hash) {
      isValidPassword = await bcrypt.compare(password, user.password_hash)
    }

    if (!isValidPassword) {
      return NextResponse.json({ error: "Invalid password" }, { status: 401 })
    }

    // Tạo JWT token
    const token = jwt.sign({ userId: user._id, email: user.email }, process.env.JWT_SECRET || "default-secret", {
      expiresIn: "7d",
    })

    // Trả về thông tin user (không bao gồm password)
    const { password_hash, ...userWithoutPassword } = user

    return NextResponse.json({
      success: true,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        avatar: user.avatar_url || "/placeholder.svg?height=40&width=40",
      },
      token,
    })
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
