import { useState, useEffect, useRef } from "react";
import { socketService } from "@/server/socket";
import { createPeerConnection } from "@/server/messenger";
import CallModalUi from "@/app/ui/CallModalUi";
import { CreatePeerConnectionReturn } from "@/types/messenger.types";
import { getUser } from "@/server/user";

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
  const [callType, setCallType] = useState<"audio" | "video" | null>(null);
  const [isRemoteVideoOff, setIsRemoteVideoOff] = useState(true);
  const localStream = useRef<MediaStream | null>(null);
  const peerConnection = useRef<RTCPeerConnection | null>(null);

  // Refs cho các element media
  const remoteAudioRef = useRef<HTMLAudioElement>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  const isOfferCreated = useRef<boolean>(false);
  const hasRemoteDescription = useRef<boolean>(false);
  const pendingCandidates = useRef<RTCIceCandidate[]>([]);

  // Lấy userId, calleeId, callType từ URL params
  const urlParams = new URLSearchParams(window.location.search);
  const currentUserId = urlParams.get("userId");
  const remoteUserId = urlParams.get("calleeId");
  const initialCallType = urlParams.get("callType") as "audio" | "video" | null;
  const role =
    urlParams.get("role") || (initialCallType ? "caller" : "receiver"); // Xác định vai trò

  useEffect(() => {
    setCallType(initialCallType);
    // Nếu là video call, camera mặc định bật (videoOff = false)
    setVideoOff(initialCallType === "audio");

    let socket = socketService.getSocket();
    if (!socket || !socket.connected) {
      socket = socketService.initSocket();
    }

    const performCallSetup = () => {
      if (!currentUserId || !remoteUserId || !initialCallType) {
        setCallStatus("Lỗi: Thiếu thông tin cuộc gọi.");
        console.error("FIX: Missing call info in URL params", {
          currentUserId,
          remoteUserId,
          initialCallType,
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

      // Chỉ register user nếu socket đã connect, nếu không, làm trong sự kiện 'connect'
      if (socket.connected) {
        socketService.registerUser(currentUserId);
      }

      setupMediaStream(initialCallType, currentUserId, remoteUserId);

      window.onbeforeunload = () => {
        // Thông báo cho user khác rằng cuộc gọi kết thúc khi đóng cửa sổ
        socket.emit("endCall", {
          callerId: currentUserId,
          calleeId: remoteUserId,
          endedBy: currentUserId,
        });
        cleanupResources();
        handleEndCall();
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
        setTimeout(() => window.close(), 2000);
      });

      // Lắng nghe trạng thái video của đối phương
      socket.on("videoStatusChanged", ({ from, disabled }) => {
        if (from === remoteUserId) {
          setIsRemoteVideoOff(disabled);
          // Log khi trạng thái camera của người dùng từ xa thay đổi
          console.log(
            // <--- LOG CHO HÀNH ĐỘNG CỦA ĐỐI PHƯƠNG
            `CONSOLE LOG (REMOTE): Người dùng <span class="math-inline">\{from\} \(</span>{callerInfo.username}) đã ${
              disabled ? "TẮT" : "BẬT"
            } camera.`
          );
        }
      });
    };

    if (socket.connected) {
      performCallSetup();
    } else {
      socket.once("connect", () => {
        console.log("Socket connected, performing call setup.");
        socketService.registerUser(currentUserId!);
        performCallSetup();
      });
      socket.once("disconnect", () => {
        setCallStatus("Mất kết nối socket...");
      });
    }

    return () => {
      cleanupResources();
      window.onbeforeunload = null;
      socket.off("callConnected");
      socket.off("callEnded");
      socket.off("videoStatusChanged");
      // Gỡ các listeners khác của WebRTC nếu cần
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUserId, remoteUserId, initialCallType]);

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
      peerConnection.current.getSenders().forEach((sender) => {
        if (sender.track) sender.track.stop();
      });
      peerConnection.current.close();
      peerConnection.current = null;
    }

    // Reset refs cho video elements
    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;

    isOfferCreated.current = false;
    hasRemoteDescription.current = false;
    pendingCandidates.current = [];
    setIsConnected(false);
    // setCallStatus("Đã kết thúc"); // Trạng thái này sẽ được set bởi 'callEnded' event
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
    type: "audio" | "video",
    userId: string,
    targetUserId: string
  ) => {
    // Khởi tạo stream rỗng để thêm track vào một cách có kiểm soát
    const tempStream = new MediaStream();

    try {
      setCallStatus("Xin quyền truy cập micro...");
      // 1. Luôn cố gắng lấy audio trước
      const audioStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });
      audioStream
        .getAudioTracks()
        .forEach((track) => tempStream.addTrack(track));

      // 2. Xử lý video nếu là video call
      if (type === "video") {
        if (!videoOff) {
          // Chỉ thử lấy video nếu người dùng không chủ động tắt từ đầu (videoOff là false)
          setCallStatus("Xin quyền truy cập camera...");
          try {
            const videoStream = await navigator.mediaDevices.getUserMedia({
              video: true,
            });
            videoStream
              .getVideoTracks()
              .forEach((track) => tempStream.addTrack(track));
          } catch (videoError: unknown) {
            if (
              typeof videoError === "object" &&
              videoError !== null &&
              "name" in videoError &&
              "message" in videoError
            ) {
              const err = videoError as { name: string; message: string };
              console.warn("Không thể truy cập camera:", err.name, err.message);
            } else {
              console.warn("Không thể truy cập camera:", videoError);
            }
            setVideoOff(true);
            setCallStatus("Không thể truy cập camera, tiếp tục với âm thanh.");
          }
        } else {
        }
      } else {
        // type === "audio"
        // Đối với audio call, đảm bảo videoOff là true
        if (!videoOff) {
          // Nếu vì lý do nào đó videoOff đang là false cho audio call
          setVideoOff(true);
        }
      }

      // Sau khi đã thử lấy audio và video, gán kết quả cho localStream.current
      localStream.current = tempStream;

      // Kiểm tra xem có audio track không, nếu không thì không thể tiếp tục
      if (localStream.current.getAudioTracks().length === 0) {
        throw new Error(
          "Không thể lấy được luồng âm thanh. Vui lòng kiểm tra quyền và thiết bị micro."
        );
      }

      // Gán local stream vào local video element
      // Cập nhật này cần chạy sau khi đã xác định được trạng thái cuối cùng của videoOff và localStream.current
      if (localVideoRef.current) {
        if (
          type === "video" &&
          !videoOff &&
          localStream.current.getVideoTracks().length > 0
        ) {
          localVideoRef.current.srcObject = localStream.current;
        } else {
          localVideoRef.current.srcObject = null; // Nếu là audio call, hoặc video call nhưng video tắt/lỗi
        }
      }

      setCallStatus("Đang thiết lập kết nối...");

      const peerConfigResult: CreatePeerConnectionReturn =
        await createPeerConnection();
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
            break;
          case "disconnected":
            setCallStatus("Mất kết nối (đang thử lại...)");
            setIsConnected(false);
            break;
          case "closed":
            setIsConnected(false);
            cleanupResources(); // Dọn dẹp khi đóng kết nối
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
            setIsRemoteVideoOff(false); // Video đối phương đã được nhận

            event.track.onended = () => {
              console.log("Remote video track ended.");
              setIsRemoteVideoOff(true);
              if (remoteVideoRef.current)
                remoteVideoRef.current.srcObject = null;
            };
          }
        }
      };

      const socket = socketService.getSocket();
      socket.on("webrtc-offer", async ({ from, offer }) => {
        if (!peerConnection.current || from === userId) return; // Không xử lý offer của chính mình
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
        if (!peerConnection.current || from === userId) return; // Không xử lý answer của chính mình
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
        if (!peerConnection.current || !candidate || from === userId) return; // Không xử lý candidate của chính mình
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
            offerToReceiveVideo: type === "video", // Yêu cầu nhận video nếu là video call
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
            type === "video" ? "Đang gọi video..." : "Đang gọi thoại..."
          );
        } catch (err) {
          console.error("Lỗi khi tạo offer:", err);
          setCallStatus("Lỗi khi tạo lời mời");
        }
      } else if (role !== "caller") {
        setCallStatus("Đang chờ lời mời...");
      }
    } catch (error: unknown) {
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
      // Dọn dẹp stream nếu đã tạo một phần
      if (localStream.current) {
        localStream.current.getTracks().forEach((track) => track.stop());
        localStream.current = null;
      }
      if (localVideoRef.current) localVideoRef.current.srcObject = null;
      cleanupResources();
    }
  };

  const fetchUserInfo = async (userIdToFetch: string) => {
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
          userData.message || "Lỗi không xác định"
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
    if (localStream.current) {
      const audioTracks = localStream.current.getAudioTracks();
      if (audioTracks.length > 0) {
        audioTracks.forEach((track) => {
          track.enabled = !track.enabled;
        });
        const newMicMuted = !audioTracks[0].enabled;
        setMicMuted(newMicMuted);
        // Gửi trạng thái mic mới cho đối phương nếu cần
        if (currentUserId && remoteUserId) {
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
    if (!peerConnection.current) return;

    const newVideoOff = !videoOff; // Trạng thái mới của camera local
    setVideoOff(newVideoOff);

    // Log khi người dùng hiện tại (local) thay đổi trạng thái camera
    if (currentUserId) {
      console.log(
        `CONSOLE LOG (LOCAL): Người dùng ${currentUserId} (Bạn) đã ${
          newVideoOff ? "TẮT" : "BẬT"
        } camera.`
      );
    }

    try {
      if (newVideoOff) {
        // ... (Logic tắt video)
        if (localStream.current) {
          const videoTracks = localStream.current.getVideoTracks();
          videoTracks.forEach((track) => {
            track.stop();
            localStream.current?.removeTrack(track);
          });
        }
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = null;
        }
      } else {
        // ... (Logic bật video)
        const videoStream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        });

        const videoTrack = videoStream.getVideoTracks()[0];

        if (localStream.current) {
          const oldVideoTracks = localStream.current.getVideoTracks();
          oldVideoTracks.forEach((track) => {
            track.stop();
            localStream.current?.removeTrack(track);
          });
          localStream.current.addTrack(videoTrack);
        } else {
          localStream.current = videoStream;
        }

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = localStream.current;
        }

        const videoSender = peerConnection.current
          .getSenders()
          .find((sender) => sender.track?.kind === "video");

        if (videoSender) {
          await videoSender.replaceTrack(videoTrack);
        } else {
          peerConnection.current.addTrack(videoTrack, localStream.current);
        }
      }

      // Gửi trạng thái video mới cho đối phương
      if (currentUserId && remoteUserId) {
        socketService.getSocket().emit("videoStatusChanged", {
          from: currentUserId,
          to: remoteUserId,
          disabled: newVideoOff, // Gửi trạng thái mới
        });
      }
    } catch (err) {
      console.error("Lỗi khi xử lý video:", err);
      setVideoOff(true); // Nếu có lỗi, coi như video đang tắt
      setCallStatus("Lỗi khi xử lý camera");
    }
  };

  const handleEndCallLocal = () => {
    if (currentUserId && remoteUserId) {
      socketService.getSocket().emit("endCall", {
        callerId: currentUserId,
        calleeId: remoteUserId,
        endedBy: currentUserId,
      });
    }
    cleanupResources();
    handleEndCall();
    window.close();
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
      localVideoRef={localVideoRef} // Truyền ref
      remoteVideoRef={remoteVideoRef} // Truyền ref
      callType={callType} // Truyền loại cuộc gọi
      isRemoteVideoOff={isRemoteVideoOff} // Truyền trạng thái video của đối phương
    />
  );
}
