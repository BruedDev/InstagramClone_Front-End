"use client";

import { useRef, ReactNode } from "react";
import { ScrollContainerContext } from "@/contexts/ScrollContainerContext";
import layoutStyles from "@/app/(Layout)/Layout.module.scss";

interface ScrollableAreaProps {
  children: ReactNode;
}

export default function ScrollableArea({ children }: ScrollableAreaProps) {
  const scrollableContainerRef = useRef<HTMLDivElement>(null);

  return (
    <ScrollContainerContext.Provider value={scrollableContainerRef}>
      <div ref={scrollableContainerRef} className={layoutStyles.container}>
        {children}
      </div>
    </ScrollContainerContext.Provider>
  );
}
