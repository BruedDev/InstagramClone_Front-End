import { useState, useEffect, useRef } from "react";
import { socketService } from "@/server/socket";
import { createPeerConnection } from "@/server/messenger";
import CallModalUi from "@/app/ui/CallModalUi";
import { CreatePeerConnectionReturn } from "@/types/messenger.types";

export interface CallModalProps {
  handleEndCall: () => void;
}

export default function CallModal({ handleEndCall }: CallModalProps) {
  const [micMuted, setMicMuted] = useState(false);
  const [videoOff, setVideoOff] = useState(false);
  const [callerInfo, setCallerInfo] = useState({
    username: "Đang tải...",
    profilePicture: "/api/placeholder/96/96",
  });
  const [callStatus, setCallStatus] = useState("Đang khởi tạo...");
  const [isConnected, setIsConnected] = useState(false);

  const localStream = useRef<MediaStream | null>(null);
  const peerConnection = useRef<RTCPeerConnection | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);

  const isOfferCreated = useRef<boolean>(false);
  const hasRemoteDescription = useRef<boolean>(false);
  const pendingCandidates = useRef<RTCIceCandidate[]>([]);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const userId = urlParams.get("userId");
    const calleeId = urlParams.get("calleeId");
    const callType = urlParams.get("callType") as "audio" | "video" | null;

    let socket = socketService.getSocket();
    if (!socket) {
      socket = socketService.initSocket();
    }

    const performCallSetup = () => {
      if (!userId || !calleeId || !callType) {
        setCallStatus("Lỗi cấu hình cuộc gọi");
        return;
      }

      fetchUserInfo(calleeId).then((userInfo) => {
        if (userInfo) setCallerInfo(userInfo);
        else
          setCallerInfo({
            username: "Không rõ người dùng",
            profilePicture: "/api/placeholder/96/96",
          });
      });
      socketService.registerUser(userId);
      setupMediaStream(callType, userId, calleeId);

      window.onbeforeunload = () => {
        socket.emit("endCall", { callerId: userId, calleeId: calleeId });
      };

      socket.on("callConnected", () => {
        setIsConnected(true);
        setCallStatus("Đã kết nối");
      });

      socket.on("callEnded", () => {
        if (
          window.opener &&
          typeof window.opener.location !== "undefined" &&
          window.opener.location !== null
        ) {
          try {
            window.opener.location.reload();
          } catch (e) {
            console.error("FIX: Không thể reload opener:", e);
          }
        }
        window.close();
      });
    };

    if (userId && calleeId && callType) {
      if (socket.connected) {
        performCallSetup();
      } else {
        socket.once("connect", () => {
          performCallSetup();
        });
      }
    } else {
      setCallStatus("Lỗi: Thiếu thông tin cuộc gọi.");
    }

    return () => {
      cleanupResources();
      window.onbeforeunload = null;
    };
  }, []);

  const cleanupResources = () => {
    const socket = socketService.getSocket();
    if (socket) {
      socket.off("callConnected");
      socket.off("callEnded");
      socket.off("webrtc-offer");
      socket.off("webrtc-answer");
      socket.off("webrtc-ice-candidate");
    }

    if (peerConnection.current) {
      peerConnection.current.getSenders().forEach((sender) => {
        if (sender.track) sender.track.stop();
      });
      peerConnection.current.close();
      peerConnection.current = null;
    }

    if (localStream.current) {
      localStream.current.getTracks().forEach((track) => track.stop());
      localStream.current = null;
    }

    isOfferCreated.current = false;
    hasRemoteDescription.current = false;
    pendingCandidates.current = [];
    setIsConnected(false);
    setCallStatus("Đã kết thúc");
  };

  const processPendingCandidates = async () => {
    if (
      !peerConnection.current ||
      !hasRemoteDescription.current ||
      pendingCandidates.current.length === 0
    ) {
      return;
    }

    for (const candidate of pendingCandidates.current) {
      try {
        await peerConnection.current.addIceCandidate(candidate);
      } catch (err) {
        console.error("FIX: Lỗi khi áp dụng ICE candidate đang đợi:", err);
      }
    }
    pendingCandidates.current = [];
  };

  const setupMediaStream = async (
    callType: "audio" | "video",
    userId: string,
    remoteUserId: string
  ) => {
    try {
      setCallStatus("Xin quyền truy cập thiết bị...");
      const constraints = { audio: true, video: callType === "video" };
      localStream.current = await navigator.mediaDevices.getUserMedia(
        constraints
      );
      setCallStatus("Đang thiết lập kết nối...");

      // Explicitly type the result of createPeerConnection
      const peerConfig: CreatePeerConnectionReturn =
        await createPeerConnection();

      if (peerConfig) {
        // Handle null case first
        // Check for Shape 1: { peer: RTCPeerConnection; ... }
        if (
          typeof peerConfig === "object" &&
          !Array.isArray(peerConfig) &&
          "peer" in peerConfig &&
          peerConfig.peer instanceof RTCPeerConnection
        ) {
          peerConnection.current = peerConfig.peer;
        }
        // Check for Shape 2: { iceServers: RTCIceServer[]; ... }
        // This is the corrected block
        else if (
          typeof peerConfig === "object" &&
          !Array.isArray(peerConfig) &&
          "iceServers" in peerConfig &&
          Array.isArray(peerConfig.iceServers)
        ) {
          // At this point, TypeScript knows peerConfig has an 'iceServers' property which is an array.
          const iceServersFromConfig = peerConfig.iceServers;

          // Optional: Validate structure of RTCIceServer objects if necessary
          const isValidIceServerArray = iceServersFromConfig.every(
            (
              server: RTCIceServer // Assuming RTCIceServer type is correctly defined/imported
            ) =>
              server &&
              (typeof server.urls === "string" ||
                (Array.isArray(server.urls) &&
                  server.urls.every((url) => typeof url === "string")))
          );

          if (isValidIceServerArray) {
            peerConnection.current = new RTCPeerConnection({
              iceServers: iceServersFromConfig,
            });
          } else {
            console.error(
              "FIX: Mảng 'iceServers' từ API object có cấu trúc không hợp lệ."
            );
            throw new Error(
              "Mảng 'iceServers' từ API object có cấu trúc không hợp lệ."
            );
          }
        }
        // Check for Shape 3: RTCIceServer[] (peerConfig is a direct array)
        else if (Array.isArray(peerConfig)) {
          const iceServersDirectArray = peerConfig;
          const isValidIceServerArray = iceServersDirectArray.every(
            (server: RTCIceServer) =>
              server &&
              (typeof server.urls === "string" ||
                (Array.isArray(server.urls) &&
                  server.urls.every((url) => typeof url === "string")))
          );
          if (isValidIceServerArray) {
            peerConnection.current = new RTCPeerConnection({
              iceServers: iceServersDirectArray,
            });
          } else {
            console.error(
              "FIX: Mảng 'iceServers' (direct array from API) có cấu trúc không hợp lệ."
            );
            throw new Error(
              "Mảng 'iceServers' (direct array from API) có cấu trúc không hợp lệ."
            );
          }
        }
        // Handle cases where peerConfig is an object but doesn't match known shapes
        else if (typeof peerConfig === "object" && !Array.isArray(peerConfig)) {
          console.warn(
            "FIX: Cấu hình peer từ API có dạng object không xác định. Sử dụng fallback."
          );
          throw new Error("Cấu hình peer từ API (object) không hợp lệ.");
        }
        // If peerConfig is something else unexpected (shouldn't happen with CreatePeerConnectionReturn type)
        else {
          console.warn(
            "FIX: Cấu hình peer từ API không xác định. Sử dụng fallback."
          );
          throw new Error("Cấu hình peer từ API không xác định.");
        }
      } else {
        // peerConfig is null
        console.warn("FIX: Cấu hình peer từ API là null. Sử dụng fallback.");
        throw new Error("Cấu hình peer từ API là null."); // This will be caught by the outer try-catch
      }

      // Ensure peerConnection.current is initialized before proceeding
      if (!peerConnection.current) {
        // This case should ideally be handled by the throw new Error above, leading to the catch block.
        // But as a safeguard:
        console.error(
          "FIX: PeerConnection không được khởi tạo sau khi xử lý peerConfig. Ném lỗi để dùng fallback."
        );
        throw new Error("PeerConnection không được khởi tạo.");
      }

      // Add tracks from localStream to peerConnection
      localStream.current?.getTracks().forEach((track) => {
        peerConnection.current?.addTrack(track, localStream.current!);
      });

      // Handle onicecandidate event
      peerConnection.current.onicecandidate = (event) => {
        if (event.candidate) {
          socketService.getSocket().emit("webrtc-ice-candidate", {
            to: remoteUserId,
            from: userId,
            candidate: event.candidate,
          });
        }
      };

      // Handle oniceconnectionstatechange event (crucial for call status)
      peerConnection.current.oniceconnectionstatechange = () => {
        const pc = peerConnection.current;
        if (!pc) return;
        const newIceState = pc.iceConnectionState;
        switch (newIceState) {
          case "connected":
          case "completed":
            if (callStatus !== "Đã kết nối" || !isConnected) {
              setCallStatus("Đã kết nối");
              setIsConnected(true);
            }
            break;
          case "failed":
            console.error("FIX: ICE kết nối thất bại.");
            setCallStatus("Kết nối thất bại");
            setIsConnected(false);
            break;
          case "disconnected":
            console.warn("FIX: ICE bị ngắt kết nối (có thể tạm thời).");
            setCallStatus("Mất kết nối (đang thử lại...)");
            break;
          case "closed":
            setCallStatus("Cuộc gọi đã kết thúc");
            setIsConnected(false);
            break;
          case "new":
          case "checking":
            if (callStatus !== "Đã kết nối") {
              setCallStatus("Đang kết nối...");
            }
            break;
          default:
            if (!isConnected && callStatus !== "Đã kết nối") {
              setCallStatus("Đang xử lý kết nối...");
            }
        }
      };

      // Handle ontrack event (receiving remote media)
      peerConnection.current.ontrack = (event) => {
        if (remoteAudioRef.current && event.streams[0]) {
          remoteAudioRef.current.srcObject = event.streams[0];
          remoteAudioRef.current
            .play()
            .catch((error) =>
              console.error("Lỗi khi play audio từ xa:", error)
            );
        } else {
          console.warn(
            "FIX: remoteAudioRef chưa sẵn sàng hoặc không có stream để gán."
          );
        }
      };

      // Setup WebRTC socket event listeners
      const socket = socketService.getSocket();
      socket.on("webrtc-offer", async ({ from, offer }) => {
        if (!peerConnection.current) return;
        const pc = peerConnection.current;
        if (
          pc.signalingState !== "stable" &&
          pc.signalingState !== "have-remote-offer"
        ) {
          console.warn(
            `FIX: Trạng thái signaling khi nhận offer là ${pc.signalingState}.`
          );
        }
        try {
          await pc.setRemoteDescription(new RTCSessionDescription(offer));
          hasRemoteDescription.current = true;
          await processPendingCandidates();
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          socket.emit("webrtc-answer", { to: from, from: userId, answer });
        } catch (err) {
          console.error("FIX: Lỗi khi xử lý offer:", err);
        }
      });

      socket.on("webrtc-answer", async ({ answer }) => {
        if (!peerConnection.current) return;
        const pc = peerConnection.current;
        if (pc.signalingState !== "have-local-offer") {
          console.error(
            `FIX: Lỗi! Nhận answer nhưng trạng thái signaling là ${pc.signalingState}. Bỏ qua.`
          );
          return;
        }
        try {
          await pc.setRemoteDescription(new RTCSessionDescription(answer));
          hasRemoteDescription.current = true;
          await processPendingCandidates();
        } catch (err) {
          console.error("FIX: Lỗi khi xử lý answer:", err);
        }
      });

      socket.on("webrtc-ice-candidate", async ({ candidate }) => {
        if (!peerConnection.current || !candidate) return;
        try {
          if (
            !hasRemoteDescription.current ||
            peerConnection.current.remoteDescription === null
          ) {
            pendingCandidates.current.push(new RTCIceCandidate(candidate));
          } else {
            await peerConnection.current.addIceCandidate(
              new RTCIceCandidate(candidate)
            );
          }
        } catch (err) {
          console.error("FIX: Lỗi khi thêm ICE candidate:", err);
        }
      });

      // Initiate call if 'caller'
      const urlParams = new URLSearchParams(window.location.search);
      const role = urlParams.get("role") || "caller";
      if (
        role === "caller" &&
        !isOfferCreated.current &&
        peerConnection.current
      ) {
        try {
          setCallStatus("Đang tạo lời mời...");
          const offer = await peerConnection.current.createOffer({
            offerToReceiveAudio: true,
            offerToReceiveVideo: callType === "video",
          });
          await peerConnection.current.setLocalDescription(offer);
          isOfferCreated.current = true;
          socket.emit("webrtc-offer", {
            to: remoteUserId,
            from: userId,
            offer,
          });
          setCallStatus("Đang gọi...");
        } catch (err) {
          console.error("FIX: Lỗi khi tạo offer:", err);
          setCallStatus("Lỗi khi tạo lời mời");
        }
      } else if (role !== "caller") {
        setCallStatus("Đang chờ lời mời...");
      }
    } catch (error) {
      // Catches errors from getUserMedia, createPeerConnection, or thrown errors for invalid config
      console.error(
        "FIX: Lỗi nghiêm trọng khi thiết lập luồng media hoặc PeerConnection:",
        error
      );
      // alert("Không thể truy cập thiết bị hoặc lỗi cấu hình kết nối. Vui lòng thử lại."); // Consider a more user-friendly notification
      setCallStatus("Lỗi thiết lập cuộc gọi");
      setIsConnected(false);

      // Fallback to default STUN servers if peerConnection setup failed before this point
      if (!peerConnection.current) {
        peerConnection.current = new RTCPeerConnection({
          iceServers: [
            { urls: "stun:stun.l.google.com:19302" },
            { urls: "stun:stun1.l.google.com:19302" },
            { urls: "stun:stun2.l.google.com:19302" },
            { urls: "stun:stun3.l.google.com:19302" },
            { urls: "stun:stun4.l.google.com:19302" },
          ],
        });
      }
    }
  };

  const fetchUserInfo = async (userIdToFetch: string) => {
    return new Promise<{ username: string; profilePicture: string } | null>(
      (resolve) => {
        setTimeout(() => {
          if (userIdToFetch === "user_b_id_example") {
            resolve({
              username: "Phạm Thanh Khương (Ví dụ)",
              profilePicture: "/api/placeholder/96/96",
            });
          } else {
            resolve({
              username: "Người lạ",
              profilePicture: "/api/placeholder/96/96",
            });
          }
        }, 500);
      }
    );
  };

  const handleToggleMic = () => {
    if (localStream.current) {
      const audioTracks = localStream.current.getAudioTracks();
      if (audioTracks.length > 0) {
        audioTracks.forEach((track) => {
          track.enabled = !track.enabled;
        });
        const newMicMuted = !audioTracks[0].enabled;
        setMicMuted(newMicMuted);
        const urlParams = new URLSearchParams(window.location.search);
        const userId = urlParams.get("userId");
        const calleeId = urlParams.get("calleeId");
        if (userId && calleeId) {
          socketService.getSocket().emit("micStatusChanged", {
            from: userId,
            to: calleeId,
            muted: newMicMuted,
          });
        }
      }
    }
  };

  const handleToggleVideo = () => {
    if (localStream.current) {
      const videoTracks = localStream.current.getVideoTracks();
      if (videoTracks.length > 0) {
        videoTracks.forEach((track) => {
          track.enabled = !track.enabled;
        });
        const newVideoOff = !videoTracks[0].enabled;
        setVideoOff(newVideoOff);
        const urlParams = new URLSearchParams(window.location.search);
        const userId = urlParams.get("userId");
        const calleeId = urlParams.get("calleeId");
        if (userId && calleeId) {
          socketService.getSocket().emit("videoStatusChanged", {
            from: userId,
            to: calleeId,
            disabled: newVideoOff,
          });
        }
      }
    }
  };

  const handleEndCallLocal = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const userId = urlParams.get("userId");
    const calleeId = urlParams.get("calleeId");
    if (userId && calleeId) {
      socketService
        .getSocket()
        .emit("endCall", { callerId: userId, calleeId: calleeId });
    }
    cleanupResources();
    handleEndCall();
  };

  return (
    <CallModalUi
      callerInfo={callerInfo}
      handleEndCallLocal={handleEndCallLocal}
      micMuted={micMuted}
      handleToggleVideo={handleToggleVideo}
      handleToggleMic={handleToggleMic}
      callStatus={callStatus}
      videoOff={videoOff}
      remoteAudioRef={remoteAudioRef}
    />
  );
}
