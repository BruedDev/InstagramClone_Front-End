"use client";
import React, { useRef } from "react";
import MessengerComponent from "@/components/Messenger/index";

export default function MessengerClientWrapper() {
  const ringtoneRef = useRef<HTMLAudioElement>(null);

  return (
    <>
      <audio ref={ringtoneRef} src="/RingTone.mp3" loop />
      <MessengerComponent ringtoneRef={ringtoneRef} />
    </>
  );
}
