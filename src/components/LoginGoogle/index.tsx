"use client";
import {
  GoogleLogin,
  GoogleOAuthProvider,
  CredentialResponse,
} from "@react-oauth/google";
import { googleLogin } from "@/server/auth";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import Image from "next/image";

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

  // Apply CSS to make all Google buttons display at 100% width
  useEffect(() => {
    // Create a style element
    const styleEl = document.createElement("style");
    styleEl.textContent = `
      /* Style for Google One Tap */
      .google-one-tap-container,
      .google-one-tap-container > div,
      .google-one-tap-container > div > div,
      .S9gUrf-YoZ4jf,
      .nsm7Bb-HzV7m-LgbsSe,
      .nsm7Bb-HzV7m-LgbsSe.pSzOP-SxQuSe {
        width: 100% !important;
        max-width: 100% !important;
        display: block !important;
      }

      /* Style for the credential picker container */
      div[aria-modal="true"] div[role="dialog"] {
        max-width: 100% !important;
      }

      /* Ensure the inner button element is also 100% width */
      .ksBjEc {
        width: 100% !important;
      }

      /* Standard Google login button */
      .google-login-button-container,
      .google-login-button-container > div,
      .google-login-button-container > div > div,
      .google-login-button-container iframe,
      .google-login-button-container button {
        width: 100% !important;
        max-width: 100% !important;
      }
    `;
    document.head.appendChild(styleEl);

    // Cleanup function
    return () => {
      document.head.removeChild(styleEl);
    };
  }, []);

  // Additionally, directly modify button elements after they're rendered
  useEffect(() => {
    const applyWidthToGoogleButtons = () => {
      // Target the One Tap button specifically
      const oneTapButtons = document.querySelectorAll(".nsm7Bb-HzV7m-LgbsSe");
      oneTapButtons.forEach((button) => {
        if (button instanceof HTMLElement) {
          button.style.width = "100%";
          button.style.maxWidth = "100%";

          // Also target parent containers
          let parent = button.parentElement;
          while (parent) {
            if (parent instanceof HTMLElement) {
              parent.style.width = "100%";
              parent.style.maxWidth = "100%";
            }
            parent = parent.parentElement;
          }
        }
      });
    };

    // Run immediately and then set an interval to catch buttons that render dynamically
    applyWidthToGoogleButtons();
    const interval = setInterval(applyWidthToGoogleButtons, 500);

    return () => clearInterval(interval);
  }, []);

  return (
    <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_APP_ID!}>
      <div
        ref={containerRef}
        style={{
          width: "100%",
          maxWidth: "100%",
          display: "block",
        }}
        className="google-one-tap-container google-login-button-container"
      >
        {/* Custom button that looks like Google One Tap but spans full width */}
        <div
          className="custom-google-button"
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            padding: "10px",
            border: "1px solid #dadce0",
            borderRadius: "4px",
            backgroundColor: "#fff",
            cursor: "pointer",
            boxSizing: "border-box",
            marginBottom: "10px",
          }}
          onClick={() => {
            // This will trigger the GoogleLogin component's click handler
            const googleLoginButton =
              containerRef.current?.querySelector("button");
            if (googleLoginButton) {
              googleLoginButton.click();
            }
          }}
        >
          <Image
            src="https://developers.google.com/identity/images/g-logo.png"
            alt="Google Logo"
            style={{ width: "18px", height: "18px", marginRight: "10px" }}
          />
          <div
            style={{
              flex: 1,
              textAlign: "center",
              color: "#3c4043",
              fontFamily: "Roboto, sans-serif",
              fontSize: "14px",
            }}
          >
            Tiếp tục bằng tên Tô Văn Lộc
          </div>
          <div style={{ width: "20px" }}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 48 48"
            >
              <path
                fill="#EA4335"
                d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
              />
              <path
                fill="#4285F4"
                d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
              />
              <path
                fill="#FBBC05"
                d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
              />
              <path
                fill="#34A853"
                d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
              />
              <path fill="none" d="M0 0h48v48H0z" />
            </svg>
          </div>
        </div>

        {/* Hidden GoogleLogin that will be triggered by our custom button */}
        <div
          style={{
            position: "absolute",
            opacity: 0,
            pointerEvents: "none",
            height: 0,
          }}
        >
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
      </div>
    </GoogleOAuthProvider>
  );
}
