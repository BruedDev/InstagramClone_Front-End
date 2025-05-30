import React, { useState, useEffect, useCallback } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { FreeMode } from "swiper/modules";
import styles from "./StoryUserHome.module.scss";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchStoryHome } from "@/store/story";
import { getViewedAuthors } from "@/utils/storyLocalStorage";
import { useStory } from "@/contexts/StoryContext";
import "swiper/css";
import "swiper/css/free-mode";
import StoryAvatar from "@/components/Story/StoryAvatar";
import AddStoryItem from "./AddStoryItem";
import SeketonStory from "./seketonStory";

interface StoryAuthor {
  _id: string;
  username: string;
  profilePicture?: string;
  checkMark?: boolean;
}

export default function StoryUserHome() {
  const dispatch = useAppDispatch();
  const { openStory, viewedStatusVersion } = useStory();
  const { stories, loading, error } = useAppSelector((state) => state.story);
  const [viewedAuthors, setViewedAuthors] = useState<string[]>([]);

  useEffect(() => {
    dispatch(fetchStoryHome());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setViewedAuthors(getViewedAuthors());
  }, [viewedStatusVersion]);

  const handleStoryClick = useCallback(
    async (author: StoryAuthor, initialIndex: number = 0) => {
      if (author && author._id) {
        if (!viewedAuthors.includes(author._id)) {
          setViewedAuthors((prev) => [...prev, author._id]);
        }
      }
      await openStory(author, initialIndex);
    },
    [openStory, viewedAuthors] // viewedAuthors vẫn cần thiết nếu bạn giữ lại logic cập nhật UI ngay lập tức
  );

  if (loading && stories.length === 0) {
    // Chỉ hiển thị skeleton khi đang loading và chưa có stories
    return <SeketonStory />;
  }

  if (error) {
    return (
      <div className={`w-full ${styles.container}`}>
        <div className="px-4 py-3 text-center text-red-500">{error}</div>
      </div>
    );
  }

  return (
    <div className={`w-full ${styles.container}`}>
      <div className="px-4 py-3">
        <Swiper
          modules={[FreeMode]}
          slidesPerView="auto"
          spaceBetween={16}
          freeMode={true}
          className="!overflow-visible"
        >
          <SwiperSlide key="add-story" className="!w-auto">
            <AddStoryItem />
          </SwiperSlide>

          {stories.map((grouped) => (
            <SwiperSlide key={grouped.author._id} className="!w-auto">
              <StoryAvatar
                author={grouped.author}
                hasStories={grouped.stories.length > 0}
                hasViewed={viewedAuthors.includes(grouped.author._id)}
                size="medium"
                showUsername={true}
                onClick={() => handleStoryClick(grouped.author, 0)}
              />
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </div>
  );
}
