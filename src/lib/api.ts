// Utility functions for API calls

export async function apiCall(endpoint: string, options: RequestInit = {}) {
  const token = localStorage.getItem("token");

  const defaultHeaders: HeadersInit = {
    "Content-Type": "application/json",
  };

  if (token) {
    defaultHeaders.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(endpoint, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`API call failed: ${response.statusText}`);
  }

  return response.json();
}

export async function fetchRooms() {
  return apiCall("/api/rooms");
}

export async function createRoom(roomData: {
  name: string;
  description: string;
  maxUsers: number;
  isPublic: boolean;
  tags: string[];
}) {
  return apiCall("/api/rooms", {
    method: "POST",
    body: JSON.stringify(roomData),
  });
}

export async function fetchRoom(roomId: string) {
  return apiCall(`/api/rooms/${roomId}`);
}

export async function sendMessage(roomId: string, content: string) {
  return apiCall(`/api/rooms/${roomId}/messages`, {
    method: "POST",
    body: JSON.stringify({ content }),
  });
}
