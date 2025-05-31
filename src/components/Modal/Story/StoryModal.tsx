"use client";

import React, { useEffect, useCallback, useState, useRef } from "react";
import styles from "./StoryModal.module.scss";

import Image from "next/image";
import {
  X,
  Volume2,
  VolumeX,
  Pause,
  Play,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Swiper, SwiperSlide } from "swiper/react";
import SwiperCore from "swiper";
import "swiper/css";

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
}

interface StoryModalProps {
  open: boolean;
  onClose: () => void;
  stories: Story[];
  author: Author;
  initialIndex?: number;
  durations?: number[];
  profileOpen?: boolean;
  deltail?: boolean;
}

const StoryModal: React.FC<
  StoryModalProps & {
    waitForConfirm?: boolean;
    onConfirm?: () => Promise<boolean> | boolean;
  }
> = ({
  open,
  onClose,
  stories,
  author,
  initialIndex = 0,
  durations = [],
  waitForConfirm = false,
  onConfirm,
  profileOpen,
  deltail,
}) => {
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [audioRef, setAudioRef] = useState<HTMLAudioElement | null>(null);
  const [videoRef, setVideoRef] = useState<HTMLVideoElement | null>(null);
  const [startTime, setStartTime] = useState<number>(Date.now());
  const [duration, setDuration] = useState<number>(7000);
  const [current, setCurrent] = useState(initialIndex);
  const [elapsed, setElapsed] = useState<number>(0);
  const swiperRef = useRef<SwiperCore | null>(null);
  const rafRef = useRef<number | null>(null);
  const story = stories[current];

  // State mới để lưu object-fit cho từng story
  const [storyFitStyles, setStoryFitStyles] = useState<
    Record<string, "object-contain" | "object-cover">
  >({});

  const prevPathRef = useRef<string>("/");
  const wasOpenRef = useRef<boolean>(false);

  const resetProgress = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    setProgress(0);
    setElapsed(0);
    setStartTime(Date.now());
  }, []);

  useEffect(() => {
    // Chỉ reset progress khi 'current' thay đổi
    resetProgress();
  }, [current, resetProgress]); // resetProgress là callback nên ổn định

  useEffect(() => {
    if (open) {
      setCurrent(initialIndex);
      // Không cần reset storyFitStyles ở đây để giữ lại style đã xác định nếu modal được mở lại với cùng stories
    } else {
      // Optional: Xóa styles khi modal đóng hẳn để giải phóng bộ nhớ nếu cần
      // setStoryFitStyles({});
    }
  }, [open, initialIndex]);

  useEffect(() => {
    if (isPlaying) {
      setStartTime(Date.now());
    } else {
      setElapsed((prev) => prev + (Date.now() - startTime));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying]);

  useEffect(() => {
    if (!open || !isPlaying) {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      return;
    }

    const update = () => {
      const now = Date.now();
      const totalElapsed = elapsed + (now - startTime);
      const newProgress = Math.min(100, (totalElapsed / duration) * 100);
      setProgress(newProgress);
      if (totalElapsed >= duration) {
        setProgress(100);
        if (swiperRef.current) {
          if (current < stories.length - 1) {
            swiperRef.current.slideNext();
          } else {
            onClose();
          }
        }
      } else {
        rafRef.current = requestAnimationFrame(update);
      }
    };

    rafRef.current = requestAnimationFrame(update);

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [
    open,
    isPlaying,
    startTime,
    duration,
    current,
    stories.length,
    onClose,
    elapsed,
  ]);

  useEffect(() => {
    if (audioRef) {
      audioRef.currentTime = 0;
    }
    if (videoRef) {
      videoRef.currentTime = 0;
    }
  }, [audioRef, videoRef]);

  useEffect(() => {
    const activeAudio = audioRef;
    const activeVideo = videoRef;

    if (activeAudio) {
      activeAudio.muted = isMuted;
      if (isPlaying) {
        activeAudio.play().catch(() => {});
      } else {
        activeAudio.pause();
      }
    }

    if (activeVideo) {
      activeVideo.muted = true;
      if (isPlaying) {
        activeVideo.play().catch(() => {});
      } else {
        activeVideo.pause();
      }
    }

    return () => {
      if (activeAudio && activeAudio.readyState > 0) {
        activeAudio.pause();
      }
      if (activeVideo && activeVideo.readyState > 0) {
        activeVideo.pause();
      }
    };
  }, [audioRef, videoRef, isPlaying, isMuted]);

  useEffect(() => {
    if (open && !wasOpenRef.current) {
      // Lưu lại pathname gốc khi mở modal lần đầu
      prevPathRef.current = window.location.pathname;
      wasOpenRef.current = true;
      window.history.pushState({}, "", `/story/${stories[current]._id}`);
    } else if (open && wasOpenRef.current) {
      // Khi chuyển story, chỉ pushState, không ghi đè prevPathRef
      window.history.pushState({}, "", `/story/${stories[current]._id}`);
    }
  }, [open, current, stories]);

  useEffect(() => {
    if (!open && wasOpenRef.current) {
      window.history.replaceState({}, "", prevPathRef.current || "/");
      wasOpenRef.current = false;
    }
  }, [open]);

  const nextStory = useCallback(() => {
    if (swiperRef.current) {
      if (current < stories.length - 1) {
        swiperRef.current.slideNext();
      } else {
        onClose();
      }
    }
  }, [current, stories.length, onClose]);

  const prevStory = useCallback(() => {
    if (swiperRef.current) {
      if (current > 0) {
        swiperRef.current.slidePrev();
      }
    }
  }, [current]);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") prevStory();
      if (e.key === "ArrowRight") nextStory();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onClose, prevStory, nextStory]);

  useEffect(() => {
    let d = 7000;
    const currentStoryData = stories[current];

    if (!currentStoryData) {
      setDuration(d);
      return;
    }

    if (
      durations[current] &&
      !isNaN(durations[current]) &&
      durations[current] > 0
    ) {
      d = Math.round(durations[current] * 1000);
    } else if (
      currentStoryData.audioUrl &&
      currentStoryData.audioDuration &&
      !isNaN(currentStoryData.audioDuration)
    ) {
      d = Math.round(currentStoryData.audioDuration * 1000);
    } else if (currentStoryData.mediaType.startsWith("video")) {
      if (
        videoRef &&
        videoRef.duration &&
        !isNaN(videoRef.duration) &&
        videoRef.readyState >= 1
      ) {
        d = Math.round(videoRef.duration * 1000);
      } else {
        d = 15000;
      }
    }
    setDuration(d);
  }, [
    current,
    stories,
    durations,
    videoRef,
    videoRef?.duration,
    videoRef?.readyState,
  ]);

  const handleSlideChange = useCallback((swiper: SwiperCore) => {
    const newIndex = swiper.activeIndex;
    setCurrent(newIndex);
  }, []);

  // Thêm state để kiểm soát xác nhận
  const [confirmed, setConfirmed] = useState(!waitForConfirm);

  useEffect(() => {
    if (waitForConfirm && open && !confirmed) {
      // Nếu cần xác nhận và chưa xác nhận, gọi onConfirm
      (async () => {
        let ok = true;
        if (onConfirm) {
          ok = await onConfirm();
        }
        setConfirmed(ok);
      })();
    } else if (!open) {
      setConfirmed(!waitForConfirm);
    }
  }, [waitForConfirm, open, confirmed, onConfirm]);

  // Reset âm thanh khi vào trang detail (deltail)
  useEffect(() => {
    if (deltail) {
      setIsPlaying(false); // Pause lại khi vào detail
      // Không cần tắt tiếng (giữ nguyên volume)
      if (audioRef) {
        audioRef.pause();
        audioRef.currentTime = 0;
      }
      if (videoRef) {
        videoRef.pause();
        videoRef.currentTime = 0;
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deltail]);

  // Ưu tiên deltail, sau đó profileOpen, sau đó open
  // Giữ nguyên cả hai prop: deltail và profileOpen
  const shouldShow = deltail
    ? true
    : profileOpen !== undefined
    ? profileOpen
    : open;

  if (!shouldShow || (waitForConfirm && !confirmed)) return null;

  if (!stories || stories.length === 0) {
    return (
      <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black bg-opacity-90">
        <div className="bg-zinc-900 rounded-xl shadow-lg p-8 min-w-[320px] min-h-[200px] flex flex-col items-center">
          <div className="flex items-center justify-between w-full mb-4">
            <span className="text-white text-lg font-semibold">
              Không có story nào để hiển thị
            </span>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-zinc-800 transition-colors"
            >
              <X className="w-6 h-6 text-white" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black bg-opacity-90 w-screen h-[100dvh]">
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
          >
            <ChevronRight className="w-6 h-6 text-white" />
          </button>
        </div>

        <div className="hidden min-[481px]:flex absolute top-4 right-4 z-30">
          <button
            onClick={() => {
              if (deltail) {
                onClose();
              } else {
                window.history.replaceState({}, "", prevPathRef.current || "/");
                onClose();
              }
            }}
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
                    <Image
                      src="/icons/checkMark/checkMark.png"
                      alt="Verified"
                      width={13}
                      height={13}
                      className="ml-1"
                    />
                  )}
                </span>
                <span className="text-xs text-zinc-300">
                  {story?.createdAt ? timeAgo(story.createdAt) : ""}
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
                onClick={() => {
                  if (deltail) {
                    onClose();
                  } else {
                    window.history.replaceState(
                      {},
                      "",
                      prevPathRef.current || "/"
                    );
                    onClose();
                  }
                }}
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

                return (
                  <SwiperSlide
                    key={`${s._id}-slide-${idx}`}
                    className="flex items-center justify-center"
                  >
                    {s.mediaType.startsWith("video") ? (
                      <div className="w-full h-full flex items-center justify-center">
                        <video
                          ref={idx === current ? (el) => setVideoRef(el) : null}
                          src={s.mediaUrl}
                          controls={false}
                          muted={true}
                          onLoadedMetadata={(e) => {
                            // Luôn gắn handler
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
                          className={`w-full h-full ${fitClassForThisSlide} rounded-2xl bg-black max-[480px]:rounded-none`}
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
                            // Luôn gắn handler
                            const determinedFit =
                              naturalWidth > naturalHeight
                                ? "object-contain"
                                : "object-cover";
                            setStoryFitStyles((prevStyles) => ({
                              ...prevStyles,
                              [s._id]: determinedFit,
                            }));
                          }}
                          className={`${fitClassForThisSlide} rounded-2xl bg-black max-[480px]:rounded-none`}
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
    </div>
  );
};

function timeAgo(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (diff < 60) return `${diff}s trước`;
  if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
  return `${Math.floor(diff / 86400)} ngày trước`;
}

export default StoryModal;
