// server/socket.ts (or your correct path)
"use client";

import { io, Socket } from "socket.io-client";

// --- Type Definitions (from your "after" code) ---
export type MessageData = {
  _id: string;
  message: string;
  senderId: string;
  receiverId: string;
  author?: {
    username: string;
    profilePicture?: string;
    checkMark?: boolean;
    lastActive?: string;
    lastOnline?: string;
    _id?: string;
  };
  createdAt: string;
  isRead: boolean;
  replyTo?:
    | string
    | {
        _id: string;
        message: string;
        senderId:
          | string
          | { _id: string; username?: string; fullName?: string };
        receiverId:
          | string
          | { _id: string; username?: string; fullName?: string };
        createdAt: string;
      }
    | null;
};

type GenericMessagePayload = {
  senderId: string;
  message: string;
  timestamp: string;
};

export type MessagesStatusUpdateData = {
  user: {
    _id: string;
    username: string;
    profilePicture?: string;
    checkMark: boolean;
    isOnline: boolean;
    lastActive: string;
    lastOnline: string;
  };
  messages: {
    messageId: string;
    isRead: boolean;
  }[];
};

// --- Socket Initialization ---
const API_URL = process.env.NEXT_PUBLIC_SOCKET_URL;
let socket: Socket | null = null;

