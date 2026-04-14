import React, { createContext, useContext, useState, useEffect } from 'react';
import { getUserProfile, login as apiLogin } from '@/services/api';
import { saveUserId, getUserId, clearUserId } from '@/services/auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Khi app khởi động: kiểm tra session đã lưu
  useEffect(() => {
    const bootAuth = async () => {
      try {
        const userId = await getUserId();
        if (userId && userId !== '1') {
          const { data } = await getUserProfile(userId);
          if (data) setUser(data);
        }
      } catch (e) {
        // Không có session hoặc lỗi → giữ user = null
      } finally {
        setIsLoading(false);
      }
    };
    bootAuth();
  }, []);

  // Đăng nhập
  const login = async (email, password) => {
    const { data, error } = await apiLogin(email, password);
    if (error) return { error };
    if (!data) return { error: 'Email hoặc mật khẩu không đúng' };
    await saveUserId(data.id);
    setUser(data);
    return { data };
  };

  // Đăng xuất
  const logout = async () => {
    await clearUserId();
    setUser(null);
  };

  // Tải lại profile từ server (dùng sau khi hoàn thành quiz)
  const refreshUser = async () => {
    if (!user?.id) return;
    const { data } = await getUserProfile(user.id);
    if (data) setUser(data);
  };

  // Cập nhật user state tạm thời không cần gọi server
  const updateUserLocally = (patch) => {
    setUser((prev) => prev ? { ...prev, ...patch } : prev);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, refreshUser, updateUserLocally }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
