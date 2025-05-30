// server/posts.tsx

import { getAuthToken } from "./auth";

const createAuthHeaders = (): Record<string, string> => {
  const headers: Record<string, string> = {};
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
    headers: createAuthHeaders(),
    body: formData,
  });

  if (!res.ok) {
    const error = await res.json();
    throw error; // Rethrow the error object from the server
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
    throw error; // Rethrow the error object from the server
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
    throw error; // Rethrow the error object from the server
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
    throw error; // Rethrow the error object from the server
  }

  return res.json();
};

// === COMMENT SECTION: ONLY USE API FOR INITIAL LOAD ===
// After initial load, use socket for all comment actions (add, edit, delete, reply, like, etc.)
// Do NOT call getCommentsForItem or addCommentToPost except for SSR or first load.

/**
 * Adds a comment to a specific post.
 * Assumes the backend controller for the route /comments/:postId
 * will use req.params.postId as itemId and expects itemType in the body.
 * @param postId The ID of the post to comment on.
 * @param text The text content of the comment.
 * @param parentId Optional ID of the parent comment if this is a reply.
 * @returns The server's response, typically the created comment object.
 */
export const addCommentToPost = async (
  postId: string,
  text: string,
  itemType: string = "post",
  parentId?: string
) => {
  const headers = createAuthHeaders();
  headers["Content-Type"] = "application/json";

  const body = {
    itemId: postId, // Map postId thành itemId
    itemType,
    text,
    parentId: parentId || undefined,
  };

  const res = await fetch(`${BASE_URL}/comments/${postId}`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errorData = await res.json();
    console.error("Error adding comment:", errorData);
    throw errorData;
  }
  return res.json();
};

/**
 * Type definition for commentable items.
 * 'image' will be mapped to 'post' by the backend's mapItemType function.
 */
export type CommentableItemType = "post" | "reel" | "video" | "image";

/**
 * Fetches comments for a specific item (post, reel, or video).
 * @param itemId The ID of the item.
 * @param itemType The type of the item ('post', 'reel', 'video', 'image').
 * @returns A promise that resolves to an array of top-level comments, with replies nested.
 */
export const getCommentsForItem = async (
  itemId: string,
  itemType: CommentableItemType,
  limit: number = 15,
  skip?: number
) => {
  const queryParams = new URLSearchParams({
    limit: limit.toString(),
    ...(skip !== undefined ? { skip: skip.toString() } : {}),
  });

  const headers = createAuthHeaders();
  const res = await fetch(
    `${BASE_URL}/comments/${itemType}/${itemId}?${queryParams}`,
    {
      method: "GET",
      headers,
    }
  );

  if (!res.ok) {
    const errorData = await res.json();
    console.error("Error fetching comments:", errorData);
    throw errorData;
  }

  const data = await res.json();
  return data;
};

export const likePost = async (postId: string) => {
  const res = await fetch(`${BASE_URL}/like/${postId}`, {
    method: "POST",
    headers: createAuthHeaders(),
  });

  if (!res.ok) {
    const error = await res.json();
    throw error;
  }

  return res.json();
};
