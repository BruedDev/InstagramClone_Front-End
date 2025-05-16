"use client";

import React, { useRef } from "react";
import { useUser } from "@/app/hooks/useUser";
import MessengerComponent from "@/components/Messenger";

export default function MessagesPage() {
  const { user, loading } = useUser();
  const ringtoneRef = useRef<HTMLAudioElement>(null);

  if (loading) {
    return <div>Đang tải dữ liệu người dùng...</div>;
  }

  if (!user) {
    return <div>Chưa có thông tin người dùng</div>;
  }

  return (
    <div>
      {/* Đặt audio ở đây */}
      <audio ref={ringtoneRef} src="/RingTone.mp3" loop />
      {/* Truyền ref xuống MessengerComponent */}
      <MessengerComponent ringtoneRef={ringtoneRef} />
    </div>
  );
}
