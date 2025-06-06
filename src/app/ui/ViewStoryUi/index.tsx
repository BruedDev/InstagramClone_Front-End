import React from "react";
import styles from "./ViewStoryUi.module.scss";
import Image from "next/image";

interface Viewer {
  avatar: string;
  name: string;
  lastActive: string;
}

export default function ViewStoryUi({
  onClose,
  viewers = [],
}: {
  onClose: () => void;
  viewers?: Viewer[];
}) {
  const [visible, setVisible] = React.useState(false);
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    const timeout = setTimeout(() => setVisible(true), 50);

    return () => {
      clearTimeout(timeout);
      window.removeEventListener("resize", checkMobile);
    };
  }, []);

  const handleClose = () => {
    setVisible(false);
    // Tăng thời gian delay để animation hoàn thành mượt mà hơn
    setTimeout(onClose, 400);
  };

  const sampleViewers =
    viewers.length > 0
      ? viewers
      : [
          {
            avatar:
              "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face",
            name: "Nguyễn Thị Lan",
            lastActive: "2 phút trước",
          },
          {
            avatar:
              "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
            name: "Trần Văn Nam",
            lastActive: "5 phút trước",
          },
          {
            avatar:
              "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
            name: "Lê Thị Hoa",
            lastActive: "10 phút trước",
          },
          {
            avatar:
              "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
            name: "Phạm Văn Đức",
            lastActive: "15 phút trước",
          },
          {
            avatar:
              "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face",
            name: "Hoàng Thị Mai",
            lastActive: "20 phút trước",
          },
        ];

  return (
    <>
      {isMobile && (
        <div
          className={`fixed inset-0 bg-black z-30 transition-all duration-400 ease-in-out ${
            visible ? "opacity-50" : "opacity-0 pointer-events-none"
          } max-[767px]:block hidden`}
          onClick={handleClose}
        />
      )}
      <div
        className={`
          ${
            isMobile
              ? `fixed left-1/2 bottom-0 w-full max-w-[420px] bg-zinc-900 shadow-2xl z-40
                transform -translate-x-1/2 transition-all duration-400 ease-in-out
                rounded-t-3xl h-[85dvh]
                ${
                  visible
                    ? "translate-y-0 opacity-100 scale-100"
                    : "translate-y-full opacity-0 scale-90"
                }`
              : `fixed bottom-4 left-1/2 transform -translate-x-1/2 w-full max-w-[422px] mx-auto bg-zinc-900 rounded-t-2xl rounded-b-2xl shadow-2xl z-40 transition-all duration-400 ease-in-out h-[60dvh] ${
                  visible
                    ? "translate-y-0 opacity-100 scale-100"
                    : "translate-y-8 opacity-0 scale-90"
                }`
          }
        `}
        style={{
          minHeight: isMobile ? "auto" : 550,
          transformOrigin: isMobile ? "center bottom" : "center bottom",
        }}
      >
        <div
          className={`flex items-center justify-between px-6 py-3 border-b border-zinc-800 transition-all duration-350 ease-out ${
            visible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
          }`}
        >
          <span className="text-lg font-semibold text-white">
            Chi tiết về tin
          </span>
          <button
            onClick={handleClose}
            className="text-zinc-400 hover:text-white text-xl w-8 h-8 flex items-center justify-center rounded-full hover:bg-zinc-800 transition-all duration-200 hover:scale-110"
          >
            <span aria-label="Đóng">×</span>
          </button>
        </div>
        <div
          className={`px-6 py-4 transition-all duration-400 ease-out ${
            visible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
          } ${
            isMobile
              ? "overflow-y-auto h-[calc(85vh-69px)]"
              : "h-[calc(100%-69px)]"
          }`}
          style={{ transitionDelay: visible ? "100ms" : "0ms" }}
        >
          <div
            className={`flex gap-4 mb-4 transition-all duration-350 ease-out ${
              visible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
            }`}
            style={{ transitionDelay: visible ? "150ms" : "0ms" }}
          >
            <div className="w-20 h-28 bg-zinc-800 rounded-lg flex-shrink-0 overflow-hidden transition-all duration-300 ease-out hover:scale-105 hover:rotate-1">
              <div className="w-full h-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                <span className="text-white text-2xl">📖</span>
              </div>
            </div>
            <div className="w-20 h-28 bg-zinc-800 rounded-lg flex-shrink-0 flex items-center justify-center text-blue-500 font-bold text-2xl hover:bg-zinc-700 transition-all duration-300 ease-out cursor-pointer hover:scale-105 hover:rotate-1">
              +
            </div>
          </div>
          <hr
            className={`border-zinc-700 mb-4 transition-all duration-350 ease-out ${
              visible ? "opacity-100 scale-x-100" : "opacity-0 scale-x-0"
            }`}
            style={{
              transitionDelay: visible ? "200ms" : "0ms",
              transformOrigin: "left",
            }}
          />
          <div
            className={`flex items-center gap-2 text-zinc-300 mb-4 transition-all duration-350 ease-out ${
              visible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
            }`}
            style={{ transitionDelay: visible ? "250ms" : "0ms" }}
          >
            <svg
              width="20"
              height="20"
              fill="none"
              viewBox="0 0 24 24"
              className="transition-transform duration-200 hover:scale-110"
            >
              <path
                fill="currentColor"
                d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10Zm0-2a8 8 0 1 1 0-16 8 8 0 0 1 0 16Zm0-7a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm0 2c-2.33 0-7 1.17-7 3.5V20h14v-1.5c0-2.33-4.67-3.5-7-3.5Z"
              />
            </svg>
            <span className="font-semibold">
              {sampleViewers.length} người xem
            </span>
          </div>
          <div
            className={`space-y-3 ${styles.viewList} ${
              !isMobile
                ? "max-h-[calc(100%-180px)] overflow-y-auto overflow-x-hidden"
                : ""
            }`}
          >
            {sampleViewers.map((v, i) => (
              <div
                key={i}
                className={`flex items-center gap-3 p-2 rounded-lg hover:bg-zinc-800/50 transition-all duration-300 ease-out cursor-pointer hover:scale-[1.02] hover:translate-x-1 ${
                  visible
                    ? "translate-y-0 opacity-100"
                    : "translate-y-6 opacity-0"
                }`}
                style={{
                  transitionDelay: visible ? `${300 + i * 80}ms` : "0ms",
                }}
              >
                <Image
                  src={v.avatar}
                  alt={v.name}
                  className={`${
                    isMobile ? "w-12 h-12" : "w-10 h-10"
                  } rounded-full object-cover border-2 border-zinc-700 transition-all duration-200 hover:border-zinc-500 hover:scale-110`}
                  width={isMobile ? 48 : 40}
                  height={isMobile ? 48 : 40}
                />
                <div className={isMobile ? "flex-1" : ""}>
                  <div className="text-white font-medium transition-colors duration-200">
                    {v.name}
                  </div>
                  <div className="text-xs text-zinc-400 transition-colors duration-200">
                    Hoạt động {v.lastActive}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
