import type { ObjectId } from "mongodb"

export interface User {
  _id?: ObjectId
  name: string
  email: string
  password_hash: string
  avatar_url?: string
  google_id?: string
  facebook_id?: string
  created_at: Date
  updated_at: Date
}

export interface UserSession {
  _id?: ObjectId
  user_id: ObjectId
  room_id: ObjectId
  socket_id: string
  is_active: boolean
  last_activity: Date
  created_at: Date
}
