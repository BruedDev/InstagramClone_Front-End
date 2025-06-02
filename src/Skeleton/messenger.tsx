// @/sekeleton/messenger.tsx

export const MessageSkeleton = () => {
  return (
    <div className="flex mb-6 animate-pulse">
      <div className="w-8 h-8 rounded-full bg-gray-600 mr-3 flex-shrink-0 self-end"></div>
      <div className="flex-1 max-w-xs">
        <div className="bg-gray-600 rounded-3xl px-4 py-3 space-y-2">
          <div className="h-4 bg-gray-500 rounded-full"></div>
          <div className="h-4 bg-gray-500 rounded-full w-4/5"></div>
          <div className="h-4 bg-gray-500 rounded-full w-3/5"></div>
        </div>
        <div className="h-3 bg-gray-600 rounded-full w-12 mt-2 ml-2"></div>
      </div>
    </div>
  );
};

export const MessageSkeletonRight = () => {
  return (
    <div className="flex mb-6 justify-end animate-pulse">
      <div className="flex-1 flex flex-col items-end max-w-xs">
        <div className="bg-blue-500 rounded-3xl px-4 py-3 space-y-2 w-full">
          <div className="h-4 bg-blue-400 rounded-full"></div>
          <div className="h-4 bg-blue-400 rounded-full w-3/4 ml-auto"></div>
          <div className="h-4 bg-blue-400 rounded-full w-1/2 ml-auto"></div>
        </div>
        <div className="h-3 bg-gray-600 rounded-full w-12 mt-2 mr-2"></div>
      </div>
    </div>
  );
};

export const MessageSkeletonShort = () => {
  return (
    <div className="flex mb-6 animate-pulse">
      <div className="w-8 h-8 rounded-full bg-gray-600 mr-3 flex-shrink-0 self-end"></div>
      <div className="flex-1 max-w-xs">
        <div className="bg-gray-600 rounded-3xl px-4 py-3">
          <div className="h-4 bg-gray-500 rounded-full w-24"></div>
        </div>
        <div className="h-3 bg-gray-600 rounded-full w-12 mt-2 ml-2"></div>
      </div>
    </div>
  );
};

export const MessageSkeletonRightShort = () => {
  return (
    <div className="flex mb-6 justify-end animate-pulse">
      <div className="flex-1 flex flex-col items-end max-w-xs">
        <div className="bg-blue-500 rounded-3xl px-4 py-3 w-32">
          <div className="h-4 bg-blue-400 rounded-full"></div>
        </div>
        <div className="h-3 bg-gray-600 rounded-full w-12 mt-2 mr-2"></div>
      </div>
    </div>
  );
};

export const TypingSkeleton = () => {
  return (
    <div className="flex mb-4 animate-pulse">
      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-gray-800 to-gray-700 mr-3 flex-shrink-0 self-end relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-600 to-transparent animate-shimmer"></div>
      </div>
      <div className="bg-gradient-to-r from-gray-800 to-gray-700 rounded-3xl px-4 py-3 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-600 to-transparent animate-shimmer"></div>
        <div className="flex space-x-1">
          <div className="w-2 h-2 bg-gray-600 rounded-full animate-bounce"></div>
          <div
            className="w-2 h-2 bg-gray-600 rounded-full animate-bounce"
            style={{ animationDelay: "0.1s" }}
          ></div>
          <div
            className="w-2 h-2 bg-gray-600 rounded-full animate-bounce"
            style={{ animationDelay: "0.2s" }}
          ></div>
        </div>
      </div>
    </div>
  );
};
