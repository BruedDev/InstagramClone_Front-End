"use client";

import { useState, useRef, ChangeEvent, useEffect, useCallback } from "react";
import { createPost } from "@/server/posts"; // Import hàm createPost
import UploadPostUi from "@/app/ui/Upload";
import LoadingComponent from "@/components/Loading/LoadingComponent"; // Import LoadingComponent
import { cropImageFromPixels } from "@/utils/cropImageFromPixels";

export interface CreatePostModalProps {
  onClose: () => void;
  username?: string;
  onPostCreated?: () => void;
}

export default function UploadPost({
  onClose,
  onPostCreated,
}: CreatePostModalProps) {
  // --- Multi-step state for Instagram-like flow ---
  const [step, setStep] = useState<"select" | "crop" | "filter" | "caption">(
    "select"
  );
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<"image" | "video" | null>(null);
  const [caption, setCaption] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<File | null>(null);

  // Crop state
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<{
    width: number;
    height: number;
    x: number;
    y: number;
  } | null>(null);
  const aspect = 1; // Instagram uses 1:1 by default

  // Thêm state cho ảnh đã crop
  const [croppedMediaPreview, setCroppedMediaPreview] = useState<string | null>(
    null
  );

  // Filter state
  const FILTERS = [
    "none",
    "grayscale(1)",
    "sepia(1)",
    "contrast(1.5)",
    "brightness(1.2)",
    "saturate(2)",
    "hue-rotate(90deg)",
  ];
  const [selectedFilter, setSelectedFilter] = useState<string>("none");

  // Thêm các state mới cho loading và trạng thái
  const [showLoading, setShowLoading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<
    "uploading" | "success" | "error" | null
  >(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [showUi, setShowUi] = useState(true);

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
  const handleCloseLoading = useCallback(() => {
    setShowLoading(false);
    setUploadStatus(null);
    setShowUi(true); // Hiện lại UI nếu cần
    if (uploadStatus === "success" && onPostCreated) {
      onPostCreated();
    }
  }, [uploadStatus, onPostCreated]);

  // Tự động đóng LoadingComponent sau khi đăng bài thành công
  useEffect(() => {
    if (uploadStatus === "success") {
      const timer = setTimeout(() => {
        handleCloseLoading();
        window.location.reload();
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [uploadStatus, handleCloseLoading]);

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
      setStep("crop"); // Luôn chuyển sang bước crop cho cả image và video
    };
    reader.readAsDataURL(file);
  };

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.setAttribute("accept", "image/*,video/*");
      fileInputRef.current.click();
    }
  };

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
    }, 400);
  };

  const handleBack = () => {
    if (step === "caption") {
      setStep(mediaType === "image" ? "filter" : "select");
    } else if (step === "filter") {
      setStep("crop");
    } else if (step === "crop") {
      setStep("select");
      setMediaPreview(null);
      setMediaType(null);
      fileRef.current = null;
    } else {
      setStep("select");
      setMediaPreview(null);
      setMediaType(null);
      fileRef.current = null;
    }
  };

  const handleNext = async () => {
    if (step === "crop") {
      // Only crop when moving from crop to filter
      if (mediaType === "image" && mediaPreview && croppedAreaPixels) {
        const base64 = await cropImageFromPixels(
          mediaPreview,
          croppedAreaPixels
        );
        setCroppedMediaPreview(base64);
      }
      setStep("filter");
    } else if (step === "filter") {
      setStep("caption");
    }
  };

  // Cập nhật phần handleSubmit
  const handleSubmit = async () => {
    if (!mediaType || !fileRef.current) {
      alert("Vui lòng chọn file");
      return;
    }
    try {
      setIsUploading(true);
      setUploadStatus("uploading");
      setShowUi(false); // Ẩn UI trước
      setTimeout(() => {
        setShowLoading(true);
      }, 0);
      const formData = new FormData();
      // Nếu có ảnh đã crop thì convert sang file và upload
      if (croppedMediaPreview && mediaType === "image") {
        // Convert base64 sang file
        const arr = croppedMediaPreview.split(",");
        const mimeMatch = arr[0].match(/:(.*?);/);
        const mime = mimeMatch ? mimeMatch[1] : "image/png";
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
          u8arr[n] = bstr.charCodeAt(n);
        }
        const croppedFile = new File(
          [u8arr],
          fileRef.current.name.replace(/\.[^.]+$/, "") + "_cropped.png",
          { type: mime }
        );
        formData.append("file", croppedFile);
      } else {
        formData.append("file", fileRef.current);
      }
      formData.append("caption", caption);
      formData.append("type", mediaType);
      await createPost(formData);
      setUploadStatus("success");
    } catch (error) {
      setUploadStatus("error");
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Đăng bài thất bại. Vui lòng thử lại sau."
      );
      setShowUi(false);
      setShowLoading(true);
      // Không tự đóng khi lỗi, để người dùng tự tắt
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <>
      {showUi && !showLoading && (
        <UploadPostUi
          step={step}
          isVisible={isVisible}
          isClosing={isClosing}
          handleBack={handleBack}
          handleClose={handleClose}
          handleNext={handleNext}
          mediaType={mediaType}
          mediaPreview={mediaPreview}
          caption={caption}
          setCaption={setCaption}
          handleSubmit={handleSubmit}
          handleFileChange={handleFileChange}
          isUploading={isUploading}
          fileInputRef={fileInputRef}
          triggerFileInput={triggerFileInput}
          username={username}
          crop={
            step === "crop"
              ? {
                  crop,
                  zoom,
                  aspect,
                  setCrop: (c: { x: number; y: number }) => setCrop(c),
                  setZoom: (z: number) => setZoom(z),
                  setCroppedAreaPixels: (area: {
                    width: number;
                    height: number;
                    x: number;
                    y: number;
                  }) => setCroppedAreaPixels(area),
                }
              : undefined
          }
          croppedAreaPixels={croppedAreaPixels}
          filter={
            step === "filter" || step === "caption"
              ? {
                  selected: selectedFilter,
                  setSelected: setSelectedFilter,
                  filters: FILTERS,
                }
              : undefined
          }
          croppedMediaPreview={croppedMediaPreview}
          setCroppedMediaPreview={setCroppedMediaPreview}
        />
      )}
      {showLoading && (
        <LoadingComponent
          status={uploadStatus}
          errorMessage={errorMessage}
          onClose={uploadStatus === "error" ? handleCloseLoading : undefined}
        />
      )}
    </>
  );
}
