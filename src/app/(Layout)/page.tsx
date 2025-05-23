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

  const actionStates = {
    "Thông báo": {
      isOpen: isNotificationsOpen,
      setIsOpen: setIsNotificationsOpen,
    },
  };

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

  if (loading) return <div>Đang tải bài viết...</div>;
  if (error) return <div>Lỗi: {error}</div>;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
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
