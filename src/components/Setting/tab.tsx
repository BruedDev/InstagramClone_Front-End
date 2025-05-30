import {
  User,
  Bell,
  Lock,
  Shield,
  HelpCircle,
  Info,
  Moon,
  Globe,
} from "lucide-react";

export const tabs = [
  { id: "account", label: "Tài khoản", icon: <User size={20} /> },
  { id: "privacy", label: "Quyền riêng tư", icon: <Lock size={20} /> },
  { id: "security", label: "Bảo mật", icon: <Shield size={20} /> },
  { id: "notifications", label: "Thông báo", icon: <Bell size={20} /> },
  { id: "darkmode", label: "Chế độ tối", icon: <Moon size={20} /> },
  { id: "language", label: "Ngôn ngữ", icon: <Globe size={20} /> },
  { id: "help", label: "Trợ giúp", icon: <HelpCircle size={20} /> },
  { id: "about", label: "Giới thiệu", icon: <Info size={20} /> },
  { id: "logout", label: "Đăng xuất", icon: <Info size={20} /> },
];
