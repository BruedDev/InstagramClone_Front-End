"use client";

export const checkAuth = async (): Promise<boolean> => {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  if (!apiUrl) {
    console.error("NEXT_PUBLIC_API_URL is not defined.");
    return false;
  }

  try {
    const response = await fetch(`${apiUrl}/api/auth/check`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    });

    return response.ok;
  } catch (error) {
    console.error("Error checking auth status:", error);
    return false;
  }
};
