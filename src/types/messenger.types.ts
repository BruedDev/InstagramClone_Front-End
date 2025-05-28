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
  before?: string; // Thay offset bằng before (timestamp)
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
  userStatus: unknown | null;
  checkingStatus: boolean;
  timestamp: number;
  duration?: number;
  status: "missed" | "answered" | "outgoing";
  // Thêm dòng này để hỗ trợ lưu userId đã fetch gần nhất
  lastFetchedUserId?: string;
}


export type PeerInstanceConfig = {
  peer: RTCPeerConnection;
  iceData?: Record<string, unknown>;
};

export type IceServersObjectConfig = {
  iceServers: RTCIceServer[];
  iceData?: Record<string, unknown>;
};

export type IceServersArrayConfig = RTCIceServer[];

export type CreatePeerConnectionReturn =
  | PeerInstanceConfig
  | IceServersObjectConfig
  | IceServersArrayConfig
  | null;