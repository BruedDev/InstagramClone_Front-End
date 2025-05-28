// contexts/StoryContext.tsx
"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useEffect,
} from "react";
import { useAppDispatch } from "@/store/hooks";
import { getStoryById } from "@/store/story";
import StoryModal from "@/components/Modal/StoryModal";
import { Story } from "@/types/story.type";

interface AuthorType {
  _id: string;
  username: string;
  profilePicture?: string;
  checkMark?: boolean;
}

interface StoryModalType {
  _id: string;
  mediaUrl: string;
  mediaType: "image" | "video";
  audioUrl?: string;
  createdAt: string;
  audioDuration?: number;
  muteOriginalAudio?: boolean;
}

const VIEWED_AUTHORS_KEY = "viewedStoryAuthors";

const getIsAuthorViewedFromStorage = (authorId: string): boolean => {
  if (typeof window === "undefined") return false;
  try {
    const viewedAuthors: string[] = JSON.parse(
      localStorage.getItem(VIEWED_AUTHORS_KEY) || "[]"
    );
    return viewedAuthors.includes(authorId);
  } catch (e) {
    console.error("Error reading viewed status from localStorage", e);
    return false;
  }
};

const markAuthorAsViewedInStorage = (authorId: string): boolean => {
  if (typeof window === "undefined") return false;
  try {
    const viewedAuthors: string[] = JSON.parse(
      localStorage.getItem(VIEWED_AUTHORS_KEY) || "[]"
    );
    if (!viewedAuthors.includes(authorId)) {
      viewedAuthors.push(authorId);
      localStorage.setItem(VIEWED_AUTHORS_KEY, JSON.stringify(viewedAuthors));
      return true;
    }
    return false;
  } catch (e) {
    console.error("Error writing viewed status to localStorage", e);
    return false;
  }
};

interface StoryContextType {
  openStory: (author: AuthorType, initialIndex?: number) => Promise<void>;
  isLoading: boolean;
  isAuthorViewed: (authorId: string) => boolean;
  viewedStatusVersion: number;
}

const StoryContext = createContext<StoryContextType | undefined>(undefined);

export const useStory = () => {
  const context = useContext(StoryContext);
  if (!context) {
    throw new Error("useStory must be used within a StoryProvider");
  }
  return context;
};

export const StoryProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const dispatch = useAppDispatch();
  const [showModal, setShowModal] = useState(false);
  const [modalAuthor, setModalAuthor] = useState<AuthorType | null>(null);
  const [modalInitialIndex, setModalInitialIndex] = useState(0);
  const [modalStories, setModalStories] = useState<StoryModalType[]>([]);
  const [modalDurations, setModalDurations] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [viewedStatusVersion, setViewedStatusVersion] = useState(0);

  // Ref để lưu trữ ID của setTimeout
  const modalDisplayTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const isAuthorViewed = useCallback((authorId: string) => {
    return getIsAuthorViewedFromStorage(authorId);
  }, []);

  const openStory = useCallback(
    async (author: AuthorType, initialIndex: number = 0) => {
      if (isLoading) return;

      setIsLoading(true); // Đặt isLoading thành true ngay lập tức
      setModalAuthor(author);
      setModalInitialIndex(initialIndex);

      // Hủy timeout cũ nếu có (ví dụ: người dùng click rất nhanh nhiều lần)
      if (modalDisplayTimeoutRef.current) {
        clearTimeout(modalDisplayTimeoutRef.current);
      }

      try {
        const result = await dispatch(getStoryById(author._id));

        if (getStoryById.fulfilled.match(result)) {
          const stories = result.payload;
          const transformedStories = stories
            .filter((s: Story) => {
              const story = s as unknown as {
                media: string;
                mediaType: string;
              };
              return story.media && story.mediaType;
            })
            .map((s: Story) => {
              const story = s as unknown as {
                _id: string;
                media: string;
                mediaType: string;
                audio?: string;
                audioDuration?: number;
                muteOriginalAudio?: boolean;
                createdAt: string;
              };
              let type: "image" | "video" = "image";
              if (story.mediaType.includes("video")) type = "video";
              else if (story.mediaType.includes("image")) type = "image";
              return {
                _id: story._id,
                mediaUrl: story.media,
                mediaType: type,
                audioUrl: story.audio,
                audioDuration: story.audioDuration,
                muteOriginalAudio: story.muteOriginalAudio,
                createdAt: story.createdAt,
              };
            });

          if (transformedStories.length > 0) {
            setModalStories(transformedStories);
            setModalDurations(
              transformedStories.map(
                (s: StoryModalType) => s.audioDuration || 5
              )
            );
            // Không setShowModal(true) ngay mà đợi 1 giây
            modalDisplayTimeoutRef.current = setTimeout(() => {
              setShowModal(true);
              const markedChanged = markAuthorAsViewedInStorage(author._id);
              if (markedChanged) {
                setViewedStatusVersion((prev) => prev + 1);
              }
              setIsLoading(false); // Đặt isLoading thành false SAU KHI modal hiển thị
              modalDisplayTimeoutRef.current = null; // Xóa ref sau khi timeout chạy
            }, 1000); // Đợi 1 giây (1000ms)
          } else {
            setModalAuthor(null);
            setIsLoading(false); // Không có story, đặt isLoading thành false
          }
        } else {
          console.error("Failed to fetch stories:", result.error);
          setModalAuthor(null);
          setIsLoading(false); // Lỗi fetch, đặt isLoading thành false
        }
      } catch (error) {
        console.error("Lỗi khi mở story:", error);
        setModalAuthor(null);
        setIsLoading(false); // Lỗi, đặt isLoading thành false
      }
      // KHÔNG đặt setIsLoading(false) trong finally ở đây nữa,
      // vì nó sẽ được xử lý trong setTimeout hoặc các nhánh lỗi.
    },
    [dispatch, isLoading] // isLoading vẫn cần thiết ở đây để useCallback biết khi nào cần tạo lại hàm nếu nó thay đổi
  );

  const handleCloseModal = useCallback(() => {
    setShowModal(false);
    setModalAuthor(null);
    setModalStories([]);
    setModalDurations([]);
    setModalInitialIndex(0);
    // Nếu modal được đóng trong khi timeout đang chờ, hủy timeout và reset isLoading
    if (modalDisplayTimeoutRef.current) {
      clearTimeout(modalDisplayTimeoutRef.current);
      modalDisplayTimeoutRef.current = null;
      setIsLoading(false); // Đảm bảo isLoading được reset
    }
  }, []);

  // Cleanup timeout khi component unmount
  useEffect(() => {
    return () => {
      if (modalDisplayTimeoutRef.current) {
        clearTimeout(modalDisplayTimeoutRef.current);
      }
    };
  }, []);

  return (
    <StoryContext.Provider
      value={{ openStory, isLoading, isAuthorViewed, viewedStatusVersion }}
    >
      {children}
      {showModal && modalStories.length > 0 && modalAuthor && (
        <StoryModal
          open={showModal}
          onClose={handleCloseModal}
          stories={modalStories}
          author={modalAuthor}
          initialIndex={modalInitialIndex}
          durations={modalDurations}
        />
      )}
    </StoryContext.Provider>
  );
};
