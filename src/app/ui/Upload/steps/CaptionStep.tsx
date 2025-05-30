import Image from "next/image";
import { useState } from "react";
import styles from "./CaptionStep.module.scss";
import { UploadPostProps } from "..";
import { useUser } from "@/app/hooks/useUser";

import {
  MapPin,
  UserPlus,
  ChevronRight,
  Smile,
  Accessibility,
} from "lucide-react"; // Import Lucide icons

export default function CaptionStep({
  mediaType,
  mediaPreview,
  filter,
  username,
  caption,
  setCaption,
  croppedMediaPreview,
}: Pick<
  UploadPostProps,
  | "mediaType"
  | "mediaPreview"
  | "filter"
  | "username"
  | "caption"
  | "setCaption"
  | "handleSubmit"
  | "isUploading"
> & { croppedMediaPreview?: string | null }) {
  const [isFacebookShareEnabled, setIsFacebookShareEnabled] = useState(true);
  const { user } = useUser();

  console.log(user);

  return (
    <div className={styles.captionContent}>
      <div className={styles.captionImageContainer}>
        {mediaType === "image" && (croppedMediaPreview || mediaPreview) && (
          <div className={styles.captionImageWrapper}>
            <Image
              src={(croppedMediaPreview || mediaPreview) ?? ""}
              alt="Preview"
              fill
              className={`${styles.captionImage} ${
                filter?.selected ? styles[filter.selected.toLowerCase()] : ""
              }`}
            />
          </div>
        )}
        {mediaType === "video" && mediaPreview && (
          <div className={styles.captionImageWrapper}>
            <video
              src={mediaPreview}
              controls
              className={styles.captionImage}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                borderRadius: 8,
              }}
            />
          </div>
        )}
      </div>
      <div className={styles.captionPanel}>
        <div className={styles.captionUserInfo}>
          <div className={styles.captionAvatar}>
            <Image
              src={user?.profilePicture || ""}
              alt="avatar"
              width={32}
              height={32}
              className={styles.captionAvatarImage}
            />
          </div>
          <span className={styles.captionUsername}>{username}</span>
        </div>
        <textarea
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="Viết chú thích..."
          className={styles.captionTextarea}
          rows={5}
          maxLength={2200}
        />
        <div className={styles.textareaFooter}>
          <Smile size={20} color="#a3a3a3" className={styles.emojiIcon} />
          <span className={styles.captionCounter}>{caption.length}/2,200</span>
        </div>

        <div className={styles.captionOptions}>
          <div className={styles.captionOption}>
            <span>Thêm vị trí</span>
            <MapPin size={20} color="#a3a3a3" />
          </div>
          <div className={styles.captionOption}>
            <span>Thêm cộng tác viên</span>
            <UserPlus size={20} color="#a3a3a3" />
          </div>
        </div>
        <div className={styles.shareSection}>
          <span className={styles.shareSectionTitle}>Chia sẻ lên</span>
          <div className={styles.shareOption}>
            <div
              className={
                styles.shareOptionInfo + " flex items-center space-x-0.5"
              }
            >
              <Image
                src="https://thumbs.dreamstime.com/b/default-avatar-profile-icon-vector-social-media-user-portrait-176256935.jpg"
                alt="Facebook"
                width={36}
                height={36}
                className={`${styles.shareIcon} rounded-full`}
              />
              <div className="flex flex-col">
                <span className="font-medium">Tô Văn Lộc</span>
                <span className="text-sm text-gray-500">
                  Facebook • Tùy chỉnh
                </span>
              </div>
            </div>
            <div
              className={`${styles.shareToggle} ${
                isFacebookShareEnabled ? styles.enabled : ""
              }`}
              onClick={() => setIsFacebookShareEnabled(!isFacebookShareEnabled)}
            >
              <div className={styles.shareToggleThumb}></div>
            </div>
          </div>
        </div>
        <div className={styles.captionOption}>
          <span>Trợ năng</span>
          <Accessibility size={20} color="#a3a3a3" />
        </div>
        <div className={styles.captionOption}>
          <span>Cài đặt nâng cao</span>
          <ChevronRight size={20} color="#a3a3a3" />
        </div>
      </div>
    </div>
  );
}
