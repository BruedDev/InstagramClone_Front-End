"use client";

import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";

import { GoHome, GoHomeFill, GoHeartFill, GoHeart } from "react-icons/go";
import { IoSearchOutline } from "react-icons/io5";
import { BsCompassFill } from "react-icons/bs";
import { SlCompass } from "react-icons/sl";
import { MdSlowMotionVideo, MdOutlineSlowMotionVideo } from "react-icons/md";
import { PiMessengerLogo } from "react-icons/pi";
import { RiMessengerFill } from "react-icons/ri";
import { IoAddCircleOutline, IoAddCircleSharp } from "react-icons/io5";
import { FiMenu } from "react-icons/fi";

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
      icon: <GoHome size={28} />,
      ActiveIcon: <GoHomeFill size={28} />,
      href: "/",
      type: "link",
      className: "item1",
    },
    {
      label: "Khám phá",
      icon: <SlCompass size={24} />,
      ActiveIcon: <BsCompassFill size={24} />,
      href: "/explore",
      type: "link",
      className: "item2",
    },
    {
      label: "Reels",
      icon: <MdOutlineSlowMotionVideo size={28} />,
      ActiveIcon: <MdSlowMotionVideo size={28} />,
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
      label: "Tìm kiếm",
      icon: <IoSearchOutline size={28} />,
      ActiveIcon: <IoSearchOutline size={28} />,
      type: "action",
      className: "item5",
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
      icon: <IoAddCircleOutline size={28} />,
      ActiveIcon: <IoAddCircleSharp size={28} />,
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
