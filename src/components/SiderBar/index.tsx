"use client";

import Image from "next/image";
import { useNavItems } from "@/app/hooks/useNavItems";
import styles from "./SiderBar.module.scss";
import Link from "next/link";
import { useState, useEffect } from "react";
import MoreMenu from "@/components/SeeMore";
import { usePathname } from "next/navigation";
import UploadPost from "../Modal/uploadPost";

export default function SiderBar() {
  const pathname = usePathname();
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const [isUploadPostOpen, setIsUploadPostOpen] = useState(false); // State cho UploadPost
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
      const shouldBeCollapsed =
        (pathname === "/setting" || pathname === "/messages") &&
        windowWidth >= 1264;

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

  // >>> THAY ĐỔI CHÍNH: Ẩn SiderBar nếu URL chứa "call-modal"
  if (pathname && pathname.includes("call-modal")) {
    return null; // Hoặc <></>
  }
  // <<< KẾT THÚC THAY ĐỔI CHÍNH

  return (
    <aside className={`${styles.sidebar} ${collapsed ? styles.collapsed : ""}`}>
      <div className={styles.logo}>
        <Link href="/">
          <Image
            src="/Images/logoLogin.png"
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
                href={item.href || "#"}
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
        {/* >>> LOGIC MODAL ĐƯỢC HOÀN LẠI NHƯ GỐC CỦA BẠN */}
        {navItems
          .filter(
            (item) => item.label === "Xem Thêm" || item.label === "Tạo Bài Viết"
          )
          .map((item, index) => {
            const icon = item.icon; // Trong code gốc, active state không được dùng cho icon ở mục này

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

                {/* Đây là cách bạn hiển thị modal ban đầu */}
                {isMoreMenuOpen && (
                  <MoreMenu onClose={() => setIsMoreMenuOpen(false)} />
                )}
                {isUploadPostOpen && (
                  <UploadPost onClose={() => setIsUploadPostOpen(false)} />
                )}
              </div>
            );
          })}
        {/* <<< KẾT THÚC PHẦN LOGIC MODAL ĐƯỢC HOÀN LẠI */}
      </nav>
    </aside>
  );
}
