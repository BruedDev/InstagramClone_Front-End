"use client";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { suggestUsers } from "@/server/user";
import { UserIcon } from "lucide-react";
import styles from "./Suggestions.module.scss";
import Image from "next/image";
import {
  toggleFollowState,
  initializeFollowStatusForUser,
  type FollowUnfollowSliceState,
} from "@/store/followUnfollow"; // Điều chỉnh path theo cấu trúc dự án
import type { AppDispatch } from "@/store"; // Import AppDispatch type from your store

interface UserSuggestion {
  _id: string;
  username: string;
  fullName?: string;
  profilePicture?: string;
  checkMark: boolean;
  isFollowing?: boolean; // Thêm field này nếu API trả về
}

// Type cho RootState - điều chỉnh theo cấu trúc store của bạn
interface RootState {
  followUnfollow: FollowUnfollowSliceState;
  // ... other slices
}

export default function Suggestions() {
  const [suggestedUsers, setSuggestedUsers] = useState<UserSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const dispatch = useDispatch<AppDispatch>();
  const { userActionStates } = useSelector(
    (state: RootState) => state.followUnfollow
  );

  useEffect(() => {
    const fetchSuggestions = async () => {
      try {
        const data = await suggestUsers();
        setSuggestedUsers(data.users);

        // Khởi tạo trạng thái follow cho các user được gợi ý
        data.users.forEach((user: UserSuggestion) => {
          dispatch(
            initializeFollowStatusForUser({
              userId: user._id,
              isFollowing: user.isFollowing || false, // Sử dụng data từ API hoặc mặc định false
            })
          );
        });
      } catch (error) {
        console.error("Lỗi khi lấy danh sách gợi ý:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSuggestions();
  }, [dispatch]);

  const handleFollowClick = async (userId: string) => {
    try {
      await dispatch(toggleFollowState(userId)).unwrap();
    } catch (error) {
      console.error("Lỗi khi thay đổi trạng thái follow:", error);
    }
  };

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
            suggestedUsers.map((user) => {
              const userActionState = userActionStates[user._id];
              const isFollowing = userActionState?.isFollowing || false;
              const isLoading = userActionState?.status === "loading";
              const hasError = userActionState?.status === "error";

              return (
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
                    {hasError && (
                      <p className={styles.errorText}>
                        {userActionState?.error}
                      </p>
                    )}
                  </div>
                  <button
                    className={`${styles.followButton} ${
                      isFollowing ? styles.following : ""
                    } ${isLoading ? styles.loading : ""}`}
                    onClick={() => handleFollowClick(user._id)}
                    disabled={isLoading}
                  >
                    {isLoading
                      ? "Đang xử lý..."
                      : isFollowing
                      ? "Đã theo dõi"
                      : "Theo dõi"}
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
