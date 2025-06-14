import { Post } from "@/types/home.type";
import Image from "next/image";
import { useState, useRef, useEffect, memo } from "react";
import styles from "./Home.module.scss";
import InteractionButton from "../InteractionButton";
import CommentInput from "../CommentInput";
import ShortenCaption from "@/components/ShortenCaption";
import Comment from "../Comment";
import { useTime } from "@/app/hooks/useTime";
import { useCount } from "@/app/hooks/useCount";
import { BiDotsHorizontalRounded } from "react-icons/bi";
import { useStory } from "@/contexts/StoryContext";
import StoryAvatar from "@/components/Story/StoryAvatar";
import { usePostContext } from "@/contexts/PostContext";
import { socketService } from "@/server/socket";
import { useHandleUserClick } from "@/utils/useHandleUserClick";

type AuthorType = Post["author"];

interface HomeUiProps {
  loading: boolean;
  posts: Post[];
  onLikeRealtime: (postId: string, isLike: boolean) => void;
  onOpenPostModal?: (post: Post, videoTime?: number) => void;
}

// Skeleton Loading Component
const SkeletonPost = memo(() => (
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
        style={{ borderRadius: "8px" }}
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
));

SkeletonPost.displayName = "SkeletonPost";

// PostItem component được tách riêng để tối ưu
const PostItem = memo(
  ({
    post,
    onOpenComments,
    onOpenPostSettings,
    onAvatarClick,
    onUserClick,
    visiblePosts,
    videoRefs,
    postRefs,
    fromNow,
    format,
    handleLikeRealtime,
  }: {
    post: Post;
    onOpenComments: (post: Post, e: React.MouseEvent) => void;
    onOpenPostSettings: (post: Post, e: React.MouseEvent) => void;
    onAvatarClick: (author: AuthorType) => void;
    onUserClick: (username: string) => void;
    visiblePosts: string[];
    videoRefs: React.MutableRefObject<{
      [key: string]: HTMLVideoElement | null;
    }>;
    postRefs: React.MutableRefObject<{ [key: string]: HTMLDivElement | null }>;
    fromNow: (date: string) => string;
    format: (num: number) => string;
    handleLikeRealtime: (postId: string, isLike: boolean) => void;
  }) => {
    return (
      <div
        ref={(el) => {
          postRefs.current[post._id] = el;
          return undefined;
        }}
        data-post-id={post._id}
        className={`${styles.postItemResponsiveBg} border border-[#262626] rounded-md`}
      >
        <div className="flex items-center gap-3 p-3 justify-between">
          {/* Avatar */}
          <div
            onClick={() => onAvatarClick(post.author)}
            className="cursor-pointer"
          >
            {post.hasStories ? (
              <StoryAvatar
                author={post.author}
                hasStories={true}
                size="small"
              />
            ) : (
              <Image
                onClick={(e) => {
                  e.stopPropagation();
                  onUserClick(post.author.username);
                }}
                src={post.author.profilePicture}
                alt={post.author.username}
                width={40}
                height={40}
                className="rounded-full object-cover w-10 h-10"
                priority
              />
            )}
          </div>

          {/* Username & time */}
          <div className="flex flex-1 flex-col text-[#fafafa]">
            <div className="flex items-center gap-2 font-semibold text-white">
              <span
                className="hover:underline cursor-pointer flex items-center gap-1.5"
                onClick={(e) => {
                  e.stopPropagation();
                  onUserClick(post.author.username);
                }}
              >
                {post.author.username}

                {post.author.checkMark && (
                  <svg
                    aria-label="Đã xác minh"
                    fill="rgb(0, 149, 246)"
                    height="12"
                    role="img"
                    viewBox="0 0 40 40"
                    width="12"
                  >
                    <title>Đã xác minh</title>
                    <path
                      d="M19.998 3.094 14.638 0l-2.972 5.15H5.432v6.354L0 14.64 3.094 20 0 25.359l5.432 3.137v5.905h5.975L14.638 40l5.36-3.094L25.358 40l3.232-5.6h6.162v-6.01L40 25.359 36.905 20 40 14.641l-5.248-3.03v-6.46h-6.419L25.358 0l-5.36 3.094Zm7.415 11.225 2.254 2.287-11.43 11.5-6.835-6.93 2.244-2.258 4.587 4.581 9.18-9.18Z"
                      fillRule="evenodd"
                    ></path>
                  </svg>
                )}
              </span>
            </div>

            {/* Time - đặt dưới username */}
            <span className="text-sm text-[#8e8e8e] flex items-center">
              {fromNow(post.createdAt)}
            </span>
          </div>

          {/* PostSetting trigger button */}
          <button
            onClick={(e) => onOpenPostSettings(post, e)}
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
              style={{ borderRadius: "8px" }}
            />
          ) : post.type === "video" ? (
            <video
              ref={(el) => {
                videoRefs.current[post._id] = el;
                return undefined;
              }}
              src={post.fileUrl}
              className="w-full h-full object-cover"
              style={{ borderRadius: "8px" }}
              autoPlay={visiblePosts.includes(post._id)}
              muted={false}
              playsInline
              controls
              controlsList="nodownload noremoteplayback"
              onClick={(e) => e.stopPropagation()}
              onPlay={() => {
                const video = videoRefs.current[post._id];
                if (video) delete video.dataset.userPaused;
              }}
              onPause={() => {
                const video = videoRefs.current[post._id];
                if (
                  video &&
                  document.body.contains(video) &&
                  video.closest("[data-post-id]")
                ) {
                  video.dataset.userPaused = "true";
                }
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
            ) => onOpenComments(post, e)}
            TotalHeart={post.totalLikes}
            TotalComment={post.totalComments}
            isLiked={post.isLike}
            onLikeRealtime={handleLikeRealtime}
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
          <ShortenCaption text={post.caption} maxLines={2} className="w-full" />
        </div>
        <button
          className={`px-3 pt-1 pb-2 text-sm text-[#8e8e8e] cursor-pointer hover:underline ${styles.commentInput}`}
          onClick={(e) => onOpenComments(post, e)}
        >
          Xem tất cả {format(post.totalComments)} bình luận
        </button>

        <div className={styles.commentInput}>
          <CommentInput post={post} />
        </div>
      </div>
    );
  }
);

