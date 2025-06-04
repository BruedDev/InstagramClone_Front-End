import React from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import {
  ChevronLeft,
  ChevronRight,
  X,
  Volume2,
  VolumeX,
  Pause,
  Play,
} from "lucide-react";
import Image from "next/image";
import ViewStory from "./ViewStory";
import styles from "./StoryModal.module.scss";
import SwiperCore from "swiper";
import { useAdaptiveBackground } from "@/app/hooks/useAdaptiveBackground";
import { timeStory } from "@/app/hooks/useTimeStory";
import IsProfile from "@/components/isProfile";
import MessageInput from "@/components/Messenger/MessageInput";
import { sendMessage as sendMessageApi } from "@/server/messenger";
import { socketService } from "@/server/socket";

interface Author {
  _id: string;
  username: string;
  profilePicture?: string;
  checkMark?: boolean;
}

interface Story {
  _id: string;
  mediaUrl: string;
  mediaType: "image" | "video";
  audioUrl?: string;
  createdAt: string;
  audioDuration?: number;
  videoDuration?: number;
  hasAudio?: boolean;
}

interface StoryUiProps {
  author: Author;
  stories: Story[];
  current: number;
  progress: number;
  isMuted: boolean;
  isPlaying: boolean;
  onClose: () => void;
  prevStory: () => void;
  nextStory: () => void;
  setIsMuted: React.Dispatch<React.SetStateAction<boolean>>;
  setIsPlaying: React.Dispatch<React.SetStateAction<boolean>>;
  initialIndex: number;
  swiperRef: React.MutableRefObject<SwiperCore | null>;
  handleSlideChange: (swiper: SwiperCore) => void;
  storyFitStyles: Record<string, "object-contain" | "object-cover">;
  setStoryFitStyles: React.Dispatch<
    React.SetStateAction<Record<string, "object-contain" | "object-cover">>
  >;
  setAudioRef: (el: HTMLAudioElement | null) => void;
  setVideoRef: (el: HTMLVideoElement | null) => void;
  uniqueViewerCount: number;
}

