"use client";

import React, { useRef } from "react";
import MessengerComponent from "@/components/Messenger";

export default function MessagesPage() {
  const ringtoneRef = useRef<HTMLAudioElement>(null);

  return (
    <div>
      {/* Đặt audio ở đây */}
      <audio ref={ringtoneRef} src="/RingTone.mp3" loop />
      {/* Truyền ref xuống MessengerComponent */}
      <MessengerComponent ringtoneRef={ringtoneRef} />
    </div>
  );
}
