export default function ViewStory({
  uniqueViewerCount,
}: {
  uniqueViewerCount: number;
}) {
  return (
    <div
      style={{
        position: "absolute",
        left: 16,
        bottom: 16,
        zIndex: 30,
        color: "#fff",
        fontSize: 15,
        fontWeight: 500,
        textShadow: "0 1px 4px #000,0 0 2px #000",
        pointerEvents: "none",
      }}
    >
      <button
        className="text-white font-semibold text-base"
        style={{
          cursor: "pointer",
        }}
      >
        {uniqueViewerCount} lượt xem
      </button>
    </div>
  );
}