const StoryUi: React.FC<StoryUiProps> = ({
  author,
  stories,
  current,
  progress,
  isMuted,
  isPlaying,
  onClose,
  prevStory,
  nextStory,
  setIsMuted,
  setIsPlaying,
  initialIndex,
  swiperRef,
  handleSlideChange,
  storyFitStyles,
  setStoryFitStyles,
  setAudioRef,
  setVideoRef,
  uniqueViewerCount,
}) => {
  const story = stories[current];
  const { getSlideBackground } = useAdaptiveBackground(stories, current);
  const [message, setMessage] = React.useState("");
  const [sending, setSending] = React.useState(false);
  // Lấy userId hiện tại từ localStorage hoặc redux nếu có
  const userId =
    typeof window !== "undefined" ? localStorage.getItem("id") : null;
  // Lấy authorId (người nhận) từ story
  const receiverId = author._id;

  const handleSendMessage = async () => {
    if (!message.trim() || !userId || !receiverId || sending) return;
    setSending(true);
    try {
      await sendMessageApi(receiverId, message);
      // Sử dụng socketService.sendMessage để gửi realtime đúng chuẩn
      socketService.sendMessage({
        senderId: userId,
        receiverId,
        message,
      });
      setMessage("");
    } catch {
      // Có thể show toast lỗi ở đây nếu muốn
    } finally {
      setSending(false);
    }
  };
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleSendMessage();
  };

  const isOwner =
    typeof window !== "undefined" &&
    localStorage.getItem("username") === author.username;

  return (
    <div
      className={`fixed inset-0 z-[1000] flex flex-col items-center justify-center bg-black bg-opacity-90 w-screen h-[100dvh] overflow-hidden ${
        isOwner ? styles.container : styles.containerStory
      }`}
      {...(!isOwner
        ? { style: { padding: "55px 0 50px 0", gap: "10px" } }
        : {})}
    >
      <div className="flex items-center justify-center w-full h-full relative">
        <div className="hidden min-[481px]:flex absolute left-4 top-1/2 transform -translate-y-1/2 z-30">
          <button
            onClick={prevStory}
            disabled={current === 0}
            className={`p-3 rounded-full bg-black bg-opacity-50 hover:bg-opacity-70 transition-all ${
              current === 0
                ? "opacity-50 cursor-not-allowed"
                : "opacity-80 hover:opacity-100"
            }`}
            style={{ backgroundColor: "#3B3D3E", cursor: "pointer" }}
          >
            <ChevronLeft className="w-6 h-6 text-white" />
          </button>
        </div>

        <div className="hidden min-[481px]:flex absolute right-4 top-1/2 transform -translate-y-1/2 z-30">
          <button
            onClick={nextStory}
            disabled={current === stories.length - 1 && !onClose}
            className={`p-3 rounded-full bg-black bg-opacity-50 hover:bg-opacity-70 transition-all ${
              current === stories.length - 1
                ? "opacity-50 cursor-not-allowed"
                : "opacity-80 hover:opacity-100"
            }`}
            style={{ backgroundColor: "#3B3D3E", cursor: "pointer" }}
          >
            <ChevronRight className="w-6 h-6 text-white" />
          </button>
        </div>

        <div className="hidden min-[481px]:flex absolute top-4 right-4 z-30">
          <button
            onClick={onClose}
            className="p-3 rounded-full bg-black bg-opacity-50 hover:bg-opacity-70 transition-all opacity-80 hover:opacity-100"
          >
            <X className="w-6 h-6 text-white" />
          </button>
        </div>

        <div className="relative flex flex-col items-center justify-center bg-black rounded-2xl shadow-2xl aspect-[9/16] w-[min(420px,95vw)] h-[min(700px,95vh)] max-w-full max-h-full max-[480px]:w-full max-[480px]:h-[100dvh] max-[480px]:rounded-none max-[480px]:aspect-auto">
          <div
            className={`absolute top-0 left-0 w-full z-20 rounded-t-2xl overflow-hidden px-2 pt-2 pb-1 flex gap-1 max-[480px]:rounded-none max-[480px] ${styles.progressBar}`}
          >
            {stories.map((s, idx) => (
              <div
                key={`${s._id}-${idx}`}
                className="flex-1 h-1 bg-zinc-800 rounded-full relative overflow-hidden"
              >
                <div
                  className="h-full bg-white transition-none rounded-full absolute left-0 top-0"
                  style={{
                    width:
                      idx < current
                        ? "100%"
                        : idx === current
                        ? `${progress}%`
                        : "0%",
                    transition: "none",
                  }}
                />
              </div>
            ))}
          </div>

          <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-black/60 via-black/40 to-transparent z-10 rounded-t-2xl max-[480px]:rounded-none pointer-events-none"></div>

          <IsProfile profileId={author.username} fallback={null}>
            <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-black/60 via-black/30 to-transparent z-10 rounded-b-2xl max-[480px]:rounded-none pointer-events-none">
              <ViewStory uniqueViewerCount={uniqueViewerCount} />
            </div>
          </IsProfile>

          <div
            className={`absolute top-0 left-0 w-full flex items-center justify-between px-4 pt-4 pb-2 z-20 ${styles.header}`}
          >
            <div className={`flex items-center gap-2 ${styles.authorInfo}`}>
              <Image
                src={author.profilePicture || "/api/placeholder/40/40"}
                alt={author.username}
                width={36}
                height={36}
                className="rounded-full object-cover border border-zinc-700"
              />

              <div className="flex flex-col">
                <span className="text-white font-semibold text-base flex gap-1 items-center">
                  {author.username}
                  {author.checkMark && (
                    <svg
                      aria-label="Đã xác minh"
                      fill="currentColor"
                      height="12"
                      role="img"
                      viewBox="0 0 40 40"
                      width="12"
                    >
                      <title>Đã xác minh</title>
                      <path
                        d="M19.998 3.094 14.638 0l-2.972 5.15H5.432v6.354L0 14.64 3.094 20 0 25.359l5.432 3.137v5.905h5.975L14.638 40l5.36-3.094L25.358 40l3.232-5.6h6.162v-6.01L40 25.359 36.905 20 40 14.641l-5.248-3.03v-6.46h-6.419L25.358 0l-5.36 3.094Zm7.415 11.225 2.254 2.287-11.43 11.5-6.835-6.93 2.244-2.258 4.587 4.581 9.18-9.18Z"
                        fill-rule="evenodd"
                      ></path>
                    </svg>
                  )}
                </span>
                <span className="text-xs text-zinc-300">
                  {story?.createdAt ? timeStory(story.createdAt) : ""}
                </span>
              </div>
            </div>

            <div className={`flex items-center gap-2 ${styles.controls}`}>
              <button
                onClick={() => setIsMuted((m) => !m)}
                className="p-2 rounded-full hover:bg-white/20 transition-colors"
              >
                {isMuted ? (
                  <VolumeX className="w-5 h-5 text-white" />
                ) : (
                  <Volume2 className="w-5 h-5 text-white" />
                )}
              </button>
              <button
                onClick={() => setIsPlaying((p) => !p)}
                className="p-2 rounded-full hover:bg-white/20 transition-colors"
              >
                {isPlaying ? (
                  <Pause className="w-5 h-5 text-white" />
                ) : (
                  <Play className="w-5 h-5 text-white" />
                )}
              </button>
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-white/20 transition-colors max-[480px]:flex min-[481px]:hidden"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>

          <div className="flex-1 w-full h-full flex items-center justify-center rounded-2xl overflow-hidden max-[480px]:rounded-none">
            <Swiper
              onSwiper={(swiper) => (swiperRef.current = swiper)}
              initialSlide={initialIndex}
              slidesPerView={1}
              allowTouchMove={true}
              onSlideChange={handleSlideChange}
              className={`w-full h-full`}
            >
              {stories.map((s, idx) => {
                const fitClassForThisSlide =
                  storyFitStyles[s._id] || "object-cover";
                const slideBackgroundColor = getSlideBackground(
                  s._id,
                  s.mediaType
                );

                return (
                  <SwiperSlide
                    key={`${s._id}-slide-${idx}`}
                    className={`flex items-center justify-center relative ${styles.slide}`}
                    style={{ backgroundColor: slideBackgroundColor }}
                  >
                    {s.mediaType.startsWith("video") ? (
                      <div className="w-full h-full flex items-center justify-center">
                        <video
                          ref={idx === current ? (el) => setVideoRef(el) : null}
                          src={s.mediaUrl}
                          controls={false}
                          muted={!!s.audioUrl}
                          onLoadedMetadata={(e) => {
                            const video = e.currentTarget;
                            const determinedFit =
                              video.videoWidth > video.videoHeight
                                ? "object-contain"
                                : "object-cover";
                            setStoryFitStyles((prevStyles) => ({
                              ...prevStyles,
                              [s._id]: determinedFit,
                            }));
                          }}
                          className={`w-full h-full ${fitClassForThisSlide} rounded-2xl max-[480px]:rounded-none`}
                          onEnded={() => {
                            if (swiperRef.current && idx < stories.length - 1) {
                              swiperRef.current.slideNext();
                            } else {
                              onClose();
                            }
                          }}
                        />
                        {s.audioUrl && (
                          <audio
                            ref={
                              idx === current ? (el) => setAudioRef(el) : null
                            }
                            controls={false}
                            className="hidden"
                            src={s.audioUrl}
                          />
                        )}
                      </div>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Image
                          src={s.mediaUrl}
                          alt="story"
                          fill
                          onLoadingComplete={({
                            naturalWidth,
                            naturalHeight,
                          }) => {
                            const determinedFit =
                              naturalWidth > naturalHeight
                                ? "object-contain"
                                : "object-cover";
                            setStoryFitStyles((prevStyles) => ({
                              ...prevStyles,
                              [s._id]: determinedFit,
                            }));
                          }}
                          className={`${fitClassForThisSlide} rounded-2xl max-[480px]:rounded-none`}
                        />
                        {s.audioUrl && (
                          <audio
                            ref={
                              idx === current ? (el) => setAudioRef(el) : null
                            }
                            controls={false}
                            className="hidden"
                            src={s.audioUrl}
                          />
                        )}
                      </div>
                    )}
                  </SwiperSlide>
                );
              })}
            </Swiper>
          </div>
        </div>
      </div>
      <IsProfile
        profileId={author.username}
        fallback={
          <div className="flex items-center justify-center w-full max-w-md p-4 bg-black bg-opacity-80 rounded-lg shadow-lg">
            <MessageInput
              message={message}
              setMessage={setMessage}
              handleSendMessage={handleSendMessage}
              handleKeyPress={handleKeyPress}
              inputStory={true}
            />
          </div>
        }
      >
        <></>
      </IsProfile>
    </div>
  );
};

export default StoryUi;
