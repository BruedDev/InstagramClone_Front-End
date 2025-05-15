import Image from "next/image";
import { Upload, Camera, Send, X, ArrowLeft } from "lucide-react";
import { MutableRefObject } from "react";
import styles from "./UploadPost.module.scss";

export type UploadPostProps = {
  step: "select" | "edit";
  isVisible: boolean;
  isClosing: boolean;
  handleBack: () => void;
  handleClose: () => void;
  mediaType: "image" | "video" | null;
  mediaPreview: string | null;
  caption: string;
  setCaption: (value: string) => void;
  handleSubmit: () => void;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isUploading: boolean;
  username: string | null;
  fileInputRef: MutableRefObject<HTMLInputElement | null>;
  triggerFileInput: (type: "image" | "video") => void;
};

export default function UploadPostUi({
  step,
  isVisible,
  isClosing,
  handleBack,
  handleClose,
  mediaType,
  mediaPreview,
  caption,
  setCaption,
  handleSubmit,
  handleFileChange,
  isUploading,
  username,
  fileInputRef,
  triggerFileInput,
}: UploadPostProps) {
  return (
    <div
      className={`fixed inset-0 flex items-center justify-center z-50 transition-all duration-400 ease-in-out ${
        isVisible && !isClosing
          ? "bg-black bg-opacity-80"
          : "bg-black bg-opacity-0"
      } ${styles.modalOverlay} ${isClosing ? styles.closing : ""}`}
    >
      <div
        className={`bg-zinc-900 rounded-xl w-full max-w-4xl overflow-y-auto shadow-xl md:max-h-[90vh] max-h-[100vh] h-auto max-sm:rounded-none flex flex-col transition-all duration-400 ease-in-out ${
          isVisible && !isClosing
            ? "opacity-100 transform translate-y-0"
            : "opacity-0 transform translate-y-10"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-700">
          {step === "edit" && (
            <button
              onClick={handleBack}
              className="text-zinc-400 hover:text-white transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
          )}
          <h2 className="text-white font-medium text-center flex-1">
            {step === "select" ? "Tạo bài viết mới" : "Chỉnh sửa bài viết"}
          </h2>
          <button
            onClick={handleClose}
            className="text-zinc-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        {step === "select" ? (
          <div className="flex flex-col items-center justify-center p-8 h-96">
            <div
              className={`w-16 h-16 mb-6 rounded-full bg-zinc-800 flex items-center justify-center transition-all duration-500 ${
                isVisible && !isClosing
                  ? "opacity-100 scale-100"
                  : "opacity-0 scale-95"
              }`}
            >
              <Upload size={28} className="text-zinc-400" />
            </div>

            <h3
              className={`text-white text-lg font-medium mb-2 transition-all duration-500 ${
                isVisible && !isClosing
                  ? "opacity-100 transform translate-y-0"
                  : "opacity-0 transform translate-y-5"
              }`}
              style={{ transitionDelay: "100ms" }}
            >
              Kéo ảnh và video vào đây
            </h3>

            <p
              className={`text-zinc-400 text-sm mb-8 transition-all duration-500 ${
                isVisible && !isClosing
                  ? "opacity-100 transform translate-y-0"
                  : "opacity-0 transform translate-y-5"
              }`}
              style={{ transitionDelay: "200ms" }}
            >
              Hỗ trợ JPG, PNG, GIF, MP4
            </p>

            <div className="flex flex-col sm:flex-row gap-4 w-full max-w-xs">
              <button
                onClick={() => triggerFileInput("image")}
                className={`py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-500 hover:to-pink-400 text-white font-medium transition-all w-full ${
                  isVisible && !isClosing
                    ? "opacity-100 transform translate-y-0"
                    : "opacity-0 transform translate-y-5"
                }`}
                style={{ transitionDelay: "300ms" }}
              >
                <Camera size={18} />
                <span>Tải ảnh/video lên</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col md:flex-row h-auto">
            {/* Media Preview */}
            <div className="w-full md:w-3/5 bg-zinc-950 flex items-center justify-center">
              {mediaType === "image" && mediaPreview && (
                <div className="relative w-full">
                  <Image
                    src={mediaPreview}
                    alt="Preview"
                    className="w-full object-contain"
                    width={800}
                    height={600}
                  />
                </div>
              )}
              {mediaType === "video" && mediaPreview && (
                <video
                  src={mediaPreview}
                  controls
                  className="w-full object-contain"
                />
              )}
            </div>

            {/* Caption Form */}
            <div className="w-full md:w-2/5 p-4 flex flex-col border-t md:border-t-0 md:border-l border-zinc-700">
              <div className="flex items-center gap-3 mb-4 p-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-yellow-500 via-red-500 to-purple-500 flex-shrink-0"></div>
                <span className="text-white font-medium">{username}</span>
              </div>

              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Viết chú thích..."
                className="flex-1 resize-none border-none focus:ring-0 text-sm bg-transparent text-white placeholder-zinc-500 min-h-[50px]"
                rows={3}
              />

              <div className="flex justify-between items-center mt-4 pt-3 border-t border-zinc-700">
                <span className="text-xs text-zinc-400">
                  {caption.length}/2,200
                </span>
                <button
                  onClick={handleSubmit}
                  disabled={isUploading}
                  className={`py-2 px-4 rounded-lg flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-500 hover:to-pink-400 text-white font-medium transition-all ${
                    isUploading ? "opacity-70 cursor-not-allowed" : ""
                  }`}
                >
                  {isUploading ? (
                    <span>Đang đăng...</span>
                  ) : (
                    <>
                      <Send size={16} />
                      <span>Đăng</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
        />
      </div>
    </div>
  );
}
