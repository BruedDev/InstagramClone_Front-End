import React from "react";
import SettingItem from "./SettingItem";

export default function SecurityContent() {
  return (
    <div className="space-y-1">
      <SettingItem label="Xác thực hai yếu tố" />
      <SettingItem label="Ứng dụng và trang web" />
      <SettingItem label="Email từ Instagram" />
      <SettingItem label="Hoạt động đăng nhập" />
    </div>
  );
}
