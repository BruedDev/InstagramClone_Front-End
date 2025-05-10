import path from "path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
 images: {
    domains: [
      'platform-lookaside.fbsbx.com',
     'thumbs.dreamstime.com',
      'www.shutterstock.com',
      'images.unsplash.com',
      'i.pinimg.com',
      'cdn.pixabay.com',
      'images.pexels.com',
      'www.gstatic.com',
      'lh3.googleusercontent.com',
      'firebasestorage.googleapis.com',
      'cdn.discordapp.com',
      'avatars.githubusercontent.com',
      'www.gravatar.com',
    ],
  },
  sassOptions: {
      includePaths: [path.join(__dirname, "src/styles")],
    prependData: `@use "variables" as *; @use "mixins" as *; @use "functions" as *;`,
    outputStyle: 'compressed',
  },
  env: {
    NEXT_PUBLIC_FACEBOOK_APP_ID: process.env.NEXT_PUBLIC_FACEBOOK_APP_ID,
  },
};

export default nextConfig;
