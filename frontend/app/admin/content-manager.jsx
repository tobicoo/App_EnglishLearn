import AdminContent from '@/components/admin/AdminContent';
import AdminSettings from '@/components/admin/AdminSettings';
import AdminUsers from '@/components/admin/AdminUsers';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import {
  createAdminExercise,
  createAdminFlashcard,
  createAdminSection,
  createAdminUnit,
  deleteAdminExercise,
  deleteAdminFlashcard,
  deleteAdminSection,
  deleteAdminUnit,
  getAdminContent,
  getAdminHeartbeatSetting,
  getAdminUsers,
  resetAdminUserPassword,
  resetAdminUserProgress,
  updateAdminExercise,
  updateAdminFlashcard,
  updateAdminHeartbeatSetting,
  updateAdminSection,
  updateAdminUnit,
} from '@/services/api';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator, Alert, BackHandler,
  Pressable, ScrollView, StyleSheet, Text, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const TABS = [
  { key: 'settings', label: '⚙️ Cài đặt' },
  { key: 'content', label: '📚 Nội dung' },
  { key: 'users', label: '👥 Users' },
];

const showValue = (v) => (v === null || v === undefined ? '' : String(v));
const DEFAULT_MATCHING_PROMPT = 'Nối các cặp phù hợp';

