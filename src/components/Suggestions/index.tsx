"use client";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { suggestUsers } from "@/server/home";
import { UserIcon } from "lucide-react";
import styles from "./Suggestions.module.scss";
import Image from "next/image";
import {
  toggleFollowState,
  initializeFollowStatusForUser,
  type FollowUnfollowSliceState,
} from "@/store/followUnfollow";
import type { AppDispatch } from "@/store";
import { UserSuggestion } from "@/types/suggestion";
import { useUser } from "@/app/hooks/useUser";
import { useHandleUserClick } from "@/utils/useHandleUserClick";

interface RootState {
  followUnfollow: FollowUnfollowSliceState;
}

export default function Suggestions() {
  const [suggestedUsers, setSuggestedUsers] = useState<UserSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);
  const dispatch = useDispatch<AppDispatch>();
  const { userActionStates } = useSelector(
    (state: RootState) => state.followUnfollow
  );
  const { user } = useUser();
  const handleUserClick = useHandleUserClick();

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
              isFollowing: user.isFollowing || false,
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

  const handleToggleViewAll = () => {
    setShowAll(!showAll);
  };

  // Lọc ra những user gợi ý (không bao gồm user hiện tại)
  const filteredSuggestedUsers = suggestedUsers.filter(
    (suggestedUser) => suggestedUser._id !== user?._id
  );

  // Giới hạn hiển thị 5 người khi không showAll
  const displayedUsers = showAll
    ? filteredSuggestedUsers
    : filteredSuggestedUsers.slice(0, 5);

  return (
    <div className={styles.suggestionsContainer}>
      <div className={styles.content}>
        {user && (
          <div
            className={styles.suggestionItem}
            style={{ marginBottom: 2, marginTop: 30 }}
          >
            <div className={styles.userAvatar}>
              {user.profilePicture ? (
                <Image
                  onClick={() => handleUserClick(user.username)}
                  src={user.profilePicture}
                  alt={user.username}
                  width={44}
                  height={44}
                  style={{ borderRadius: "50%", cursor: "pointer" }}
                />
              ) : (
                <UserIcon size={32} />
              )}
            </div>
            <div className={styles.userInfo}>
              <p
                className={`${styles.username} flex items-center gap-2`}
                onClick={() => handleUserClick(user.username)}
              >
                <span
                  onClick={() => handleUserClick(user.username)}
                  style={{ cursor: "pointer" }}
                >
                  {user.username}
                </span>
                {user.checkMark && (
                  <svg
                    aria-label="Đã xác minh"
                    fill="rgb(0, 149, 246)"
                    height="12"
                    role="img"
                    viewBox="0 0 40 40"
                    width="12"
                  >
                    <title>Đã xác minh</title>
                    <path
                      d="M19.998 3.094 14.638 0l-2.972 5.15H5.432v6.354L0 14.64 3.094 20 0 25.359l5.432 3.137v5.905h5.975L14.638 40l5.36-3.094L25.358 40l3.232-5.6h6.162v-6.01L40 25.359 36.905 20 40 14.641l-5.248-3.03v-6.46h-6.419L25.358 0l-5.36 3.094Zm7.415 11.225 2.254 2.287-11.43 11.5-6.835-6.93 2.244-2.258 4.587 4.581 9.18-9.18Z"
                      fill-rule="evenodd"
                    ></path>
                  </svg>
                )}
              </p>
              <p
                onClick={() => handleUserClick(user.username)}
                style={{ cursor: "pointer" }}
                className={styles.suggestionText}
              >
                {user.fullName || ""}
              </p>
            </div>
            <button className={styles.followButton}>Chuyển</button>
          </div>
        )}

        <div className={styles.suggestionsHeader}>
          <span className={styles.suggestionsTitle}>Gợi ý cho bạn</span>
          {/* Chỉ hiển thị nút "Xem tất cả" khi có nhiều hơn 5 người và chưa showAll */}
          {filteredSuggestedUsers.length > 5 && !showAll && (
            <button
              className={styles.seeAllButton}
              onClick={handleToggleViewAll}
            >
              Xem tất cả
            </button>
          )}
        </div>

        <div className={styles.suggestionsList}>
          {loading ? (
            <p>Đang tải...</p>
          ) : (
            displayedUsers.map((user) => {
              const userActionState = userActionStates[user._id];
              const isFollowing = userActionState?.isFollowing || false;
              const isLoading = userActionState?.status === "loading";
              const hasError = userActionState?.status === "error";

              return (
                <div key={user._id} className={styles.suggestionItem}>
                  <div className={styles.userAvatar}>
                    {user.profilePicture ? (
                      <Image
                        onClick={() => handleUserClick(user.username)}
                        src={user.profilePicture}
                        alt={user.username}
                        width={32}
                        height={32}
                        style={{ cursor: "pointer" }}
                      />
                    ) : (
                      <UserIcon size={16} />
                    )}
                  </div>
                  <div className={styles.userInfo}>
                    <p
                      className={`${styles.username} flex items-center gap-2`}
                      onClick={() => handleUserClick(user.username)}
                    >
                      <span
                        onClick={() => handleUserClick(user.username)}
                        style={{ cursor: "pointer" }}
                      >
                        {user.username}
                      </span>
                      {user.checkMark && (
                        <Image
                          onClick={() => handleUserClick(user.username)}
                          style={{ cursor: "pointer" }}
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

        {/* Nút Hủy ở cuối danh sách khi đang showAll */}
        {showAll && filteredSuggestedUsers.length > 5 && (
          <div className={styles.cancelButtonContainer}>
            <button
              className={styles.cancelButton}
              onClick={handleToggleViewAll}
            >
              Hủy
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
