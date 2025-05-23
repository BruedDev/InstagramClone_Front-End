// components/Call/Call.tsx - Phiên bản đã cập nhật
import { Phone, Video, Info } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setInCall } from "@/store/messengerSlice";
import { socketService } from "@/server/socket";
import { User } from "@/types/user.type";
import styles from "./Messenger.module.scss";

interface CallProps {
  userId: string;
  calleeId: string;
  ringtoneRef: React.RefObject<HTMLAudioElement | null>;
  availableUsers: User[];
}

export default function Call({ userId, calleeId }: CallProps) {
  const dispatch = useAppDispatch();
  const { inCall } = useAppSelector((state) => state.messenger);

  // Mở CallModal dạng popup
  const openCallPopup = (callType: "audio" | "video") => {
    const screenWidth = window.screen.availWidth;
    const screenHeight = window.screen.availHeight;

    const width = Math.floor(screenWidth * 0.8); // dùng 80% chiều rộng
    const height = Math.floor(screenHeight * 0.9); // dùng 90% chiều cao
    const left = (screenWidth - width) / 2;
    const top = (screenHeight - height) / 2;

    // Truyền tham số cần thiết qua URL để CallModal có thể biết đang gọi ai và loại cuộc gọi
    const callWindow = window.open(
      `/call-modal?userId=${userId}&calleeId=${calleeId}&callType=${callType}`,
      "CallWindow",
      `width=${width},height=${height},top=${top},left=${left},resizable=yes,scrollbars=no`
    );

    return callWindow;
  };

  // Gọi audio - mở popup và xử lý
  const handleAudioCall = async () => {
    const callWindow = openCallPopup("audio");

    if (callWindow) {
      dispatch(setInCall(true));

      callWindow.onload = () => {
        const socket = socketService.getSocket();
        if (!socket) {
          console.error("Socket connection not available");
          return;
        }

        console.log("Emit callUser event:", {
          callerId: userId,
          calleeId,
          callType: "audio",
        });

        socket.emit("callUser", {
          callerId: userId,
          calleeId,
          callType: "audio",
        });
      };

      callWindow.onbeforeunload = () => {
        dispatch(setInCall(false));
      };
    } else {
      alert(
        "Không thể mở cửa sổ cuộc gọi. Vui lòng kiểm tra cài đặt trình duyệt của bạn."
      );
    }
  };

  const handleVideoCall = async () => {
    const callWindow = openCallPopup("video");

    if (callWindow) {
      dispatch(setInCall(true));

      callWindow.onload = () => {
        const socket = socketService.getSocket();
        if (!socket) {
          console.error("Socket connection not available");
          return;
        }

        console.log("Emit callUser event:", {
          callerId: userId,
          calleeId,
          callType: "video",
        });

        socket.emit("callUser", {
          callerId: userId,
          calleeId,
          callType: "video",
        });
      };

      callWindow.onbeforeunload = () => {
        dispatch(setInCall(false));
      };
    } else {
      alert(
        "Không thể mở cửa sổ cuộc gọi. Vui lòng kiểm tra cài đặt trình duyệt của bạn."
      );
    }
  };

  return (
    <div className="flex items-center">
      <button
        onClick={handleAudioCall}
        className="p-2 text-gray-400 hover:text-gray-200"
        title="Gọi thoại"
        disabled={inCall}
      >
        <Phone className="h-5 w-5" />
      </button>
      <button
        onClick={handleVideoCall}
        className="p-2 text-gray-400 hover:text-gray-200"
        title="Gọi video"
        disabled={inCall}
      >
        <Video className="h-5 w-5" />
      </button>
      <button
        className={`p-2 text-gray-400 hover:text-gray-200 ${styles.info}`}
      >
        <Info className="h-5 w-5" />
      </button>
    </div>
  );
}
