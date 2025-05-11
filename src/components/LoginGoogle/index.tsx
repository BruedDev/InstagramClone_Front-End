"use client";
import {
  GoogleLogin,
  GoogleOAuthProvider,
  CredentialResponse,
} from "@react-oauth/google";
import { googleLogin } from "@/server/auth";
import { useRouter } from "next/navigation";

export default function LoginGoogle() {
  const router = useRouter();

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

  return (
    <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_APP_ID!}>
      <div style={{ width: "100%" }}>
        <style jsx global>{`
          .nsm7Bb-HzV7m-LgbsSe {
            width: 100% !important;
            max-width: 100% !important;
          }

          /* Đảm bảo container cha cũng width 100% */
          .nsm7Bb-HzV7m-LgbsSe.pSzOP-SxQuSe {
            width: 100% !important;
          }

          /* Đảm bảo các div bao ngoài đều width 100% */
          div[role="button"] {
            width: 100% !important;
          }
        `}</style>
        <GoogleLogin
          onSuccess={handleSuccess}
          onError={() => console.log("Login Failed")}
          useOneTap
          text="continue_with"
          locale="vi"
        />
      </div>
    </GoogleOAuthProvider>
  );
}
