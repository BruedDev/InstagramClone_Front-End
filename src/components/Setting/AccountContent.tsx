import React from "react";
import { User } from "lucide-react";
import SettingItem from "./SettingItem";

export default function AccountContent() {
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
}
