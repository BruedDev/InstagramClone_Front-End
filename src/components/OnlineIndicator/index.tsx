import React from "react";

interface OnlineIndicatorProps {
  isOnline: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export const OnlineIndicator: React.FC<OnlineIndicatorProps> = ({
  isOnline,
  size = "md",
  className = "",
}) => {
  if (!isOnline) return null;

  const sizeClasses = {
    sm: "w-3 h-3",
    md: "w-4 h-4",
    lg: "w-5 h-5",
  };

  return (
    <div
      className={`absolute bottom-0 right-0 bg-green-500 border-2 border-[#222] rounded-full ${sizeClasses[size]} ${className}`}
    />
  );
};
