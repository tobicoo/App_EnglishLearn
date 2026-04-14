import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { GameConfig } from '@/constants/theme';

// Tự động chọn URL phù hợp theo platform
const getBaseUrl = () => {
  const debuggerHost = Constants.expoGoConfig?.debuggerHost
    || Constants.manifest2?.extra?.expoGo?.debuggerHost
    || Constants.manifest?.debuggerHost;

  if (debuggerHost) {
    const ip = debuggerHost.split(':')[0];
    return `http://${ip}:3000`;
  }

  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:3000'; // Android emulator
  }
  return 'http://localhost:3000'; // iOS simulator & web
};

const API_URL = getBaseUrl();

// ==================== USER ====================

export async function login(email, password) {
  try {
    const res = await fetch(`${API_URL}/users?email=${encodeURIComponent(email)}`);
    if (!res.ok) return { data: null, error: `Lỗi server ${res.status}` };
    const users = await res.json();
    const matched = users.find((u) => u.password === password);
    if (!matched) return { data: null, error: 'Email hoặc mật khẩu không đúng' };
    return { data: matched, error: null };
  } catch (e) {
    return { data: null, error: 'Không thể kết nối tới server. Hãy chắc chắn json-server đang chạy.' };
  }
}

export async function register({ name, email, password, age }) {
  try {
    const res = await fetch(`${API_URL}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        email,
        password,
        age: Number(age),
        avatar: '🐣',
        level: 1,
        xp: 0,
        streak: 0,
        gems: 0,
        hearts: GameConfig.MAX_HEARTS,
        completedUnitIds: [],
      }),
    });
    if (!res.ok) return { data: null, error: `Lỗi server ${res.status}` };
    return { data: await res.json(), error: null };
  } catch (e) {
    return { data: null, error: 'Không thể kết nối tới server. Hãy chắc chắn json-server đang chạy.' };
  }
}

export async function getUserProfile(userId) {
  try {
    const res = await fetch(`${API_URL}/users/${userId}`);
    if (!res.ok) return { data: null, error: `Lỗi server ${res.status}` };
    return { data: await res.json(), error: null };
  } catch (e) {
    return { data: null, error: 'Không thể kết nối tới server' };
  }
}

export async function updateUser(userId, data) {
  try {
    const res = await fetch(`${API_URL}/users/${userId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) return { data: null, error: `Lỗi server ${res.status}` };
    return { data: await res.json(), error: null };
  } catch (e) {
    return { data: null, error: 'Không thể cập nhật dữ liệu' };
  }
}

// ==================== SECTIONS & UNITS ====================

export async function getSectionsWithUnits(userId) {
  try {
    const [sectionsRes, unitsRes, userRes] = await Promise.all([
      fetch(`${API_URL}/sections`),
      fetch(`${API_URL}/units?_sort=order`),
      fetch(`${API_URL}/users/${userId}`),
    ]);

    if (!sectionsRes.ok || !unitsRes.ok || !userRes.ok) {
      return { data: null, error: 'Không thể tải dữ liệu bài học' };
    }

    const sections = await sectionsRes.json();
    const units = await unitsRes.json();
    const user = await userRes.json();

    const completedIds = user.completedUnitIds || [];

    const sortedUnits = [...units].sort((a, b) => Number(a.id) - Number(b.id));
    const firstTodoId = sortedUnits.find(u => !completedIds.includes(Number(u.id)))?.id;

    const data = sections.map((section) => ({
      ...section,
      units: units
        .filter((u) => String(u.sectionId) === String(section.id))
        .map((u) => {
          let type = 'locked';
          if (completedIds.includes(Number(u.id))) {
            type = 'done';
          } else if (String(u.id) === String(firstTodoId)) {
            type = 'todo';
          }
          return { ...u, type };
        }),
    }));

    return { data, error: null };
  } catch (e) {
    return { data: null, error: 'Không thể kết nối tới server' };
  }
}

export async function updateUnit(unitId, data) {
  try {
    const res = await fetch(`${API_URL}/units/${unitId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) return { data: null, error: `Lỗi server ${res.status}` };
    return { data: await res.json(), error: null };
  } catch (e) {
    return { data: null, error: 'Không thể cập nhật bài học' };
  }
}

// ==================== PROGRESS ====================

export async function completeUnit(unitId, userId, xpEarned) {
  // 1. Lấy thông tin user hiện tại
  const { data: user, error } = await getUserProfile(userId);
  if (error) return { data: null, error };

  // 2. Cập nhật list unit đã xong
  const completedIds = user.completedUnitIds || [];
  if (!completedIds.includes(Number(unitId))) {
    completedIds.push(Number(unitId));
  }

  // 3. Cập nhật stats
  const newData = {
    xp: (user.xp || 0) + xpEarned,
    gems: (user.gems || 0) + GameConfig.GEMS_PER_COMPLETED_UNIT,
    completedUnitIds: completedIds,
  };

  return updateUser(userId, newData);
}

// ==================== FLASHCARDS ====================

export async function getAllFlashcards() {
  try {
    const res = await fetch(`${API_URL}/flashcards`);
    if (!res.ok) return { data: null, error: `Lỗi server ${res.status}` };
    return { data: await res.json(), error: null };
  } catch (e) {
    return { data: null, error: 'Không thể tải flashcard' };
  }
}

export async function getFlashcardsByUnit(unitId) {
  try {
    const res = await fetch(`${API_URL}/flashcards?unitId=${unitId}`);
    if (!res.ok) return { data: null, error: `Lỗi server ${res.status}` };
    return { data: await res.json(), error: null };
  } catch (e) {
    return { data: null, error: 'Không thể tải flashcard' };
  }
}

// ==================== QUIZZES ====================

export async function getQuizzesByUnit(unitId) {
  try {
    const res = await fetch(`${API_URL}/quizzes?unitId=${unitId}`);
    if (!res.ok) return { data: null, error: `Lỗi server ${res.status}` };
    return { data: await res.json(), error: null };
  } catch (e) {
    return { data: null, error: 'Không thể tải câu hỏi' };
  }
}

// ==================== LEADERBOARD ====================

export async function getLeaderboard() {
  try {
    const [lbRes, usersRes] = await Promise.all([
      fetch(`${API_URL}/leaderboard`),
      fetch(`${API_URL}/users`),
    ]);
    if (!lbRes.ok || !usersRes.ok) return { data: null, error: 'Không thể tải bảng xếp hạng' };

    const leaderboard = await lbRes.json();
    const users = await usersRes.json();

    const realUserNames = new Set(users.map(u => u.name));

    const combined = [
      ...users.map(u => ({ id: u.id, userId: u.id, name: u.name, avatar: u.avatar, xp: u.xp || 0 })),
      ...leaderboard.filter(entry => !realUserNames.has(entry.name)),
    ];

    return { data: combined.sort((a, b) => b.xp - a.xp), error: null };
  } catch (e) {
    return { data: null, error: 'Không thể tải bảng xếp hạng' };
  }
}
