// File: app/call-modal/page.tsx
// Nội dung này giống hệt với file app/(Layout)/call-modal/page.tsx bạn đã cung cấp.
// Nó chỉ được di chuyển đến vị trí mới này.
"use client";

import { useEffect } from "react";
import CallModal from "@/components/Modal/CallModal"; // Đảm bảo đường dẫn này chính xác
import { useUser } from "@/app/hooks/useUser"; // Đảm bảo đường dẫn này chính xác
import { CallProvider } from "@/contexts/CallContext"; // Đảm bảo đường dẫn này chính xác
import { useCall } from "@/app/hooks/useCall"; // Đảm bảo đường dẫn này chính xác
import { useSearchParams } from "next/navigation";

export default function CallModalPage() {
  const { user } = useUser();

  if (!user || !user._id) {
    // Quan trọng: Đảm bảo hook useUser() có thể lấy thông tin user
    // mà không cần ProtectedRoute nếu ProtectedRoute không có trong layout này.
    // Thông thường, useUser() sẽ đọc từ context (GlobalContext hoặc Redux state)
    // được cung cấp bởi app/call-modal/layout.tsx.
    return <div>Đang tải thông tin người dùng...</div>;
  }

  const userId = user._id;

  console.log("✅ userId trong CallModalPage (popup):", userId);

  // CallProvider này đến từ @/contexts/CallContext, được thiết kế cho logic cuộc gọi cụ thể này.
  return (
    <CallProvider userId={userId}>
      <InnerCallModal />
    </CallProvider>
  );
}

const InnerCallModal = () => {
  const searchParams = useSearchParams();
  const calleeId = searchParams.get("calleeId"); // người được gọi

  const {
    activeCallUserId,
    setActiveCallUserId,
    handleEndCall: contextHandleEndCall,
  } = useCall();

  useEffect(() => {
    if (calleeId) {
      setActiveCallUserId(calleeId);
      console.log("✅ calleeId được đặt trong popup:", calleeId);
    }

    document.title = "Cuộc gọi";

    const handleBeforeUnload = () => {
      // Gọi hàm kết thúc cuộc gọi khi người dùng đóng cửa sổ
      if (activeCallUserId) {
        // Kiểm tra activeCallUserId từ context của popup
        console.log(
          "Popup: Xử lý beforeunload, kết thúc cuộc gọi cho activeCallUserId:",
          activeCallUserId
        );
        contextHandleEndCall();
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      console.log("Popup: Dọn dẹp event listener beforeunload.");
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
    // Thêm activeCallUserId vào dependency array nếu logic của bạn yêu cầu
    // phản ứng lại sự thay đổi của nó trong effect này.
  }, [calleeId, setActiveCallUserId, contextHandleEndCall, activeCallUserId]);

  const handleEndCall = () => {
    console.log("Popup: Người dùng nhấn nút kết thúc cuộc gọi.");
    // Gọi hàm xử lý kết thúc cuộc gọi từ context
    contextHandleEndCall();

    // Đóng cửa sổ popup sau khi kết thúc cuộc gọi
    if (window.opener) {
      // Cân nhắc việc reload tab chính có thực sự cần thiết mỗi lần không,
      // hoặc có thể giao tiếp lại với tab chính bằng cách khác.
      window.opener.location.reload();
    }
    window.close();
  };

  return (
    <>
      {/* Component CallModal sẽ hiển thị UI của cuộc gọi */}
      <CallModal handleEndCall={handleEndCall} />
    </>
  );
};
