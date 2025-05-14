import React from "react";
import { ChevronRight } from "lucide-react";

export default function SettingItem({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-between p-4 hover:bg-gray-800 rounded-lg cursor-pointer transition-colors">
      <span className="text-white">{label}</span>
      <ChevronRight size={18} className="text-gray-400" />
    </div>
  );
}
