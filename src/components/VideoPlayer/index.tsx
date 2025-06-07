// src/components/VideoPlayer/VideoPlayer.tsx

import React, {
  useEffect,
  useRef,
  useState,
  forwardRef,
  useImperativeHandle,
} from "react";
import { FaExpand } from "react-icons/fa";
import { BsPause } from "react-icons/bs";
import { HiMiniPlay } from "react-icons/hi2";
import styles from "./VideoPlayer.module.scss";

interface VideoPlayerProps {
  src: string;
  caption?: string;
  initialTime?: number;
  className?: string;
  onClick?: (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
  onLoadedMetadata?: (e: React.SyntheticEvent<HTMLVideoElement, Event>) => void;
  isPlaying?: boolean;
  onPlayPauseClick?: () => void;
  onPlay?: () => void;
  onPause?: () => void;
  autoPlay?: boolean;
  loop?: boolean;
  muted?: boolean;
  playsInline?: boolean;
  style?: React.CSSProperties;
}

const VideoPlayer = forwardRef<HTMLVideoElement, VideoPlayerProps>(
  (
    {
      src,
      caption,
      initialTime = 0,
      className,
      onClick,
      onLoadedMetadata,
      // isPlaying,
      onPlayPauseClick,
      onPlay,
      onPause,
      autoPlay = false,
      loop = false,
      muted = false,
      playsInline = false,
      style,
    },
    ref
  ) => {
    const localRef = useRef<HTMLVideoElement>(null);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [showControls, setShowControls] = useState(false);
    // Removed unused isMobile state and effect

    useImperativeHandle(ref, () => localRef.current as HTMLVideoElement, []);

    useEffect(() => {
      if (localRef.current && initialTime >= 0) {
        localRef.current.currentTime = initialTime;
        setCurrentTime(initialTime);
      }
    }, [initialTime, src]);

    const handleTimeUpdate = () => {
      if (localRef.current) {
        setCurrentTime(localRef.current.currentTime);
      }
    };

    const handleLoadedMetadata = (
      e: React.SyntheticEvent<HTMLVideoElement, Event>
    ) => {
      if (localRef.current) {
        setDuration(localRef.current.duration);
      }
      if (onLoadedMetadata) onLoadedMetadata(e);
    };

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
      const time = parseFloat(e.target.value);
      if (localRef.current) {
        localRef.current.currentTime = time;
        setCurrentTime(time);
      }
    };

    const handleFullscreen = () => {
      if (localRef.current) {
        if (localRef.current.requestFullscreen) {
          localRef.current.requestFullscreen();
        }
      }
    };

    const formatTime = (time: number) => {
      if (isNaN(time) || time === 0) return "0:00";
      const minutes = Math.floor(time / 60);
      const seconds = Math.floor(time % 60);
      return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
    };

    // Hàm play/pause dùng cho overlay icon (mobile và PC)
    const handlePlayPause = (e?: React.MouseEvent) => {
      if (e) e.stopPropagation(); // Ngăn lan truyền sự kiện lên div cha
      if (localRef.current) {
        if (localRef.current.paused) {
          localRef.current.play();
        } else {
          localRef.current.pause();
        }
      }
    };

    return (
      <div
        className={styles.videoContainer}
        onClick={onClick}
        onMouseEnter={() => setShowControls(true)}
        onMouseLeave={() => setShowControls(false)}
      >
        <video
          ref={localRef}
          src={src}
          className={className ? `${styles.video} ${className}` : styles.video}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onPlay={() => {
            if (onPlay) onPlay();
            if (localRef.current) {
              delete localRef.current.dataset.userPaused;
            }
          }}
          onPause={() => {
            if (onPause) onPause();
            if (localRef.current) {
              localRef.current.dataset.userPaused = "true";
            }
          }}
          muted={muted}
          autoPlay={autoPlay}
          loop={loop}
          playsInline={playsInline}
          style={{ borderRadius: 8, ...style }}
          // Không xử lý play/pause ở đây nữa, chỉ dùng overlay icon
        />
        {/* Center play/pause icon overlay */}
        {(showControls || (localRef.current && localRef.current.paused)) && (
          <div
            className={styles.centerIconOverlay}
            style={{ pointerEvents: "auto", cursor: "pointer" }}
            onClick={handlePlayPause}
          >
            {localRef.current && localRef.current.paused ? (
              <HiMiniPlay className={styles.centerIcon} />
            ) : (
              <BsPause className={styles.centerIcon} />
            )}
          </div>
        )}
        {caption && <div className={styles.caption}>{caption}</div>}
        {showControls && (
          <div className={styles.controls}>
            <button onClick={onPlayPauseClick || handlePlayPause} type="button">
              {localRef.current && !localRef.current.paused ? (
                <BsPause />
              ) : (
                <HiMiniPlay />
              )}
            </button>
            <span className={styles.time}>
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
            <input
              type="range"
              min={0}
              max={duration || 0}
              value={currentTime}
              step={0.1}
              onChange={handleSeek}
              className={styles.progress}
            />
            <button onClick={handleFullscreen}>
              <FaExpand />
            </button>
          </div>
        )}
      </div>
    );
  }
);
VideoPlayer.displayName = "VideoPlayer";

export default VideoPlayer;
