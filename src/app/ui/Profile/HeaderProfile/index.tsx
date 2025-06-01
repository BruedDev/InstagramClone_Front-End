import styles from "./HeaderProfile.module.scss";
import { User } from "@/types/user.type";
import { Lock, ChevronDown, MessageCircle, Plus, Menu } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function HeaderProfile({ user }: { user: User }) {
  return (
    <div className={styles.headerProfile}>
      <div className={styles.content}>
        <div className={styles.usernameContainer}>
          <Lock size={16} className={styles.lockIcon} />
          <h2 className={styles.username}>{user.username}</h2>
          {user.checkMark && (
            <Image
              src="/icons/checkMark/checkMark.png"
              alt="check mark"
              width={13}
              height={13}
              className={styles.checkMark}
            />
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
