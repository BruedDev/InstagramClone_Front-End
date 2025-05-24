import { useEffect, useRef, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { socketService } from "@/server/socket";
import { useCallContext } from "@/contexts/CallContext"; // Import useCallContext
import {
  setIncoming,
  fetchAvailableUsers,
  setInCall,
} from "@/store/messengerSlice";
import Image from "next/image";
import { Phone, Video, PhoneOff, UserIcon, X } from "lucide-react";

interface CallInterfaceProps {
  userId: string;
}

export default function CallInterface({ userId }: CallInterfaceProps) {
  const dispatch = useAppDispatch();
  const ringtoneRef = useRef<HTMLAudioElement>(null);
  const { availableUsers } = useAppSelector((state) => state.messenger);

  // Sử dụng CallContext thay vì local state
  const {
    incoming,
    setIncoming: setIncomingContext,
    setInCall: setInCallContext,
    setActiveCallUserId,
  } = useCallContext();

  const [showIncomingCall, setShowIncomingCall] = useState(false);

  // Lấy thông tin người gọi từ context
  const callerInfo = incoming
    ? availableUsers.find((u) => u._id === incoming.callerId)
    : null;
  const callerUsername =
    callerInfo?.username ?? (incoming ? incoming.callerId : "Đang tải...");
  const callerProfilePicture = callerInfo?.profilePicture;

  useEffect(() => {
    // Fetch available users khi component được mount
    if (userId) {
      dispatch(fetchAvailableUsers());
    }
  }, [dispatch, userId]);

  useEffect(() => {
    if (!userId) return;

    const socketInstance = socketService.initSocket();
    socketService.registerUser(userId);

    const handleIncomingCall = (data: {
      callerId: string;
      callType: "audio" | "video";
    }) => {
      console.log("Incoming call received:", data);

      // Cập nhật context thay vì local state
      setIncomingContext(data);
      setShowIncomingCall(true);
      dispatch(setIncoming(data));

      if (ringtoneRef.current) {
        ringtoneRef.current.currentTime = 0;
        ringtoneRef.current.play().catch((error) => {
          console.error("Không thể phát nhạc chuông:", error);
        });
      }
    };

    // Xử lý khi cuộc gọi bị từ chối từ phía đối phương
    const handleCallRejected = (data: { calleeId: string; reason: string }) => {
      console.log("Call rejected:", data);

      // Hiển thị alert cho người gọi
      alert(`Cuộc gọi bị từ chối: ${data.reason}`);

      // Reset trạng thái
      setIncomingContext(null);
      setShowIncomingCall(false);
      setInCallContext(false);
      setActiveCallUserId(null);
      dispatch(setIncoming(null));
      dispatch(setInCall(false));

      // Reload trang để đảm bảo trạng thái sạch
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    };

    // Xử lý khi cuộc gọi được chấp nhận từ phía đối phương
    const handleCallAccepted = (data: { calleeId: string }) => {
      console.log("Call accepted:", data);

      // Cập nhật trạng thái cuộc gọi
      setInCallContext(true);
      setActiveCallUserId(data.calleeId);
      dispatch(setInCall(true));

      // Reload trang chính để đảm bảo đồng bộ trạng thái
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    };

    if (socketInstance) {
      socketInstance.on("incomingCall", handleIncomingCall);
      socketInstance.on("callRejected", handleCallRejected);
      socketInstance.on("callAccepted", handleCallAccepted);
    } else {
      console.warn(
        "CallProvider: Socket not initialized, listeners not attached."
      );
    }

    return () => {
      if (socketInstance) {
        socketInstance.off("incomingCall", handleIncomingCall);
        socketInstance.off("callRejected", handleCallRejected);
        socketInstance.off("callAccepted", handleCallAccepted);
      }
    };
  }, [
    userId,
    dispatch,
    setIncomingContext,
    setInCallContext,
    setActiveCallUserId,
  ]);

  const openCallPopup = (callType: "audio" | "video", remoteUserId: string) => {
    const screenWidth = window.screen.availWidth;
    const screenHeight = window.screen.availHeight;

    const width = Math.floor(screenWidth * 0.8);
    const height = Math.floor(screenHeight * 0.9);
    const left = (screenWidth - width) / 2;
    const top = (screenHeight - height) / 2;

    const callWindow = window.open(
      `/call-modal?userId=${userId}&calleeId=${remoteUserId}&callType=${callType}`,
      "CallWindow",
      `width=${width},height=${height},top=${top},left=${left},resizable=yes,scrollbars=no`
    );

    return callWindow;
  };

  const handleAccept = async () => {
    if (ringtoneRef.current) {
      ringtoneRef.current.pause();
      ringtoneRef.current.currentTime = 0;
    }

    if (incoming) {
      const currentSocket = socketService.getSocket();
      if (currentSocket) {
        currentSocket.emit("acceptCall", {
          callerId: incoming.callerId,
          calleeId: userId,
        });

        const callWindow = openCallPopup(
          incoming.callType as "audio" | "video",
          incoming.callerId
        );

        if (callWindow) {
          callWindow.onbeforeunload = () => {
            setInCallContext(false);
            dispatch(setInCall(false));
          };

          // Cập nhật context
          setInCallContext(true);
          setActiveCallUserId(incoming.callerId);
          dispatch(setInCall(true));
        } else {
          alert(
            "Không thể mở cửa sổ cuộc gọi. Vui lòng kiểm tra cài đặt trình duyệt của bạn."
          );
        }
      } else {
        console.error("Cannot accept call: Socket not available.");
        alert("Lỗi kết nối, không thể chấp nhận cuộc gọi.");
      }

      // Reset trạng thái
      setShowIncomingCall(false);
      setIncomingContext(null);
      dispatch(setIncoming(null));
    }
  };

  const handleReject = () => {
    if (ringtoneRef.current) {
      ringtoneRef.current.pause();
      ringtoneRef.current.currentTime = 0;
    }

    if (incoming) {
      const currentSocket = socketService.getSocket();
      if (currentSocket) {
        // Gửi sự kiện từ chối cuộc gọi với lý do cụ thể
        currentSocket.emit("rejectCall", {
          callerId: incoming.callerId,
          calleeId: userId,
          reason: "Người dùng đã từ chối cuộc gọi",
        });
      } else {
        console.error("Cannot reject call: Socket not available.");
      }

      // Reset trạng thái context
      setShowIncomingCall(false);
      setIncomingContext(null);
      setActiveCallUserId(null);
      dispatch(setIncoming(null));
    }
  };

  return (
    <>
      <audio ref={ringtoneRef} src="/RingTone.mp3" loop />

      {showIncomingCall && incoming && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center transition-opacity duration-300"
          style={{
            height: "100dvh",
            zIndex: 99999,
            backgroundColor: "rgba(0, 0, 0, 0.8)",
          }}
        >
          <div
            className="w-[320px] bg-[#121212] rounded-2xl overflow-hidden transition-all duration-300 transform translate-y-0 opacity-100"
            style={{ boxShadow: "0 0 35px rgba(138, 43, 226, 0.25)" }}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-[#1f1f1f] to-[#252525] px-6 py-4 flex items-center justify-between border-b border-[#333333]">
              <div className="flex items-center gap-2">
                <span className="inline-block h-2.5 w-2.5 rounded-full bg-purple-500 animate-pulse"></span>
                <span className="text-white font-medium">Cuộc gọi đến</span>
              </div>
              <button
                onClick={handleReject}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Nội dung */}
            <div className="px-6 pt-8 pb-6">
              <div className="flex flex-col items-center justify-center mb-8">
                <div className="relative mb-5">
                  <div className="absolute -inset-1 rounded-full opacity-30 bg-purple-500/20 animate-ping"></div>
                  {callerProfilePicture ? (
                    <div className="relative w-28 h-28 mb-1 rounded-full ring-2 ring-purple-500 p-1 overflow-hidden z-10">
                      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/40 to-indigo-600/40 rounded-full z-10"></div>
                      <Image
                        src={callerProfilePicture}
                        alt={callerUsername ?? ""}
                        fill
                        className="rounded-full object-cover z-0"
                      />
                    </div>
                  ) : (
                    <div className="w-28 h-28 rounded-full bg-[#191919] ring-2 ring-purple-500 flex items-center justify-center mb-1 relative overflow-hidden z-10">
                      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-indigo-600/20"></div>
                      <UserIcon className="w-14 h-14 text-gray-300 z-10" />
                    </div>
                  )}
                </div>
                <h3 className="text-xl font-bold text-white mb-1 animate-pulse">
                  {callerUsername}
                </h3>
                <div className="flex items-center px-3 py-1.5 bg-[#1a1a1a] rounded-full text-gray-200 text-sm border border-[#333333]">
                  {incoming.callType === "audio" ? (
                    <Phone size={14} className="mr-1.5 text-purple-400" />
                  ) : (
                    <Video size={14} className="mr-1.5 text-purple-400" />
                  )}
                  <span>
                    {incoming.callType === "audio"
                      ? "Cuộc gọi thoại"
                      : "Cuộc gọi video"}
                  </span>
                </div>
              </div>

              {/* Call action buttons */}
              <div className="flex justify-center space-x-8">
                <button
                  onClick={handleReject}
                  className="flex flex-col items-center gap-1 group"
                >
                  <div className="w-16 h-16 flex items-center justify-center rounded-full bg-[#2a2a2a] hover:bg-gradient-to-r hover:from-[#4a1919] hover:to-[#6b2626] shadow-lg shadow-red-900/20 transition-all transform hover:scale-105 active:scale-95 border border-[#ff4d4d]/30">
                    <PhoneOff
                      size={24}
                      className="text-[#ff4d4d] group-hover:text-white"
                    />
                  </div>
                  <span className="text-gray-400 text-sm mt-1">Từ chối</span>
                </button>
                <button
                  onClick={handleAccept}
                  className="flex flex-col items-center gap-1 group"
                >
                  <div className="w-16 h-16 flex items-center justify-center rounded-full bg-[#2a2a2a] hover:bg-gradient-to-r hover:from-[#2a1f4a] hover:to-[#372e6b] shadow-lg shadow-purple-900/20 transition-all transform hover:scale-105 active:scale-95 border border-purple-500/30">
                    {incoming.callType === "audio" ? (
                      <Phone
                        size={24}
                        className="text-purple-400 group-hover:text-white animate-bounce"
                      />
                    ) : (
                      <Video
                        size={24}
                        className="text-purple-400 group-hover:text-white animate-bounce"
                      />
                    )}
                  </div>
                  <span className="text-gray-400 text-sm mt-1">Trả lời</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
