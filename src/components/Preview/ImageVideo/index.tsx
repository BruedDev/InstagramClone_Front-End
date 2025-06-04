import React, { useRef, useState } from "react";
import Image from "next/image";
import { IoIosClose } from "react-icons/io";

interface ImageVideoPreviewProps {
  src: string;
  type: "image" | "video";
  onClose: () => void;
}

const BLUR_AMOUNT = 32;

export default function ImageVideoPreview({
  src,
  type,
  onClose,
}: ImageVideoPreviewProps) {
  const [bgStyle] = useState<React.CSSProperties>({
    background: "rgba(0,0,0,0.85)",
    backdropFilter: `blur(${BLUR_AMOUNT}px)`,
  });
  const mediaRef = useRef<HTMLImageElement & HTMLVideoElement>(null);

  return (
    <div
      className="fixed inset-0 flex items-center justify-center"
      style={{
        ...bgStyle,
        transition: "background 0.3s, backdrop-filter 0.3s",
        zIndex: 998,
        left: 0,
        top: 0,
        width: "100vw",
        height: "100dvh",
        backgroundColor: "rgba(0,0,0,0.8)",
      }}
      onClick={onClose}
    >
      <div
        className={`absolute top-4 ${
          typeof window !== "undefined" && window.innerWidth <= 768
            ? "right-2"
            : "right-10"
        } z-60 cursor-pointer bg-black/60 rounded-full hover:bg-black/80`}
        style={
          typeof window !== "undefined" && window.innerWidth <= 768
            ? { right: 8 }
            : { right: 40 }
        }
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
      >
        <IoIosClose size={34} />
      </div>
      {type === "image" ? (
        <Image
          ref={mediaRef as React.RefObject<HTMLImageElement>}
          src={src}
          alt="preview"
          width={1200}
          height={1200}
          className="max-h-[90dvh] max-w-[90vw] object-contain rounded-lg shadow-lg"
          style={{ zIndex: 55 }}
          draggable={false}
          onClick={(e) => e.stopPropagation()}
          priority
          objectFit="contain"
          unoptimized
        />
      ) : (
        <video
          ref={mediaRef as React.RefObject<HTMLVideoElement>}
          src={src}
          controls
          autoPlay
          className="max-h-[90dvh] max-w-[90vw] object-contain rounded-lg shadow-lg bg-black"
          style={{ zIndex: 55 }}
          onClick={(e) => e.stopPropagation()}
        />
      )}
    </div>
  );
}
