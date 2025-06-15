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
  const dispatch: AppDispatch = useDispatch();
  const storyViewers = useSelector(
    (state: RootState) => state.story.storyViewers
  );
  // Lấy userId từ localStorage (FE không có user slice chuẩn)
  const userId =
    typeof window !== "undefined" ? localStorage.getItem("id") : null;

  // Helper function để xử lý đóng modal
  const handleClose = useCallback(() => {
    if (audioRef) {
      audioRef.pause();
      audioRef.currentTime = 0;
    }
    if (videoRef) {
      videoRef.pause();
      videoRef.currentTime = 0;
    }
    setIsPlaying(false); // Dừng toàn bộ story khi đóng
    if (deltail) {
      onClose();
    } else {
      window.history.replaceState({}, "", prevPathRef.current || "/");
      onClose();
    }
  }, [deltail, onClose, audioRef, videoRef]);

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
      let actualDuration = duration;
      // Nếu là video thường, lấy duration thực tế từ videoRef (max 1 phút)
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

      // Chỉ tự động chuyển story khi không phải deltail
      if (!deltail && totalElapsed >= actualDuration) {
        setProgress(100);
        if (swiperRef.current) {
          if (current < stories.length - 1) {
            swiperRef.current.slideNext();
          } else {
            // Sử dụng handleClose để xử lý URL đúng cách
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
    deltail, // Thêm deltail vào dependency
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
      // Nếu có audioUrl (video/audio hoặc image/audio), điều khiển muted của audio custom
      activeAudio.muted = !!story?.audioUrl ? isMuted : true;
      if (isPlaying) {
        activeAudio.play().catch(() => {});
      } else {
        activeAudio.pause();
      }
    }

    if (activeVideo) {
      // Nếu có audioUrl (video/audio hoặc image/audio), luôn mute video gốc
      // Nếu là video thường (không có audioUrl), điều khiển muted của video gốc bằng isMuted
      activeVideo.muted = !!story?.audioUrl ? true : isMuted;
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
  }, [audioRef, videoRef, isPlaying, isMuted, story]);

  useEffect(() => {
    // Chỉ xử lý URL khi không phải deltail
    if (deltail) return;

    if (open && !wasOpenRef.current) {
      // Lưu lại pathname gốc khi mở modal lần đầu
      prevPathRef.current = window.location.pathname;
      wasOpenRef.current = true;
      window.history.pushState({}, "", `/story/${stories[current]._id}`);
    } else if (open && wasOpenRef.current) {
      // Khi chuyển story, chỉ pushState, không ghi đè prevPathRef
      window.history.pushState({}, "", `/story/${stories[current]._id}`);
    }
  }, [open, current, stories, deltail]);

  useEffect(() => {
    // Chỉ xử lý URL khi không phải deltail
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
        // Chỉ tự động đóng modal khi không phải deltail
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
      // Video thường: FE lấy duration thực tế từ videoRef, max 1 phút
      if (
        videoRef &&
        videoRef.duration &&
        !isNaN(videoRef.duration) &&
        videoRef.readyState >= 1
      ) {
        d = Math.min(Math.round(videoRef.duration * 1000), 60000); // max 1 phút
      } else {
        // Nếu chưa có metadata thì chờ lần sau
        return;
      }
    } else if (
      currentStoryData.mediaType === "video" &&
      currentStoryData.audioUrl
    ) {
      // video/audio, ưu tiên audioDuration nếu có, nếu không thì lấy videoRef.duration
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

  const handleSlideChange = useCallback(
    (swiper: SwiperCore) => {
      // Khi chuyển slide, pause story (dừng toàn bộ: audio, video, progress)
      setIsPlaying(false); // Pause toàn bộ story
      if (audioRef) {
        audioRef.pause();
        audioRef.currentTime = 0;
      }
      if (videoRef) {
        videoRef.pause();
        videoRef.currentTime = 0;
      }
      const newIndex = swiper.activeIndex;
      setCurrent(newIndex);
      // Sau một khoảng nhỏ, play lại toàn bộ story
      setTimeout(() => {
        setIsPlaying(true);
        if (audioRef) {
          audioRef.play().catch(() => {});
        }
        if (videoRef) {
          videoRef.play().catch(() => {});
        }
      }, 100);
    },
    [audioRef, videoRef]
  );

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

  // Lắng nghe realtime viewers khi mount
  useEffect(() => {
    dispatch(listenStoryViewedSocket());
    return () => {
      socketService.offStoryViewed(() => {}); // cleanup
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
