import type { ObjectId } from "mongodb"

export interface Room {
  _id?: ObjectId
  name: string
  description?: string
  owner_id: ObjectId
  max_users: number
  is_public: boolean
  current_track?: string
  background_theme?: string
  tags: string[]
  current_users: number
  created_at: Date
  updated_at: Date
}

export interface RoomParticipant {
  _id?: ObjectId
  room_id: ObjectId
  user_id: ObjectId
  position_x: number
  position_y: number
  is_muted: boolean
  joined_at: Date
}
