// components/CallModal/CallModalUi.tsx (Updated)
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
  handleToggleVideo: () => void; // This function will now also handle upgrading call type
  handleToggleMic: () => void;
  callStatus: string;
  videoOff: boolean; // True nếu camera của bạn đang tắt
  remoteAudioRef: MutableRefObject<HTMLAudioElement | null>;
  localVideoRef: MutableRefObject<HTMLVideoElement | null>; // Ref cho video của bạn
  remoteVideoRef: MutableRefObject<HTMLVideoElement | null>; // Ref cho video của đối phương
  callType: "audio" | "video" | null; // Loại cuộc gọi để quyết định layout
  isRemoteVideoOff: boolean; // True nếu đối phương tắt video hoặc chưa có video
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

  useEffect(() => {
    const checkRemoteVideo = () => {
      if (remoteVideoRef.current && remoteVideoRef.current.srcObject) {
        const mediaStream = remoteVideoRef.current.srcObject as MediaStream;
        // Ensure mediaStream is active and has video tracks
        if (mediaStream.active && mediaStream.getVideoTracks().length > 0) {
          const videoTracks = mediaStream.getVideoTracks();
          setHasRemoteVideo(
            videoTracks.some(
              (track) => track.readyState === "live" && !track.muted
            ) && !isRemoteVideoOff
          );
        } else {
          setHasRemoteVideo(false);
        }
      } else {
        setHasRemoteVideo(false);
      }
    };

    checkRemoteVideo();

    const onTrackOrStreamChange = () => checkRemoteVideo();
    const videoEl = remoteVideoRef.current;

    if (videoEl) {
      videoEl.addEventListener("loadedmetadata", onTrackOrStreamChange);
      videoEl.addEventListener("emptied", onTrackOrStreamChange); // Handles srcObject set to null
      if (videoEl.srcObject) {
        (videoEl.srcObject as MediaStream).addEventListener(
          "addtrack",
          onTrackOrStreamChange
        );
        (videoEl.srcObject as MediaStream).addEventListener(
          "removetrack",
          onTrackOrStreamChange
        );
      }
    }
    // Also re-check if isRemoteVideoOff changes from props
    // This effect dependency array includes isRemoteVideoOff and the ref itself (though ref changes are rare)
  }, [isRemoteVideoOff, remoteVideoRef, remoteVideoRef.current?.srcObject]);

  return (
    <div className="w-full h-full bg-zinc-900 rounded-lg overflow-hidden flex flex-col relative">
      {/* Top bar */}
      <div className="absolute top-0 right-0 flex items-center gap-2 p-4 z-20">
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
        {/* Remote Video Display - Only if callType is 'video' and remote has video */}
        {callType === "video" && (
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className={`w-full ${styles.remoteVideo} ${
              hasRemoteVideo && !isRemoteVideoOff ? "block" : "hidden"
            }`}
            style={{ maxWidth: "100%", height: "80dvh", objectFit: "contain" }}
          />
        )}

        {/* Fallback: User Info or Remote Video Off Message */}
        <div
          className={`absolute inset-0 flex flex-col items-center justify-center text-white text-center p-4 ${
            callType === "video" && hasRemoteVideo && !isRemoteVideoOff
              ? "hidden" // Hide if remote video is showing
              : "bg-black flex" // Show this fallback area
          }`}
        >
          {/* Display user info if it's an audio call OR if it's a video call but remote video is off/not available */}
          {(callType === "audio" ||
            (callType === "video" && (isRemoteVideoOff || !hasRemoteVideo))) &&
            callStatus !== "Đã kết nối" && ( // Show avatar and name when not yet fully connected or if audio call
              <>
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
              </>
            )}

          {/* Message when connected in a video call and remote has turned off camera */}
          {callType === "video" &&
            (isRemoteVideoOff || !hasRemoteVideo) &&
            callStatus === "Đã kết nối" && (
              <p className="text-gray-400 text-sm">
                {callerInfo.username} đang tắt camera
              </p>
            )}

          {/* Message for an audio call when connected */}
          {callType === "audio" && callStatus === "Đã kết nối" && (
            <p className="text-gray-400 text-sm">
              Cuộc gọi thoại với {callerInfo.username}
            </p>
          )}

          {micMuted && (
            <div className="mt-2 bg-red-500 text-white px-3 py-1 rounded-full text-xs">
              Mic của bạn đã tắt
            </div>
          )}
        </div>

        {/* Local video (camera của bạn) - ONLY if callType is 'video' */}
        {callType === "video" && !videoOff && (
          <div
            className={`absolute bottom-20 right-4 md:bottom-24 md:right-6 w-32 h-48 md:w-40 md:h-56 bg-black rounded-md overflow-hidden shadow-lg z-10 border-2 border-zinc-700 block`}
          >
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Fallback khi bạn tắt camera (trong cuộc gọi video) */}
        {callType === "video" && videoOff && (
          <div
            className={`absolute bottom-20 right-4 md:bottom-24 md:right-6 w-32 h-48 md:w-40 md:h-56 bg-zinc-800 rounded-md overflow-hidden shadow-lg z-10 border-2 border-zinc-700 flex items-center justify-center`}
          >
            <div className="text-white text-center">
              <VideoOff size={24} className="mx-auto mb-2" />
              <p className="text-xs">Camera tắt</p>
            </div>
          </div>
        )}
      </div>

      {/* Audio element để nghe đối phương */}
      <audio ref={remoteAudioRef} autoPlay />

      {/* Bottom controls */}
      <div className="bg-zinc-900 p-4 flex flex-col items-center gap-4 z-10">
        <div className="text-white text-xs mb-2">
          {callType === "video" && videoOff && (
            <span className="mr-2">(Camera của bạn đang tắt)</span>
          )}
          Micrô {micMuted ? "đã tắt" : "đang bật"}
        </div>

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

          {/* Nút bật/tắt video - Sẽ luôn hiển thị, chức năng được xử lý trong handleToggleVideo */}
          <button
            className={`p-3 rounded-full ${
              videoOff // videoOff state now correctly reflects if the camera is intended to be on or off
                ? "bg-red-600 hover:bg-red-700" // Camera is off or call is audio
                : "bg-zinc-700 hover:bg-zinc-600" // Camera is on (only possible in video call)
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
