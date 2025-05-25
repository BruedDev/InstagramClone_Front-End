import styles from "./StoryUserHome.module.scss";

export default function SeketonStory() {
  return (
    <div className={`w-full ${styles.container}`}>
      <div className="px-4 py-3">
        <div className="flex space-x-4">
          {/* Loading skeletons */}
          {[...Array(8)].map((_, index) => (
            <div key={index} className="flex flex-col items-center space-y-1">
              <div className="w-16 h-16 bg-gray-700 rounded-full animate-pulse"></div>
              <div className="w-12 h-3 bg-gray-700 rounded animate-pulse"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
