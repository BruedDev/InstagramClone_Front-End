"use client";

import { useEffect, useState } from "react";
import HomeUi from "../ui/Home";
import styles from "./Home.module.scss";
import Suggestions from "@/components/Suggestions";
import { getHomePosts } from "@/server/home";
import AddStory from "@/components/AddStory";
import Image from "next/image";
import Link from "next/link";
import { useNavItems } from "@/app/hooks/useNavItems";

export default function Home() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  // State cho auto-hide header
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  const actionStates = {
    "Thông báo": {
      isOpen: isNotificationsOpen,
      setIsOpen: setIsNotificationsOpen,
    },
  };

  const navItems = useNavItems(actionStates);

  const notificationItem = navItems.find((item) => item.label === "Thông báo");
  const messageItem = navItems.find((item) => item.label === "Tin nhắn");

  // Effect để handle scroll và auto-hide header
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      // Chỉ áp dụng trên mobile (màn hình <= 768px)
      if (window.innerWidth <= 768) {
        // Nếu scroll xuống và đã scroll hơn 50px
        if (currentScrollY > lastScrollY && currentScrollY > 50) {
          setIsHeaderVisible(false);
        }
        // Nếu scroll lên
        else if (currentScrollY < lastScrollY) {
          setIsHeaderVisible(true);
        }
        // Nếu ở đầu trang thì luôn hiện header
        else if (currentScrollY <= 10) {
          setIsHeaderVisible(true);
        }
      } else {
        // Trên desktop luôn hiện header
        setIsHeaderVisible(true);
      }

      setLastScrollY(currentScrollY);
    };

    // Throttle scroll event để tối ưu performance
    let ticking = false;
    const throttledScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", throttledScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", throttledScroll);
    };
  }, [lastScrollY]);

  useEffect(() => {
    async function fetchPosts() {
      try {
        setLoading(true);
        const postsData = await getHomePosts();
        setPosts(postsData);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    }

    fetchPosts();
  }, []);

  if (loading) return <div>Đang tải bài viết...</div>;
  if (error) return <div>Lỗi: {error}</div>;

  return (
    <div className={styles.container}>
      <div
        className={`${styles.header} ${
          isHeaderVisible ? styles.headerVisible : styles.headerHidden
        }`}
      >
        <div className={styles.headerContent}>
          <div className={styles.logo}>
            <Image src="/Images/logoLogin.png" alt="" width={100} height={50} />
          </div>
          <div className={styles.action}>
            {notificationItem && (
              <button
                onClick={notificationItem.onClick}
                title={notificationItem.label}
              >
                {notificationItem.active
                  ? notificationItem.ActiveIcon
                  : notificationItem.icon}
              </button>
            )}
            {messageItem && messageItem.href && (
              <Link href={messageItem.href} passHref legacyBehavior>
                <a title={messageItem.label} onClick={messageItem.onClick}>
                  {messageItem.active
                    ? messageItem.ActiveIcon
                    : messageItem.icon}
                </a>
              </Link>
            )}
          </div>
        </div>
      </div>
      <AddStory />
      <HomeUi posts={posts} />
      <Suggestions />
    </div>
  );
}
