import { getAuthToken } from '@/services/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

const DEFAULT_PORT = '3000';
const AUTH_TOKEN_STORAGE_KEYS = ['auth_token', 'token', 'jwt_token', 'access_token'];

const trimTrailingSlash = (value = '') => value.replace(/\/+$/, '');

const getExpoPublicApiUrl = () => {
  const envValue = process.env.EXPO_PUBLIC_API_URL;

  if (typeof envValue !== 'string') {
    return null;
  }

  const trimmedValue = trimTrailingSlash(envValue.trim());
  return trimmedValue || null;
};

const getLocalBaseUrl = () => {
  const debuggerHost = Constants.expoGoConfig?.debuggerHost
    || Constants.manifest2?.extra?.expoGo?.debuggerHost
    || Constants.manifest?.debuggerHost;

  if (debuggerHost) {
    const ip = debuggerHost.split(':')[0];
    return `http://${ip}:${DEFAULT_PORT}`;
  }

  if (Platform.OS === 'android') {
    return `http://10.0.2.2:${DEFAULT_PORT}`;
  }

  return `http://localhost:${DEFAULT_PORT}`;
};

export const resolveApiBaseUrl = () => getExpoPublicApiUrl() || getLocalBaseUrl();

export const getApiBaseUrl = () => trimTrailingSlash(resolveApiBaseUrl());

