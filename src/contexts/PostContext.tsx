"use client";

import React, { createContext, useState, ReactNode } from "react";
import { Post } from "@/types/home.type";

type PostContextType = {
  selectedPost: Post | null;
  setSelectedPost: (post: Post | null) => void;
  isModalOpen: boolean;
  setIsModalOpen: (open: boolean) => void;
  handlePostClick: (postId?: string, username?: string) => Promise<void>;
};

export const PostContext = createContext<PostContextType | undefined>(
  undefined
);

export function PostProvider({ children }: { children: ReactNode }) {
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Bạn có thể import api getPostById ở đây
  async function handlePostClick(postId?: string) {
    // Nếu ko truyền postId thì có thể set null hoặc tùy ý xử lý
    if (!postId) {
      setSelectedPost(null);
      setIsModalOpen(false);
      return;
    }
    try {
      const { getPostById } = await import("@/server/posts");
      const postData = await getPostById(postId);
      setSelectedPost(postData);
      setIsModalOpen(true);
    } catch (error) {
      console.error("Lỗi khi lấy chi tiết bài đăng:", error);
      setSelectedPost(null);
      setIsModalOpen(false);
    }
  }

  return (
    <PostContext.Provider
      value={{
        selectedPost,
        setSelectedPost,
        isModalOpen,
        setIsModalOpen,
        handlePostClick,
      }}
    >
      {children}
    </PostContext.Provider>
  );
}
