import styles from "./HeaderProfile.module.scss";
import { User } from "@/types/user.type";
import { Lock, ChevronDown, MessageCircle, Plus, Menu } from "lucide-react";
import Link from "next/link";

export default function HeaderProfile({ user }: { user: User }) {
  return (
    <div className={styles.headerProfile}>
      <div className={styles.content}>
        <div className={styles.usernameContainer}>
          <Lock size={16} className={styles.lockIcon} />
          <h2 className={styles.username}>{user.username}</h2>
          {user.checkMark && (
            <svg
              aria-label="Đã xác minh"
              fill="rgb(0, 149, 246)"
              height="14"
              role="img"
              viewBox="0 0 40 40"
              width="14"
            >
              <title>Đã xác minh</title>
              <path
                d="M19.998 3.094 14.638 0l-2.972 5.15H5.432v6.354L0 14.64 3.094 20 0 25.359l5.432 3.137v5.905h5.975L14.638 40l5.36-3.094L25.358 40l3.232-5.6h6.162v-6.01L40 25.359 36.905 20 40 14.641l-5.248-3.03v-6.46h-6.419L25.358 0l-5.36 3.094Zm7.415 11.225 2.254 2.287-11.43 11.5-6.835-6.93 2.244-2.258 4.587 4.581 9.18-9.18Z"
                fill-rule="evenodd"
              ></path>
            </svg>
          )}
          <ChevronDown size={18} className={styles.chevronIcon} />
        </div>

        <div className={styles.actions}>
          <button className={styles.iconButton}>
            <Link href="/messages">
              <MessageCircle size={24} />
            </Link>
          </button>
          <button className={styles.iconButton}>
            <Plus size={24} />
          </button>
          <Link href="/setting" className={styles.menuButton}>
            <Menu size={24} />
          </Link>
        </div>
      </div>
    </div>
  );
}
