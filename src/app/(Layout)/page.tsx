"use client";

import { useEffect, useState, useContext } from "react"; // Bỏ useRef vì không tạo ref ở đây
import HomeUi from "../ui/Home";
import styles from "./Home.module.scss";
import Suggestions from "@/components/Suggestions";
import { getHomePosts } from "@/server/home";
import Image from "next/image";
import Link from "next/link";
import { useNavItems } from "@/app/hooks/useNavItems";
import { ScrollContainerContext } from "@/contexts/ScrollContainerContext"; // Đường dẫn tới context
import StoryUserHome from "@/components/StoryUserHome";

export default function Home() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [prevScrollY, setPrevScrollY] = useState(0);
  const [showHeader, setShowHeader] = useState(true);

  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  const actionStates = {
    "Thông báo": {
      isOpen: isNotificationsOpen,
      setIsOpen: setIsNotificationsOpen,
    },
  };

  const scrollableContainerRef = useContext(ScrollContainerContext); // Lấy ref từ context

  useEffect(() => {
    const scrollContainer = scrollableContainerRef?.current;

    if (!scrollContainer) return;

    const handleScroll = () => {
      const currentScrollY = scrollContainer.scrollTop;

      if (currentScrollY > prevScrollY && currentScrollY > 20) {
        setShowHeader(false);
      } else {
        setShowHeader(true);
      }
      setPrevScrollY(currentScrollY);
    };

    scrollContainer.addEventListener("scroll", handleScroll);

    return () => {
      scrollContainer.removeEventListener("scroll", handleScroll);
    };
  }, [prevScrollY, scrollableContainerRef]);

  const navItems = useNavItems(actionStates);
  const notificationItem = navItems.find((item) => item.label === "Thông báo");
  const messageItem = navItems.find((item) => item.label === "Tin nhắn");

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

  if (error) return <div>Lỗi: {error}</div>;

  return (
    <div className={styles.container}>
      <div className={`${styles.header} ${!showHeader ? styles.hidden : ""}`}>
        {/* ... header content ... */}
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
      <HomeUi posts={posts} loading={loading} />
      <Suggestions />
    </div>
  );
}
