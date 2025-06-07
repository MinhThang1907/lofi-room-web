import type { ObjectId } from "mongodb"

export interface MusicTrack {
  _id?: ObjectId
  title: string
  artist?: string
  url: string
  duration?: number
  genre?: string
  is_licensed: boolean
  created_at: Date
}

export interface RoomPlaylist {
  _id?: ObjectId
  room_id: ObjectId
  track_id: ObjectId
  play_order: number
  added_by?: ObjectId
  added_at: Date
}
