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

      // Bên trong useEffect chính của CallModal.tsx, nơi bạn lắng nghe sự kiện socket
      socket.on("videoStatusChanged", ({ from, disabled }) => {
        if (from === remoteUserId) {
          console.log(
            `[MobileDebug] videoStatusChanged from socket: user ${from} video ${
              disabled ? "disabled" : "enabled"
            }`
          );
          setIsRemoteVideoOff(disabled); // Cập nhật trạng thái

          if (disabled && remoteVideoRef.current) {
            // Nếu đối phương chủ động tắt video qua signaling
            console.log(
              "[MobileDebug] videoStatusChanged: disabling remote video via socket. Pausing and clearing srcObject."
            );
            remoteVideoRef.current.pause(); // Dừng video
            remoteVideoRef.current.srcObject = null; // Xóa nguồn
            // remoteVideoRef.current.load(); // Cân nhắc thêm dòng này
          } else if (
            !disabled &&
            remoteVideoRef.current &&
            remoteVideoRef.current.srcObject
          ) {
            // Nếu đối phương bật video lại và stream vẫn còn gán cho srcObject
            // Có thể cần remoteVideoRef.current.play() ở đây nếu nó không tự chạy lại
          }
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

      // Bên trong hàm setupMediaStream, trong phần peerConnection.current.ontrack
      peerConnection.current.ontrack = (event) => {
        console.log(
          "Received remote track:",
          event.track.kind,
          "on device type:",
          /Mobi|Android/i.test(navigator.userAgent) ? "Mobile" : "PC"
        );
        if (event.streams && event.streams[0]) {
          const remoteStream = event.streams[0];
          if (event.track.kind === "audio" && remoteAudioRef.current) {
            remoteAudioRef.current.srcObject = remoteStream;
            remoteAudioRef.current
              .play()
              .catch((e) => console.error("Lỗi khi play remote audio:", e));
          }
          if (event.track.kind === "video" && remoteVideoRef.current) {
            console.log(
              `[MobileDebug] Assigning remote stream to remoteVideoRef. Video track state: ${event.track.readyState}, muted: ${event.track.muted}`
            );
            remoteVideoRef.current.srcObject = remoteStream;
            remoteVideoRef.current
              .play()
              .catch((e) => console.error("Lỗi khi play remote video:", e));
            // Ban đầu khi nhận track, giả định video đang bật (trừ khi track đã bị muted sẵn)
            setIsRemoteVideoOff(event.track.muted);

            event.track.onended = () => {
              console.log("[MobileDebug] Remote video track.onended fired.");
              setIsRemoteVideoOff(true);
              if (remoteVideoRef.current) {
                remoteVideoRef.current.pause(); // Quan trọng: Dừng video
                remoteVideoRef.current.srcObject = null; // Xóa nguồn
                // remoteVideoRef.current.load(); // Cân nhắc thêm dòng này nếu chỉ pause và srcObject=null không đủ để xóa frame cuối trên mobile
                console.log(
                  "[MobileDebug] Remote video srcObject set to null and paused after onended."
                );
              }
            };

            event.track.onmute = () => {
              // Khi track bị mute (ví dụ: đối phương tắt camera nhưng kết nối vẫn còn)
              console.log("[MobileDebug] Remote video track.onmute fired.");
              setIsRemoteVideoOff(true);
              if (remoteVideoRef.current) {
                remoteVideoRef.current.pause(); // Cũng nên pause ở đây
                // Không nhất thiết phải set srcObject = null nếu chỉ là mute,
                // isRemoteVideoOff sẽ đảm bảo UI ẩn video và hiện fallback.
                // Tuy nhiên, nếu muốn triệt để xóa frame, có thể làm tương tự onended.
                console.log(
                  "[MobileDebug] isRemoteVideoOff set to true and video paused due to onmute."
                );
              }
            };

            event.track.onunmute = () => {
              // Khi track được unmute
              console.log("[MobileDebug] Remote video track.onunmute fired.");
              setIsRemoteVideoOff(false);
              if (remoteVideoRef.current && remoteVideoRef.current.srcObject) {
                // Đảm bảo video được play lại nếu trình duyệt không tự động làm điều đó
                // remoteVideoRef.current.play().catch(e => console.warn("[MobileDebug] Failed to play on unmute", e));
              }
              console.log(
                "[MobileDebug] isRemoteVideoOff set to false due to onunmute."
              );
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
    if (
      !peerConnection.current ||
      !localStream.current ||
      !currentUserId ||
      !remoteUserId
    ) {
      console.warn(
        "Không thể bật/tắt video: PeerConnection, localStream hoặc UserID chưa sẵn sàng."
      );
      return;
    }

    const newVideoOff = !videoOff;
    // Cập nhật UI trước để phản hồi nhanh hơn
    setVideoOff(newVideoOff);

    console.log(
      `CONSOLE LOG (LOCAL): Người dùng ${currentUserId} (Bạn) đã ${
        newVideoOff ? "TẮT" : "BẬT"
      } camera.`
    );

    try {
      if (newVideoOff) {
        // Tắt video
        const videoTracks = localStream.current.getVideoTracks();
        videoTracks.forEach((track) => {
          track.stop();
          localStream.current?.removeTrack(track);
        });

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = null;
        }

        // Tìm video sender và xử lý (ví dụ: removeTrack hoặc replaceTrack(null) nếu muốn SDP update)
        // Hiện tại, việc stop track và remove khỏi localStream là đủ để ngừng gửi.
        // onnegotiationneeded có thể được kích hoạt nếu removeTrack(sender) được gọi.
        const videoSender = peerConnection.current
          .getSenders()
          .find((s) => s.track?.kind === "video");
        if (videoSender) {
          // peerConnection.current.removeTrack(videoSender); // Sẽ trigger onnegotiationneeded
          // Hoặc: await videoSender.replaceTrack(null); // Cũng trigger onnegotiationneeded
        }
      } else {
        // Bật video
        setCallStatus("Xin quyền truy cập camera...");
        const videoStream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 } },
        });
        const videoTrack = videoStream.getVideoTracks()[0];

        if (!videoTrack) {
          throw new Error("Không lấy được video track từ thiết bị.");
        }
        setCallStatus("Đang xử lý camera...");

        // Dừng và xóa các video track cũ khỏi localStream
        localStream.current.getVideoTracks().forEach((track) => {
          track.stop();
          localStream.current?.removeTrack(track);
        });
        // Thêm video track mới vào localStream
        localStream.current.addTrack(videoTrack);

        // Cập nhật local video preview
        if (localVideoRef.current) {
          // Tạo một MediaStream mới từ các track hiện có trong localStream.current
          // để đảm bảo React nhận diện sự thay đổi và cập nhật srcObject
          localVideoRef.current.srcObject = new MediaStream(
            localStream.current.getTracks()
          );
        }

        const videoSender = peerConnection.current
          .getSenders()
          .find((s) => s.track?.kind === "video");

        if (videoSender) {
          await videoSender.replaceTrack(videoTrack);
        } else {
          peerConnection.current.addTrack(videoTrack, localStream.current);
          // onnegotiationneeded sẽ được kích hoạt ở đây nếu đây là video track đầu tiên
        }
        if (callType === "audio") {
          // CẬP NHẬT callType
          setCallType("video");
        }
      }

      // Gửi trạng thái video mới cho đối phương
      socketService.getSocket().emit("videoStatusChanged", {
        from: currentUserId,
        to: remoteUserId,
        disabled: newVideoOff,
      });
      if (newVideoOff) setCallStatus("Camera đã tắt");
      else setCallStatus("Camera đang bật");
    } catch (err: unknown) {
      console.error("Lỗi khi xử lý video:", err);
      setVideoOff(true);
      if (localVideoRef.current) localVideoRef.current.srcObject = null;

      if (!newVideoOff && localStream.current) {
        // Nếu đang cố bật ON và thất bại
        localStream.current.getVideoTracks().forEach((t) => {
          t.stop();
          localStream.current?.removeTrack(t);
        });
      }

      setCallStatus(
        typeof err === "object" &&
          err !== null &&
          "message" in err &&
          typeof (err as { message?: string }).message === "string" &&
          (err as { message: string }).message.includes("Permission denied")
          ? "Bạn đã từ chối quyền truy cập camera."
          : "Lỗi khi xử lý camera"
      );

      // Thông báo cho đối phương rằng video của mình đã tắt (do lỗi)
      socketService.getSocket().emit("videoStatusChanged", {
        from: currentUserId,
        to: remoteUserId,
        disabled: true,
      });
      if (callType === "video" && newVideoOff) {
        // Nếu đang là video call mà tắt do lỗi
        // không cần đổi callType thành audio, chỉ là video đang tắt
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
