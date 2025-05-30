"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getUser } from "@/server/user";
import { GetUserResponse } from "@/types/user.type";
import Profile from "@/app/ui/Profile/index";
import Loading from "@/components/Loading/Loading";

export default function ProfileUserId() {
  const params = useParams();
  const [user, setUser] = useState<GetUserResponse["user"] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [id, setId] = useState<string | null>(null);

  useEffect(() => {
    if (params.id) {
      setId(params.id as string);
    }
  }, [params.id]);

  useEffect(() => {
    const fetchUser = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const response = await getUser(id);
        setUser(response.user);
        setError(null);
      } catch (err) {
        console.error("Lỗi khi lấy thông tin người dùng:", err);
        setError("Không thể tải thông tin người dùng");
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchUser();
  }, [id]);

  if (loading) {
    return <Loading />;
  }

  if (error) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen">
        <h1 className="text-2xl font-bold text-red-500">Lỗi</h1>
        <p>{error}</p>
        <button
          onClick={() => (window.location.href = "/")}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Về trang chủ
        </button>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen">
        <h1 className="text-2xl font-bold">Không tìm thấy người dùng</h1>
        <button
          onClick={() => (window.location.href = "/")}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Về trang chủ
        </button>
      </div>
    );
  }

  return <Profile user={user} />;
}
