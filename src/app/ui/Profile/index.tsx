import Image from "next/image";
import { User } from "@/types/user.type";
import styles from "./Profile.module.scss";
import Infor from "./Infor/Infor";
import TabProfile from "./TabProfile";
import AddStory from "../../../components/AddStory";
import UploadAvatar from "@/components/Modal/AvatarPicture/upLoadAvatar";
import IsProfile from "@/components/isProfile";
import { useState } from "react";
import HeaderProfile from "./HeaderProfile";

export default function Profile({ user: initialUser }: { user: User }) {
  const [user, setUser] = useState<User>(initialUser);
  const [showAvatarModal, setShowAvatarModal] = useState(false);

  const handleAvatarClick = () => {
    setShowAvatarModal(true);
  };

  const handleAvatarChange = (newAvatarUrl: string | null) => {
    setUser((prev) => ({
      ...prev,
      profilePicture: newAvatarUrl || prev.profilePicture,
    }));
  };

  return (
    <div className={styles.container}>
      <HeaderProfile user={user} />
      <div className={styles.content}>
        <div className={styles.header}>
          <IsProfile
            profileId={user.id || user.username}
            fallback={
              <div className={styles.avatar}>
                <Image
                  src={user.profilePicture}
                  alt="avatar"
                  width={150}
                  height={150}
                  className={styles.avatarImage}
                />
                <div className={styles.fullName}>
                  <h3>{user.fullName}</h3>
                </div>
              </div>
            }
          >
            <div
              className={styles.avatar}
              onClick={handleAvatarClick}
              style={{ cursor: "pointer" }}
            >
              <Image
                src={user.profilePicture}
                alt="avatar"
                width={150}
                height={150}
                className={styles.avatarImage}
              />
              <div className={styles.fullName}>
                <h3>{user.fullName}</h3>
              </div>
            </div>
          </IsProfile>

          <Infor user={user} />
        </div>

        {/* phần thêm tin */}
        <AddStory />

        {/* phần tab */}
        <TabProfile user={user} />
      </div>

      {/* Modal upload avatar */}
      {showAvatarModal && (
        <UploadAvatar
          currentAvatar={user.profilePicture}
          onClose={() => setShowAvatarModal(false)}
          onAvatarChange={handleAvatarChange}
        />
      )}
    </div>
  );
}
