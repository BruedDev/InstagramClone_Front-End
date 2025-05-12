"use client";

import Image from "next/image";
import { useNavItems } from "@/app/hooks/useNavItems";
import styles from "./SiderBar.module.scss";
import Link from "next/link";
import { useState } from "react";
import MoreMenu from "@/components/SeeMore";

export default function SiderBar() {
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);

  const actionStates = {
    "Xem Thêm": {
      isOpen: isMoreMenuOpen,
      setIsOpen: setIsMoreMenuOpen,
    },
  };

  const rawNavItems = useNavItems(actionStates);
  const navItems = Array.isArray(rawNavItems) ? rawNavItems : [];

  return (
    <aside className={styles.sidebar}>
      <div className={styles.logo}>
        <Link href="/">
          <Image
            src="/Images/logoLogin.png"
            alt="Logo"
            width={120}
            height={40}
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
                className={`${styles.navItem} ${isActive ? styles.active : ""}`}
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
                    <span>{item.label}</span>
                  </>
                ) : (
                  <>
                    {icon}
                    <span>{item.label}</span>
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
                  }`}
                >
                  {icon}
                  <span>{item.label}</span>
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
                <button onClick={item.onClick} className={styles.navItem}>
                  {icon}
                  <span>{item.label}</span>
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