export const socketService = {
  // initSocket remains mostly the same, responsible for the actual connection attempt.
  // It can return null if essential pre-conditions like API_URL aren't met.
  initSocket: (): Socket | null => {
    if (!API_URL) {
      console.warn("Socket URL is not defined. Socket initialization skipped.");
      return null;
    }
    if (!socket) {
      socket = io(API_URL, { transports: ["websocket"] });
      // Optional: Add listeners for connect, disconnect, connect_error for debugging
      // socket.on("connect", () => console.log("Socket connected:", socket?.id));
      // socket.on("disconnect", (reason) => console.log("Socket disconnected:", reason));
      // socket.on("connect_error", (error) => console.error("Socket connection error:", error));
    }
    return socket;
  },

  // MODIFIED: getSocket now returns Socket or throws an error.
  getSocket: (): Socket => {
    if (socket) {
      return socket; // Return existing socket if available
    }

    // Attempt to initialize if not already done
    const initializedSocket = socketService.initSocket();

    if (initializedSocket) {
      return initializedSocket; // Return newly initialized socket
    }

    // If socket is still null after attempting initialization, throw an error.
    // This ensures that any code calling getSocket().emit(...) will either get a
    // valid socket or an error will be thrown before trying to call .emit on null.
    throw new Error(
      "Socket is not initialized and failed to initialize. " +
        "Ensure NEXT_PUBLIC_SOCKET_URL is correctly configured and the server is reachable."
    );
  },

  // --- User and Message Methods ---
  registerUser: (userId: string) => {
    const currentSocket = socketService.getSocket(); // Returns Socket or throws
    currentSocket.emit("userOnline", userId);
    currentSocket.emit("joinUserRoom", userId);
  },

  sendMessage: (data: {
    senderId: string;
    receiverId: string;
    message: string;
    tempId?: string;
    replyTo?: string | null;
  }) => {
    const currentSocket = socketService.getSocket();
    currentSocket.emit("sendMessage", data);
  },

  onReceiveMessage: (callback: (msg: GenericMessagePayload) => void) => {
    const currentSocket = socketService.getSocket();
    currentSocket.on("receiveMessage", callback);
  },

  offReceiveMessage: (callback: (msg: GenericMessagePayload) => void) => {
    const currentSocket = socketService.getSocket();
    currentSocket.off("receiveMessage", callback);
  },

  onReceiveMessageSiderBar: (callback: (data: MessageData) => void) => {
    const currentSocket = socketService.getSocket();
    currentSocket.on("receiveMessage", callback as (data: MessageData) => void);
  },

  offReceiveMessageSiderBar: (callback: (data: MessageData) => void) => {
    const currentSocket = socketService.getSocket();
    currentSocket.off(
      "receiveMessage",
      callback as (data: MessageData) => void
    );
  },

  onMessagesStatusUpdate: (
    callback: (data: MessagesStatusUpdateData) => void
  ) => {
    const currentSocket = socketService.getSocket();
    currentSocket.on("messagesStatusUpdate", callback);
  },

  offMessagesStatusUpdate: (
    callback: (data: MessagesStatusUpdateData) => void
  ) => {
    const currentSocket = socketService.getSocket();
    currentSocket.off("messagesStatusUpdate", callback);
  },

  onUpdateRecentChat: (
    callback: (data: {
      userId: string;
      lastMessageId: string;
      isRead: boolean;
    }) => void
  ) => {
    const currentSocket = socketService.getSocket();
    currentSocket.on("updateRecentChat", callback);
  },

  offUpdateRecentChat: (
    callback: (data: {
      userId: string;
      lastMessageId: string;
      isRead: boolean;
    }) => void
  ) => {
    const currentSocket = socketService.getSocket();
    currentSocket.off("updateRecentChat", callback);
  },

  onUpdateMessageRead: (
    callback: (data: { messageId: string; chatUserId: string }) => void
  ) => {
    const currentSocket = socketService.getSocket();
    currentSocket.on("updateMessageRead", callback);
  },

  offUpdateMessageRead: (
    callback: (data: { messageId: string; chatUserId: string }) => void
  ) => {
    const currentSocket = socketService.getSocket();
    currentSocket.off("updateMessageRead", callback);
  },

  disconnect: () => {
    if (socket) {
      socket.disconnect();
      socket = null;
    }
  },

  // --- Call related methods ---
  callUser: (data: {
    to: string;
    from: string;
    signal: RTCSessionDescriptionInit;
  }) => {
    const currentSocket = socketService.getSocket();
    currentSocket.emit("callUser", data);
  },

  answerCall: (data: {
    to: string;
    from: string;
    signal: RTCSessionDescriptionInit;
  }) => {
    // This likely corresponds to "acceptCall"
    const currentSocket = socketService.getSocket();
    currentSocket.emit("answerCall", data);
  },

  // ADDED: rejectCall method
  rejectCall: (data: { to: string; from: string; reason?: string }) => {
    const currentSocket = socketService.getSocket();
    currentSocket.emit("rejectCall", data);
  },

  sendIceCandidate: (data: { to: string; candidate: RTCIceCandidate }) => {
    const currentSocket = socketService.getSocket();
    currentSocket.emit("iceCandidate", data);
  },

  endCall: (data: { to: string; from: string }) => {
    const currentSocket = socketService.getSocket();
    currentSocket.emit("endCall", data);
  },

  // Call Listeners
  onCallIncoming: (
    callback: (data: {
      from: string;
      signal: RTCSessionDescriptionInit;
    }) => void
  ) => {
    const currentSocket = socketService.getSocket();
    currentSocket.on("callIncoming", callback);
  },

  onCallAnswered: (
    callback: (data: {
      from: string;
      signal: RTCSessionDescriptionInit;
    }) => void
  ) => {
    const currentSocket = socketService.getSocket();
    currentSocket.on("callAnswered", callback);
  },

  // ADDED: onCallRejected listener
  onCallRejected: (
    callback: (data: { from: string; reason?: string }) => void
  ) => {
    const currentSocket = socketService.getSocket();
    currentSocket.on("callRejected", callback);
  },

  onIceCandidate: (
    callback: (data: { from: string; candidate: RTCIceCandidate }) => void
  ) => {
    const currentSocket = socketService.getSocket();
    currentSocket.on("iceCandidate", callback);
  },

  onCallEnded: (callback: (data: { from: string }) => void) => {
    const currentSocket = socketService.getSocket();
    currentSocket.on("callEnded", callback);
  },

  offCallListeners: () => {
    // It's safer to try-catch getSocket here if you want to gracefully handle no-socket scenarios for batch "off"
    // Or ensure calling code only calls offCallListeners when a socket is known to have existed.
    try {
      const currentSocket = socketService.getSocket();
      currentSocket.off("callIncoming");
      currentSocket.off("callAnswered");
      currentSocket.off("iceCandidate");
      currentSocket.off("callEnded");
      currentSocket.off("callRejected"); // Added
    } catch (error) {
      console.warn(
        "Could not turn off call listeners, socket not available:",
        error
      );
    }
  },

  // --- Room related methods for Posts/Reels ---
  joinPostRoom: (postId: string) => {
    const currentSocket = socketService.getSocket();
    currentSocket.emit("joinPostRoom", postId);
  },

  leavePostRoom: (postId: string) => {
    const currentSocket = socketService.getSocket();
    currentSocket.emit("leavePostRoom", postId);
  },

  joinReelRoom: (reelId: string) => {
    const currentSocket = socketService.getSocket();
    currentSocket.emit("joinReelRoom", reelId);
  },

  leaveReelRoom: (reelId: string) => {
    const currentSocket = socketService.getSocket();
    currentSocket.emit("leaveReelRoom", reelId);
  },

  // --- Comment related Emitters & Listeners (Structure from "after" code, using new getSocket) ---
  emitCommentTyping: (data: {
    itemId: string;
    itemType: "post" | "reel";
    user: { id: string; username: string; profilePicture?: string };
  }) => {
    const currentSocket = socketService.getSocket();
    currentSocket.emit("comment:typing", data);
  },
  emitCommentStopTyping: (data: {
    itemId: string;
    itemType: "post" | "reel";
    userId: string;
  }) => {
    const currentSocket = socketService.getSocket();
    currentSocket.emit("comment:stopTyping", data);
  },
  emitCommentCreate: (data: {
    authorId: string;
    itemId: string;
    itemType: "post" | "reel";
    text: string;
  }) => {
    const currentSocket = socketService.getSocket();
    currentSocket.emit("comment:create", data);
  },
  emitCommentEdit: (data: {
    commentId: string;
    newText: string;
    itemId: string;
    itemType: "post" | "reel";
  }) => {
    const currentSocket = socketService.getSocket();
    currentSocket.emit("comment:edit", data);
  },
  emitCommentDelete: (data: {
    commentId: string;
    itemId: string;
    itemType: "post" | "reel";
  }) => {
    const currentSocket = socketService.getSocket();
    currentSocket.emit("comment:delete", data);
  },
  emitCommentReact: (data: {
    commentId: string;
    reaction: string;
    user: { id: string; username: string; profilePicture?: string };
  }) => {
    const currentSocket = socketService.getSocket();
    currentSocket.emit("comment:react", data);
  },
  onCommentTyping: (
    callback: (data: {
      itemId: string;
      user: { id: string; username: string; profilePicture?: string };
    }) => void
  ) => {
    const currentSocket = socketService.getSocket();
    currentSocket.on("comment:typing", callback);
  },
  offCommentTyping: (
    callback: (data: {
      itemId: string;
      user: { id: string; username: string; profilePicture?: string };
    }) => void
  ) => {
    const currentSocket = socketService.getSocket();
    currentSocket.off("comment:typing", callback);
  },
  onCommentStopTyping: (
    callback: (data: { itemId: string; userId: string }) => void
  ) => {
    const currentSocket = socketService.getSocket();
    currentSocket.on("comment:stopTyping", callback);
  },
  offCommentStopTyping: (
    callback: (data: { itemId: string; userId: string }) => void
  ) => {
    const currentSocket = socketService.getSocket();
    currentSocket.off("comment:stopTyping", callback);
  },
  onCommentCreated: (
    callback: (data: {
      itemId: string;
      itemType: "post" | "reel";
      comment: {
        id: string;
        authorId: string;
        text: string;
        createdAt: string;
        updatedAt?: string;
        [key: string]: unknown;
      };
    }) => void
  ) => {
    const currentSocket = socketService.getSocket();
    currentSocket.on("comment:created", callback);
  },
  offCommentCreated: (
    callback: (data: {
      itemId: string;
      itemType: "post" | "reel";
      comment: {
        id: string;
        authorId: string;
        text: string;
        createdAt: string;
        updatedAt?: string;
        [key: string]: unknown;
      };
    }) => void
  ) => {
    const currentSocket = socketService.getSocket();
    currentSocket.off("comment:created", callback);
  },
  onCommentEdited: (
    callback: (data: {
      commentId: string;
      newText: string;
      itemId: string;
    }) => void
  ) => {
    const currentSocket = socketService.getSocket();
    currentSocket.on("comment:edited", callback);
  },
  offCommentEdited: (
    callback: (data: {
      commentId: string;
      newText: string;
      itemId: string;
    }) => void
  ) => {
    const currentSocket = socketService.getSocket();
    currentSocket.off("comment:edited", callback);
  },
  onCommentDeleted: (
    callback: (data: { commentId: string; itemId: string }) => void
  ) => {
    const currentSocket = socketService.getSocket();
    currentSocket.on("comment:deleted", callback);
  },
  offCommentDeleted: (
    callback: (data: { commentId: string; itemId: string }) => void
  ) => {
    const currentSocket = socketService.getSocket();
    currentSocket.off("comment:deleted", callback);
  },
  onCommentReacted: (
    callback: (data: {
      commentId: string;
      reaction: string;
      user: { id: string; username: string; profilePicture?: string };
    }) => void
  ) => {
    const currentSocket = socketService.getSocket();
    currentSocket.on("comment:reacted", callback);
  },
  offCommentReacted: (
    callback: (data: {
      commentId: string;
      reaction: string;
      user: { id: string; username: string; profilePicture?: string };
    }) => void
  ) => {
    const currentSocket = socketService.getSocket();
    currentSocket.off("comment:reacted", callback);
  },
  onCommentError: (callback: (data: { message: string }) => void) => {
    const currentSocket = socketService.getSocket();
    currentSocket.on("comment:error", callback);
  },
  offCommentError: (callback: (data: { message: string }) => void) => {
    const currentSocket = socketService.getSocket();
    currentSocket.off("comment:error", callback);
  },

  // --- Post Like (Realtime) ---
  emitPostLike: (data: { postId: string; userId: string }) => {
    const currentSocket = socketService.getSocket();
    currentSocket.emit("post:like", data);
  },
  onPostLiked: (
    callback: (data: {
      postId: string;
      userId: string;
      isLike: boolean;
      totalLikes: number;
    }) => void
  ) => {
    const currentSocket = socketService.getSocket();
    currentSocket.on("post:liked", callback);
  },
  offPostLiked: (
    callback: (data: {
      postId: string;
      userId: string;
      isLike: boolean;
      totalLikes: number;
    }) => void
  ) => {
    const currentSocket = socketService.getSocket();
    currentSocket.off("post:liked", callback);
  },

  // --- Comment List Realtime (comments:updated) ---
  onCommentsUpdated: (
    callback: (data: {
      comments: unknown[];
      metrics: Record<string, unknown>;
      itemId: string;
      itemType: string;
    }) => void
  ) => {
    const currentSocket = socketService.getSocket();
    currentSocket.on("comments:updated", callback);
  },
  offCommentsUpdated: (
    callback: (data: {
      comments: unknown[];
      metrics: Record<string, unknown>;
      itemId: string;
      itemType: string;
    }) => void
  ) => {
    const currentSocket = socketService.getSocket();
    currentSocket.off("comments:updated", callback);
  },

  // --- Comment List Fetch (comments:get) ---
  emitCommentsGet: (data: {
    itemId: string;
    itemType: "post" | "reel";
    limit?: number;
    userId?: string;
  }) => {
    const currentSocket = socketService.getSocket();
    currentSocket.emit("comments:get", data);
  },

  // --- Story View Realtime ---
  emitStoryView: (data: { storyId: string; userId: string }) => {
    const currentSocket = socketService.getSocket();
    currentSocket.emit("story:view", data);
  },
  onStoryViewed: (
    callback: (data: {
      storyId: string;
      viewers: Array<{
        _id: string;
        username: string;
        fullName: string;
        profilePicture?: string;
        viewedAt: string;
      }>;
    }) => void
  ) => {
    const currentSocket = socketService.getSocket();
    currentSocket.on("story:viewed", callback);
  },
  offStoryViewed: (
    callback: (data: {
      storyId: string;
      viewers: Array<{
        _id: string;
        username: string;
        fullName: string;
        profilePicture?: string;
        viewedAt: string;
      }>;
    }) => void
  ) => {
    const currentSocket = socketService.getSocket();
    currentSocket.off("story:viewed", callback);
  },
};
