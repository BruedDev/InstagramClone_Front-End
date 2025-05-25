"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  X,
  Play,
  Pause,
  Volume2,
  VolumeX,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import Image from "next/image";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Keyboard, EffectCoverflow } from "swiper/modules";
import type { Swiper as SwiperType } from "swiper";

// Import Swiper styles
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/effect-coverflow";

const StoryShow = () => {
  const [activeIndex, setActiveIndex] = useState(2);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [windowWidth, setWindowWidth] = useState<number>(0);
  const swiperRef = useRef<SwiperType | null>(null);

  // Track window width for responsive behavior
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    handleResize(); // Set initial width
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const stories = [
    {
      id: 1,
      username: "nsdocnotheplug",
      timeAgo: "2h",
      image:
        "https://images.unsplash.com/photo-1540553016722-983e48a2cd10?w=400&h=600&fit=crop",
      type: "image",
    },
    {
      id: 2,
      username: "openaidalle",
      timeAgo: "3h",
      image:
        "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=600&fit=crop",
      type: "image",
    },
    {
      id: 3,
      username: "cocacola",
      handle: "@openaidalle",
      timeAgo: "3h",
      image:
        "https://images.unsplash.com/photo-1629198688000-71f23e745b6e?w=400&h=600&fit=crop",
      isMain: true,
      type: "image",
    },
    {
      id: 4,
      username: "lewishamilton",
      timeAgo: "9h",
      image:
        "https://images.unsplash.com/photo-1574481793019-d4282ebe4f26?w=400&h=600&fit=crop",
      type: "video",
    },
    {
      id: 5,
      username: "wahab.xyz",
      timeAgo: "10h",
      image:
        "https://images.unsplash.com/photo-1549692520-acc6669e2f0c?w=400&h=600&fit=crop",
      type: "image",
    },
    {
      id: 6,
      username: "defavours",
      timeAgo: "22h",
      image:
        "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400&h=600&fit=crop",
      type: "image",
    },
  ];

  const isMobile = windowWidth <= 480;

  const handlePrevious = () => {
    swiperRef.current?.slidePrev();
  };

  const handleNext = () => {
    swiperRef.current?.slideNext();
  };

  const handleSlideChange = (swiper: SwiperType) => {
    setActiveIndex(swiper.activeIndex);
  };

  const handleStoryClick = (e: React.MouseEvent, index: number) => {
    if (index === activeIndex) {
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const width = rect.width;

      if (clickX < width / 2) {
        handlePrevious();
      } else {
        handleNext();
      }
    } else {
      swiperRef.current?.slideTo(index);
    }
  };

  return (
    <div
      className="h-screen bg-black overflow-hidden"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 996,
        overflow: "hidden",
      }}
    >
      {/* Close Button */}
      <button className="absolute top-4 right-4 md:top-6 md:right-6 z-50 p-2 hover:bg-gray-800 rounded-full transition-colors">
        <X size={20} className="text-white md:w-6 md:h-6" />
      </button>

      {/* Navigation Buttons */}
      {!isMobile && (
        <>
          <button
            onClick={handlePrevious}
            className="absolute left-2 md:left-8 top-1/2 transform -translate-y-1/2 z-40 p-2 md:p-3 bg-black bg-opacity-50 hover:bg-opacity-70 rounded-full transition-all"
          >
            <ChevronLeft size={20} className="text-white md:w-6 md:h-6" />
          </button>

          <button
            onClick={handleNext}
            className="absolute right-2 md:right-8 top-1/2 transform -translate-y-1/2 z-40 p-2 md:p-3 bg-black bg-opacity-50 hover:bg-opacity-70 rounded-full transition-all"
          >
            <ChevronRight size={20} className="text-white md:w-6 md:h-6" />
          </button>
        </>
      )}

      {/* Swiper Container */}
      <div className="w-full h-full">
        <div className="w-full h-full overflow-hidden">
          <Swiper
            modules={[Navigation, Keyboard, EffectCoverflow]}
            onSwiper={(swiper) => {
              swiperRef.current = swiper;
            }}
            onSlideChange={handleSlideChange}
            initialSlide={activeIndex}
            centeredSlides={true} // Base setting
            slidesPerView={isMobile ? 1 : "auto"}
            spaceBetween={isMobile ? 0 : 16}
            keyboard={{
              enabled: true,
            }}
            effect={isMobile ? undefined : "coverflow"}
            coverflowEffect={
              !isMobile
                ? {
                    rotate: 0,
                    stretch: 0,
                    depth: 100,
                    modifier: 1,
                    slideShadows: false,
                  }
                : undefined
            }
            observer={true} // Added: Re-calc on component/children mutations
            observeParents={true} // Added: Re-calc on parent mutations
            breakpoints={{
              320: {
                spaceBetween: 0,
                slidesPerView: 1,
                centeredSlides: true, // Reverted to true for mobile, combined with observer props
              },
              481: {
                spaceBetween: 8,
                slidesPerView: "auto",
                centeredSlides: true,
              },
              768: {
                spaceBetween: 16,
                slidesPerView: "auto",
                centeredSlides: true,
              },
              1024: {
                spaceBetween: 24,
                slidesPerView: "auto",
                centeredSlides: true,
              },
            }}
            className="w-full h-full"
            style={{
              display: "flex",
              alignItems: "center",
              overflow: "hidden",
            }}
          >
            {stories.map((story, index) => {
              const isActive = index === activeIndex;

              return (
                <SwiperSlide
                  key={story.id}
                  className={`${
                    isMobile ? "!w-full" : "!w-auto"
                  } !h-full !flex !items-center !justify-center`}
                >
                  <div
                    onClick={(e) => handleStoryClick(e, index)}
                    className={`relative cursor-pointer transition-all duration-500 ease-out ${
                      isMobile
                        ? "w-full h-full max-h-screen"
                        : isActive
                        ? "w-[280px] h-[500px] sm:w-[320px] sm:h-[560px] md:w-[360px] md:h-[640px] z-30"
                        : "w-[200px] h-[320px] sm:w-[220px] sm:h-[350px] md:w-[240px] md:h-[380px] z-20"
                    }`}
                    style={{
                      maxHeight: isMobile ? "100vh" : undefined,
                    }}
                  >
                    <div
                      className={`relative w-full h-full bg-gray-900 overflow-hidden border-2 transition-all duration-500 ${
                        isMobile
                          ? "border-none rounded-none"
                          : isActive
                          ? "border-white shadow-2xl scale-100 opacity-100 rounded-xl md:rounded-2xl"
                          : "border-gray-600 shadow-lg scale-90 opacity-60 hover:opacity-80 rounded-xl md:rounded-2xl"
                      }`}
                    >
                      {/* Story Media Container */}
                      <div className="relative w-full h-full">
                        {story.type === "video" ? (
                          <video
                            className="w-full h-full object-cover"
                            autoPlay={isActive && isPlaying}
                            muted={isMuted}
                            loop
                            playsInline
                          >
                            <source src={story.image} type="video/mp4" />
                          </video>
                        ) : (
                          <Image
                            src={story.image}
                            alt={`${story.username} story`}
                            fill
                            className="object-cover"
                            sizes={
                              isMobile ? "100vw" : isActive ? "360px" : "240px"
                            }
                            priority={isActive}
                          />
                        )}
                      </div>

                      {/* Active Story Overlay */}
                      {isActive && (
                        <>
                          {/* Progress Bars */}
                          <div className="absolute top-3 md:top-4 left-3 md:left-4 right-3 md:right-4 flex space-x-1 z-30">
                            {Array.from({ length: 3 }).map((_, i) => (
                              <div
                                key={i}
                                className="flex-1 h-0.5 bg-gray-600 rounded-full"
                              >
                                <div
                                  className={`h-full bg-white rounded-full transition-all duration-1000 ${
                                    i === 0
                                      ? "w-full"
                                      : i === 1
                                      ? "w-2/3"
                                      : "w-0"
                                  }`}
                                />
                              </div>
                            ))}
                          </div>

                          {/* Story Header */}
                          <div className="absolute top-6 md:top-8 left-3 md:left-4 right-3 md:right-4 flex items-center justify-between z-30">
                            <div className="flex items-center space-x-2 md:space-x-3">
                              <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 p-0.5">
                                <div className="w-full h-full rounded-full bg-gray-800 flex items-center justify-center">
                                  <span className="text-xs font-bold text-white">
                                    {story.username.charAt(0).toUpperCase()}
                                  </span>
                                </div>
                              </div>
                              <div>
                                <div className="flex items-center space-x-1 md:space-x-2">
                                  <span className="text-xs md:text-sm font-semibold text-white">
                                    {story.username}
                                  </span>
                                  {story.handle && (
                                    <span className="text-xs text-gray-300 hidden sm:inline">
                                      {story.handle}
                                    </span>
                                  )}
                                </div>
                                <span className="text-xs text-gray-300">
                                  {story.timeAgo}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2 md:space-x-3">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setIsPlaying(!isPlaying);
                                }}
                                className="p-1 hover:bg-gray-700 rounded-full transition-colors"
                              >
                                {isPlaying ? (
                                  <Pause
                                    size={14}
                                    className="text-white md:w-4 md:h-4"
                                  />
                                ) : (
                                  <Play
                                    size={14}
                                    className="text-white md:w-4 md:h-4"
                                  />
                                )}
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setIsMuted(!isMuted);
                                }}
                                className="p-1 hover:bg-gray-700 rounded-full transition-colors"
                              >
                                {isMuted ? (
                                  <VolumeX
                                    size={14}
                                    className="text-white md:w-4 md:h-4"
                                  />
                                ) : (
                                  <Volume2
                                    size={14}
                                    className="text-white md:w-4 md:h-4"
                                  />
                                )}
                              </button>
                              <button
                                onClick={(e) => e.stopPropagation()}
                                className="p-1 hover:bg-gray-700 rounded-full transition-colors"
                              >
                                <MoreHorizontal
                                  size={14}
                                  className="text-white md:w-4 md:h-4"
                                />
                              </button>
                            </div>
                          </div>

                          {/* Coca Cola Content Overlay for main story */}
                          {story.isMain && (
                            <div className="absolute inset-0 flex items-center justify-center z-20">
                              <div className="text-center px-3 md:px-4">
                                <div className="relative">
                                  {/* Colorful confetti dots */}
                                  <div className="absolute inset-0 w-64 h-64 md:w-96 md:h-96 -top-20 md:-top-32 -left-4 md:-left-8">
                                    {Array.from({ length: 40 }).map((_, i) => (
                                      <div
                                        key={i}
                                        className={`absolute w-2 h-2 md:w-3 md:h-3 rounded-full animate-pulse ${
                                          [
                                            "bg-red-400",
                                            "bg-pink-400",
                                            "bg-orange-400",
                                            "bg-yellow-400",
                                            "bg-green-400",
                                            "bg-blue-400",
                                            "bg-purple-400",
                                            "bg-indigo-400",
                                          ][i % 8]
                                        }`}
                                        style={{
                                          left: `${Math.random() * 100}%`,
                                          top: `${Math.random() * 100}%`,
                                          animationDelay: `${
                                            Math.random() * 3
                                          }s`,
                                        }}
                                      />
                                    ))}
                                  </div>

                                  {/* Main content */}
                                  <div className="relative">
                                    {/* Coca Cola Bottle */}
                                    <div className="mx-auto mb-4 md:mb-6 w-16 h-24 md:w-24 md:h-36 relative">
                                      {/* Bottle body */}
                                      <div className="absolute top-4 md:top-6 left-1/2 transform -translate-x-1/2 w-14 h-18 md:w-20 md:h-28 bg-red-600 rounded-2xl md:rounded-3xl"></div>
                                      {/* Bottle neck */}
                                      <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-6 h-8 md:w-8 md:h-12 bg-red-600 rounded-t-lg"></div>
                                      {/* Bottle cap */}
                                      <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-7 h-3 md:w-10 md:h-4 bg-red-700 rounded-full"></div>
                                      {/* Label */}
                                      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-12 h-6 md:w-16 md:h-8 bg-white rounded-lg flex items-center justify-center">
                                        <span className="text-red-600 font-bold text-xs">
                                          Coca Cola
                                        </span>
                                      </div>
                                    </div>

                                    {/* Text content */}
                                    <div className="bg-black bg-opacity-40 backdrop-blur-sm rounded-xl md:rounded-2xl p-3 md:p-4">
                                      <p className="text-white text-sm md:text-lg font-bold mb-1 md:mb-2">
                                        @cocacola x @openaidalle
                                      </p>
                                      <p className="text-white text-xs md:text-sm font-medium">
                                        Real Magic AI art by me
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </>
                      )}

                      {/* Non-active story info - only show on larger screens */}
                      {!isActive && !isMobile && (
                        <div className="absolute bottom-3 md:bottom-4 left-3 md:left-4 right-3 md:right-4 z-20">
                          <div className="flex items-center space-x-2">
                            <div className="w-5 h-5 md:w-6 md:h-6 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 p-0.5">
                              <div className="w-full h-full rounded-full bg-gray-800 flex items-center justify-center">
                                <span className="text-xs font-bold text-white">
                                  {story.username.charAt(0).toUpperCase()}
                                </span>
                              </div>
                            </div>
                            <div>
                              <span className="text-xs md:text-sm font-semibold text-white block">
                                {story.username}
                              </span>
                              <span className="text-xs text-gray-300">
                                {story.timeAgo}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Click Areas for Mobile Navigation (invisible) */}
                      {isMobile && isActive && (
                        <>
                          <div className="absolute left-0 top-0 w-1/2 h-full z-10" />
                          <div className="absolute right-0 top-0 w-1/2 h-full z-10" />
                        </>
                      )}
                    </div>
                  </div>
                </SwiperSlide>
              );
            })}
          </Swiper>
        </div>
      </div>
    </div>
  );
};

export default StoryShow;
