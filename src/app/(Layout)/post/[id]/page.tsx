"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import PostModal from "@/components/Modal/Post/PostModal";
import { getPostById } from "@/server/posts";
import { Post } from "@/types/home.type";

export default function PostPageDetail() {
  const params = useParams();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        setLoading(true);
        setError(null);

        // Lấy ID từ URL params
        const postId = params.id as string;

        if (!postId) {
          setError("ID bài viết không hợp lệ");
          return;
        }

        // Gọi API để lấy thông tin bài viết
        const postData = await getPostById(postId);

        if (!postData) {
          setError("Không tìm thấy bài viết");
          return;
        }

        setPost(postData);
      } catch (err) {
        console.error("Lỗi khi tải bài viết:", err);
        setError("Có lỗi xảy ra khi tải bài viết");
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [params.id]);

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Lỗi</h1>
        <p className="text-gray-600 mb-4">{error}</p>
        <button
          onClick={() => window.history.back()}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Quay lại
        </button>
      </div>
    );
  }

  // Post not found
  if (!post) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">
          Không tìm thấy bài viết
        </h1>
        <p className="text-gray-600 mb-4">
          Bài viết bạn đang tìm kiếm không tồn tại hoặc đã bị xóa.
        </p>
        <button
          onClick={() => window.history.back()}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Quay lại
        </button>
      </div>
    );
  }

  // Render PostModal với detail mode
  return (
    <div style={{ padding: "40px" }}>
      <PostModal post={post} detail={true} />
    </div>
  );
}
