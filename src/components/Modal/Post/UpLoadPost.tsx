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
  const [mediaPreviews, setMediaPreviews] = useState<string[]>([]); // array of preview urls
  const [mediaTypes, setMediaTypes] = useState<("image" | "video")[]>([]); // array of types
  const [caption, setCaption] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const filesRef = useRef<File[]>([]); // store all files
  const [currentIndex, setCurrentIndex] = useState(0); // index of file being edited/cropped

  // Crop state for each file
  const [crops, setCrops] = useState<{ x: number; y: number }[]>([]);
  const [zooms, setZooms] = useState<number[]>([]);
  const [croppedAreaPixelsArr, setCroppedAreaPixelsArr] = useState<
    ({
      width: number;
      height: number;
      x: number;
      y: number;
    } | null)[]
  >([]);
  const [croppedMediaPreviews, setCroppedMediaPreviews] = useState<
    (string | null)[]
  >([]);

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

  // Replace handleFileChange to support multiple files
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const previews: string[] = [];
    const types: ("image" | "video")[] = [];
    filesRef.current = Array.from(files);
    let loaded = 0;
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileType = file.type.split("/")[0];
      if (fileType !== "image" && fileType !== "video") {
        alert("Chỉ hỗ trợ tệp hình ảnh hoặc video");
        continue;
      }
      types[i] = fileType as "image" | "video";
      const reader = new FileReader();
      reader.onload = () => {
        previews[i] = reader.result as string;
        loaded++;
        if (loaded === files.length) {
          setMediaPreviews(previews);
          setMediaTypes(types);
          setCurrentIndex(0);
          setStep("crop");
          setCrops(Array(files.length).fill({ x: 0, y: 0 }));
          setZooms(Array(files.length).fill(1));
          setCroppedAreaPixelsArr(Array(files.length).fill(null));
          setCroppedMediaPreviews(Array(files.length).fill(null));
        }
      };
      reader.readAsDataURL(file);
    }
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

  // Crop/zoom/caption/filter handlers for current file
  const handleCropChange = (crop: { x: number; y: number }) => {
    setCrops((prev) => prev.map((c, i) => (i === currentIndex ? crop : c)));
  };
  const handleZoomChange = (zoom: number) => {
    setZooms((prev) => prev.map((z, i) => (i === currentIndex ? zoom : z)));
  };
  const handleCroppedAreaPixels = (area: {
    width: number;
    height: number;
    x: number;
    y: number;
  }) => {
    setCroppedAreaPixelsArr((prev) =>
      prev.map((a, i) => (i === currentIndex ? area : a))
    );
  };
  const handleCroppedMediaPreview = (url: string) => {
    setCroppedMediaPreviews((prev) =>
      prev.map((u, i) => (i === currentIndex ? url : u))
    );
  };

  // handleNext/Back for multi-file
  const handleNext = async () => {
    if (step === "crop") {
      // Crop current image if needed
      if (
        mediaTypes[currentIndex] === "image" &&
        mediaPreviews[currentIndex] &&
        croppedAreaPixelsArr[currentIndex]
      ) {
        const base64 = await cropImageFromPixels(
          mediaPreviews[currentIndex],
          croppedAreaPixelsArr[currentIndex]!
        );
        handleCroppedMediaPreview(base64);
      }
      // Nếu còn file tiếp theo thì chuyển sang file tiếp theo, nếu hết thì sang bước filter
      if (currentIndex < mediaPreviews.length - 1) {
        setCurrentIndex(currentIndex + 1);
      } else {
        setStep("filter");
        setCurrentIndex(0);
      }
    } else if (step === "filter") {
      // TODO: handle filter for each file if needed
      if (currentIndex < mediaPreviews.length - 1) {
        setCurrentIndex(currentIndex + 1);
      } else {
        setStep("caption");
        setCurrentIndex(0);
      }
    }
  };

  const handleBack = () => {
    if (step === "caption") {
      setStep("filter");
      setCurrentIndex(mediaPreviews.length - 1);
    } else if (step === "filter") {
      setStep("crop");
      setCurrentIndex(mediaPreviews.length - 1);
    } else if (step === "crop") {
      if (currentIndex > 0) {
        setCurrentIndex(currentIndex - 1);
      } else {
        setStep("select");
        setMediaPreviews([]);
        setMediaTypes([]);
        filesRef.current = [];
      }
    } else {
      setStep("select");
      setMediaPreviews([]);
      setMediaTypes([]);
      filesRef.current = [];
    }
  };

  // handleSubmit: gửi tất cả file, index1/index2
  const handleSubmit = async () => {
    if (!filesRef.current.length) {
      alert("Vui lòng chọn file");
      return;
    }
    try {
      setIsUploading(true);
      setUploadStatus("uploading");
      setShowUi(false);
      setTimeout(() => setShowLoading(true), 0);
      const formData = new FormData();
      const index1: number[] = [];
      const index2: number[] = [];
      filesRef.current.forEach((file, i) => {
        // Nếu có ảnh đã crop thì dùng ảnh đã crop, còn lại dùng file gốc
        if (mediaTypes[i] === "image" && croppedMediaPreviews[i]) {
          // Convert base64 sang file
          const arr = croppedMediaPreviews[i]!.split(",");
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
            file.name.replace(/\.[^.]+$/, "") + `_cropped_${i}.png`,
            { type: mime }
          );
          formData.append("file", croppedFile);
          index1.push(i);
        } else if (mediaTypes[i] === "image") {
          formData.append("file", file);
          index1.push(i);
        } else if (mediaTypes[i] === "video") {
          formData.append("file", file);
          index2.push(i);
        }
      });
      formData.append("caption", caption);
      formData.append("index1", JSON.stringify(index1));
      formData.append("index2", JSON.stringify(index2));
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
    } finally {
      setIsUploading(false);
    }
  };

  const aspect = 1; // Instagram uses 1:1 by default

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
          // Truyền file hiện tại cho từng bước
          mediaType={mediaTypes[currentIndex]}
          mediaPreview={mediaPreviews[currentIndex]}
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
                  crop: crops[currentIndex] || { x: 0, y: 0 },
                  zoom: zooms[currentIndex] || 1,
                  aspect,
                  setCrop: handleCropChange,
                  setZoom: handleZoomChange,
                  setCroppedAreaPixels: handleCroppedAreaPixels,
                }
              : undefined
          }
          croppedAreaPixels={croppedAreaPixelsArr[currentIndex]}
          filter={
            step === "filter" || step === "caption"
              ? {
                  selected: selectedFilter,
                  setSelected: setSelectedFilter,
                  filters: FILTERS,
                }
              : undefined
          }
          croppedMediaPreview={croppedMediaPreviews[currentIndex]}
          setCroppedMediaPreview={handleCroppedMediaPreview}
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
