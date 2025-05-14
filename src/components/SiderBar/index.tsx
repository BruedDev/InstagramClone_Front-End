"use client";

import Image from "next/image";
import { useNavItems } from "@/app/hooks/useNavItems";
import styles from "./SiderBar.module.scss";
import Link from "next/link";
import { useState, useEffect } from "react";
import MoreMenu from "@/components/SeeMore";
import { usePathname } from "next/navigation";

export default function SiderBar() {
  const pathname = usePathname();
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [windowWidth, setWindowWidth] = useState(0);

  // Handle window resize
  useEffect(() => {
    // Set initial window width
    setWindowWidth(window.innerWidth);

    // Update window width on resize
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  // Handle sidebar collapse based on pathname and window width
  useEffect(() => {
    // Only collapse if both conditions are met: pathname is "/setting" AND window width is >= 768px
    const shouldBeCollapsed = pathname === "/setting" && windowWidth >= 768;

    // Set the collapsed state
    setCollapsed(shouldBeCollapsed);

    // Update sessionStorage
    sessionStorage.setItem(
      "activeSider",
      shouldBeCollapsed ? "collapsed" : "expanded"
    );
  }, [pathname, windowWidth]);

  const actionStates = {
    "Xem Thêm": {
      isOpen: isMoreMenuOpen,
      setIsOpen: setIsMoreMenuOpen,
    },
  };

  const rawNavItems = useNavItems(actionStates);
  const navItems = Array.isArray(rawNavItems) ? rawNavItems : [];

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

        {/* Phần dưới: chỉ hiển thị "Xem Thêm" và đẩy nó xuống bằng class đặc biệt */}
        {navItems
          .filter((item) => item.label === "Xem Thêm")
          .map((item, index) => {
            const icon = item.icon;

            return (
              <div
                key={index}
                className={`${styles.navItemContainer} ${styles.bottomItem}`}
                style={{ position: "relative" }}
              >
                <button
                  onClick={item.onClick}
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
              </div>
            );
          })}
      </nav>
    </aside>
  );
}
