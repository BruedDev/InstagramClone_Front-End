// server/socket.tsx
"use client";

import { io, Socket } from "socket.io-client";

// Định nghĩa địa chỉ API
const API_URL = process.env.NEXT_PUBLIC_SOCKET_URL;
console.log("Socket URL:", API_URL);

// Hàm singleton để tạo và quản lý kết nối socket
let socket: Socket | null = null;

export const socketService = {
  // Khởi tạo socket và kết nối
  initSocket: () => {
    if (!socket) {
      socket = io(API_URL);
      console.log("Socket initialized");
    }
    return socket;
  },

  // Lấy instance socket hiện tại
  getSocket: () => {
    if (!socket) {
      return socketService.initSocket();
    }
    return socket;
  },

  // Đăng ký user online
  registerUser: (userId: string) => {
    const currentSocket = socketService.getSocket();
    currentSocket.emit("userOnline", userId);
    currentSocket.emit("joinUserRoom", userId);
  },

  sendMessage: (data: {
    senderId: string;
    receiverId: string;
    message: string;
  }) => {
    const currentSocket = socketService.getSocket();
    currentSocket.emit("sendMessage", data);
  },

  // Lắng nghe tin nhắn mới
  onReceiveMessage: (
    callback: (msg: {
      senderId: string;
      message: string;
      timestamp: string;
    }) => void
  ) => {
    const currentSocket = socketService.getSocket();
    currentSocket.on("receiveMessage", callback);
  },

  // Hủy lắng nghe tin nhắn mới
  offReceiveMessage: (
    callback: (msg: {
      senderId: string;
      message: string;
      timestamp: string;
    }) => void
  ) => {
    const currentSocket = socketService.getSocket();
    currentSocket.off("receiveMessage", callback);
  },

  // ------- Các phương thức cho tính năng gọi điện -------

  // Người gọi: Gửi yêu cầu gọi đến server
  callUser: (data: {
    to: string;
    from: string;
    signal: RTCSessionDescriptionInit;
  }) => {
    const currentSocket = socketService.getSocket();
    currentSocket.emit("callUser", data);
  },

  // Người nhận: Trả lời cuộc gọi
  answerCall: (data: {
    to: string;
    from: string;
    signal: RTCSessionDescriptionInit;
  }) => {
    const currentSocket = socketService.getSocket();
    currentSocket.emit("answerCall", data);
  },

  // Gửi ICE candidate trong quá trình kết nối WebRTC
  sendIceCandidate: (data: { to: string; candidate: RTCIceCandidate }) => {
    const currentSocket = socketService.getSocket();
    currentSocket.emit("iceCandidate", data);
  },

  // Kết thúc cuộc gọi
  endCall: (data: { to: string; from: string }) => {
    const currentSocket = socketService.getSocket();
    currentSocket.emit("endCall", data);
  },

  // Lắng nghe sự kiện có cuộc gọi đến
  onCallIncoming: (
    callback: (data: {
      from: string;
      signal: RTCSessionDescriptionInit;
    }) => void
  ) => {
    const currentSocket = socketService.getSocket();
    currentSocket.on("callIncoming", callback);
  },

  // Lắng nghe sự kiện cuộc gọi được trả lời
  onCallAnswered: (
    callback: (data: {
      from: string;
      signal: RTCSessionDescriptionInit;
    }) => void
  ) => {
    const currentSocket = socketService.getSocket();
    currentSocket.on("callAnswered", callback);
  },

  // Lắng nghe sự kiện nhận ICE candidate
  onIceCandidate: (
    callback: (data: { from: string; candidate: RTCIceCandidate }) => void
  ) => {
    const currentSocket = socketService.getSocket();
    currentSocket.on("iceCandidate", callback);
  },

  // Lắng nghe sự kiện cuộc gọi kết thúc
  onCallEnded: (callback: (data: { from: string }) => void) => {
    const currentSocket = socketService.getSocket();
    currentSocket.on("callEnded", callback);
  },

  // Hủy các listener khi không cần thiết
  offCallListeners: () => {
    const currentSocket = socketService.getSocket();
    currentSocket.off("callIncoming");
    currentSocket.off("callAnswered");
    currentSocket.off("iceCandidate");
    currentSocket.off("callEnded");
  },

  // Ngắt kết nối socket
  disconnect: () => {
    if (socket) {
      socket.disconnect();
      socket = null;
      console.log("Socket disconnected");
    }
  },
};
