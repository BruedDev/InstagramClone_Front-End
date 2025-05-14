import { Settings } from "lucide-react";
import { User } from "@/types/user.type";
import IsProfile from "@/components/isProfile";
import styles from "../Infor/Infor.module.scss";
export default function Action({ user }: { user: User }) {
  return (
    <>
      <IsProfile
        profileId={user.id || user.username}
        fallback={
          <div className={styles.action_btn}>
            <button className={styles.edit}>Đang theo dõi</button>
            <button className={styles.viewArchive}>Nhắn tin</button>
            <span className={styles.settingIcon}>
              <Settings size={24} />
            </span>
          </div>
        }
      >
        <div className={styles.action_btn}>
          <button className={styles.edit}>Chỉnh sửa trang cá nhân</button>
          <button className={styles.viewArchive}>Xem kho lưu trữ</button>
          <span className={styles.settingIcon}>
            <Settings size={24} />
          </span>
        </div>
      </IsProfile>
    </>
  );
}
