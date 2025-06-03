import MessengerComponent from "../Messenger";
import { useRef } from "react";

type MessengerModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export default function MessengerModal({
  isOpen,
  onClose,
}: MessengerModalProps) {
  const ringtoneRef = useRef<HTMLAudioElement | null>(null);
  if (!isOpen) return null;

  const handleClose = () => {
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      // Nếu đang ở /messages hoặc /messages?id=... thì về gốc (hoặc path cha)
      if (url.pathname === "/messages") {
        window.history.replaceState(null, "", "/");
      } else {
        url.searchParams.delete("id");
        window.history.replaceState(null, "", url.pathname + url.search);
      }
    }
    onClose();
  };

  return (
    <div
      className="fixed bottom-6 right-12 z-[998] w-[360px] h-[521px] bg-[#212328] shadow-xl overflow-hidden flex flex-col"
      style={{
        borderTopLeftRadius: "12px",
        borderTopRightRadius: "12px",
        borderBottomLeftRadius: "12px",
      }}
    >
      <div className="flex-1 overflow-y-auto relative w-full h-full">
        <MessengerComponent
          isModal={true}
          preview={true}
          ringtoneRef={ringtoneRef}
          onClose={handleClose}
        />
      </div>
    </div>
  );
}
