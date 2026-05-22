import AdminContent from '@/components/admin/AdminContent';
import AdminSettings from '@/components/admin/AdminSettings';
import AdminUsers from '@/components/admin/AdminUsers';
import { useAuth } from '@/context/AuthContext';
import {
  createAdminExercise,
  createAdminSection,
  createAdminUnit,
  deleteAdminExercise,
  deleteAdminSection,
  deleteAdminUnit,
  getAdminContent,
  getAdminHeartbeatSetting,
  getAdminUsers,
  resetAdminUserPassword,
  resetAdminUserProgress,
  updateAdminExercise,
  updateAdminHeartbeatSetting,
  updateAdminSection,
  updateAdminUnit,
} from '@/services/api';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, BackHandler, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const tabs = [
  { key: 'settings', label: 'Cài đặt', icon: 'settings-outline' },
  { key: 'content', label: 'Nội dung', icon: 'albums-outline' },
  { key: 'users', label: 'User', icon: 'people-outline' },
];

const showValue = (value) => (value === null || value === undefined ? '' : String(value));
const DEFAULT_MATCHING_PROMPT = 'Nối các cặp phù hợp';

function AdminGuard({ children }) {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();

  if (isLoading) {
    return (
      <SafeAreaView style={styles.centerScreen}>
        <ActivityIndicator color="#6750A4" />
      </SafeAreaView>
    );
  }

  if (!user?.isAdmin && user?.role !== 'ADMIN') {
    return (
      <SafeAreaView style={styles.centerScreen}>
        <Ionicons name="lock-closed-outline" size={40} color="#6750A4" />
        <Text style={styles.blockedTitle}>Chỉ admin mới được truy cập</Text>
        <Text style={styles.blockedText}>Đăng nhập bằng tài khoản admin@test.com để mở trang quản trị.</Text>
        <Pressable style={styles.primaryButton} onPress={() => router.replace('/login')}>
          <Text style={styles.primaryButtonText}>Đăng nhập admin</Text>
        </Pressable>
        {user ? (
          <Pressable
            style={styles.secondaryButton}
            onPress={async () => {
              await logout();
              router.replace('/');
            }}
          >
            <Text style={styles.secondaryButtonText}>Đăng xuất tài khoản hiện tại</Text>
          </Pressable>
        ) : null}
      </SafeAreaView>
    );
  }

  return children;
}

