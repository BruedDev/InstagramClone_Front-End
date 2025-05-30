import React from "react";
import { ArrowLeft } from "lucide-react";

interface TabItem {
  id: string;
  label: string;
  icon: React.ReactNode;
}

interface MobileHeaderProps {
  activeTab: string;
  tabs: TabItem[];
  setMobileMenuOpen: (isOpen: boolean) => void;
  handleBack: () => void;
}

export default function MobileHeader({
  activeTab,
  tabs,
  // setMobileMenuOpen,
  handleBack,
}: MobileHeaderProps) {
  return (
    <div className="flex items-center justify-between p-4 border-b border-[#333] md:hidden">
      {/* Left: Back */}
      <div className="text-white">
        <button onClick={handleBack} className="text-white cursor-pointer">
          <ArrowLeft size={20} />
        </button>
      </div>

      {/* Right: Menu button + Tab label */}
      <div className="flex items-center space-x-3 flex-1 justify-center">
        <h1 className="text-lg font-semibold text-white">
          {tabs.find((tab) => tab.id === activeTab)?.label}
        </h1>
        {/* <button onClick={() => setMobileMenuOpen(true)} className="text-white">
          <Menu size={24} />
        </button> */}
      </div>
    </div>
  );
}
