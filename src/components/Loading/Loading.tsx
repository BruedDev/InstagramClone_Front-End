import React from "react";
import Image from "next/image";

const Loading = () => {
  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center bg-black"
      style={{ zIndex: "10000", height: "100dvh" }}
    >
      {/* Logo Instagram */}
      <div className="mb-8 animate-pulse">
        <Image
          src="/Images/instagram.png"
          alt="Logo"
          width={72}
          height={72}
          className="object-contain"
          priority
        />
      </div>

      {/* Logo Meta ở dưới */}
      <div className="absolute bottom-16 animate-pulse">
        <Image
          src="/Images/fromMeta.webp"
          alt="Meta"
          width={100}
          height={100}
          className="object-contain opacity-70"
          priority
        />
      </div>
    </div>
  );
};

export default Loading;
