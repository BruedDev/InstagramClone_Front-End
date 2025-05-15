// server/posts.tsx

import { getAuthToken } from "./auth";

const createAuthHeaders = (): HeadersInit => {
  const headers: HeadersInit = {};
  const token = getAuthToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
};

const BASE_URL = `${process.env.NEXT_PUBLIC_API_URL}/api/posts`;

export const createPost = async (formData: FormData) => {
  const res = await fetch(`${BASE_URL}/create`, {
    method: "POST",
    headers: createAuthHeaders(), // ✅ không cần truyền token
    body: formData,
  });

  if (!res.ok) {
    const error = await res.json();
    throw error;
  }

  return res.json();
};

export const getUserPosts = async ({
  userId,
  username,
  type,
}: {
  userId?: string;
  username?: string;
  type?: "image" | "video";
}) => {
  let url = "";

  if (userId) {
    url = type
      ? `${BASE_URL}/getPostUser/${userId}?type=${type}`
      : `${BASE_URL}/getPostUser/${userId}`;
  } else if (username) {
    url = type
      ? `${BASE_URL}/getPostUser?username=${username}&type=${type}`
      : `${BASE_URL}/getPostUser?username=${username}`;
  } else {
    throw new Error("Phải truyền vào userId hoặc username");
  }

  const res = await fetch(url, {
    headers: createAuthHeaders(),
  });

  if (!res.ok) {
    const error = await res.json();
    throw error;
  }

  const data = await res.json();
  return data.posts;
};

export const getPostById = async (postId: string) => {
  const res = await fetch(`${BASE_URL}/${postId}`, {
    headers: createAuthHeaders(),
  });

  if (!res.ok) {
    const error = await res.json();
    throw error;
  }

  const data = await res.json();
  return data.post;
};

export const deletePostById = async (postId: string) => {
  const res = await fetch(`${BASE_URL}/delete/${postId}`, {
    method: "DELETE",
    headers: createAuthHeaders(),
  });

  if (!res.ok) {
    const error = await res.json();
    throw error;
  }

  return res.json();
};
