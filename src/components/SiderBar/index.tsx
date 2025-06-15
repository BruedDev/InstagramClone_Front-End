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
      customAction: () => {
        setIsUploadPostOpen(true);
        handleOtherNavClick();
      },
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

  // Fallback nav items đầy đủ các mục chính
  const fallbackNavItems = [
    {
      label: "Trang chủ",
      href: "/",
      icon: (
        <svg
          aria-label="Trang chủ"
          fill="currentColor"
          height="24"
          viewBox="0 0 24 24"
          width="24"
        >
          <path
            d="M9.005 16.545a2.997 2.997 0 0 1 2.997-2.997A2.997 2.997 0 0 1 15 16.545V22h7V11.543L12 2 2 11.543V22h7.005Z"
            fill="none"
            stroke="currentColor"
            strokeLinejoin="round"
            strokeWidth="2"
          ></path>
        </svg>
      ),
      type: "link",
      className: "item1",
    },
    {
      label: "Tìm kiếm",
      icon: (
        <svg
          aria-label="Tìm kiếm"
          fill="currentColor"
          height="24"
          viewBox="0 0 24 24"
          width="24"
        >
          <path
            d="M19 10.5A8.5 8.5 0 1 1 10.5 2a8.5 8.5 0 0 1 8.5 8.5Z"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
          ></path>
          <line
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            x1="16.511"
            x2="22"
            y1="16.511"
            y2="22"
          ></line>
        </svg>
      ),
      type: "button",
      onClick: handleSearchClick,
      className: "item5",
    },
    {
      label: "Khám phá",
      href: "/explore",
      icon: (
        <svg
          aria-label="Khám phá"
          fill="currentColor"
          height="24"
          viewBox="0 0 24 24"
          width="24"
        >
          <polygon
            fill="none"
            points="13.941 13.953 7.581 16.424 10.06 10.056 16.42 7.585 13.941 13.953"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
          ></polygon>
          <polygon
            fillRule="evenodd"
            points="10.06 10.056 13.949 13.945 7.581 16.424 10.06 10.056"
          ></polygon>
          <circle
            cx="12.001"
            cy="12.005"
            fill="none"
            r="10.5"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
          ></circle>
        </svg>
      ),
      type: "link",
      className: "item2",
    },
    {
      label: "Reels",
      href: "/reels",
      icon: (
        <svg
          aria-label="Reels"
          fill="currentColor"
          height="24"
          viewBox="0 0 24 24"
          width="24"
        >
          <line
            fill="none"
            stroke="currentColor"
            strokeLinejoin="round"
            strokeWidth="2"
            x1="2.049"
            x2="21.95"
            y1="7.002"
            y2="7.002"
          ></line>
          <line
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            x1="13.504"
            x2="16.362"
            y1="2.001"
            y2="7.002"
          ></line>
          <line
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            x1="7.207"
            x2="10.002"
            y1="2.11"
            y2="7.002"
          ></line>
          <path
            d="M2 12.001v3.449c0 2.849.698 4.006 1.606 4.945.94.908 2.098 1.607 4.946 1.607h6.896c2.848 0 4.006-.699 4.946-1.607.908-.939 1.606-2.096 1.606-4.945V8.552c0-2.848-.698-4.006-1.606-4.945C19.454 2.699 18.296 2 15.448 2H8.552c-2.848 0-4.006.699-4.946 1.607C2.698 4.546 2 5.704 2 8.552Z"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
          ></path>
          <path
            d="M9.763 17.664a.908.908 0 0 1-.454-.787V11.63a.909.909 0 0 1 1.364-.788l4.545 2.624a.909.909 0 0 1 0 1.575l-4.545 2.624a.91.91 0 0 1-.91 0Z"
            fillRule="evenodd"
          ></path>
        </svg>
      ),
      type: "link",
      className: "item3",
    },
    {
      label: "Tin nhắn",
      href: "/messages",
      icon: (
        <svg width="24" height="24" fill="none" stroke="currentColor">
          <rect x="2" y="2" width="20" height="20" rx="5" strokeWidth="2" />
          <path d="M7 2v20M17 2v20" strokeWidth="2" />
        </svg>
      ),
      type: "link",
      className: "item4",
    },
    {
      label: "Thông báo",
      icon: (
        <svg width="24" height="24" fill="none" stroke="currentColor">
          <path
            d="M12 22s8-4 8-10V7a8 8 0 1 0-16 0v5c0 6 8 10 8 10z"
            strokeWidth="2"
          />
        </svg>
      ),
      type: "button",
      onClick: handleNotificationClick,
      className: "item6",
    },
    {
      label: "Tạo bài viết",
      icon: (
        <svg
          aria-label="Bài viết mới"
          fill="currentColor"
          height="24"
          viewBox="0 0 24 24"
          width="24"
        >
          <path
            d="M2 12v3.45c0 2.849.698 4.005 1.606 4.944.94.909 2.098 1.608 4.946 1.608h6.896c2.848 0 4.006-.7 4.946-1.608C21.302 19.455 22 18.3 22 15.45V8.552c0-2.849-.698-4.006-1.606-4.945C19.454 2.7 18.296 2 15.448 2H8.552c-2.848 0-4.006.699-4.946 1.607C2.698 4.547 2 5.703 2 8.552Z"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
          ></path>
          <line
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            x1="6.545"
            x2="17.455"
            y1="12.001"
            y2="12.001"
          ></line>
          <line
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            x1="12.003"
            x2="12.003"
            y1="6.545"
            y2="17.455"
          ></line>
        </svg>
      ),
      type: "button",
      onClick: () => setIsUploadPostOpen(true),
      className: "item7",
    },
    {
      label: "Trang cá nhân",
      href: "/profile",
      icon: (
        <svg width="24" height="24" fill="none" stroke="currentColor">
          <circle cx="12" cy="8" r="4" strokeWidth="2" />
          <path d="M2 20c0-4 8-6 10-6s10 2 10 6" strokeWidth="2" />
        </svg>
      ),
      type: "link",
      className: "avatar",
    },
    {
      label: "Xem Thêm",
      icon: (
        <svg width="24" height="24" fill="none" stroke="currentColor">
          <circle cx="12" cy="12" r="10" strokeWidth="2" />
          <path d="M8 12h8M12 8v8" strokeWidth="2" />
        </svg>
      ),
      type: "button",
      onClick: () => setIsMoreMenuOpen(true),
      className: "item8",
    },
  ];

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
          {/* Nếu navItems có dữ liệu thì render như cũ, nếu không thì render fallbackNavItems */}
          {(navItems.length > 0
            ? navItems.filter((item) => item.label !== "Xem Thêm")
            : fallbackNavItems
          ).map((item, index) => {
            // Chỉ dùng các property tĩnh cho fallbackNavItems
            const isActive =
              navItems.length > 0 &&
              "active" in item &&
              (item.active ||
                (item.label === "Tìm kiếm" && isSearchOpen) ||
                (item.label === "Thông báo" && isNotificationOpen));
            const icon =
              isActive && "ActiveIcon" in item && item.ActiveIcon
                ? item.ActiveIcon
                : item.icon;
            const className =
              navItems.length > 0 && "className" in item && item.className
                ? styles[item.className]
                : "";

            if (item.type === "link") {
              return (
                <Link
                  href={getAbsolutePath(item.href)}
                  key={index}
                  onClick={() => {
                    if (item.onClick) item.onClick();
                    handleOtherNavClick();
                  }}
                  className={`${styles.navItem} ${
                    isActive ? styles.active : ""
                  } ${className}`}
                  title={collapsed ? item.label : ""}
                >
                  {icon}
                  {!collapsed && <span>{item.label}</span>}
                </Link>
              );
            } else {
              return (
                <div
                  key={index}
                  className={styles.navItemContainer}
                  style={{ position: "relative" }}
                >
                  <button
                    onClick={item.onClick}
                    className={`${styles.navItem} ${
                      isActive ? styles.active : ""
                    } ${className}`}
                    title={collapsed ? item.label : ""}
                  >
                    {icon}
                    {!collapsed && <span>{item.label}</span>}
                  </button>
                </div>
              );
            }
          })}

          {/* Phần dưới: chỉ hiển thị "Xem Thêm" và "Tạo Bài Viết" nếu navItems có */}
          {navItems.length > 0 &&
            navItems
              .filter(
                (item) =>
                  item.label === "Xem Thêm" || item.label === "Tạo Bài Viết"
              )
              .map((item, index) => {
                const icon = item.icon;
                const className =
                  "className" in item && item.className
                    ? styles[item.className]
                    : "";
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
                        // Gọi onClick từ item nếu có
                        if (item.onClick) {
                          item.onClick();
                        }
                      }}
                      className={`${styles.navItem} ${className}`}
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
