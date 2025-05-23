import Image from "next/image";
import { X, Loader2, Search } from "lucide-react";
import { useState, useEffect } from "react";
import styles from "./FollowersAndFollowing.module.scss";
import Link from "next/link";
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "@/store";
import { toggleFollowState } from "@/store/followUnfollow";

interface UserItem {
  _id: string;
  username: string;
  fullName: string;
  profilePicture: string;
  checkMark: boolean;
  isPrivate: boolean;
  isVirtual?: boolean;
}

interface UserListData {
  success: boolean;
  message: string;
  username: string;
  fullName: string;
  totalCount: number;
  realCount?: number;
  displayedCount?: number;
  users: UserItem[];
}

interface UserListModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  data: UserListData | null;
  loading: boolean;
  countLabel: string;
  username: string; // username của profile đang được xem
}

export default function UserListModal({
  isOpen,
  onClose,
  title,
  data,
  loading,
  username, // username của profile đang được xem
}: UserListModalProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUsername, setCurrentUsername] = useState<string | null>(null);
  const dispatch = useDispatch<AppDispatch>();

  // Get follow states from Redux
  const userActionStates = useSelector(
    (state: RootState) => state.followUnfollow.userActionStates
  );

  // Get current user info from localStorage
  useEffect(() => {
    const getCurrentUserInfo = () => {
      try {
        const userId = localStorage.getItem("id");
        const userUsername = localStorage.getItem("username");
        return { userId, userUsername };
      } catch (error) {
        console.error("Error getting current user info:", error);
        return { userId: null, userUsername: null };
      }
    };

    const { userId, userUsername } = getCurrentUserInfo();
    setCurrentUserId(userId);
    setCurrentUsername(userUsername);
  }, []);

  if (!isOpen) return null;

  // Determine if this is "Following" modal based on title
  const isFollowingModal = title === "Đang theo dõi";

  // Check if current user is the owner of the profile being viewed
  const isProfileOwner = currentUsername === username;

  // Handle follow/unfollow toggle for Following modal
  const handleToggleFollow = async (userId: string) => {
    try {
      await dispatch(toggleFollowState(userId)).unwrap();
    } catch (error) {
      console.error("Lỗi khi thay đổi trạng thái theo dõi:", error);
    }
  };

  // Filter users based on search term
  const filteredUsers =
    data?.users.filter(
      (user) =>
        user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.fullName.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

  return (
    <div
      className={`fixed inset-0 flex items-center justify-center z-50 p-4 ${styles.modal}`}
    >
      <div
        className={`${styles.modalContent} max-w-sm w-full max-h-[400px] flex flex-col`}
      >
        {/* Header */}
        <div
          className={`${styles.modalHeader} flex items-center justify-center relative px-4 py-3`}
        >
          <h3 className={`${styles.modalTitle} text-base font-semibold`}>
            {title}
          </h3>
          <button
            onClick={onClose}
            className={`${styles.closeButton} absolute right-4 p-1 rounded-full transition-colors duration-200`}
            aria-label="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col min-h-0">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 px-4">
              <Loader2
                className="w-8 h-8 animate-spin mb-3"
                style={{ color: "#8e8e8e" }}
              />
              <p className={styles.loadingText}>Đang tải...</p>
            </div>
          ) : data ? (
            <>
              {/* Search Bar */}
              <div className={`${styles.searchContainer} px-4 py-3`}>
                <div className="relative">
                  <Search
                    className={`${styles.searchIcon} absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4`}
                  />
                  <input
                    type="text"
                    placeholder="Tìm kiếm"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className={`${styles.searchInput} w-full pl-10 pr-4 py-2 rounded-lg text-sm transition-colors duration-200`}
                  />
                </div>
              </div>

              {/* Users List */}
              <div className={`${styles.usersList} flex-1 overflow-y-auto`}>
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((user, index) => {
                    const userActionState = userActionStates[user._id];
                    const isActionLoading =
                      userActionState?.status === "loading";

                    // Check if this user is the current logged-in user
                    const isCurrentUser =
                      currentUserId && user._id === currentUserId;

                    // Determine follow status for Following modal
                    // Initially user is following (since they appear in following list)
                    // But check Redux state for any changes
                    const isCurrentlyFollowing = isFollowingModal
                      ? userActionState?.isFollowing ?? true // Default true for following list
                      : undefined;

                    return (
                      <div
                        key={user._id || index}
                        className={`${styles.userItem} flex items-center px-4 py-2 transition-colors duration-150`}
                      >
                        {/* Avatar */}
                        <div className="flex-shrink-0 mr-3">
                          <div className="relative">
                            <Link href={`/${user.username}`}>
                              <Image
                                src={user.profilePicture}
                                alt={`${user.username} avatar`}
                                width={44}
                                height={44}
                                className={`${styles.avatar} rounded-full object-cover`}
                              />
                            </Link>
                          </div>
                        </div>

                        {/* User Info */}
                        <div className="flex-1 min-w-0 mr-3">
                          <Link href={`/${user.username}`}>
                            <div className="flex items-center mb-1">
                              <span
                                className={`${styles.username} font-medium text-sm truncate`}
                              >
                                {user.username}
                              </span>
                              {user.checkMark && (
                                <Image
                                  src="/icons/checkMark/checkMark.png"
                                  alt="verified"
                                  width={14}
                                  height={14}
                                  className="ml-1 flex-shrink-0"
                                />
                              )}
                            </div>
                            <p
                              className={`${styles.fullName} text-sm truncate`}
                            >
                              {user.fullName}
                            </p>
                          </Link>
                        </div>

                        {/* Action Button */}
                        <div className="flex-shrink-0">
                          {!isCurrentUser && (
                            <>
                              {isFollowingModal ? (
                                // Following modal - show dynamic follow/unfollow button (always visible for non-current users)
                                <button
                                  onClick={() => handleToggleFollow(user._id)}
                                  disabled={isActionLoading}
                                  className={`${styles.removeButton} px-4 py-1.5 rounded-md text-sm font-medium transition-colors duration-200`}
                                >
                                  {isActionLoading ? (
                                    <div className="flex items-center">
                                      <Loader2 className="w-3 h-3 animate-spin mr-1" />
                                      <span>Đang xử lý...</span>
                                    </div>
                                  ) : isCurrentlyFollowing ? (
                                    "Đang theo dõi"
                                  ) : (
                                    "Theo dõi"
                                  )}
                                </button>
                              ) : (
                                // Followers modal - show "Xóa" button only if user is profile owner
                                isProfileOwner && (
                                  <button
                                    className={`${styles.removeButton} px-4 py-1.5 rounded-md text-sm font-medium transition-colors duration-200`}
                                  >
                                    Xóa
                                  </button>
                                )
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 px-4">
                    <Search
                      className="w-12 h-12 mb-3"
                      style={{ color: "#8e8e8e" }}
                    />
                    <p className={styles.noResultsText}>
                      {searchTerm
                        ? `Không tìm thấy "${searchTerm}"`
                        : "Không có kết quả"}
                    </p>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 px-4">
              <div className="mb-3">
                <X className="w-12 h-12" style={{ color: "#8e8e8e" }} />
              </div>
              <p className={styles.errorText}>Không thể tải danh sách</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
