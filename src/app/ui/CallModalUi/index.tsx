// components/CallModal/CallModalUi.tsx (Cập nhật)
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
import { MutableRefObject, useEffect, useState } from "react";
import styles from "./CallModalUi.module.scss";

type CallModalUiProps = {
  callerInfo: {
    profilePicture: string;
    username: string;
  };
  handleEndCallLocal: () => void;
  micMuted: boolean;
  handleToggleVideo: () => void;
  handleToggleMic: () => void;
  callStatus: string;
  videoOff: boolean; // True nếu camera của bạn đang tắt
  remoteAudioRef: MutableRefObject<HTMLAudioElement | null>;
  localVideoRef: MutableRefObject<HTMLVideoElement | null>; // Ref cho video của bạn
  remoteVideoRef: MutableRefObject<HTMLVideoElement | null>; // Ref cho video của đối phương
  callType: "audio" | "video" | null;
  isRemoteVideoOff: boolean;
};

export default function CallModalUi({
  callerInfo,
  handleEndCallLocal,
  micMuted,
  handleToggleVideo,
  handleToggleMic,
  callStatus,
  videoOff,
  remoteAudioRef,
  localVideoRef,
  remoteVideoRef,
  callType,
  isRemoteVideoOff,
}: CallModalUiProps) {
  const [hasRemoteVideo, setHasRemoteVideo] = useState(false);

  // Thêm vào trước return
  useEffect(() => {
    // Nếu là cuộc gọi audio, mặc định sẽ tắt camera khi bắt đầu
    if (callType === "audio") {
      // Chỉ thực hiện khi component mount hoặc callType thay đổi từ null/video sang audio
      handleToggleVideo();
    }
  }, [callType]);

  // Trong useEffect kiểm tra remote video
  useEffect(() => {
    const checkRemoteVideo = () => {
      if (remoteVideoRef.current && remoteVideoRef.current.srcObject) {
        const videoTracks = (
          remoteVideoRef.current.srcObject as MediaStream
        ).getVideoTracks();
        setHasRemoteVideo(videoTracks.length > 0 && !isRemoteVideoOff);
      } else {
        setHasRemoteVideo(false);
      }
    };

    // Kiểm tra khi component được mount và khi isRemoteVideoOff thay đổi
    checkRemoteVideo();

    // Thêm event listener để theo dõi khi có video track mới
    const onTrackAdded = () => checkRemoteVideo();

    const remoteVideoEl = remoteVideoRef.current;
    if (remoteVideoEl) {
      remoteVideoEl.addEventListener("loadedmetadata", onTrackAdded);
    }

    return () => {
      if (remoteVideoEl) {
        remoteVideoEl.removeEventListener("loadedmetadata", onTrackAdded);
      }
    };
  }, [isRemoteVideoOff, remoteVideoRef]);

  return (
    <div className="w-full h-full bg-zinc-900 rounded-lg overflow-hidden flex flex-col relative">
      {/* Top bar */}
      <div className="absolute top-0 right-0 flex items-center gap-2 p-4 z-20">
        {/* Các nút điều khiển cửa sổ giữ nguyên */}
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
          onClick={handleEndCallLocal}
        >
          <X size={20} />
        </button>
      </div>

      {/* Main content - video area / user info area */}
      <div className="flex-1 flex items-center justify-center bg-zinc-800 relative overflow-hidden">
        {/* Remote Video Display */}
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className={`w-full ${styles.remoteVideo} ${
            hasRemoteVideo && !isRemoteVideoOff ? "block" : "hidden"
          }`}
          style={{ maxWidth: "100%", height: "80dvh" }}
        />

        {/* Fallback: User Info when no remote video */}
        <div
          className={`absolute flex flex-col items-center text-white text-center p-4 ${
            hasRemoteVideo && !isRemoteVideoOff ? "hidden" : "block"
          }`}
        >
          <div className="h-24 w-24 md:h-32 md:w-32 rounded-full overflow-hidden mb-3 relative">
            <Image
              src={callerInfo.profilePicture}
              alt={callerInfo.username || "Profile"}
              className="w-full h-full object-cover"
              layout="fill"
            />
          </div>
          <h2 className="text-xl md:text-2xl font-semibold">
            {callerInfo.username}
          </h2>
          <p className="text-gray-300 text-sm mt-1">{callStatus}</p>
          {micMuted && (
            <div className="mt-2 bg-red-500 text-white px-3 py-1 rounded-full text-xs">
              Mic của bạn đã tắt
            </div>
          )}
          {callType === "video" &&
            isRemoteVideoOff &&
            callStatus === "Đã kết nối" && (
              <p className="text-gray-400 text-xs mt-1">
                Đối phương đang tắt camera
              </p>
            )}
        </div>

        {/* Local video (camera của bạn) */}
        <div
          className={`absolute bottom-20 right-4 md:bottom-24 md:right-6 w-32 h-48 md:w-40 md:h-56 bg-black rounded-md overflow-hidden shadow-lg z-10 border-2 border-zinc-700 ${
            !videoOff ? "block" : "hidden"
          }`}
        >
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
        </div>

        {/* Fallback khi bạn tắt camera */}
        <div
          className={`absolute bottom-20 right-4 md:bottom-24 md:right-6 w-32 h-48 md:w-40 md:h-56 bg-zinc-800 rounded-md overflow-hidden shadow-lg z-10 border-2 border-zinc-700 flex items-center justify-center ${
            videoOff && !videoOff ? "block" : "hidden"
          }`}
        >
          <div className="text-white text-center">
            <VideoOff size={24} className="mx-auto mb-2" />
            <p className="text-xs">Camera tắt</p>
          </div>
        </div>
      </div>

      {/* Audio element để nghe đối phương */}
      <audio ref={remoteAudioRef} autoPlay />

      {/* Bottom controls */}
      <div className="bg-zinc-900 p-4 flex flex-col items-center gap-4 z-10">
        {/* Trạng thái thiết bị */}
        <div className="text-white text-xs mb-2">
          {callType === "video" && videoOff && (
            <span className="mr-2">(Camera của bạn đang tắt)</span>
          )}
          Micrô {micMuted ? "đã tắt" : "đang bật"}
        </div>

        {/* Call controls */}
        <div className="flex gap-3 sm:gap-4 items-center">
          <button
            className={`p-3 rounded-full ${
              micMuted
                ? "bg-red-600 hover:bg-red-700"
                : "bg-zinc-700 hover:bg-zinc-600"
            } text-white`}
            onClick={handleToggleMic}
            title={micMuted ? "Bật mic" : "Tắt mic"}
          >
            {micMuted ? <MicOff size={24} /> : <Mic size={24} />}
          </button>

          {/* Nút bật/tắt video */}
          <button
            className={`p-3 rounded-full ${
              videoOff
                ? "bg-red-600 hover:bg-red-700"
                : "bg-zinc-700 hover:bg-zinc-600"
            } text-white`}
            onClick={handleToggleVideo}
            title={videoOff ? "Bật camera" : "Tắt camera"}
          >
            {videoOff ? <VideoOff size={24} /> : <Video size={24} />}
          </button>

          <button
            className="p-3 rounded-full bg-zinc-700 hover:bg-zinc-600 text-white"
            title="Thêm người"
          >
            <UserPlus size={24} />
          </button>

          <button
            className="p-3 rounded-full bg-red-500 hover:bg-red-600 text-white"
            onClick={handleEndCallLocal}
            title="Kết thúc cuộc gọi"
          >
            <Phone size={24} style={{ transform: "rotate(135deg)" }} />
          </button>
        </div>
      </div>
    </div>
  );
}
