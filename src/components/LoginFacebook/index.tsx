import { Facebook } from "lucide-react";
import { useEffect, useState } from "react";
import { facebookLogin } from "../../server/auth";

// Định nghĩa kiểu dữ liệu cho Facebook SDK
interface FacebookSDK {
  init(options: {
    appId: string;
    cookie: boolean;
    xfbml: boolean;
    version: string;
  }): void;
  login(
    callback: (response: FacebookLoginResponse) => void,
    options?: { scope: string; return_scopes: boolean }
  ): void;
  api(
    path: string,
    params: { fields: string },
    callback: (response: FacebookUserInfo) => void
  ): void;
  getLoginStatus(callback: (response: FacebookLoginResponse) => void): void;
}

interface FacebookLoginResponse {
  authResponse?: {
    accessToken: string;
    userID: string;
    expiresIn: number;
    signedRequest: string;
  };
  status?: string;
}

interface FacebookUserInfo {
  id: string;
  name: string;
  email?: string;
}

// Thêm FB vào window global
declare global {
  interface Window {
    FB: FacebookSDK;
    fbAsyncInit: () => void;
  }
}

export default function LoginFacebook() {
  const [isSDKLoaded, setIsSDKLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Nếu đã có script, kiểm tra FB readiness
    if (document.getElementById("facebook-jssdk")) {
      const interval = setInterval(() => {
        if (
          window.FB &&
          typeof window.FB.init === "function" &&
          typeof window.FB.getLoginStatus === "function"
        ) {
          setIsSDKLoaded(true);
          clearInterval(interval);
        }
      }, 100);
      return;
    }

    window.fbAsyncInit = function () {
      window.FB.init({
        appId: process.env.NEXT_PUBLIC_FACEBOOK_APP_ID || "",
        cookie: true,
        xfbml: true,
        version: "v18.0",
      });
      // Polling readiness
      const interval = setInterval(() => {
        if (window.FB && typeof window.FB.getLoginStatus === "function") {
          setIsSDKLoaded(true);
          clearInterval(interval);
        }
      }, 100);
    };

    (function (d: Document, s: string, id: string) {
      const fjs = d.getElementsByTagName(s)[0];
      if (d.getElementById(id)) return;

      const js = d.createElement(s) as HTMLScriptElement;
      js.id = id;
      js.src = "https://connect.facebook.net/vi_VN/sdk.js";
      js.async = true;
      js.defer = true;
      js.crossOrigin = "anonymous";

      if (fjs && fjs.parentNode) {
        fjs.parentNode.insertBefore(js, fjs);
      }
    })(document, "script", "facebook-jssdk");
  }, []);

  const handleFacebookLogin = () => {
    if (!isSDKLoaded || !window.FB) {
      console.error("Facebook SDK chưa được tải hoặc chưa khởi tạo");
      return;
    }

    setIsLoading(true);

    try {
      window.FB.getLoginStatus((response) => {
        if (response.status === "connected" && response.authResponse) {
          // Nếu đã đăng nhập, lấy thông tin người dùng
          window.FB.api(
            "/me",
            { fields: "name,email" },
            (userInfo: FacebookUserInfo) => {
              handleFacebookAuthResponse(
                response.authResponse!.accessToken,
                response.authResponse!.userID,
                userInfo
              );
            }
          );
        } else {
          // Nếu chưa đăng nhập, thực hiện login
          window.FB.login(
            (response: FacebookLoginResponse) => {
              if (response.authResponse) {
                const { accessToken, userID } = response.authResponse;

                // Lấy thông tin người dùng từ Facebook
                window.FB.api(
                  "/me",
                  { fields: "name,email" },
                  (userInfo: FacebookUserInfo) => {
                    // Xử lý thông tin đăng nhập
                    handleFacebookAuthResponse(accessToken, userID, userInfo);
                  }
                );
              } else {
                console.log("Người dùng đã hủy đăng nhập hoặc không cấp quyền");
                setIsLoading(false);
              }
            },
            {
              scope: "public_profile,email",
              return_scopes: true,
            }
          );
        }
      });
    } catch (error) {
      console.error("Lỗi khi khởi tạo đăng nhập Facebook:", error);
      setIsLoading(false);
    }
  };

  const handleFacebookAuthResponse = async (
    accessToken: string,
    userID: string,
    userInfo: FacebookUserInfo
  ) => {
    try {
      // Gọi API xác thực phía server
      const result = await facebookLogin({
        accessToken,
        userID,
        name: userInfo.name,
        email: userInfo.email || "",
      });

      // Xử lý sau khi đăng nhập thành công
      console.log("Đăng nhập thành công:", result);

      // Reload trang để cập nhật trạng thái đăng nhập
      window.location.href = "/"; // Hoặc redirect đến trang cần thiết
    } catch (error) {
      console.error("Lỗi khi xác thực với server:", error);
      alert("Đăng nhập không thành công. Vui lòng thử lại.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={handleFacebookLogin}
        disabled={isLoading || !isSDKLoaded}
        className="flex w-full items-center justify-center space-x-2 py-2 text-sm font-semibold text-blue-500 hover:bg-blue-50 rounded-md transition-colors disabled:opacity-50"
      >
        <Facebook size={18} />
        <span>{isLoading ? "Đang xử lý..." : "Đăng nhập bằng Facebook"}</span>
      </button>
    </>
  );
}
