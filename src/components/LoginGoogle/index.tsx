"use client";
import {
  GoogleLogin,
  GoogleOAuthProvider,
  CredentialResponse,
} from "@react-oauth/google";
import { googleLogin } from "@/server/auth";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

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

  // Force Google button to be 100% width even in personalized mode
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (containerRef.current) {
        const iframe = containerRef.current.querySelector("iframe");

        if (iframe) {
          iframe.style.width = "100%";
          iframe.style.minWidth = "100%";
          iframe.style.maxWidth = "100%";
          iframe.style.display = "block";
          iframe.style.transform = "scale(1)";
          iframe.style.transformOrigin = "left center";
        }
      }
    }, 300); // đợi Google render xong

    return () => clearTimeout(timeout);
  }, []);

  return (
    <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_APP_ID!}>
      <div style={{ overflow: "hidden", width: "100%" }}>
        <div
          ref={containerRef}
          className="google-login-container"
          style={{
            width: "100%",
            maxWidth: "100%",
            display: "block",
          }}
        >
          <GoogleLogin
            onSuccess={handleSuccess}
            onError={() => console.log("Login Failed")}
            theme="outline"
            width="100%"
            useOneTap
            shape="rectangular"
            text="continue_with"
            locale="vi"
          />
        </div>
      </div>
    </GoogleOAuthProvider>
  );
}