export const createApiUrl = (path = '') => {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${getApiBaseUrl()}${normalizedPath}`;
};

const buildJsonHeaders = (headers = {}) => ({
  Accept: 'application/json',
  'Content-Type': 'application/json',
  ...headers,
});

export async function getStoredAuthToken() {
  const currentToken = await getAuthToken();
  if (currentToken) {
    return currentToken;
  }

  for (const storageKey of AUTH_TOKEN_STORAGE_KEYS) {
    const token = await AsyncStorage.getItem(storageKey);
    if (token) {
      return token;
    }
  }

  return null;
}

export async function getAuthHeaders(headers = {}) {
  const token = await getStoredAuthToken();

  if (!token) {
    return headers;
  }

  return {
    ...headers,
    Authorization: `Bearer ${token}`,
  };
}

async function apiRequest(path, options = {}) {
  const { requireAuth = false, headers, ...restOptions } = options;

  const resolvedHeaders = requireAuth
    ? await getAuthHeaders(headers)
    : headers;

  return fetch(createApiUrl(path), {
    ...restOptions,
    headers: resolvedHeaders,
  });
}

async function apiJsonRequest(path, options = {}) {
  const mergedHeaders = buildJsonHeaders(options.headers);

  return apiRequest(path, {
    ...options,
    headers: mergedHeaders,
  });
}

const SERVER_UNAVAILABLE_MESSAGE = 'Không thể kết nối tới server. Hãy chắc chắn API local đang chạy và EXPO_PUBLIC_API_URL đúng nếu dùng máy thật.';

async function readErrorPayload(res) {
  try {
    return await res.json();
  } catch (_e) {
    return null;
  }
}

const ERROR_MESSAGES_BY_CODE = {
  INVALID_CREDENTIALS: 'Email hoặc mật khẩu không đúng. Vui lòng kiểm tra lại.',
  EMAIL_ALREADY_EXISTS: 'Email này đã được đăng ký. Vui lòng đăng nhập hoặc dùng email khác.',
  VALIDATION_ERROR: 'Thông tin chưa hợp lệ. Vui lòng kiểm tra lại các trường đã nhập.',
  MISSING_TOKEN: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
  MALFORMED_TOKEN: 'Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại.',
  INVALID_TOKEN: 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn. Vui lòng đăng nhập lại.',
  UNIT_INCOMPLETE: 'Bạn cần hoàn thành tất cả câu hỏi trước khi kết thúc bài học.',
  UNIT_ATTEMPT_MISMATCH: 'Lượt học không hợp lệ. Vui lòng thoát ra và bắt đầu lại bài học.',
  INVALID_ANSWER_PAYLOAD: 'Câu trả lời chưa hợp lệ. Vui lòng thử lại.',
  NOT_FOUND: 'Không tìm thấy dữ liệu cần tải. Vui lòng thử lại sau.',
  INTERNAL_SERVER_ERROR: 'Server đang gặp lỗi. Vui lòng thử lại sau.',
};

const ERROR_MESSAGES_BY_STATUS = {
  400: 'Yêu cầu chưa hợp lệ. Vui lòng kiểm tra lại thông tin.',
  401: 'Bạn cần đăng nhập lại để tiếp tục.',
  403: 'Bạn không có quyền thực hiện thao tác này.',
  404: 'Không tìm thấy dữ liệu cần tải. Vui lòng thử lại sau.',
  409: 'Dữ liệu đã tồn tại hoặc bị trùng. Vui lòng kiểm tra lại.',
  500: 'Server đang gặp lỗi. Vui lòng thử lại sau.',
};

async function getErrorMessage(res, fallbackMessage) {
  const payload = await readErrorPayload(res);
  const code = payload?.error?.code;

  if (code && ERROR_MESSAGES_BY_CODE[code]) {
    return ERROR_MESSAGES_BY_CODE[code];
  }

  return ERROR_MESSAGES_BY_STATUS[res.status] || fallbackMessage || `Không thể xử lý yêu cầu (${res.status}). Vui lòng thử lại.`;
}

// ==================== USER ====================

export async function login(email, password) {
  try {
    const res = await apiJsonRequest('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) return { data: null, error: await getErrorMessage(res, 'Không thể đăng nhập. Vui lòng thử lại.') };
    const data = await res.json();
    if (!data?.token || !data?.user) return { data: null, error: 'Phản hồi đăng nhập không hợp lệ' };
    return { data, error: null };
  } catch (_e) {
    return { data: null, error: SERVER_UNAVAILABLE_MESSAGE };
  }
}

export async function register({ name, email, password, age }) {
  try {
    const res = await apiJsonRequest('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name,
        email,
        password,
        age: Number(age),
      }),
    });
    if (!res.ok) return { data: null, error: await getErrorMessage(res, 'Không thể đăng ký. Vui lòng thử lại.') };
    const data = await res.json();
    if (!data?.token || !data?.user) return { data: null, error: 'Phản hồi đăng ký không hợp lệ' };
    return { data, error: null };
  } catch (_e) {
    return { data: null, error: SERVER_UNAVAILABLE_MESSAGE };
  }
}

export async function getCurrentUser() {
  try {
    const res = await apiRequest('/api/auth/me', { requireAuth: true });
    if (!res.ok) return { data: null, error: await getErrorMessage(res, 'Không thể kiểm tra phiên đăng nhập.') };
    const data = await res.json();
    return { data: data?.user || null, error: data?.user ? null : 'Không tìm thấy người dùng' };
  } catch (_e) {
    return { data: null, error: 'Không thể kết nối tới server' };
  }
}

export async function getUserProfile() {
  try {
    return getCurrentUser();
  } catch (_e) {
    return { data: null, error: 'Không thể kết nối tới server' };
  }
}

export async function updateUser(userIdOrData, maybeData) {
  try {
    const data = maybeData && typeof maybeData === 'object'
      ? maybeData
      : userIdOrData;

    const res = await apiJsonRequest('/api/users/me', {
      method: 'PATCH',
      requireAuth: true,
      body: JSON.stringify(data),
    });
    if (!res.ok) return { data: null, error: await getErrorMessage(res, 'Không thể cập nhật dữ liệu') };

    const payload = await res.json();
    return { data: payload?.user || null, error: payload?.user ? null : 'Không thể cập nhật dữ liệu' };
  } catch (_e) {
    return { data: null, error: 'Không thể cập nhật dữ liệu' };
  }
}

export async function changeCurrentUserPassword(currentPassword, newPassword) {
  try {
    const res = await apiJsonRequest('/api/users/me/password', {
      method: 'PATCH',
      requireAuth: true,
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    if (!res.ok) return { data: null, error: await getErrorMessage(res, 'Không thể đổi mật khẩu') };

    const payload = await res.json();
    return { data: payload?.user || null, error: payload?.user ? null : 'Không thể đổi mật khẩu' };
  } catch (_e) {
    return { data: null, error: 'Không thể đổi mật khẩu' };
  }
}

export async function getAdminHeartbeatSetting() {
  try {
    const res = await apiRequest('/api/admin/settings/heartbeat', { requireAuth: true });
    if (!res.ok) return { data: null, error: await getErrorMessage(res, 'Không thể tải interval hồi tim') };
    return { data: await res.json(), error: null };
  } catch (_e) {
    return { data: null, error: 'Không thể tải interval hồi tim' };
  }
}

export async function updateAdminHeartbeatSetting(seconds) {
  try {
    const res = await apiJsonRequest('/api/admin/settings/heartbeat', {
      method: 'PATCH',
      requireAuth: true,
      body: JSON.stringify({ heartRefillIntervalSeconds: Number(seconds) }),
    });
    if (!res.ok) return { data: null, error: await getErrorMessage(res, 'Không thể cập nhật interval hồi tim') };
    return { data: await res.json(), error: null };
  } catch (_e) {
    return { data: null, error: 'Không thể cập nhật interval hồi tim' };
  }
}

export async function getAdminContent() {
  try {
    const res = await apiRequest('/api/admin/content', { requireAuth: true });
    if (!res.ok) return { data: null, error: await getErrorMessage(res, 'Không thể tải nội dung admin') };
    const payload = await res.json();
    return { data: payload?.sections || [], error: null };
  } catch (_e) {
    return { data: null, error: 'Không thể tải nội dung admin' };
  }
}

export async function updateAdminSection(sectionId, data) {
  try {
    const res = await apiJsonRequest(`/api/admin/sections/${sectionId}`, {
      method: 'PATCH',
      requireAuth: true,
      body: JSON.stringify(data),
    });
    if (!res.ok) return { data: null, error: await getErrorMessage(res, 'Không thể cập nhật section') };
    const payload = await res.json();
    return { data: payload?.section || null, error: payload?.section ? null : 'Không thể cập nhật section' };
  } catch (_e) {
    return { data: null, error: 'Không thể cập nhật section' };
  }
}

export async function updateAdminUnit(unitId, data) {
  try {
    const res = await apiJsonRequest(`/api/admin/units/${unitId}`, {
      method: 'PATCH',
      requireAuth: true,
      body: JSON.stringify(data),
    });
    if (!res.ok) return { data: null, error: await getErrorMessage(res, 'Không thể cập nhật unit') };
    const payload = await res.json();
    return { data: payload?.unit || null, error: payload?.unit ? null : 'Không thể cập nhật unit' };
  } catch (_e) {
    return { data: null, error: 'Không thể cập nhật unit' };
  }
}

export async function updateAdminExercise(exerciseId, data) {
  try {
    const res = await apiJsonRequest(`/api/admin/exercises/${exerciseId}`, {
      method: 'PATCH',
      requireAuth: true,
      body: JSON.stringify(data),
    });
    if (!res.ok) return { data: null, error: await getErrorMessage(res, 'Không thể cập nhật câu hỏi') };
    const payload = await res.json();
    return { data: payload?.exercise || null, error: payload?.exercise ? null : 'Không thể cập nhật câu hỏi' };
  } catch (_e) {
    return { data: null, error: 'Không thể cập nhật câu hỏi' };
  }
}

export async function createAdminSection(data) {
  try {
    const res = await apiJsonRequest('/api/admin/sections', {
      method: 'POST',
      requireAuth: true,
      body: JSON.stringify(data),
    });
    if (!res.ok) return { data: null, error: await getErrorMessage(res, 'Không thể tạo section') };
    const payload = await res.json();
    return { data: payload?.section || null, error: payload?.section ? null : 'Không thể tạo section' };
  } catch (_e) {
    return { data: null, error: 'Không thể tạo section' };
  }
}

export async function createAdminUnit(data) {
  try {
    const res = await apiJsonRequest('/api/admin/units', {
      method: 'POST',
      requireAuth: true,
      body: JSON.stringify(data),
    });
    if (!res.ok) return { data: null, error: await getErrorMessage(res, 'Không thể tạo unit') };
    const payload = await res.json();
    return { data: payload?.unit || null, error: payload?.unit ? null : 'Không thể tạo unit' };
  } catch (_e) {
    return { data: null, error: 'Không thể tạo unit' };
  }
}

export async function createAdminExercise(data) {
  try {
    const res = await apiJsonRequest('/api/admin/exercises', {
      method: 'POST',
      requireAuth: true,
      body: JSON.stringify(data),
    });
    if (!res.ok) return { data: null, error: await getErrorMessage(res, 'Không thể tạo câu hỏi') };
    const payload = await res.json();
    return { data: payload?.exercise || null, error: payload?.exercise ? null : 'Không thể tạo câu hỏi' };
  } catch (_e) {
    return { data: null, error: 'Không thể tạo câu hỏi' };
  }
}

export async function deleteAdminSection(sectionId) {
  try {
    const res = await apiJsonRequest(`/api/admin/sections/${sectionId}`, {
      method: 'DELETE',
      requireAuth: true,
    });
    if (!res.ok) return { data: null, error: await getErrorMessage(res, 'Không thể xóa section') };
    return { data: await res.json(), error: null };
  } catch (_e) {
    return { data: null, error: 'Không thể xóa section' };
  }
}

export async function deleteAdminUnit(unitId) {
  try {
    const res = await apiJsonRequest(`/api/admin/units/${unitId}`, {
      method: 'DELETE',
      requireAuth: true,
    });
    if (!res.ok) return { data: null, error: await getErrorMessage(res, 'Không thể xóa unit') };
    return { data: await res.json(), error: null };
  } catch (_e) {
    return { data: null, error: 'Không thể xóa unit' };
  }
}

export async function createAdminFlashcard(data) {
  try {
    const res = await apiJsonRequest('/api/admin/flashcards', {
      method: 'POST',
      requireAuth: true,
      body: JSON.stringify(data),
    });
    if (!res.ok) return { data: null, error: await getErrorMessage(res, 'Không thể tạo flashcard') };
    const payload = await res.json();
    return { data: payload?.flashcard || null, error: payload?.flashcard ? null : 'Không thể tạo flashcard' };
  } catch (_e) {
    return { data: null, error: 'Không thể tạo flashcard' };
  }
}

export async function updateAdminFlashcard(flashcardId, data) {
  try {
    const res = await apiJsonRequest(`/api/admin/flashcards/${flashcardId}`, {
      method: 'PATCH',
      requireAuth: true,
      body: JSON.stringify(data),
    });
    if (!res.ok) return { data: null, error: await getErrorMessage(res, 'Không thể cập nhật flashcard') };
    const payload = await res.json();
    return { data: payload?.flashcard || null, error: payload?.flashcard ? null : 'Không thể cập nhật flashcard' };
  } catch (_e) {
    return { data: null, error: 'Không thể cập nhật flashcard' };
  }
}

export async function deleteAdminFlashcard(flashcardId) {
  try {
    const res = await apiJsonRequest(`/api/admin/flashcards/${flashcardId}`, {
      method: 'DELETE',
      requireAuth: true,
    });
    if (!res.ok) return { data: null, error: await getErrorMessage(res, 'Không thể xóa flashcard') };
    return { data: await res.json(), error: null };
  } catch (_e) {
    return { data: null, error: 'Không thể xóa flashcard' };
  }
}

export async function deleteAdminExercise(exerciseId) {
  try {
    const res = await apiJsonRequest(`/api/admin/exercises/${exerciseId}`, {
      method: 'DELETE',
      requireAuth: true,
    });
    if (!res.ok) return { data: null, error: await getErrorMessage(res, 'Không thể xóa câu hỏi') };
    return { data: await res.json(), error: null };
  } catch (_e) {
    return { data: null, error: 'Không thể xóa câu hỏi' };
  }
}

export async function getAdminUsers() {
  try {
    const res = await apiRequest('/api/admin/users', { requireAuth: true });
    if (!res.ok) return { data: null, error: await getErrorMessage(res, 'Không thể tải danh sách người dùng') };
    const payload = await res.json();
    return { data: payload?.users || [], error: null };
  } catch (_e) {
    return { data: null, error: 'Không thể tải danh sách người dùng' };
  }
}

export async function resetAdminUserPassword(userId, newPassword) {
  try {
    const res = await apiJsonRequest(`/api/admin/users/${userId}/password`, {
      method: 'PATCH',
      requireAuth: true,
      body: JSON.stringify({ newPassword }),
    });
    if (!res.ok) return { data: null, error: await getErrorMessage(res, 'Không thể đổi mật khẩu người dùng') };
    const payload = await res.json();
    return { data: payload?.user || null, error: payload?.user ? null : 'Không thể đổi mật khẩu người dùng' };
  } catch (_e) {
    return { data: null, error: 'Không thể đổi mật khẩu người dùng' };
  }
}

export async function resetAdminUserProgress(userId) {
  try {
    const res = await apiJsonRequest(`/api/admin/users/${userId}/progress/reset`, {
      method: 'POST',
      requireAuth: true,
      body: JSON.stringify({}),
    });
    if (!res.ok) return { data: null, error: await getErrorMessage(res, 'Không thể reset tiến trình') };
    const payload = await res.json();
    return { data: payload?.user || null, error: payload?.user ? null : 'Không thể reset tiến trình' };
  } catch (_e) {
    return { data: null, error: 'Không thể reset tiến trình' };
  }
}

// ==================== SECTIONS & UNITS ====================

export async function getSectionsWithUnits() {
  try {
    const res = await apiRequest('/api/sections', { requireAuth: true });
    if (!res.ok) return { data: null, error: 'Không thể tải dữ liệu bài học' };

    const payload = await res.json();
    return { data: payload?.sections || [], error: null };
  } catch (_e) {
    return { data: null, error: 'Không thể kết nối tới server' };
  }
}

export async function updateUnit(unitId, data) {
  try {
    const res = await apiJsonRequest(`/api/units/${unitId}`, {
      method: 'PATCH',
      requireAuth: true,
      body: JSON.stringify(data),
    });
    if (!res.ok) return { data: null, error: await getErrorMessage(res, 'Không thể cập nhật bài học') };
    return { data: await res.json(), error: null };
  } catch (_e) {
    return { data: null, error: 'Không thể cập nhật bài học' };
  }
}

// ==================== PROGRESS ====================

export async function startUnitAttempt(unitId) {
  try {
    const res = await apiJsonRequest(`/api/units/${unitId}/attempts/start`, {
      method: 'POST',
      requireAuth: true,
      body: JSON.stringify({}),
    });

    if (!res.ok) return { data: null, error: await getErrorMessage(res, 'Không thể bắt đầu lượt học') };
    return { data: await res.json(), error: null };
  } catch (_e) {
    return { data: null, error: 'Không thể bắt đầu lượt học' };
  }
}

export async function submitExerciseAttempt(exerciseId, payload) {
  try {
    const res = await apiJsonRequest(`/api/exercises/${exerciseId}/attempts`, {
      method: 'POST',
      requireAuth: true,
      body: JSON.stringify(payload),
    });

    if (!res.ok) return { data: null, error: await getErrorMessage(res, 'Không thể gửi câu trả lời') };
    return { data: await res.json(), error: null };
  } catch (_e) {
    return { data: null, error: 'Không thể gửi câu trả lời' };
  }
}

export async function completeUnit(unitId, unitAttemptId) {
  try {
    const res = await apiJsonRequest(`/api/units/${unitId}/complete`, {
      method: 'POST',
      requireAuth: true,
      body: JSON.stringify({ unitAttemptId }),
    });

    if (!res.ok) return { data: null, error: await getErrorMessage(res, 'Không thể hoàn thành bài học') };
    return { data: await res.json(), error: null };
  } catch (_e) {
    return { data: null, error: 'Không thể hoàn thành bài học' };
  }
}

// ==================== FLASHCARDS ====================

export async function getAllFlashcards() {
  try {
    const res = await apiRequest('/api/flashcards');
    if (!res.ok) return { data: null, error: await getErrorMessage(res, 'Không thể tải flashcard') };

    const payload = await res.json();
    return { data: payload?.flashcards || [], error: null };
  } catch (_e) {
    return { data: null, error: 'Không thể tải flashcard' };
  }
}

export async function getFlashcardsByUnit(unitId) {
  try {
    const res = await apiRequest(`/api/flashcards?unitId=${unitId}`);
    if (!res.ok) return { data: null, error: await getErrorMessage(res, 'Không thể tải flashcard') };

    const payload = await res.json();
    return { data: payload?.flashcards || [], error: null };
  } catch (_e) {
    return { data: null, error: 'Không thể tải flashcard' };
  }
}

// ==================== QUIZZES ====================

const normalizeExercise = (exercise) => ({
  id: exercise.id,
  unitId: exercise.unitId,
  type: exercise.type,
  prompt: exercise.prompt,
  instruction: exercise.instruction || '',
  order: exercise.order,
  options: Array.isArray(exercise.options) ? exercise.options : [],
  pairs: Array.isArray(exercise.pairs) ? exercise.pairs : [],
});

export async function getUnitExercises(unitId) {
  try {
    const res = await apiRequest(`/api/units/${unitId}/exercises`, { requireAuth: true });
    if (!res.ok) return { data: null, error: await getErrorMessage(res, 'Không thể tải câu hỏi') };

    const payload = await res.json();
    const exercises = Array.isArray(payload?.exercises) ? payload.exercises : Array.isArray(payload) ? payload : [];
    return { data: exercises.map(normalizeExercise), error: null };
  } catch (_e) {
    return { data: null, error: 'Không thể tải câu hỏi' };
  }
}

// ==================== LEADERBOARD ====================

export async function getLeaderboard({ limit = 50 } = {}) {
  try {
    const res = await apiRequest(`/api/leaderboard?limit=${limit}`);
    if (!res.ok) return { data: null, error: 'Không thể tải bảng xếp hạng' };

    const payload = await res.json();
    return { data: payload?.leaderboard || [], error: null };
  } catch (_e) {
    return { data: null, error: 'Không thể tải bảng xếp hạng' };
  }
}

// ==================== HISTORY ====================

export async function getLearningHistory({ limit = 20, offset = 0 } = {}) {
  try {
    const res = await apiRequest(`/api/users/me/history/learning?limit=${limit}&offset=${offset}`, { requireAuth: true });
    if (!res.ok) return { data: null, error: await getErrorMessage(res, 'Không thể tải lịch sử học') };
    return { data: await res.json(), error: null };
  } catch (_e) {
    return { data: null, error: 'Không thể tải lịch sử học' };
  }
}

export async function getCreatedHistory({ limit = 20, offset = 0 } = {}) {
  try {
    const res = await apiRequest(`/api/users/me/history/created?limit=${limit}&offset=${offset}`, { requireAuth: true });
    if (!res.ok) return { data: null, error: await getErrorMessage(res, 'Không thể tải lịch sử tạo đề') };
    return { data: await res.json(), error: null };
  } catch (_e) {
    return { data: null, error: 'Không thể tải lịch sử tạo đề' };
  }
}

// ==================== NOTIFICATIONS ====================

export async function getNotifications({ type } = {}) {
  try {
    const query = type ? `?type=${type}` : '';
    const res = await apiRequest(`/api/notifications${query}`, { requireAuth: true });
    if (!res.ok) return { data: null, error: await getErrorMessage(res, 'Không thể tải thông báo') };
    return { data: await res.json(), error: null };
  } catch (_e) {
    return { data: null, error: 'Không thể tải thông báo' };
  }
}

export async function markNotificationRead(notificationId) {
  try {
    const res = await apiJsonRequest(`/api/notifications/${notificationId}/read`, {
      method: 'PATCH',
      requireAuth: true,
      body: JSON.stringify({}),
    });
    if (!res.ok) return { data: null, error: await getErrorMessage(res, 'Không thể đánh dấu đã đọc') };
    return { data: await res.json(), error: null };
  } catch (_e) {
    return { data: null, error: 'Không thể đánh dấu đã đọc' };
  }
}

export async function markAllNotificationsRead() {
  try {
    const res = await apiJsonRequest('/api/notifications/read-all', {
      method: 'POST',
      requireAuth: true,
      body: JSON.stringify({}),
    });
    if (!res.ok) return { data: null, error: await getErrorMessage(res, 'Không thể đánh dấu tất cả đã đọc') };
    return { data: await res.json(), error: null };
  } catch (_e) {
    return { data: null, error: 'Không thể đánh dấu tất cả đã đọc' };
  }
}

// ==================== EXAMS ====================

export async function getPublicExams({ category, difficulty, search, limit = 20, offset = 0 } = {}) {
  try {
    const params = new URLSearchParams({ limit, offset });
    if (category) params.append('category', category);
    if (difficulty) params.append('difficulty', difficulty);
    if (search) params.append('search', search);
    const res = await apiRequest(`/api/exams?${params.toString()}`);
    if (!res.ok) return { data: null, error: await getErrorMessage(res, 'Không thể tải danh sách đề thi') };
    return { data: await res.json(), error: null };
  } catch (_e) {
    return { data: null, error: 'Không thể tải danh sách đề thi' };
  }
}

export async function createExam(payload) {
  try {
    const res = await apiJsonRequest('/api/exams', {
      method: 'POST',
      requireAuth: true,
      body: JSON.stringify(payload),
    });
    if (!res.ok) return { data: null, error: await getErrorMessage(res, 'Không thể tạo đề thi') };
    const data = await res.json();
    return { data: data?.exam || null, error: data?.exam ? null : 'Không thể tạo đề thi' };
  } catch (_e) {
    return { data: null, error: 'Không thể tạo đề thi' };
  }
}

export async function getMyExams({ limit = 20, offset = 0 } = {}) {
  try {
    const res = await apiRequest(`/api/exams/my?limit=${limit}&offset=${offset}`, { requireAuth: true });
    if (!res.ok) return { data: null, error: await getErrorMessage(res, 'Không thể tải đề của tôi') };
    return { data: await res.json(), error: null };
  } catch (_e) {
    return { data: null, error: 'Không thể tải đề của tôi' };
  }
}

export async function getSavedExams({ limit = 20, offset = 0 } = {}) {
  try {
    const res = await apiRequest(`/api/exams/saved?limit=${limit}&offset=${offset}`, { requireAuth: true });
    if (!res.ok) return { data: null, error: await getErrorMessage(res, 'Không thể tải đề đã lưu') };
    return { data: await res.json(), error: null };
  } catch (_e) {
    return { data: null, error: 'Không thể tải đề đã lưu' };
  }
}

export async function toggleExamBookmark(examId) {
  try {
    const res = await apiJsonRequest(`/api/exams/${examId}/bookmark`, {
      method: 'POST',
      requireAuth: true,
      body: JSON.stringify({}),
    });
    if (!res.ok) return { data: null, error: await getErrorMessage(res, 'Không thể lưu đề thi') };
    return { data: await res.json(), error: null };
  } catch (_e) {
    return { data: null, error: 'Không thể lưu đề thi' };
  }
}

export async function removeExamBookmark(examId) {
  try {
    const res = await apiJsonRequest(`/api/exams/${examId}/bookmark`, {
      method: 'DELETE',
      requireAuth: true,
    });
    if (!res.ok) return { data: null, error: await getErrorMessage(res, 'Không thể bỏ lưu đề thi') };
    return { data: await res.json(), error: null };
  } catch (_e) {
    return { data: null, error: 'Không thể bỏ lưu đề thi' };
  }
}

// ==================== SUBSCRIPTION ====================

export async function getMySubscription() {
  try {
    const res = await apiRequest('/api/users/me/subscription', { requireAuth: true });
    if (!res.ok) return { data: null, error: await getErrorMessage(res, 'Không thể tải thông tin đăng ký') };
    return { data: await res.json(), error: null };
  } catch (_e) {
    return { data: null, error: 'Không thể tải thông tin đăng ký' };
  }
}

export async function createSubscription({ plan, paymentMethod }) {
  try {
    const res = await apiJsonRequest('/api/subscriptions', {
      method: 'POST',
      requireAuth: true,
      body: JSON.stringify({ plan, paymentMethod }),
    });
    if (!res.ok) return { data: null, error: await getErrorMessage(res, 'Không thể kích hoạt gói') };
    return { data: await res.json(), error: null };
  } catch (_e) {
    return { data: null, error: 'Không thể kích hoạt gói' };
  }
}

// ==================== EXAM QUESTIONS ====================

export async function getExamQuestions(examId) {
  try {
    const res = await apiRequest(`/api/exams/${examId}/questions`);
    if (!res.ok) return { data: null, error: await getErrorMessage(res, 'Không thể tải câu hỏi') };
    return { data: await res.json(), error: null };
  } catch (_e) {
    return { data: null, error: 'Không thể tải câu hỏi' };
  }
}

export async function addExamQuestion(examId, payload) {
  try {
    const res = await apiJsonRequest(`/api/exams/${examId}/questions`, {
      method: 'POST',
      requireAuth: true,
      body: JSON.stringify(payload),
    });
    if (!res.ok) return { data: null, error: await getErrorMessage(res, 'Không thể thêm câu hỏi') };
    return { data: await res.json(), error: null };
  } catch (_e) {
    return { data: null, error: 'Không thể thêm câu hỏi' };
  }
}

export async function deleteExamQuestion(examId, questionId) {
  try {
    const res = await apiJsonRequest(`/api/exams/${examId}/questions/${questionId}`, {
      method: 'DELETE',
      requireAuth: true,
    });
    if (!res.ok) return { data: null, error: await getErrorMessage(res, 'Không thể xóa câu hỏi') };
    return { data: await res.json(), error: null };
  } catch (_e) {
    return { data: null, error: 'Không thể xóa câu hỏi' };
  }
}

// ==================== ADMIN STATS ====================

export async function getAdminStats() {
  try {
    const res = await apiRequest('/api/admin/stats', { requireAuth: true });
    if (!res.ok) return { data: null, error: await getErrorMessage(res, 'Không thể tải thống kê') };
    return { data: await res.json(), error: null };
  } catch (_e) {
    return { data: null, error: 'Không thể tải thống kê' };
  }
}

// ==================== ADMIN ACTIVITY LOG ====================

export async function getAdminActivityLog({ limit = 30 } = {}) {
  try {
    const res = await apiRequest(`/api/admin/activity-log?limit=${limit}`, { requireAuth: true });
    if (!res.ok) return { data: null, error: await getErrorMessage(res, 'Không thể tải nhật ký hoạt động') };
    const payload = await res.json();
    return { data: payload?.logs || [], error: null };
  } catch (_e) {
    return { data: null, error: 'Không thể tải nhật ký hoạt động' };
  }
}
