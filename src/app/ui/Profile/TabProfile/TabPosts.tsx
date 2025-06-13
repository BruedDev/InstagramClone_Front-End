import { usePost } from "@/app/hooks/usePost";
import Image from "next/image";
import { Camera } from "lucide-react";
import { useEffect, useState } from "react";
import { getUserPosts } from "@/server/posts";
import { User } from "@/types/user.type";
import PostModal from "@/components/Modal/Post/PostModal";

type Post = {
  _id: string;
  fileUrl: string;
};

// Skeleton component
const PostSkeleton = () => (
  <div className="relative aspect-square bg-gray-800 rounded-lg animate-pulse">
    <div className="w-full h-full bg-gray-700/50 rounded-lg"></div>
  </div>
);

export default function TabPosts({ user }: { user: User }) {
  const {
    selectedPost,
    isModalOpen,
    handlePostClick,
    setIsModalOpen,
    setSelectedPost,
  } = usePost();
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPostLoading, setIsPostLoading] = useState(false);

  // Lấy số lượng posts thực tế từ user
  const postsCount = user?.posts?.length ?? 0;

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setIsLoading(true);
        const data = await getUserPosts({
          userId: user._id,
          username: user.username,
          type: "image",
        });
        setPosts(data);
      } catch (error) {
        console.error("Lỗi khi lấy bài đăng:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (user?._id || user?.username) {
      fetchPosts();
    }
  }, [user]);

  const handleClick = async (postId: string) => {
    setIsPostLoading(true);
    await handlePostClick(postId);
    setIsPostLoading(false);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedPost(null);
  };

  return (
    <div className="mt-5">
      {isLoading ? (
        // Skeleton loading state - hiển thị đúng số lượng posts
        postsCount === 0 ? (
          // Nếu không có posts thì hiển thị một vài skeleton mặc định
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <PostSkeleton key={index} />
            ))}
          </div>
        ) : (
          // Hiển thị skeleton theo đúng số lượng posts
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {Array.from({ length: postsCount }).map((_, index) => (
              <PostSkeleton key={index} />
            ))}
          </div>
        )
      ) : postsCount === 0 ? (
        // Empty state
        <div className="flex flex-col justify-center items-center text-center p-10">
          <div className="text-gray-400 mb-4">
            <Camera size={50} />
          </div>
          <h2 className="text-xl font-semibold text-white">Chưa có ảnh</h2>
          <p className="text-gray-400">
            Khi người dùng chia sẻ ảnh, ảnh sẽ hiển thị tại đây
          </p>
        </div>
      ) : (
        // Posts grid
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {posts.map((post) => (
            <div
              key={post._id}
              className="relative aspect-square cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => handleClick(post._id)}
            >
              <Image
                src={post.fileUrl}
                alt="Post"
                className="w-full h-full rounded-lg object-cover"
                width={300}
                height={300}
              />
              {isPostLoading &&
                selectedPost &&
                selectedPost._id === post._id && (
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
