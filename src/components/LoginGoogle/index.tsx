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

  // Responsive styling with min-width
  useEffect(() => {
    if (containerRef.current) {
      // Apply styling to the container
      containerRef.current.style.width = "100%";
      containerRef.current.style.display = "block";
      containerRef.current.style.minWidth = "300px";
      containerRef.current.style.maxWidth = "100%"; // Ensure it doesn't overflow its parent

      // Create and apply a style element for broader coverage
      const styleElement = document.createElement("style");
      styleElement.textContent = `
        #${containerRef.current.id || "google-login-container"} iframe,
        #${containerRef.current.id || "google-login-container"} button,
        #${containerRef.current.id || "google-login-container"} div {
          min-width: 300px !important;
          max-width: 100% !important;
          width: 100% !important;
        }
      `;
      document.head.appendChild(styleElement);

      // Find and style the iframe and button within the container
      const applyInlineStyles = () => {
        const iframe = containerRef.current?.querySelector("iframe");
        const button = containerRef.current?.querySelector("button");
        const divs = containerRef.current?.querySelectorAll("div");

        if (iframe) {
          iframe.style.width = "100%";
          iframe.style.minWidth = "300px";
          iframe.style.maxWidth = "100%";
        }

        if (button) {
          button.style.width = "100%";
          button.style.minWidth = "300px";
          button.style.maxWidth = "100%";
        }

        // Apply to all internal divs as well to ensure coverage
        if (divs) {
          divs.forEach((div) => {
            div.style.width = "100%";
            div.style.minWidth = "300px";
            div.style.maxWidth = "100%";
          });
        }
      };

      // Apply styles at different points to ensure they take effect
      applyInlineStyles();
      setTimeout(applyInlineStyles, 100);
      setTimeout(applyInlineStyles, 500);

      // Set up a MutationObserver to handle dynamically added content
      const observer = new MutationObserver(() => {
        applyInlineStyles();
      });

      observer.observe(containerRef.current, {
        childList: true,
        subtree: true,
      });

      // Clean up
      return () => {
        observer.disconnect();
        if (styleElement.parentNode) {
          styleElement.parentNode.removeChild(styleElement);
        }
      };
    }
  }, []);

  return (
    <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_APP_ID!}>
      <div
        ref={containerRef}
        className={styles.googleCustomBtn}
        id="google-login-container"
      >
        <GoogleLogin
          onSuccess={handleSuccess}
          onError={() => console.log("Login Failed")}
          theme="outline"
          useOneTap
          shape="rectangular"
          locale="vi"
          // Removed fixed width to preserve responsiveness
        />
      </div>
    </GoogleOAuthProvider>
  );
}
