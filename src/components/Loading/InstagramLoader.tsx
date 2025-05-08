import React from "react";
import Image from "next/image";

const InstagramLoader: React.FC = () => {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-black z-50">
      <div className="mb-6">
        <Image
          src="/Logo.webp"
          alt="Logo"
          width={72}
          height={72}
          className="object-contain"
          priority
        />
      </div>
      <div className="w-[100px] h-[2px] bg-gray-200 rounded-full overflow-hidden relative">
        <div className="absolute top-0 h-full w-[30%] bg-gray-800 rounded-full animate-loading"></div>
      </div>
      <style jsx global>{`
        @keyframes loading {
          0% {
            left: -30%;
          }
          100% {
            left: 100%;
          }
        }
        .animate-loading {
          animation: loading 1s infinite ease-in-out;
        }
      `}</style>
    </div>
  );
};

export default InstagramLoader;
