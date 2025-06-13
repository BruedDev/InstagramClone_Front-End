"use client";

import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import HomeUi from "../ui/Home";
import styles from "./Home.module.scss";
import { getHomePosts } from "@/server/home";
import Image from "next/image";
import Link from "next/link";
import { useNavItems } from "@/app/hooks/useNavItems";
import StoryUserHome from "@/components/StoryUserHome";
import { usePostContext } from "@/contexts/PostContext";
import Suggestions from "@/components/Suggestions";
import MessengerPreview from "@/components/MessengerPreview";
import VirtualizedPostList from "@/components/VirtualizedPostList";
import { Post } from "@/types/home.type";
import PostModal from "@/components/Modal/Post/PostModal";
import { createPortal } from "react-dom";
import Comment from "../ui/Comment";
import { usePostSettingModal } from "../hooks/usePostSettingModal";
import SlidePanel from "@/components/SlidePanel"; // Import SlidePanel
import Notification from "@/components/Notification"; // Import Notification component

export default function Home() {
  const { posts, setPosts, handleLikeRealtime } = usePostContext();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [prevScrollY, setPrevScrollY] = useState(0);
  const [showHeader, setShowHeader] = useState(true);

  // Pagination states
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const limit = 15; // Tăng lên vì virtualization handle được nhiều hơn

  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentVideoTime, setCurrentVideoTime] = useState(0);
  const modalContainerRef = useRef<HTMLDivElement>(null);

  // --- Mobile view and comment modal states ---
  const [isMobileView, setIsMobileView] = useState(false);
  const [showMobileComment, setShowMobileComment] = useState(false);
  const [selectedPostForMobileComment, setSelectedPostForMobileComment] =
    useState<Post | null>(null);
  const [, setMobileVideoTime] = useState<number>(0);
  const [mobileCommentAnimationClass, setMobileCommentAnimationClass] =
    useState("");
  const [mobileOverlayAnimationClass, setMobileOverlayAnimationClass] =
    useState("");

  // Function to handle notification click
  const handleNotificationClick = () => {
    setIsNotificationsOpen(true);
  };

  const actionStates = {
    "Thông báo": {
      isOpen: isNotificationsOpen,
      setIsOpen: setIsNotificationsOpen,
      customAction: handleNotificationClick,
    },
  };

  // Header scroll handler - dùng window thay vì scrollableContainerRef
  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const currentScrollY = window.scrollY;

          // Ẩn/hiện header
          if (Math.abs(currentScrollY - prevScrollY) > 10) {
            if (currentScrollY > prevScrollY && currentScrollY > 20) {
              setShowHeader(false);
            } else {
              setShowHeader(true);
            }
            setPrevScrollY(currentScrollY);
          }
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [prevScrollY]);

  const navItems = useNavItems(actionStates);
  const notificationItem = navItems.find((item) => item.label === "Thông báo");
  const messageItem = navItems.find((item) => item.label === "Tin nhắn");

  // Load posts đầu tiên
  useEffect(() => {
    async function fetchPosts() {
      try {
        setLoading(true);
        const response = await getHomePosts(1, limit);
        setPosts(response.posts);
        setHasMore(response.hasMore);
        setPage(1);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    }
    fetchPosts();
  }, [setPosts, limit]);

  // Optimized load more với debouncing
  const loadMorePosts = useCallback(async () => {
    if (!hasMore || loadingMore || loading) return;

    try {
      setLoadingMore(true);
      const nextPage = page + 1;
      const response = await getHomePosts(nextPage, limit);

      // Sử dụng Set để filter nhanh hơn
      const existingIds = new Set(posts.map((post) => post._id));
      const newPosts = response.posts.filter(
        (post: { _id: string }) => !existingIds.has(post._id)
      );

      if (newPosts.length > 0) {
        setPosts((prev) => [...prev, ...newPosts]);
        setPage(nextPage);
      }

      setHasMore(response.hasMore);
    } catch (err) {
      console.error("Lỗi load more posts:", err);
    } finally {
      setLoadingMore(false);
    }
  }, [hasMore, loadingMore, loading, page, limit, posts, setPosts]);

  // Callback mở modal, truyền xuống HomeUi
  const handleOpenPostModal = (post: Post, videoTime = 0) => {
    setSelectedPost(post);
    setCurrentVideoTime(videoTime);
    setIsModalOpen(true);
  };
  const handleClosePostModal = () => {
    setIsModalOpen(false);
    setSelectedPost(null);
    setCurrentVideoTime(0);
  };

  // Memoized posts để tránh re-render không cần thiết
  const memoizedPosts = useMemo(() => posts, [posts]);

  useEffect(() => {
    const handleResize = () => {
      setIsMobileView(window.innerWidth <= 768);
    };
    if (typeof window !== "undefined") {
      handleResize();
      window.addEventListener("resize", handleResize);
    }
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("resize", handleResize);
      }
    };
  }, []);

  const handleOpenMobileComment = (post: Post, videoTime?: number) => {
    setSelectedPostForMobileComment(post);
    setMobileVideoTime(videoTime || 0);
    setShowMobileComment(true);

    // Bắt đầu animation
    setMobileOverlayAnimationClass("");
    setMobileCommentAnimationClass("");

    // Trigger animation sau khi component đã mount
    setTimeout(() => {
      setMobileOverlayAnimationClass("fadeIn");
      setMobileCommentAnimationClass("slideIn");
    }, 50);
  };

  const handleCloseMobileComment = () => {
    // Bắt đầu animation tắt
    setMobileOverlayAnimationClass("fadeOut");
    setMobileCommentAnimationClass("slideOut");

    // Sau khi animation xong mới unmount component
    setTimeout(() => {
      setShowMobileComment(false);
      setSelectedPostForMobileComment(null);
      setMobileVideoTime(0);
      setMobileOverlayAnimationClass("");
      setMobileCommentAnimationClass("");
    }, 400); // Match với transition duration
  };

  // Handle click outside để đóng comments
  const handleMobileOverlayClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    handleCloseMobileComment();
  };

  const postSettingModal = usePostSettingModal();

  // Khi modal mở, body không cuộn được
  useEffect(() => {
    if (isModalOpen || (isMobileView && showMobileComment)) {
      document.body.classList.add("modal-open");
    } else {
      document.body.classList.remove("modal-open");
    }
    return () => document.body.classList.remove("modal-open");
  }, [isModalOpen, isMobileView, showMobileComment]);

  if (error) return <div>Lỗi: {error}</div>;

  // Sửa renderPost để truyền callback mở PostSetting
  return (
    <div
      className={styles.container}
      style={isMobileView ? { marginBottom: 120 } : {}}
    >
      <div className={`${styles.header} ${!showHeader ? styles.hidden : ""}`}>
        <div className={styles.headerContent}>
          <div className={styles.logo}>
            <Image src="/Images/logoLogin.png" alt="" width={100} height={50} />
          </div>
          <div className={styles.action}>
            {notificationItem && (
              <button
                onClick={() => {
                  if (notificationItem.onClick) notificationItem.onClick();
                  handleNotificationClick();
                }}
                title={notificationItem.label}
              >
                {notificationItem.active
                  ? notificationItem.ActiveIcon
                  : notificationItem.icon}
              </button>
            )}
            {messageItem && messageItem.href && (
              <Link
                href={messageItem.href}
                title={messageItem.label}
                onClick={messageItem.onClick}
              >
                {messageItem.active ? messageItem.ActiveIcon : messageItem.icon}
              </Link>
            )}
          </div>
        </div>
      </div>

      <StoryUserHome />

      {/* Virtualized Posts */}
      {loading ? (
        <HomeUi
          loading={true}
          posts={[]}
          onLikeRealtime={handleLikeRealtime}
          isMobileView={isMobileView}
        />
      ) : (
        <VirtualizedPostList
          posts={memoizedPosts}
          renderPost={(post: Post) => (
            <HomeUi
              posts={[post]}
              loading={false}
              onLikeRealtime={handleLikeRealtime}
              onOpenPostModal={handleOpenPostModal}
              isMobileView={isMobileView}
              onOpenMobileComment={handleOpenMobileComment}
              onOpenPostSettings={postSettingModal.handleOpenPostSettings}
            />
          )}
          // itemHeight={600}
          overscan={2}
          onLoadMore={loadMorePosts}
          loading={loadingMore}
        />
      )}

      {loadingMore && (
        <div className="flex justify-center items-center py-6">
          <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
        </div>
      )}

      {/* End of posts indicator */}
      {!hasMore && posts.length > 0 && (
        <div style={{ textAlign: "center", padding: "20px", color: "#666" }}>
          Đã hiển thị tất cả bài viết
        </div>
      )}

      <Suggestions />
      <MessengerPreview />
      <div ref={modalContainerRef} />

      {/* Desktop PostModal */}
      {typeof window !== "undefined" &&
        isModalOpen &&
        selectedPost &&
        !isMobileView &&
        createPortal(
          <PostModal
            post={selectedPost}
            onClose={handleClosePostModal}
            initialVideoTime={currentVideoTime}
          />,
          document.body
        )}

      {/* Mobile Comment Modal - sử dụng Portal để render vào body */}
      {typeof window !== "undefined" &&
        isMobileView &&
        showMobileComment &&
        selectedPostForMobileComment &&
        createPortal(
          <>
            <div
              className={`${styles.mobileOverlay} ${styles[mobileOverlayAnimationClass]}`}
              onClick={handleMobileOverlayClick}
              style={{
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: "rgba(0, 0, 0, 0.8)",
                zIndex: 9999,
                opacity: mobileOverlayAnimationClass === "fadeIn" ? 1 : 0,
                transition: "opacity 0.3s ease-in-out",
              }}
            />
            <div
              style={{
                position: "fixed",
                bottom: 0,
                left: 0,
                right: 0,
                zIndex: 10000,
                transform:
                  mobileCommentAnimationClass === "slideIn"
                    ? "translateY(0)"
                    : "translateY(100%)",
                transition: "transform 0.4s cubic-bezier(0.25, 0.8, 0.25, 1)",
              }}
            >
              <Comment
                post={selectedPostForMobileComment}
                onClose={handleCloseMobileComment}
                animationClass={mobileCommentAnimationClass}
              />
            </div>
          </>,
          document.body
        )}

      {/* PostSetting Modal (hiển thị ở cha, cùng cấp với các modal khác) */}
      {postSettingModal.renderModal()}

      {/* Notification Panel */}
      <SlidePanel
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        type="notification"
      >
        <Notification />
      </SlidePanel>
    </div>
  );
}
