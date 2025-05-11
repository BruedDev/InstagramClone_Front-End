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
          /* Styling cho tất cả các button và container của Google */
          .nsm7Bb-HzV7m-LgbsSe,
          .nsm7Bb-HzV7m-LgbsSe.pSzOP-SxQuSe,
          .S9gUrf-YoZ4jf,
          .ksBjEc,
          .Vwe4Vb-MZArnb,
          .FliLIb,
          .zJKIV,
          .gPHLDe,
          div[role="button"],
          div[aria-labelledby="button-label"],
          div[data-is-touch-wrapper="true"],
          button.gsi-material-button,
          .gsi-material-button,
          .S9gUrf-YoZ4jf,
          .nsm7Bb-HzV7m-LgbsSe-BPrWId,
          .nsm7Bb-HzV7m-LgbsSe-MJoBVe .r2fjmd {
            width: 100% !important;
            max-width: 100% !important;
            min-width: 100% !important;
          }

          /* Đảm bảo các div cha cũng có width 100% */
          div.aJyGGd div {
            width: 100% !important;
            min-width: 100% !important;
          }

          /* Styling cho các container bên ngoài */
          .L5Fo6c-sM5MNb {
            width: 100% !important;
            display: block !important;
          }

          /* Styling cho các iframe có thể xuất hiện */
          iframe {
            width: 100% !important;
          }

          /* Styling cho button được hiển thị (One Tap) */
          .Jx4nYe {
            width: 100% !important;
          }
        `}</style>
        <GoogleLogin
          onSuccess={handleSuccess}
          onError={() => console.log("Login Failed")}
          useOneTap
          text="continue_with"
          locale="vi"
          width="100%"
        />
      </div>
    </GoogleOAuthProvider>
  );
}
