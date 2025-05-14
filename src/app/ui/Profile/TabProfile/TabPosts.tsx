import { useEffect, useState } from "react";
import { getUserPosts } from "@/server/posts";
import { Camera } from "lucide-react";
import { User } from "@/types/user.type";
import IsProfile from "@/components/isProfile";
import Image from "next/image";

// Định nghĩa type cho post
type Post = {
  _id: string;
  fileUrl: string;
  posts?: string[];
};

export default function TabPosts({ user }: { user: User }) {
  const [posts, setPosts] = useState<Post[]>([]); // Sử dụng type Post

  // Fetch bài đăng hình ảnh
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const data = await getUserPosts("image");
        setPosts(data);
      } catch (error) {
        console.error("Lỗi khi lấy bài đăng:", error);
      }
    };

    fetchPosts();
  }, [user]);

  return (
    <>
      <IsProfile
        profileId={user.id || user.username}
        fallback={
          <div className="flex flex-col justify-center items-center text-center">
            <div className="text-gray-400 mb-4">
              <Camera size={50} />
            </div>
            <h2 className="text-xl font-semibold">Chia sẻ ảnh</h2>
            <p className="text-gray-600">Theo dõi để xem hình ảnh</p>
          </div>
        }
      >
        <div className="mt-5">
          {!user.posts || user.posts.length === 0 ? (
            <div className="flex flex-col justify-center items-center text-center">
              <div className="text-gray-400 mb-4">
                <Camera size={50} />
              </div>
              <h2 className="text-xl font-semibold">Chia sẻ ảnh</h2>
              <p className="text-gray-600">
                Khi bạn chia sẻ ảnh, ảnh sẽ xuất hiện trên trang cá nhân
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {posts.map((post) => (
                <div key={post._id} className="relative aspect-square">
                  <Image
                    src={post.fileUrl}
                    alt="Post"
                    className="w-full h-full rounded-lg object-cover"
                    width={300}
                    height={300}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </IsProfile>
    </>
  );
}
