import React from "react";
import Image from "next/image";

const Loading: React.FC = () => {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-black z-50">
      <div className="mb-6">
        <Image
          src="/Images/Instagram_logo_2016.svg.png"
          alt="Logo"
          width={72}
          height={72}
          className="object-contain"
          priority
        />
      </div>
      {/* Thanh loading */}
      <div className="w-[100px] h-[2px] bg-white rounded-full overflow-hidden relative">
        <div className="absolute top-0 h-full w-[30%] rounded-full animate-loading bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-600"></div>
      </div>

      {/* Animation styles */}
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

export default Loading;
