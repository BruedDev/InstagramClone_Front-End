import styles from "./Infor.module.scss";
import { User } from "@/types/user.type";
import Action from "../Action";
import UserListModal from "@/components/FollwersAndFollowingModal";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/store";
import { useEffect, useState } from "react";
import { initializeFollowStatusForUser } from "@/store/followUnfollow";
import { getFollowersApi, getFollowingApi } from "@/server/user";

// Define UserListData type to match the data expected by UserListModal
interface UserListData {
  success: boolean;
  message: string;
  username: string;
  fullName: string;
  totalCount: number;
  realCount: number;
  displayedCount: number;
  users: FollowerUser[];
}

interface FollowerUser {
  _id: string;
  username: string;
  fullName: string;
  profilePicture: string;
  checkMark: boolean;
  isPrivate: boolean;
  isVirtual?: boolean;
}

interface GetFollowersResponse {
  success: boolean;
  message: string;
  username: string;
  fullName: string;
  totalFollowersCount: number;
  realFollowersCount: number;
  displayedFollowersCount: number;
  followers: FollowerUser[];
}

interface GetFollowingResponse {
  success: boolean;
  message: string;
  username: string;
  fullName: string;
  totalFollowingCount: number;
  realFollowingCount: number;
  displayedFollowingCount: number;
  following: FollowerUser[];
}

// Transform API response to match UserListModal format
const transformFollowersData = (apiResponse: GetFollowersResponse) => ({
  success: apiResponse.success,
  message: apiResponse.message,
  username: apiResponse.username,
  fullName: apiResponse.fullName,
  totalCount: apiResponse.totalFollowersCount,
  realCount: apiResponse.realFollowersCount,
  displayedCount: apiResponse.displayedFollowersCount,
  users: apiResponse.followers,
});

const transformFollowingData = (apiResponse: GetFollowingResponse) => ({
  success: apiResponse.success,
  message: apiResponse.message,
  username: apiResponse.username,
  fullName: apiResponse.fullName,
  totalCount: apiResponse.totalFollowingCount,
  realCount: apiResponse.realFollowingCount,
  displayedCount: apiResponse.displayedFollowingCount,
  users: apiResponse.following,
});

export default function Infor({ user }: { user: User }) {
  const dispatch = useDispatch();
  const [showFollowersModal, setShowFollowersModal] = useState(false);
  const [showFollowingModal, setShowFollowingModal] = useState(false);
  const [followersData, setFollowersData] = useState<UserListData | null>(null);
  const [followingData, setFollowingData] = useState<UserListData | null>(null);
  const [loading, setLoading] = useState(false);

  const followersCount = useSelector(
    (state: RootState) =>
      state.followUnfollow.followersCountMap[user._id] ||
      user.followersCount ||
      user.followers?.length ||
      0
  );

  const followingCount = useSelector(
    (state: RootState) =>
      state.followUnfollow.followingCountMap[user._id] ||
      user.followingCount ||
      user.following?.length ||
      0
  );

  const postCount =
    user.posts && Array.isArray(user.posts) ? user.posts.length : 0;

  // Initialize follow status when the component mounts or user changes
  useEffect(() => {
    if (user && typeof user.isFollowing === "boolean") {
      dispatch(
        initializeFollowStatusForUser({
          userId: user._id,
          isFollowing: user.isFollowing,
        })
      );
    }
  }, [dispatch, user]);

  // Fetch followers data
  const handleShowFollowers = async () => {
    if (followersCount === 0) return;

    setLoading(true);
    try {
      const response = await getFollowersApi(user._id);
      const transformedData = transformFollowersData(
        response as GetFollowersResponse
      );
      setFollowersData(transformedData);
      setShowFollowersModal(true);
    } catch (error) {
      console.error("Lỗi khi lấy danh sách followers:", error);
      // Có thể thêm toast notification ở đây
    } finally {
      setLoading(false);
    }
  };

  // Fetch following data
  const handleShowFollowing = async () => {
    if (followingCount === 0) return;

    setLoading(true);
    try {
      const response = await getFollowingApi(user._id);
      const transformedData = transformFollowingData(
        response as GetFollowingResponse
      );
      setFollowingData(transformedData);
      setShowFollowingModal(true);
    } catch (error) {
      console.error("Lỗi khi lấy danh sách following:", error);
      // Có thể thêm toast notification ở đây
    } finally {
      setLoading(false);
    }
  };

  const closeFollowersModal = () => {
    setShowFollowersModal(false);
    setFollowersData(null);
  };

  const closeFollowingModal = () => {
    setShowFollowingModal(false);
    setFollowingData(null);
  };

  // Format số followers
  const formatFollowersCount = (count: number) => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  return (
    <>
      <div className={styles.information}>
        <div className={styles.action}>
          <div className={styles.username}>
            {user.username}
            {user.checkMark && (
              <svg
                aria-label="Đã xác minh"
                fill="rgb(0, 149, 246)"
                height="18"
                role="img"
                viewBox="0 0 40 40"
                width="18"
              >
                <title>Đã xác minh</title>
                <path
                  d="M19.998 3.094 14.638 0l-2.972 5.15H5.432v6.354L0 14.64 3.094 20 0 25.359l5.432 3.137v5.905h5.975L14.638 40l5.36-3.094L25.358 40l3.232-5.6h6.162v-6.01L40 25.359 36.905 20 40 14.641l-5.248-3.03v-6.46h-6.419L25.358 0l-5.36 3.094Zm7.415 11.225 2.254 2.287-11.43 11.5-6.835-6.93 2.244-2.258 4.587 4.581 9.18-9.18Z"
                  fill-rule="evenodd"
                ></path>
              </svg>
            )}
          </div>
          <Action user={user} />
        </div>
        <div className={styles.stats}>
          <div className={styles.statItem}>
            <span className={styles.statValue}>{postCount}</span>
            <span>bài viết</span>
          </div>
          <div
            className={`${styles.statItem} ${
              followersCount > 0 ? styles.clickable : ""
            }`}
            onClick={handleShowFollowers}
            style={{ cursor: followersCount > 0 ? "pointer" : "default" }}
          >
            <span> {formatFollowersCount(followersCount)} người theo dõi</span>
          </div>
          <div
            className={`${styles.statItem} ${
              followingCount > 0 ? styles.clickable : ""
            }`}
            onClick={handleShowFollowing}
            style={{ cursor: followingCount > 0 ? "pointer" : "default" }}
          >
            <span>Đang theo dõi {followingCount} người</span>
          </div>
        </div>
        <div className={styles.fullName}>
          <h3>{user.fullName}</h3>
        </div>
        <div className={styles.bio}>
          <p>{user.bio}</p>
        </div>
      </div>

      {/* Followers Modal */}
      <UserListModal
        isOpen={showFollowersModal}
        onClose={closeFollowersModal}
        title="Người theo dõi"
        data={followersData}
        loading={loading}
        countLabel="người theo dõi"
        username={user.username}
      />

      {/* Following Modal */}
      <UserListModal
        isOpen={showFollowingModal}
        onClose={closeFollowingModal}
        title="Đang theo dõi"
        data={followingData}
        loading={loading}
        countLabel="đang theo dõi"
        username={user.username}
      />
    </>
  );
}
