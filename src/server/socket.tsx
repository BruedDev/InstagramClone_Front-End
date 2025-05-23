// server/socket.tsx
"use client";

import { io, Socket } from "socket.io-client";

const API_URL = process.env.NEXT_PUBLIC_SOCKET_URL;
// console.log("Socket URL:", API_URL);

let socket: Socket | null = null;

export const socketService = {
  initSocket: () => {
    if (!socket && API_URL) {
      socket = io(API_URL);
      // console.log("Socket initialized");
    }
    return socket;
  },

  getSocket: (): Socket => {
    if (!socket) {
      return socketService.initSocket() as Socket;
    }
    return socket;
  },

  registerUser: (userId: string) => {
    const currentSocket = socketService.getSocket();
    if (!currentSocket) return;
    currentSocket.emit("userOnline", userId);
    currentSocket.emit("joinUserRoom", userId);
  },

  sendMessage: (data: {
    senderId: string;
    receiverId: string;
    message: string;
  }) => {
    const currentSocket = socketService.getSocket();
    if (!currentSocket) return;
    currentSocket.emit("sendMessage", data);
  },

  onReceiveMessage: (
    callback: (msg: {
      senderId: string;
      message: string;
      timestamp: string;
    }) => void
  ) => {
    const currentSocket = socketService.getSocket();
    if (!currentSocket) return;
    currentSocket.on("receiveMessage", callback);
  },

  offReceiveMessage: (
    callback: (msg: {
      senderId: string;
      message: string;
      timestamp: string;
    }) => void
  ) => {
    const currentSocket = socketService.getSocket();
    if (!currentSocket) return;
    currentSocket.off("receiveMessage", callback);
  },

  callUser: (data: {
    to: string;
    from: string;
    signal: RTCSessionDescriptionInit;
  }) => {
    const currentSocket = socketService.getSocket();
    if (!currentSocket) return;
    currentSocket.emit("callUser", data);
  },

  answerCall: (data: {
    to: string;
    from: string;
    signal: RTCSessionDescriptionInit;
  }) => {
    const currentSocket = socketService.getSocket();
    if (!currentSocket) return;
    currentSocket.emit("answerCall", data);
  },

  sendIceCandidate: (data: { to: string; candidate: RTCIceCandidate }) => {
    const currentSocket = socketService.getSocket();
    if (!currentSocket) return;
    currentSocket.emit("iceCandidate", data);
  },

  endCall: (data: { to: string; from: string }) => {
    const currentSocket = socketService.getSocket();
    if (!currentSocket) return;
    currentSocket.emit("endCall", data);
  },

  onCallIncoming: (
    callback: (data: {
      from: string;
      signal: RTCSessionDescriptionInit;
    }) => void
  ) => {
    const currentSocket = socketService.getSocket();
    if (!currentSocket) return;
    currentSocket.on("callIncoming", callback);
  },

  onCallAnswered: (
    callback: (data: {
      from: string;
      signal: RTCSessionDescriptionInit;
    }) => void
  ) => {
    const currentSocket = socketService.getSocket();
    if (!currentSocket) return;
    currentSocket.on("callAnswered", callback);
  },

  onIceCandidate: (
    callback: (data: { from: string; candidate: RTCIceCandidate }) => void
  ) => {
    const currentSocket = socketService.getSocket();
    if (!currentSocket) return;
    currentSocket.on("iceCandidate", callback);
  },

  onCallEnded: (callback: (data: { from: string }) => void) => {
    const currentSocket = socketService.getSocket();
    if (!currentSocket) return;
    currentSocket.on("callEnded", callback);
  },

  offCallListeners: () => {
    const currentSocket = socketService.getSocket();
    if (!currentSocket) return;
    currentSocket.off("callIncoming");
    currentSocket.off("callAnswered");
    currentSocket.off("iceCandidate");
    currentSocket.off("callEnded");
  },

  disconnect: () => {
    if (socket) {
      socket.disconnect();
      socket = null;
      console.log("Socket disconnected");
    }
  },

  joinPostRoom: (postId: string) => {
    const currentSocket = socketService.getSocket();
    if (!currentSocket) return;
    currentSocket.emit("joinPostRoom", postId);
  },

  leavePostRoom: (postId: string) => {
    const currentSocket = socketService.getSocket();
    if (!currentSocket) return;
    currentSocket.emit("leavePostRoom", postId);
  },

  joinReelRoom: (reelId: string) => {
    const currentSocket = socketService.getSocket();
    if (!currentSocket) return;
    currentSocket.emit("joinReelRoom", reelId);
  },

  leaveReelRoom: (reelId: string) => {
    const currentSocket = socketService.getSocket();
    if (!currentSocket) return;
    currentSocket.emit("leaveReelRoom", reelId);
  },

  emitCommentTyping: (data: {
    itemId: string;
    itemType: "post" | "reel";
    user: { id: string; username: string; profilePicture?: string };
  }) => {
    const currentSocket = socketService.getSocket();
    if (!currentSocket) return;
    currentSocket.emit("comment:typing", data);
  },

  emitCommentStopTyping: (data: {
    itemId: string;
    itemType: "post" | "reel";
    userId: string;
  }) => {
    const currentSocket = socketService.getSocket();
    if (!currentSocket) return;
    currentSocket.emit("comment:stopTyping", data);
  },

  emitCommentCreate: (data: {
    authorId: string;
    itemId: string;
    itemType: "post" | "reel";
    text: string;
  }) => {
    const currentSocket = socketService.getSocket();
    if (!currentSocket) return;
    currentSocket.emit("comment:create", data);
  },

  emitCommentEdit: (data: {
    commentId: string;
    newText: string;
    itemId: string;
    itemType: "post" | "reel";
  }) => {
    const currentSocket = socketService.getSocket();
    if (!currentSocket) return;
    currentSocket.emit("comment:edit", data);
  },

  emitCommentDelete: (data: {
    commentId: string;
    itemId: string;
    itemType: "post" | "reel";
  }) => {
    const currentSocket = socketService.getSocket();
    if (!currentSocket) return;
    currentSocket.emit("comment:delete", data);
  },

  emitCommentReact: (data: {
    commentId: string;
    reaction: string;
    user: { id: string; username: string; profilePicture?: string };
  }) => {
    const currentSocket = socketService.getSocket();
    if (!currentSocket) return;
    currentSocket.emit("comment:react", data);
  },

  onCommentTyping: (
    callback: (data: {
      itemId: string;
      user: { id: string; username: string; profilePicture?: string };
    }) => void
  ) => {
    const currentSocket = socketService.getSocket();
    if (!currentSocket) return;
    currentSocket.on("comment:typing", callback);
  },

  offCommentTyping: (
    callback: (data: {
      itemId: string;
      user: { id: string; username: string; profilePicture?: string };
    }) => void
  ) => {
    const currentSocket = socketService.getSocket();
    if (!currentSocket) return;
    currentSocket.off("comment:typing", callback);
  },

  onCommentStopTyping: (
    callback: (data: { itemId: string; userId: string }) => void
  ) => {
    const currentSocket = socketService.getSocket();
    if (!currentSocket) return;
    currentSocket.on("comment:stopTyping", callback);
  },

  offCommentStopTyping: (
    callback: (data: { itemId: string; userId: string }) => void
  ) => {
    const currentSocket = socketService.getSocket();
    if (!currentSocket) return;
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
    if (!currentSocket) return;
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
    if (!currentSocket) return;
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
    if (!currentSocket) return;
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
    if (!currentSocket) return;
    currentSocket.off("comment:edited", callback);
  },

  onCommentDeleted: (
    callback: (data: { commentId: string; itemId: string }) => void
  ) => {
    const currentSocket = socketService.getSocket();
    if (!currentSocket) return;
    currentSocket.on("comment:deleted", callback);
  },

  offCommentDeleted: (
    callback: (data: { commentId: string; itemId: string }) => void
  ) => {
    const currentSocket = socketService.getSocket();
    if (!currentSocket) return;
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
    if (!currentSocket) return;
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
    if (!currentSocket) return;
    currentSocket.off("comment:reacted", callback);
  },

  onCommentError: (callback: (data: { message: string }) => void) => {
    const currentSocket = socketService.getSocket();
    if (!currentSocket) return;
    currentSocket.on("comment:error", callback);
  },

  offCommentError: (callback: (...args: unknown[]) => void) => {
    const currentSocket = socketService.getSocket();
    if (!currentSocket) return;
    currentSocket.off("comment:error", callback);
  },
};
