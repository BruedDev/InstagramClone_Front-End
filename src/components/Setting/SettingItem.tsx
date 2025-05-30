import React from "react";
import { ChevronRight } from "lucide-react";

interface SettingItemProps {
  label: string | React.ReactNode;
  noHover?: boolean;
}

export default function SettingItem({
  label,
  noHover = false,
}: SettingItemProps) {
  return (
    <div
      className={`flex items-center justify-between p-4 rounded-lg transition-colors
        ${noHover ? "" : "hover:bg-gray-800 cursor-pointer"}`}
    >
      <div className="text-white text-sm w-full">{label}</div>
      {typeof label === "string" && (
        <ChevronRight size={18} className="text-gray-400 shrink-0" />
      )}
    </div>
  );
}
