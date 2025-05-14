"use client";

import React, { useState } from "react";
import {
  Settings,
  User,
  Bell,
  Lock,
  Shield,
  HelpCircle,
  Info,
  Moon,
  Globe,
  ChevronRight,
  Menu,
  X,
  ArrowLeft,
} from "lucide-react";
import { useRouter } from "next/navigation";

export default function Setting() {
  const [activeTab, setActiveTab] = useState("account");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const router = useRouter();

  const handleBack = () => {
    router.back();
  };

  const tabs = [
    { id: "account", label: "Tài khoản", icon: <User size={20} /> },
    { id: "privacy", label: "Quyền riêng tư", icon: <Lock size={20} /> },
    { id: "security", label: "Bảo mật", icon: <Shield size={20} /> },
    { id: "notifications", label: "Thông báo", icon: <Bell size={20} /> },
    { id: "darkmode", label: "Chế độ tối", icon: <Moon size={20} /> },
    { id: "language", label: "Ngôn ngữ", icon: <Globe size={20} /> },
    { id: "help", label: "Trợ giúp", icon: <HelpCircle size={20} /> },
    { id: "about", label: "Giới thiệu", icon: <Info size={20} /> },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case "account":
        return (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-gray-800 rounded-lg">
              <div className="flex items-center space-x-3 mb-4 sm:mb-0">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 flex items-center justify-center">
                  <User className="text-white" size={24} />
                </div>
                <div>
                  <p className="text-white font-medium">Tô Văn Lộc</p>
                  <p className="text-gray-400 text-sm">vanloc19_6</p>
                </div>
              </div>
              <button className="px-3 py-1 text-sm bg-gray-700 rounded-md text-white">
                Sửa
              </button>
            </div>

            <div className="space-y-1">
              <SettingItem label="Thông tin cá nhân" />
              <SettingItem label="Đổi mật khẩu" />
              <SettingItem label="Email" />
              <SettingItem label="Số điện thoại" />
            </div>
          </div>
        );
      case "privacy":
        return (
          <div className="space-y-1">
            <SettingItem label="Chế độ riêng tư tài khoản" />
            <SettingItem label="Hoạt động trạng thái" />
            <SettingItem label="Chặn tài khoản" />
            <SettingItem label="Tài khoản hạn chế" />
          </div>
        );
      case "security":
        return (
          <div className="space-y-1">
            <SettingItem label="Xác thực hai yếu tố" />
            <SettingItem label="Ứng dụng và trang web" />
            <SettingItem label="Email từ Instagram" />
            <SettingItem label="Hoạt động đăng nhập" />
          </div>
        );
      case "notifications":
        return (
          <div className="space-y-1">
            <SettingItem label="Bài viết, tin và bình luận" />
            <SettingItem label="Tin nhắn" />
            <SettingItem label="Theo dõi và người theo dõi" />
            <SettingItem label="Instagram Direct" />
          </div>
        );
      default:
        return (
          <div className="flex items-center justify-center h-40 text-gray-400">
            Chưa có nội dung cho tab này
          </div>
        );
    }
  };

  const SettingItem = ({ label }: { label: string }) => (
    <div className="flex items-center justify-between p-4 hover:bg-gray-800 rounded-lg cursor-pointer transition-colors">
      <span className="text-white">{label}</span>
      <ChevronRight size={18} className="text-gray-400" />
    </div>
  );

  // Mobile header
  const MobileHeader = () => (
    <div className="flex items-center justify-between p-4 border-b border-[#333] md:hidden">
      {/* Left: Back */}
      <div className="text-white">
        {" "}
        <button onClick={handleBack} className="text-white cursor-pointer">
          <ArrowLeft size={20} />
        </button>
      </div>

      {/* Right: Menu button + Tab label */}
      <div className="flex items-center space-x-3">
        <h1 className="text-lg font-semibold text-white">
          {tabs.find((tab) => tab.id === activeTab)?.label}
        </h1>
        <button onClick={() => setMobileMenuOpen(true)} className="text-white">
          <Menu size={24} />
        </button>
      </div>
    </div>
  );

  // Mobile sidebar menu
  const MobileSidebar = () => (
    <div
      className={`fixed inset-0  z-50 transition-transform duration-300  bg-black md:hidden ${
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

  return (
    <div className="flex flex-col md:flex-row  text-white min-h-screen">
      {/* Mobile Header */}
      <MobileHeader />

      {/* Mobile Sidebar */}
      <MobileSidebar />

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
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-colors ${
                activeTab === tab.id ? "bg-gray-800" : "hover:bg-gray-800"
              }`}
            >
              <span
                className={
                  activeTab === tab.id ? "text-white" : "text-gray-400"
                }
              >
                {tab.icon}
              </span>
              <span
                className={
                  activeTab === tab.id ? "text-white" : "text-gray-400"
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
    </div>
  );
}
