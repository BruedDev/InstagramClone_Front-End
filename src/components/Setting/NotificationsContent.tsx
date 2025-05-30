import React from "react";
import SettingItem from "./SettingItem";

export default function NotificationsContent() {
  return (
    <div className="space-y-1">
      <SettingItem label="Bài viết, tin và bình luận" />
      <SettingItem label="Tin nhắn" />
      <SettingItem label="Theo dõi và người theo dõi" />
      <SettingItem label="Instagram Direct" />
    </div>
  );
}
