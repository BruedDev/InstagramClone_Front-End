"use client";

import { useEffect, useState, useCallback, useRef } from "react";

interface VirtualizedPostListProps<T extends { _id?: string | number }> {
  posts: T[];
  renderPost: (post: T, index: number) => React.ReactNode;
  itemHeight?: number;
  overscan?: number;
  onLoadMore?: () => void;
  loading?: boolean;
  renderSkeleton?: (index: number) => React.ReactNode;
}

export default function VirtualizedPostList<
  T extends { _id?: string | number }
>({
  posts,
  renderPost,
  itemHeight = 600,
  overscan = 3,
  onLoadMore,
  loading = false,
}: VirtualizedPostListProps<T>) {
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);
  const [itemHeights, setItemHeights] = useState<Map<number, number>>(
    new Map()
  );
  const itemRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const containerRef = useRef<HTMLDivElement>(null);

  // Lấy thông tin container từ window
  useEffect(() => {
    const updateDimensions = () => {
      setContainerHeight(window.innerHeight);
    };
    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, []);

  // Lắng nghe scroll từ window
  useEffect(() => {
    const handleScroll = () => {
      setScrollTop(window.scrollY);
      // Load more khi scroll gần cuối trang
      const scrollHeight = document.documentElement.scrollHeight;
      const clientHeight = window.innerHeight;
      if (
        scrollHeight - window.scrollY <= clientHeight + 1000 &&
        !loading &&
        onLoadMore
      ) {
        onLoadMore();
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [onLoadMore, loading]);

  // Measure item heights
  const measureItem = useCallback(
    (index: number, element: HTMLDivElement | null) => {
      if (element) {
        itemRefs.current.set(index, element);
        const rect = element.getBoundingClientRect();
        const height = rect.height;
        setItemHeights((prev) => {
          const newMap = new Map(prev);
          if (newMap.get(index) !== height) {
            newMap.set(index, height);
            return newMap;
          }
          return prev;
        });
      }
    },
    []
  );

  // Tính toán vị trí của container này trong body
  const getContainerOffset = useCallback(() => {
    if (!containerRef.current) return 0;
    const containerRect = containerRef.current.getBoundingClientRect();
    // Khoảng cách từ top của container đến top của viewport + scrollY
    return containerRect.top + window.scrollY;
  }, []);

  // Tính toán items hiển thị dựa trên scroll position
  const getVisibleRange = useCallback(() => {
    const containerOffset = getContainerOffset();
    const visibleStart = Math.max(0, scrollTop - containerOffset);
    const visibleEnd = visibleStart + containerHeight;
    let startIndex = 0;
    let endIndex = 0;
    let accumulatedHeight = 0;
    // Tìm start index
    for (let i = 0; i < posts.length; i++) {
      const height = itemHeights.get(i) || itemHeight;
      if (accumulatedHeight + height > visibleStart) {
        startIndex = Math.max(0, i - overscan);
        break;
      }
      accumulatedHeight += height;
    }
    // Tìm end index
    accumulatedHeight = 0;
    for (let i = 0; i < posts.length; i++) {
      const height = itemHeights.get(i) || itemHeight;
      accumulatedHeight += height;
      if (accumulatedHeight > visibleEnd && i >= startIndex) {
        endIndex = Math.min(posts.length - 1, i + overscan);
        break;
      }
    }
    if (endIndex === 0) {
      endIndex = Math.min(
        posts.length - 1,
        startIndex + Math.ceil(containerHeight / itemHeight) + overscan
      );
    }
    return { startIndex, endIndex };
  }, [
    posts.length,
    itemHeights,
    itemHeight,
    scrollTop,
    containerHeight,
    overscan,
    getContainerOffset,
  ]);

  // Tính toán layout
  const getLayoutInfo = useCallback(() => {
    const { startIndex, endIndex } = getVisibleRange();
    let offsetY = 0;
    for (let i = 0; i < startIndex; i++) {
      offsetY += itemHeights.get(i) || itemHeight;
    }
    let totalHeight = 0;
    for (let i = 0; i < posts.length; i++) {
      totalHeight += itemHeights.get(i) || itemHeight;
    }
    return { startIndex, endIndex, offsetY, totalHeight };
  }, [getVisibleRange, itemHeights, itemHeight, posts.length]);

  const { startIndex, endIndex, offsetY, totalHeight } = getLayoutInfo();
  const visibleItems = posts.slice(startIndex, endIndex + 1);

  return (
    <div
      ref={containerRef}
      style={{
        height: totalHeight,
        position: "relative",
        width: "100%",
      }}
    >
      <div
        style={{
          transform: `translateY(${offsetY}px)`,
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
        }}
      >
        {visibleItems.map((post, i) => {
          const actualIndex = startIndex + i;
          return (
            <div
              key={post._id ?? actualIndex}
              ref={(el) => measureItem(actualIndex, el)}
              style={{
                minHeight: itemHeight,
                width: "100%",
              }}
            >
              {renderPost(post, actualIndex)}
            </div>
          );
        })}
      </div>
    </div>
  );
}
