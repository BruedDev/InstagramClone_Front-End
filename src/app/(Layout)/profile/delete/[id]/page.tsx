"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteUser } from "@/server/user";

interface DeletePageProps {
  params: {
    id: string;
  };
}

export default function DeletePage({ params }: DeletePageProps) {
  const router = useRouter();
  const { id } = params;
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    const confirmDelete = window.confirm(
      "Bạn có chắc chắn muốn xóa tài khoản này không?"
    );

    if (!confirmDelete) return;

    setLoading(true);

    try {
      const result = await deleteUser(id);

      if (result.success) {
        alert("Tài khoản đã được xóa thành công");
        router.push("/accounts");
      } else {
        alert(result.message || "Xóa tài khoản thất bại");
      }
    } catch (error) {
      if (error instanceof Error) {
        alert(error.message || "Đã xảy ra lỗi khi xóa tài khoản");
      } else {
        alert("Đã xảy ra lỗi không xác định khi xóa tài khoản");
      }
    }
  };

  return (
    <div style={{ padding: "2rem", textAlign: "center" }}>
      <h2>Bạn có chắc chắn muốn xóa tài khoản?</h2>
      <button
        onClick={handleDelete}
        disabled={loading}
        style={{
          marginTop: "1rem",
          padding: "0.5rem 1rem",
          backgroundColor: "#e53e3e",
          color: "white",
          border: "none",
          borderRadius: "4px",
          cursor: loading ? "not-allowed" : "pointer",
        }}
      >
        {loading ? "Đang xóa..." : "Xác nhận xóa tài khoản"}
      </button>
    </div>
  );
}
