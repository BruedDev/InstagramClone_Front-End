import { useEffect, useRef, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { socketService } from "@/server/socket";
import {
  setIncoming,
  fetchAvailableUsers,
  setInCall,
} from "@/store/messengerSlice";
import Image from "next/image";
import { Phone, Video, PhoneOff, UserIcon, X } from "lucide-react";

interface CallProviderProps {
  userId: string;
}

export default function CallProvider({ userId }: CallProviderProps) {
  const dispatch = useAppDispatch();
  const ringtoneRef = useRef<HTMLAudioElement>(null);
  const { availableUsers } = useAppSelector((state) => state.messenger);
  const [showIncomingCall, setShowIncomingCall] = useState(false);
  const [incomingCallData, setIncomingCallData] = useState<{
    callerId: string;
    callType: "audio" | "video";
  } | null>(null);

  // Lấy thông tin người gọi
  const callerInfo = incomingCallData
    ? availableUsers.find((u) => u._id === incomingCallData.callerId)
    : null;
  const callerUsername = callerInfo?.username ?? incomingCallData?.callerId;
  const callerProfilePicture = callerInfo?.profilePicture;

  useEffect(() => {
    // Fetch available users khi component được mount
    dispatch(fetchAvailableUsers());
  }, [dispatch]);

  useEffect(() => {
    const socket = socketService.initSocket();

    // Đăng ký người dùng với socket
    socketService.registerUser(userId);

    // Lắng nghe các sự kiện cuộc gọi
    socket.on(
      "incomingCall",
      (data: { callerId: string; callType: "audio" | "video" }) => {
        console.log("Incoming call received:", data);

        // Hiển thị thông báo cuộc gọi đến
        setIncomingCallData(data);
        setShowIncomingCall(true);

        // Lưu thông tin cuộc gọi vào Redux store
        dispatch(setIncoming(data));

        // Phát nhạc chuông khi có cuộc gọi đến
        if (ringtoneRef.current) {
          ringtoneRef.current.currentTime = 0;
          ringtoneRef.current.play().catch((error) => {
            console.error("Không thể phát nhạc chuông:", error);
          });
        }
      }
    );

    return () => {
      socket.off("incomingCall");
    };
  }, [userId, dispatch, availableUsers]);

  // Mở CallModal dạng popup
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

    if (incomingCallData) {
      socketService.getSocket().emit("acceptCall", {
        callerId: incomingCallData.callerId,
        calleeId: userId,
      });

      const callWindow = openCallPopup(
        incomingCallData.callType,
        incomingCallData.callerId
      );

      if (callWindow) {
        callWindow.onbeforeunload = () => {
          dispatch(setInCall(false));
        };
        dispatch(setInCall(true));
      } else {
        alert(
          "Không thể mở cửa sổ cuộc gọi. Vui lòng kiểm tra cài đặt trình duyệt của bạn."
        );
      }

      setShowIncomingCall(false);
      setIncomingCallData(null);
      dispatch(setIncoming(null));
    }
  };

  const handleReject = () => {
    if (ringtoneRef.current) {
      ringtoneRef.current.pause();
      ringtoneRef.current.currentTime = 0;
    }

    if (incomingCallData) {
      // Gửi thông báo từ chối cuộc gọi với lý do
      socketService.getSocket().emit("rejectCall", {
        callerId: incomingCallData.callerId,
        calleeId: userId,
        reason: "Người dùng đã từ chối cuộc gọi",
      });

      setShowIncomingCall(false);
      setIncomingCallData(null);
      dispatch(setIncoming(null));
    }
  };

  return (
    <>
      <audio ref={ringtoneRef} src="/RingTone.mp3" loop />

      {/* Modal cuộc gọi đến */}
      {showIncomingCall && incomingCallData && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center transition-opacity duration-300"
          style={{ height: "100dvh" }}
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
                  {/* Hiệu ứng ping có sẵn trong Tailwind */}
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
                  {incomingCallData.callType === "audio" ? (
                    <Phone size={14} className="mr-1.5 text-purple-400" />
                  ) : (
                    <Video size={14} className="mr-1.5 text-purple-400" />
                  )}
                  <span>
                    {incomingCallData.callType === "audio"
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
                    {incomingCallData.callType === "audio" ? (
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
