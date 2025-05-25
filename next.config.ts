import path from "path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "platform-lookaside.fbsbx.com" },
      { protocol: "https", hostname: "thumbs.dreamstime.com" },
      { protocol: "https", hostname: "www.shutterstock.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "i.pinimg.com" },
      { protocol: "https", hostname: "cdn.pixabay.com" },
      { protocol: "https", hostname: "images.pexels.com" },
      { protocol: "https", hostname: "www.gstatic.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "firebasestorage.googleapis.com" },
      { protocol: "https", hostname: "cdn.discordapp.com" },
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
      { protocol: "https", hostname: "www.gravatar.com" },
      { protocol: "https", hostname: "res.cloudinary.com" },
      {
        protocol: "https",
        hostname: "api.dicebear.com",
        pathname: '/7.x/**'
      },
      {
        protocol: "https",
        hostname: "ui-avatars.com",
        pathname: '/api/**'
      },
      {
        protocol: "https",
        hostname: "randomuser.me",
        pathname: '/api/portraits/**'
      }
    ],
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  sassOptions: {
    includePaths: [path.join(__dirname, "src/styles")],
    prependData: `@use "variables" as *; @use "mixins" as *; @use "functions" as *;`,
    outputStyle: "compressed",
  },
};

export default nextConfig;