export default function ContentManagerScreen() {
  const router = useRouter();
  const { theme } = useTheme();
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
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (activeTab === 'content') {
        const handled = adminContentRef.current?.goBackOneLevel?.();
        if (handled) return true;
      }
      return true;
    });
    return () => sub.remove();
  }, [activeTab]);

  const loadData = useCallback(async ({ showLoading = true, updateStatus = true } = {}) => {
    if (showLoading) setLoading(true);
    const [hr, cr, ur] = await Promise.all([
      getAdminHeartbeatSetting(), getAdminContent(), getAdminUsers(),
    ]);
    if (showLoading) setLoading(false);
    if (hr.error || cr.error || ur.error) {
      setStatus('error', hr.error || cr.error || ur.error);
      return;
    }
    setHeartbeatSeconds(showValue(hr.data?.heartRefillIntervalSeconds ?? 120));
    setSections(cr.data || []);
    setUsers(ur.data || []);
    if (updateStatus) setStatus('success', 'Đã tải dữ liệu.');
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const runSave = async (key, action, successText) => {
    setSavingKey(key);
    setStatus('', '');
    const { data, error } = await action();
    setSavingKey('');
    if (error) { setStatus('error', error); return null; }
    setStatus('success', successText);
    return data;
  };

  const saveHeartbeat = async () => {
    const seconds = Number(heartbeatSeconds);
    if (!Number.isInteger(seconds) || seconds < 1) { setStatus('error', 'Interval phải là số nguyên > 0.'); return; }
    const data = await runSave('heartbeat', () => updateAdminHeartbeatSetting(seconds), 'Đã cập nhật interval hồi tim.');
    if (data?.heartRefillIntervalSeconds) { setHeartbeatSeconds(String(data.heartRefillIntervalSeconds)); await refreshUser(); }
  };

  const handleSaveSection = async (id, form) => {
    const data = await runSave('section', () => updateAdminSection(id, { title: form.title, subtitle: form.subtitle, sortOrder: Number(form.sortOrder), isPublished: form.isPublished }), 'Đã lưu section.');
    if (data) await loadData({ showLoading: false, updateStatus: false });
  };
  const handleCreateSection = async (payload) => {
    const data = await runSave('create-section', () => createAdminSection(payload), 'Đã tạo section.');
    if (data) await loadData({ showLoading: false, updateStatus: false });
    return data;
  };
  const handleDeleteSection = async (id) => {
    const data = await runSave('delete-section', () => deleteAdminSection(id), 'Đã xóa section.');
    if (data !== null) await loadData({ showLoading: false, updateStatus: false });
    return data;
  };
  const handleSaveUnit = async (id, form) => {
    const kind = ['LESSON','REVIEW','CHECKPOINT'].includes(form.kind) ? form.kind : 'LESSON';
    const data = await runSave('unit', () => updateAdminUnit(id, { title: form.title || null, description: form.description || null, kind, sortOrder: Number(form.sortOrder), xpReward: Number(form.xpReward), isPublished: form.isPublished }), 'Đã lưu unit.');
    if (data) await loadData({ showLoading: false, updateStatus: false });
  };
  const handleCreateUnit = async (payload) => {
    const data = await runSave('create-unit', () => createAdminUnit(payload), 'Đã tạo unit.');
    if (data) await loadData({ showLoading: false, updateStatus: false });
    return data;
  };
  const handleDeleteUnit = async (id) => {
    const data = await runSave('delete-unit', () => deleteAdminUnit(id), 'Đã xóa unit.');
    if (data !== null) await loadData({ showLoading: false, updateStatus: false });
    return data;
  };
  const handleSaveExercise = async (id, form, optionForms, matchingPairForms, acceptedAnswerForms = []) => {
    const type = ['MULTIPLE_CHOICE','FILL_BLANK','MATCHING'].includes(form.type) ? form.type : 'MULTIPLE_CHOICE';
    const prompt = type === 'MATCHING' ? DEFAULT_MATCHING_PROMPT : form.prompt.trim();
    if (!prompt) { setStatus('error', 'Nội dung câu hỏi là bắt buộc.'); return; }
    const extra = {};
    if (type === 'MULTIPLE_CHOICE') {
      const opts = optionForms.filter((o) => o.text.trim());
      if (opts.length < 2) { setStatus('error', 'Cần ít nhất 2 options.'); return; }
      if (!opts.some((o) => o.isCorrect)) { setStatus('error', 'Cần chọn 1 option đúng.'); return; }
      if (opts.length > 0) extra.options = opts;
    }
    if (type === 'FILL_BLANK') {
      const answerText = acceptedAnswerForms.map((a) => a.text.trim()).filter(Boolean).join('|');
      if (!answerText) { setStatus('error', 'Cần ít nhất 1 đáp án đúng.'); return; }
      extra.answerText = answerText;
    }
    if (type === 'MATCHING') {
      const bad = matchingPairForms.findIndex((p) => (p.leftText.trim() || p.rightText.trim()) ? !(p.leftText.trim() && p.rightText.trim()) : false);
      if (bad >= 0) { setStatus('error', `Cặp ${bad + 1} cần đủ vế.`); return; }
      const pairs = matchingPairForms.filter((p) => p.leftText.trim() && p.rightText.trim());
      if (pairs.length < 1) { setStatus('error', 'Cần ít nhất 1 cặp matching.'); return; }
      extra.matchingPairs = pairs;
    }
    const data = await runSave('exercise', () => updateAdminExercise(id, { type, prompt, answerText: type === 'FILL_BLANK' ? extra.answerText : null, explanation: form.explanation || null, sortOrder: Number(form.sortOrder), xpReward: Number(form.xpReward), ...extra }), 'Đã lưu câu hỏi.');
    if (data) await loadData({ showLoading: false, updateStatus: false });
  };
  const handleCreateExercise = async (payload) => {
    const type = ['MULTIPLE_CHOICE','FILL_BLANK','MATCHING'].includes(payload.type) ? payload.type : 'MULTIPLE_CHOICE';
    const data = await runSave('create-exercise', () => createAdminExercise({ ...payload, prompt: type === 'MATCHING' ? DEFAULT_MATCHING_PROMPT : payload.prompt, answerText: type === 'MATCHING' ? null : payload.answerText }), 'Đã tạo câu hỏi.');
    if (data) await loadData({ showLoading: false, updateStatus: false });
    return data;
  };
  const handleDeleteExercise = async (id) => {
    const data = await runSave('delete-exercise', () => deleteAdminExercise(id), 'Đã xóa câu hỏi.');
    if (data !== null) await loadData({ showLoading: false, updateStatus: false });
    return data;
  };
  const handleSaveFlashcard = async (id, form) => {
    const data = await runSave('flashcard', () => updateAdminFlashcard(id, { word: form.word.trim(), phonetic: form.phonetic.trim() || null, meaning: form.meaning.trim(), imageUrl: form.imageUrl.trim() || null, sortOrder: Number(form.sortOrder) }), 'Đã lưu flashcard.');
    if (data) await loadData({ showLoading: false, updateStatus: false });
  };
  const handleCreateFlashcard = async (payload) => {
    const data = await runSave('create-flashcard', () => createAdminFlashcard(payload), 'Đã tạo flashcard.');
    if (data) await loadData({ showLoading: false, updateStatus: false });
    return data;
  };
  const handleDeleteFlashcard = async (id) => {
    const data = await runSave('delete-flashcard', () => deleteAdminFlashcard(id), 'Đã xóa flashcard.');
    if (data !== null) await loadData({ showLoading: false, updateStatus: false });
    return data;
  };
  const handleSavePassword = async (userId) => {
    const password = passwordByUserId[userId] || '';
    if (password.length < 6) { setStatus('error', 'Mật khẩu mới phải có ít nhất 6 ký tự.'); return; }
    const data = await runSave(`password-${userId}`, () => resetAdminUserPassword(userId, password), 'Đã đổi mật khẩu.');
    if (data) setPasswordByUserId((c) => ({ ...c, [userId]: '' }));
  };
  const handleResetProgress = async (targetUser) => {
    const data = await runSave(`reset-${targetUser.id}`, () => resetAdminUserProgress(targetUser.id), 'Đã reset tiến trình.');
    if (data) await loadData({ showLoading: false, updateStatus: false });
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        <Pressable onPress={() => { if (activeTab === 'content') { adminContentRef.current?.goBackOneLevel?.(); } else { router.back(); } }} style={styles.backBtn}>
          <Text style={[styles.backText, { color: '#1cb0f6' }]}>‹ Quay lại</Text>
        </Pressable>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Quản lý nội dung</Text>
        <View style={styles.backBtn} />
      </View>

      {/* Tab bar */}
      <View style={[styles.tabBar, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        {TABS.map((t) => (
          <Pressable key={t.key} style={[styles.tabItem, activeTab === t.key && styles.tabItemActive]} onPress={() => setActiveTab(t.key)}>
            <Text style={[styles.tabText, { color: activeTab === t.key ? '#fff' : theme.textSecondary }]}>{t.label}</Text>
          </Pressable>
        ))}
      </View>

      {message.text ? (
        <Text style={[styles.msg, message.type === 'error' ? styles.msgError : styles.msgSuccess]}>{message.text}</Text>
      ) : null}

      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator color="#1cb0f6" />
          <Text style={[styles.loadingText, { color: theme.textSecondary }]}>Đang tải dữ liệu admin...</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          {activeTab === 'settings' && (
            <AdminSettings heartbeatSeconds={heartbeatSeconds} onChangeHeartbeat={setHeartbeatSeconds} onSave={saveHeartbeat} saving={savingKey === 'heartbeat'} />
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
              onSaveFlashcard={handleSaveFlashcard}
              onCreateFlashcard={handleCreateFlashcard}
              onDeleteFlashcard={handleDeleteFlashcard}
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
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1,
  },
  backBtn: { width: 80 },
  backText: { fontSize: 16, fontWeight: '600' },
  headerTitle: { fontSize: 17, fontWeight: 'bold' },
  tabBar: { flexDirection: 'row', gap: 8, padding: 12, borderBottomWidth: 1 },
  tabItem: { flex: 1, paddingVertical: 9, borderRadius: 14, backgroundColor: '#e5e5e5', alignItems: 'center' },
  tabItemActive: { backgroundColor: '#1cb0f6' },
  tabText: { fontSize: 12, fontWeight: '700' },
  msg: { marginHorizontal: 16, marginTop: 10, padding: 12, borderRadius: 14, fontWeight: '600' },
  msgError: { color: '#b73535', backgroundColor: '#fff4f4' },
  msgSuccess: { color: '#2f7a12', backgroundColor: '#edffe5' },
  loadingBox: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { fontSize: 13 },
  scrollContent: { paddingHorizontal: 16, paddingBottom: 40 },
});
