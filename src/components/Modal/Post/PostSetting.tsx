import IsProfile from "@/components/isProfile";

export interface MenuItem {
  id: number;
  label: string;
  action: string;
  danger?: boolean;
}

type PostSettingProps = {
  onClose: () => void;
  onAction?: (action: string) => void;
  menuItems?: MenuItem[]; // Cho phép truyền custom menu items
  title?: string; // Thêm title cho modal
  width?: string; // Cho phép custom width
  profileId: string; // ID hoặc username của chủ sở hữu bài viết
};

// Default menu items cho bài viết của chính mình
const DEFAULT_POST_MENU_ITEMS: MenuItem[] = [
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

// Menu items cho bài viết của người khác
const OTHER_POST_MENU_ITEMS: MenuItem[] = [
  { id: 1, label: "Chặn", danger: true, action: "block" },
  { id: 2, label: "Báo cáo", danger: true, action: "report" },
  { id: 3, label: "Đi đến bài viết", action: "go_to_post" },
  { id: 4, label: "Chia sẻ lên...", action: "share" },
  { id: 5, label: "Sao chép liên kết", action: "copy_link" },
  { id: 6, label: "Nhúng", action: "embed" },
  { id: 7, label: "Giới thiệu về tài khoản này", action: "about_account" },
  { id: 8, label: "Hủy", action: "cancel" },
];

export default function PostSetting({
  onClose,
  onAction,
  menuItems,
  title,
  width = "400px",
  profileId,
}: PostSettingProps) {
  const handleClick = (action: string) => {
    if (action === "cancel") {
      onClose();
    } else if (onAction) {
      onAction(action);
      onClose();
    }
  };

  return (
    <IsProfile
      profileId={profileId}
      fallback={
        // Menu cho bài viết của người khác
        <>
          {/* Overlay nền đen mờ nhẹ opacity 0.5 */}
          <div
            className="fixed inset-0 z-[996] flex justify-center items-center p-4"
            style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}
            onClick={onClose}
          >
            {/* Menu chính với nền xám tối #222222 */}
            <div
              className="w-full max-w-md bg-[#222222] rounded-xl overflow-hidden shadow-lg text-white
                 sm:w-auto sm:max-w-full
                 max-[480px]:w-full max-[480px]:mx-4 max-[480px]:max-w-none"
              style={{
                width: window.innerWidth > 480 ? width : "auto",
                maxHeight: "90vh",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Title nếu có */}
              {title && (
                <div className="py-4 px-5 text-center border-b border-[#444444] font-semibold text-white text-sm">
                  {title}
                </div>
              )}

              {/* Main menu items cho người khác */}
              <div className="max-h-[70vh] overflow-y-auto">
                {(menuItems || OTHER_POST_MENU_ITEMS)
                  .filter((item) => item.action !== "cancel")
                  .map((item, index, filteredItems) => (
                    <button
                      key={item.id}
                      className={`w-full py-4 px-5 text-center border-b border-[#444444] hover:bg-[#333333] transition-colors text-sm leading-5 ${
                        item.danger
                          ? "text-[#ed4956] font-semibold"
                          : "text-white"
                      } ${
                        index === filteredItems.length - 1 &&
                        !(menuItems || OTHER_POST_MENU_ITEMS).find(
                          (item) => item.action === "cancel"
                        )
                          ? "border-b-0"
                          : ""
                      }
                      max-[480px]:py-3 max-[480px]:text-base max-[480px]:font-normal`}
                      onClick={() => handleClick(item.action)}
                    >
                      {item.label}
                    </button>
                  ))}
              </div>

              {/* Cancel button nếu có */}
              {(menuItems || OTHER_POST_MENU_ITEMS).find(
                (item) => item.action === "cancel"
              ) && (
                <div className="border-t border-[#444444] mt-2">
                  <button
                    key={
                      (menuItems || OTHER_POST_MENU_ITEMS).find(
                        (item) => item.action === "cancel"
                      )!.id
                    }
                    className="w-full py-4 px-5 text-center bg-[#222222] text-white font-semibold text-sm hover:bg-[#333333] transition-colors
                               max-[480px]:py-3 max-[480px]:text-base max-[480px]:font-normal"
                    onClick={() => handleClick("cancel")}
                  >
                    {
                      (menuItems || OTHER_POST_MENU_ITEMS).find(
                        (item) => item.action === "cancel"
                      )!.label
                    }
                  </button>
                </div>
              )}
            </div>
          </div>
        </>
      }
    >
      {/* Menu cho bài viết của chính mình */}
      <>
        {/* Overlay nền đen mờ nhẹ opacity 0.5 */}
        <div
          className="fixed inset-0 z-[996] flex justify-center items-center p-4"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}
          onClick={onClose}
        >
          {/* Menu chính với nền xám tối #222222 */}
          <div
            className="w-full max-w-md bg-[#222222] rounded-xl overflow-hidden shadow-lg text-white
               sm:w-auto sm:max-w-full
               max-[480px]:w-full max-[480px]:mx-4 max-[480px]:max-w-none"
            style={{
              width: window.innerWidth > 480 ? width : "auto",
              maxHeight: "90vh",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Title nếu có */}
            {title && (
              <div className="py-4 px-5 text-center border-b border-[#444444] font-semibold text-white text-sm">
                {title}
              </div>
            )}

            {/* Main menu items cho chính mình */}
            <div className="max-h-[70vh] overflow-y-auto">
              {(menuItems || DEFAULT_POST_MENU_ITEMS)
                .filter((item) => item.action !== "cancel")
                .map((item, index, filteredItems) => (
                  <button
                    key={item.id}
                    className={`w-full py-4 px-5 text-center border-b border-[#444444] hover:bg-[#333333] transition-colors text-sm leading-5 ${
                      item.danger
                        ? "text-[#ed4956] font-semibold"
                        : "text-white"
                    } ${
                      index === filteredItems.length - 1 &&
                      !(menuItems || DEFAULT_POST_MENU_ITEMS).find(
                        (item) => item.action === "cancel"
                      )
                        ? "border-b-0"
                        : ""
                    }
                    max-[480px]:py-3 max-[480px]:text-base max-[480px]:font-normal`}
                    onClick={() => handleClick(item.action)}
                  >
                    {item.label}
                  </button>
                ))}
            </div>

            {/* Cancel button nếu có */}
            {(menuItems || DEFAULT_POST_MENU_ITEMS).find(
              (item) => item.action === "cancel"
            ) && (
              <div className="border-t border-[#444444] mt-2">
                <button
                  key={
                    (menuItems || DEFAULT_POST_MENU_ITEMS).find(
                      (item) => item.action === "cancel"
                    )!.id
                  }
                  className="w-full py-4 px-5 text-center bg-[#222222] text-white font-semibold text-sm hover:bg-[#333333] transition-colors
                             max-[480px]:py-3 max-[480px]:text-base max-[480px]:font-normal"
                  onClick={() => handleClick("cancel")}
                >
                  {
                    (menuItems || DEFAULT_POST_MENU_ITEMS).find(
                      (item) => item.action === "cancel"
                    )!.label
                  }
                </button>
              </div>
            )}
          </div>
        </div>
      </>
    </IsProfile>
  );
}

// Predefined menu configurations for reuse
export const MENU_CONFIGS = {
  POST_SETTINGS: DEFAULT_POST_MENU_ITEMS,
  OTHER_POST_SETTINGS: OTHER_POST_MENU_ITEMS,

  USER_PROFILE: [
    { id: 1, label: "Chặn", danger: true, action: "block" },
    { id: 2, label: "Hạn chế", action: "restrict" },
    { id: 3, label: "Báo cáo", danger: true, action: "report" },
    { id: 4, label: "Sao chép URL hồ sơ", action: "copy_profile_url" },
    { id: 5, label: "Chia sẻ hồ sơ này", action: "share_profile" },
    { id: 6, label: "Hủy", action: "cancel" },
  ] as MenuItem[],

  COMMENT_SETTINGS: [
    { id: 1, label: "Xóa", danger: true, action: "delete" },
    { id: 2, label: "Chỉnh sửa", action: "edit" },
    { id: 3, label: "Báo cáo", danger: true, action: "report" },
    { id: 4, label: "Sao chép bình luận", action: "copy_comment" },
    { id: 5, label: "Hủy", action: "cancel" },
  ] as MenuItem[],
};
