import { X, ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import styles from "./UploadPost.module.scss";
import SelectStep from "./steps/SelectStep";
import CropStep from "./steps/CropStep";
import FilterStep from "./steps/FilterStep";
import CaptionStep from "./steps/CaptionStep";

// Định nghĩa lại UploadPostProps trong file này (hoặc import type từ file riêng nếu đã tách type ra ngoài)
export type UploadPostProps = {
  step: "select" | "crop" | "filter" | "caption";
  isVisible: boolean;
  isClosing: boolean;
  handleBack: () => void;
  handleClose: () => void;
  handleNext: () => void;
  mediaType: "image" | "video" | null;
  mediaPreview: string | null;
  caption: string;
  setCaption: (value: string) => void;
  handleSubmit: () => void;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isUploading: boolean;
  username: string | null;
  fileInputRef: React.MutableRefObject<HTMLInputElement | null>;
  triggerFileInput: () => void;
  crop?: {
    crop: { x: number; y: number };
    zoom: number;
    aspect: number;
    setCrop: (c: { x: number; y: number }) => void;
    setZoom: (z: number) => void;
    setCroppedAreaPixels: (area: {
      width: number;
      height: number;
      x: number;
      y: number;
    }) => void;
  };
  filter?: {
    selected: string;
    setSelected: (f: string) => void;
    filters: string[];
  };
  // Add these to UploadPostProps for CropStep integration
  isCropping?: boolean;
  setIsCropping?: (v: boolean) => void;
  croppedMediaPreview?: string | null;
  setCroppedMediaPreview?: (url: string) => void;
  croppedAreaPixels?: {
    width: number;
    height: number;
    x: number;
    y: number;
  } | null;
  onCropComplete?: (croppedUrl: string) => void;
};

export default function UploadPostUi(props: UploadPostProps) {
  // Responsive: detect mobile (<=768px)
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Bỏ qua bước crop trên mobile, đi thẳng tới filter cả UI lẫn logic header
  const stepToRender =
    isMobile && props.step === "crop" ? "filter" : props.step;

  // Generate dynamic class names based on step
  const getModalClasses = () => {
    const baseClasses = [styles.modal];

    if (props.isVisible && !props.isClosing) {
      baseClasses.push(styles.modalVisible);
    }

    // Add step-specific classes for sizing
    switch (stepToRender) {
      case "select":
        baseClasses.push(styles.stepSelect);
        break;
      case "crop":
        baseClasses.push(styles.stepCrop);
        break;
      case "filter":
        baseClasses.push(styles.stepFilter);
        break;
      case "caption":
        baseClasses.push(styles.stepCaption);
        break;
    }

    return baseClasses.join(" ");
  };

  // Nếu là mobile và step là 'crop', chuyển thẳng sang filter cả UI lẫn logic, và tự động gọi handleNext để chuyển bước
  useEffect(() => {
    if (isMobile && props.step === "crop") {
      props.handleNext();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMobile, props.step]);

  return (
    <div
      className={`${styles.modalOverlay} ${
        props.isVisible && !props.isClosing ? styles.visible : ""
      } ${props.isClosing ? styles.closing : ""}`}
    >
      {/* Close button fixed at top right of overlay */}
      {(props.step !== "select" ||
        (props.step === "select" &&
          typeof window !== "undefined" &&
          window.innerWidth > 768)) && (
        <button
          onClick={props.handleClose}
          className={styles.overlayCloseButton}
          style={{ position: "fixed", top: 24, right: 32, zIndex: 100 }}
          aria-label="Đóng"
        >
          <X size={28} />
        </button>
      )}
      <div className={getModalClasses()}>
        {/* Header */}
        <div className={styles.header}>
          {/* Mobile close button for select step */}
          {stepToRender === "select" && isMobile && (
            <button
              onClick={props.handleClose}
              className={styles.closeButtonMobile}
              aria-label="Đóng"
            >
              <X size={22} />
            </button>
          )}
          {stepToRender !== "select" ? (
            <button onClick={props.handleBack} className={styles.backButton}>
              <ArrowLeft size={22} />
            </button>
          ) : (
            <div className={styles.headerSpacer} />
          )}
          <h2 className={styles.headerTitle}>
            {stepToRender === "select" && "Tạo bài viết mới"}
            {stepToRender === "crop" && "Cắt"}
            {stepToRender === "filter" && "Chỉnh sửa"}
            {stepToRender === "caption" && "Tạo bài viết mới"}
          </h2>
          {/* Remove close button from header, show 'Chia sẻ' on caption step */}
          {stepToRender === "caption" ? (
            <button
              onClick={props.handleSubmit}
              disabled={props.isUploading}
              className={`${styles.shareButton} text-blue-400`}
            >
              {props.isUploading ? "Đang đăng..." : "Chia sẻ"}
            </button>
          ) : stepToRender === "crop" || stepToRender === "filter" ? (
            <button onClick={props.handleNext} className={styles.nextButton}>
              Tiếp
            </button>
          ) : null}
        </div>

        {/* Content */}
        {stepToRender === "select" && (
          <SelectStep
            triggerFileInput={props.triggerFileInput}
            fileInputRef={props.fileInputRef}
            handleFileChange={props.handleFileChange}
          />
        )}
        {/* Bỏ CropStep trên mobile, chỉ render trên PC */}
        {stepToRender === "crop" && !isMobile && (
          <CropStep
            mediaType={props.mediaType}
            mediaPreview={props.mediaPreview}
            crop={props.crop}
            isCropping={props.isCropping}
            setIsCropping={props.setIsCropping}
            onCropComplete={props.onCropComplete}
            croppedAreaPixels={props.croppedAreaPixels}
          />
        )}
        {stepToRender === "filter" && (
          <FilterStep
            mediaType={props.mediaType}
            mediaPreview={props.mediaPreview}
            filter={props.filter}
            croppedMediaPreview={props.croppedMediaPreview}
          />
        )}
        {stepToRender === "caption" && (
          <CaptionStep
            mediaType={props.mediaType}
            mediaPreview={props.mediaPreview}
            filter={props.filter}
            username={props.username}
            caption={props.caption}
            setCaption={props.setCaption}
            handleSubmit={props.handleSubmit}
            isUploading={props.isUploading}
            croppedMediaPreview={props.croppedMediaPreview}
          />
        )}
      </div>
    </div>
  );
}
