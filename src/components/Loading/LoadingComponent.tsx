"use client";

import React from "react";
import styles from "./LoadingComponent.module.scss";
import { X } from "lucide-react";

interface LoadingComponentProps {
  status?: "uploading" | "success" | "error" | null;
  errorMessage?: string;
  onClose?: () => void; // Thêm prop này
}

export default function LoadingComponent({
  status = "uploading",
  errorMessage = "Đăng bài thất bại",
  onClose,
}: LoadingComponentProps) {
  const handleReload = () => {
    window.location.reload();
  };

  return (
    <div
      className={`flex flex-col items-center justify-center p-4 rounded-lg ${styles.modalOverlay}`}
    >
      <button
        className="absolute top-2 right-2 cursor-pointer"
        onClick={status === "error" && onClose ? onClose : handleReload} // Ưu tiên gọi onClose khi lỗi, còn lại reload
      >
        <X size={30} />
      </button>

      {status === "uploading" && (
        <>
          {/* Loading indicator with Instagram-like gradient ring */}
          <div className="relative w-24 h-24 mb-1">
            {/* Gradient ring with auto-rotating animation */}
            <div className="absolute inset-0 rounded-full animate-spin">
              {/* Same gradient style as in the AddStory component */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-yellow-500 via-red-500 to-purple-500 p-1">
                {/* Inner circle (empty for loading) */}
                <div className="w-full h-full rounded-full bg-[#111]"></div>
              </div>
            </div>
          </div>
          <span className="text-sm text-gray-400 font-semibold mt-4">
            Đang đăng bài...
          </span>
        </>
      )}

      {status === "success" && (
        <>
          {/* Loading indicator with Instagram-like gradient ring */}
          <div className="relative w-24 h-24 mb-1">
            {/* Gradient ring with auto-rotating animation */}
            <div className="absolute inset-0 rounded-full animate-spin">
              {/* Same gradient style as in the AddStory component */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-yellow-500 via-red-500 to-purple-500 p-1">
                {/* Inner circle (empty for loading) */}
                <div className="w-full h-full rounded-full bg-[#111]"></div>
              </div>
            </div>
          </div>
          <span className="text-sm text-gray-400 font-semibold mt-4">
            Đăng bài thành công
          </span>
        </>
      )}

      {status === "error" && (
        <>
          {/* Loading indicator with Instagram-like gradient ring */}
          <div className="relative w-24 h-24 mb-1">
            {/* Gradient ring with auto-rotating animation */}
            <div className="absolute inset-0 rounded-full animate-spin">
              {/* Same gradient style as in the AddStory component */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-yellow-500 via-red-500 to-purple-500 p-1">
                {/* Inner circle (empty for loading) */}
                <div className="w-full h-full rounded-full bg-[#111]"></div>
              </div>
            </div>
          </div>
          <span className="text-sm text-gray-400 font-semibold mt-4">
            {errorMessage}
          </span>
        </>
      )}

      {status === "error" && onClose && (
        <button
          className="mt-4 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          onClick={onClose}
        >
          Đóng
        </button>
      )}

      <style jsx global>{`
        @keyframes spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }

        .animate-spin {
          animation: spin 1.5s linear infinite;
        }
      `}</style>
    </div>
  );
}
