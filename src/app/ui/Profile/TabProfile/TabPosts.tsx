import { useEffect, useState } from "react";
import { getUserPosts, getPostById } from "@/server/posts";
import { Camera } from "lucide-react";
import { User } from "@/types/user.type";
import Image from "next/image";
import PostModal from "@/components/Modal/PostModal";

// Định nghĩa type cho post
type Post = {
  _id: string;
  fileUrl: string;
};

export default function TabPosts({ user }: { user: User }) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const data = await getUserPosts({
          userId: user._id,
          username: user.username,
          type: "image",
        });
        setPosts(data);
      } catch (error) {
        console.error("Lỗi khi lấy bài đăng:", error);
      }
    };

    if (user?._id || user?.username) {
      fetchPosts();
    }
  }, [user]);

  const handlePostClick = async (postId: string) => {
    try {
      setIsLoading(true);
      const postData = await getPostById(postId);
      setSelectedPost(postData);
      setIsModalOpen(true);
    } catch (error) {
      console.error("Lỗi khi lấy chi tiết bài đăng:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedPost(null);
  };

  return (
    <div className="mt-5">
      {posts.length === 0 ? (
        <div className="flex flex-col justify-center items-center text-center">
          <div className="text-gray-400 mb-4">
            <Camera size={50} />
          </div>
          <h2 className="text-xl font-semibold text-white">Chưa có ảnh</h2>
          <p className="text-gray-400">
            Khi người dùng chia sẻ ảnh, ảnh sẽ hiển thị tại đây
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {posts.map((post) => (
            <div
              key={post._id}
              className="relative aspect-square cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => handlePostClick(post._id)}
            >
              <Image
                src={post.fileUrl}
                alt="Post"
                className="w-full h-full rounded-lg object-cover"
                width={300}
                height={300}
              />
              {isLoading && selectedPost && selectedPost._id === post._id && (
                <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center rounded-lg">
                  <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {isModalOpen && selectedPost && (
        <PostModal post={selectedPost} onClose={handleCloseModal} />
      )}
    </div>
  );
}
