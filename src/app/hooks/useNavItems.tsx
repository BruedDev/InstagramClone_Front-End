"use client";

import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import {
  House,
  Search,
  Compass,
  Clapperboard,
  MessageCircle,
  Heart,
  CirclePlus,
  Menu,
} from "lucide-react";
import { useUser } from "./useUser";

interface ActionStates {
  [label: string]: {
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
  };
}

export const useNavItems = (actionStates: ActionStates = {}) => {
  const pathname = usePathname();
  const [activeItem, setActiveItem] = useState<number | null>(null);

  useEffect(() => {
    setActiveItem(null);
  }, [pathname]);

  const { user, loading } = useUser();

  if (loading || !user) {
    return [];
  }

  const id = localStorage.getItem("username");

  const navItems = [
    {
      label: "Trang chủ",
      icon: <House color="#ffffff" strokeWidth={1.5} />,
      ActiveIcon: <House color="#ffffff" strokeWidth={3} />,
      href: "/",
      type: "link",
      className: "item1",
    },
    {
      label: "Khám phá",
      icon: <Compass color="#ffffff" strokeWidth={1.5} />,
      ActiveIcon: <Compass color="#ffffff" strokeWidth={3} />,
      href: "/explore",
      type: "link",
      className: "item2",
    },
    {
      label: "Reels",
      icon: <Clapperboard color="#ffffff" strokeWidth={1.5} />,
      ActiveIcon: <Clapperboard color="#ffffff" strokeWidth={3} />,
      href: "/reels",
      type: "link",
      className: "item3",
    },
    {
      label: "Tin nhắn",
      icon: <MessageCircle color="#ffffff" strokeWidth={1.5} />,
      ActiveIcon: <MessageCircle color="#ffffff" strokeWidth={3} />,
      href: "/messages",
      authOnly: true,
      type: "link",
      className: "item4",
    },
    {
      label: "Tìm kiếm",
      icon: <Search color="#ffffff" strokeWidth={1.5} />,
      ActiveIcon: <Search color="#ffffff" strokeWidth={3} />,
      type: "action",
      className: "item5",
    },
    {
      label: "Thông báo",
      icon: <Heart color="#ffffff" strokeWidth={1.5} />,
      ActiveIcon: <Heart color="#ffffff" strokeWidth={3} />,
      authOnly: true,
      type: "action",
      alert: true,
      className: "item6",
    },
    {
      label: "Tạo bài viết",
      icon: <CirclePlus color="#ffffff" strokeWidth={1.5} />,
      ActiveIcon: <CirclePlus color="#ffffff" strokeWidth={3} />,
      authOnly: true,
      type: "action",
      className: "item7",
    },
    {
      label: "Trang cá nhân",
      icon: user.profilePicture,
      href: `${id}`,
      type: "link",
      className: "avatar",
    },
    {
      label: "Xem Thêm",
      icon: <Menu color="#ffffff" strokeWidth={1.5} />,
      ActiveIcon: <Menu color="#ffffff" strokeWidth={3} />,
      type: "action",
      className: "item8",
    },
  ].map((item, index) => {
    const isAction = item.type === "action";
    let active = false;

    if (activeItem !== null) {
      active = index === activeItem;
    } else {
      active = item.href === pathname;
    }

    let onClick: (() => void) | undefined;

    if (isAction) {
      onClick = () => {
        setActiveItem(index);
        const state = actionStates[item.label];
        if (state) {
          state.setIsOpen(!state.isOpen);
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

  return navItems;
};
