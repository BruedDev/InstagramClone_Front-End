import React, { useState, useEffect } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { FreeMode } from "swiper/modules";
import { getStoryHome } from "@/server/home";
import styles from "./StoryUserHome.module.scss";
import { UserStory } from "@/types/story.type";

// Import Swiper styles
import "swiper/css";
import "swiper/css/free-mode";
import StoryList from "./StoryList";
import AddStoryItem from "./AddStoryItem";
import SeketonStory from "./seketonStory";

export default function StoryUserHome() {
  const [stories, setStories] = useState<UserStory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStories = async () => {
      try {
        setLoading(true);
        const data = await getStoryHome();
        setStories(data);
        setError(null);
      } catch (err) {
        console.error("Error fetching stories:", err);
        setError("Không thể tải stories");
      } finally {
        setLoading(false);
      }
    };

    fetchStories();
  }, []);

  if (loading) {
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
      {/* Stories Container */}
      <div className="px-4 py-3">
        <Swiper
          modules={[FreeMode]}
          slidesPerView="auto"
          spaceBetween={16}
          freeMode={true}
          className="!overflow-visible"
        >
          {/* Thêm story mới */}
          <SwiperSlide key="add-story" className="!w-auto">
            <AddStoryItem />
          </SwiperSlide>

          {/* Stories list item */}
          {stories.map((userStory) => (
            <SwiperSlide key={userStory.user._id} className="!w-auto">
              <StoryList userStory={userStory} />
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </div>
  );
}
