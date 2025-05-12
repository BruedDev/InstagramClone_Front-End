import styles from "./Infor/Infor.module.scss";
import { User } from "@/types/user.type";

export default function Infor({ user }: { user: User }) {
  return (
    <div className={styles.information}>
      <div>username: {user.username}</div>
      <div>fullName: {user.fullName}</div>
      <div>followers: {user.followers?.length || 0}</div>
      <div>following: {user.following?.length || 0}</div>
      <div>post: {user.post || 0}</div>
    </div>
  );
}
