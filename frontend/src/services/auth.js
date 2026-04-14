import AsyncStorage from '@react-native-async-storage/async-storage';

const USER_ID_KEY = 'user_id';

export const saveUserId = async (id) => {
  try {
    await AsyncStorage.setItem(USER_ID_KEY, String(id));
  } catch (e) {
    console.error('Lỗi lưu userId:', e);
  }
};

export const getUserId = async () => {
  try {
    const id = await AsyncStorage.getItem(USER_ID_KEY);
    return id || '1'; // Default là 1 nếu chưa đăng nhập (để app không crash)
  } catch (e) {
    return '1';
  }
};

export const clearUserId = async () => {
  try {
    await AsyncStorage.removeItem(USER_ID_KEY);
  } catch (e) {
    console.error('Lỗi xóa userId:', e);
  }
};
