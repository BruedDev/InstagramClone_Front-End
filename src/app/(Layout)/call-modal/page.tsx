"use client";

import { useEffect, useState } from "react";
import CallModal from "@/components/Modal/Call_Messenger/CallModal";
import { useUser } from "@/app/hooks/useUser";
import { CallProvider } from "@/contexts/CallContext";
import { useCall } from "@/app/hooks/useCall";
import { useSearchParams } from "next/navigation";
import { socketService } from "@/server/socket";

export default function CallModalPage() {
  const { user } = useUser();

  if (!user || !user._id) {
    return <div>Đang tải thông tin người dùng...</div>;
  }

  const userId = user._id;

  return (
    <CallProvider userId={userId}>
      <InnerCallModal />
    </CallProvider>
  );
}

const InnerCallModal = () => {
  const searchParams = useSearchParams();
  const calleeId = searchParams.get("calleeId");

  const [callRejected, setCallRejected] = useState(false);
  const [callEnded, setCallEnded] = useState(false);

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

    // Socket listeners cho popup
    const socket = socketService.getSocket();
    if (socket) {
      // Xử lý khi cuộc gọi bị từ chối
      const handleCallRejected = () => {
        setCallRejected(true);

        // Hiển thị thông báo
        // alert(`Cuộc gọi bị từ chối`);

        // Đóng popup và reload trang chính
        setTimeout(() => {
          if (window.opener) {
            window.opener.location.reload();
          }
          window.close();
        }, 1000);
      };

      // Xử lý khi cuộc gọi kết thúc
      const handleCallEnded = () => {
        console.log("Call ended in popup");
        setCallEnded(true);

        // Đóng popup và reload trang chính
        setTimeout(() => {
          if (window.opener) {
            window.opener.location.reload();
          }
          window.close();
        }, 500);
      };

      // Xử lý khi cuộc gọi được chấp nhận
      const handleCallAccepted = (data: { calleeId: string }) => {
        console.log("Call accepted in popup:", data);
      };

      socket.on("callRejected", handleCallRejected);
      socket.on("callEnded", handleCallEnded);
      socket.on("callAccepted", handleCallAccepted);

      // Cleanup listeners
      return () => {
        socket.off("callRejected", handleCallRejected);
        socket.off("callEnded", handleCallEnded);
        socket.off("callAccepted", handleCallAccepted);
      };
    }
  }, [calleeId, setActiveCallUserId]);

  // Handle beforeunload
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (activeCallUserId && !callRejected && !callEnded) {
        contextHandleEndCall();
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [activeCallUserId, contextHandleEndCall, callRejected, callEnded]);

  const handleEndCall = () => {
    // Gọi hàm xử lý kết thúc cuộc gọi từ context
    contextHandleEndCall();

    // Reload trang chính và đóng popup
    if (window.opener) {
      window.opener.location.reload();
    }
    window.close();
  };

  // Nếu cuộc gọi bị từ chối, hiển thị thông báo thay vì CallModal
  if (callRejected) {
    return (
      <div className="fixed inset-0 w-screen h-screen flex items-center justify-center bg-[#121212] text-white text-lg z-50">
        <div className="text-center">
          <p>Cuộc gọi đã bị từ chối</p>
          <p className="text-sm text-gray-400 mt-2">Đang đóng cửa sổ...</p>
        </div>
      </div>
    );
  }

  // Nếu cuộc gọi đã kết thúc
  if (callEnded) {
    return (
      <div className="fixed inset-0 w-screen h-screen flex items-center justify-center bg-[#121212] text-white text-lg z-50">
        <div className="text-center">
          <p>Cuộc gọi đã kết thúc</p>
          <p className="text-sm text-gray-400 mt-2">Đang đóng cửa sổ...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 w-screen h-screen flex items-center justify-center bg-zinc-900 z-40">
      <CallModal handleEndCall={handleEndCall} />
    </div>
  );
};
