"use client";

import React, { createContext, useState, ReactNode, useEffect } from "react";
import { Post } from "@/types/home.type";
import { socketService } from "@/server/socket";
import { useUser } from "@/app/hooks/useUser";

type PostContextType = {
  selectedPost: Post | null;
  setSelectedPost: (post: Post | null) => void;
  isModalOpen: boolean;
  setIsModalOpen: (open: boolean) => void;
  handlePostClick: (postId?: string, username?: string) => Promise<void>;
  posts: Post[];
  setPosts: React.Dispatch<React.SetStateAction<Post[]>>;
  handleLikeRealtime: (postId: string, isLike: boolean) => void;
};

export const PostContext = createContext<PostContextType | undefined>(
  undefined
);

export function PostProvider({ children }: { children: ReactNode }) {
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [posts, setPosts] = useState<Post[]>([]);
  const { user } = useUser();

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

  // Hàm cập nhật like realtime cho từng post
  const handleLikeRealtime = (postId: string, isLike: boolean) => {
    setPosts((prev) =>
      prev.map((p) =>
        p._id === postId
          ? {
              ...p,
              isLike,
              totalLikes: isLike
                ? p.totalLikes + 1
                : Math.max(p.totalLikes - 1, 0),
            }
          : p
      )
    );
  };

  // Lắng nghe event post:liked từ socket để cập nhật context realtime cho mọi client
  useEffect(() => {
    const handlePostLiked = (data: {
      postId: string;
      userId: string;
      isLike: boolean;
      totalLikes: number;
    }) => {
      setPosts((prev) =>
        prev.map((p) =>
          p._id === data.postId
            ? {
                ...p,
                totalLikes: data.totalLikes,
                isLike: data.userId === user?._id ? data.isLike : p.isLike,
              }
            : p
        )
      );
    };
    socketService.onPostLiked(handlePostLiked);
    return () => socketService.offPostLiked(handlePostLiked);
  }, [setPosts, user?._id]);

  return (
    <PostContext.Provider
      value={{
        selectedPost,
        setSelectedPost,
        isModalOpen,
        setIsModalOpen,
        handlePostClick,
        posts,
        setPosts,
        handleLikeRealtime,
      }}
    >
      {children}
    </PostContext.Provider>
  );
}

export const usePostContext = () => {
  const context = React.useContext(PostContext);
  if (!context)
    throw new Error("usePostContext must be used within a PostProvider");
  return context;
};
