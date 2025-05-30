"use client";

import Image from "next/image";
import { useNavItems } from "@/app/hooks/useNavItems";
import styles from "./SiderBar.module.scss";
import Link from "next/link";
import { useState, useEffect } from "react";
import MoreMenu from "@/components/SeeMore";
import { usePathname } from "next/navigation";
import UploadPost from "../Modal/Post/UpLoadPost";

export default function SiderBar() {
  const pathname = usePathname();
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const [isUploadPostOpen, setIsUploadPostOpen] = useState(false);
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
      const shouldBeCollapsed =
        windowWidth <= 1264 ||
        ((pathname === "/setting" || pathname === "/messages") &&
          windowWidth > 1264);

      setCollapsed(shouldBeCollapsed);

      sessionStorage.setItem(
        "activeSider",
        shouldBeCollapsed ? "collapsed" : "expanded"
      );
    }
  }, [pathname, windowWidth]);

  const actionStates = {
    "Xem Thêm": {
      isOpen: isMoreMenuOpen,
      setIsOpen: setIsMoreMenuOpen,
    },
    "Tạo bài viết": {
      isOpen: isUploadPostOpen,
      setIsOpen: setIsUploadPostOpen,
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
    <aside className={`${styles.sidebar} ${collapsed ? styles.collapsed : ""}`}>
      <div className={styles.logo}>
        <Link href="/">
          <Image
            src={collapsed ? "/Images/instagram.png" : "/Images/logoLogin.png"}
            alt="Logo"
            width={collapsed ? 30 : 120}
            height={collapsed ? 30 : 40}
          />
        </Link>
      </div>

      <nav className={styles.nav}>
        {/* Phần trên: các item trừ Xem Thêm */}
        {navItems
          .filter((item) => item.label !== "Xem Thêm")
          .map((item, index) => {
            const isActive = item.active;
            const icon = isActive ? item.ActiveIcon : item.icon;

            return item.type === "link" ? (
              <Link
                href={getAbsolutePath(item.href)}
                key={index}
                onClick={item.onClick}
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
            (item) => item.label === "Xem Thêm" || item.label === "Tạo Bài Viết"
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
  );
}
