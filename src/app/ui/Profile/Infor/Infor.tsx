import styles from "./Infor.module.scss";
import { User } from "@/types/user.type";
import Image from "next/image";
import Action from "../Action";

export default function Infor({ user }: { user: User }) {
  return (
    <div className={styles.information}>
      <div className={styles.action}>
        <div className={styles.username}>
          {user.username}
          {user.checkMark && (
            <Image
              src="/icons/checkMark/checkMark.png"
              alt="check mark"
              width={15}
              height={15}
              className={styles.checkMark}
            />
          )}
        </div>
        <Action user={user} />
      </div>
      <div className={styles.stats}>
        <div className={styles.statItem}>
          <span className={styles.statValue}>{user.post || 0}</span>
          <span>bài viết</span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statValue}>
            {user.followers?.length || 0}
          </span>
          <span>người theo dõi</span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statValue}>
            {user.following?.length || 0}
          </span>
          <span>đang theo dõi</span>
        </div>
      </div>
      <div className={styles.fullName}>
        <strong>{user.fullName}</strong>
      </div>
    </div>
  );
}
