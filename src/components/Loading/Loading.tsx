import Image from "next/image";

export default function Loading() {
  return (
    <>
      <div className="flex flex-col items-center justify-center min-h-screen bg-white">
        <div className="w-20 h-20 relative">
          {/* Logo image */}
          <div className="absolute inset-0 flex items-center justify-center">
            <Image
              src="Images/logo.svg"
              alt="Logo"
              className="w-16 h-16 object-contain"
            />
          </div>
          <div className="w-full h-full rounded-full border-t-2 border-b-2 border-gray-300 animate-pulse"></div>
        </div>
        <div className="mt-4 w-16 h-1 bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 rounded animate-shimmer"></div>
      </div>
    </>
  );
}
