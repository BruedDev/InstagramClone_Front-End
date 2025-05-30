import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import styles from "./PostModal.module.scss";
import { X } from "lucide-react";
import { useTime } from "@/app/hooks/useTime";
import PostSetting from "./PostSetting";
import { deletePostById } from "@/server/posts";
import { Post } from "@/types/home.type";
import Comment from "@/app/ui/Comment";
import CommentInput from "@/app/ui/CommentInput";
import InteractionButton from "@/app/ui/InteractionButton";
import { BiDotsHorizontalRounded } from "react-icons/bi";
import { useCount } from "@/app/hooks/useCount";
import { usePostContext } from "@/contexts/PostContext";

type PostModalProps = {
  post: Post;
  onClose?: () => void;
  initialVideoTime?: number;
  detail?: boolean; // Prop mới để xác định chế độ detail
};

interface ReplyData {
  commentId: string;
  username: string;
  fullname?: string;
}

export default function PostModal({
  post,
  onClose,
  initialVideoTime = 0,
  detail = false, // Mặc định là false (chế độ modal)
}: PostModalProps) {
  const { fromNow } = useTime();
  const [showSettings, setShowSettings] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const previousUrl = useRef<string>("");
  const [replyTo, setReplyTo] = useState<ReplyData | null>(null);
  const [objectFit, setObjectFit] = useState<"contain" | "cover">("contain");
  const { format } = useCount();
  const { handleLikeRealtime, posts } = usePostContext();

  // Lấy post mới nhất từ context nếu có
  const currentPost = posts.find((p) => p._id === post._id) || post;

  // Function để xác định object-fit dựa trên tỷ lệ khung hình
  const determineObjectFit = (
    width: number,
    height: number
  ): "contain" | "cover" => {
    const aspectRatio = width / height;
    // Nếu tỷ lệ gần với hình vuông (0.8 - 1.2) thì dùng cover
    // Nếu hình rộng (> 1.2) hoặc hình dọc (< 0.8) thì dùng contain
    return aspectRatio >= 0.8 && aspectRatio <= 1.2 ? "cover" : "contain";
  };

  // Xử lý khi video được load để xác định object-fit
  const handleVideoLoadedMetadata = () => {
    if (videoRef.current) {
      const { videoWidth, videoHeight } = videoRef.current;
      const newObjectFit = determineObjectFit(videoWidth, videoHeight);
      setObjectFit(newObjectFit);
    }
  };

  // Xử lý khi image được load để xác định object-fit
  const handleImageLoad = (event: React.SyntheticEvent<HTMLImageElement>) => {
    const img = event.currentTarget;
    const newObjectFit = determineObjectFit(
      img.naturalWidth,
      img.naturalHeight
    );
    setObjectFit(newObjectFit);
  };

  // Thiết lập thời gian video khi component mount
  useEffect(() => {
    if (post.type === "video" && videoRef.current && initialVideoTime > 0) {
      videoRef.current.currentTime = initialVideoTime;
    }
  }, [post.type, initialVideoTime]);

  // Cập nhật URL khi modal mở (chỉ khi không phải chế độ detail)
  useEffect(() => {
    if (!detail) {
      // Lưu lại URL hiện tại trước khi thay đổi
      previousUrl.current = window.location.pathname;

      // Cập nhật URL mới với post ID
      const newUrl = `/post/${post._id}`;
      window.history.pushState({ path: newUrl }, "", newUrl);

      // Khi component unmount (modal đóng), khôi phục URL cũ
      return () => {
        window.history.replaceState(
          { path: previousUrl.current },
          "",
          previousUrl.current
        );
      };
    }
  }, [post._id, detail]);

  // Xử lý nút back của trình duyệt (chỉ khi không phải chế độ detail)
  useEffect(() => {
    if (!detail && onClose) {
      const handlePopState = () => {
        onClose();
      };

      window.addEventListener("popstate", handlePopState);

      return () => {
        window.removeEventListener("popstate", handlePopState);
      };
    }
  }, [onClose, detail]);

  // Toggle settings modal
  const toggleSettings = () => {
    setShowSettings(!showSettings);
  };

  const handleSettingAction = async (action: string) => {
    if (action === "delete") {
      try {
        await deletePostById(post._id); // Gọi API xóa bài viết
        setShowSettings(false);
        if (onClose) onClose(); // Đóng modal nếu có

        // Lấy username từ localStorage và chuyển hướng về trang profile
        const username = localStorage.getItem("username");
        if (username) {
          window.location.href = `http://localhost:3000/${username}`;
        } else {
          // Fallback nếu không có username trong localStorage
          window.location.href = "http://localhost:3000/";
        }
      } catch (error: unknown) {
        // Nếu muốn lấy message thì kiểm tra kiểu trước
        let message = "Lỗi không xác định";
        if (error instanceof Error) {
          message = error.message;
        }
        console.error("Xóa bài viết thất bại:", message);

        setShowSettings(false);
        if (onClose) onClose();
      }
    } else {
      setShowSettings(false); // Đóng modal settings nếu ko phải delete
    }
  };

  const handleReplySelect = (replyData: ReplyData) => {
    setReplyTo(replyData);
  };

  const handleReplyCancel = () => {
    setReplyTo(null);
  };

  // Render nội dung chính
  const renderContent = () => (
    <div className={styles.postContainer}>
      {/* Phần hình ảnh */}
      <div className={styles.imageContainer}>
        {post.type === "image" ? (
          <Image
            ref={imageRef}
            src={post.fileUrl}
            alt="Post"
            className={styles.postImage}
            layout="fill"
            objectFit={objectFit}
            onLoad={handleImageLoad}
          />
        ) : post.type === "video" ? (
          <video
            ref={videoRef}
            className={styles.postVideo}
            src={post.fileUrl}
            controls
            autoPlay={true}
            loop={false}
            muted={false}
            playsInline
            onLoadedMetadata={handleVideoLoadedMetadata}
            style={{
              width: "100%",
              height: "100%",
              objectFit: objectFit,
            }}
          />
        ) : null}
      </div>

      {/* Phần thông tin và tương tác */}
      <div className={styles.infoContainer}>
        {/* Header */}
        <div className={styles.postHeader}>
          <div className={styles.userInfo}>
            <div className={styles.avatarContainer}>
              {post.author?.profilePicture ? (
                <Image
                  src={post.author.profilePicture}
                  alt={post.author.profilePicture}
                  width={32}
                  height={32}
                  className={styles.avatar}
                />
              ) : (
                <div className={styles.defaultAvatar}></div>
              )}
            </div>
            <span className={styles.username}>{post.author?.username}</span>
          </div>
          <button className={styles.moreButton} onClick={toggleSettings}>
            <BiDotsHorizontalRounded size={24} />
          </button>
        </div>

        {/* Comments section */}
        <Comment post={currentPost} onReplySelect={handleReplySelect} />

        {/* Interaction buttons */}
        <InteractionButton
          post={currentPost}
          isLiked={currentPost.isLike}
          TotalHeart={currentPost.totalLikes}
          TotalComment={currentPost.totalComments}
          onLikeRealtime={handleLikeRealtime}
        />

        {/* Likes info */}
        <div className={styles.likesInfo}>
          {currentPost.totalLikes === 0 ? (
            <p>
              Hãy là người đầu tiên <strong>thích bài viết này</strong>
            </p>
          ) : (
            <span className={styles.alo}>
              {format(currentPost.totalLikes)} người thích
            </span>
          )}

          {currentPost.createdAt && (
            <p className={styles.timestamp}>{fromNow(currentPost.createdAt)}</p>
          )}
        </div>

        {/* Comment input */}
        <CommentInput
          post={currentPost}
          replyTo={replyTo}
          onReplyCancel={handleReplyCancel}
        />
      </div>
    </div>
  );

  // Nếu là chế độ detail, render trực tiếp nội dung
  if (detail) {
    return (
      <>
        {renderContent()}
        {/* Show Settings Modal when showSettings is true */}
        {showSettings && (
          <PostSetting
            onClose={() => setShowSettings(false)}
            onAction={handleSettingAction}
            profileId={post.author?.username}
          />
        )}
      </>
    );
  }

  // Nếu là chế độ modal, render với overlay và close button
  return (
    <div className={styles.modalOverlay}>
      <button className={styles.closeButton} onClick={onClose}>
        <X size={24} />
      </button>
      <div className={styles.modalContent}>{renderContent()}</div>

      {/* Show Settings Modal when showSettings is true */}
      {showSettings && (
        <PostSetting
          onClose={() => setShowSettings(false)}
          onAction={handleSettingAction}
          profileId={post.author?.username}
        />
      )}
    </div>
  );
}
