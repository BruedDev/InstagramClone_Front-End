import styles from "./HeaderProfile.module.scss";
import { User } from "@/types/user.type";
import { Lock, ChevronDown, CircleDollarSign, Plus, Menu } from "lucide-react";
import Image from "next/image";

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
              width={15}
              height={15}
              className={styles.checkMark}
            />
          )}
          <ChevronDown size={18} className={styles.chevronIcon} />
        </div>

        <div className={styles.actions}>
          <button className={styles.iconButton}>
            <CircleDollarSign size={24} />
          </button>
          <button className={styles.iconButton}>
            <Plus size={24} />
          </button>
          <button className={styles.menuButton}>
            <Menu size={24} />
          </button>
        </div>
      </div>
    </div>
  );
}