export default function AdminScreen() {
  const router = useRouter();
  const { logout, refreshUser } = useAuth();
  const [activeTab, setActiveTab] = useState('settings');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [heartbeatSeconds, setHeartbeatSeconds] = useState('120');
  const [sections, setSections] = useState([]);
  const [users, setUsers] = useState([]);
  const [passwordByUserId, setPasswordByUserId] = useState({});
  const [savingKey, setSavingKey] = useState('');
  const adminContentRef = useRef(null);

  const setStatus = (type, text) => setMessage({ type, text });

  useEffect(() => {
    const onBackPress = () => {
      if (activeTab === 'content') {
        const handled = adminContentRef.current?.goBackOneLevel?.();
        if (handled) return true;
      }
      return true;
    };
    const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => subscription.remove();
  }, [activeTab]);

  const loadAdminData = useCallback(async ({ showLoading = true, updateStatus = true } = {}) => {
    if (showLoading) setLoading(true);
    const [heartbeatResult, contentResult, usersResult] = await Promise.all([
      getAdminHeartbeatSetting(),
      getAdminContent(),
      getAdminUsers(),
    ]);
    if (showLoading) setLoading(false);

    const firstError = heartbeatResult.error || contentResult.error || usersResult.error;
    if (firstError) {
      setStatus('error', firstError);
      return;
    }

    setHeartbeatSeconds(showValue(heartbeatResult.data?.heartRefillIntervalSeconds ?? 120));
    setSections(contentResult.data || []);
    setUsers(usersResult.data || []);
    if (updateStatus) setStatus('success', 'Đã tải dữ liệu admin.');
  }, []);

  useEffect(() => {
    loadAdminData();
  }, [loadAdminData]);

  const runSave = async (key, action, successText) => {
    setSavingKey(key);
    setStatus('', '');
    const { data, error } = await action();
    setSavingKey('');
    if (error) {
      setStatus('error', error);
      return null;
    }
    setStatus('success', successText);
    return data;
  };

  const saveHeartbeat = async () => {
    const seconds = Number(heartbeatSeconds);
    if (!Number.isInteger(seconds) || seconds < 1) {
      setStatus('error', 'Interval phải là số giây nguyên lớn hơn 0.');
      return;
    }
    const data = await runSave('heartbeat', () => updateAdminHeartbeatSetting(seconds), 'Đã cập nhật interval hồi tim.');
    if (data?.heartRefillIntervalSeconds) {
      setHeartbeatSeconds(String(data.heartRefillIntervalSeconds));
      await refreshUser();
    }
  };

  const handleSaveSection = async (id, form) => {
    const data = await runSave('section', () => updateAdminSection(id, {
      title: form.title,
      subtitle: form.subtitle,
      sortOrder: Number(form.sortOrder),
      isPublished: form.isPublished,
    }), 'Đã lưu section.');
    if (data) await loadAdminData({ showLoading: false, updateStatus: false });
  };

  const handleCreateSection = async (payload) => {
    const data = await runSave('create-section', () => createAdminSection(payload), 'Đã tạo section.');
    if (data) await loadAdminData({ showLoading: false, updateStatus: false });
    return data;
  };
  const handleDeleteSection = async (id) => {
    const data = await runSave('delete-section', () => deleteAdminSection(id), 'Đã xóa section.');
    if (data !== null) await loadAdminData({ showLoading: false, updateStatus: false });
    return data;
  };

  const handleSaveUnit = async (id, form) => {
    const kind = ['LESSON', 'REVIEW', 'CHECKPOINT'].includes(form.kind) ? form.kind : 'LESSON';
    const data = await runSave('unit', () => updateAdminUnit(id, {
      title: form.title || null,
      description: form.description || null,
      kind,
      sortOrder: Number(form.sortOrder),
      xpReward: Number(form.xpReward),
      isPublished: form.isPublished,
    }), 'Đã lưu unit.');
    if (data) await loadAdminData({ showLoading: false, updateStatus: false });
  };

  const handleCreateUnit = async (payload) => {
    const data = await runSave('create-unit', () => createAdminUnit(payload), 'Đã tạo unit.');
    if (data) await loadAdminData({ showLoading: false, updateStatus: false });
    return data;
  };
  const handleDeleteUnit = async (id) => {
    const data = await runSave('delete-unit', () => deleteAdminUnit(id), 'Đã xóa unit.');
    if (data !== null) await loadAdminData({ showLoading: false, updateStatus: false });
    return data;
  };

  const handleSaveExercise = async (id, form, optionForms, matchingPairForms, acceptedAnswerForms = []) => {
    const type = ['MULTIPLE_CHOICE', 'FILL_BLANK', 'MATCHING'].includes(form.type) ? form.type : 'MULTIPLE_CHOICE';
    const prompt = type === 'MATCHING' ? DEFAULT_MATCHING_PROMPT : form.prompt.trim();
    if (!prompt) {
      setStatus('error', 'Nội dung câu hỏi là bắt buộc.');
      return;
    }
    const extraPayload = {};
    if (type === 'MULTIPLE_CHOICE') {
      const options = optionForms.filter((option) => option.text.trim());
      if (options.length < 2) { setStatus('error', 'Cần ít nhất 2 options.'); return; }
      if (!options.some((option) => option.isCorrect)) { setStatus('error', 'Cần chọn 1 option đúng.'); return; }
      if (options.length > 0) extraPayload.options = options;
    }
    if (type === 'FILL_BLANK') {
      const answerText = acceptedAnswerForms.map((answer) => answer.text.trim()).filter(Boolean).join('|');
      if (!answerText) { setStatus('error', 'Cần ít nhất 1 đáp án đúng.'); return; }
      extraPayload.answerText = answerText;
    }
    if (type === 'MATCHING') {
      const incompletePairIndex = matchingPairForms.findIndex((pair) => pair.leftText.trim() || pair.rightText.trim() ? !(pair.leftText.trim() && pair.rightText.trim()) : false);
      if (incompletePairIndex >= 0) { setStatus('error', `Cặp matching ${incompletePairIndex + 1} cần đủ vế trái và vế phải.`); return; }
      const matchingPairs = matchingPairForms.filter((pair) => pair.leftText.trim() && pair.rightText.trim());
      if (matchingPairs.length < 1) { setStatus('error', 'Cần ít nhất 1 cặp matching.'); return; }
      extraPayload.matchingPairs = matchingPairs;
    }
    const data = await runSave('exercise', () => updateAdminExercise(id, {
      type,
      prompt,
      answerText: type === 'FILL_BLANK' ? extraPayload.answerText : null,
      explanation: form.explanation || null,
      sortOrder: Number(form.sortOrder),
      xpReward: Number(form.xpReward),
      ...extraPayload,
    }), 'Đã lưu câu hỏi.');
    if (data) await loadAdminData({ showLoading: false, updateStatus: false });
  };

  const handleCreateExercise = async (payload) => {
    const type = ['MULTIPLE_CHOICE', 'FILL_BLANK', 'MATCHING'].includes(payload.type) ? payload.type : 'MULTIPLE_CHOICE';
    const data = await runSave('create-exercise', () => createAdminExercise({
      ...payload,
      prompt: type === 'MATCHING' ? DEFAULT_MATCHING_PROMPT : payload.prompt,
      answerText: type === 'MATCHING' ? null : payload.answerText,
    }), 'Đã tạo câu hỏi.');
    if (data) await loadAdminData({ showLoading: false, updateStatus: false });
    return data;
  };
  const handleDeleteExercise = async (id) => {
    const data = await runSave('delete-exercise', () => deleteAdminExercise(id), 'Đã xóa câu hỏi.');
    if (data !== null) await loadAdminData({ showLoading: false, updateStatus: false });
    return data;
  };

  const handleSavePassword = async (userId) => {
    const password = passwordByUserId[userId] || '';
    if (password.length < 6) {
      setStatus('error', 'Mật khẩu mới phải có ít nhất 6 ký tự.');
      return;
    }
    const data = await runSave(`password-${userId}`, () => resetAdminUserPassword(userId, password), 'Đã đổi mật khẩu người dùng.');
    if (data) setPasswordByUserId((current) => ({ ...current, [userId]: '' }));
  };

  const handleResetProgress = async (targetUser) => {
    const data = await runSave(`reset-${targetUser.id}`, () => resetAdminUserProgress(targetUser.id), 'Đã reset tiến trình người dùng.');
    if (data) await loadAdminData({ showLoading: false, updateStatus: false });
  };

  const handleLogout = () => {
    Alert.alert('Đăng xuất admin', 'Thoát khỏi giao diện quản trị?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Đăng xuất',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/');
        },
      },
    ]);
  };

  return (
    <AdminGuard>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Pressable style={styles.backButton} onPress={() => { if (activeTab === 'content') { adminContentRef.current?.goBackOneLevel?.(); } }} accessibilityLabel="Quay lại">
              <Ionicons name="chevron-back" size={24} color="#1D1B20" />
            </Pressable>
            <View>
              <Text style={styles.eyebrow}>ADMIN</Text>
              <Text style={styles.title}>Bảng quản trị</Text>
            </View>
          </View>
          <Pressable style={styles.logoutButton} onPress={handleLogout} accessibilityLabel="Đăng xuất admin">
            <Ionicons name="log-out-outline" size={22} color="#B3261E" />
          </Pressable>
        </View>

        <View style={styles.tabBar}>
          {tabs.map((tab) => (
            <Pressable key={tab.key} style={[styles.tabItem, activeTab === tab.key && styles.activeTab]} onPress={() => setActiveTab(tab.key)}>
              <Ionicons name={tab.icon} size={18} color={activeTab === tab.key ? '#fff' : '#625B71'} />
              <Text style={[styles.tabText, activeTab === tab.key && styles.activeTabText]}>{tab.label}</Text>
            </Pressable>
          ))}
        </View>

        {message.text ? (
          <Text style={[styles.message, message.type === 'error' ? styles.errorMessage : styles.successMessage]}>{message.text}</Text>
        ) : null}

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator color="#6750A4" />
            <Text style={styles.helpText}>Đang tải dữ liệu admin...</Text>
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
            {activeTab === 'settings' && (
              <AdminSettings
                heartbeatSeconds={heartbeatSeconds}
                onChangeHeartbeat={setHeartbeatSeconds}
                onSave={saveHeartbeat}
                saving={savingKey === 'heartbeat'}
              />
            )}
            {activeTab === 'content' && (
              <AdminContent
                ref={adminContentRef}
                sections={sections}
                savingKey={savingKey}
                onSetStatus={setStatus}
                onSaveSection={handleSaveSection}
                onCreateSection={handleCreateSection}
                onDeleteSection={handleDeleteSection}
                onSaveUnit={handleSaveUnit}
                onCreateUnit={handleCreateUnit}
                onDeleteUnit={handleDeleteUnit}
                onSaveExercise={handleSaveExercise}
                onCreateExercise={handleCreateExercise}
                onDeleteExercise={handleDeleteExercise}
              />
            )}
            {activeTab === 'users' && (
              <AdminUsers
                users={users}
                passwordByUserId={passwordByUserId}
                onPasswordChange={(id, pw) => setPasswordByUserId((c) => ({ ...c, [id]: pw }))}
                onSavePassword={handleSavePassword}
                onResetProgress={handleResetProgress}
                savingKey={savingKey}
              />
            )}
          </ScrollView>
        )}
      </SafeAreaView>
    </AdminGuard>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFBFE' },
  centerScreen: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, backgroundColor: '#FFFBFE' },
  blockedTitle: { marginTop: 16, fontSize: 20, fontWeight: '800', color: '#1D1B20', textAlign: 'center' },
  blockedText: { marginTop: 8, fontSize: 14, lineHeight: 20, color: '#625B71', textAlign: 'center' },
  header: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  eyebrow: { fontSize: 12, fontWeight: '800', color: '#6750A4', letterSpacing: 1.6 },
  title: { marginTop: 2, fontSize: 28, fontWeight: '900', color: '#1D1B20' },
  logoutButton: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#F9DEDC', alignItems: 'center', justifyContent: 'center' },
  tabBar: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingBottom: 12 },
  tabItem: { minHeight: 48, flex: 1, borderRadius: 16, backgroundColor: '#E7E0EC', alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 6 },
  activeTab: { backgroundColor: '#6750A4' },
  tabText: { fontSize: 12, fontWeight: '800', color: '#625B71' },
  activeTabText: { color: '#fff' },
  scrollContent: { paddingHorizontal: 16, paddingBottom: 40 },
  message: { marginHorizontal: 16, marginBottom: 12, padding: 12, borderRadius: 16, fontWeight: '700', lineHeight: 18 },
  errorMessage: { color: '#B3261E', backgroundColor: '#F9DEDC' },
  successMessage: { color: '#146C2E', backgroundColor: '#DDF8E7' },
  loadingBox: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  helpText: { fontSize: 13, lineHeight: 20, color: '#625B71', marginBottom: 10 },
  primaryButton: { minHeight: 48, marginTop: 14, borderRadius: 16, backgroundColor: '#6750A4', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 18 },
  primaryButtonText: { color: '#fff', fontSize: 15, fontWeight: '900' },
  secondaryButton: { minHeight: 48, borderRadius: 16, backgroundColor: '#EADDFF', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 14 },
  secondaryButtonText: { color: '#4F378B', fontSize: 14, fontWeight: '900' },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  backButton: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
});
