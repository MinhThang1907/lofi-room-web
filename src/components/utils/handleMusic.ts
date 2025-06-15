const handleAddToPlaylist = async (
  trackId: string,
  roomId: string,
  onAddToPlaylist: (trackId: string) => void
) => {
  try {
    const response = await fetch(`/api/rooms/${roomId}/playlist`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ trackId }),
    });

    if (response.ok) {
      console.log("Track added to playlist successfully");
      onAddToPlaylist(trackId);
    }
  } catch (error) {
    console.error("Error adding to playlist:", error);
  }
};

export { handleAddToPlaylist };
