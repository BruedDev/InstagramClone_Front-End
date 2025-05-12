import Image from "next/image";
import { User } from "@/types/user.type";
import styles from "../Profile.module.scss";
import Infor from "../Infor";

export default function Profile({ user }: { user: User }) {
  console.log(user);
  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.header}>
          <div className={styles.avatar}>
            <Image
              src={user.profilePicture}
              alt="avatar"
              width={100}
              height={100}
            />
          </div>
          <Infor user={user} />
        </div>
      </div>
    </div>
  );
}
