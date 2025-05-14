import { useState } from "react";
import { Grid, Bookmark, UserRound } from "lucide-react";
import styles from "../TabProfile/TabProfile.module.scss";
import { User } from "@/types/user.type";
import TabPosts from "./TabPosts";
import TabSaved from "./TabSaved";
import TabTagged from "./TabTagged";

export default function TabProfile({ user }: { user: User }) {
  // Trạng thái để theo dõi tab hiện tại
  const [activeTab, setActiveTab] = useState("posts");

  // Hàm chuyển tab
  const handleTabClick = (tab: string) => {
    setActiveTab(tab);
  };

  return (
    <>
      <div className={styles.tabContainer}>
        <div className={styles.tabs}>
          <div
            className={`${styles.tab} ${
              activeTab === "posts" ? styles.activeTab : ""
            }`}
            onClick={() => handleTabClick("posts")}
          >
            <span className={styles.tabIcon}>
              <Grid size={12} />
            </span>
            <span>BÀI VIẾT</span>
          </div>
          <div
            className={`${styles.tab} ${
              activeTab === "saved" ? styles.activeTab : ""
            }`}
            onClick={() => handleTabClick("saved")}
          >
            <span className={styles.tabIcon}>
              <Bookmark size={12} color="#a8a8a8" />
            </span>
            <span>ĐÃ LƯU</span>
          </div>
          <div
            className={`${styles.tab} ${
              activeTab === "tagged" ? styles.activeTab : ""
            }`}
            onClick={() => handleTabClick("tagged")}
          >
            <span className={styles.tabIcon}>
              <UserRound size={12} color="#a8a8a8" />
            </span>
            <span>ĐƯỢC GẮN THẺ</span>
          </div>
        </div>
      </div>

      {/* Hiển thị nội dung tùy theo tab được chọn */}
      {activeTab === "posts" && <TabPosts user={user} />}
      {activeTab === "saved" && <TabSaved />}
      {activeTab === "tagged" && <TabTagged />}
    </>
  );
}
