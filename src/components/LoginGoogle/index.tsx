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

  interface GoogleAuthPayload {
    tokenId: string;
  }

  const handleSuccess = async (credentialResponse: CredentialResponse) => {
    try {
      const credential = credentialResponse?.credential;
      if (!credential) throw new Error("No credential received");

      const payload: GoogleAuthPayload = { tokenId: credential };
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

  // Inject class trực tiếp vào button Google sau khi render
  useEffect(() => {
    const timer = setTimeout(() => {
      const button = containerRef.current?.querySelector('div[role="button"]');
      if (button) {
        button.classList.add(styles.googleCustomBtn);
      }
    }, 300); // Delay để Google button được render

    return () => clearTimeout(timer);
  }, []);

  return (
    <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_APP_ID!}>
      <div ref={containerRef}>
        <GoogleLogin
          onSuccess={handleSuccess}
          onError={() => console.log("Login Failed")}
          theme="outline"
          useOneTap
          shape="rectangular"
          text="continue_with"
          locale="vi"
        />
      </div>
    </GoogleOAuthProvider>
  );
}
