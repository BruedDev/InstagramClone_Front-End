import Image from "next/image";

export default function Loading() {
  return (
    <>
      <div className="flex flex-col items-center justify-center min-h-screen bg-black">
        <div className="w-20 h-20 relative">
          {/* Logo image */}
          <div className="absolute inset-0 flex items-center justify-center">
            <Image
              src="/Images/Instagram_logo_2016.svg.png"
              alt="Logo"
              width={64}
              height={64}
              className="object-contain"
            />
          </div>
          <div className="w-full h-full border-t-2 border-b-2 border-gray-300 animate-pulse"></div>
        </div>
        <div className="mt-4 w-16 h-1 bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 rounded animate-shimmer"></div>
        <div className="mt-4 text-white text-sm">Loading...</div>
        <div className="mt-6 flex space-x-2">
          <div
            className="w-2 h-2 bg-white rounded-full animate-bounce"
            style={{ animationDelay: "0ms" }}
          ></div>
          <div
            className="w-2 h-2 bg-white rounded-full animate-bounce"
            style={{ animationDelay: "300ms" }}
          ></div>
          <div
            className="w-2 h-2 bg-white rounded-full animate-bounce"
            style={{ animationDelay: "600ms" }}
          ></div>
        </div>
      </div>
    </>
  );
}
