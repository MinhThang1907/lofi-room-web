import type { ObjectId } from "mongodb"

export interface ChatMessage {
  _id?: ObjectId
  room_id: ObjectId
  user_id: ObjectId
  content: string
  message_type: string
  created_at: Date
}
