"use client";

import React, { useState } from "react";
import SettingItem from "./SettingItem";
import { useUser } from "@/app/hooks/useUser";
import Image from "next/image";
import { updateBio } from "@/server/user";

export default function AccountContent() {
  const { user, loading } = useUser();
  const [bio, setBio] = useState(user?.bio || "");
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");

  if (loading || !user) {
    return null;
  }

  const handleSaveBio = async () => {
    try {
      setIsSaving(true);
      await updateBio(bio);
      setMessage("✅ Đã lưu thành công!");
      setBio("");
    } catch (error: unknown) {
      if (error instanceof Error) {
        setMessage(`❌ Lưu thất bại: ${error.message}`);
      } else {
        setMessage("❌ Lưu thất bại. Vui lòng thử lại.");
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-[#222] rounded-lg">
        <div className="flex items-center space-x-3 mb-4 sm:mb-0">
          <div className="w-12 h-12 rounded-full border border-gray-300 flex items-center justify-center">
            <Image
              src={user.profilePicture}
              alt="avatar"
              width={40}
              height={40}
              className="rounded-full"
            />
          </div>
          <div>
            <p className="text-white font-medium">{user.fullName}</p>
            <p className="text-gray-400 text-sm">{user.username}</p>
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

        <SettingItem
          noHover
          label={
            <div className="w-full">
              <label htmlFor="bio" className="text-white text-sm mb-1 block">
                Thêm tiểu sử
              </label>
              <textarea
                id="bio"
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Viết gì đó về bạn..."
                className="w-full bg-[#222] text-white text-sm p-2 rounded-md border border-[#333] focus:outline-none focus:ring-[#555] resize-none mt-2"
              />
              <div className="flex justify-between items-center mt-2">
                {message && (
                  <span className="text-xs text-gray-400">{message}</span>
                )}
                <button
                  onClick={handleSaveBio}
                  disabled={isSaving}
                  className="px-4 py-1.5 text-sm bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white rounded-md font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? "Đang lưu..." : "💾 Lưu"}
                </button>
              </div>
            </div>
          }
        />
      </div>
    </div>
  );
}
