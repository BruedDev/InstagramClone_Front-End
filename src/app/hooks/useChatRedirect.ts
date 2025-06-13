import { useRouter } from "next/navigation";

/**
 * Custom hook để chuyển hướng đến cuộc hội thoại chat giữa 2 người dùng
 * @returns Hàm redirectToChat nhận userId hoặc user object
 */
export function useChatRedirect() {
  const router = useRouter();

  /**
   * Chuyển hướng đến trang chat với userId hoặc user object
   * @param user User object hoặc userId string
   */
  function redirectToChat(user: { _id: string } | string) {
    const id = typeof user === "string" ? user : user._id;
    router.push(`/messages?id=${id}`);
  }

  return redirectToChat;
}
