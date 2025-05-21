import { useState, useEffect, useRef } from "react";
import { socketService } from "@/server/socket";
import { createPeerConnection } from "@/server/messenger";
import CallModalUi from "@/app/ui/CallModalUi"; // Đảm bảo đường dẫn đúng
import { CreatePeerConnectionReturn } from "@/types/messenger.types";
import { getUser } from "@/server/user";

export interface CallModalProps {
  handleEndCall: () => void;
}

export default function CallModal({ handleEndCall }: CallModalProps) {
  const [micMuted, setMicMuted] = useState(false);
  const [videoOff, setVideoOff] = useState(false); // Sẽ được đặt dựa trên initialCallType
  const [callerInfo, setCallerInfo] = useState({
    username: "Đang tải...",
    profilePicture: "/api/placeholder/96/96",
  });
  const [callStatus, setCallStatus] = useState("Đang khởi tạo...");
  const [isConnected, setIsConnected] = useState(false);
  const [callType, setCallType] = useState<"audio" | "video" | null>(null);
  const [isRemoteVideoOff, setIsRemoteVideoOff] = useState(true); // Mặc định là video của đối phương tắt

  const localStream = useRef<MediaStream | null>(null);
  const peerConnection = useRef<RTCPeerConnection | null>(null);

  const remoteAudioRef = useRef<HTMLAudioElement>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  const isOfferCreated = useRef<boolean>(false);
  const hasRemoteDescription = useRef<boolean>(false);
  const pendingCandidates = useRef<RTCIceCandidate[]>([]);

  const urlParams = new URLSearchParams(window.location.search);
  const currentUserId = urlParams.get("userId");
  const remoteUserId = urlParams.get("calleeId");
  const initialCallTypeParam = urlParams.get("callType") as
    | "audio"
    | "video"
    | null;
  const role =
    urlParams.get("role") || (initialCallTypeParam ? "caller" : "receiver");

  useEffect(() => {
    setCallType(initialCallTypeParam);
    // Nếu là video call, camera mặc định bật (videoOff = false)
    // Nếu là audio call, camera mặc định tắt (videoOff = true)
    setVideoOff(initialCallTypeParam === "audio");
    setIsRemoteVideoOff(initialCallTypeParam === "audio"); // Giả định ban đầu cho audio call

    let socket = socketService.getSocket();
    if (!socket || !socket.connected) {
      socket = socketService.initSocket();
    }

    const performCallSetup = () => {
      if (!currentUserId || !remoteUserId || !initialCallTypeParam) {
        setCallStatus("Lỗi: Thiếu thông tin cuộc gọi.");
        console.error("FIX: Missing call info in URL params", {
          currentUserId,
          remoteUserId,
          initialCallType: initialCallTypeParam,
        });
        return;
      }

      fetchUserInfo(remoteUserId).then((userInfo) => {
        if (userInfo) setCallerInfo(userInfo);
        else
          setCallerInfo({
            username: "Không rõ người dùng",
            profilePicture: "/api/placeholder/96/96",
          });
      });

      if (socket.connected) {
        socketService.registerUser(currentUserId);
      }

      setupMediaStream(initialCallTypeParam, currentUserId, remoteUserId);

      window.onbeforeunload = () => {
        socket.emit("endCall", {
          callerId: currentUserId,
          calleeId: remoteUserId,
          endedBy: currentUserId,
        });
        cleanupResources();
        handleEndCall(); // Gọi prop này từ parent component nếu có
      };

      socket.on("callConnected", () => {
        setIsConnected(true);
        setCallStatus("Đã kết nối");
      });

      socket.on("callEnded", (data: { from: string; endedBy: string }) => {
        setCallStatus(
          `Cuộc gọi đã kết thúc bởi ${
            data.endedBy === currentUserId ? "bạn" : callerInfo.username
          }`
        );
        cleanupResources();
        setTimeout(() => window.close(), 3000); // Tăng thời gian chờ
      });

      socket.on("videoStatusChanged", ({ from, disabled }) => {
        if (from === remoteUserId) {
          setIsRemoteVideoOff(disabled);
          console.log(
            // SỬA LỖI LOGGING
            `CONSOLE LOG (REMOTE): Người dùng ${from} (${
              callerInfo.username
            }) đã ${disabled ? "TẮT" : "BẬT"} camera.`
          );
        }
      });
      // Lắng nghe trạng thái mic của đối phương (nếu cần thiết cho UI)
      socket.on("micStatusChanged", ({ from, muted }) => {
        if (from === remoteUserId) {
          console.log(
            `CONSOLE LOG (REMOTE): Người dùng ${from} (${
              callerInfo.username
            }) đã ${muted ? "TẮT" : "BẬT"} mic.`
          );
          // Cập nhật UI nếu cần, ví dụ: setRemoteMicMuted(muted);
        }
      });
    };

    if (socket.connected) {
      performCallSetup();
    } else {
      socket.once("connect", () => {
        console.log("Socket connected, performing call setup.");
        if (currentUserId) socketService.registerUser(currentUserId);
        performCallSetup();
      });
      socket.once("disconnect", () => {
        setCallStatus("Mất kết nối socket...");
      });
    }

    return () => {
      cleanupResources();
      window.onbeforeunload = null;
      const currentSocket = socketService.getSocket();
      if (currentSocket) {
        currentSocket.off("callConnected");
        currentSocket.off("callEnded");
        currentSocket.off("videoStatusChanged");
        currentSocket.off("micStatusChanged"); // Gỡ listener nếu có
        // Gỡ các listeners khác của WebRTC nếu cần trong cleanupResources
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUserId, remoteUserId, initialCallTypeParam]); // Chỉ chạy 1 lần khi component mount hoặc các ID thay đổi

  const cleanupResources = () => {
    const socket = socketService.getSocket();
    if (socket) {
      socket.off("webrtc-offer");
      socket.off("webrtc-answer");
      socket.off("webrtc-ice-candidate");
    }

    if (localStream.current) {
      localStream.current.getTracks().forEach((track) => track.stop());
      localStream.current = null;
    }
    if (peerConnection.current) {
      // Dừng các track đang được gửi trước khi đóng peer connection
      peerConnection.current.getSenders().forEach((sender) => {
        if (sender.track) {
          sender.track.stop();
        }
      });
      peerConnection.current.close();
      peerConnection.current = null;
    }

    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
    if (remoteAudioRef.current) remoteAudioRef.current.srcObject = null;

    isOfferCreated.current = false;
    hasRemoteDescription.current = false;
    pendingCandidates.current = [];
    setIsConnected(false);
  };

  const processPendingCandidates = async () => {
    if (
      !peerConnection.current ||
      !hasRemoteDescription.current || // Hoặc peerConnection.current.remoteDescription
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
    type: "audio" | "video",
    userId: string,
    targetUserId: string
  ) => {
    const tempStream = new MediaStream();

    try {
      setCallStatus("Xin quyền truy cập micro...");
      const audioStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });
      audioStream
        .getAudioTracks()
        .forEach((track) => tempStream.addTrack(track));

      // Nếu là video call và video không bị tắt từ đầu (videoOff là false)
      if (type === "video" && !videoOff) {
        setCallStatus("Xin quyền truygs cập camera...");
        try {
          const videoStream = await navigator.mediaDevices.getUserMedia({
            video: true,
          });
          videoStream
            .getVideoTracks()
            .forEach((track) => tempStream.addTrack(track));
        } catch (videoError: unknown) {
          if (videoError instanceof Error) {
            console.warn(
              "Không thể truy cập camera:",
              videoError.name,
              videoError.message
            );
          } else {
            console.warn("Không thể truy cập camera:", videoError);
          }
          setVideoOff(true); // Nếu không lấy được video, tự động set videoOff = true
          // Thông báo cho đối phương rằng video của mình đã tắt (nếu cần)
          if (currentUserId && remoteUserId) {
            socketService.getSocket().emit("videoStatusChanged", {
              from: currentUserId,
              to: remoteUserId,
              disabled: true,
            });
          }
          setCallStatus("Không thể truy cập camera, tiếp tục với âm thanh.");
        }
      }
      // Nếu là audio call, videoOff sẽ là true do useEffect ban đầu.
      // Không cần lấy video track cho audio call ở bước này.

      localStream.current = tempStream;

      if (localStream.current.getAudioTracks().length === 0) {
        throw new Error(
          "Không thể lấy được luồng âm thanh. Vui lòng kiểm tra quyền và thiết bị micro."
        );
      }

      // Gán local stream vào local video element (chỉ khi có video track và video không bị tắt)
      if (localVideoRef.current) {
        if (localStream.current.getVideoTracks().length > 0 && !videoOff) {
          localVideoRef.current.srcObject = localStream.current;
        } else {
          localVideoRef.current.srcObject = null;
        }
      }

      setCallStatus("Đang thiết lập kết nối...");

      const peerConfigResult: CreatePeerConnectionReturn =
        await createPeerConnection();
      // Xử lý peerConfigResult để khởi tạo peerConnection.current (giữ nguyên logic của bạn)
      if (peerConfigResult) {
        if (
          typeof peerConfigResult === "object" &&
          !Array.isArray(peerConfigResult) &&
          "peer" in peerConfigResult &&
          peerConfigResult.peer instanceof RTCPeerConnection
        ) {
          peerConnection.current = peerConfigResult.peer;
        } else if (
          typeof peerConfigResult === "object" &&
          !Array.isArray(peerConfigResult) &&
          "iceServers" in peerConfigResult &&
          Array.isArray(peerConfigResult.iceServers)
        ) {
          peerConnection.current = new RTCPeerConnection({
            iceServers: peerConfigResult.iceServers,
          });
        } else if (Array.isArray(peerConfigResult)) {
          peerConnection.current = new RTCPeerConnection({
            iceServers: peerConfigResult,
          });
        } else {
          console.warn(
            "Cấu hình peer từ API không xác định. Sử dụng fallback."
          );
          throw new Error("Cấu hình peer không hợp lệ.");
        }
      } else {
        console.warn("Cấu hình peer từ API là null. Sử dụng fallback.");
        throw new Error("Cấu hình peer là null.");
      }

      if (!peerConnection.current) {
        console.error(
          "PeerConnection không được khởi tạo. Sử dụng fallback STUN."
        );
        peerConnection.current = new RTCPeerConnection({
          iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
        });
      }

      localStream.current?.getTracks().forEach((track) => {
        peerConnection.current?.addTrack(track, localStream.current!);
      });

      // THÊM: Trình xử lý onnegotiationneeded
      peerConnection.current.onnegotiationneeded = async () => {
        if (
          peerConnection.current?.signalingState === "stable" &&
          (role === "caller" || isOfferCreated.current)
        ) {
          try {
            console.log("Negotiation needed, creating offer...");
            const offerOptions: RTCOfferOptions = {
              offerToReceiveAudio: true,
              offerToReceiveVideo: true, // Luôn sẵn sàng nhận video
            };
            const offer = await peerConnection.current!.createOffer(
              offerOptions
            );
            await peerConnection.current!.setLocalDescription(offer);

            socketService.getSocket().emit("webrtc-offer", {
              to: targetUserId,
              from: userId,
              offer,
            });
            // isOfferCreated.current sẽ được set true khi offer đầu tiên được gửi
          } catch (err) {
            console.error(
              "Error in onnegotiationneeded while creating offer:",
              err
            );
          }
        } else {
          console.log(
            "Negotiation needed, but conditions not met for auto-offer.",
            "Signaling State:",
            peerConnection.current?.signalingState,
            "Role:",
            role,
            "isOfferCreated:",
            isOfferCreated.current
          );
        }
      };

      peerConnection.current.onicecandidate = (event) => {
        if (event.candidate) {
          socketService.getSocket().emit("webrtc-ice-candidate", {
            to: targetUserId,
            from: userId,
            candidate: event.candidate,
          });
        }
      };

      peerConnection.current.oniceconnectionstatechange = () => {
        // Giữ nguyên logic xử lý oniceconnectionstatechange của bạn
        const pc = peerConnection.current;
        if (!pc) return;
        const newIceState = pc.iceConnectionState;
        console.log("ICE Connection State Change:", newIceState);
        switch (newIceState) {
          case "connected":
          case "completed":
            if (!isConnected) {
              setCallStatus("Đã kết nối");
              setIsConnected(true);
              socketService
                .getSocket()
                .emit("callFullyConnected", { to: targetUserId, from: userId });
            }
            break;
          case "failed":
            setCallStatus("Kết nối thất bại");
            setIsConnected(false);
            // cleanupResources(); // Có thể cân nhắc dọn dẹp nếu thất bại hoàn toàn
            break;
          case "disconnected":
            setCallStatus("Mất kết nối (đang thử lại...)");
            setIsConnected(false);
            break;
          case "closed":
            setIsConnected(false);
            // setCallStatus("Kết nối đã đóng"); // Không set ở đây vì callEnded sẽ xử lý
            cleanupResources();
            break;
          default:
            if (!isConnected) setCallStatus(`Đang kết nối... (${newIceState})`);
        }
      };

      peerConnection.current.ontrack = (event) => {
        console.log("Received remote track:", event.track.kind);
        if (event.streams && event.streams[0]) {
          const remoteStream = event.streams[0];
          if (event.track.kind === "audio" && remoteAudioRef.current) {
            remoteAudioRef.current.srcObject = remoteStream;
            remoteAudioRef.current
              .play()
              .catch((e) => console.error("Lỗi khi play remote audio:", e));
          }
          if (event.track.kind === "video" && remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = remoteStream;
            remoteVideoRef.current
              .play()
              .catch((e) => console.error("Lỗi khi play remote video:", e));
            setIsRemoteVideoOff(false); // Video đối phương đã được nhận và đang chạy

            event.track.onended = () => {
              console.log("Remote video track ended.");
              setIsRemoteVideoOff(true);
              if (remoteVideoRef.current)
                remoteVideoRef.current.srcObject = null;
            };
            event.track.onmute = () => {
              // Xử lý khi track bị mute (VD: đối phương tắt camera nhưng track vẫn còn)
              console.log("Remote video track muted.");
              setIsRemoteVideoOff(true);
            };
            event.track.onunmute = () => {
              // Xử lý khi track được unmute
              console.log("Remote video track unmuted.");
              setIsRemoteVideoOff(false);
            };
          }
        }
      };

      const socket = socketService.getSocket();
      socket.on("webrtc-offer", async ({ from, offer }) => {
        if (!peerConnection.current || from === userId) return;
        const pc = peerConnection.current;
        try {
          await pc.setRemoteDescription(new RTCSessionDescription(offer));
          hasRemoteDescription.current = true;
          await processPendingCandidates();
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          socket.emit("webrtc-answer", { to: from, from: userId, answer });
        } catch (err) {
          console.error("Lỗi khi xử lý offer:", err);
        }
      });

      socket.on("webrtc-answer", async ({ answer, from }) => {
        if (!peerConnection.current || from === userId) return;
        const pc = peerConnection.current;
        try {
          await pc.setRemoteDescription(new RTCSessionDescription(answer));
          hasRemoteDescription.current = true;
          await processPendingCandidates();
        } catch (err) {
          console.error("Lỗi khi xử lý answer:", err);
        }
      });

      socket.on("webrtc-ice-candidate", async ({ candidate, from }) => {
        if (!peerConnection.current || !candidate || from === userId) return;
        try {
          if (
            !peerConnection.current.remoteDescription || // Sửa điều kiện check
            !hasRemoteDescription.current
          ) {
            pendingCandidates.current.push(new RTCIceCandidate(candidate));
          } else {
            await peerConnection.current.addIceCandidate(
              new RTCIceCandidate(candidate)
            );
          }
        } catch (err) {
          console.error("Lỗi khi thêm ICE candidate:", err);
        }
      });

      if (
        role === "caller" &&
        !isOfferCreated.current &&
        peerConnection.current
      ) {
        try {
          setCallStatus("Đang tạo lời mời...");
          const offerOptions: RTCOfferOptions = {
            offerToReceiveAudio: true,
            offerToReceiveVideo: true, // THAY ĐỔI: Luôn sẵn sàng nhận video
          };
          const offer = await peerConnection.current.createOffer(offerOptions);
          await peerConnection.current.setLocalDescription(offer);
          isOfferCreated.current = true;
          socket.emit("webrtc-offer", {
            to: targetUserId,
            from: userId,
            offer,
          });
          setCallStatus(
            type === "video" && !videoOff
              ? "Đang gọi video..."
              : "Đang gọi thoại..."
          );
        } catch (err) {
          console.error("Lỗi khi tạo offer:", err);
          setCallStatus("Lỗi khi tạo lời mời");
        }
      } else if (role !== "caller") {
        setCallStatus("Đang chờ lời mời...");
      }
    } catch (error: unknown) {
      // Giữ nguyên logic xử lý lỗi của bạn
      let errorMessage =
        "Lỗi thiết lập cuộc gọi. Kiểm tra quyền truy cập camera/mic.";
      if (error instanceof Error) {
        console.error(
          "Lỗi nghiêm trọng khi thiết lập luồng media hoặc PeerConnection:",
          error.message
        );
        errorMessage = error.message;
      } else {
        console.error(
          "Lỗi nghiêm trọng khi thiết lập luồng media hoặc PeerConnection:",
          error
        );
      }
      setCallStatus(errorMessage);
      setIsConnected(false);
      if (localStream.current) {
        localStream.current.getTracks().forEach((track) => track.stop());
        localStream.current = null;
      }
      if (localVideoRef.current) localVideoRef.current.srcObject = null;
      cleanupResources();
    }
  };

  const fetchUserInfo = async (userIdToFetch: string) => {
    // Giữ nguyên logic fetchUserInfo của bạn
    try {
      const userData = await getUser(userIdToFetch);
      if (userData && userData.user) {
        return {
          username: userData.user.username || "Người dùng",
          profilePicture:
            userData.user.profilePicture || "/api/placeholder/96/96",
        };
      } else {
        console.error(
          "Không thể lấy thông tin người dùng:",
          userData?.message || "Lỗi không xác định"
        );
        return {
          username: "Người dùng",
          profilePicture: "/api/placeholder/96/96",
        };
      }
    } catch (error) {
      console.error("Lỗi khi lấy thông tin người dùng:", error);
      return {
        username: "Lỗi khi tải thông tin",
        profilePicture: "/api/placeholder/96/96",
      };
    }
  };

  const handleToggleMic = () => {
    // Giữ nguyên logic handleToggleMic của bạn, đảm bảo currentUserId và remoteUserId tồn tại trước khi emit
    if (localStream.current) {
      const audioTracks = localStream.current.getAudioTracks();
      if (audioTracks.length > 0) {
        audioTracks.forEach((track) => {
          track.enabled = !track.enabled;
        });
        const newMicMuted = !audioTracks[0].enabled;
        setMicMuted(newMicMuted);
        if (currentUserId && remoteUserId) {
          // Check IDs
          socketService.getSocket().emit("micStatusChanged", {
            from: currentUserId,
            to: remoteUserId,
            muted: newMicMuted,
          });
        }
      }
    }
  };

  const handleToggleVideo = async () => {
    if (!peerConnection.current || !currentUserId || !remoteUserId) {
      console.warn(
        "[handleToggleVideo] Không thể bật/tắt video: PeerConnection hoặc UserID chưa sẵn sàng."
      );
      return;
    }

    // Khởi tạo localStream nếu nó chưa tồn tại (ví dụ: cuộc gọi bắt đầu là audio)
    if (!localStream.current) {
      localStream.current = new MediaStream();
      console.log("[handleToggleVideo] Initialized new localStream.current");
    }

    const newVideoOff = !videoOff;
    setVideoOff(newVideoOff); // Cập nhật UI trước

    console.log(
      `[handleToggleVideo] Người dùng ${currentUserId} (Bạn) đã ${
        newVideoOff ? "TẮT" : "BẬT"
      } camera.`
    );

    try {
      if (newVideoOff) {
        // --- LOGIC TẮT VIDEO ---
        console.log("[handleToggleVideo] Attempting to turn video OFF.");

        // 1. Dừng và xóa video track khỏi localStream.current
        localStream.current.getVideoTracks().forEach((track) => {
          track.stop();
          localStream.current?.removeTrack(track);
          console.log(
            `[handleToggleVideo] Stopped and removed local video track from localStream: ${track.id}`
          );
        });

        // 2. Cập nhật local video preview
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = null;
          console.log(
            "[handleToggleVideo] Set localVideoRef.current.srcObject to null."
          );
        }

        // 3. Tìm video sender và xóa nó khỏi RTCPeerConnection để trigger renegotiation
        const videoSender = peerConnection.current
          .getSenders()
          .find((s) => s.track?.kind === "video" && s.track); // Quan trọng: s.track phải tồn tại

        if (videoSender) {
          peerConnection.current.removeTrack(videoSender);
          console.log(
            "[handleToggleVideo] Removed videoSender from PeerConnection. Renegotiation should be triggered."
          );
        } else {
          console.log(
            "[handleToggleVideo] No active videoSender found to remove (OFF state)."
          );
        }
        setCallStatus("Camera đã tắt");
      } else {
        // --- LOGIC BẬT VIDEO ---
        console.log("[handleToggleVideo] Attempting to turn video ON.");
        setCallStatus("Xin quyền truy cập camera...");

        const videoStreamConstraints = {
          video: { width: { ideal: 1280 }, height: { ideal: 720 } },
        };
        const newVideoStream = await navigator.mediaDevices.getUserMedia(
          videoStreamConstraints
        );
        const newVideoTrack = newVideoStream.getVideoTracks()[0];

        if (!newVideoTrack) {
          throw new Error("Không lấy được video track mới từ thiết bị.");
        }
        console.log(
          `[handleToggleVideo] Got new video track from getUserMedia: ${newVideoTrack.id}, state: ${newVideoTrack.readyState}`
        );
        setCallStatus("Đang xử lý camera...");

        // 1. Dừng và xóa các video track CŨ khỏi localStream.current (đảm bảo sạch)
        localStream.current.getVideoTracks().forEach((track) => {
          if (track.id !== newVideoTrack.id) {
            // Không dừng track vừa mới lấy
            track.stop();
            localStream.current?.removeTrack(track);
            console.log(
              `[handleToggleVideo] Cleaned up OLD local video track from localStream: ${track.id}`
            );
          }
        });

        // 2. Thêm video track MỚI vào localStream.current (nếu chưa có)
        if (
          !localStream.current
            .getVideoTracks()
            .find((t) => t.id === newVideoTrack.id)
        ) {
          localStream.current.addTrack(newVideoTrack);
          console.log(
            `[handleToggleVideo] Added new video track to localStream: ${newVideoTrack.id}`
          );
        }

        // 3. Cập nhật local video preview
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = new MediaStream(
            localStream.current.getTracks()
          );
          console.log(
            "[handleToggleVideo] Updated localVideoRef.current.srcObject with new MediaStream."
          );
        }

        // 4. Xử lý việc thêm/thay thế track trong RTCPeerConnection
        const videoSender = peerConnection.current
          .getSenders()
          .find((s) => s.track?.kind === "video");

        if (videoSender) {
          await videoSender.replaceTrack(newVideoTrack);
          console.log(
            `[handleToggleVideo] Replaced track on existing videoSender with new track: ${newVideoTrack.id}. Renegotiation might be triggered.`
          );
        } else {
          peerConnection.current.addTrack(newVideoTrack, localStream.current);
          console.log(
            `[handleToggleVideo] Added new video track to PeerConnection (using addTrack): ${newVideoTrack.id}. Renegotiation should be triggered.`
          );
        }

        if (callType === "audio") {
          setCallType("video");
          console.log("[handleToggleVideo] Changed callType to 'video'.");
        }
        setCallStatus("Camera đang bật");
      }

      // Gửi trạng thái video mới cho đối phương (chỉ mang tính thông báo UI)
      if (currentUserId && remoteUserId) {
        socketService.getSocket().emit("videoStatusChanged", {
          from: currentUserId,
          to: remoteUserId,
          disabled: newVideoOff,
        });
      }
    } catch (err: unknown) {
      console.error("[handleToggleVideo] Lỗi nghiêm trọng:", err);
      // Hoàn tác lại trạng thái UI nếu có lỗi khi cố gắng BẬT video
      if (!newVideoOff) {
        setVideoOff(true); // Đặt lại thành TẮT
        if (localVideoRef.current) localVideoRef.current.srcObject = null;
        localStream.current?.getVideoTracks().forEach((t) => {
          if (t.readyState === "live") t.stop(); // Chỉ dừng track đang live
          localStream.current?.removeTrack(t);
        });
        console.log(
          "[handleToggleVideo] Error occurred, reverted video state to OFF."
        );
      }

      let errorMessage = "Lỗi camera không xác định";
      if (
        typeof err === "object" &&
        err !== null &&
        ("name" in err || "message" in err)
      ) {
        const name = (err as { name?: string }).name;
        const message = (err as { message?: string }).message;
        errorMessage =
          name === "NotAllowedError" ||
          (typeof message === "string" &&
            message.includes("Permission denied")) ||
          name === "NotFoundError"
            ? "Không tìm thấy camera hoặc bạn đã từ chối quyền truy cập."
            : `Lỗi camera: ${name || message}`;
      }

      setCallStatus(errorMessage);

      // Thông báo cho đối phương video vẫn tắt (do lỗi)
      if (currentUserId && remoteUserId) {
        socketService.getSocket().emit("videoStatusChanged", {
          from: currentUserId,
          to: remoteUserId,
          disabled: true,
        });
      }
    }
  };

  const handleEndCallLocal = () => {
    if (currentUserId && remoteUserId) {
      socketService.getSocket().emit("endCall", {
        callerId: currentUserId, // Hoặc người khởi tạo cuộc gọi thực sự
        calleeId: remoteUserId,
        endedBy: currentUserId,
      });
    }
    cleanupResources();
    handleEndCall();
    // window.close();
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
      localVideoRef={localVideoRef}
      remoteVideoRef={remoteVideoRef}
      callType={callType}
      isRemoteVideoOff={isRemoteVideoOff}
    />
  );
}
