import ProtectedRoute from "@/components/ProtectedRoute";

export default function Home() {
  return (
    <ProtectedRoute>
      <h1>Trang chủ</h1>
    </ProtectedRoute>
  );
}
