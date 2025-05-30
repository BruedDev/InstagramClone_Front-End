import React from "react";
import SettingItem from "./SettingItem";

export default function PrivacyContent() {
  return (
    <div className="space-y-1">
      <SettingItem label="Chế độ riêng tư tài khoản" />
      <SettingItem label="Hoạt động trạng thái" />
      <SettingItem label="Chặn tài khoản" />
      <SettingItem label="Tài khoản hạn chế" />
    </div>
  );
}
