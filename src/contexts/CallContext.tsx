"use client";

// contexts/CallContext.tsx
import React, {
  createContext,
  useContext,
  useRef,
  useState,
  useEffect,
} from "react";
import { socketService } from "@/server/socket";

interface CallContextProps {
  inCall: boolean;
  incoming: null | { callerId: string; callType: string };
  activeCallUserId: string | null;
  handleEndCall: () => void;
  peerConnection: React.RefObject<RTCPeerConnection | null>;
  localStream: React.RefObject<MediaStream | null>;
  callWindowRef: React.RefObject<Window | null>;
  setInCall: React.Dispatch<React.SetStateAction<boolean>>;
  setIncoming: React.Dispatch<
    React.SetStateAction<null | { callerId: string; callType: string }>
  >;
  setActiveCallUserId: React.Dispatch<React.SetStateAction<string | null>>;
}

const CallContext = createContext<CallContextProps | undefined>(undefined);

export const useCallContext = () => {
  const context = useContext(CallContext);
  if (context === undefined) {
    throw new Error("useCallContext must be used within a CallProvider");
  }
  return context;
};

interface CallProviderProps {
  children: React.ReactNode;
  userId: string;
}

export const CallProvider: React.FC<CallProviderProps> = ({
  children,
  userId,
}) => {
  const [inCall, setInCall] = useState(false);
  const [incoming, setIncoming] = useState<null | {
    callerId: string;
    callType: string;
  }>(null);
  const [activeCallUserId, setActiveCallUserId] = useState<string | null>(null);

  const peerConnection = useRef<RTCPeerConnection | null>(null);
  const localStream = useRef<MediaStream | null>(null);
  const callWindowRef = useRef<Window | null>(null);

  // Hàm xử lý kết thúc cuộc gọi
  const handleEndCall = () => {
    if (activeCallUserId) {
      // Gửi thông báo kết thúc cuộc gọi
      socketService.endCall({
        to: activeCallUserId,
        from: userId,
      });

      // Dọn dẹp các resource
      handleEndCallCleanup();

      // Đóng cửa sổ popup nếu có
      if (callWindowRef.current) {
        callWindowRef.current.close();
        callWindowRef.current = null;
      }
    }
  };

  // Hàm dọn dẹp tài nguyên khi kết thúc cuộc gọi
  const handleEndCallCleanup = () => {
    // Dừng tất cả track trong localStream
    if (localStream.current) {
      localStream.current.getTracks().forEach((track) => {
        track.stop(); // Tắt camera/micro
      });
      localStream.current = null;
    }

    // Đóng peer connection nếu có
    if (peerConnection.current) {
      peerConnection.current.onicecandidate = null;
      peerConnection.current.ontrack = null;
      peerConnection.current.onconnectionstatechange = null;
      peerConnection.current.close();
      peerConnection.current = null;
    }

    // 🔥 Dọn triệt để: tìm mọi stream có thể vẫn đang mở và tắt track của chúng
    navigator.mediaDevices.enumerateDevices().then((devices) => {
      devices.forEach((device) => {
        if (device.kind === "audioinput" || device.kind === "videoinput") {
          navigator.mediaDevices
            .getUserMedia({
              audio: device.kind === "audioinput",
              video: device.kind === "videoinput",
            })
            .then((stream) => {
              stream.getTracks().forEach((track) => {
                track.stop(); // Tắt track ẩn còn sót
              });
            })
            .catch((err) => {
              console.warn("Không thể lấy stream để dọn dẹp thêm:", err);
            });
        }
      });
    });

    // Reset lại các state
    setInCall(false);
    setActiveCallUserId(null);
    setIncoming(null);
  };

  // Thiết lập socket listeners cho cuộc gọi
  useEffect(() => {
    const socket = socketService.getSocket();

    socket.on("callEnded", () => {
      handleEndCallCleanup();
      if (callWindowRef.current) {
        callWindowRef.current.close();
        callWindowRef.current = null;
      }
    });

    return () => {
      socket.off("callEnded");
    };
  }, [userId]);

  const value = {
    inCall,
    incoming,
    activeCallUserId,
    handleEndCall,
    peerConnection,
    localStream,
    callWindowRef,
    setInCall,
    setIncoming,
    setActiveCallUserId,
  };

  return <CallContext.Provider value={value}>{children}</CallContext.Provider>;
};

export default CallContext;