PostItem.displayName = "PostItem";

export default function HomeUi({
  loading,
  posts,
  onLikeRealtime,
  onOpenPostModal,
  isMobileView, // nhận từ cha
  onOpenMobileComment, // callback từ cha
  onOpenPostSettings, // thêm prop này
}: HomeUiProps & {
  isMobileView?: boolean;
  onOpenMobileComment?: (post: Post, videoTime?: number) => void;
  onOpenPostSettings?: (post: Post, e: React.MouseEvent) => void;
}) {
  const { setPosts } = usePostContext();
  // Restore local state for mobile comment modal logic
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [showComments, setShowComments] = useState(false);
  const [commentsAnimationClass, setCommentsAnimationClass] = useState("");
  const [overlayAnimationClass, setOverlayAnimationClass] = useState("");
  const videoRefs = useRef<{ [key: string]: HTMLVideoElement | null }>({});
  const postRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const [visiblePosts, setVisiblePosts] = useState<string[]>([]);
  const { fromNow } = useTime();
  const { format } = useCount();
  const handleUserClick = useHandleUserClick();
  const { openStory } = useStory();
  const isAnyModalOpen = useRef(false);

  const handleAvatarClick = async (author: AuthorType) => {
    await openStory(author, 0);
  };

  // Intersection Observer để quản lý autoplay video và visible posts
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        setVisiblePosts((prev) => {
          let changed = false;
          let newVisible = [...prev];
          entries.forEach((entry) => {
            const postId = entry.target.getAttribute("data-post-id");
            if (!postId) return;
            if (entry.isIntersecting) {
              if (!newVisible.includes(postId)) {
                newVisible.push(postId);
                changed = true;
              }
            } else {
              if (newVisible.includes(postId)) {
                newVisible = newVisible.filter((id) => id !== postId);
                changed = true;
              }
            }
          });
          return changed ? newVisible : prev;
        });

        // Handle video autoplay
        entries.forEach((entry) => {
          const postId = entry.target.getAttribute("data-post-id");
          if (!postId) return;
          const videoElement = videoRefs.current[postId];
          if (!videoElement) return;

          if (entry.isIntersecting) {
            if (videoElement.paused && !videoElement.dataset.userPaused) {
              videoElement
                .play()
                .catch((err) => console.log("Autoplay prevented:", err));
            }
          } else {
            if (!videoElement.paused) {
              videoElement.pause();
              videoElement.dataset.userPaused = "true";
            }
          }
        });
      },
      { threshold: 0.5 }
    );

    // Observe tất cả posts hiện tại
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

  // Quản lý video pause/play events
  useEffect(() => {
    Object.values(videoRefs.current).forEach(
      (video) => {
        if (video) {
          video.onpause = () => {
            if (
              document.body.contains(video) &&
              video.closest("[data-post-id]")
            ) {
              video.dataset.userPaused = "true";
            }
          };
          video.onplay = () => {
            delete video.dataset.userPaused;
          };
        }
      },
      [posts]
    );
  });

  // Socket events cho realtime updates
  useEffect(() => {
    if (posts && posts.length > 0) {
      posts.forEach((post) => {
        socketService.joinPostRoom(post._id);
      });

      return () => {
        posts.forEach((post) => {
          socketService.leavePostRoom(post._id);
        });
      };
    }
  }, [posts]);

  // Listen to comment created events
  useEffect(() => {
    const handleCommentCreated = (data: {
      itemId: string;
      totalComments?: number;
    }) => {
      setPosts((prev) =>
        prev.map((p) => {
          if (p._id === data.itemId && typeof data.totalComments === "number") {
            if (p.author?.username === "vanloc19_6") {
              return {
                ...p,
                totalComments:
                  data.totalComments > p.totalComments
                    ? p.totalComments + 1
                    : p.totalComments,
              };
            }
            return { ...p, totalComments: data.totalComments };
          }
          return p;
        })
      );
    };

    socketService.onCommentCreated(handleCommentCreated);
    return () => socketService.offCommentCreated(handleCommentCreated);
  }, [setPosts]);

  const handleOpenComments = (post: Post, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isMobileView && onOpenPostModal) {
      // Dừng tất cả video khi mở modal
      Object.values(videoRefs.current).forEach((video) => {
        if (video && !video.paused) video.pause();
      });
      isAnyModalOpen.current = true;
      if (post.type === "video" && videoRefs.current[post._id]) {
        const videoElement = videoRefs.current[post._id];
        if (videoElement) {
          onOpenPostModal(post, videoElement.currentTime);
          return;
        }
      }
      onOpenPostModal(post);
      return;
    }

    // Nếu là mobile thì gọi callback cha để mở comment modal
    if (isMobileView && onOpenMobileComment) {
      if (post.type === "video" && videoRefs.current[post._id]) {
        const videoElement = videoRefs.current[post._id];
        if (videoElement) {
          videoElement.pause();
          onOpenMobileComment(post, videoElement.currentTime);
          return;
        }
      }
      onOpenMobileComment(post);
      return;
    }

    // ...giữ lại logic cũ nếu cần cho fallback
    setSelectedPost(post);
    setShowComments(true);
    setOverlayAnimationClass("");
    setCommentsAnimationClass("");
    setTimeout(() => {
      setOverlayAnimationClass("fadeIn");
      setCommentsAnimationClass("slideIn");
    }, 10);
  };

  const handleCloseComments = () => {
    if (isMobileView) {
      setOverlayAnimationClass("fadeOut");
      setCommentsAnimationClass("slideOut");

      setTimeout(() => {
        setShowComments(false);
        setSelectedPost(null);
        setOverlayAnimationClass("");
        setCommentsAnimationClass("");
      }, 400);
    } else {
      setShowComments(false);
      setSelectedPost(null);
    }
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    handleCloseComments();
  };

  // Hiển thị skeleton khi đang loading
  if (loading) {
    return (
      <div
        className={`${styles.homeContainerResponsiveBg} max-w-xl mx-auto space-y-8 font-sans`}
        style={{ color: "#fff" }}
      >
        {[...Array(5)].map((_, index) => (
          <SkeletonPost key={`skeleton-${index}`} />
        ))}
      </div>
    );
  }

  return (
    <div
      className={`${styles.homeContainerResponsiveBg} max-w-xl mx-auto font-sans`}
      style={{ color: "#fff" }}
    >
      {posts.map((post) => (
        <div key={post._id} className="mb-0 sm:mb-8">
          <PostItem
            post={post}
            onOpenComments={handleOpenComments}
            onOpenPostSettings={
              onOpenPostSettings ? (p, e) => onOpenPostSettings(p, e) : () => {}
            }
            onAvatarClick={handleAvatarClick}
            onUserClick={handleUserClick}
            visiblePosts={visiblePosts}
            videoRefs={videoRefs}
            postRefs={postRefs}
            fromNow={fromNow}
            format={format}
            handleLikeRealtime={onLikeRealtime}
          />
        </div>
      ))}

      {/* Overlay và Comment component cho mobile - đã chuyển lên cha */}
      {!isMobileView && showComments && selectedPost && (
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
    </div>
  );
}
