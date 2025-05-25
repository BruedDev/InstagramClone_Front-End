import styles from "@/components/Modal/PostModal.module.scss";
import { Post } from "@/types/home.type";
import { CSSProperties } from "react";
import { useCount } from "@/app/hooks/useCount";
import { GoHeart } from "react-icons/go";
import { IoBookmarkOutline } from "react-icons/io5";
import Image from "next/image";
// import { IoBookmark } from "react-icons/io5";

// GoHeartFill,
interface InteractionButtonProps {
  post: Post;
  style?: CSSProperties;
  onClick?: (e: React.MouseEvent<HTMLButtonElement | HTMLDivElement>) => void;
  heart?: number;
  comment?: number;
}

export default function InteractionButton({
  style,
  onClick,
  heart,
  comment,
}: InteractionButtonProps) {
  const { format } = useCount();

  return (
    <div className={styles.interactionBar} style={{ width: "100%", ...style }}>
      <div className={styles.leftButtons}>
        <button className={styles.actionButton}>
          <GoHeart size={26} />
          {heart && <span className={styles.count}>{format(heart)}</span>}
        </button>
        <button className={styles.actionButton} onClick={onClick}>
          <Image
            src="/icons/combo/comment.svg"
            alt="comment"
            width={22}
            height={22}
            style={{ color: "white" }}
          />
          {comment && <span className={styles.count}>{format(comment)}</span>}
        </button>
      </div>
      <button className={styles.actionButton}>
        <IoBookmarkOutline size={24} />
      </button>
    </div>
  );
}
