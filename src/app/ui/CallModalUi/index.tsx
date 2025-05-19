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
  videoOff: boolean;
  remoteAudioRef: MutableRefObject<HTMLAudioElement | null>;
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
}: CallModalUiProps) {
  return (
    <div className="w-full h-full bg-zinc-900 rounded-lg overflow-hidden flex flex-col">
      {/* Top bar */}
      <div className="absolute top-0 right-0 flex items-center gap-2 p-4 z-10">
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

      {/* Main content - video area */}
      <div className="flex-1 flex items-center justify-center bg-zinc-900">
        <div className="relative w-full h-full flex items-center justify-center">
          {/* Call status and user info */}
          <div className="absolute flex flex-col items-center text-white">
            <div className="h-24 w-24 rounded-full overflow-hidden mb-3">
              <Image
                src={callerInfo.profilePicture}
                alt="Profile"
                className="w-full h-full object-cover"
                width={96}
                height={96}
              />
            </div>
            <h2 className="text-xl font-semibold">{callerInfo.username}</h2>
            <p className="text-gray-300 text-sm mt-1">{callStatus}</p>
            {micMuted && (
              <div className="mt-2 bg-red-500 text-white px-3 py-1 rounded-full text-xs">
                Mic đã tắt
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Audio element để nghe đối phương */}
      <audio ref={remoteAudioRef} autoPlay />

      {/* Bottom controls */}
      <div className="bg-zinc-900 p-4 flex justify-center items-center gap-4">
        {/* Audio device info */}
        <div className="absolute left-4 text-white text-xs">
          <div className="flex items-center mb-2">
            <Mic
              size={16}
              className={`mr-2 ${micMuted ? "text-red-500" : "text-white"}`}
            />
            <span>Micrô {micMuted ? "đã tắt" : "đang bật"}</span>
          </div>
          <div className="flex items-center">
            <span className="mr-2">🔊</span>
            <span>Loa được kết nối: Headphones (Realtek(R) Audio)</span>
          </div>
        </div>

        {/* Call controls */}
        <div className="flex gap-4 items-center">
          <button
            className={`p-3 rounded-full ${
              micMuted ? "bg-red-600" : "bg-zinc-800"
            }`}
            onClick={handleToggleMic}
          >
            {micMuted ? (
              <MicOff size={24} color="white" />
            ) : (
              <Mic size={24} color="white" />
            )}
          </button>

          <button
            className={`p-3 rounded-full ${
              videoOff ? "bg-red-600" : "bg-zinc-800"
            }`}
            onClick={handleToggleVideo}
          >
            {videoOff ? (
              <VideoOff size={24} color="white" />
            ) : (
              <Video size={24} color="white" />
            )}
          </button>

          <button className="p-3 rounded-full bg-zinc-800">
            <UserPlus size={24} color="white" />
          </button>

          <button
            className="p-3 rounded-full bg-red-600"
            onClick={handleEndCallLocal}
          >
            <Phone size={24} color="white" />
          </button>
        </div>
      </div>
    </div>
  );
}
