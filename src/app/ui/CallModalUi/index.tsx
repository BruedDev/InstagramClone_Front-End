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
import { MutableRefObject } from "react";

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
  return (
    <div
      className="w-full h-full bg-zinc-900 rounded-lg overflow-hidden flex flex-col relative"
      style={{ backgroundColor: "red" }}
    >
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
        {callType === "video" && !isRemoteVideoOff ? (
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
        ) : (
          // Fallback: User Info (Profile Picture, Name, Status)
          <div className="absolute flex flex-col items-center text-white text-center p-4">
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
            {micMuted && ( // Trạng thái mic của bạn
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
        )}

        {/* Local Video Preview (Picture-in-Picture) */}
        {/* Hiển thị nếu có local stream và camera đang bật */}
        {!videoOff && localVideoRef && (
          <div className="absolute bottom-20 right-4 md:bottom-24 md:right-6 w-32 h-48 md:w-40 md:h-56 bg-black rounded-md overflow-hidden shadow-lg z-10 border-2 border-zinc-700">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted // Video của bạn nên được tắt tiếng để tránh echo
              className="w-full h-full object-cover"
            />
          </div>
        )}
      </div>

      {/* Audio element để nghe đối phương */}
      <audio ref={remoteAudioRef} autoPlay />

      {/* Bottom controls */}
      <div className="bg-zinc-900 p-4 flex flex-col items-center gap-4 z-10">
        {/* Trạng thái thiết bị (ví dụ: mic) - có thể mở rộng sau */}
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

          {/* Nút bật/tắt video chỉ hiển thị nếu là cuộc gọi video, hoặc cho phép bật video trong audio call */}
          {(callType === "video" || true) && ( // Điều kiện 'true' để luôn hiển thị nếu muốn cho phép bật cam trong audio call
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
          )}

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
