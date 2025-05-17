import { Post } from "@/types/home.type";
import Image from "next/image";
import { Heart, MessageCircle, Send, Bookmark } from "lucide-react";
import PostModal from "@/components/Modal/PostModal";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";

interface HomeUiProps {
  posts: Post[];
}

export default function HomeUi({ posts }: HomeUiProps) {
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentVideoTime, setCurrentVideoTime] = useState<number>(0);
  const videoRefs = useRef<{ [key: string]: HTMLVideoElement | null }>({});
  const postRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  // Theo dõi các video trong viewport để phát/dừng
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const postId = entry.target.getAttribute("data-post-id");
          if (!postId) return;

          const videoElement = videoRefs.current[postId];
          if (!videoElement) return;

          if (entry.isIntersecting) {
            // Phát video khi hiển thị trong viewport
            videoElement
              .play()
              .catch((err) => console.log("Autoplay prevented:", err));
          } else {
            // Dừng video khi không còn trong viewport
            videoElement.pause();
          }
        });
      },
      { threshold: 0.7 } // Ngưỡng hiển thị 70% của video trong viewport
    );

    // Đăng ký theo dõi tất cả các post
    Object.keys(postRefs.current).forEach((postId) => {
      const postElement = postRefs.current[postId];
      if (postElement) {
        observer.observe(postElement);
      }
    });

    return () => {
      // Cleanup khi component unmount
      observer.disconnect();
    };
  }, [posts]);

  const handlePostClick = (post: Post) => {
    return post;
  };

  const handleOpenComments = (post: Post, e: React.MouseEvent) => {
    e.stopPropagation();

    if (post.type === "video" && videoRefs.current[post._id]) {
      const videoElement = videoRefs.current[post._id];
      if (videoElement) {
        // Lưu thời gian hiện tại của video
        setCurrentVideoTime(videoElement.currentTime);
        // Dừng video
        videoElement.pause();
      }
    }

    setSelectedPost(post);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedPost(null);
    // Reset thời gian video khi đóng modal
    setCurrentVideoTime(0);
  };

  return (
    <div
      className="max-w-xl mx-auto space-y-8 bg-black font-sans"
      style={{ color: "#fff" }}
    >
      {posts.map((post) => (
        <div
          key={post._id}
          ref={(el) => {
            postRefs.current[post._id] = el;
            return undefined;
          }}
          data-post-id={post._id}
          className="border border-[#262626] rounded-md bg-black"
          onClick={() => handlePostClick(post)}
        >
          {/* Header: avatar + username + verified */}
          <div className="flex items-center gap-3 p-3">
            <Image
              src={post.author.profilePicture}
              alt={post.author.username}
              width={40}
              height={40}
              className="rounded-full object-cover"
            />
            <div className="flex items-center gap-2 font-semibold text-[#fafafa]">
              <Link
                href={`/${post.author.username}`}
                className={`flex items-center gap-2`}
              >
                <span
                  className="cursor-pointer hover:underline"
                  style={{ color: "#fff" }}
                >
                  {post.author.username}
                </span>
                {post.author.checkMark && (
                  <Image
                    src="/icons/checkMark/checkMark.png"
                    alt="Verified"
                    width={14}
                    height={14}
                  />
                )}
              </Link>
            </div>
          </div>

          {/* Media */}
          <div className="relative w-full aspect-square bg-black">
            {post.type === "image" ? (
              <Image
                src={post.fileUrl}
                alt={post.caption}
                fill
                className="object-cover"
              />
            ) : post.type === "video" ? (
              <video
                ref={(el) => {
                  videoRefs.current[post._id] = el;
                  return undefined;
                }}
                src={post.fileUrl}
                controls
                muted={false}
                playsInline
                className="w-full h-full object-cover"
                onClick={(e) => {
                  e.stopPropagation();
                }}
              />
            ) : null}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between px-3 py-2">
            <div className="flex items-center gap-4">
              <Heart
                size={24}
                className="cursor-pointer text-white hover:text-[#ed4956] transition-colors duration-200"
              />
              <MessageCircle
                size={24}
                className="cursor-pointer text-white hover:text-[#8e8e8e] transition-colors duration-200"
                onClick={(e) => handleOpenComments(post, e)}
              />
              <Send
                size={24}
                className="cursor-pointer text-white hover:text-[#8e8e8e] transition-colors duration-200"
              />
            </div>
            <Bookmark
              size={24}
              className="cursor-pointer text-white hover:text-[#8e8e8e] transition-colors duration-200"
            />
          </div>

          {/* Likes */}
          <div className="px-3 pb-1 font-semibold text-[#fafafa]">
            {post.likes.length.toLocaleString()} lượt thích
          </div>

          {/* Caption */}
          <div className="px-3 pb-2 text-[#dbdbdb]">
            <span className="font-semibold mr-2 text-[#fafafa] cursor-pointer hover:underline">
              {post.author.username}
            </span>
            <span>{post.caption}</span>
          </div>

          {/* Comments placeholder */}
          <div
            className="px-3 pt-1 pb-2 text-sm text-[#8e8e8e] cursor-pointer hover:underline"
            onClick={(e) => handleOpenComments(post, e)}
          >
            Xem tất cả {post.comments.length} bình luận
          </div>

          {/* Comment input */}
          <div className="border-t border-[#262626] px-3 py-2 flex items-center gap-3">
            <Image
              src={post.author.profilePicture}
              alt="avatar"
              width={28}
              height={28}
              className="rounded-full object-cover"
            />
            <input
              type="text"
              placeholder="Thêm bình luận..."
              className="flex-grow bg-transparent outline-none text-[#fafafa] placeholder-[#8e8e8e]"
            />
            <button
              className="text-[#0095f6] font-semibold disabled:opacity-50"
              disabled
            >
              Đăng
            </button>
          </div>
        </div>
      ))}
      {isModalOpen && selectedPost && (
        <PostModal
          post={selectedPost as Post}
          onClose={handleCloseModal}
          initialVideoTime={currentVideoTime}
        />
      )}
    </div>
  );
}
