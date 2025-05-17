// src/types/messenger.types.ts
import { User, Message } from "./user.type";

// Cập nhật trong MessengerState.type.ts
export interface MessengerState {
  availableUsers: User[];
  selectedUser: User | null;
  messages: Message[];
  message: string;
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  offset: number;
  showMainChat: boolean;
  ringtoneRef: React.RefObject<HTMLAudioElement | null>;
  // Call states
  inCall: boolean;
  incoming: {
    callerId: string;
    callType: "audio" | "video";
  } | null;
  callHistory: {
    userId: string;
    callType: "audio" | "video";
    timestamp: number;
    duration?: number;
    status: "missed" | "answered" | "outgoing";
  }[];
}