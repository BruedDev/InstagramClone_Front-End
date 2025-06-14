"use client";

import React, { useEffect, useCallback, useState, useRef } from "react";
import { X } from "lucide-react";
import SwiperCore from "swiper";
import "swiper/css";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/store";
import { listenStoryViewedSocket } from "@/store/story";
import type { AppDispatch } from "@/store";
import { socketService } from "@/server/socket";
import StoryUi from "./StoryUi";

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

type StoryModalExtraProps = {
  waitForConfirm?: boolean;
  onConfirm?: () => Promise<boolean> | boolean;
};

const StoryModal: React.FC<StoryModalProps & StoryModalExtraProps> = ({
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
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [audioRef, setAudioRef] = useState<HTMLAudioElement | null>(null);
  const [videoRef, setVideoRef] = useState<HTMLVideoElement | null>(null);
  const [startTime, setStartTime] = useState<number>(Date.now());
  const [duration, setDuration] = useState<number>(7000);
  const [current, setCurrent] = useState<number>(initialIndex);
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
  const dispatch: AppDispatch = useDispatch();
  const storyViewers = useSelector(
    (state: RootState) => state.story.storyViewers
  );

  // iOS Audio Context Management
  const audioContextRef = useRef<AudioContext | null>(null);
  const isIOSRef = useRef<boolean>(false);
  const audioInitializedRef = useRef<boolean>(false);
  const preloadCacheRef = useRef<
    Map<string, HTMLAudioElement | HTMLVideoElement>
  >(new Map());

  // Detect iOS
  useEffect(() => {
    isIOSRef.current = /iPad|iPhone|iPod/.test(navigator.userAgent);
  }, []);

  // Initialize Audio Context for iOS
  const initAudioContext = useCallback(() => {
    if (!isIOSRef.current) return;

    try {
      if (!audioContextRef.current) {
        type WindowWithWebkitAudioContext = typeof window & {
          webkitAudioContext?: typeof AudioContext;
        };
        const win = window as WindowWithWebkitAudioContext;
        audioContextRef.current = new (window.AudioContext ||
          win.webkitAudioContext!)();
      }

      if (audioContextRef.current.state === "suspended") {
        audioContextRef.current.resume();
      }

      audioInitializedRef.current = true;
    } catch (error) {
      console.warn("AudioContext initialization failed:", error);
    }
  }, []);

  // Setup first touch handler for iOS
  useEffect(() => {
    if (!isIOSRef.current) return;

    const handleFirstInteraction = () => {
      initAudioContext();
      document.removeEventListener("touchstart", handleFirstInteraction);
      document.removeEventListener("click", handleFirstInteraction);
    };

    document.addEventListener("touchstart", handleFirstInteraction, {
      passive: true,
    });
    document.addEventListener("click", handleFirstInteraction);

    return () => {
      document.removeEventListener("touchstart", handleFirstInteraction);
      document.removeEventListener("click", handleFirstInteraction);
    };
  }, [initAudioContext]);

  // Preload next stories
  useEffect(() => {
    if (!open) return;

    const preloadStory = (storyIndex: number) => {
      const storyToPreload = stories[storyIndex];
      if (!storyToPreload) return;

      const cacheKey = storyToPreload._id;
      if (preloadCacheRef.current.has(cacheKey)) return;

      // Preload audio
      if (storyToPreload.audioUrl) {
        const audio = new Audio();
        audio.preload = "auto";
        audio.crossOrigin = "anonymous";
        audio.src = storyToPreload.audioUrl;

        if (isIOSRef.current) {
          audio.setAttribute("playsinline", "true");
          audio.setAttribute("webkit-playsinline", "true");
        }

        audio.load();
        preloadCacheRef.current.set(cacheKey + "_audio", audio);
      }

      // Preload video
      if (storyToPreload.mediaType === "video") {
        const video = document.createElement("video");
        video.preload = "metadata";
        video.crossOrigin = "anonymous";
        video.src = storyToPreload.mediaUrl;

        if (isIOSRef.current) {
          video.setAttribute("playsinline", "true");
          video.setAttribute("webkit-playsinline", "true");
          video.setAttribute("muted", "true");
        }

        video.load();
        preloadCacheRef.current.set(cacheKey + "_video", video);
      }
    };

    // Preload current and next 2 stories
    preloadStory(current);
    preloadStory(current + 1);
    preloadStory(current + 2);
  }, [current, stories, open]);

  // Cleanup preload cache
  useEffect(() => {
    return () => {
      preloadCacheRef.current.forEach((element) => {
        if (
          element instanceof HTMLAudioElement ||
          element instanceof HTMLVideoElement
        ) {
          element.pause();
          element.src = "";
          element.load();
        }
      });
      preloadCacheRef.current.clear();
    };
  }, []);

  // Lấy userId từ localStorage (FE không có user slice chuẩn)
  const userId =
    typeof window !== "undefined" ? localStorage.getItem("id") : null;

  // Helper function để xử lý đóng modal
  const handleClose = useCallback(() => {
    if (deltail) {
      onClose();
    } else {
      // Xử lý URL cho trường hợp open thông thường
      window.history.replaceState({}, "", prevPathRef.current || "/");
      onClose();
    }
  }, [deltail, onClose]);

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
  }, [current, resetProgress]);

  useEffect(() => {
    if (open) {
      setCurrent(initialIndex);
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
      let actualDuration = duration;

      if (
        story?.mediaType === "video" &&
        !story?.audioUrl &&
        videoRef &&
        videoRef.duration &&
        !isNaN(videoRef.duration) &&
        videoRef.readyState >= 1
      ) {
        actualDuration = Math.min(Math.round(videoRef.duration * 1000), 60000);
      }
      const newProgress = Math.min(100, (totalElapsed / actualDuration) * 100);
      setProgress(newProgress);

      if (!deltail && totalElapsed >= actualDuration) {
        setProgress(100);
        if (swiperRef.current) {
          if (current < stories.length - 1) {
            swiperRef.current.slideNext();
          } else {
            handleClose();
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
    handleClose,
    elapsed,
    story,
    videoRef,
    videoRef?.duration,
    videoRef?.readyState,
    deltail,
  ]);

  useEffect(() => {
    if (audioRef) {
      audioRef.currentTime = 0;
    }
    if (videoRef) {
      videoRef.currentTime = 0;
    }
  }, [audioRef, videoRef]);

  // Improved audio/video control with iOS handling
  useEffect(() => {
    const activeAudio = audioRef;
    const activeVideo = videoRef;

    const waitForCanPlay = (
      element: HTMLAudioElement | HTMLVideoElement
    ): Promise<void> => {
      return new Promise((resolve) => {
        if (element.readyState >= 2) {
          resolve();
          return;
        }

        const onCanPlay = () => {
          element.removeEventListener("canplay", onCanPlay);
          element.removeEventListener("canplaythrough", onCanPlay);
          resolve();
        };

        element.addEventListener("canplay", onCanPlay);
        element.addEventListener("canplaythrough", onCanPlay);

        // Timeout fallback
        setTimeout(() => {
          element.removeEventListener("canplay", onCanPlay);
          element.removeEventListener("canplaythrough", onCanPlay);
          resolve();
        }, 2000);
      });
    };

    const playAudio = async () => {
      if (!activeAudio) return;

      try {
        // iOS audio context initialization
        if (isIOSRef.current && !audioInitializedRef.current) {
          initAudioContext();
        }

        // Set mute state
        activeAudio.muted = !!story?.audioUrl ? isMuted : true;

        if (isPlaying) {
          // Wait for audio to be ready
          await waitForCanPlay(activeAudio);

          // Multiple retry mechanism for iOS
          let attempts = 0;
          const maxAttempts = 3;

          const tryPlay = async (): Promise<void> => {
            try {
              await activeAudio.play();
            } catch (error) {
              attempts++;
              if (attempts < maxAttempts) {
                // Wait and retry
                await new Promise((resolve) =>
                  setTimeout(resolve, 100 * attempts)
                );

                // Re-initialize audio context for iOS
                if (isIOSRef.current) {
                  initAudioContext();
                }

                return tryPlay();
              } else {
                console.warn(
                  `Audio play failed after ${maxAttempts} attempts:`,
                  error
                );
                throw error;
              }
            }
          };

          await tryPlay();
        } else {
          activeAudio.pause();
        }
      } catch (error) {
        console.warn("Audio control error:", error);
      }
    };

    const playVideo = async () => {
      if (!activeVideo) return;

      try {
        // Set mute state
        activeVideo.muted = !!story?.audioUrl ? true : isMuted;

        // iOS specific attributes
        if (isIOSRef.current) {
          activeVideo.setAttribute("playsinline", "true");
          activeVideo.setAttribute("webkit-playsinline", "true");
        }

        if (isPlaying) {
          // Wait for video to be ready
          await waitForCanPlay(activeVideo);

          let attempts = 0;
          const maxAttempts = 3;

          const tryPlay = async (): Promise<void> => {
            try {
              await activeVideo.play();
            } catch (error) {
              attempts++;
              if (attempts < maxAttempts) {
                await new Promise((resolve) =>
                  setTimeout(resolve, 100 * attempts)
                );
                return tryPlay();
              } else {
                console.warn(
                  `Video play failed after ${maxAttempts} attempts:`,
                  error
                );
                throw error;
              }
            }
          };

          await tryPlay();
        } else {
          activeVideo.pause();
        }
      } catch (error) {
        console.warn("Video control error:", error);
      }
    };

    // Execute play functions
    playAudio();
    playVideo();

    return () => {
      if (activeAudio && activeAudio.readyState > 0) {
        activeAudio.pause();
      }
      if (activeVideo && activeVideo.readyState > 0) {
        activeVideo.pause();
      }
    };
  }, [audioRef, videoRef, isPlaying, isMuted, story, initAudioContext]);

  // Setup iOS-specific attributes when refs change
  useEffect(() => {
    if (!isIOSRef.current) return;

    if (audioRef) {
      audioRef.setAttribute("playsinline", "true");
      audioRef.setAttribute("webkit-playsinline", "true");
    }

    if (videoRef) {
      videoRef.setAttribute("playsinline", "true");
      videoRef.setAttribute("webkit-playsinline", "true");
    }
  }, [audioRef, videoRef]);

  useEffect(() => {
    if (deltail) return;

    if (open && !wasOpenRef.current) {
      prevPathRef.current = window.location.pathname;
      wasOpenRef.current = true;
      window.history.pushState({}, "", `/story/${stories[current]._id}`);
    } else if (open && wasOpenRef.current) {
      window.history.pushState({}, "", `/story/${stories[current]._id}`);
    }
  }, [open, current, stories, deltail]);

  useEffect(() => {
    if (deltail) return;

    if (!open && wasOpenRef.current) {
      window.history.replaceState({}, "", prevPathRef.current || "/");
      wasOpenRef.current = false;
    }
  }, [open, deltail]);

  const nextStory = useCallback(() => {
    if (swiperRef.current) {
      if (current < stories.length - 1) {
        swiperRef.current.slideNext();
      } else {
        if (!deltail) {
          handleClose();
        }
      }
    }
  }, [current, stories.length, handleClose, deltail]);

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
      if (e.key === "Escape") handleClose();
      if (e.key === "ArrowLeft") prevStory();
      if (e.key === "ArrowRight") nextStory();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, handleClose, prevStory, nextStory]);

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
    } else if (
      currentStoryData.mediaType === "video" &&
      !currentStoryData.audioUrl
    ) {
      if (
        videoRef &&
        videoRef.duration &&
        !isNaN(videoRef.duration) &&
        videoRef.readyState >= 1
      ) {
        d = Math.min(Math.round(videoRef.duration * 1000), 60000);
      } else {
        return;
      }
    } else if (
      currentStoryData.mediaType === "video" &&
      currentStoryData.audioUrl
    ) {
      if (
        currentStoryData.audioDuration &&
        !isNaN(currentStoryData.audioDuration)
      ) {
        d = Math.round(currentStoryData.audioDuration * 1000);
      } else if (
        videoRef &&
        videoRef.duration &&
        !isNaN(videoRef.duration) &&
        videoRef.readyState >= 1
      ) {
        d = Math.round(videoRef.duration * 1000);
      } else {
        return;
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

  // Improved slide change handler with iOS audio handling
  const handleSlideChange = useCallback(
    async (swiper: SwiperCore) => {
      const newIndex = swiper.activeIndex;

      // Pause current audio/video immediately
      if (audioRef) {
        audioRef.pause();
        audioRef.currentTime = 0;
      }
      if (videoRef) {
        videoRef.pause();
        videoRef.currentTime = 0;
      }

      setCurrent(newIndex);

      // Small delay to let component update
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Re-initialize audio context for iOS
      if (isIOSRef.current) {
        initAudioContext();
      }
    },
    [audioRef, videoRef, initAudioContext]
  );

  // Thêm state để kiểm soát xác nhận
  const [confirmed, setConfirmed] = useState(!waitForConfirm);

  useEffect(() => {
    if (waitForConfirm && open && !confirmed) {
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
      setIsPlaying(false);
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

  const shouldShow = deltail
    ? true
    : profileOpen !== undefined
    ? profileOpen
    : open;

  // Lắng nghe realtime viewers khi mount
  useEffect(() => {
    dispatch(listenStoryViewedSocket());
    return () => {
      socketService.offStoryViewed(() => {});
    };
  }, [dispatch]);

  // Gửi sự kiện xem story khi chuyển story
  useEffect(() => {
    if (open && userId && stories[current]?._id) {
      socketService.emitStoryView({ storyId: stories[current]._id, userId });
    }
  }, [open, current, userId, stories]);

  // Lấy số lượt xem hiện tại (đã loại trùng lặp)
  const currentStoryId = stories[current]?._id;
  const rawViewers = storyViewers[currentStoryId] || [];
  const uniqueViewerCount = new Set(rawViewers.map((v) => v._id)).size;

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
              onClick={handleClose}
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
    <StoryUi
      author={author}
      stories={stories}
      current={current}
      progress={progress}
      isMuted={isMuted}
      isPlaying={isPlaying}
      onClose={handleClose}
      prevStory={prevStory}
      nextStory={nextStory}
      setIsMuted={setIsMuted}
      setIsPlaying={setIsPlaying}
      initialIndex={initialIndex}
      swiperRef={swiperRef}
      handleSlideChange={handleSlideChange}
      storyFitStyles={storyFitStyles}
      setStoryFitStyles={setStoryFitStyles}
      setAudioRef={setAudioRef}
      setVideoRef={setVideoRef}
      uniqueViewerCount={uniqueViewerCount}
    />
  );
};

export default StoryModal;
