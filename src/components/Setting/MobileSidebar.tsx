import React from "react";
import { Settings, X } from "lucide-react";

export type TabType = {
  id: string;
  label: string;
  icon?: React.ReactNode;
};

export type MobileSidebarProps = {
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
  activeTab: string;
  setActiveTab: (tabId: string) => void;
  tabs: TabType[];
};

export default function MobileSidebar({
  mobileMenuOpen,
  setMobileMenuOpen,
  activeTab,
  setActiveTab,
  tabs,
}: MobileSidebarProps) {
  return (
    <div
      className={`fixed inset-0 z-50 transition-transform duration-300 bg-black md:hidden ${
        mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      }`}
    >
      <div className="flex items-center justify-between p-4 border-b border-[#333]">
        <div className="flex items-center space-x-2">
          <Settings size={24} />
          <h1 className="text-xl font-semibold">Cài đặt</h1>
        </div>
        <button onClick={() => setMobileMenuOpen(false)} className="text-white">
          <X size={24} />
        </button>
      </div>

      <div className="p-4 space-y-1">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id);
              setMobileMenuOpen(false);
            }}
            className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-colors ${
              activeTab === tab.id ? "bg-gray-800" : "hover:bg-gray-800"
            }`}
          >
            <span
              className={activeTab === tab.id ? "text-white" : "text-gray-400"}
            >
              {tab.icon}
            </span>
            <span
              className={activeTab === tab.id ? "text-white" : "text-gray-400"}
            >
              {tab.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
