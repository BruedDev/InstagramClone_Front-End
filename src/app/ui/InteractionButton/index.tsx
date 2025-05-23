import styles from "@/components/Modal/PostModal.module.scss";
import { Post } from "@/types/home.type";
import { Heart, MessageCircle, Bookmark } from "lucide-react";
import { CSSProperties } from "react";

interface InteractionButtonProps {
  post: Post;
  style?: CSSProperties; // Cho phép truyền style từ bên ngoài
  onClick?: (e: React.MouseEvent<HTMLButtonElement | HTMLDivElement>) => void;
}

export default function InteractionButton({
  // post,
  style,
  onClick,
}: InteractionButtonProps) {
  return (
    <div className={styles.interactionBar} style={{ width: "100%", ...style }}>
      <div className={styles.leftButtons}>
        <button className={styles.actionButton}>
          <Heart size={24} />
        </button>
        <button className={styles.actionButton} onClick={onClick}>
          <MessageCircle size={24} />
        </button>
      </div>
      <button className={styles.actionButton}>
        <Bookmark size={24} />
      </button>
    </div>
  );
}
