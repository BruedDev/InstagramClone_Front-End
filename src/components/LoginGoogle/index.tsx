"use client";
import {
  GoogleLogin,
  GoogleOAuthProvider,
  CredentialResponse,
} from "@react-oauth/google";
import { googleLogin } from "@/server/auth";
import { useRouter } from "next/navigation";
import { GoogleAuthPayload } from "@/types/auth.type";

interface LoginGoogleProps {
  mode?: "signin" | "signup"; // bạn có thể thêm các giá trị khác nếu cần
}

export default function LoginGoogle({ mode = "signin" }: LoginGoogleProps) {
  const router = useRouter();

  const handleSuccess = async (credentialResponse: CredentialResponse) => {
    try {
      const credential = credentialResponse?.credential;
      if (!credential) throw new Error("No credential received");

      const payload: GoogleAuthPayload = { tokenId: credential };
      const user = await googleLogin(payload);
      localStorage.setItem("id", user.id);
      localStorage.setItem("username", user.username);
      router.push("/");
    } catch (error) {
      if (error instanceof Error) {
        console.error("Google login failed:", error.message);
      } else {
        console.error("Unknown error occurred during Google login.");
      }
    }
  };

  // Xác định giá trị text theo mode
  const googleButtonText = mode === "signup" ? "signup_with" : "signin_with";

  return (
    <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_APP_ID!}>
      <div
        className="google-login-container"
        style={{
          width: "100%",
          maxWidth: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <GoogleLogin
          onSuccess={handleSuccess}
          onError={() => console.log("Login Failed")}
          theme="outline"
          useOneTap
          shape="rectangular"
          text={googleButtonText}
          locale="vi"
        />
      </div>
    </GoogleOAuthProvider>
  );
}
