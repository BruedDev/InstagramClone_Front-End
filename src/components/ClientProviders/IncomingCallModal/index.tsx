import Image from "next/image";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setInCall, setIncoming } from "@/store/messengerSlice";
import { socketService } from "@/server/socket";
import { User } from "@/types/user.type";

interface IncomingCallModalProps {
  userId: string;
  ringtoneRef: React.RefObject<HTMLAudioElement | null>;
  availableUsers: User[];
}

export default function IncomingCallModal({
  userId,
  ringtoneRef,
  availableUsers,
}: IncomingCallModalProps) {
  const dispatch = useAppDispatch();
  const { incoming } = useAppSelector((state) => state.messenger);

  // Lấy đúng thông tin người gọi đến từ availableUsers
  const callerInfo = incoming
    ? availableUsers.find((u) => u._id === incoming.callerId)
    : null;
  const callerUsername = callerInfo?.username ?? incoming?.callerId;
  const callerProfilePicture = callerInfo?.profilePicture;

  // Mở CallModal dạng popup
  const openCallPopup = (callType: "audio" | "video", remoteUserId: string) => {
    const screenWidth = window.screen.availWidth;
    const screenHeight = window.screen.availHeight;

    const width = Math.floor(screenWidth * 0.8); // dùng 80% chiều rộng
    const height = Math.floor(screenHeight * 0.9); // dùng 90% chiều cao
    const left = (screenWidth - width) / 2;
    const top = (screenHeight - height) / 2;

    // Truyền tham số cần thiết qua URL để CallModal có thể biết đang gọi ai và loại cuộc gọi
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
      // Thông báo chấp nhận cuộc gọi
      socketService.getSocket().emit("acceptCall", {
        callerId: incoming.callerId,
        calleeId: userId,
      });

      // Mở cửa sổ cuộc gọi
      const callWindow = openCallPopup(incoming.callType, incoming.callerId);

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

      // Xóa incoming call sau khi xử lý
      dispatch(setIncoming(null));
    }
  };

  const handleReject = () => {
    if (ringtoneRef.current) {
      ringtoneRef.current.pause();
      ringtoneRef.current.currentTime = 0;
    }

    if (incoming) {
      socketService.getSocket().emit("rejectCall", {
        callerId: incoming.callerId,
        calleeId: userId,
      });
      dispatch(setIncoming(null));
    }
  };

  // Kiểm tra xem có cuộc gọi đến hay không, nếu có thì hiển thị modal
  if (!incoming) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0,0,0,0.5)",
        zIndex: 1200,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: 8,
          padding: 24,
          minWidth: 280,
          textAlign: "center",
        }}
      >
        <div style={{ marginBottom: 16 }}>
          <b>Có người gọi đến!</b>
          <div
            style={{
              marginTop: 8,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            {callerProfilePicture ? (
              <Image
                src={callerProfilePicture}
                width={48}
                height={48}
                alt={callerUsername ?? ""}
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: "50%",
                  marginBottom: 8,
                }}
              />
            ) : (
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: "50%",
                  background: "#eee",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 8,
                  fontWeight: "bold",
                  fontSize: 24,
                  color: "#888",
                }}
              >
                {callerUsername?.charAt(0).toUpperCase() ?? "?"}
              </div>
            )}
            <span style={{ color: "#0070f3", fontWeight: "bold" }}>
              {callerUsername}
            </span>
          </div>
          <div>
            Loại:{" "}
            {incoming.callType === "audio"
              ? "Cuộc gọi thoại"
              : "Cuộc gọi video"}
          </div>
        </div>
        <button
          style={{
            marginRight: 12,
            padding: "8px 16px",
            background: "#0070f3",
            color: "#fff",
            border: "none",
            borderRadius: 4,
            cursor: "pointer",
          }}
          onClick={handleAccept}
        >
          Đồng ý
        </button>
        <button
          style={{
            padding: "8px 16px",
            background: "#e00",
            color: "#fff",
            border: "none",
            borderRadius: 4,
            cursor: "pointer",
          }}
          onClick={handleReject}
        >
          Từ chối
        </button>
      </div>
    </div>
  );
}
