import { useState, useEffect, useRef } from "react";
import { socketService } from "@/server/socket";
import { createPeerConnection } from "@/server/messenger";
import CallModalUi from "@/app/ui/CallModalUi"; // Đảm bảo đường dẫn này chính xác
import { CreatePeerConnectionReturn } from "@/types/messenger.types"; // Đảm bảo đường dẫn này chính xác
import { getUser } from "@/server/user"; // Đảm bảo đường dẫn này chính xác

export interface CallModalProps {
  handleEndCall: () => void;
}

export default function CallModal({ handleEndCall }: CallModalProps) {
  const [micMuted, setMicMuted] = useState(false);
  const [videoOff, setVideoOff] = useState(false); // Trạng thái camera thực tế CỦA BẠN
  const [callerInfo, setCallerInfo] = useState({
    username: "Đang tải...",
    profilePicture: "/api/placeholder/96/96",
  });
  const [callStatus, setCallStatus] = useState("Đang khởi tạo...");
  const [isConnected, setIsConnected] = useState(false);

  // callType có thể thay đổi từ 'audio' sang 'video'
  const [callType, setCallType] = useState<"audio" | "video" | null>(null);
  const [isRemoteVideoOff, setIsRemoteVideoOff] = useState(true); // Trạng thái camera của ĐỐI PHƯƠNG

  const localStream = useRef<MediaStream | null>(null);
  const peerConnection = useRef<RTCPeerConnection | null>(null);

  const remoteAudioRef = useRef<HTMLAudioElement>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  const isOfferCreated = useRef<boolean>(false); // Dùng để theo dõi việc tạo offer ban đầu
  const hasRemoteDescription = useRef<boolean>(false);
  const pendingCandidates = useRef<RTCIceCandidate[]>([]);

  const urlParams = new URLSearchParams(window.location.search);
  const currentUserId = urlParams.get("userId");
  const remoteUserId = urlParams.get("calleeId");
  // initialCallTypeFromUrl là cố định, dùng cho thiết lập ban đầu. callType state thì động.
  const initialCallTypeFromUrl = urlParams.get("callType") as
    | "audio"
    | "video"
    | null;
  const role =
    urlParams.get("role") || (initialCallTypeFromUrl ? "caller" : "receiver");

  useEffect(() => {
    // Thiết lập trạng thái callType và videoOff ban đầu dựa trên URL
    setCallType(initialCallTypeFromUrl);
    setVideoOff(initialCallTypeFromUrl === "audio"); // Camera tắt nếu là cuộc gọi thoại ban đầu

    let socket = socketService.getSocket();
    if (!socket || !socket.connected) {
      socket = socketService.initSocket();
    }

    const performCallSetup = () => {
      if (!currentUserId || !remoteUserId || !initialCallTypeFromUrl) {
        setCallStatus("Lỗi: Thiếu thông tin cuộc gọi.");
        console.error("FIX: Missing call info in URL params", {
          currentUserId,
          remoteUserId,
          initialCallType: initialCallTypeFromUrl,
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
      } else {
        // Nếu socket chưa kết nối ngay, đăng ký user sau khi kết nối
        socket.once("connect", () => {
          if (currentUserId) socketService.registerUser(currentUserId);
        });
      }

      // Sử dụng initialCallTypeFromUrl cho thiết lập luồng media ban đầu
      setupMediaStream(initialCallTypeFromUrl, currentUserId, remoteUserId);

      window.onbeforeunload = () => {
        if (currentUserId && remoteUserId) {
          socket.emit("endCall", {
            callerId: role === "caller" ? currentUserId : remoteUserId, // Điều chỉnh callerId/calleeId cho chính xác
            calleeId: role === "caller" ? remoteUserId : currentUserId,
            endedBy: currentUserId,
          });
        }
        cleanupResources();
        handleEndCall(); // Gọi hàm này từ props nếu có
      };

      socket.on("callConnected", () => {
        setIsConnected(true);
        setCallStatus("Đã kết nối");
      });

      socket.on("callEnded", (data: { endedBy: string }) => {
        setCallStatus(
          `Cuộc gọi đã kết thúc bởi ${
            data.endedBy === currentUserId ? "bạn" : callerInfo.username
          }`
        );
        cleanupResources();
        setTimeout(() => {
          // handleEndCall(); // Gọi từ props nếu cần đóng modal mẹ
          window.close(); // Đóng cửa sổ call
        }, 2000);
      });

      socket.on(
        "videoStatusChanged",
        ({ from, disabled, newCallType: remoteUserNewCallType }) => {
          if (from === remoteUserId) {
            setIsRemoteVideoOff(disabled);
            // Nếu đối phương nâng cấp cuộc gọi lên video, cập nhật callType cục bộ nếu đang là audio
            if (remoteUserNewCallType === "video" && callType === "audio") {
              setCallType("video");
              setCallStatus(
                "Đối phương đã bật video. Chuyển sang cuộc gọi video."
              );
              // Offer/track đến sẽ xử lý phần còn lại
            }
            console.log(
              `CONSOLE LOG (REMOTE): Người dùng ${from} (${
                callerInfo.username
              }) đã ${
                disabled ? "TẮT" : "BẬT"
              } camera. Loại cuộc gọi mới từ đối phương: ${remoteUserNewCallType}`
            );
          }
        }
      );

      socket.on("micStatusChanged", ({ from, muted }) => {
        if (from === remoteUserId) {
          console.log(
            `CONSOLE LOG (REMOTE): Người dùng ${from} (${
              callerInfo.username
            }) đã ${muted ? "TẮT" : "BẬT"} mic.`
          );
          // Tùy chọn: hiển thị trạng thái mic của đối phương trong UI
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
        setIsConnected(false); // Cập nhật trạng thái kết nối
        // Có thể thử kết nối lại hoặc thông báo lỗi nghiêm trọng hơn
      });
    }

    return () => {
      cleanupResources();
      window.onbeforeunload = null; // Gỡ bỏ trình xử lý sự kiện
      // Gỡ bỏ tất cả các listeners của socket một cách cẩn thận
      socket.off("callConnected");
      socket.off("callEnded");
      socket.off("videoStatusChanged");
      socket.off("micStatusChanged");
      socket.off("webrtc-offer");
      socket.off("webrtc-answer");
      socket.off("webrtc-ice-candidate");
      // Gỡ các listeners khác của WebRTC nếu cần thiết trong cleanupResources
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUserId, remoteUserId, initialCallTypeFromUrl, role]); // role có thể quan trọng

  const cleanupResources = () => {
    console.log("Cleaning up resources...");
    const socket = socketService.getSocket();
    if (socket) {
      // Gỡ listeners ở đây nếu chưa làm trong useEffect cleanup
      socket.off("webrtc-offer");
      socket.off("webrtc-answer");
      socket.off("webrtc-ice-candidate");
    }

    if (localStream.current) {
      localStream.current.getTracks().forEach((track) => track.stop());
      localStream.current = null;
    }
    if (peerConnection.current) {
      // Quan trọng: gỡ bỏ các handler để tránh memory leak hoặc gọi không mong muốn
      peerConnection.current.onnegotiationneeded = null;
      peerConnection.current.onicecandidate = null;
      peerConnection.current.oniceconnectionstatechange = null;
      peerConnection.current.ontrack = null;

      peerConnection.current.getSenders().forEach((sender) => {
        if (sender.track) {
          sender.track.stop();
        }
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
    // setCallStatus("Đã kết thúc"); // Trạng thái này sẽ được set bởi 'callEnded' event
  };

  const processPendingCandidates = async () => {
    if (
      !peerConnection.current ||
      !hasRemoteDescription.current || // Chỉ thêm candidate khi đã có remote description
      peerConnection.current.signalingState === "closed" ||
      pendingCandidates.current.length === 0
    ) {
      return;
    }
    console.log(
      `Processing ${pendingCandidates.current.length} pending candidates.`
    );
    for (const candidate of pendingCandidates.current) {
      try {
        if (
          peerConnection.current &&
          peerConnection.current.connectionState !== "closed" &&
          peerConnection.current.remoteDescription
        ) {
          await peerConnection.current.addIceCandidate(candidate);
        }
      } catch (err) {
        console.error("Lỗi khi áp dụng ICE candidate đang đợi:", err);
      }
    }
    pendingCandidates.current = [];
  };

  const setupMediaStream = async (
    type: "audio" | "video", // Đây là loại cuộc gọi *ban đầu*
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

      if (type === "video" && !videoOff) {
        // videoOff được set ban đầu dựa trên initialCallType
        setCallStatus("Xin quyền truy cập camera...");
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
              (videoError as Error).name,
              (videoError as Error).message
            );
          } else {
            console.warn("Không thể truy cập camera:", videoError);
          }
          setVideoOff(true); // Nếu lỗi, coi như camera tắt
          setCallStatus("Không thể truy cập camera, tiếp tục với âm thanh.");
          // Nếu ban đầu là video call nhưng camera lỗi, callType vẫn là "video" nhưng videoOff là true
        }
      }

      localStream.current = tempStream;

      if (localStream.current.getAudioTracks().length === 0) {
        throw new Error("Không thể lấy được luồng âm thanh.");
      }

      if (localVideoRef.current) {
        if (
          type === "video" &&
          !videoOff &&
          localStream.current.getVideoTracks().length > 0
        ) {
          localVideoRef.current.srcObject = localStream.current;
        } else {
          localVideoRef.current.srcObject = null;
        }
      }

      setCallStatus("Đang thiết lập kết nối...");

      // --- Khởi tạo PeerConnection ---
      const peerConfigResult: CreatePeerConnectionReturn =
        await createPeerConnection();
      // ... (logic xử lý peerConfigResult để tạo peerConnection.current như cũ)
      // Ví dụ đơn giản hóa:
      if (peerConfigResult && "iceServers" in peerConfigResult) {
        peerConnection.current = new RTCPeerConnection({
          iceServers: (peerConfigResult as { iceServers: RTCIceServer[] })
            .iceServers,
        });
      } else if (peerConfigResult && "peer" in peerConfigResult) {
        peerConnection.current = (
          peerConfigResult as { peer: RTCPeerConnection }
        ).peer;
      } else {
        console.warn(
          "Cấu hình peer từ API không đúng định dạng hoặc null. Sử dụng fallback STUN."
        );
        peerConnection.current = new RTCPeerConnection({
          iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
        });
      }
      // --- Hết phần khởi tạo PeerConnection ---

      if (!peerConnection.current) {
        throw new Error("Không thể khởi tạo PeerConnection.");
      }

      localStream.current?.getTracks().forEach((track) => {
        peerConnection.current?.addTrack(track, localStream.current!);
      });

      // Thiết lập onnegotiationneeded
      peerConnection.current.onnegotiationneeded = async () => {
        if (
          !peerConnection.current ||
          peerConnection.current.signalingState !== "stable"
        ) {
          console.log(
            "onnegotiationneeded: Trạng thái không ổn định hoặc PC null.",
            peerConnection.current?.signalingState
          );
          return;
        }
        // Chỉ caller mới nên tự động tạo offer khi 'negotiationneeded' trừ khi có logic cụ thể
        // isOfferCreated.current giúp tránh việc receiver gửi offer không cần thiết.
        // Hoặc khi một offer đang được tạo.
        if (role !== "caller" && isOfferCreated.current) {
          // Nếu là receiver và offer ban đầu đã được xử lý
          console.log(
            "onnegotiationneeded: Receiver, không tự tạo offer lúc này."
          );
          return;
        }
        // Kiểm tra isOfferCreated để tránh tạo offer chồng chéo nếu đang trong quá trình tạo offer ban đầu.
        // Nếu là caller, hoặc nếu là receiver nhưng đang chủ động thay đổi (vd: bật video từ audio call)
        if (
          role === "caller" ||
          (callType === "video" && !videoOff && !isOfferCreated.current)
        ) {
          console.log("onnegotiationneeded: Đang tạo offer...");
          try {
            setCallStatus("Đang cập nhật cài đặt cuộc gọi...");
            const offerOptions: RTCOfferOptions = {
              offerToReceiveAudio: true,
              offerToReceiveVideo: callType === "video", // Phản ánh callType động hiện tại
            };
            const offer = await peerConnection.current.createOffer(
              offerOptions
            );
            await peerConnection.current.setLocalDescription(offer);

            socketService.getSocket().emit("webrtc-offer", {
              to: targetUserId,
              from: userId,
              offer,
              currentCallType: callType, // Gửi callType hiện tại kèm offer
            });
            isOfferCreated.current = true; // Đánh dấu đã tạo offer (ít nhất 1 lần)
            setCallStatus(
              callType === "video"
                ? "Đang cập nhật cuộc gọi video..."
                : "Đang cập nhật cuộc gọi thoại..."
            );
          } catch (err) {
            console.error(
              "Lỗi khi tự động tạo offer (onnegotiationneeded):",
              err
            );
            setCallStatus("Lỗi cập nhật cuộc gọi");
          }
        }
      };

      peerConnection.current.onicecandidate = (event) => {
        /* ... như cũ ... */
        if (event.candidate) {
          socketService.getSocket().emit("webrtc-ice-candidate", {
            to: targetUserId,
            from: userId,
            candidate: event.candidate,
          });
        }
      };
      peerConnection.current.oniceconnectionstatechange = () => {
        /* ... như cũ, có thể thêm log chi tiết hơn ... */
        const pc = peerConnection.current;
        if (!pc) return;
        console.log("ICE Connection State Change:", pc.iceConnectionState);
        switch (pc.iceConnectionState) {
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
            // Có thể thử restart ICE hoặc đóng cuộc gọi
            break;
          case "disconnected":
            setCallStatus("Mất kết nối (đang thử lại...)");
            setIsConnected(false);
            break;
          case "closed":
            setIsConnected(false);
            // cleanupResources(); // Đã được gọi ở nơi khác khi callEnded
            break;
          default:
            if (!isConnected)
              setCallStatus(`Đang kết nối... (${pc.iceConnectionState})`);
        }
      };
      peerConnection.current.ontrack = (event) => {
        /* ... như cũ ... */
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

            // Theo dõi khi track video của đối phương kết thúc
            event.track.onended = () => {
              console.log("Remote video track ended.");
              setIsRemoteVideoOff(true);
              if (remoteVideoRef.current)
                remoteVideoRef.current.srcObject = null;
            };
          }
        } else {
          // Fallback nếu không có streams[0] (ít gặp)
          if (event.track.kind === "audio" && remoteAudioRef.current) {
            const newStream = new MediaStream();
            newStream.addTrack(event.track);
            remoteAudioRef.current.srcObject = newStream;
            remoteAudioRef.current
              .play()
              .catch((e) =>
                console.error("Lỗi khi play remote audio (fallback):", e)
              );
          }
          if (event.track.kind === "video" && remoteVideoRef.current) {
            const newStream = new MediaStream();
            newStream.addTrack(event.track);
            remoteVideoRef.current.srcObject = newStream;
            remoteVideoRef.current
              .play()
              .catch((e) =>
                console.error("Lỗi khi play remote video (fallback):", e)
              );
            setIsRemoteVideoOff(false);
            event.track.onended = () => {
              /* ... */
            };
          }
        }
      };

      const socket = socketService.getSocket();
      socket.on(
        "webrtc-offer",
        async ({ from, offer, currentCallType: offererCallType }) => {
          if (
            !peerConnection.current ||
            from === userId ||
            peerConnection.current.signalingState === "closed"
          )
            return;
          console.log(
            "Received webrtc-offer from",
            from,
            "currentCallType:",
            offererCallType
          );
          try {
            // Nếu đối phương gửi offer với currentCallType là video và local đang là audio, cập nhật local
            if (offererCallType === "video" && callType === "audio") {
              setCallType("video");
            }
            await peerConnection.current.setRemoteDescription(
              new RTCSessionDescription(offer)
            );
            hasRemoteDescription.current = true;
            await processPendingCandidates(); // Xử lý các ICE candidates chờ
            const answer = await peerConnection.current.createAnswer();
            await peerConnection.current.setLocalDescription(answer);
            socket.emit("webrtc-answer", { to: from, from: userId, answer });
          } catch (err) {
            console.error("Lỗi khi xử lý offer:", err);
          }
        }
      );

      socket.on("webrtc-answer", async ({ answer, from }) => {
        if (
          !peerConnection.current ||
          from === userId ||
          peerConnection.current.signalingState === "closed"
        )
          return;
        console.log("Received webrtc-answer from", from);
        try {
          await peerConnection.current.setRemoteDescription(
            new RTCSessionDescription(answer)
          );
          hasRemoteDescription.current = true;
          await processPendingCandidates();
        } catch (err) {
          console.error("Lỗi khi xử lý answer:", err);
        }
      });

      socket.on("webrtc-ice-candidate", async ({ candidate, from }) => {
        if (
          !peerConnection.current ||
          !candidate ||
          from === userId ||
          peerConnection.current.signalingState === "closed"
        )
          return;
        try {
          if (!peerConnection.current.remoteDescription) {
            // Nếu chưa có remote description, đưa vào hàng đợi
            console.log(
              "Queuing ICE candidate because remote description is not set yet."
            );
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
            offerToReceiveVideo: type === "video", // Loại ban đầu
          };
          const offer = await peerConnection.current.createOffer(offerOptions);
          await peerConnection.current.setLocalDescription(offer);
          isOfferCreated.current = true;
          socket.emit("webrtc-offer", {
            to: targetUserId,
            from: userId,
            offer,
            currentCallType: type,
          });
          setCallStatus(
            type === "video" ? "Đang gọi video..." : "Đang gọi thoại..."
          );
        } catch (err) {
          console.error("Lỗi khi tạo offer ban đầu:", err);
          setCallStatus("Lỗi khi tạo lời mời");
        }
      } else if (role !== "caller") {
        setCallStatus("Đang chờ lời mời...");
      }
    } catch (error: unknown) {
      let errorMessage = "Lỗi thiết lập cuộc gọi.";
      if (error instanceof Error) {
        console.error(
          "Lỗi nghiêm trọng khi thiết lập luồng media hoặc PeerConnection:",
          error.message,
          error
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
      cleanupResources(); // Dọn dẹp nếu có lỗi lớn
    }
  };

  const fetchUserInfo = async (userIdToFetch: string) => {
    if (!userIdToFetch) return null;
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
        username: "Người dùng ẩn",
        profilePicture: "/api/placeholder/96/96",
      };
    } catch (error) {
      console.error("Lỗi khi fetch thông tin người dùng:", error);
      return {
        username: "Lỗi tải thông tin",
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
    if (
      !peerConnection.current ||
      !localStream.current ||
      !currentUserId ||
      !remoteUserId
    ) {
      console.warn(
        "Không thể bật/tắt video: PeerConnection hoặc localStream chưa sẵn sàng."
      );
      return;
    }

    const newVideoOffState = !videoOff; // Trạng thái video mong muốn

    console.log(
      `CONSOLE LOG (LOCAL): Người dùng ${currentUserId} (Bạn) ${
        newVideoOffState ? "TẮT" : "BẬT"
      } camera.`
    );

    try {
      if (callType === "audio" && !newVideoOffState) {
        // ===== NÂNG CẤP TỪ AUDIO LÊN VIDEO =====
        setCallStatus("Đang bật camera và chuyển sang cuộc gọi video...");

        const videoStream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 } },
        });
        const videoTrack = videoStream.getVideoTracks()[0];
        if (!videoTrack) throw new Error("Không lấy được video track.");

        localStream.current.addTrack(videoTrack); // Thêm video track vào stream hiện tại

        setCallType("video"); // Cập nhật loại cuộc gọi
        setVideoOff(false); // Cập nhật trạng thái video off

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = localStream.current; // Hiển thị video cục bộ
        }

        peerConnection.current.addTrack(videoTrack, localStream.current);
        // onnegotiationneeded sẽ được kích hoạt để tạo và gửi offer mới
        // Nếu onnegotiationneeded không đủ mạnh mẽ, có thể cần kích hoạt tạo offer thủ công tại đây:
        if (peerConnection.current.signalingState === "stable") {
          console.log("Kích hoạt offer thủ công sau khi nâng cấp lên video.");
          const offerOptions: RTCOfferOptions = {
            offerToReceiveAudio: true,
            offerToReceiveVideo: true,
          };
          const offer = await peerConnection.current.createOffer(offerOptions);
          await peerConnection.current.setLocalDescription(offer);
          socketService.getSocket().emit("webrtc-offer", {
            to: remoteUserId,
            from: currentUserId,
            offer,
            currentCallType: "video",
          });
          isOfferCreated.current = true;
        }
        setCallStatus(isConnected ? "Đã kết nối (Video)" : "Đang gọi video...");
      } else if (callType === "video") {
        // ===== BẬT/TẮT VIDEO TRONG CUỘC GỌI VIDEO HIỆN TẠI =====
        setVideoOff(newVideoOffState);

        if (newVideoOffState) {
          // Tắt video
          const videoTracks = localStream.current.getVideoTracks();
          videoTracks.forEach((track) => {
            track.stop();
            localStream.current?.removeTrack(track); // Gỡ track khỏi stream
          });
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = null;
          }
          const videoSender = peerConnection.current
            .getSenders()
            .find((s) => s.track?.kind === "video");
          if (videoSender && videoSender.track) {
            videoSender.track.stop(); // Dừng track đang gửi
            await videoSender.replaceTrack(null); // Ngừng gửi video nhưng giữ transceiver
            // Thông thường replaceTrack(null) không yêu cầu offer mới ngay,
            // nhưng nếu cần cập nhật SDP để báo m-line inactive thì onnegotiationneeded nên xử lý.
          }
        } else {
          // Bật video (đã tắt trước đó trong video call)
          const videoStream = await navigator.mediaDevices.getUserMedia({
            video: { width: { ideal: 1280 }, height: { ideal: 720 } },
          });
          const videoTrack = videoStream.getVideoTracks()[0];
          if (!videoTrack) throw new Error("Không lấy được video track.");

          // Đảm bảo không có video track cũ nào còn sót lại trong stream
          localStream.current.getVideoTracks().forEach((t) => {
            t.stop();
            localStream.current?.removeTrack(t);
          });
          localStream.current.addTrack(videoTrack);

          if (localVideoRef.current) {
            localVideoRef.current.srcObject = localStream.current;
          }

          const videoSender = peerConnection.current
            .getSenders()
            .find((s) => s.track?.kind === "video");
          if (videoSender) {
            await videoSender.replaceTrack(videoTrack);
          } else {
            // Trường hợp này (không có video sender trong video call) hiếm nếu xử lý đúng
            peerConnection.current.addTrack(videoTrack, localStream.current);
          }
        }
      }

      // Thông báo cho đối phương về thay đổi trạng thái video
      socketService.getSocket().emit("videoStatusChanged", {
        from: currentUserId,
        to: remoteUserId,
        disabled: newVideoOffState, // Gửi trạng thái mong muốn mới
        newCallType:
          callType === "audio" && !newVideoOffState ? "video" : callType, // Gửi loại cuộc gọi đã cập nhật
      });
    } catch (err: unknown) {
      if (err instanceof Error) {
        console.error("Lỗi khi xử lý video:", err.message, err);
      } else {
        console.error("Lỗi khi xử lý video:", err);
      }
      // Hoàn tác trạng thái UI nếu có lỗi
      if (callType === "video" && newVideoOffState === false) {
        setVideoOff(true);
      } else if (callType === "audio" && !newVideoOffState) {
        setCallType("audio");
        setVideoOff(true);
      }
      setCallStatus("Lỗi khi xử lý camera");
    }
  };

  const handleEndCallLocal = () => {
    if (currentUserId && remoteUserId) {
      socketService.getSocket().emit("endCall", {
        callerId: role === "caller" ? currentUserId : remoteUserId,
        calleeId: role === "caller" ? remoteUserId : currentUserId,
        endedBy: currentUserId,
      });
    }
    cleanupResources();
    handleEndCall(); // Gọi hàm từ props
    window.close(); // Đóng cửa sổ cuộc gọi
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
