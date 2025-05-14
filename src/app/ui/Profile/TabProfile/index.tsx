import { Grid, Bookmark, UserRound, Camera } from "lucide-react";
import styles from "../TabProfile/TabProfile.module.scss";

export default function TabProfile() {
  return (
    <>
      <div className={styles.tabContainer}>
        <div className={styles.tabs}>
          <div className={`${styles.tab} ${styles.activeTab}`}>
            <span className={styles.tabIcon}>
              <Grid size={12} />
            </span>
            <span>BÀI VIẾT</span>
          </div>
          <div className={styles.tab}>
            <span className={styles.tabIcon}>
              <Bookmark size={12} color="#a8a8a8" />
            </span>
            <span>ĐÃ LƯU</span>
          </div>
          <div className={styles.tab}>
            <span className={styles.tabIcon}>
              <UserRound size={12} color="#a8a8a8" />
            </span>
            <span>ĐƯỢC GẮN THẺ</span>
          </div>
        </div>
      </div>

      <div className={styles.emptyPosts}>
        <div className={styles.cameraIcon}>
          <Camera size={50} />
        </div>
        <h2 className={styles.shareTitle}>Chia sẻ ảnh</h2>
        <p className={styles.shareDescription}>
          Khi bạn chia sẻ ảnh, ảnh sẽ xuất hiện trên trang cá nhân
        </p>
      </div>
    </>
  );
}
