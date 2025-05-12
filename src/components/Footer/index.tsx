import React from "react";
import styles from "./Footer.module.scss";

const Footer: React.FC = () => {
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

  return (
    <footer
      className={`flex flex-col justify-center items-center text-xs min-h-[20vh] bg-black text-center py-4 px-4 ${styles.container}`}
    >
      <div className="flex flex-wrap justify-center gap-4 mb-4">
        {footerLinks.map((link, index) => (
          <a
            key={index}
            href="#"
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
        <span>© 2025 Instagram from Meta</span>
      </div>
    </footer>
  );
};

export default Footer;
