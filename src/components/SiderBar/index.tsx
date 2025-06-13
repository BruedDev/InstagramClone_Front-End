"use client";

import Image from "next/image";
import { useNavItems } from "@/app/hooks/useNavItems";
import styles from "./SiderBar.module.scss";
import Link from "next/link";
import { useState, useEffect } from "react";
import MoreMenu from "@/components/SeeMore";
import { usePathname } from "next/navigation";
import UploadPost from "../Modal/Post/UpLoadPost";
import SlidePanel from "@/components/SlidePanel"; // Import SlidePanel
import Notification from "../Notification";

export default function SiderBar() {
  const pathname = usePathname();
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const [isUploadPostOpen, setIsUploadPostOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false); // New state for search
  const [isNotificationOpen, setIsNotificationOpen] = useState(false); // New state for notification
  const [collapsed, setCollapsed] = useState(false);
  const [windowWidth, setWindowWidth] = useState(0);

  // Handle window resize
  useEffect(() => {
    if (typeof window !== "undefined") {
      setWindowWidth(window.innerWidth);

      const handleResize = () => {
        setWindowWidth(window.innerWidth);
      };

      window.addEventListener("resize", handleResize);
      return () => {
        window.removeEventListener("resize", handleResize);
      };
    }
  }, []);

  // Handle sidebar collapse based on pathname and window width
  useEffect(() => {
    if (typeof window !== "undefined") {
      // Sidebar sẽ collapse khi:
      // 1. Window width <= 1264px (responsive design)
      // 2. HOẶC khi ở trang setting/messages với window width >= 1264px
      // 3. HOẶC khi search/notification panel đang mở
      const shouldBeCollapsed =
        windowWidth <= 1264 ||
        ((pathname === "/setting" || pathname === "/messages") &&
          windowWidth > 1264) ||
        isSearchOpen ||
        isNotificationOpen;

      setCollapsed(shouldBeCollapsed);

      sessionStorage.setItem(
        "activeSider",
        shouldBeCollapsed ? "collapsed" : "expanded"
      );
    }
  }, [pathname, windowWidth, isSearchOpen, isNotificationOpen]);

  // Đóng panel khi đổi pathname (route change)
  useEffect(() => {
    setIsSearchOpen(false);
    setIsNotificationOpen(false);
  }, [pathname]);

  // Function to handle search click (đóng notification nếu đang mở)
  const handleSearchClick = () => {
    setIsNotificationOpen(false);
    setIsSearchOpen(true);
    setCollapsed(true);
    sessionStorage.setItem("activeSider", "collapsed");
  };

  // Function to handle notification click (đóng search nếu đang mở)
  const handleNotificationClick = () => {
    setIsSearchOpen(false);
    setIsNotificationOpen(true);
    setCollapsed(true);
    sessionStorage.setItem("activeSider", "collapsed");
  };

  // Function to handle other nav clicks (expand sidebar)
  const handleOtherNavClick = () => {
    if (
      windowWidth > 1264 &&
      pathname !== "/setting" &&
      pathname !== "/messages" &&
      !isSearchOpen &&
      !isNotificationOpen
    ) {
      setCollapsed(false);
      sessionStorage.setItem("activeSider", "expanded");
    }
  };

  const actionStates = {
    "Xem Thêm": {
      isOpen: isMoreMenuOpen,
      setIsOpen: setIsMoreMenuOpen,
      customAction: handleOtherNavClick,
    },
    "Tạo bài viết": {
      isOpen: isUploadPostOpen,
      setIsOpen: setIsUploadPostOpen,
      customAction: handleOtherNavClick,
    },
    "Tìm kiếm": {
      isOpen: isSearchOpen,
      setIsOpen: setIsSearchOpen,
      customAction: handleSearchClick, // Updated action
    },
    "Thông báo": {
      isOpen: isNotificationOpen,
      setIsOpen: setIsNotificationOpen,
      customAction: handleNotificationClick, // Updated action
    },
  };

  const rawNavItems = useNavItems(actionStates);
  const navItems = Array.isArray(rawNavItems) ? rawNavItems : [];

  if (pathname && pathname.includes("call-modal")) {
    return null;
  }

  // Helper function to ensure absolute path
  const getAbsolutePath = (href: string | undefined) => {
    if (!href || href === "#") return "#";

    // Nếu href đã bắt đầu bằng '/', trả về như cũ
    if (href.startsWith("/")) return href;

    // Nếu không, thêm '/' vào đầu
    return `/${href}`;
  };

  return (
    <>
      <aside
        className={`${styles.sidebar} ${collapsed ? styles.collapsed : ""}`}
      >
        <div className={styles.logo}>
          <Link href="/">
            {collapsed ? (
              <Image
                src="/Images/instagram.png"
                alt="Logo"
                width={30}
                height={30}
              />
            ) : (
              <Image
                src="/Images/logoLogin.png"
                alt="Logo"
                width={120}
                height={40}
              />
            )}
          </Link>
        </div>

        <nav className={styles.nav}>
          {/* Phần trên: các item trừ Xem Thêm */}
          {navItems
            .filter((item) => item.label !== "Xem Thêm")
            .map((item, index) => {
              const isActive =
                item.active ||
                (item.label === "Tìm kiếm" && isSearchOpen) ||
                (item.label === "Thông báo" && isNotificationOpen);
              const icon = isActive ? item.ActiveIcon : item.icon;

              return item.type === "link" ? (
                <Link
                  href={getAbsolutePath(item.href)}
                  key={index}
                  onClick={() => {
                    if (item.onClick) item.onClick();
                    handleOtherNavClick();
                  }}
                  className={`${styles.navItem} ${
                    isActive ? styles.active : ""
                  } ${styles[item.className] || ""}`}
                  title={collapsed ? item.label : ""}
                >
                  {item.className === "avatar" ? (
                    <>
                      <Image
                        src={
                          typeof item.icon === "string"
                            ? item.icon
                            : "/default-avatar.png"
                        }
                        alt="Avatar"
                        width={30}
                        height={30}
                        className="rounded-full"
                      />
                      {!collapsed && <span>{item.label}</span>}
                    </>
                  ) : (
                    <>
                      {icon}
                      {!collapsed && <span>{item.label}</span>}
                    </>
                  )}
                </Link>
              ) : (
                <div
                  key={index}
                  className={styles.navItemContainer}
                  style={{ position: "relative" }}
                >
                  <button
                    onClick={item.onClick}
                    className={`${styles.navItem} ${
                      isActive ? styles.active : ""
                    } ${styles[item.className] || ""}`}
                    title={collapsed ? item.label : ""}
                  >
                    {icon}
                    {!collapsed && <span>{item.label}</span>}
                  </button>
                </div>
              );
            })}

          {/* Phần dưới: chỉ hiển thị "Xem Thêm" và "Tạo Bài Viết" */}
          {navItems
            .filter(
              (item) =>
                item.label === "Xem Thêm" || item.label === "Tạo Bài Viết"
            )
            .map((item, index) => {
              const icon = item.icon;

              return (
                <div
                  key={index}
                  className={`${styles.navItemContainer} ${styles.bottomItem}`}
                  style={{ position: "relative" }}
                >
                  <button
                    onClick={() => {
                      if (item.label === "Tạo Bài Viết") {
                        setIsUploadPostOpen(true);
                      }
                      if (item.label === "Xem Thêm") {
                        setIsMoreMenuOpen(true);
                      }
                    }}
                    className={`${styles.navItem} ${
                      styles[item.className] || ""
                    }`}
                    title={collapsed ? item.label : ""}
                  >
                    {icon}
                    {!collapsed && <span>{item.label}</span>}
                  </button>

                  {isMoreMenuOpen && (
                    <MoreMenu onClose={() => setIsMoreMenuOpen(false)} />
                  )}
                  {isUploadPostOpen && (
                    <UploadPost onClose={() => setIsUploadPostOpen(false)} />
                  )}
                </div>
              );
            })}
        </nav>
      </aside>

      {/* Search Panel */}
      <SlidePanel
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        type="search"
      >
        {/* Placeholder for Search Component - bạn sẽ tạo component riêng */}
        <div style={{ padding: "20px", color: "white" }}>
          <h2>Tìm kiếm</h2>
          <p>Search content will go here</p>
        </div>
      </SlidePanel>

      {/* Notification Panel */}
      <SlidePanel
        isOpen={isNotificationOpen}
        onClose={() => setIsNotificationOpen(false)}
        type="notification"
      >
        <Notification />
      </SlidePanel>
    </>
  );
}
