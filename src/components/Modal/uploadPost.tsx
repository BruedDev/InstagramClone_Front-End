"use client";

import { useState, useRef, ChangeEvent, useEffect } from "react";
import { createPost } from "@/server/posts"; // Import hàm createPost
import UploadPostUi from "@/app/ui/Upload/UploadPost";
import LoadingComponent from "@/components/Loading/LoadingComponent"; // Import LoadingComponent

export interface CreatePostModalProps {
  onClose: () => void;
  username?: string;
  onPostCreated?: () => void;
}

export default function UploadPost({
  onClose,
  onPostCreated,
}: CreatePostModalProps) {
  const [step, setStep] = useState<"select" | "edit">("select");
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<"image" | "video" | null>(null);
  const [caption, setCaption] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<File | null>(null);

  // Thêm các state mới cho loading và trạng thái
  const [showLoading, setShowLoading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<
    "uploading" | "success" | "error" | null
  >(null);
  const [errorMessage, setErrorMessage] = useState("");

  const username = localStorage.getItem("username");

  // Animation states
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    // Hiệu ứng xuất hiện khi component được mount
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 10);

    return () => clearTimeout(timer);
  }, []);

  // Xử lý đóng loading component và reset trạng thái
  const handleCloseLoading = () => {
    setShowLoading(false);
    setUploadStatus(null);

    // Nếu upload thành công, đóng UploadPost
    if (uploadStatus === "success" && onPostCreated) {
      onPostCreated();
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileType = file.type.split("/")[0];
    if (fileType !== "image" && fileType !== "video") {
      alert("Chỉ hỗ trợ tệp hình ảnh hoặc video");
      return;
    }

    // Lưu file để sử dụng khi submit
    fileRef.current = file;

    const reader = new FileReader();
    reader.onload = () => {
      setMediaPreview(reader.result as string);
      setMediaType(fileType as "image" | "video");
      setStep("edit");
    };
    reader.readAsDataURL(file);
  };

  const triggerFileInput = (type: "image" | "video") => {
    if (fileInputRef.current) {
      fileInputRef.current.setAttribute(
        "accept",
        type === "image" ? "image/*" : "video/*"
      );
      fileInputRef.current.click();
    }
  };

  const handleClose = () => {
    setIsClosing(true);
    // Đợi animation đóng kết thúc rồi mới gọi onClose
    setTimeout(() => {
      onClose();
    }, 400); // 400ms là thời gian của animation
  };

  const handleBack = () => {
    setStep("select");
    setMediaPreview(null);
    setMediaType(null);
    fileRef.current = null;
  };

  // Cập nhật phần handleSubmit
  const handleSubmit = async () => {
    if (!mediaType || !fileRef.current) {
      alert("Vui lòng chọn file");
      return;
    }

    try {
      // Hiển thị loading component và đặt trạng thái uploading
      setShowLoading(true);
      setUploadStatus("uploading");
      setIsUploading(true);

      const formData = new FormData();
      formData.append("file", fileRef.current);
      formData.append("caption", caption);
      formData.append("type", mediaType);

      // Gọi API đăng bài
      await createPost(formData);

      // Cập nhật trạng thái thành công
      setUploadStatus("success");

      // Chờ 2 giây để hiển thị thông báo thành công trước khi đóng
      setTimeout(() => {
        if (onPostCreated) {
          onPostCreated();
        }
        handleCloseLoading();
      }, 2000);
    } catch (error) {
      console.error("Lỗi khi đăng bài:", error);

      // Cập nhật trạng thái lỗi và thông báo
      setUploadStatus("error");
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Đăng bài thất bại. Vui lòng thử lại sau."
      );

      // Chờ 2 giây để hiển thị thông báo lỗi
      setTimeout(() => {
        handleCloseLoading();
      }, 2000);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <>
      <UploadPostUi
        {...{
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
          fileInputRef,
          triggerFileInput,
          username,
        }}
      />

      {/* Hiển thị LoadingComponent khi showLoading = true */}
      {showLoading && (
        <LoadingComponent status={uploadStatus} errorMessage={errorMessage} />
      )}
    </>
  );
}
