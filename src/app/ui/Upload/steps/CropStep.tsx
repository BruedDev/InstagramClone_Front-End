import {
  ZoomInIcon,
  ZoomOutIcon,
  BookmarkIcon,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
} from "lucide-react";
import React, { useRef, useState, useEffect, useCallback } from "react";
import { Area } from "react-easy-crop";
import Image from "next/image";
import styles from "./CropStep.module.scss";
import { UploadPostProps } from "..";

export default function CropStep({
  mediaType,
  mediaPreview,
  crop,
  onCropComplete: onCropDone,
  isCropping,
  canProceedCrop,
  croppedAreaPixels: croppedAreaPixelsFromProps,
}: Pick<UploadPostProps, "mediaType" | "mediaPreview"> & {
  crop?: {
    crop: { x: number; y: number };
    zoom: number;
    aspect: number;
    setCrop: (c: { x: number; y: number }) => void;
    setZoom: (z: number) => void;
    setCroppedAreaPixels: (area: Area) => void;
  };
  onCropComplete?: (croppedUrl: string) => void;
  isCropping?: boolean;
  setIsCropping?: (v: boolean) => void;
  canProceedCrop?: boolean;
  croppedAreaPixels?: Area | null;
}) {
  const [, setCroppedAreaPixels] = useState<Area | null>(
    croppedAreaPixelsFromProps ?? null
  );

  const [currentSlide, setCurrentSlide] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 });
  const [zoomLevel, setZoomLevel] = useState(1);
  const [imageNaturalSize, setImageNaturalSize] = useState({
    width: 0,
    height: 0,
  });
  const [isCropMode, setIsCropMode] = useState(false);

  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Convert single image to array for consistency
  const mediaItems = Array.isArray(mediaPreview)
    ? mediaPreview
    : mediaPreview
    ? [mediaPreview]
    : [];

  // Get current media
  const currentMedia = mediaItems[currentSlide];

  // Load image and get natural size
  useEffect(() => {
    if (currentMedia && mediaType === "image") {
      const img = new window.Image();
      img.onload = () => {
        setImageNaturalSize({
          width: img.naturalWidth,
          height: img.naturalHeight,
        });
      };
      img.crossOrigin = "anonymous";
      img.src = currentMedia;
    }
  }, [currentMedia, mediaType]);

  // Reset states when switching slides
  useEffect(() => {
    setImagePosition({ x: 0, y: 0 });
    setZoomLevel(1);
    setIsCropMode(false);
  }, [currentSlide]);

  // Calculate container size (full screen crop area)
  const getContainerSize = () => {
    if (!containerRef.current) return { width: 520, height: 520 };

    const rect = containerRef.current.getBoundingClientRect();
    return {
      width: rect.width,
      height: rect.height,
    };
  };

  // Calculate image display size
  const calculateImageSize = () => {
    if (!imageNaturalSize.width || !imageNaturalSize.height) {
      return { width: 520, height: 520 };
    }

    const container = getContainerSize();
    const imageRatio = imageNaturalSize.width / imageNaturalSize.height;
    const containerRatio = container.width / container.height;

    if (isCropMode) {
      // In crop mode: scale image to fill container with zoom
      let scale;
      if (imageRatio > containerRatio) {
        // Wide image: fit by height
        scale = container.height / imageNaturalSize.height;
      } else {
        // Tall image: fit by width
        scale = container.width / imageNaturalSize.width;
      }

      // Apply zoom
      scale *= zoomLevel;

      return {
        width: imageNaturalSize.width * scale,
        height: imageNaturalSize.height * scale,
      };
    } else {
      // Normal mode: fill container completely (no padding)
      if (imageRatio > containerRatio) {
        // Wide image: fill by width, allow height overflow
        const width = container.width;
        const height = width / imageRatio;
        return { width, height };
      } else {
        // Tall image: fill by height, allow width overflow
        const height = container.height;
        const width = height * imageRatio;
        return { width, height };
      }
    }
  };

  const imageSize = calculateImageSize();

  // Calculate bounds for image movement in crop mode
  const getImageBounds = useCallback(() => {
    if (!containerRef.current || !isCropMode) {
      return { minX: 0, maxX: 0, minY: 0, maxY: 0 };
    }

    const container = getContainerSize();

    // Calculate maximum movement bounds
    const maxMoveX = Math.max(0, (imageSize.width - container.width) / 2);
    const maxMoveY = Math.max(0, (imageSize.height - container.height) / 2);

    return {
      minX: -maxMoveX,
      maxX: maxMoveX,
      minY: -maxMoveY,
      maxY: maxMoveY,
    };
  }, [imageSize, isCropMode]);

  // Constrain image position within bounds
  const constrainImagePosition = useCallback(
    (position: { x: number; y: number }) => {
      if (!isCropMode) return { x: 0, y: 0 };

      const bounds = getImageBounds();
      return {
        x: Math.max(bounds.minX, Math.min(bounds.maxX, position.x)),
        y: Math.max(bounds.minY, Math.min(bounds.maxY, position.y)),
      };
    },
    [getImageBounds, isCropMode]
  );

  // Handle mouse/touch events for dragging
  const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isCropMode) return;

    e.preventDefault();
    setIsDragging(true);

    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;

    setDragStart({
      x: clientX - imagePosition.x,
      y: clientY - imagePosition.y,
    });
  };

  const handleMouseMove = useCallback(
    (e: MouseEvent | TouchEvent) => {
      if (!isDragging || !isCropMode) return;

      e.preventDefault();

      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
      const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;

      const newPosition = constrainImagePosition({
        x: clientX - dragStart.x,
        y: clientY - dragStart.y,
      });

      setImagePosition(newPosition);
    },
    [isDragging, dragStart, isCropMode, constrainImagePosition]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Add event listeners
  useEffect(() => {
    if (isCropMode) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.addEventListener("touchmove", handleMouseMove, {
        passive: false,
      });
      document.addEventListener("touchend", handleMouseUp);

      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
        document.removeEventListener("touchmove", handleMouseMove);
        document.removeEventListener("touchend", handleMouseUp);
      };
    }
  }, [isCropMode, handleMouseMove, handleMouseUp]);

  // Calculate crop area when in crop mode
  useEffect(() => {
    if (isCropMode && containerRef.current && imageNaturalSize.width) {
      try {
        const container = getContainerSize();
        const scale = imageNaturalSize.width / imageSize.width;

        // Calculate the visible area of the image
        const visibleLeft = Math.max(0, -imagePosition.x * scale);
        const visibleTop = Math.max(0, -imagePosition.y * scale);
        const visibleWidth = Math.min(
          container.width * scale,
          imageNaturalSize.width - visibleLeft
        );
        const visibleHeight = Math.min(
          container.height * scale,
          imageNaturalSize.height - visibleTop
        );

        const cropArea = {
          x: visibleLeft,
          y: visibleTop,
          width: visibleWidth,
          height: visibleHeight,
        };

        setCroppedAreaPixels(cropArea);
        crop?.setCroppedAreaPixels(cropArea);
      } catch (error) {
        console.error("Error calculating crop area:", error);
      }
    }
  }, [isCropMode, imagePosition, imageSize, imageNaturalSize, crop]);

  // Navigation functions
  const nextSlide = () => {
    if (currentSlide < mediaItems.length - 1) {
      setCurrentSlide(currentSlide + 1);
    }
  };

  const prevSlide = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  // Tool functions
  const handleZoomIn = () => {
    if (!isCropMode) return;
    const newZoom = Math.min(zoomLevel * 1.2, 3);
    setZoomLevel(newZoom);
  };

  const handleZoomOut = () => {
    if (!isCropMode) return;
    const newZoom = Math.max(zoomLevel / 1.2, 0.5);
    setZoomLevel(newZoom);
  };

  const resetImagePosition = () => {
    setImagePosition({ x: 0, y: 0 });
    setZoomLevel(1);
  };

  const toggleCropMode = () => {
    setIsCropMode(!isCropMode);
    if (!isCropMode) {
      // Entering crop mode - reset position and zoom
      resetImagePosition();
    }
  };

  const handleCrop = () => {
    onCropDone?.("");
  };

  return (
    <div className={styles.cropContent}>
      <div className={styles.cropImageContainer} ref={containerRef}>
        {mediaType === "image" && currentMedia && (
          <div className={styles.cropImageWrapper}>
            {/* Image display */}
            <div
              style={{
                width: "100%",
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: isCropMode ? "hidden" : "visible",
                position: "relative",
              }}
            >
              {currentMedia.startsWith("data:") ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  ref={imageRef}
                  src={currentMedia}
                  alt="Preview"
                  style={{
                    width: `${imageSize.width}px`,
                    height: `${imageSize.height}px`,
                    objectFit: "contain",
                    transform: isCropMode
                      ? `translate(${imagePosition.x}px, ${imagePosition.y}px)`
                      : "none",
                    transition: isDragging ? "none" : "all 0.3s ease",
                    cursor: isCropMode
                      ? isDragging
                        ? "grabbing"
                        : "grab"
                      : "default",
                    userSelect: "none",
                    borderRadius: isCropMode ? "0" : "8px",
                  }}
                  onMouseDown={handleMouseDown}
                  onTouchStart={handleMouseDown}
                  draggable={false}
                />
              ) : (
                <Image
                  ref={imageRef}
                  src={currentMedia}
                  alt="Preview"
                  width={imageSize.width}
                  height={imageSize.height}
                  style={{
                    width: `${imageSize.width}px`,
                    height: `${imageSize.height}px`,
                    objectFit: "contain",
                    transform: isCropMode
                      ? `translate(${imagePosition.x}px, ${imagePosition.y}px)`
                      : "none",
                    transition: isDragging ? "none" : "all 0.3s ease",
                    cursor: isCropMode
                      ? isDragging
                        ? "grabbing"
                        : "grab"
                      : "default",
                    userSelect: "none",
                    borderRadius: isCropMode ? "0" : "8px",
                  }}
                  onMouseDown={handleMouseDown}
                  onTouchStart={handleMouseDown}
                  draggable={false}
                />
              )}

              {/* Crop overlay - full screen when in crop mode */}
              {isCropMode && (
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    border: "2px solid #fff",
                    borderRadius: "8px",
                    pointerEvents: "none",
                    zIndex: 10,
                    boxShadow: "inset 0 0 0 1px rgba(255, 255, 255, 0.3)",
                  }}
                >
                  {/* Corner indicators */}
                  {[
                    { top: "8px", left: "8px" },
                    { top: "8px", right: "8px" },
                    { bottom: "8px", left: "8px" },
                    { bottom: "8px", right: "8px" },
                  ].map((pos, i) => (
                    <div
                      key={i}
                      style={{
                        position: "absolute",
                        ...pos,
                        width: "20px",
                        height: "20px",
                        border: "2px solid #fff",
                        borderRadius: "2px",
                      }}
                    />
                  ))}

                  {/* Center crosshair */}
                  <div
                    style={{
                      position: "absolute",
                      top: "50%",
                      left: "50%",
                      transform: "translate(-50%, -50%)",
                      width: "20px",
                      height: "20px",
                      border: "1px solid rgba(255, 255, 255, 0.5)",
                      borderRadius: "50%",
                    }}
                  />
                </div>
              )}
            </div>

            {/* Navigation for multiple images */}
            {mediaItems.length > 1 && !isCropMode && (
              <>
                {currentSlide > 0 && (
                  <button
                    onClick={prevSlide}
                    className={styles.navButton}
                    style={{
                      position: "absolute",
                      left: "16px",
                      top: "50%",
                      transform: "translateY(-50%)",
                    }}
                  >
                    <ChevronLeft size={20} />
                  </button>
                )}

                {currentSlide < mediaItems.length - 1 && (
                  <button
                    onClick={nextSlide}
                    className={styles.navButton}
                    style={{
                      position: "absolute",
                      right: "16px",
                      top: "50%",
                      transform: "translateY(-50%)",
                    }}
                  >
                    <ChevronRight size={20} />
                  </button>
                )}

                {/* Pagination dots */}
                <div
                  style={{
                    position: "absolute",
                    bottom: "70px",
                    left: "50%",
                    transform: "translateX(-50%)",
                    display: "flex",
                    gap: "8px",
                    zIndex: 10,
                  }}
                >
                  {mediaItems.map((_, index) => (
                    <div
                      key={index}
                      onClick={() => setCurrentSlide(index)}
                      style={{
                        width: "8px",
                        height: "8px",
                        borderRadius: "50%",
                        backgroundColor:
                          index === currentSlide
                            ? "#fff"
                            : "rgba(255, 255, 255, 0.5)",
                        cursor: "pointer",
                        transition: "background-color 0.2s",
                      }}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* Video display */}
        {mediaType === "video" && currentMedia && (
          <div className={styles.cropVideoWrapper}>
            <video
              src={currentMedia}
              controls
              style={{
                width: "100%",
                height: "100%",
                objectFit: "contain",
              }}
            />
          </div>
        )}

        {/* Tools */}
        <div className={styles.cropTools}>
          {/* Crop mode toggle */}
          <button
            className={`${styles.cropTool} ${isCropMode ? styles.active : ""}`}
            onClick={toggleCropMode}
            title="Toggle crop mode"
          >
            <BookmarkIcon size={20} />
          </button>

          {/* Crop mode tools */}
          {isCropMode && (
            <>
              <button
                className={styles.cropTool}
                onClick={handleZoomIn}
                title="Zoom in"
              >
                <ZoomInIcon size={20} />
              </button>

              <button
                className={styles.cropTool}
                onClick={handleZoomOut}
                title="Zoom out"
              >
                <ZoomOutIcon size={20} />
              </button>

              <button
                className={styles.cropTool}
                onClick={resetImagePosition}
                title="Reset position"
              >
                <RotateCcw size={20} />
              </button>
            </>
          )}

          {/* Done button */}
          {isCropMode && (
            <button
              className={styles.cropTool}
              disabled={!canProceedCrop || isCropping}
              onClick={handleCrop}
              title="Apply crop"
              style={{
                backgroundColor: "#0095f6",
              }}
            >
              ✓
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
