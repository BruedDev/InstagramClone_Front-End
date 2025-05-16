"use client";

import { useEffect, useState } from "react";
import { suggestUsers } from "@/server/user";
import { UserIcon } from "lucide-react";
import styles from "./Suggestions.module.scss";
import Image from "next/image";

interface UserSuggestion {
  _id: string;
  username: string;
  fullName?: string;
  profilePicture?: string;
  checkMark: boolean;
}

export default function Suggestions() {
  const [suggestedUsers, setSuggestedUsers] = useState<UserSuggestion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSuggestions = async () => {
      try {
        const data = await suggestUsers();
        setSuggestedUsers(data.users);
      } catch (error) {
        console.error("Lỗi khi lấy danh sách gợi ý:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSuggestions();
  }, []);

  return (
    <div className={styles.suggestionsContainer}>
      <div className={styles.content}>
        <div className={styles.suggestionsHeader}>
          <span className={styles.suggestionsTitle}>Gợi ý cho bạn</span>
          <button className={styles.seeAllButton}>Xem tất cả</button>
        </div>

        <div className={styles.suggestionsList}>
          {loading ? (
            <p>Đang tải...</p>
          ) : (
            suggestedUsers.map((user) => (
              <div key={user._id} className={styles.suggestionItem}>
                <div className={styles.userAvatar}>
                  {user.profilePicture ? (
                    <Image
                      src={user.profilePicture}
                      alt={user.username}
                      width={32}
                      height={32}
                    />
                  ) : (
                    <UserIcon size={16} />
                  )}
                </div>
                <div className={styles.userInfo}>
                  <p className={`${styles.username} flex items-center gap-2`}>
                    {user.username}
                    {user.checkMark && (
                      <Image
                        src="/icons/checkMark/checkMark.png"
                        alt="Verified"
                        width={14}
                        height={14}
                        className={styles.checkMarkIcon}
                      />
                    )}
                  </p>
                  <p className={styles.suggestionText}>Gợi ý cho bạn</p>
                </div>
                <button className={styles.followButton}>Follow</button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
