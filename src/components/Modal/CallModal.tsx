// pages/call-modal.tsx
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

  const remoteAudioRef = useRef<HTMLAudioElement>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  const isOfferCreated = useRef<boolean>(false);
  const hasRemoteDescription = useRef<boolean>(false);
  const pendingCandidates = useRef<RTCIceCandidate[]>([]);

  const urlParams = new URLSearchParams(window.location.search);
  const currentUserId = urlParams.get("userId");
  const remoteUserId = urlParams.get("calleeId");
  const initialCallType = urlParams.get("callType") as "audio" | "video" | null;
  const role =
    urlParams.get("role") || (initialCallType ? "caller" : "receiver");

  useEffect(() => {
    setCallType(initialCallType);
    setVideoOff(initialCallType === "audio"); // Video tắt nếu là audio call

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

      if (socket.connected) {
        socketService.registerUser(currentUserId);
      }

      // Gọi setupMediaStream sau khi thông tin user đã được fetch và state đã sẵn sàng
      // Quan trọng: initialCallType ở đây có thể là null nếu URL không có, cần xử lý
      if (initialCallType) {
        setupMediaStream(initialCallType, currentUserId, remoteUserId);
      } else {
        setCallStatus("Lỗi: Loại cuộc gọi không xác định.");
        console.error(
          "FIX: initialCallType is null, cannot setup media stream."
        );
        return;
      }

      window.onbeforeunload = () => {
        socket.emit("endCall", {
          callerId: currentUserId,
          calleeId: remoteUserId,
          endedBy: currentUserId,
        });
        cleanupResources();
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
        setTimeout(() => window.close(), 3000);
      });

      socket.on("videoStatusChanged", ({ from, disabled }) => {
        if (from === remoteUserId) {
          console.log(
            `FIX: Remote video status changed from ${from}, disabled: ${disabled}`
          );
          setIsRemoteVideoOff(disabled);
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
        setIsConnected(false); // Thêm dòng này
      });
    }

    return () => {
      cleanupResources();
      window.onbeforeunload = null;
      socket.off("callConnected");
      socket.off("callEnded");
      socket.off("videoStatusChanged");
      socket.off("webrtc-offer");
      socket.off("webrtc-answer");
      socket.off("webrtc-ice-candidate");
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUserId, remoteUserId, initialCallType]); // Phải có initialCallType ở đây

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
      // Gỡ bỏ onnegotiationneeded trước khi close
      peerConnection.current.onnegotiationneeded = null;
      peerConnection.current.onicecandidate = null;
      peerConnection.current.oniceconnectionstatechange = null;
      peerConnection.current.ontrack = null;

      peerConnection.current.getSenders().forEach((sender) => {
        if (sender.track) sender.track.stop();
      });
      if (peerConnection.current.signalingState !== "closed") {
        peerConnection.current.close();
      }
      peerConnection.current = null;
    }

    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;

    isOfferCreated.current = false;
    hasRemoteDescription.current = false;
    pendingCandidates.current = [];
    setIsConnected(false);
    // Không setCallStatus ở đây để event "callEnded" xử lý
  };

  const processPendingCandidates = async () => {
    if (
      !peerConnection.current ||
      peerConnection.current.signalingState !== "stable" || // Hoặc khi remoteDescription đã được set
      !hasRemoteDescription.current || // Chỉ add khi đã có remote description
      pendingCandidates.current.length === 0
    ) {
      return;
    }
    console.log(
      "FIX: Processing pending ICE candidates",
      pendingCandidates.current.length
    );
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
    try {
      setCallStatus("Xin quyền truy cập thiết bị...");
      const constraints = {
        audio: true,
        video: type === "video" && !videoOff,
      };
      localStream.current = await navigator.mediaDevices.getUserMedia(
        constraints
      );

      if (
        localVideoRef.current &&
        localStream.current.getVideoTracks().length > 0
      ) {
        localVideoRef.current.srcObject = localStream.current;
        localVideoRef.current
          .play()
          .catch((e) => console.warn("Local video play failed initially:", e));
      }

      setCallStatus("Đang thiết lập kết nối...");

      const peerConfigResult: CreatePeerConnectionReturn =
        await createPeerConnection();
      if (peerConfigResult) {
        // (Logic khởi tạo peerConnection.current của bạn)
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
          throw new Error("Cấu hình peer không hợp lệ.");
        }
      } else {
        throw new Error("Cấu hình peer là null.");
      }

      if (!peerConnection.current) {
        // Fallback nếu vẫn chưa có peerConnection
        console.warn(
          "FIX: PeerConnection không được khởi tạo từ API. Sử dụng fallback STUN."
        );
        peerConnection.current = new RTCPeerConnection({
          iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
        });
      }

      localStream.current?.getTracks().forEach((track) => {
        peerConnection.current?.addTrack(track, localStream.current!);
      });

      // Xử lý onnegotiationneeded (QUAN TRỌNG cho việc thêm/bớt track sau này)
      peerConnection.current.onnegotiationneeded = async () => {
        console.log(
          "FIX: onnegotiationneeded triggered. Signaling state:",
          peerConnection.current?.signalingState
        );
        // Chỉ tạo offer nếu là người gọi, hoặc nếu cần re-negotiate và signalingState là stable
        // Tránh tạo offer nếu đã có offer đang được xử lý (perfect negotiation cần phức tạp hơn)
        if (
          peerConnection.current &&
          userId &&
          targetUserId &&
          ((role === "caller" && !isOfferCreated.current) ||
            (isOfferCreated.current &&
              peerConnection.current.signalingState === "stable"))
        ) {
          try {
            console.log("FIX: Creating offer due to negotiation needed.");
            // Cập nhật offerToReceiveVideo dựa trên trạng thái hiện tại
            const currentOfferToReceiveVideo =
              callType === "video" ||
              (!videoOff &&
                (localStream.current?.getVideoTracks().some((t) => t.enabled) ??
                  false));

            const offer = await peerConnection.current.createOffer({
              offerToReceiveAudio: true,
              offerToReceiveVideo: currentOfferToReceiveVideo,
            });
            await peerConnection.current.setLocalDescription(offer);

            // Chỉ đánh dấu isOfferCreated nếu đây là offer khởi tạo từ caller
            if (role === "caller" && !isOfferCreated.current) {
              isOfferCreated.current = true;
            }

            socketService.getSocket().emit("webrtc-offer", {
              to: targetUserId,
              from: userId,
              offer: peerConnection.current.localDescription, // Gửi offer mới nhất
            });
            console.log("FIX: Offer sent via onnegotiationneeded.");
          } catch (err) {
            console.error(
              "FIX: Lỗi trong onnegotiationneeded khi tạo offer:",
              err
            );
            setCallStatus("Lỗi khi thương lượng kết nối.");
          }
        } else {
          console.log(
            "FIX: onnegotiationneeded - SKIPPING offer. Role:",
            role,
            "isOfferCreated:",
            isOfferCreated.current,
            "SignalingState:",
            peerConnection.current?.signalingState
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
        const pc = peerConnection.current;
        if (!pc) return;
        const newIceState = pc.iceConnectionState;
        console.log("FIX: ICE Connection State Change:", newIceState);
        switch (newIceState) {
          case "connected":
          case "completed":
            if (!isConnected) {
              // Chỉ cập nhật nếu trước đó chưa connected
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
            // cleanupResources(); // Có thể cần thiết
            break;
          case "disconnected":
            setCallStatus("Mất kết nối (thử lại...)");
            setIsConnected(false);
            // peerConnection.current?.restartIce(); // Thử restart ICE
            break;
          case "closed":
            // setCallStatus("Cuộc gọi đã kết thúc"); // Để callEnded event xử lý
            setIsConnected(false);
            // cleanupResources(); // Có thể gọi ở đây nếu không có event callEnded từ server
            break;
          default:
            if (!isConnected) setCallStatus(`Đang kết nối... (${newIceState})`);
        }
      };

      peerConnection.current.ontrack = (event) => {
        console.log(
          "FIX: Ontrack event. Track kind:",
          event.track.kind,
          "Stream IDs:",
          event.streams.map((s) => s.id).join(", ")
        );
        if (event.streams && event.streams[0]) {
          const remoteStream = event.streams[0];
          if (event.track.kind === "audio" && remoteAudioRef.current) {
            console.log("FIX: Assigning remote audio stream.");
            remoteAudioRef.current.srcObject = remoteStream;
            remoteAudioRef.current
              .play()
              .catch((e) => console.error("Lỗi khi play remote audio:", e));
          }
          if (event.track.kind === "video" && remoteVideoRef.current) {
            console.log(
              "FIX: Assigning remote video stream to remoteVideoRef."
            );
            remoteVideoRef.current.srcObject = remoteStream;
            remoteVideoRef.current
              .play()
              .catch((e) => console.error("Lỗi khi play remote video:", e));
            setIsRemoteVideoOff(false); // ĐÃ NHẬN ĐƯỢC VIDEO TỪ XA
            console.log("FIX: isRemoteVideoOff set to FALSE by ontrack");

            event.track.onended = () => {
              // Khi remote video track kết thúc (ví dụ họ tắt cam)
              console.log("FIX: Remote video track ended.");
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
        console.log("FIX: Received webrtc-offer from", from);
        try {
          await peerConnection.current.setRemoteDescription(
            new RTCSessionDescription(offer)
          );
          hasRemoteDescription.current = true;
          await processPendingCandidates(); // Xử lý ICE candidates đang chờ

          const answer = await peerConnection.current.createAnswer();
          await peerConnection.current.setLocalDescription(answer);
          socket.emit("webrtc-answer", { to: from, from: userId, answer });
          console.log("FIX: Answer sent to", from);
        } catch (err) {
          console.error("FIX: Lỗi khi xử lý offer:", err);
        }
      });

      socket.on("webrtc-answer", async ({ from, answer }) => {
        if (!peerConnection.current || from === userId) return;
        console.log("FIX: Received webrtc-answer from", from);
        try {
          await peerConnection.current.setRemoteDescription(
            new RTCSessionDescription(answer)
          );
          hasRemoteDescription.current = true;
          await processPendingCandidates();
          console.log("FIX: Remote description (answer) set from", from);
        } catch (err) {
          console.error("FIX: Lỗi khi xử lý answer:", err);
        }
      });

      socket.on("webrtc-ice-candidate", async ({ from, candidate }) => {
        if (!peerConnection.current || !candidate || from === userId) return;
        console.log("FIX: Received ICE candidate from", from);
        try {
          if (!peerConnection.current.remoteDescription) {
            console.log(
              "FIX: Remote description not set yet, queuing ICE candidate."
            );
            pendingCandidates.current.push(new RTCIceCandidate(candidate));
          } else {
            await peerConnection.current.addIceCandidate(
              new RTCIceCandidate(candidate)
            );
            console.log("FIX: Added ICE candidate from", from);
          }
        } catch (err) {
          // Bỏ qua lỗi "Error: NotPrivateError: Candidate provided before remote description" nếu dùng pending
          if (
            !`${err}`.includes("Candidate provided before remote description")
          ) {
            console.error("FIX: Lỗi khi thêm ICE candidate:", err);
          }
        }
      });

      // Chỉ người gọi (caller) mới chủ động tạo offer ban đầu
      // onnegotiationneeded sẽ handle các thay đổi sau đó (ví dụ thêm track)
      if (
        role === "caller" &&
        !isOfferCreated.current &&
        peerConnection.current
      ) {
        setCallStatus("Đang tạo lời mời...");
        // onnegotiationneeded nên được trigger bởi addTrack và tự tạo offer
        // Hoặc bạn có thể gọi createOffer trực tiếp ở đây nếu onnegotiationneeded không đủ tin cậy cho initial offer
        console.log("FIX: Caller creating initial offer.");
        try {
          const offer = await peerConnection.current.createOffer({
            offerToReceiveAudio: true,
            offerToReceiveVideo: type === "video",
          });
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
          console.error("FIX: Lỗi khi caller tạo offer ban đầu:", err);
          setCallStatus("Lỗi khi tạo lời mời");
        }
      } else if (role !== "caller") {
        setCallStatus("Đang chờ lời mời...");
      }
    } catch (error) {
      console.error(
        "FIX: Lỗi nghiêm trọng khi thiết lập media/PeerConnection:",
        error
      );
      setCallStatus("Lỗi thiết lập. Kiểm tra quyền camera/mic.");
      setIsConnected(false);
      // cleanupResources(); // Dọn dẹp nếu lỗi nặng
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
      }
      console.error("Không thể lấy thông tin người dùng:", userData?.message);
      return {
        username: "Người dùng",
        profilePicture: "/api/placeholder/96/96",
      };
    } catch (error) {
      console.error("Lỗi khi lấy thông tin người dùng:", error);
      return { username: "Lỗi tải", profilePicture: "/api/placeholder/96/96" };
    }
  };

  const handleToggleMic = () => {
    if (localStream.current) {
      const audioTracks = localStream.current.getAudioTracks();
      if (audioTracks.length > 0) {
        const newMicMutedState = !micMuted;
        audioTracks.forEach((track) => {
          track.enabled = !newMicMutedState;
        });
        setMicMuted(newMicMutedState);
        if (currentUserId && remoteUserId) {
          socketService.getSocket().emit("micStatusChanged", {
            from: currentUserId,
            to: remoteUserId,
            muted: newMicMutedState,
          });
        }
      }
    }
  };

  const handleToggleVideo = async () => {
    if (!localStream.current || !peerConnection.current) return;

    const newVideoOffState = !videoOff;
    setVideoOff(newVideoOffState); // Cập nhật UI trước

    let videoTrack = localStream.current.getVideoTracks()[0];

    if (videoTrack) {
      // Nếu đã có video track, chỉ cần enable/disable nó
      videoTrack.enabled = !newVideoOffState;
      console.log(
        `FIX: Video track ${videoTrack.id} enabled: ${videoTrack.enabled}`
      );
    } else if (!newVideoOffState) {
      // Nếu chưa có video track (ví dụ từ audio call) và người dùng muốn BẬT video
      try {
        setCallStatus("Đang bật camera...");
        const videoStream = await navigator.mediaDevices.getUserMedia({
          video: true,
        });
        videoTrack = videoStream.getVideoTracks()[0];
        if (!videoTrack) {
          throw new Error("Không lấy được video track mới.");
        }
        localStream.current.addTrack(videoTrack); // Thêm vào local stream

        // Thêm track vào peer connection, onnegotiationneeded sẽ được gọi
        const sender = peerConnection.current
          .getSenders()
          .find((s) => s.track?.kind === "video");
        if (sender) {
          await sender.replaceTrack(videoTrack);
          console.log("FIX: Video track replaced in sender.");
        } else {
          peerConnection.current.addTrack(videoTrack, localStream.current);
          console.log("FIX: New video track added to PeerConnection.");
        }
        setCallStatus("Camera đã bật");
        // Cập nhật callType nếu cần (onnegotiationneeded sẽ dùng callType để tạo offer)
        if (callType === "audio") {
          setCallType("video"); // Nâng cấp lên video call
        }
      } catch (err) {
        console.error("FIX: Không thể lấy hoặc thêm video track mới:", err);
        setVideoOff(true); // Quay lại trạng thái tắt nếu lỗi
        setCallStatus("Lỗi bật camera");
        return; // Không làm gì thêm nếu lỗi
      }
    }
    // Cập nhật srcObject cho local video display
    if (localVideoRef.current) {
      if (
        !newVideoOffState &&
        localStream.current.getVideoTracks().some((t) => t.enabled)
      ) {
        localVideoRef.current.srcObject = localStream.current;
        localVideoRef.current
          .play()
          .catch((e) => console.warn("Local video play failed on toggle:", e));
      } else {
        localVideoRef.current.srcObject = null;
      }
    }

    // Gửi trạng thái video mới cho đối phương
    if (currentUserId && remoteUserId) {
      socketService.getSocket().emit("videoStatusChanged", {
        from: currentUserId,
        to: remoteUserId,
        disabled: newVideoOffState,
      });
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
    handleEndCall(); // Prop này có thể không cần nếu cửa sổ tự đóng
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
      localVideoRef={localVideoRef}
      remoteVideoRef={remoteVideoRef}
      callType={callType}
      isRemoteVideoOff={isRemoteVideoOff}
    />
  );
}
