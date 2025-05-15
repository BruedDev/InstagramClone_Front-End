import { useState } from "react";
import Image from "next/image";
import styles from "./PostModal.module.scss";
import { X, Heart, MessageCircle, Bookmark, Send, Smile } from "lucide-react";
import { useTime } from "@/app/hooks/useTime";
import PostSetting from "./PostSetting";
import { deletePostById } from "@/server/posts";

type Post = {
  _id: string;
  fileUrl: string;
  caption?: string;
  likes?: number;
  comments?: Array<{ _id: string; comment: string }>;
  createdAt?: string;
  author?: {
    username: string;
    profilePicture?: string;
  };
};

type PostModalProps = {
  post: Post;
  onClose: () => void;
};

export default function PostModal({ post, onClose }: PostModalProps) {
  const [comment, setComment] = useState("");
  const { fromNow } = useTime();
  const [showSettings, setShowSettings] = useState(false); // State to control settings modal

  const handleCommentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setComment(e.target.value);
  };

  const handleSubmitComment = (e: React.FormEvent) => {
    e.preventDefault();
    // Xử lý gửi bình luận
    setComment("");
  };

  // Toggle settings modal
  const toggleSettings = () => {
    setShowSettings(!showSettings);
  };

  const handleSettingAction = async (action: string) => {
    if (action === "delete") {
      try {
        await deletePostById(post._id); // Gọi API xóa bài viết
        setShowSettings(false);
        onClose(); // Đóng modal
        window.location.reload(); // Reload lại trang web
      } catch (error: unknown) {
        // Nếu muốn lấy message thì kiểm tra kiểu trước
        let message = "Lỗi không xác định";
        if (error instanceof Error) {
          message = error.message;
        }
        console.error("Xóa bài viết thất bại:", message);

        setShowSettings(false);
        onClose();
      }
    } else {
      console.log(`Selected action: ${action}`);
      setShowSettings(false); // Đóng modal settings nếu ko phải delete
    }
  };

  return (
    <div className={styles.modalOverlay}>
      <button className={styles.closeButton} onClick={onClose}>
        <X size={24} />
      </button>
      <div className={styles.modalContent}>
        <div className={styles.postContainer}>
          {/* Phần hình ảnh */}
          <div className={styles.imageContainer}>
            <Image
              src={post.fileUrl}
              alt="Post"
              className={styles.postImage}
              layout="fill"
              objectFit="contain"
            />
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
                <span>•••</span>
              </button>
            </div>

            {/* Comments section */}
            <div className={styles.commentsSection}>
              {post.comments && post.comments.length > 0 ? (
                <div className={styles.commentsList}>
                  {/* Comments would go here */}
                </div>
              ) : (
                <div className={styles.noComments}>
                  <h3>Chưa có bình luận nào.</h3>
                  <p>Bắt đầu trò chuyện.</p>
                </div>
              )}
            </div>

            {/* Interaction buttons */}
            <div className={styles.interactionBar}>
              <div className={styles.leftButtons}>
                <button className={styles.actionButton}>
                  <Heart size={24} />
                </button>
                <button className={styles.actionButton}>
                  <MessageCircle size={24} />
                </button>
                <button className={styles.actionButton}>
                  <Send size={24} />
                </button>
              </div>
              <button className={styles.actionButton}>
                <Bookmark size={24} />
              </button>
            </div>

            {/* Likes info */}
            <div className={styles.likesInfo}>
              <p>
                Hãy là người đầu tiên <strong>thích bài viết này</strong>
              </p>
              {post.createdAt && (
                <p className={styles.timestamp}>{fromNow(post.createdAt!)}</p>
              )}
            </div>

            {/* Comment input */}
            <form onSubmit={handleSubmitComment} className={styles.commentForm}>
              <button type="button" className={styles.emojiButton}>
                <Smile size={24} />
              </button>
              <input
                type="text"
                placeholder="Bình luận..."
                value={comment}
                onChange={handleCommentChange}
                className={styles.commentInput}
              />
              <button
                type="submit"
                className={`${styles.postButton} ${
                  comment.length > 0 ? styles.active : ""
                }`}
                disabled={comment.length === 0}
              >
                Đăng
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Show Settings Modal when showSettings is true */}
      {showSettings && (
        <PostSetting
          onClose={() => setShowSettings(false)}
          onAction={handleSettingAction}
        />
      )}
    </div>
  );
}
