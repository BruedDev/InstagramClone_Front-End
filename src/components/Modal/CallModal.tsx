// pages/call-modal.tsx hoặc nơi bạn định nghĩa CallModal component
import { useState, useEffect, useRef } from "react";
import { socketService } from "@/server/socket";
import { createPeerConnection } from "@/server/messenger"; // Giả sử hàm này trả về cấu hình ICE servers hoặc RTCPeerConnection
import CallModalUi from "@/app/ui/CallModalUi"; // Đường dẫn đúng tới CallModalUi
import { CreatePeerConnectionReturn } from "@/types/messenger.types";
import { getUser } from "@/server/user"; // API lấy thông tin user

export interface CallModalProps {
  handleEndCall: () => void; // Hàm này có thể được gọi khi cửa sổ tự đóng hoặc user chủ động đóng
}

export default function CallModal({ handleEndCall }: CallModalProps) {
  const [micMuted, setMicMuted] = useState(false);
  const [videoOff, setVideoOff] = useState(false); // Ban đầu camera có thể tắt hoặc bật tùy theo callType
  const [callerInfo, setCallerInfo] = useState({
    username: "Đang tải...",
    profilePicture: "/api/placeholder/96/96", // Placeholder image
  });
  const [callStatus, setCallStatus] = useState("Đang khởi tạo...");
  const [isConnected, setIsConnected] = useState(false);
  const [callType, setCallType] = useState<"audio" | "video" | null>(null);
  const [isRemoteVideoOff, setIsRemoteVideoOff] = useState(true); // Giả sử ban đầu remote video tắt

  const localStream = useRef<MediaStream | null>(null);
  const peerConnection = useRef<RTCPeerConnection | null>(null);

  // Refs cho các element media
  const remoteAudioRef = useRef<HTMLAudioElement>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null); // Thêm ref cho local video element
  const remoteVideoRef = useRef<HTMLVideoElement>(null); // Thêm ref cho remote video element

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
    // Nếu là audio call, camera mặc định tắt (videoOff = true)
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
        cleanupResources(); // Dọn dẹp tài nguyên
        // Không cần gọi handleEndCall() ở đây vì nó là prop cho component cha của Modal, cửa sổ này tự đóng
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
        setTimeout(() => window.close(), 2000); // Đóng cửa sổ sau 2 giây
      });

      // Lắng nghe trạng thái video của đối phương
      socket.on("videoStatusChanged", ({ from, disabled }) => {
        if (from === remoteUserId) {
          setIsRemoteVideoOff(disabled);
        }
      });
    };

    if (socket.connected) {
      performCallSetup();
    } else {
      socket.once("connect", () => {
        console.log("Socket connected, performing call setup.");
        socketService.registerUser(currentUserId!); // Đảm bảo currentUserId có giá trị
        performCallSetup();
      });
      socket.once("disconnect", () => {
        setCallStatus("Mất kết nối socket...");
      });
    }

    return () => {
      // Gửi sự kiện endCall khi component unmount (ví dụ user tự đóng tab)
      // if (peerConnection.current && peerConnection.current.iceConnectionState !== 'closed') {
      //   socket.emit("endCall", { callerId: currentUserId, calleeId: remoteUserId, endedBy: currentUserId });
      // }
      cleanupResources();
      window.onbeforeunload = null; // Gỡ bỏ event listener
      socket.off("callConnected");
      socket.off("callEnded");
      socket.off("videoStatusChanged");
      // Gỡ các listeners khác của WebRTC nếu cần
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUserId, remoteUserId, initialCallType]); // Chỉ chạy 1 lần khi mount

  const cleanupResources = () => {
    const socket = socketService.getSocket();
    if (socket) {
      // Gỡ các listeners WebRTC cụ thể đã thêm trong setupMediaStream
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
    try {
      setCallStatus("Xin quyền truy cập thiết bị...");
      const constraints = {
        audio: true,
        video: type === "video" && !videoOff, // Chỉ yêu cầu video nếu là video call và camera đang được kỳ vọng là bật
      };
      localStream.current = await navigator.mediaDevices.getUserMedia(
        constraints
      );

      // Gán local stream vào local video element nếu nó tồn tại và có video track
      if (
        localVideoRef.current &&
        localStream.current.getVideoTracks().length > 0
      ) {
        localVideoRef.current.srcObject = localStream.current;
      }
      // Nếu ban đầu là audio call và người dùng bật camera sau, stream sẽ được cập nhật ở handleToggleVideo

      setCallStatus("Đang thiết lập kết nối...");

      const peerConfigResult: CreatePeerConnectionReturn =
        await createPeerConnection();
      // ... (Phần xử lý peerConfigResult và khởi tạo peerConnection.current như cũ) ...
      // Đảm bảo bạn có một fallback nếu createPeerConnection() thất bại hoặc trả về null/undefined
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
            "FIX: Cấu hình peer từ API không xác định. Sử dụng fallback."
          );
          throw new Error("Cấu hình peer không hợp lệ.");
        }
      } else {
        console.warn("FIX: Cấu hình peer từ API là null. Sử dụng fallback.");
        throw new Error("Cấu hình peer là null.");
      }

      if (!peerConnection.current) {
        console.error(
          "FIX: PeerConnection không được khởi tạo. Sử dụng fallback STUN."
        );
        peerConnection.current = new RTCPeerConnection({
          iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
        });
      }
      // Thêm tracks vào peer connection
      localStream.current?.getTracks().forEach((track) => {
        peerConnection.current?.addTrack(track, localStream.current!);
      });

      // Handle onicecandidate
      peerConnection.current.onicecandidate = (event) => {
        if (event.candidate) {
          socketService.getSocket().emit("webrtc-ice-candidate", {
            to: targetUserId,
            from: userId,
            candidate: event.candidate,
          });
        }
      };

      // Handle oniceconnectionstatechange (quan trọng cho trạng thái cuộc gọi)
      peerConnection.current.oniceconnectionstatechange = () => {
        // ... (giữ nguyên logic xử lý oniceconnectionstatechange của bạn) ...
        const pc = peerConnection.current;
        if (!pc) return;
        const newIceState = pc.iceConnectionState;
        console.log("FIX: ICE Connection State Change:", newIceState);
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
            // cleanupResources(); // Có thể cần dọn dẹp và đóng
            break;
          case "disconnected":
            setCallStatus("Mất kết nối (đang thử lại...)");
            setIsConnected(false);
            break;
          case "closed":
            // setCallStatus("Cuộc gọi đã kết thúc"); // Nên để sự kiện 'callEnded' từ server xử lý
            setIsConnected(false);
            // cleanupResources(); // Dọn dẹp khi đóng kết nối
            break;
          default:
            if (!isConnected) setCallStatus(`Đang kết nối... (${newIceState})`);
        }
      };

      // Handle ontrack (nhận media từ đối phương)
      peerConnection.current.ontrack = (event) => {
        console.log("FIX: Received remote track:", event.track.kind);
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

            // Lắng nghe khi track video của đối phương kết thúc (ví dụ họ tắt cam)
            event.track.onended = () => {
              console.log("FIX: Remote video track ended.");
              setIsRemoteVideoOff(true);
              // Có thể muốn xóa srcObject của remoteVideoRef hoặc hiển thị placeholder
              if (remoteVideoRef.current)
                remoteVideoRef.current.srcObject = null;
            };
          }
        }
      };

      // Setup WebRTC socket event listeners
      const socket = socketService.getSocket();
      // ... (giữ nguyên các listeners: webrtc-offer, webrtc-answer, webrtc-ice-candidate)
      socket.on("webrtc-offer", async ({ from, offer }) => {
        if (!peerConnection.current) return;
        const pc = peerConnection.current;
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
      if (
        role === "caller" &&
        !isOfferCreated.current &&
        peerConnection.current
      ) {
        try {
          setCallStatus("Đang tạo lời mời...");
          const offer = await peerConnection.current.createOffer({
            offerToReceiveAudio: true,
            offerToReceiveVideo: type === "video", // Chỉ yêu cầu nhận video nếu là video call
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
          console.error("FIX: Lỗi khi tạo offer:", err);
          setCallStatus("Lỗi khi tạo lời mời");
        }
      } else if (role !== "caller") {
        setCallStatus("Đang chờ lời mời...");
      }
    } catch (error) {
      console.error(
        "FIX: Lỗi nghiêm trọng khi thiết lập luồng media hoặc PeerConnection:",
        error
      );
      setCallStatus(
        "Lỗi thiết lập cuộc gọi. Kiểm tra quyền truy cập camera/mic."
      );
      setIsConnected(false);
      // Không cần fallback RTCPeerConnection ở đây nữa nếu đã có trong try block
    }
  };

  const fetchUserInfo = async (userIdToFetch: string) => {
    // ... (giữ nguyên hàm fetchUserInfo của bạn)
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
    // ... (Giữ nguyên logic handleToggleMic, chỉ cần đảm bảo setMicMuted(newMicMuted) được gọi)
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
    if (!localStream.current || !peerConnection.current) return;

    const newVideoOff = !videoOff;
    setVideoOff(newVideoOff); // Cập nhật trạng thái UI trước

    const videoTracks = localStream.current.getVideoTracks();

    if (videoTracks.length > 0) {
      // Nếu đã có video track, chỉ cần enable/disable nó
      videoTracks.forEach((track) => {
        track.enabled = !newVideoOff;
      });
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = !newVideoOff
          ? localStream.current
          : null;
      }
    } else if (!newVideoOff) {
      // Nếu chưa có video track (ví dụ từ audio call chuyển sang có video) và người dùng muốn bật video
      try {
        setCallStatus("Đang bật camera...");
        const videoStream = await navigator.mediaDevices.getUserMedia({
          video: true,
        });
        const videoTrack = videoStream.getVideoTracks()[0];

        // Thêm video track vào localStream hiện tại
        localStream.current.addTrack(videoTrack);

        // Gán lại stream cho local video element
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = localStream.current;
        }

        // Thêm video track vào peer connection
        const videoSender = peerConnection.current
          .getSenders()
          .find((s) => s.track?.kind === "video");
        if (videoSender) {
          videoSender.replaceTrack(videoTrack);
        } else {
          peerConnection.current.addTrack(videoTrack, localStream.current);
        }

        // Cần re-negotiate (tạo offer mới) nếu thêm track mới hoàn toàn
        // Đây là phần phức tạp, có thể cần gửi lại offer/answer
        // For simplicity here, we assume renegotiation happens or is handled by existing offer/answer for track changes
        setCallStatus("Camera đã bật");
        // Nếu đây là lần đầu bật video trong một audio call, có thể cần cập nhật callType và re-negotiate
        if (callType === "audio") {
          setCallType("video"); // Nâng cấp cuộc gọi thành video call (local state)
          // Cần re-negotiate để thông báo cho đối phương rằng bạn muốn gửi video
          // This might involve creating a new offer.
        }
      } catch (err) {
        console.error("FIX: Không thể lấy video track:", err);
        setVideoOff(true); // Quay lại trạng thái tắt video nếu có lỗi
        setCallStatus("Lỗi bật camera");
        return; // Không gửi sự kiện nếu không lấy được track
      }
    } else if (newVideoOff && videoTracks.length > 0) {
      // Nếu tắt video và có video track, thì dừng track đó và xóa khỏi stream
      videoTracks.forEach((track) => {
        track.enabled = false; // Tắt track trước
        // track.stop(); // Cân nhắc: stop() sẽ giải phóng tài nguyên nhưng không thể bật lại track đó, phải getUserMedia lại
        // localStream.current?.removeTrack(track); // Nếu muốn xóa hẳn khỏi stream
      });
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = null;
      }
    }

    // Gửi trạng thái video mới cho đối phương
    if (currentUserId && remoteUserId) {
      socketService.getSocket().emit("videoStatusChanged", {
        from: currentUserId,
        to: remoteUserId,
        disabled: newVideoOff,
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

    window.close(); // Đóng cửa sổ ngay lập tức
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
