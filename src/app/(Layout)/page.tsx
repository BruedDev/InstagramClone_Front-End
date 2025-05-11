"use client";

import { logout } from "@/server/auth";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await logout();

      // Clear all cookies
      document.cookie.split(";").forEach((cookie) => {
        const cookieName = cookie.split("=")[0];
        // Set each cookie's expiration date to the past to remove it
        document.cookie = `${cookieName}=; Max-Age=-99999999; path=/;`;
        document.cookie = `${cookieName}=; Max-Age=-99999999; path=/; domain=${window.location.hostname};`; // Ensures cookies from subdomains are cleared
      });

      // Clear localStorage
      localStorage.clear();

      // Redirect to accounts page
      router.push("/accounts");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <div>
      <button onClick={handleLogout}>Logout</button>
    </div>
  );
}
