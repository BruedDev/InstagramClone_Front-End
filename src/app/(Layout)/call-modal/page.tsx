"use client";

import { useEffect } from "react";
import CallModal from "@/components/Modal/CallModal";
import { useUser } from "@/app/hooks/useUser";
import { CallProvider } from "@/contexts/CallContext";
import { useCall } from "@/app/hooks/useCall";
import { useSearchParams } from "next/navigation";

export default function CallModalPage() {
  const { user } = useUser();

  if (!user || !user._id) {
    return <div>Đang tải...</div>;
  }

  const userId = user._id;

  console.log("✅ userId sau khi xác thực user:", userId);

  return (
    <CallProvider userId={userId}>
      <InnerCallModal />
    </CallProvider>
  );
}

const InnerCallModal = () => {
  const searchParams = useSearchParams();
  const calleeId = searchParams.get("calleeId"); // người được gọi

  const {
    activeCallUserId,
    setActiveCallUserId,
    handleEndCall: contextHandleEndCall,
  } = useCall();

  useEffect(() => {
    if (calleeId) {
      setActiveCallUserId(calleeId);
    }

    document.title = "Cuộc gọi";

    const handleBeforeUnload = () => {
      // Gọi hàm kết thúc cuộc gọi khi người dùng đóng cửa sổ
      if (activeCallUserId) {
        contextHandleEndCall();
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [calleeId, setActiveCallUserId, activeCallUserId, contextHandleEndCall]);

  const handleEndCall = () => {
    // Gọi hàm xử lý kết thúc cuộc gọi từ context
    contextHandleEndCall();

    // // Đóng cửa sổ popup sau khi kết thúc cuộc gọi
    if (window.opener) {
      window.opener.location.reload(); // Reload tab chính
    }

    window.close();
  };

  return (
    <>
      <CallModal handleEndCall={handleEndCall} />
    </>
  );
};
