"use client";

import { useEffect, useRef } from "react";
import { Settings, Activity, Bookmark, Moon, FileWarning } from "lucide-react";
import { useRouter } from "next/navigation";
import { logout } from "@/server/auth";

export default function MoreMenu({ onClose }: { onClose: () => void }) {
  const modalRef = useRef(null);
  const router = useRouter();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        modalRef.current &&
        !(modalRef.current as HTMLElement).contains(event.target as Node)
      ) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onClose]);

  const handleLogout = async () => {
    try {
      await logout();
      router.push("/accounts");
      localStorage.clear();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <div
      ref={modalRef}
      className="absolute bottom-full left-4 rounded-xl shadow-lg w-72 overflow-hidden"
      style={{
        zIndex: 1000,
        width: "300px",
        backgroundColor: "#262626", // Màu nền tối giống Instagram
        marginBottom: "10px",
        border: "1px solid #363636", // Viền tối hơn một chút
        color: "white", // Màu chữ trắng
      }}
    >
      <div>
        {[
          { icon: Settings, label: "Cài đặt" },
          { icon: Activity, label: "Hoạt động của bạn" },
          { icon: Bookmark, label: "Đã lưu" },
          { icon: Moon, label: "Chuyển chế độ" },
          { icon: FileWarning, label: "Báo cáo sự cố" },
        ].map(({ icon: Icon, label }) => (
          <button
            key={label}
            className="w-full text-left px-4 py-3 hover:bg-[#363636] flex items-center gap-3"
            style={{ color: "white" }} // Đảm bảo màu chữ trắng
          >
            <Icon size={20} color="white" />
            <span>{label}</span>
          </button>
        ))}
      </div>

      <div className="h-px my-1" style={{ backgroundColor: "#363636" }}></div>

      <button
        className="w-full text-left px-4 py-3 hover:bg-[#363636] flex items-center gap-3"
        style={{ color: "white" }}
      >
        <span>Threads</span>
      </button>

      <div className="h-px my-1" style={{ backgroundColor: "#363636" }}></div>

      <button
        className="w-full text-left px-4 py-3 hover:bg-[#363636]"
        style={{ color: "white" }}
      >
        <span>Chuyển tài khoản</span>
      </button>
      <button
        className="w-full text-left px-4 py-3 hover:bg-[#363636]"
        onClick={handleLogout}
        style={{ color: "white" }}
      >
        <span>Đăng xuất</span>
      </button>
    </div>
  );
}
