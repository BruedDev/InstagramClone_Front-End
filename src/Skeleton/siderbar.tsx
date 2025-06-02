// @/skeleton/siderbar.tsx
export const SiderBarSkeleton = () => {
  return (
    <div className="w-80 bg-[#0f0f0f] border-r border-[#222] flex flex-col animate-pulse">
      {/* Header Skeleton */}
      <div className="flex justify-between items-center px-4 py-3 border-b border-[#222] bg-[#0f0f0f]">
        <div className="flex items-center">
          <div className="h-8 bg-gray-600 rounded-full w-24"></div>
          <div className="ml-2 h-4 w-4 bg-gray-600 rounded-full"></div>
        </div>
        <div className="w-6 h-6 rounded-full bg-gray-600"></div>
      </div>

      {/* Search Bar Skeleton */}
      <div className="px-4 py-3 bg-[#0f0f0f]">
        <div className="flex items-center bg-[#1a1a1a] rounded-full px-3 py-2">
          <div className="h-4 w-4 bg-gray-600 rounded mr-2 flex-shrink-0"></div>
          <div className="flex-1 h-8 bg-gray-600 rounded-full w-full"></div>
        </div>
      </div>

      {/* Tab Buttons Skeleton */}
      <div className="flex bg-[#0f0f0f] px-4 pb-2">
        <div className="flex-1 py-2 px-4 mx-1 rounded-full bg-gray-600 h-8"></div>
        <div className="flex-1 py-2 px-4 mx-1 rounded-full bg-gray-600 h-8"></div>
      </div>

      {/* Chat List Skeleton */}
      <div className="flex-1 overflow-y-auto bg-[#0f0f0f] px-2 py-1 space-y-2">
        {Array.from({ length: 8 }).map((_, index) => (
          <ChatItemSkeleton key={index} />
        ))}
      </div>
    </div>
  );
};

export const ChatItemSkeleton = () => {
  return (
    <div className="flex items-center p-2 rounded-lg mb-1 animate-pulse">
      {/* Avatar Skeleton */}
      <div className="w-12 h-12 rounded-full mr-3 relative flex-shrink-0 bg-gradient-to-r from-gray-800 to-gray-700 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-600 to-transparent animate-shimmer"></div>
      </div>

      {/* Content Skeleton */}
      <div className="flex-1 min-w-0 space-y-2">
        {/* Username and checkmark skeleton */}
        <div className="flex items-center gap-1.5 mb-0.5">
          <div className="h-4 bg-gray-600 rounded w-20 animate-pulse"></div>
          <div className="w-3 h-3 bg-gray-600 rounded"></div>
        </div>

        {/* Message and time skeleton */}
        <div className="flex items-center justify-between">
          <div className="h-3 bg-gray-600 rounded flex-1 mr-2 animate-pulse"></div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="h-3 bg-gray-600 rounded w-8"></div>
            <div className="w-2 h-2 bg-blue-500 rounded-full opacity-50"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const ChatItemSkeletonShort = () => {
  return (
    <div className="flex items-center p-2 rounded-lg mb-1 animate-pulse">
      {/* Avatar Skeleton */}
      <div className="w-12 h-12 rounded-full mr-3 relative flex-shrink-0 bg-gradient-to-r from-gray-800 to-gray-700 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-600 to-transparent animate-shimmer"></div>
      </div>

      {/* Content Skeleton */}
      <div className="flex-1 min-w-0 space-y-2">
        {/* Username skeleton */}
        <div className="flex items-center gap-1.5 mb-0.5">
          <div className="h-4 bg-gray-600 rounded w-24 animate-pulse"></div>
        </div>

        {/* Simple message skeleton */}
        <div className="h-3 bg-gray-600 rounded w-32 animate-pulse"></div>
      </div>
    </div>
  );
};

export const EmptyStateSkeleton = () => {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center animate-pulse">
      <div className="w-16 h-16 bg-gradient-to-r from-gray-800 to-gray-700 rounded-full flex items-center justify-center mb-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-600 to-transparent animate-shimmer"></div>
      </div>
      <div className="h-5 bg-gray-600 rounded w-40 mb-2"></div>
      <div className="h-4 bg-gray-600 rounded w-56"></div>
    </div>
  );
};

export const SearchResultsSkeleton = () => {
  return (
    <div className="space-y-2 px-2 py-1">
      {Array.from({ length: 5 }).map((_, index) => (
        <div
          key={index}
          className="flex items-center p-2 rounded-lg mb-1 animate-pulse"
        >
          {/* Avatar with shimmer */}
          <div className="w-12 h-12 rounded-full mr-3 relative flex-shrink-0 bg-gradient-to-r from-gray-700 to-gray-600 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-500 to-transparent animate-shimmer"></div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0 space-y-2">
            <div className="h-4 bg-gray-600 rounded w-28 animate-pulse"></div>
            <div className="h-3 bg-gray-600 rounded w-36 animate-pulse"></div>
          </div>
        </div>
      ))}
    </div>
  );
};
