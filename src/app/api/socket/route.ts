import type { NextRequest } from "next/server";
import { Server as NetServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Extend NextApiResponse to include socket server
declare global {
  var io: SocketIOServer | undefined;
}

export async function GET() {
  return NextResponse.json({
    message: "Socket.IO server is running separately on port 3001",
    status: "Socket.IO should be started with: npm run socket",
    endpoint: "http://localhost:3001",
  });
}

export async function POST() {
  return NextResponse.json({
    message: "Socket.IO server is running separately on port 3001",
    status: "Socket.IO should be started with: npm run socket",
    endpoint: "http://localhost:3001",
  });
}

const SocketHandler = async (req: NextRequest) => {
  if (!global.io) {
    console.log("Initializing Socket.IO server...");

    // Create HTTP server
    const httpServer = new NetServer();

    // Create Socket.IO server
    const io = new SocketIOServer(httpServer, {
      path: "/api/socket",
      cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:3000",
        methods: ["GET", "POST"],
      },
    });

    // Store rooms and users in memory
    const rooms = new Map();
    const users = new Map();

    io.use(async (socket: any, next) => {
      try {
        const token = socket.handshake.auth.token;
        if (!token) {
          return next(new Error("Authentication error"));
        }

        const decoded = jwt.verify(
          token,
          process.env.JWT_SECRET || "default-secret"
        ) as {
          userId: string;
          email: string;
        };

        const client = await clientPromise;
        const db = client.db();
        const user = await db
          .collection("users")
          .findOne({ _id: new ObjectId(decoded.userId) });

        if (!user) {
          return next(new Error("User not found"));
        }

        socket.userId = user._id.toString();
        socket.user = {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          avatar: user.avatar_url || "/placeholder.svg?height=40&width=40",
        };

        next();
      } catch (error) {
        next(new Error("Authentication error"));
      }
    });

    io.on("connection", (socket: any) => {
      console.log(`User connected: ${socket.user.name} (${socket.id})`);

      // Join room
      socket.on("join-room", async (data: any) => {
        const { roomId } = data;

        try {
          const client = await clientPromise;
          const db = client.db();

          // Verify room exists
          const room = await db
            .collection("rooms")
            .findOne({ _id: new ObjectId(roomId) });
          if (!room) {
            socket.emit("error", { message: "Room not found" });
            return;
          }

          // Leave previous room if any
          if (socket.currentRoom) {
            socket.leave(socket.currentRoom);
            handleUserLeaveRoom(socket, socket.currentRoom, rooms, io);
          }

          // Join new room
          socket.join(roomId);
          socket.currentRoom = roomId;

          // Update room state
          if (!rooms.has(roomId)) {
            rooms.set(roomId, {
              users: new Map(),
              currentTrack: room.current_track || "No music playing",
              isPlaying: true,
              trackPosition: 0,
            });
          }

          const roomState = rooms.get(roomId);
          roomState.users.set(socket.id, {
            ...socket.user,
            socketId: socket.id,
            position: {
              x: 200 + Math.random() * 400,
              y: 200 + Math.random() * 300,
            },
            isMuted: false,
            isOwner: socket.user.id === room.owner_id.toString(),
            joinedAt: new Date(),
          });

          // Add to database participants
          await db.collection("room_participants").updateOne(
            {
              room_id: new ObjectId(roomId),
              user_id: new ObjectId(socket.user.id),
            },
            {
              $set: {
                room_id: new ObjectId(roomId),
                user_id: new ObjectId(socket.user.id),
                position_x: roomState.users.get(socket.id).position.x,
                position_y: roomState.users.get(socket.id).position.y,
                is_muted: false,
                joined_at: new Date(),
              },
            },
            { upsert: true }
          );

          // Update room user count
          await db
            .collection("rooms")
            .updateOne(
              { _id: new ObjectId(roomId) },
              { $set: { current_users: roomState.users.size } }
            );

          // Notify user of successful join
          socket.emit("room-joined", {
            roomId,
            users: Array.from(roomState.users.values()),
            currentTrack: roomState.currentTrack,
            isPlaying: roomState.isPlaying,
            trackPosition: roomState.trackPosition,
          });

          // Notify other users in room
          socket.to(roomId).emit("user-joined", {
            user: roomState.users.get(socket.id),
          });

          console.log(`User ${socket.user.name} joined room ${roomId}`);
        } catch (error) {
          console.error("Join room error:", error);
          socket.emit("error", { message: "Failed to join room" });
        }
      });

      // Handle chat messages
      socket.on("send-message", async (data: any) => {
        const { roomId, message } = data;

        if (socket.currentRoom === roomId && socket.user) {
          try {
            const client = await clientPromise;
            const db = client.db();

            // Save message to database
            const messageDoc = {
              room_id: new ObjectId(roomId),
              user_id: new ObjectId(socket.user.id),
              content: message,
              message_type: "text",
              created_at: new Date(),
            };

            const result = await db
              .collection("chat_messages")
              .insertOne(messageDoc);

            const chatMessage = {
              id: result.insertedId.toString(),
              userId: socket.user.id,
              userName: socket.user.name,
              content: message,
              timestamp: new Date().toLocaleTimeString("vi-VN", {
                hour: "2-digit",
                minute: "2-digit",
              }),
            };

            // Broadcast message to all users in room
            io.to(roomId).emit("new-message", chatMessage);
          } catch (error) {
            console.error("Send message error:", error);
            socket.emit("error", { message: "Failed to send message" });
          }
        }
      });

      // Handle user movement
      socket.on("user-move", async (data: any) => {
        const { roomId, position } = data;

        if (socket.currentRoom === roomId && rooms.has(roomId)) {
          const roomState = rooms.get(roomId);
          const user = roomState.users.get(socket.id);

          if (user) {
            user.position = position;

            // Update database
            try {
              const client = await clientPromise;
              const db = client.db();
              await db.collection("room_participants").updateOne(
                {
                  room_id: new ObjectId(roomId),
                  user_id: new ObjectId(socket.user.id),
                },
                { $set: { position_x: position.x, position_y: position.y } }
              );
            } catch (error) {
              console.error("Update position error:", error);
            }

            // Broadcast position update to other users
            socket.to(roomId).emit("user-moved", {
              userId: socket.user.id,
              position,
            });
          }
        }
      });

      // Handle voice chat mute/unmute
      socket.on("toggle-mute", async (data: any) => {
        const { roomId, isMuted } = data;

        if (socket.currentRoom === roomId && rooms.has(roomId)) {
          const roomState = rooms.get(roomId);
          const user = roomState.users.get(socket.id);

          if (user) {
            user.isMuted = isMuted;

            // Update database
            try {
              const client = await clientPromise;
              const db = client.db();
              await db.collection("room_participants").updateOne(
                {
                  room_id: new ObjectId(roomId),
                  user_id: new ObjectId(socket.user.id),
                },
                { $set: { is_muted: isMuted } }
              );
            } catch (error) {
              console.error("Update mute status error:", error);
            }

            // Broadcast mute status to other users
            socket.to(roomId).emit("user-mute-changed", {
              userId: socket.user.id,
              isMuted,
            });
          }
        }
      });

      // Handle music control (only room owner)
      socket.on("music-control", async (data: any) => {
        const { roomId, action, trackId } = data;

        if (socket.currentRoom === roomId && rooms.has(roomId)) {
          const roomState = rooms.get(roomId);

          // Check if user is room owner
          const user = roomState.users.get(socket.id);
          if (user && user.isOwner) {
            switch (action) {
              case "play":
                roomState.isPlaying = true;
                break;
              case "pause":
                roomState.isPlaying = false;
                break;
              case "next":
                roomState.currentTrack = trackId || "Next Track";
                roomState.trackPosition = 0;
                break;
            }

            // Update database
            try {
              const client = await clientPromise;
              const db = client.db();
              await db
                .collection("rooms")
                .updateOne(
                  { _id: new ObjectId(roomId) },
                  { $set: { current_track: roomState.currentTrack } }
                );
            } catch (error) {
              console.error("Update music state error:", error);
            }

            // Broadcast music state to all users in room
            io.to(roomId).emit("music-state-changed", {
              currentTrack: roomState.currentTrack,
              isPlaying: roomState.isPlaying,
              trackPosition: roomState.trackPosition,
            });
          }
        }
      });

      // Handle disconnection
      socket.on("disconnect", () => {
        console.log(`User disconnected: ${socket.user?.name} (${socket.id})`);

        if (socket.currentRoom) {
          handleUserLeaveRoom(socket, socket.currentRoom, rooms, io);
        }
      });

      // Handle explicit room leave
      socket.on("leave-room", () => {
        if (socket.currentRoom) {
          handleUserLeaveRoom(socket, socket.currentRoom, rooms, io);
          socket.leave(socket.currentRoom);
          socket.currentRoom = null;
        }
      });
    });

    // Helper function to handle user leaving room
    const handleUserLeaveRoom = async (
      socket: any,
      roomId: string,
      rooms: Map<any, any>,
      io: SocketIOServer
    ) => {
      if (rooms.has(roomId)) {
        const roomState = rooms.get(roomId);
        roomState.users.delete(socket.id);

        // Update database
        try {
          const client = await clientPromise;
          const db = client.db();

          // Remove from participants
          await db.collection("room_participants").deleteOne({
            room_id: new ObjectId(roomId),
            user_id: new ObjectId(socket.user.id),
          });

          // Update room user count
          await db
            .collection("rooms")
            .updateOne(
              { _id: new ObjectId(roomId) },
              { $set: { current_users: roomState.users.size } }
            );
        } catch (error) {
          console.error("Leave room error:", error);
        }

        // Notify other users
        if (socket.user) {
          socket.to(roomId).emit("user-left", {
            userId: socket.user.id,
          });
        }

        // Clean up empty rooms
        if (roomState.users.size === 0) {
          rooms.delete(roomId);
          console.log(`Room ${roomId} cleaned up - no users remaining`);
        }
      }
    };

    global.io = io;

    // Start the server on a different port for Socket.IO
    const port = process.env.SOCKET_PORT || 3001;
    httpServer.listen(port, () => {
      console.log(`Socket.IO server running on port ${port}`);
    });
  }
};
