import styles from "@/components/Modal/Post/PostModal.module.scss";
import { Post } from "@/types/home.type";
import { CSSProperties } from "react";
import { useCount } from "@/app/hooks/useCount";
import { GoHeart, GoHeartFill } from "react-icons/go";
import { IoBookmarkOutline } from "react-icons/io5";
import Image from "next/image";
import { socketService } from "@/server/socket";
import { useEffect, useState, useCallback } from "react";
import { useUser } from "@/app/hooks/useUser";

interface InteractionButtonProps {
  post: Post;
  style?: CSSProperties;
  onClick?: (e: React.MouseEvent<HTMLButtonElement | HTMLDivElement>) => void;
  TotalHeart?: number;
  TotalComment?: number;
  isLiked?: boolean;
  onLikeRealtime?: (postId: string, isLike: boolean) => void;
}

export default function InteractionButton({
  post,
  style,
  onClick,
  TotalHeart,
  TotalComment,
  isLiked,
  onLikeRealtime,
}: InteractionButtonProps) {
  const { format } = useCount();
  const { user } = useUser();
  const [liked, setLiked] = useState(isLiked);
  const [totalLikes, setTotalLikes] = useState(TotalHeart || 0);

  // Lắng nghe realtime like
  useEffect(() => {
    const handlePostLiked = (data: {
      postId: string;
      userId: string;
      isLike: boolean;
      totalLikes: number;
    }) => {
      if (data.postId === post._id) {
        setTotalLikes(data.totalLikes);
        if (data.userId === user?._id) setLiked(data.isLike);
      }
    };
    socketService.onPostLiked(handlePostLiked);
    return () => socketService.offPostLiked(handlePostLiked);
  }, [post._id, user?._id]);

  // Khi props thay đổi (chuyển post), cập nhật lại state
  useEffect(() => {
    setLiked(isLiked);
    setTotalLikes(TotalHeart || 0);
  }, [isLiked, TotalHeart]);

  // Xử lý click like (optimistic UI + emit socket, không gọi API)
  const handleLike = useCallback(() => {
    if (!user?._id) return;
    if (liked) {
      setLiked(false);
      setTotalLikes((prev) => Math.max(prev - 1, 0));
      if (onLikeRealtime) onLikeRealtime(post._id, false);
    } else {
      setLiked(true);
      setTotalLikes((prev) => prev + 1);
      if (onLikeRealtime) onLikeRealtime(post._id, true);
    }
    socketService.emitPostLike({ postId: post._id, userId: user._id });
  }, [post._id, user?._id, liked, onLikeRealtime]);

  return (
    <div className={styles.interactionBar} style={{ width: "100%", ...style }}>
      <div className={styles.leftButtons}>
        <button className={styles.actionButton} onClick={handleLike}>
          {liked ? (
            <GoHeartFill size={26} style={{ color: "red" }} />
          ) : (
            <GoHeart size={26} />
          )}
          <span className={styles.count}>{format(totalLikes)}</span>
        </button>
        <button className={styles.actionButton} onClick={onClick}>
          <Image
            src="/icons/combo/comment.svg"
            alt="comment"
            width={22}
            height={22}
            style={{ color: "white" }}
          />
          {TotalComment && (
            <span className={styles.count}>{format(TotalComment)}</span>
          )}
        </button>
      </div>
      <button className={styles.actionButton}>
        <IoBookmarkOutline size={24} />
      </button>
    </div>
  );
}
