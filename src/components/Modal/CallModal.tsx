import { useState, useEffect, useRef } from "react";
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  UserPlus,
  Phone,
  X,
  Maximize2,
  Search,
  MoreHorizontal,
} from "lucide-react";
import Image from "next/image";
import { socketService } from "@/server/socket";

interface CallModalProps {
  handleEndCall: () => void;
}

export default function CallModal({ handleEndCall }: CallModalProps) {
  const [micMuted, setMicMuted] = useState(false);
  const [videoOff, setVideoOff] = useState(false);
  const [callerInfo, setCallerInfo] = useState({
    username: "Đang kết nối...",
    profilePicture: "/api/placeholder/96/96",
  });
  const [callStatus, setCallStatus] = useState("Đang gọi...");
  const [isConnected, setIsConnected] = useState(false);
  const localStream = useRef<MediaStream | null>(null);
  const peerConnection = useRef<RTCPeerConnection | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);

  // Lấy thông tin từ URL
  useEffect(() => {
    // Trích xuất thông tin từ URL
    const urlParams = new URLSearchParams(window.location.search);
    const userId = urlParams.get("userId");
    const calleeId = urlParams.get("calleeId");
    const callType = urlParams.get("callType");

    if (userId && calleeId) {
      // Lấy thông tin người được gọi từ API
      // Đây là mock data, bạn cần thay thế bằng API call thực tế
      fetchUserInfo(calleeId).then((userInfo) => {
        if (userInfo) {
          setCallerInfo(userInfo);
        }
      });

      // Kết nối socket nếu chưa kết nối
      const socket = socketService.initSocket();
      if (!socket.connected) {
        socketService.registerUser(userId);
      }

      // Thiết lập kết nối WebRTC và lấy luồng âm thanh/video
      setupMediaStream(callType as "audio" | "video", userId, calleeId);

      // Thiết lập sự kiện cho cửa sổ
      window.onbeforeunload = () => {
        // Báo cho server biết cuộc gọi đã kết thúc
        socket.emit("endCall", {
          callerId: userId,
          calleeId: calleeId,
        });
      };

      // Lắng nghe sự kiện kết nối thành công
      socket.on("callConnected", () => {
        setIsConnected(true);
        console.log(isConnected);
        setCallStatus("Đã kết nối");
      });

      // Lắng nghe sự kiện kết thúc cuộc gọi
      socket.on("callEnded", () => {
        window.opener.location.reload();
        window.close();
      });
    }

    return () => {
      // Dọn dẹp khi component unmount
      const socket = socketService.getSocket();
      socket.off("callConnected");
      socket.off("callEnded");
    };
  }, []);

  // Thiết lập luồng media và kết nối WebRTC
  const setupMediaStream = async (
    callType: "audio" | "video",
    userId: string,
    remoteUserId: string
  ) => {
    try {
      // Yêu cầu quyền truy cập media
      const constraints = {
        audio: true,
        video: callType === "video",
      };

      localStream.current = await navigator.mediaDevices.getUserMedia(
        constraints
      );

      // Thiết lập peer connection
      peerConnection.current = new RTCPeerConnection({
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
      });

      // Thêm track từ localStream vào peerConnection
      localStream.current.getTracks().forEach((track) => {
        peerConnection.current?.addTrack(track, localStream.current!);
      });

      // Xử lý ice candidate
      peerConnection.current.onicecandidate = (event) => {
        if (event.candidate) {
          socketService.getSocket().emit("webrtc-ice-candidate", {
            to: remoteUserId,
            from: userId,
            candidate: event.candidate,
          });
        }
      };

      // Xử lý khi nhận được track từ đối phương
      peerConnection.current.ontrack = (event) => {
        if (remoteAudioRef.current) {
          remoteAudioRef.current.srcObject = event.streams[0];
        }
      };

      // Thiết lập các sự kiện socket WebRTC
      const socket = socketService.getSocket();

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

      // Bắt đầu cuộc gọi (tạo offer) nếu là người gọi
      const urlParams = new URLSearchParams(window.location.search);
      const role = urlParams.get("role") || "caller";

      if (role === "caller") {
        const offer = await peerConnection.current.createOffer();
        await peerConnection.current.setLocalDescription(offer);
        socket.emit("webrtc-offer", {
          to: remoteUserId,
          from: userId,
          offer,
        });
      }

      // Hiển thị trạng thái kết nối
      setCallStatus("Đang kết nối...");
    } catch (error) {
      console.error("Lỗi khi thiết lập luồng media:", error);
      alert(
        "Không thể truy cập thiết bị âm thanh hoặc video. Vui lòng kiểm tra quyền truy cập."
      );
      setCallStatus("Lỗi kết nối");
    }
  };

  // Thay thế bằng API call thực tế trong ứng dụng của bạn
  const fetchUserInfo = async (userId: string) => {
    console.log(userId);
    // Giả lập API call
    return {
      username: "Phạm Thanh Khương",
      profilePicture: "/api/placeholder/96/96",
    };
  };

  // Xử lý mute/unmute microphone
  const handleToggleMic = () => {
    if (localStream.current) {
      const audioTracks = localStream.current.getAudioTracks();

      // Toggle trạng thái của tất cả các audio track
      audioTracks.forEach((track) => {
        track.enabled = !track.enabled;
      });

      // Cập nhật state UI
      setMicMuted(!micMuted);

      // Thông báo đến người dùng khác (tùy chọn)
      const urlParams = new URLSearchParams(window.location.search);
      const userId = urlParams.get("userId");
      const calleeId = urlParams.get("calleeId");

      if (userId && calleeId) {
        socketService.getSocket().emit("micStatusChanged", {
          from: userId,
          to: calleeId,
          muted: !micMuted,
        });
      }
    }
  };

  // Xử lý bật/tắt video
  const handleToggleVideo = () => {
    if (localStream.current) {
      const videoTracks = localStream.current.getVideoTracks();

      // Toggle trạng thái của tất cả các video track
      videoTracks.forEach((track) => {
        track.enabled = !track.enabled;
      });

      // Cập nhật state UI
      setVideoOff(!videoOff);

      // Thông báo đến người dùng khác (tùy chọn)
      const urlParams = new URLSearchParams(window.location.search);
      const userId = urlParams.get("userId");
      const calleeId = urlParams.get("calleeId");

      if (userId && calleeId) {
        socketService.getSocket().emit("videoStatusChanged", {
          from: userId,
          to: calleeId,
          disabled: !videoOff,
        });
      }
    }
  };

  return (
    <div className="w-full h-full bg-zinc-900 rounded-lg overflow-hidden flex flex-col">
      {/* Top bar */}
      <div className="absolute top-0 right-0 flex items-center gap-2 p-4 z-10">
        <button className="text-white p-2 rounded-full hover:bg-zinc-700">
          <Search size={20} />
        </button>
        <button className="text-white p-2 rounded-full hover:bg-zinc-700">
          <Maximize2 size={20} />
        </button>
        <button className="text-white p-2 rounded-full hover:bg-zinc-700">
          <MoreHorizontal size={20} />
        </button>
        <button
          className="text-white p-2 rounded-full hover:bg-zinc-700"
          onClick={handleEndCall} // Sử dụng handleEndCall từ props
        >
          <X size={20} />
        </button>
      </div>

      {/* Main content - video area */}
      <div className="flex-1 flex items-center justify-center bg-zinc-900">
        <div className="relative w-full h-full flex items-center justify-center">
          {/* Call status and user info */}
          <div className="absolute flex flex-col items-center text-white">
            <div className="h-24 w-24 rounded-full overflow-hidden mb-3">
              <Image
                src={callerInfo.profilePicture}
                alt="Profile"
                className="w-full h-full object-cover"
                width={96}
                height={96}
              />
            </div>
            <h2 className="text-xl font-semibold">{callerInfo.username}</h2>
            <p className="text-gray-300 text-sm mt-1">{callStatus}</p>
            {micMuted && (
              <div className="mt-2 bg-red-500 text-white px-3 py-1 rounded-full text-xs">
                Mic đã tắt
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Audio element để nghe đối phương */}
      <audio ref={remoteAudioRef} autoPlay />

      {/* Bottom controls */}
      <div className="bg-zinc-900 p-4 flex justify-center items-center gap-4">
        {/* Audio device info */}
        <div className="absolute left-4 text-white text-xs">
          <div className="flex items-center mb-2">
            <Mic
              size={16}
              className={`mr-2 ${micMuted ? "text-red-500" : "text-white"}`}
            />
            <span>Micrô {micMuted ? "đã tắt" : "đang bật"}</span>
          </div>
          <div className="flex items-center">
            <span className="mr-2">🔊</span>
            <span>Loa được kết nối: Headphones (Realtek(R) Audio)</span>
          </div>
        </div>

        {/* Call controls */}
        <div className="flex gap-4 items-center">
          <button
            className={`p-3 rounded-full ${
              micMuted ? "bg-red-600" : "bg-zinc-800"
            }`}
            onClick={handleToggleMic}
          >
            {micMuted ? (
              <MicOff size={24} color="white" />
            ) : (
              <Mic size={24} color="white" />
            )}
          </button>

          <button
            className={`p-3 rounded-full ${
              videoOff ? "bg-red-600" : "bg-zinc-800"
            }`}
            onClick={handleToggleVideo}
          >
            {videoOff ? (
              <VideoOff size={24} color="white" />
            ) : (
              <Video size={24} color="white" />
            )}
          </button>

          <button className="p-3 rounded-full bg-zinc-800">
            <UserPlus size={24} color="white" />
          </button>

          <button
            className="p-3 rounded-full bg-red-600"
            onClick={handleEndCall} // Sử dụng handleEndCall từ props
          >
            <Phone size={24} color="white" />
          </button>
        </div>
      </div>
    </div>
  );
}
