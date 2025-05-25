import { Post } from "@/types/home.type";
import Image from "next/image";
import PostModal from "@/components/Modal/PostModal";
import PostSetting from "@/components/Modal/PostSetting"; // Import PostSetting
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import styles from "./Home.module.scss";
import InteractionButton from "../InteractionButton";
import CommentInput from "../CommentInput";
import ShortenCaption from "@/components/ShortenCaption";
import Comment from "../Comment";
import { useTime } from "@/app/hooks/useTime";
import { useCount } from "@/app/hooks/useCount";
import { BsDot } from "react-icons/bs";
import { BiDotsHorizontalRounded } from "react-icons/bi";
import { deletePostById } from "@/server/posts";

interface HomeUiProps {
  posts: Post[];
  loading: boolean;
}

export default function HomeUi({ posts, loading }: HomeUiProps) {
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentVideoTime, setCurrentVideoTime] = useState<number>(0);
  const videoRefs = useRef<{ [key: string]: HTMLVideoElement | null }>({});
  const postRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const [isMobileView, setIsMobileView] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [commentsAnimationClass, setCommentsAnimationClass] = useState("");
  const [overlayAnimationClass, setOverlayAnimationClass] = useState("");

  // States cho PostSetting
  const [showPostSettings, setShowPostSettings] = useState(false);
  const [selectedPostForSettings, setSelectedPostForSettings] =
    useState<Post | null>(null);

  const { fromNow } = useTime();
  const { format } = useCount();

  // console.log("posts", posts);

  useEffect(() => {
    const handleResize = () => {
      setIsMobileView(window.innerWidth <= 768);
    };

    if (typeof window !== "undefined") {
      handleResize(); // Kiểm tra kích thước ban đầu
      window.addEventListener("resize", handleResize);
    }

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("resize", handleResize);
      }
    };
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const postId = entry.target.getAttribute("data-post-id");
          if (!postId) return;

          const videoElement = videoRefs.current[postId];
          if (!videoElement) return;

          if (entry.isIntersecting) {
            videoElement
              .play()
              .catch((err) => console.log("Autoplay prevented:", err));
          } else {
            videoElement.pause();
          }
        });
      },
      { threshold: 0.7 }
    );

    Object.keys(postRefs.current).forEach((postId) => {
      const postElement = postRefs.current[postId];
      if (postElement) {
        observer.observe(postElement);
      }
    });

    return () => {
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
        setCurrentVideoTime(videoElement.currentTime);
        videoElement.pause();
      }
    }

    setSelectedPost(post);

    if (isMobileView) {
      setShowComments(true);
      setOverlayAnimationClass("");
      setCommentsAnimationClass("");

      // Trigger animation sau khi component đã mount
      setTimeout(() => {
        setOverlayAnimationClass("fadeIn");
        setCommentsAnimationClass("slideIn");
      }, 10);
    } else {
      // Nếu là desktop thì mở modal
      setIsModalOpen(true);
    }
  };

  const handleCloseComments = () => {
    if (isMobileView) {
      // Bắt đầu animation tắt
      setOverlayAnimationClass("fadeOut");
      setCommentsAnimationClass("slideOut");

      // Sau khi animation xong mới unmount component
      setTimeout(() => {
        setShowComments(false);
        setSelectedPost(null);
        setOverlayAnimationClass("");
        setCommentsAnimationClass("");
      }, 400); // Match với transition duration
    } else {
      setShowComments(false);
      setSelectedPost(null);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedPost(null);
    setCurrentVideoTime(0);
  };

  // Handle click outside để đóng comments
  const handleOverlayClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    handleCloseComments();
  };

  // Handlers cho PostSetting
  const handleOpenPostSettings = (post: Post, e: React.MouseEvent) => {
    e.stopPropagation(); // Ngăn chặn event bubbling
    setSelectedPostForSettings(post);
    setShowPostSettings(true);
  };

  const handleClosePostSettings = () => {
    setShowPostSettings(false);
    setSelectedPostForSettings(null);
  };

  const handlePostSettingAction = async (action: string) => {
    if (action === "delete" && selectedPostForSettings) {
      try {
        await deletePostById(selectedPostForSettings._id);
        // Refresh trang để cập nhật danh sách posts
        window.location.reload();
      } catch (error) {
        console.error("Xóa bài viết thất bại:", error);
      }
    }
  };

  // Skeleton Loading Component
  const SkeletonPost = () => (
    <div
      className={`${styles.postItemResponsiveBg} border border-[#262626] rounded-md`}
    >
      {/* Header skeleton */}
      <div className="flex items-center gap-3 p-3 justify-between">
        <div className="w-10 h-10 bg-gray-700 rounded-full animate-pulse"></div>
        <div className="flex flex-1 flex-col gap-2">
          <div className="flex items-center gap-2">
            <div className="w-24 h-4 bg-gray-700 rounded animate-pulse"></div>
            <div className="w-16 h-3 bg-gray-700 rounded animate-pulse"></div>
          </div>
        </div>
        <div className="w-6 h-6 bg-gray-700 rounded-full animate-pulse"></div>
      </div>

      {/* Media skeleton */}
      <div
        className={`${styles.mediaContainerResponsiveBg} relative w-full aspect-square`}
      >
        <div
          className="w-full h-full bg-gray-700 animate-pulse"
          style={{ borderRadius: "8px", margin: "2px" }}
        ></div>
      </div>

      {/* Interaction buttons skeleton */}
      <div
        className={`flex items-center justify-between px-3 py-3 ${styles.InteractionButtonContainer}`}
      >
        <div className="flex items-center gap-4">
          <div className="w-6 h-6 bg-gray-700 rounded animate-pulse"></div>
          <div className="w-6 h-6 bg-gray-700 rounded animate-pulse"></div>
          <div className="w-6 h-6 bg-gray-700 rounded animate-pulse"></div>
        </div>
        <div className="w-6 h-6 bg-gray-700 rounded animate-pulse"></div>
      </div>

      {/* Likes skeleton */}
      <div className={`px-3 pb-2 ${styles.commentInput}`}>
        <div className="w-20 h-4 bg-gray-700 rounded animate-pulse"></div>
      </div>

      {/* Caption skeleton */}
      <div className="px-3 pb-2">
        <div className="flex items-start gap-2">
          <div className="w-16 h-4 bg-gray-700 rounded animate-pulse"></div>
          <div className="flex-1">
            <div className="w-full h-4 bg-gray-700 rounded animate-pulse mb-1"></div>
            <div className="w-3/4 h-4 bg-gray-700 rounded animate-pulse"></div>
          </div>
        </div>
      </div>

      {/* Comments link skeleton */}
      <div className={`px-3 pt-1 pb-2 ${styles.commentInput}`}>
        <div className="w-32 h-3 bg-gray-700 rounded animate-pulse"></div>
      </div>

      {/* Comment input skeleton */}
      <div className={`px-3 pb-3 ${styles.commentInput}`}>
        <div className="w-full h-10 bg-gray-700 rounded animate-pulse"></div>
      </div>
    </div>
  );

  // Hiển thị skeleton khi đang loading
  if (loading) {
    return (
      <div
        className={`${styles.homeContainerResponsiveBg} max-w-xl mx-auto space-y-8 font-sans`}
        style={{ color: "#fff" }}
      >
        {/* Tạo 3-5 skeleton posts */}
        {[...Array(5)].map((_, index) => (
          <SkeletonPost key={index} />
        ))}
      </div>
    );
  }

  return (
    <div
      className={`${styles.homeContainerResponsiveBg} max-w-xl mx-auto space-y-8 font-sans`}
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
          className={`${styles.postItemResponsiveBg} border border-[#262626] rounded-md`}
          onClick={() => handlePostClick(post)}
        >
          <div className="flex items-center gap-3 p-3 justify-between">
            <Image
              src={post.author.profilePicture}
              alt={post.author.username}
              width={40}
              height={40}
              className="rounded-full object-cover"
            />
            <div className="flex flex-1 flex-col gap-2 font-semibold text-[#fafafa]">
              <Link
                href={`/${post.author.username}`}
                className="flex items-center gap-1 text-white"
              >
                <span className="cursor-pointer hover:underline">
                  {post.author.username}
                </span>

                {post.author.checkMark && (
                  <>
                    <Image
                      src="/icons/checkMark/checkMark.png"
                      alt="Verified"
                      width={14}
                      height={14}
                    />
                  </>
                )}

                <span className="text-sm text-[#8e8e8e] flex items-center">
                  <BsDot />
                  {fromNow(post.createdAt)}
                </span>
              </Link>
            </div>
            {/* PostSetting trigger button */}
            <button
              onClick={(e) => handleOpenPostSettings(post, e)}
              className="p-1 hover:bg-[#262626] rounded-full transition-colors"
            >
              <BiDotsHorizontalRounded size={24} />
            </button>
          </div>

          <div
            className={`${styles.mediaContainerResponsiveBg} relative w-full aspect-square`}
          >
            {post.type === "image" ? (
              <Image
                src={post.fileUrl}
                alt={post.caption}
                fill
                className="object-cover"
                style={{ borderRadius: "8px", padding: "2px" }}
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

          <div
            className={`flex items-center justify-between px-3 py-3 ${styles.InteractionButtonContainer}`}
          >
            <InteractionButton
              post={post}
              style={{
                padding: "0",
                borderTop: "none",
              }}
              onClick={(
                e: React.MouseEvent<HTMLButtonElement | HTMLDivElement>
              ) => handleOpenComments(post, e)}
              heart={post.totalLikes}
              comment={post.totalComments}
            />
          </div>

          <div
            className={`px-3 pb-2 font-semibold text-[#fafafa]  ${styles.commentInput}`}
          >
            {format(post.totalLikes)} lượt thích
          </div>

          <div className="px-3 pb-2 text-[#dbdbdb]">
            <span
              className={`font-semibold mr-2 text-[#fafafa] cursor-pointer hover:underline`}
            >
              {post.author.username}
            </span>
            <ShortenCaption
              text={post.caption}
              maxLines={2}
              className="w-full"
            />
          </div>
          <button
            className={`px-3 pt-1 pb-2 text-sm text-[#8e8e8e] cursor-pointer hover:underline ${styles.commentInput}`}
            onClick={(e) => handleOpenComments(post, e)}
          >
            Xem tất cả {format(post.totalComments)} bình luận
          </button>

          <div className={styles.commentInput}>
            <CommentInput post={post} />
          </div>
        </div>
      ))}

      {/* Overlay và Comment component cho mobile */}
      {showComments && selectedPost && isMobileView && (
        <>
          <div
            className={`${styles.mobileOverlay} ${styles[overlayAnimationClass]}`}
            onClick={handleOverlayClick}
          />
          <Comment
            post={selectedPost}
            onClose={handleCloseComments}
            animationClass={commentsAnimationClass}
          />
        </>
      )}

      {/* Modal cho desktop */}
      {isModalOpen && selectedPost && !isMobileView && (
        <PostModal
          post={selectedPost as Post}
          onClose={handleCloseModal}
          initialVideoTime={currentVideoTime}
        />
      )}

      {/* PostSetting Modal */}
      {showPostSettings && selectedPostForSettings && (
        <PostSetting
          onClose={handleClosePostSettings}
          onAction={handlePostSettingAction}
          profileId={selectedPostForSettings.author.username}
        />
      )}
    </div>
  );
}
