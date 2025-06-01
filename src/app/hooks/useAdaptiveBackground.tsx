// hooks/useAdaptiveBackground.ts
import { useState, useEffect, useRef } from "react";
import {
  detectImageBackgroundColor,
  BackgroundColorResult,
} from "@/utils/colorAnalyzer";

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

export const useAdaptiveBackground = (
  stories: Story[],
  currentIndex: number
) => {
  const [slideBackgrounds, setSlideBackgrounds] = useState<
    Record<string, string>
  >({});
  const processedStories = useRef<Set<string>>(new Set());

  useEffect(() => {
    const currentStory = stories[currentIndex];
    if (!currentStory) return;

    // Chỉ xử lý image stories (không xử lý video)
    if (!currentStory.mediaType.startsWith("image")) return;

    // Đã xử lý rồi thì skip
    if (processedStories.current.has(currentStory._id)) return;

    const img = new Image();
    img.crossOrigin = "anonymous"; // Để tránh CORS issues

    const analyzeImage = async () => {
      try {
        const result: BackgroundColorResult = await detectImageBackgroundColor(
          img
        );

        setSlideBackgrounds((prev) => ({
          ...prev,
          [currentStory._id]: result.backgroundColor,
        }));

        processedStories.current.add(currentStory._id);
      } catch (error) {
        console.error("Failed to analyze image background:", error);
        // Fallback to default
        setSlideBackgrounds((prev) => ({
          ...prev,
          [currentStory._id]: "#0d1015",
        }));
        processedStories.current.add(currentStory._id);
      }
    };

    img.onload = analyzeImage;
    img.onerror = () => {
      // Fallback nếu load image thất bại
      setSlideBackgrounds((prev) => ({
        ...prev,
        [currentStory._id]: "#0d1015",
      }));
      processedStories.current.add(currentStory._id);
    };

    img.src = currentStory.mediaUrl;

    // Cleanup
    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [stories, currentIndex]);

  // Preload backgrounds cho các story xung quanh current story
  useEffect(() => {
    const preloadIndexes = [];

    // Preload prev và next story
    if (currentIndex > 0) preloadIndexes.push(currentIndex - 1);
    if (currentIndex < stories.length - 1)
      preloadIndexes.push(currentIndex + 1);

    preloadIndexes.forEach((index) => {
      const story = stories[index];
      if (!story || !story.mediaType.startsWith("image")) return;
      if (processedStories.current.has(story._id)) return;

      const img = new Image();
      img.crossOrigin = "anonymous";

      const preloadAnalyze = async () => {
        try {
          const result: BackgroundColorResult =
            await detectImageBackgroundColor(img);

          setSlideBackgrounds((prev) => ({
            ...prev,
            [story._id]: result.backgroundColor,
          }));

          processedStories.current.add(story._id);
        } catch {
          setSlideBackgrounds((prev) => ({
            ...prev,
            [story._id]: "#0d1015",
          }));
          processedStories.current.add(story._id);
        }
      };

      img.onload = preloadAnalyze;
      img.onerror = () => {
        setSlideBackgrounds((prev) => ({
          ...prev,
          [story._id]: "#0d1015",
        }));
        processedStories.current.add(story._id);
      };

      img.src = story.mediaUrl;
    });
  }, [currentIndex, stories]);

  const getSlideBackground = (storyId: string, mediaType: string): string => {
    // Video luôn dùng màu mặc định
    if (mediaType.startsWith("video")) {
      return "#0d1015";
    }

    // Image thì dùng màu đã phân tích hoặc default
    return slideBackgrounds[storyId] || "#0d1015";
  };

  return { getSlideBackground };
};
