import axios, { AxiosError, AxiosResponse } from 'axios';
import { toast } from "react-hot-toast";

// API base URL from environment variables
const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// Khởi tạo axios với cấu hình mặc định
const api = axios.create({
 baseURL: apiUrl,
 withCredentials: true,
 headers: {
   'Content-Type': 'application/json',
 },
});

// Interceptor để xử lý lỗi
api.interceptors.response.use(
 (response: AxiosResponse) => response,
 (error: AxiosError) => {
   const message =
     error.response?.data && typeof error.response.data === 'object' && 'message' in error.response.data
       ? String(error.response.data.message)
       : 'Something went wrong';
   toast.error(message);
   return Promise.reject(error);
 }
);

export default api;