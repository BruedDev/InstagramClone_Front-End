import { useState } from "react";
import { Post } from "@/types/home.type";
import PostSetting from "@/components/Modal/Post/PostSetting";
import { deletePostById } from "@/server/posts";

export function usePostSettingModal(onPostDeleted?: (postId: string) => void) {
  const [showPostSettings, setShowPostSettings] = useState(false);
  const [selectedPostForSettings, setSelectedPostForSettings] =
    useState<Post | null>(null);

  const handleOpenPostSettings = (post: Post, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedPostForSettings(post);
    setShowPostSettings(true);
  };

  const handleClosePostSettings = () => {
    setShowPostSettings(false);
    setSelectedPostForSettings(null);
  };

  const handlePostSettingAction = async (action: string) => {
    if (action === "delete" && selectedPostForSettings) {
      try {
        await deletePostById(selectedPostForSettings._id);
        if (onPostDeleted) {
          onPostDeleted(selectedPostForSettings._id);
        }
        handleClosePostSettings();
      } catch (error) {
        console.error("Xóa bài viết thất bại:", error);
      }
    }
  };

  function renderModal() {
    if (showPostSettings && selectedPostForSettings) {
      return (
        <PostSetting
          onClose={handleClosePostSettings}
          onAction={handlePostSettingAction}
          profileId={selectedPostForSettings.author.username}
        />
      );
    }
    return null;
  }

  return {
    showPostSettings,
    selectedPostForSettings,
    handleOpenPostSettings,
    handleClosePostSettings,
    handlePostSettingAction,
    renderModal,
  };
}
