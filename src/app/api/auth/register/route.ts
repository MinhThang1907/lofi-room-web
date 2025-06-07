import { type NextRequest, NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import type { User } from "@/models/user"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"

export async function POST(request: NextRequest) {
  try {
    const { name, email, password } = await request.json()

    if (!name || !email || !password) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db()
    const usersCollection = db.collection<User>("users")

    // Kiểm tra email đã tồn tại chưa
    const existingUser = await usersCollection.findOne({ email })
    if (existingUser) {
      return NextResponse.json({ error: "Email already exists" }, { status: 409 })
    }

    // Hash password
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(password, salt)

    // Tạo user mới
    const newUser: User = {
      name,
      email,
      password_hash: hashedPassword,
      avatar_url: `/placeholder.svg?height=40&width=40&text=${encodeURIComponent(name[0])}`,
      created_at: new Date(),
      updated_at: new Date(),
    }

    const result = await usersCollection.insertOne(newUser)

    // Tạo JWT token
    const token = jwt.sign({ userId: result.insertedId, email }, process.env.JWT_SECRET || "default-secret", {
      expiresIn: "7d",
    })

    return NextResponse.json({
      success: true,
      user: {
        id: result.insertedId.toString(),
        name,
        email,
        avatar: newUser.avatar_url,
      },
      token,
    })
  } catch (error) {
    console.error("Registration error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
