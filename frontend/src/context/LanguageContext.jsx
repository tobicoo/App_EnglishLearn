import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';

const translations = {
  vi: {
    // Tabs
    tab_study: 'Học tập',
    tab_english_pro: 'English Pro',
    tab_leaderboard: 'Xếp hạng',
    tab_profile: 'Hồ sơ',
    tab_menu: 'Menu',

    // Header tim
    hearts_full: 'Đầy tim',
    hearts_refilling: 'Đang hồi tim',
    hearts_almost: 'Sắp hồi tim',
    hearts_next: 'Tim tiếp theo: {n} phút',

    // Menu / Settings screen
    section_account: 'TÀI KHOẢN',
    section_activity: 'HOẠT ĐỘNG',
    section_app: 'ỨNG DỤNG',
    section_admin: 'QUẢN TRỊ',
    menu_profile_info: 'Thông tin cá nhân',
    menu_change_password: 'Đổi mật khẩu',
    menu_history: 'Lịch sử học tập',
    menu_create_exam: 'Tạo đề thi',
    menu_saved_exams: 'Đề đã lưu',
    menu_language: 'Ngôn ngữ',
    menu_settings: 'Cài đặt',
    menu_support: 'Hỗ trợ',
    menu_admin_panel: 'Admin Panel',
    logout: 'Đăng xuất',
    logout_confirm_title: 'Đăng xuất',
    logout_confirm_msg: 'Bạn có chắc chắn muốn đăng xuất?',
    logout_cancel: 'Hủy',
    no_session: 'Chưa có phiên đăng nhập',

    // Profile
    profile_loading: 'Đang tải hồ sơ...',
    profile_empty_title: 'Chưa có thông tin hồ sơ',
    profile_empty_msg: 'Vui lòng đăng nhập lại để xem hồ sơ của bạn.',
    profile_retry: 'Thử lại',
    profile_xp_progress: 'XP Progress',
    profile_account_info: 'Thông tin tài khoản',
    profile_email: 'Email',
    profile_joined: 'Ngày tham gia',

    // Language screen
    language_title: 'Ngôn ngữ',
    language_current: 'Ngôn ngữ hiện tại:',
    language_more: 'Thêm ngôn ngữ:',
    language_save: 'LƯU THAY ĐỔI',
    language_saving: 'Đang lưu...',
    language_saved_title: 'Đã lưu',
    language_saved_msg: 'Ngôn ngữ đã được cập nhật.',
    back: '‹ Quay lại',

    // Support
    support_title: 'Hỗ trợ',
    support_msg: 'Liên hệ hỗ trợ: support@mqtlearn.com',
  },
  en: {
    // Tabs
    tab_study: 'Study',
    tab_english_pro: 'English Pro',
    tab_leaderboard: 'Leaderboard',
    tab_profile: 'Profile',
    tab_menu: 'Menu',

    // Header tim
    hearts_full: 'Full hearts',
    hearts_refilling: 'Refilling...',
    hearts_almost: 'Almost ready',
    hearts_next: 'Next heart: {n} min',

    // Menu / Settings screen
    section_account: 'ACCOUNT',
    section_activity: 'ACTIVITY',
    section_app: 'APPLICATION',
    section_admin: 'ADMIN',
    menu_profile_info: 'Personal Info',
    menu_change_password: 'Change Password',
    menu_history: 'Learning History',
    menu_create_exam: 'Create Exam',
    menu_saved_exams: 'Saved Exams',
    menu_language: 'Language',
    menu_settings: 'Settings',
    menu_support: 'Support',
    menu_admin_panel: 'Admin Panel',
    logout: 'Log Out',
    logout_confirm_title: 'Log Out',
    logout_confirm_msg: 'Are you sure you want to log out?',
    logout_cancel: 'Cancel',
    no_session: 'No active session',

    // Profile
    profile_loading: 'Loading profile...',
    profile_empty_title: 'No profile data',
    profile_empty_msg: 'Please log in again to view your profile.',
    profile_retry: 'Retry',
    profile_xp_progress: 'XP Progress',
    profile_account_info: 'Account Information',
    profile_email: 'Email',
    profile_joined: 'Joined',

    // Language screen
    language_title: 'Language',
    language_current: 'Current language:',
    language_more: 'More languages:',
    language_save: 'SAVE CHANGES',
    language_saving: 'Saving...',
    language_saved_title: 'Saved',
    language_saved_msg: 'Language has been updated.',
    back: '‹ Back',

    // Support
    support_title: 'Support',
    support_msg: 'Contact support: support@mqtlearn.com',
  },
};

const SUPPORTED_CODES = Object.keys(translations);

const storageKey = (userId) => `app_language_${userId}`;

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const { user } = useAuth();
  const userId = user?.id ?? null;

  const [lang, setLangState] = useState('vi');

  // Load language khi userId thay đổi (login/logout/switch user)
  useEffect(() => {
    if (!userId) {
      setLangState('vi');
      return;
    }
    AsyncStorage.getItem(storageKey(userId)).then((saved) => {
      if (saved && SUPPORTED_CODES.includes(saved)) {
        setLangState(saved);
      } else {
        setLangState('vi');
      }
    });
  }, [userId]);

  const setLanguage = async (code) => {
    if (!SUPPORTED_CODES.includes(code)) return;
    setLangState(code);
    if (userId) {
      await AsyncStorage.setItem(storageKey(userId), code);
    }
  };

  const t = (key, vars) => {
    const dict = translations[lang] ?? translations.vi;
    let str = dict[key] ?? translations.vi[key] ?? key;
    if (vars) {
      Object.entries(vars).forEach(([k, v]) => {
        str = str.replace(`{${k}}`, String(v));
      });
    }
    return str;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => useContext(LanguageContext);
