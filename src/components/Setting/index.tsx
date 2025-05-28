"use client";

import React, { useState, useEffect } from "react";
import { Settings, ArrowLeft, LogOut, X } from "lucide-react";
import { useRouter } from "next/navigation";
import MobileHeader from "./MobileHeader";
import MobileSidebar from "./MobileSidebar";
import AccountContent from "./AccountContent";
import PrivacyContent from "./PrivacyContent";
import SecurityContent from "./SecurityContent";
import NotificationsContent from "./NotificationsContent";
import { tabs } from "./tab";
import useLogout from "@/app/hooks/useLogout";
import styles from "./Setting.module.scss";

export default function Setting() {
  const [activeTab, setActiveTab] = useState("account");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const router = useRouter();
  const { handleLogout, isLoggingOut, logoutError } = useLogout();

  // Chỉ chạy một lần khi component mount để check mobile
  useEffect(() => {
    const isMobile = window.innerWidth < 768;
    if (isMobile) {
      setActiveTab(""); // Không active tab nào trên mobile
      setMobileMenuOpen(true); // Mở sidebar sẵn
    }
    setIsInitialized(true);
  }, []);

  const handleBack = () => {
    // Nếu đang ở mobile và chưa mở sidebar thì mở sidebar, clear tab
    if (window.innerWidth < 768 && !mobileMenuOpen) {
      setMobileMenuOpen(true);
      setActiveTab("");
    } else {
      router.back();
    }
  };

  const onLogout = async () => {
    await handleLogout();
    setShowLogoutModal(false);
  };

  const handleTabClick = (tabId: string) => {
    if (tabId === "logout") {
      setShowLogoutModal(true);
    } else {
      setActiveTab(tabId);
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "account":
        return <AccountContent />;
      case "privacy":
        return <PrivacyContent />;
      case "security":
        return <SecurityContent />;
      case "notifications":
        return <NotificationsContent />;
      default:
        return (
          <div className="flex items-center justify-center h-40 text-gray-400">
            Chưa có nội dung cho tab này
          </div>
        );
    }
  };

  // Modal đăng xuất
  const LogoutModal = () => {
    if (!showLogoutModal) return null;

    return (
      <div
        className={`fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4 ${styles.container}`}
      >
        <div className="bg-gray-800 rounded-xl max-w-md w-full shadow-2xl transform transition-all animate-fade-in">
          <div className="flex items-center justify-between p-5 border-b border-gray-700">
            <div className="flex items-center space-x-3">
              <LogOut size={22} className="text-red-500" />
              <h3 className="text-xl font-semibold">Đăng xuất tài khoản</h3>
            </div>
            <button
              onClick={() => setShowLogoutModal(false)}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <div className="p-6">
            <p className="mb-6 text-gray-300">
              Bạn có chắc chắn muốn đăng xuất khỏi tài khoản của mình?
            </p>

            {logoutError && (
              <div className="mb-4 p-3 bg-red-900/50 border border-red-700 rounded-md text-red-200">
                {logoutError}
              </div>
            )}

            <div className="flex space-x-3 justify-end">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="px-4 py-2 rounded-md border border-gray-600 hover:bg-gray-700 transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={onLogout}
                disabled={isLoggingOut}
                className="bg-gray-800 hover:bg-red-700 text-white px-4 py-2 rounded-md transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed flex items-center"
              >
                {isLoggingOut ? "Đang đăng xuất..." : "Đăng xuất"}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Không render gì cho đến khi đã initialize xong
  if (!isInitialized) {
    return null;
  }

  return (
    <div className="flex flex-col md:flex-row text-white min-h-screen">
      {/* Mobile Header */}
      <MobileHeader
        activeTab={activeTab}
        tabs={tabs}
        setMobileMenuOpen={setMobileMenuOpen}
        handleBack={handleBack}
      />

      {/* Mobile Sidebar */}
      <MobileSidebar
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
        activeTab={activeTab}
        setActiveTab={handleTabClick}
        tabs={tabs}
      />

      {/* Desktop Sidebar */}
      <div className="hidden md:block md:w-1/4 lg:w-1/5 border-r border-[#333] p-4">
        {/* Top section: Back on the left, Settings + Title on the right */}
        <div className="flex items-center justify-between mb-6">
          {/* Left: Back */}
          <div className="text-white">
            <button onClick={handleBack} className="text-white cursor-pointer">
              <ArrowLeft size={20} />
            </button>
          </div>

          {/* Right: Settings icon + Title */}
          <div className="flex items-center space-x-2">
            <Settings size={24} className="text-white" />
            <h1 className="text-xl font-semibold text-white">Cài đặt</h1>
          </div>
        </div>

        {/* Tabs */}
        <div className="space-y-1">
          {tabs.map((tab) => (
            <div
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-colors ${
                activeTab === tab.id && tab.id !== "logout"
                  ? "bg-gray-800"
                  : "hover:bg-gray-800"
              } ${tab.id === "logout" ? "text-gray-400" : ""}`}
            >
              <span
                className={
                  activeTab === tab.id && tab.id !== "logout"
                    ? "text-white"
                    : tab.id === "logout"
                    ? ""
                    : "text-gray-400"
                }
              >
                {tab.icon}
              </span>
              <span
                className={
                  activeTab === tab.id && tab.id !== "logout"
                    ? "text-white"
                    : tab.id === "logout"
                    ? ""
                    : "text-gray-400"
                }
              >
                {tab.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="w-full md:w-3/4 lg:w-4/5 p-4 md:p-6">
        <h2 className="hidden md:block text-xl font-semibold mb-6">
          {tabs.find((tab) => tab.id === activeTab)?.label}
        </h2>

        {renderTabContent()}
      </div>

      {/* Modal Đăng xuất */}
      <LogoutModal />
    </div>
  );
}
