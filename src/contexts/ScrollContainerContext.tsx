"use client";

import { createContext, RefObject } from "react";

export const ScrollContainerContext =
  createContext<RefObject<HTMLDivElement | null> | null>(null);
