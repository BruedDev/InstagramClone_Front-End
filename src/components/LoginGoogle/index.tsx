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
    tokenId: string; // Đảm bảo key này trùng với server
  }

  const handleSuccess = async (credentialResponse: CredentialResponse) => {
    try {
      const credential = credentialResponse?.credential;
      if (!credential) throw new Error("No credential received");

      const payload: GoogleAuthPayload = { tokenId: credential }; // Sử dụng `tokenId` thay vì `idToken`

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
        <GoogleLogin
          onSuccess={handleSuccess}
          onError={() => console.log("Login Failed")}
          theme="outline" // Bạn có thể thêm theme nếu cần
          width="100%" // Đảm bảo chiều rộng của GoogleLogin là 100%
        />
      </div>
    </GoogleOAuthProvider>
  );
}
