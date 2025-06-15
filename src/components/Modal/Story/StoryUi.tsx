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
import ViewStoryUi from "@/app/ui/ViewStoryUi/index";
import { USERNAME_ADMIN } from "@/admin/user";

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

interface Viewer {
  _id: string;
  username: string;
  fullName: string;
  profilePicture?: string;
  viewedAt: string;
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
  audioKey: number; // thêm prop này
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
  audioKey,
}) => {
  const story = stories[current];
  const { getSlideBackground } = useAdaptiveBackground(stories, current);
  const [message, setMessage] = React.useState("");
  const [sending, setSending] = React.useState(false);
  const [showViewers, setShowViewers] = React.useState(false);
  const [isMobile, setIsMobile] = React.useState(false);
  const [viewers, setViewers] = React.useState<Viewer[]>([]);
  const audioElementRef = React.useRef<HTMLAudioElement | null>(null);
  const [audioSrc, setAudioSrc] = React.useState<string | undefined>(undefined);

  React.useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 767);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  React.useEffect(() => {
    if (showViewers) {
      setIsPlaying(false); // Tạm dừng story khi mở danh sách người xem
    }
  }, [showViewers, setIsPlaying]);

  const prevShowViewersRef = React.useRef(showViewers);
  React.useEffect(() => {
    // Nếu showViewers vừa chuyển từ true (đang mở) sang false (vừa đóng)
    if (prevShowViewersRef.current && !showViewers) {
      setIsPlaying(true); // Phát tiếp story, bất kể loại story là gì
    }
    prevShowViewersRef.current = showViewers; // Cập nhật trạng thái trước đó của showViewers
  }, [showViewers, setIsPlaying]); // Bỏ stories, current khỏi dependencies ở đây

  const userId =
    typeof window !== "undefined" ? localStorage.getItem("id") : null;
  const receiverId = author._id;

  const handleSendMessage = async () => {
    if (!message.trim() || !userId || !receiverId || sending) return;
    setSending(true);
    try {
      await sendMessageApi(receiverId, message);
      socketService.sendMessage({
        senderId: userId,
        receiverId,
        message,
      });
      setMessage("");
    } catch {
      // Handle error
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

  React.useEffect(() => {
    if (!showViewers) return;
    // Lắng nghe sự kiện viewers từ socket
    const handleViewed = (data: { storyId: string; viewers: Viewer[] }) => {
      if (data && data.storyId === story._id && Array.isArray(data.viewers)) {
        setViewers(data.viewers);
      }
    };
    socketService.onStoryViewed(handleViewed);
    // Khi mở modal, emit lại để lấy viewers mới nhất
    if (userId && typeof userId === "string") {
      socketService.emitStoryView({ storyId: story._id, userId });
    }
    return () => {
      socketService.offStoryViewed(handleViewed);
    };
  }, [showViewers, story._id, userId]);

  React.useEffect(() => {
    // Khi chuyển slide, force reload src để iOS nhận diện lại gesture
    if (stories[current]?.audioUrl) {
      setAudioSrc(undefined); // Xóa src trước
      setTimeout(() => {
        setAudioSrc(stories[current]?.audioUrl);
      }, 30); // Delay nhỏ để force reload
    }
  }, [audioKey, current, stories]);

  React.useEffect(() => {
    if (audioElementRef.current) {
      audioElementRef.current.pause();
      audioElementRef.current.currentTime = 0;
      if (isPlaying && audioSrc) {
        setTimeout(() => {
          audioElementRef.current?.play().catch(() => {});
        }, 100); // Delay nhỏ để iOS nhận gesture
      }
    }
  }, [audioSrc, isPlaying, audioKey]);

  return (
    <div
      className={`fixed inset-0 z-[1000] flex flex-col items-center justify-center ${
        isMobile && showViewers
          ? "bg-gradient-to-br from-purple-600 to-blue-600"
          : "bg-black bg-opacity-90"
      } w-screen h-[100dvh] overflow-hidden ${
        isOwner ? styles.container : styles.containerStory
      }`}
      {...(!isOwner
        ? { style: { padding: "55px 0 50px 0", gap: "10px" } }
        : {})}
    >
      <div
        className={`flex items-center justify-center w-full h-full relative transition-all duration-400 ease-in-out ${
          isMobile && showViewers
            ? "transform blur-[2px] scale-90 opacity-75"
            : "transform blur-0 scale-100 opacity-100"
        }`}
      >
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
        <div className="relative flex flex-col items-center justify-center rounded-2xl shadow-2xl aspect-[9/16] w-[min(420px,95vw)] h-[min(700px,95vh)] max-w-full max-h-full max-[480px]:w-full max-[480px]:h-[100dvh] max-[480px]:rounded-none max-[480px]:aspect-auto overflow-hidden">
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
                      {" "}
                      <title>Đã xác minh</title>{" "}
                      <path
                        d="M19.998 3.094 14.638 0l-2.972 5.15H5.432v6.354L0 14.64 3.094 20 0 25.359l5.432 3.137v5.905h5.975L14.638 40l5.36-3.094L25.358 40l3.232-5.6h6.162v-6.01L40 25.359 36.905 20 40 14.641l-5.248-3.03v-6.46h-6.419L25.358 0l-5.36 3.094Zm7.415 11.225 2.254 2.287-11.43 11.5-6.835-6.93 2.244-2.258 4.587 4.581 9.18-9.18Z"
                        fillRule="evenodd"
                      ></path>{" "}
                    </svg>
                  )}
                </span>
                <span className="text-xs text-zinc-300">
                  {author.username === USERNAME_ADMIN
                    ? "vĩnh viễn"
                    : story?.createdAt
                    ? timeStory(story.createdAt)
                    : ""}
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
                // Sửa lỗi: thêm return vào function body
                return (
                  <SwiperSlide
                    key={`${s._id}-slide-${idx}`}
                    className={`flex items-center justify-center relative ${styles.slide}`}
                    style={{ backgroundColor: slideBackgroundColor }}
                  >
                    {idx === current ? (
                      s.mediaType.startsWith("video") ? (
                        <div className="w-full h-full flex items-center justify-center">
                          <video
                            ref={(el) => setVideoRef(el)}
                            src={s.mediaUrl}
                            controls={false}
                            muted={!!s.audioUrl}
                            autoPlay
                            loop
                            playsInline
                            webkit-playsinline="true"
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
                              if (
                                swiperRef.current &&
                                idx < stories.length - 1
                              ) {
                                swiperRef.current.slideNext();
                              } else {
                                onClose();
                              }
                            }}
                          />
                          {s.audioUrl && (
                            <audio
                              key={audioKey}
                              ref={(el) => {
                                setAudioRef(el);
                                audioElementRef.current = el;
                              }}
                              controls={false}
                              className="hidden"
                              src={idx === current ? audioSrc : undefined}
                              onCanPlay={() => {
                                if (isPlaying && audioElementRef.current) {
                                  audioElementRef.current
                                    .play()
                                    .catch(() => {});
                                }
                              }}
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
                              key={audioKey}
                              ref={(el) => {
                                setAudioRef(el);
                                audioElementRef.current = el;
                              }}
                              controls={false}
                              className="hidden"
                              src={idx === current ? audioSrc : undefined}
                              onCanPlay={() => {
                                if (isPlaying && audioElementRef.current) {
                                  audioElementRef.current
                                    .play()
                                    .catch(() => {});
                                }
                              }}
                            />
                          )}
                        </div>
                      )
                    ) : (
                      <div className="w-full h-full" />
                    )}
                  </SwiperSlide>
                );
              })}
            </Swiper>
          </div>
          <IsProfile profileId={author.username} fallback={null}>
            <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-black/60 via-black/30 to-transparent z-10 rounded-b-2xl max-[480px]:rounded-none pointer-events-none">
              <ViewStory
                uniqueViewerCount={uniqueViewerCount}
                onClick={() => setShowViewers(true)}
              />
            </div>
          </IsProfile>
        </div>
      </div>
      {showViewers && (
        <ViewStoryUi onClose={() => setShowViewers(false)} viewers={viewers} />
      )}
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
