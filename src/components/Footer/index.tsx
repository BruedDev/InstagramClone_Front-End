"use client"; // Thêm dòng này để sử dụng hook usePathname

import React from "react";
import styles from "./Footer.module.scss";
import { usePathname } from "next/navigation"; // Import usePathname

interface FooterProps {
  type?: "login" | "home";
}

const Footer: React.FC<FooterProps> = ({ type = "home" }) => {
  const pathname = usePathname(); // Lấy pathname hiện tại

  // Nếu URL chứa "call-modal", không hiển thị Footer
  if (pathname && pathname.includes("call-modal")) {
    return null;
  }

  const footerLinks = [
    "Meta",
    "Giới thiệu",
    "Blog",
    "Việc làm",
    "Trợ giúp",
    "API",
    "Quyền riêng tư",
    "Điều khoản",
    "Vị trí",
    "Instagram Lite",
    "Threads",
    "Tải thông tin người liên hệ lên & người không phải người dùng",
  ];

  // Chọn class theo type
  const containerClass =
    type === "login" ? styles.container : styles["container-home"];

  return (
    <footer
      className={`flex flex-col justify-center items-center text-xs text-center py-4 px-4 ${containerClass}`}
    >
      <div className="flex flex-wrap justify-center gap-4 mb-4">
        {footerLinks.map((link, index) => (
          <a
            key={index}
            href="#" // Bạn có thể thay đổi href này cho phù hợp
            className="hover:underline"
            style={{ color: "#a9a9a9" }}
          >
            {link}
          </a>
        ))}
      </div>
      <div
        className="flex justify-center items-center gap-2"
        style={{ color: "#a9a9a9" }}
      >
        <span>Tiếng Việt</span>
        <span>© 2025 Instagram from Meta</span> {/* Cập nhật năm nếu cần */}
      </div>
    </footer>
  );
};

export default Footer;
