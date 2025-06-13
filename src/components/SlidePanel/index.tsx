"use client";
import React, { useEffect, useState } from "react";
import styles from "./SlidePanel.module.scss";

interface SlidePanelProps {
  isOpen: boolean;
  onClose: () => void;
  type: "search" | "notification";
  children: React.ReactNode;
}

export default function SlidePanel({
  isOpen,
  onClose,
  type,
  children,
}: SlidePanelProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      setTimeout(() => setIsAnimating(true), 10);
    } else {
      setIsAnimating(false);
      setTimeout(() => setIsVisible(false), 300);
    }
  }, [isOpen]);

  // Handle click outside to close
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Handle ESC key
  useEffect(() => {
    const handleEscKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscKey);
      // Prevent body scroll when modal is open
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscKey);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  // Listen for custom close-panel event từ children
  useEffect(() => {
    const handleCustomClose = () => {
      onClose();
    };
    window.addEventListener("close-panel", handleCustomClose);
    return () => {
      window.removeEventListener("close-panel", handleCustomClose);
    };
  }, [onClose]);

  if (!isVisible) return null;

  return (
    <div
      className={`${styles.backdrop} ${
        isAnimating ? styles.backdropActive : ""
      }`}
      onClick={handleBackdropClick}
    >
      <div
        className={`${styles.panel} ${styles[type]} ${
          isAnimating ? styles.panelActive : ""
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button for mobile */}
        <button
          className={styles.closeButton}
          onClick={onClose}
          aria-label="Close panel"
        >
          ×
        </button>

        <div className={styles.content}>{children}</div>
      </div>
    </div>
  );
}
