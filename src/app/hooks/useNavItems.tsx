"use client";

import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";

import { GoHeartFill, GoHeart } from "react-icons/go";
import { PiMessengerLogo } from "react-icons/pi";
import { RiMessengerFill } from "react-icons/ri";
import { FiMenu } from "react-icons/fi";

import { useUser } from "./useUser";

interface ActionStates {
  [label: string]: {
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
    customAction?: () => void;
  };
}

// Định nghĩa type cho nav item để luôn có các property cần thiết
export interface NavItem {
  label: string;
  icon: React.ReactNode;
  ActiveIcon?: React.ReactNode;
  href?: string;
  type: string;
  className?: string;
  active?: boolean;
  onClick?: () => void;
}

export const useNavItems = (actionStates: ActionStates = {}): NavItem[] => {
  const pathname = usePathname();
  const [activeItem, setActiveItem] = useState<number | null>(null);

  useEffect(() => {
    setActiveItem(null);
  }, [pathname]);

  const { user, loading } = useUser();

  if (loading) {
    // Trả về navItems với skeleton/avatar placeholder khi loading
    return [
      {
        label: "Trang chủ",
        icon: (
          <div
            className="skeleton-icon"
            style={{
              width: 24,
              height: 24,
              borderRadius: 4,
              background: "#333",
            }}
          ></div>
        ),
        ActiveIcon: (
          <div
            className="skeleton-icon"
            style={{
              width: 24,
              height: 24,
              borderRadius: 4,
              background: "#333",
            }}
          ></div>
        ),
        href: "/",
        type: "link",
        className: "item1",
      },
      {
        label: "Tìm kiếm",
        icon: (
          <div
            className="skeleton-icon"
            style={{
              width: 24,
              height: 24,
              borderRadius: 4,
              background: "#333",
            }}
          ></div>
        ),
        ActiveIcon: (
          <div
            className="skeleton-icon"
            style={{
              width: 24,
              height: 24,
              borderRadius: 4,
              background: "#333",
            }}
          ></div>
        ),
        type: "action",
        className: "item5",
      },
      {
        label: "Khám phá",
        icon: (
          <div
            className="skeleton-icon"
            style={{
              width: 24,
              height: 24,
              borderRadius: 4,
              background: "#333",
            }}
          ></div>
        ),
        ActiveIcon: (
          <div
            className="skeleton-icon"
            style={{
              width: 24,
              height: 24,
              borderRadius: 4,
              background: "#333",
            }}
          ></div>
        ),
        href: "/explore",
        type: "link",
        className: "item2",
      },
      {
        label: "Reels",
        icon: (
          <div
            className="skeleton-icon"
            style={{
              width: 24,
              height: 24,
              borderRadius: 4,
              background: "#333",
            }}
          ></div>
        ),
        ActiveIcon: (
          <div
            className="skeleton-icon"
            style={{
              width: 24,
              height: 24,
              borderRadius: 4,
              background: "#333",
            }}
          ></div>
        ),
        href: "/reels",
        type: "link",
        className: "item3",
      },
      {
        label: "Tin nhắn",
        icon: (
          <div
            className="skeleton-icon"
            style={{
              width: 28,
              height: 28,
              borderRadius: 6,
              background: "#333",
            }}
          ></div>
        ),
        ActiveIcon: (
          <div
            className="skeleton-icon"
            style={{
              width: 28,
              height: 28,
              borderRadius: 6,
              background: "#333",
            }}
          ></div>
        ),
        href: "/messages",
        type: "link",
        className: "item4",
      },
      {
        label: "Thông báo",
        icon: (
          <div
            className="skeleton-icon"
            style={{
              width: 26,
              height: 26,
              borderRadius: 6,
              background: "#333",
            }}
          ></div>
        ),
        ActiveIcon: (
          <div
            className="skeleton-icon"
            style={{
              width: 26,
              height: 26,
              borderRadius: 6,
              background: "#333",
            }}
          ></div>
        ),
        type: "action",
        className: "item6",
      },
      {
        label: "Tạo bài viết",
        icon: (
          <div
            className="skeleton-icon"
            style={{
              width: 24,
              height: 24,
              borderRadius: 4,
              background: "#333",
            }}
          ></div>
        ),
        ActiveIcon: (
          <div
            className="skeleton-icon"
            style={{
              width: 24,
              height: 24,
              borderRadius: 4,
              background: "#333",
            }}
          ></div>
        ),
        type: "action",
        className: "item7",
      },
      {
        label: "Trang cá nhân",
        icon: (
          <div
            className="skeleton-avatar"
            style={{
              width: 30,
              height: 30,
              borderRadius: "50%",
              background: "#444",
            }}
          ></div>
        ),
        href: "#",
        type: "link",
        className: "avatar",
      },
      {
        label: "Xem Thêm",
        icon: (
          <div
            className="skeleton-icon"
            style={{
              width: 24,
              height: 24,
              borderRadius: 4,
              background: "#333",
            }}
          ></div>
        ),
        ActiveIcon: (
          <div
            className="skeleton-icon"
            style={{
              width: 24,
              height: 24,
              borderRadius: 4,
              background: "#333",
            }}
          ></div>
        ),
        type: "action",
        className: "item8",
      },
    ] as NavItem[];
  }

  const id = localStorage.getItem("username");

  const navItems = [
    {
      label: "Trang chủ",
      icon: (
        <svg
          aria-label="Trang chủ"
          fill="currentColor"
          height="24"
          role="img"
          viewBox="0 0 24 24"
          width="24"
        >
          <title>Trang chủ</title>
          <path
            d="M9.005 16.545a2.997 2.997 0 0 1 2.997-2.997A2.997 2.997 0 0 1 15 16.545V22h7V11.543L12 2 2 11.543V22h7.005Z"
            fill="none"
            stroke="currentColor"
            stroke-linejoin="round"
            stroke-width="2"
          ></path>
        </svg>
      ),
      ActiveIcon: (
        <svg
          aria-label="Trang chủ"
          fill="currentColor"
          height="24"
          role="img"
          viewBox="0 0 24 24"
          width="24"
        >
          <title>Trang chủ</title>
          <path d="M22 23h-6.001a1 1 0 0 1-1-1v-5.455a2.997 2.997 0 1 0-5.993 0V22a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V11.543a1.002 1.002 0 0 1 .31-.724l10-9.543a1.001 1.001 0 0 1 1.38 0l10 9.543a1.002 1.002 0 0 1 .31.724V22a1 1 0 0 1-1 1Z"></path>
        </svg>
      ),
      href: "/",
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
          role="img"
          viewBox="0 0 24 24"
          width="24"
        >
          <title>Tìm kiếm</title>
          <path
            d="M19 10.5A8.5 8.5 0 1 1 10.5 2a8.5 8.5 0 0 1 8.5 8.5Z"
            fill="none"
            stroke="currentColor"
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
          ></path>
          <line
            fill="none"
            stroke="currentColor"
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            x1="16.511"
            x2="22"
            y1="16.511"
            y2="22"
          ></line>
        </svg>
      ),
      ActiveIcon: (
        <svg
          aria-label="Tìm kiếm"
          fill="currentColor"
          height="24"
          role="img"
          viewBox="0 0 24 24"
          width="24"
        >
          <title>Tìm kiếm</title>
          <path
            d="M18.5 10.5a8 8 0 1 1-8-8 8 8 0 0 1 8 8Z"
            fill="none"
            stroke="currentColor"
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="3"
          ></path>
          <line
            fill="none"
            stroke="currentColor"
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="3"
            x1="16.511"
            x2="21.643"
            y1="16.511"
            y2="21.643"
          ></line>
        </svg>
      ),
      type: "action",
      className: "item5",
    },
    {
      label: "Khám phá",
      icon: (
        <svg
          aria-label="Khám phá"
          fill="currentColor"
          height="24"
          role="img"
          viewBox="0 0 24 24"
          width="24"
        >
          <title>Khám phá</title>
          <polygon
            fill="none"
            points="13.941 13.953 7.581 16.424 10.06 10.056 16.42 7.585 13.941 13.953"
            stroke="currentColor"
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
          ></polygon>
          <polygon
            fill-rule="evenodd"
            points="10.06 10.056 13.949 13.945 7.581 16.424 10.06 10.056"
          ></polygon>
          <circle
            cx="12.001"
            cy="12.005"
            fill="none"
            r="10.5"
            stroke="currentColor"
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
          ></circle>
        </svg>
      ),
      ActiveIcon: (
        <svg
          aria-label="Khám phá"
          fill="currentColor"
          height="24"
          role="img"
          viewBox="0 0 24 24"
          width="24"
        >
          <title>Khám phá</title>
          <path d="m13.173 13.164 1.491-3.829-3.83 1.49ZM12.001.5a11.5 11.5 0 1 0 11.5 11.5A11.513 11.513 0 0 0 12.001.5Zm5.35 7.443-2.478 6.369a1 1 0 0 1-.57.569l-6.36 2.47a1 1 0 0 1-1.294-1.294l2.48-6.369a1 1 0 0 1 .57-.569l6.359-2.47a1 1 0 0 1 1.294 1.294Z"></path>
        </svg>
      ),
      href: "/explore",
      type: "link",
      className: "item2",
    },
    {
      label: "Reels",
      icon: (
        <svg
          aria-label="Reels"
          fill="currentColor"
          height="24"
          role="img"
          viewBox="0 0 24 24"
          width="24"
        >
          <title>Reels</title>
          <line
            fill="none"
            stroke="currentColor"
            stroke-linejoin="round"
            stroke-width="2"
            x1="2.049"
            x2="21.95"
            y1="7.002"
            y2="7.002"
          ></line>
          <line
            fill="none"
            stroke="currentColor"
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            x1="13.504"
            x2="16.362"
            y1="2.001"
            y2="7.002"
          ></line>
          <line
            fill="none"
            stroke="currentColor"
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            x1="7.207"
            x2="10.002"
            y1="2.11"
            y2="7.002"
          ></line>
          <path
            d="M2 12.001v3.449c0 2.849.698 4.006 1.606 4.945.94.908 2.098 1.607 4.946 1.607h6.896c2.848 0 4.006-.699 4.946-1.607.908-.939 1.606-2.096 1.606-4.945V8.552c0-2.848-.698-4.006-1.606-4.945C19.454 2.699 18.296 2 15.448 2H8.552c-2.848 0-4.006.699-4.946 1.607C2.698 4.546 2 5.704 2 8.552Z"
            fill="none"
            stroke="currentColor"
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
          ></path>
          <path
            d="M9.763 17.664a.908.908 0 0 1-.454-.787V11.63a.909.909 0 0 1 1.364-.788l4.545 2.624a.909.909 0 0 1 0 1.575l-4.545 2.624a.91.91 0 0 1-.91 0Z"
            fill-rule="evenodd"
          ></path>
        </svg>
      ),
      ActiveIcon: (
        <svg
          aria-label="Reels"
          fill="currentColor"
          height="24"
          role="img"
          viewBox="0 0 24 24"
          width="24"
        >
          <title>Reels</title>
          <path
            d="m12.823 1 2.974 5.002h-5.58l-2.65-4.971c.206-.013.419-.022.642-.027L8.55 1Zm2.327 0h.298c3.06 0 4.468.754 5.64 1.887a6.007 6.007 0 0 1 1.596 2.82l.07.295h-4.629L15.15 1Zm-9.667.377L7.95 6.002H1.244a6.01 6.01 0 0 1 3.942-4.53Zm9.735 12.834-4.545-2.624a.909.909 0 0 0-1.356.668l-.008.12v5.248a.91.91 0 0 0 1.255.84l.109-.053 4.545-2.624a.909.909 0 0 0 .1-1.507l-.1-.068-4.545-2.624Zm-14.2-6.209h21.964l.015.36.003.189v6.899c0 3.061-.755 4.469-1.888 5.64-1.151 1.114-2.5 1.856-5.33 1.909l-.334.003H8.551c-3.06 0-4.467-.755-5.64-1.889-1.114-1.15-1.854-2.498-1.908-5.33L1 15.45V8.551l.003-.189Z"
            fill-rule="evenodd"
          ></path>
        </svg>
      ),
      href: "/reels",
      type: "link",
      className: "item3",
    },
    {
      label: "Tin nhắn",
      icon: <PiMessengerLogo size={28} />,
      ActiveIcon: <RiMessengerFill size={28} />,
      href: "/messages",
      authOnly: true,
      type: "link",
      className: "item4",
    },

    {
      label: "Thông báo",
      icon: <GoHeart size={26} />,
      ActiveIcon: <GoHeartFill size={26} />,
      authOnly: true,
      type: "action",
      alert: true,
      className: "item6",
    },
    {
      label: "Tạo bài viết",
      icon: (
        <svg
          aria-label="Bài viết mới"
          fill="currentColor"
          height="24"
          role="img"
          viewBox="0 0 24 24"
          width="24"
        >
          <title>Bài viết mới</title>
          <path
            d="M2 12v3.45c0 2.849.698 4.005 1.606 4.944.94.909 2.098 1.608 4.946 1.608h6.896c2.848 0 4.006-.7 4.946-1.608C21.302 19.455 22 18.3 22 15.45V8.552c0-2.849-.698-4.006-1.606-4.945C19.454 2.7 18.296 2 15.448 2H8.552c-2.848 0-4.006.699-4.946 1.607C2.698 4.547 2 5.703 2 8.552Z"
            fill="none"
            stroke="currentColor"
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
          ></path>
          <line
            fill="none"
            stroke="currentColor"
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            x1="6.545"
            x2="17.455"
            y1="12.001"
            y2="12.001"
          ></line>
          <line
            fill="none"
            stroke="currentColor"
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            x1="12.003"
            x2="12.003"
            y1="6.545"
            y2="17.455"
          ></line>
        </svg>
      ),
      ActiveIcon: (
        <svg
          aria-label="Bài viết mới"
          fill="currentColor"
          height="24"
          role="img"
          viewBox="0 0 24 24"
          width="24"
        >
          <title>Bài viết mới</title>
          <path
            d="M2 12v3.45c0 2.849.698 4.005 1.606 4.944.94.909 2.098 1.608 4.946 1.608h6.896c2.848 0 4.006-.7 4.946-1.608C21.302 19.455 22 18.3 22 15.45V8.552c0-2.849-.698-4.006-1.606-4.945C19.454 2.7 18.296 2 15.448 2H8.552c-2.848 0-4.006.699-4.946 1.607C2.698 4.547 2 5.703 2 8.552Z"
            fill="none"
            stroke="currentColor"
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
          ></path>
          <line
            fill="none"
            stroke="currentColor"
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            x1="6.545"
            x2="17.455"
            y1="12.001"
            y2="12.001"
          ></line>
          <line
            fill="none"
            stroke="currentColor"
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            x1="12.003"
            x2="12.003"
            y1="6.545"
            y2="17.455"
          ></line>
        </svg>
      ),
      authOnly: true,
      type: "action",
      className: "item7",
    },
    {
      label: "Trang cá nhân",
      icon: user?.profilePicture || (
        <div
          className="skeleton-avatar"
          style={{
            width: 30,
            height: 30,
            borderRadius: "50%",
            background: "#444",
          }}
        ></div>
      ),
      href: `/${id}`,
      type: "link",
      className: "avatar",
    },
    {
      label: "Xem Thêm",
      icon: <FiMenu size={24} />,
      ActiveIcon: <FiMenu size={24} />,
      type: "action",
      className: "item8",
    },
  ].map((item, index) => {
    const isAction = item.type === "action";
    let active = false;

    if (activeItem !== null) {
      active = index === activeItem;
    } else {
      // Special logic for profile: active if pathname matches /[username]
      if (item.label === "Trang cá nhân" && pathname === `/${id}`) {
        active = true;
      } else {
        active = item.href === pathname;
      }
    }

    let onClick: (() => void) | undefined;

    if (isAction) {
      onClick = () => {
        setActiveItem(index);
        const state = actionStates[item.label];
        if (state) {
          // Nếu có customAction thì gọi nó
          if (state.customAction) {
            state.customAction();
          } else {
            state.setIsOpen(!state.isOpen);
          }
        } else {
          return;
        }
      };
    } else if (item.href) {
      onClick = () => {
        setActiveItem(null);
      };
    }

    return {
      ...item,
      active,
      onClick,
    };
  });

  return navItems as NavItem[];
};
