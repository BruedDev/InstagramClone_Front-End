import { useRouter } from "next/navigation";

/**
 * Hàm handleClick để chuyển hướng đến trang người dùng theo username
 * @param username
 */
export function useHandleUserClick() {
  const router = useRouter();
  return (username: string) => {
    if (!username) return;
    router.push(`/${username}`);
  };
}
