import { useState, useRef, ChangeEvent, useEffect } from "react";
import { uploadAvatar, deleteAvatar } from "@/server/user";
import Image from "next/image";
import { Upload, Trash2, X } from "lucide-react";
import styles from "./UploadAvatar.module.scss";

interface UploadAvatarProps {
  currentAvatar?: string;
  onClose: () => void;
  onAvatarChange: (newAvatarUrl: string | null) => void;
}

export default function UploadAvatar({
  currentAvatar,
  onClose,
  onAvatarChange,
}: UploadAvatarProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    // Hiệu ứng xuất hiện khi component được mount
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 10);

    return () => clearTimeout(timer);
  }, []);

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const response = await uploadAvatar(file);
      if (response.success) {
        onAvatarChange(response.profilePicture || null);
        handleClose();
        window.location.reload();
      }
    } catch (error) {
      console.error("Lỗi khi tải ảnh đại diện:", error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteAvatar = async () => {
    try {
      setIsDeleting(true);
      const response = await deleteAvatar();
      if (response.success) {
        onAvatarChange(null);
        handleClose();
        window.location.reload();
      }
    } catch (error) {
      console.error("Lỗi khi xóa ảnh đại diện:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleClose = () => {
    setIsClosing(true);
    // Đợi animation đóng kết thúc rồi mới gọi onClose
    setTimeout(() => {
      onClose();
    }, 400); // 400ms là thời gian của animation
  };

  return (
    <div
      className={`fixed inset-0 flex items-center justify-center z-50 transition-all duration-400 ease-in-out ${
        isVisible && !isClosing
          ? "bg-black bg-opacity-80"
          : "bg-black bg-opacity-0"
      } ${styles.modalOverlay} ${isClosing ? styles.closing : ""}`}
      // style={{ zIndex: 998 }}
    >
      <div
        className={`bg-zinc-900 rounded-xl w-full max-w-md overflow-hidden shadow-xl md:max-h-[90vh] sm:max-h-[95vh] max-h-full h-auto sm:h-auto max-sm:h-full max-sm:rounded-none flex flex-col transition-all duration-400 ease-in-out ${
          isVisible && !isClosing
            ? "opacity-100 transform translate-y-0"
            : "opacity-0 transform translate-y-10"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-700">
          <h2 className="text-white font-medium text-center flex-1">
            Ảnh đại diện
          </h2>
          <button
            onClick={handleClose}
            className="text-zinc-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Avatar Preview */}
        <div className="flex justify-center items-center py-6 h-full">
          <div
            className={`w-40 h-40 rounded-full overflow-hidden bg-zinc-700 border-2 border-zinc-600 relative transition-all duration-500 ${
              isVisible && !isClosing
                ? "opacity-100 scale-100"
                : "opacity-0 scale-95"
            }`}
          >
            {currentAvatar ? (
              <Image
                src={currentAvatar}
                alt="Ảnh đại diện"
                fill
                className="object-cover"
              />
            ) : (
              <div className="h-full flex items-center justify-center text-zinc-400 text-sm">
                Chưa có ảnh đại diện
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="px-4 pb-5 flex flex-col gap-3 items-center justify-center md:flex-row md:gap-5 flex h-full">
          <button
            onClick={triggerFileInput}
            disabled={isUploading}
            className={`w-full py-2.5 rounded-lg flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-500 hover:to-pink-400 text-white font-medium transition-all disabled:opacity-70 ${
              isVisible && !isClosing
                ? "opacity-100 transform translate-y-0"
                : "opacity-0 transform translate-y-5"
            }`}
            style={{ transitionDelay: "200ms" }}
          >
            <Upload size={18} />
            <span>{isUploading ? "Đang tải lên..." : "Tải ảnh lên"}</span>
          </button>

          {currentAvatar && (
            <button
              onClick={handleDeleteAvatar}
              disabled={isDeleting}
              className={`w-full py-2.5 rounded-lg flex items-center justify-center gap-2 bg-zinc-700 hover:bg-zinc-600 text-red-400 font-medium transition-all disabled:opacity-70 ${
                isVisible && !isClosing
                  ? "opacity-100 transform translate-y-0"
                  : "opacity-0 transform translate-y-5"
              }`}
              style={{ transitionDelay: "300ms" }}
            >
              <Trash2 size={18} />
              <span>{isDeleting ? "Đang xóa..." : "Xóa ảnh đại diện"}</span>
            </button>
          )}
        </div>

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          className="hidden"
        />
      </div>
    </div>
  );
}
