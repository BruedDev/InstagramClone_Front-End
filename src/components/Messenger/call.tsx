import { useEffect, useRef, useState } from "react";
import { Phone, Video, Info } from "lucide-react";
import { socketService } from "@/server/socket";
import Image from "next/image";
import type { User } from "@/types/user.type";

interface CallProps {
  userId: string;
  calleeId: string;
  ringtoneRef: React.RefObject<HTMLAudioElement | null>;
  availableUsers: User[];
}

export default function Call({
  userId,
  calleeId,
  ringtoneRef,
  availableUsers,
}: CallProps) {
  const [inCall, setInCall] = useState(false);
  const [incoming, setIncoming] = useState<null | {
    callerId: string;
    callType: string;
  }>(null);
  const peerConnection = useRef<RTCPeerConnection | null>(null);
  const localStream = useRef<MediaStream | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const socket = socketService.initSocket();
    socketService.registerUser(userId);

    socket.on(
      "incomingCall",
      (data: { callerId: string; callType: "audio" | "video" }) => {
        setIncoming(data);
      }
    );

    socket.on("callAccepted", async ({ calleeId }) => {
      setInCall(true);
      await startCall("caller", calleeId);
    });

    socket.on("callRejected", () => {
      alert("Người nhận đã từ chối cuộc gọi!");
      setInCall(false);
    });

    socket.on("webrtc-offer", async ({ from, offer }) => {
      if (!peerConnection.current) return;
      await peerConnection.current.setRemoteDescription(
        new RTCSessionDescription(offer)
      );
      const answer = await peerConnection.current.createAnswer();
      await peerConnection.current.setLocalDescription(answer);
      socket.emit("webrtc-answer", { to: from, from: userId, answer });
    });

    socket.on("webrtc-answer", async ({ answer }) => {
      if (!peerConnection.current) return;
      await peerConnection.current.setRemoteDescription(
        new RTCSessionDescription(answer)
      );
    });

    socket.on("webrtc-ice-candidate", async ({ candidate }) => {
      if (!peerConnection.current || !candidate) return;
      try {
        await peerConnection.current.addIceCandidate(
          new RTCIceCandidate(candidate)
        );
      } catch (err) {
        console.error("Lỗi addIceCandidate:", err);
      }
    });

    return () => {
      socket.off("incomingCall");
      socket.off("callAccepted");
      socket.off("callRejected");
      socket.off("webrtc-offer");
      socket.off("webrtc-answer");
      socket.off("webrtc-ice-candidate");
    };
    // eslint-disable-next-line
  }, [userId]);

  // Phát hoặc dừng nhạc chuông khi có cuộc gọi đến
  useEffect(() => {
    if (incoming && ringtoneRef.current) {
      ringtoneRef.current.currentTime = 0;
      ringtoneRef.current.play();
    } else if (!incoming && ringtoneRef.current) {
      ringtoneRef.current.pause();
      ringtoneRef.current.currentTime = 0;
    }
  }, [incoming, ringtoneRef]);

  // Tạo peer connection và stream
  const startCall = async (
    role: "caller" | "receiver",
    remoteUserId: string
  ) => {
    peerConnection.current = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });

    peerConnection.current.onicecandidate = (event) => {
      if (event.candidate) {
        socketService.getSocket().emit("webrtc-ice-candidate", {
          to: remoteUserId,
          from: userId,
          candidate: event.candidate,
        });
      }
    };

    peerConnection.current.ontrack = (event) => {
      if (remoteAudioRef.current) {
        remoteAudioRef.current.srcObject = event.streams[0];
      }
    };

    try {
      localStream.current = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });
    } catch {
      alert("Không thể truy cập micro!");
      return;
    }

    localStream.current.getTracks().forEach((track) => {
      peerConnection.current?.addTrack(track, localStream.current!);
    });

    if (role === "caller") {
      const offer = await peerConnection.current.createOffer();
      await peerConnection.current.setLocalDescription(offer);
      socketService.getSocket().emit("webrtc-offer", {
        to: remoteUserId,
        from: userId,
        offer,
      });
    }
  };

  // Gọi audio
  const handleAudioCall = async () => {
    setInCall(true);
    socketService.getSocket().emit("callUser", {
      callerId: userId,
      calleeId,
      callType: "audio",
    });
    // Chờ callAccepted mới startCall
  };

  // Gọi video (có thể mở rộng tương tự)
  const handleVideoCall = async () => {
    alert("Demo này chỉ hỗ trợ audio call. Bạn có thể mở rộng cho video.");
  };

  // Xử lý đồng ý cuộc gọi
  const handleAccept = () => {
    if (ringtoneRef.current) {
      ringtoneRef.current.pause();
      ringtoneRef.current.currentTime = 0;
    }
    if (incoming) {
      socketService.getSocket().emit("acceptCall", {
        callerId: incoming.callerId,
        calleeId: userId,
      });
      setIncoming(null);
      setInCall(true);
      startCall("receiver", incoming.callerId);
    }
  };

  // Xử lý từ chối cuộc gọi
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
      setIncoming(null);
      setInCall(false);
    }
  };

  // Lấy đúng thông tin người gọi đến từ availableUsers
  const callerInfo = incoming
    ? availableUsers.find((u) => u._id === incoming.callerId)
    : null;
  const callerUsername = callerInfo?.username ?? incoming?.callerId;
  const callerProfilePicture = callerInfo?.profilePicture;

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
      <button className="p-2 text-gray-400 hover:text-gray-200">
        <Info className="h-5 w-5" />
      </button>
      {/* Audio element để nghe đối phương */}
      <audio ref={remoteAudioRef} autoPlay />
      {/* Audio element cho nhạc chuông */}
      <audio ref={ringtoneRef} src="/RingTone.mp3" loop />
      {/* Modal xác nhận cuộc gọi đến */}
      {incoming && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.5)",
            zIndex: 1000,
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
              <div>Loại: {incoming.callType}</div>
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
      )}
    </div>
  );
}
