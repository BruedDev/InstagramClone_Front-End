"use client";
import React, { useEffect } from "react";
import { Settings } from "lucide-react";
import { User } from "@/types/user.type";
import IsProfile from "@/components/isProfile";
import styles from "../Infor/Infor.module.scss";
import Link from "next/link";

// Redux imports
import { useSelector, useDispatch } from "react-redux";
import type { RootState, AppDispatch } from "@/store/index";
import {
  toggleFollowState,
  resetUserActionState,
  initializeFollowStatusForUser,
  UserActionState,
} from "@/store/followUnfollow";

export default function Action({ user }: { user: User }) {
  const dispatch = useDispatch<AppDispatch>();

  const userIdForAction = user._id;

  useEffect(() => {
    const currentUserId = localStorage.getItem("id");

    const isFollowing = user.followers?.includes(currentUserId ?? "");

    dispatch(
      initializeFollowStatusForUser({
        userId: userIdForAction,
        isFollowing: isFollowing,
      })
    );
  }, [dispatch, userIdForAction, user.followers]);

  const actionStateForThisUser = useSelector(
    (state: RootState) =>
      state.followUnfollow.userActionStates[userIdForAction] ||
      ({
        status: "idle",
        error: null,
        isFollowing: false,
      } as UserActionState)
  );

  useEffect(() => {
    if (userIdForAction) {
      dispatch(
        initializeFollowStatusForUser({
          userId: userIdForAction,
          isFollowing: !!user.following,
        })
      );
    }
  }, [dispatch, userIdForAction, user.following]);

  const displayAsFollowing = actionStateForThisUser.isFollowing;

  const handleToggleFollow = async () => {
    if (!userIdForAction || actionStateForThisUser.status === "loading") return;
    await dispatch(toggleFollowState(userIdForAction));
  };

  let followButtonText = "Theo dõi";
  let buttonClasses = `${styles.edit} ${styles.followButton}`;

  if (displayAsFollowing) {
    followButtonText = "Đang theo dõi";
    buttonClasses = `${styles.edit} ${styles.followingButton}`;
  }

  if (actionStateForThisUser.status === "loading") {
    followButtonText = displayAsFollowing ? "Đang hủy..." : "Đang theo dõi...";
    buttonClasses += ` ${styles.disabled}`;
  }

  return (
    <IsProfile
      profileId={user.username}
      fallback={
        <div className={styles.action_btn_wrapper}>
          <div className={styles.action_btn}>
            <button
              className={buttonClasses}
              onClick={handleToggleFollow}
              disabled={actionStateForThisUser.status === "loading"}
            >
              {followButtonText}
            </button>
            <button className={styles.viewArchive}>Nhắn tin</button>
          </div>
          {actionStateForThisUser.status === "error" &&
            actionStateForThisUser.error && (
              <div
                className={styles.errorMessageContainer}
                style={{ width: "100%", marginTop: "10px" }}
              >
                <p
                  style={{
                    color: "red",
                    fontSize: "0.9em",
                    textAlign: "center",
                    margin: 0,
                  }}
                >
                  {actionStateForThisUser.error}
                  <button
                    onClick={() =>
                      dispatch(resetUserActionState(userIdForAction))
                    }
                    style={{
                      marginLeft: "8px",
                      background: "none",
                      border: "1px solid grey",
                      padding: "2px 5px",
                      cursor: "pointer",
                      fontSize: "0.8em",
                    }}
                  >
                    Bỏ qua
                  </button>
                </p>
              </div>
            )}
        </div>
      }
    >
      <div className={styles.action_btn}>
        <button className={styles.edit}>Chỉnh sửa trang cá nhân</button>
        <button className={styles.viewArchive}>Xem kho lưu trữ</button>
        <Link href="/setting" className={styles.settingIcon}>
          <Settings size={24} />
        </Link>
      </div>
    </IsProfile>
  );
}
