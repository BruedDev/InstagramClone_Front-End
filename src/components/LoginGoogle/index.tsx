"use client";
import {
  GoogleLogin,
  GoogleOAuthProvider,
  CredentialResponse,
} from "@react-oauth/google";
import { googleLogin } from "@/server/auth";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import styles from "./LoginGoogle.module.scss";

export default function LoginGoogle() {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);

  // Khai báo kiểu cho payload của Google Login
  interface GoogleAuthPayload {
    tokenId: string;
  }

  const handleSuccess = async (credentialResponse: CredentialResponse) => {
    try {
      const credential = credentialResponse?.credential;
      if (!credential) throw new Error("No credential received");

      const payload: GoogleAuthPayload = { tokenId: credential };

      // Gọi hàm googleLogin với payload đã được định nghĩa đúng kiểu
      const user = await googleLogin(payload);
      console.log("Đăng nhập thành công:", user);

      router.push("/");
    } catch (error) {
      if (error instanceof Error) {
        console.error("Google login failed:", error.message);
      } else {
        console.error("Unknown error occurred during Google login.");
      }
    }
  };

  // Add CSS to ensure Google button is full width
  useEffect(() => {
    if (containerRef.current) {
      // Apply styling to the container
      containerRef.current.style.width = "100%";
      containerRef.current.style.display = "block";

      // Find and style the iframe and button within the container
      setTimeout(() => {
        const iframe = containerRef.current?.querySelector("iframe");
        const button = containerRef.current?.querySelector("button");

        if (iframe) {
          iframe.style.width = "100%";
        }

        if (button) {
          button.style.width = "100%";
        }
      }, 100);
    }
  }, []);

  return (
    <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_APP_ID!}>
      <div ref={containerRef} className={styles.googleCustomBtn}>
        <GoogleLogin
          onSuccess={handleSuccess}
          onError={() => console.log("Login Failed")}
          theme="outline"
          useOneTap
          shape="rectangular"
          locale="vi"
        />
      </div>
    </GoogleOAuthProvider>
  );
}
