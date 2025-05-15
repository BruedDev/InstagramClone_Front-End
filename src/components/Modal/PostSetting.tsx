type PostSettingProps = {
  onClose: () => void;
  onAction?: (action: string) => void;
};

export default function PostSetting({ onClose, onAction }: PostSettingProps) {
  const menuItems = [
    { id: 1, label: "Xóa", danger: true, action: "delete" },
    { id: 2, label: "Chỉnh sửa", action: "edit" },
    {
      id: 3,
      label: "Ẩn số lượt thích với những người khác",
      action: "hide_likes",
    },
    { id: 4, label: "Tắt tính năng bình luận", action: "disable_comments" },
    { id: 5, label: "Đi đến bài viết", action: "go_to_post" },
    { id: 6, label: "Chia sẻ lên...", action: "share" },
    { id: 7, label: "Sao chép liên kết", action: "copy_link" },
    { id: 8, label: "Nhúng", action: "embed" },
    { id: 9, label: "Giới thiệu về tài khoản này", action: "about_account" },
    { id: 10, label: "Hủy", action: "cancel" },
  ];

  const handleClick = (action: string) => {
    if (action === "cancel") {
      onClose();
    } else if (onAction) {
      onAction(action);
      onClose();
    }
  };

  return (
    <>
      {/* Overlay nền đen mờ nhẹ opacity 0.5 */}
      <div
        className="fixed inset-0 z-[996] flex justify-center items-center"
        style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}
        onClick={onClose}
      >
        {/* Menu chính với nền xám tối #222222 */}
        <div
          className="w-[400px] max-w-full h-auto max-h-full bg-[#222222] rounded-xl overflow-hidden shadow-lg text-white
             sm:w-[400px] sm:h-auto
             xs:w-full xs:h-full"
          onClick={(e) => e.stopPropagation()}
        >
          {menuItems.slice(0, menuItems.length - 1).map((item) => (
            <button
              key={item.id}
              className={`w-full py-4 px-5 text-center border-b border-[#444444] hover:bg-[#333333] transition-colors text-sm ${
                item.danger ? "text-[#ed4956] font-semibold" : "text-white"
              }`}
              onClick={() => handleClick(item.action)}
            >
              {item.label}
            </button>
          ))}
          {/* Nút Hủy */}
          <button
            key={menuItems[menuItems.length - 1].id}
            className="w-full mt-6 py-4 px-5 text-center rounded-b-xl bg-[#333333] text-white font-semibold text-sm hover:bg-[#444444] transition-colors"
            onClick={() => handleClick(menuItems[menuItems.length - 1].action)}
          >
            {menuItems[menuItems.length - 1].label}
          </button>
        </div>
      </div>
    </>
  );
}
