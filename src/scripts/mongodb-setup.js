// MongoDB setup script for Lofi Room
const { MongoClient, ObjectId } = require("mongodb")

// Connection URI
const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/lofi-room"

// Create a new MongoClient
const client = new MongoClient(uri)

async function run() {
  try {
    // Connect to MongoDB
    await client.connect()
    console.log("Connected to MongoDB")

    // Get database
    const db = client.db()

    // Drop existing collections if they exist
    const collections = await db.listCollections().toArray()
    const collectionNames = collections.map((c) => c.name)

    const collectionsToSetup = [
      "users",
      "rooms",
      "room_participants",
      "chat_messages",
      "music_tracks",
      "room_playlists",
      "user_sessions",
    ]

    for (const collection of collectionsToSetup) {
      if (collectionNames.includes(collection)) {
        await db.collection(collection).drop()
        console.log(`Dropped collection: ${collection}`)
      }
    }

    // Create users
    const users = [
      {
        _id: new ObjectId(),
        name: "Alice Nguyen",
        email: "alice@example.com",
        password_hash: "$2b$10$example_hash_1",
        avatar_url: "/placeholder.svg?height=40&width=40",
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        _id: new ObjectId(),
        name: "Bob Tran",
        email: "bob@example.com",
        password_hash: "$2b$10$example_hash_2",
        avatar_url: "/placeholder.svg?height=40&width=40",
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        _id: new ObjectId(),
        name: "Charlie Le",
        email: "charlie@example.com",
        password_hash: "$2b$10$example_hash_3",
        avatar_url: "/placeholder.svg?height=40&width=40",
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        _id: new ObjectId(),
        name: "Diana Pham",
        email: "diana@example.com",
        password_hash: "$2b$10$example_hash_4",
        avatar_url: "/placeholder.svg?height=40&width=40",
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        _id: new ObjectId(),
        name: "Eva Hoang",
        email: "eva@example.com",
        password_hash: "$2b$10$example_hash_5",
        avatar_url: "/placeholder.svg?height=40&width=40",
        created_at: new Date(),
        updated_at: new Date(),
      },
    ]

    await db.collection("users").insertMany(users)
    console.log(`Inserted ${users.length} users`)

    // Create music tracks
    const musicTracks = [
      {
        _id: new ObjectId(),
        title: "Peaceful Piano Lofi",
        artist: "Chill Beats Studio",
        url: "https://example.com/track1.mp3",
        duration: 180,
        genre: "lofi",
        is_licensed: true,
        created_at: new Date(),
      },
      {
        _id: new ObjectId(),
        title: "Midnight Jazz Lofi",
        artist: "Relaxing Sounds",
        url: "https://example.com/track2.mp3",
        duration: 210,
        genre: "lofi",
        is_licensed: true,
        created_at: new Date(),
      },
      {
        _id: new ObjectId(),
        title: "Rainy Day Cafe",
        artist: "Ambient Collective",
        url: "https://example.com/track3.mp3",
        duration: 195,
        genre: "ambient",
        is_licensed: true,
        created_at: new Date(),
      },
      {
        _id: new ObjectId(),
        title: "Study Focus Beats",
        artist: "Lo-Fi Hip Hop",
        url: "https://example.com/track4.mp3",
        duration: 240,
        genre: "lofi",
        is_licensed: true,
        created_at: new Date(),
      },
      {
        _id: new ObjectId(),
        title: "Morning Coffee",
        artist: "Chill Vibes",
        url: "https://example.com/track5.mp3",
        duration: 165,
        genre: "lofi",
        is_licensed: true,
        created_at: new Date(),
      },
    ]

    await db.collection("music_tracks").insertMany(musicTracks)
    console.log(`Inserted ${musicTracks.length} music tracks`)

    // Create rooms
    const rooms = [
      {
        _id: new ObjectId(),
        name: "Chill Study Session",
        description: "Học bài cùng nhau với nhạc lofi thư giãn",
        owner_id: users[0]._id,
        max_users: 20,
        is_public: true,
        current_track: "Peaceful Piano Lofi",
        background_theme: "study",
        tags: ["study", "chill", "focus"],
        current_users: 3,
        created_at: new Date(Date.now() - 7200000), // 2 hours ago
        updated_at: new Date(),
      },
      {
        _id: new ObjectId(),
        name: "Late Night Vibes",
        description: "Thức khuya làm việc với những giai điệu êm dịu",
        owner_id: users[1]._id,
        max_users: 15,
        is_public: true,
        current_track: "Midnight Jazz Lofi",
        background_theme: "night",
        tags: ["night", "work", "ambient"],
        current_users: 2,
        created_at: new Date(Date.now() - 3600000), // 1 hour ago
        updated_at: new Date(),
      },
      {
        _id: new ObjectId(),
        name: "Coffee Shop Atmosphere",
        description: "Không khí quán cà phê ấm cúng",
        owner_id: users[2]._id,
        max_users: 25,
        is_public: true,
        current_track: "Rainy Day Cafe",
        background_theme: "cafe",
        tags: ["coffee", "cozy", "social"],
        current_users: 3,
        created_at: new Date(Date.now() - 1800000), // 30 minutes ago
        updated_at: new Date(),
      },
    ]

    await db.collection("rooms").insertMany(rooms)
    console.log(`Inserted ${rooms.length} rooms`)

    // Create room participants
    const roomParticipants = [
      {
        room_id: rooms[0]._id,
        user_id: users[0]._id,
        position_x: 200,
        position_y: 300,
        is_muted: false,
        joined_at: new Date(),
      },
      {
        room_id: rooms[0]._id,
        user_id: users[1]._id,
        position_x: 400,
        position_y: 250,
        is_muted: false,
        joined_at: new Date(),
      },
      {
        room_id: rooms[0]._id,
        user_id: users[2]._id,
        position_x: 300,
        position_y: 400,
        is_muted: true,
        joined_at: new Date(),
      },
      {
        room_id: rooms[1]._id,
        user_id: users[1]._id,
        position_x: 250,
        position_y: 350,
        is_muted: false,
        joined_at: new Date(),
      },
      {
        room_id: rooms[1]._id,
        user_id: users[3]._id,
        position_x: 350,
        position_y: 280,
        is_muted: false,
        joined_at: new Date(),
      },
      {
        room_id: rooms[2]._id,
        user_id: users[2]._id,
        position_x: 180,
        position_y: 320,
        is_muted: false,
        joined_at: new Date(),
      },
      {
        room_id: rooms[2]._id,
        user_id: users[4]._id,
        position_x: 420,
        position_y: 300,
        is_muted: false,
        joined_at: new Date(),
      },
      {
        room_id: rooms[2]._id,
        user_id: users[0]._id,
        position_x: 300,
        position_y: 200,
        is_muted: false,
        joined_at: new Date(),
      },
    ]

    await db.collection("room_participants").insertMany(roomParticipants)
    console.log(`Inserted ${roomParticipants.length} room participants`)

    // Create chat messages
    const chatMessages = [
      {
        room_id: rooms[0]._id,
        user_id: users[1]._id,
        content: "Chào mọi người! 👋",
        message_type: "text",
        created_at: new Date(Date.now() - 300000), // 5 minutes ago
      },
      {
        room_id: rooms[0]._id,
        user_id: users[2]._id,
        content: "Bài nhạc này hay quá!",
        message_type: "text",
        created_at: new Date(Date.now() - 180000), // 3 minutes ago
      },
      {
        room_id: rooms[1]._id,
        user_id: users[1]._id,
        content: "Ai còn thức không?",
        message_type: "text",
        created_at: new Date(Date.now() - 240000), // 4 minutes ago
      },
      {
        room_id: rooms[1]._id,
        user_id: users[3]._id,
        content: "Mình đang code đây 💻",
        message_type: "text",
        created_at: new Date(Date.now() - 120000), // 2 minutes ago
      },
      {
        room_id: rooms[2]._id,
        user_id: users[2]._id,
        content: "Quán cà phê ảo này chill ghê",
        message_type: "text",
        created_at: new Date(Date.now() - 360000), // 6 minutes ago
      },
      {
        room_id: rooms[2]._id,
        user_id: users[4]._id,
        content: "Nhạc lofi này perfect cho không khí cafe",
        message_type: "text",
        created_at: new Date(Date.now() - 240000), // 4 minutes ago
      },
    ]

    await db.collection("chat_messages").insertMany(chatMessages)
    console.log(`Inserted ${chatMessages.length} chat messages`)

    // Create room playlists
    const roomPlaylists = [
      {
        room_id: rooms[0]._id,
        track_id: musicTracks[0]._id,
        play_order: 1,
        added_by: users[0]._id,
        added_at: new Date(),
      },
      {
        room_id: rooms[0]._id,
        track_id: musicTracks[3]._id,
        play_order: 2,
        added_by: users[0]._id,
        added_at: new Date(),
      },
      {
        room_id: rooms[1]._id,
        track_id: musicTracks[1]._id,
        play_order: 1,
        added_by: users[1]._id,
        added_at: new Date(),
      },
      {
        room_id: rooms[2]._id,
        track_id: musicTracks[2]._id,
        play_order: 1,
        added_by: users[2]._id,
        added_at: new Date(),
      },
      {
        room_id: rooms[2]._id,
        track_id: musicTracks[4]._id,
        play_order: 2,
        added_by: users[2]._id,
        added_at: new Date(),
      },
    ]

    await db.collection("room_playlists").insertMany(roomPlaylists)
    console.log(`Inserted ${roomPlaylists.length} playlist entries`)

    // Create indexes
    await db.collection("users").createIndex({ email: 1 }, { unique: true })
    await db.collection("rooms").createIndex({ is_public: 1 })
    await db.collection("rooms").createIndex({ owner_id: 1 })
    await db.collection("room_participants").createIndex({ room_id: 1 })
    await db.collection("room_participants").createIndex({ user_id: 1 })
    await db.collection("chat_messages").createIndex({ room_id: 1 })
    await db.collection("chat_messages").createIndex({ created_at: 1 })

    console.log("Created indexes")
    console.log("MongoDB setup completed successfully!")
  } finally {
    // Close the connection
    await client.close()
  }
}

run().catch(console.error)
