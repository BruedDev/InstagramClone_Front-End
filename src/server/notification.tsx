import { getAuthToken } from "./auth";

const BASE_URL = `${process.env.NEXT_PUBLIC_API_URL}/api/notification`;

const createAuthHeaders = (): Record<string, string> => {
  const headers: Record<string, string> = {};
  const token = getAuthToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
};

export const fetchNotifications = async () => {
  const res = await fetch(BASE_URL, {
    headers: createAuthHeaders(),
  });
  if (!res.ok) {
    const error = await res.json();
    throw error;
  }
  const data = await res.json();
  return data.notifications;
};

export const markNotificationsAsRead = async () => {
  const res = await fetch(`${BASE_URL}/mark-as-read`, {
    method: "POST",
    headers: createAuthHeaders(),
  });
  if (!res.ok) {
    const error = await res.json();
    throw error;
  }
  return res.json();
};
