import { useAuth } from '@/context/AuthContext';
import {
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
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const tabs = [
  { key: 'settings', label: 'Cài đặt', icon: 'settings-outline' },
  { key: 'content', label: 'Nội dung', icon: 'albums-outline' },
  { key: 'users', label: 'User', icon: 'people-outline' },
];

const showValue = (value) => (value === null || value === undefined ? '' : String(value));

function Field({ label, value, onChangeText, keyboardType = 'default', multiline = false }) {
  return (
    <View style={styles.fieldBlock}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={[styles.input, multiline && styles.multilineInput]}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        multiline={multiline}
        placeholderTextColor="#8a8f99"
      />
    </View>
  );
}

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
  const [selectedSectionId, setSelectedSectionId] = useState(null);
  const [selectedUnitId, setSelectedUnitId] = useState(null);
  const [selectedExerciseId, setSelectedExerciseId] = useState(null);
  const [sectionForm, setSectionForm] = useState({ title: '', subtitle: '', sortOrder: '1', isPublished: true });
  const [unitForm, setUnitForm] = useState({ title: '', description: '', kind: 'LESSON', sortOrder: '1', xpReward: '20', isPublished: true });
  const [exerciseForm, setExerciseForm] = useState({ prompt: '', answerText: '', explanation: '', sortOrder: '1', xpReward: '5' });
  const [optionForms, setOptionForms] = useState([]);
  const [matchingPairForms, setMatchingPairForms] = useState([]);
  const [passwordByUserId, setPasswordByUserId] = useState({});
  const [savingKey, setSavingKey] = useState('');

  const selectedSection = useMemo(
    () => sections.find((section) => section.id === selectedSectionId) || sections[0] || null,
    [sections, selectedSectionId],
  );
  const selectedUnit = useMemo(
    () => selectedSection?.units?.find((unit) => unit.id === selectedUnitId) || selectedSection?.units?.[0] || null,
    [selectedSection, selectedUnitId],
  );
  const selectedExercise = useMemo(
    () => selectedUnit?.exercises?.find((exercise) => exercise.id === selectedExerciseId) || selectedUnit?.exercises?.[0] || null,
    [selectedUnit, selectedExerciseId],
  );

  const setStatus = (type, text) => setMessage({ type, text });

  const loadAdminData = useCallback(async () => {
    setLoading(true);
    const [heartbeatResult, contentResult, usersResult] = await Promise.all([
      getAdminHeartbeatSetting(),
      getAdminContent(),
      getAdminUsers(),
    ]);
    setLoading(false);

    const firstError = heartbeatResult.error || contentResult.error || usersResult.error;
    if (firstError) {
      setStatus('error', firstError);
      return;
    }

    setHeartbeatSeconds(showValue(heartbeatResult.data?.heartRefillIntervalSeconds ?? 120));
    setSections(contentResult.data || []);
    setUsers(usersResult.data || []);
    setStatus('success', 'Đã tải dữ liệu admin.');
  }, []);

  useEffect(() => {
    loadAdminData();
  }, [loadAdminData]);

  useEffect(() => {
    if (!selectedSection) return;
    setSelectedSectionId(selectedSection.id);
    setSectionForm({
      title: showValue(selectedSection.title),
      subtitle: showValue(selectedSection.subtitle ?? selectedSection.subTitle),
      sortOrder: showValue(selectedSection.sortOrder ?? selectedSection.order ?? 1),
      isPublished: selectedSection.isPublished !== false,
    });
  }, [selectedSection]);

  useEffect(() => {
    if (!selectedUnit) return;
    setSelectedUnitId(selectedUnit.id);
    setUnitForm({
      title: showValue(selectedUnit.title),
      description: showValue(selectedUnit.description),
      kind: showValue(selectedUnit.kind || 'LESSON').toUpperCase(),
      sortOrder: showValue(selectedUnit.sortOrder ?? selectedUnit.order ?? 1),
      xpReward: showValue(selectedUnit.xpReward ?? selectedUnit.baseXp ?? 20),
      isPublished: selectedUnit.isPublished !== false,
    });
  }, [selectedUnit]);

  useEffect(() => {
    if (!selectedExercise) return;
    setSelectedExerciseId(selectedExercise.id);
    setExerciseForm({
      prompt: showValue(selectedExercise.prompt),
      answerText: showValue(selectedExercise.answerText),
      explanation: showValue(selectedExercise.explanation ?? selectedExercise.instruction),
      sortOrder: showValue(selectedExercise.sortOrder ?? selectedExercise.order ?? 1),
      xpReward: showValue(selectedExercise.xpReward ?? 5),
    });
    setOptionForms((selectedExercise.options || []).map((option) => ({
      id: option.id,
      text: showValue(option.text),
      isCorrect: option.id === selectedExercise.correctOptionId,
    })));
    setMatchingPairForms((selectedExercise.matchingPairs || selectedExercise.pairs || []).map((pair) => ({
      id: pair.id,
      leftText: showValue(pair.leftText),
      rightText: showValue(pair.rightText),
    })));
  }, [selectedExercise]);

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

  const saveSection = async () => {
    if (!selectedSection) return;
    const data = await runSave('section', () => updateAdminSection(selectedSection.id, {
      title: sectionForm.title,
      subtitle: sectionForm.subtitle,
      sortOrder: Number(sectionForm.sortOrder),
      isPublished: sectionForm.isPublished,
    }), 'Đã lưu section.');
    if (data) await loadAdminData();
  };

  const saveUnit = async () => {
    if (!selectedUnit) return;
    const data = await runSave('unit', () => updateAdminUnit(selectedUnit.id, {
      title: unitForm.title || null,
      description: unitForm.description || null,
      kind: unitForm.kind,
      sortOrder: Number(unitForm.sortOrder),
      xpReward: Number(unitForm.xpReward),
      isPublished: unitForm.isPublished,
    }), 'Đã lưu unit.');
    if (data) await loadAdminData();
  };

  const saveExercise = async () => {
    if (!selectedExercise) return;
    const type = String(selectedExercise.type || '').toUpperCase();
    const extraPayload = {};
    if (type === 'MULTIPLE_CHOICE' || type === 'FILL_BLANK') {
      const options = optionForms.filter((option) => option.text.trim());
      if (options.length > 0) extraPayload.options = options;
    }
    if (type === 'MATCHING') {
      const matchingPairs = matchingPairForms.filter((pair) => pair.leftText.trim() && pair.rightText.trim());
      if (matchingPairs.length > 0) extraPayload.matchingPairs = matchingPairs;
    }

    const data = await runSave('exercise', () => updateAdminExercise(selectedExercise.id, {
      prompt: exerciseForm.prompt,
      answerText: exerciseForm.answerText || null,
      explanation: exerciseForm.explanation || null,
      sortOrder: Number(exerciseForm.sortOrder),
      xpReward: Number(exerciseForm.xpReward),
      ...extraPayload,
    }), 'Đã lưu câu hỏi.');
    if (data) await loadAdminData();
  };

  const updateOptionForm = (index, patch) => {
    setOptionForms((current) => current.map((option, optionIndex) => (
      optionIndex === index ? { ...option, ...patch } : option
    )));
  };

  const markCorrectOption = (index) => {
    setOptionForms((current) => current.map((option, optionIndex) => ({ ...option, isCorrect: optionIndex === index })));
  };

  const addOptionForm = () => {
    setOptionForms((current) => [...current, { id: null, text: '', isCorrect: current.length === 0 }]);
  };

  const removeOptionForm = (index) => {
    setOptionForms((current) => current.filter((_, optionIndex) => optionIndex !== index));
  };

  const updateMatchingPairForm = (index, patch) => {
    setMatchingPairForms((current) => current.map((pair, pairIndex) => (
      pairIndex === index ? { ...pair, ...patch } : pair
    )));
  };

  const addMatchingPairForm = () => {
    setMatchingPairForms((current) => [...current, { id: null, leftText: '', rightText: '' }]);
  };

  const removeMatchingPairForm = (index) => {
    setMatchingPairForms((current) => current.filter((_, pairIndex) => pairIndex !== index));
  };

  const saveUserPassword = async (userId) => {
    const password = passwordByUserId[userId] || '';
    if (password.length < 6) {
      setStatus('error', 'Mật khẩu mới phải có ít nhất 6 ký tự.');
      return;
    }

    const data = await runSave(`password-${userId}`, () => resetAdminUserPassword(userId, password), 'Đã đổi mật khẩu người dùng.');
    if (data) setPasswordByUserId((current) => ({ ...current, [userId]: '' }));
  };

  const confirmResetProgress = (targetUser) => {
    Alert.alert(
      'Reset tiến trình',
      `Xóa toàn bộ dữ liệu học tập của ${targetUser.email}? Tài khoản sẽ trở về như mới.`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            const data = await runSave(
              `reset-${targetUser.id}`,
              () => resetAdminUserProgress(targetUser.id),
              'Đã reset tiến trình người dùng.',
            );
            if (data) await loadAdminData();
          },
        },
      ],
    );
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

  const renderSettings = () => (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Interval hồi tim</Text>
      <Text style={styles.helpText}>Nhập số giây cho mỗi lần hồi 1 tim. Ví dụ 120 là 2 phút.</Text>
      <Field label="Số giây" value={heartbeatSeconds} onChangeText={setHeartbeatSeconds} keyboardType="number-pad" />
      <Pressable style={styles.primaryButton} onPress={saveHeartbeat} disabled={savingKey === 'heartbeat'}>
        <Text style={styles.primaryButtonText}>{savingKey === 'heartbeat' ? 'Đang lưu...' : 'Lưu interval'}</Text>
      </Pressable>
    </View>
  );

  const renderContent = () => (
    <View>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Section</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
          {sections.map((section) => (
            <Pressable
              key={section.id}
              style={[styles.chip, selectedSection?.id === section.id && styles.activeChip]}
              onPress={() => setSelectedSectionId(section.id)}
            >
              <Text style={[styles.chipText, selectedSection?.id === section.id && styles.activeChipText]}>{section.title}</Text>
            </Pressable>
          ))}
        </ScrollView>
        {selectedSection ? (
          <>
            <Field label="Tên section" value={sectionForm.title} onChangeText={(title) => setSectionForm((current) => ({ ...current, title }))} />
            <Field label="Mô tả" value={sectionForm.subtitle} onChangeText={(subtitle) => setSectionForm((current) => ({ ...current, subtitle }))} />
            <Field label="Thứ tự" value={sectionForm.sortOrder} onChangeText={(sortOrder) => setSectionForm((current) => ({ ...current, sortOrder }))} keyboardType="number-pad" />
            <View style={styles.switchRow}>
              <Text style={styles.fieldLabel}>Hiển thị</Text>
              <Switch value={sectionForm.isPublished} onValueChange={(isPublished) => setSectionForm((current) => ({ ...current, isPublished }))} />
            </View>
            <Pressable style={styles.primaryButton} onPress={saveSection} disabled={savingKey === 'section'}>
              <Text style={styles.primaryButtonText}>{savingKey === 'section' ? 'Đang lưu...' : 'Lưu section'}</Text>
            </Pressable>
          </>
        ) : <Text style={styles.emptyText}>Chưa có section.</Text>}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Unit</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
          {(selectedSection?.units || []).map((unit) => (
            <Pressable key={unit.id} style={[styles.chip, selectedUnit?.id === unit.id && styles.activeChip]} onPress={() => setSelectedUnitId(unit.id)}>
              <Text style={[styles.chipText, selectedUnit?.id === unit.id && styles.activeChipText]}>{unit.title || `Unit ${unit.sortOrder}`}</Text>
            </Pressable>
          ))}
        </ScrollView>
        {selectedUnit ? (
          <>
            <Field label="Tên unit" value={unitForm.title} onChangeText={(title) => setUnitForm((current) => ({ ...current, title }))} />
            <Field label="Mô tả" value={unitForm.description} onChangeText={(description) => setUnitForm((current) => ({ ...current, description }))} multiline />
            <Field label="Loại unit" value={unitForm.kind} onChangeText={(kind) => setUnitForm((current) => ({ ...current, kind: kind.toUpperCase() }))} />
            <Field label="Thứ tự" value={unitForm.sortOrder} onChangeText={(sortOrder) => setUnitForm((current) => ({ ...current, sortOrder }))} keyboardType="number-pad" />
            <Field label="XP" value={unitForm.xpReward} onChangeText={(xpReward) => setUnitForm((current) => ({ ...current, xpReward }))} keyboardType="number-pad" />
            <View style={styles.switchRow}>
              <Text style={styles.fieldLabel}>Hiển thị</Text>
              <Switch value={unitForm.isPublished} onValueChange={(isPublished) => setUnitForm((current) => ({ ...current, isPublished }))} />
            </View>
            <Pressable style={styles.primaryButton} onPress={saveUnit} disabled={savingKey === 'unit'}>
              <Text style={styles.primaryButtonText}>{savingKey === 'unit' ? 'Đang lưu...' : 'Lưu unit'}</Text>
            </Pressable>
          </>
        ) : <Text style={styles.emptyText}>Chọn section có unit để sửa.</Text>}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Câu hỏi</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
          {(selectedUnit?.exercises || []).map((exercise) => (
            <Pressable key={exercise.id} style={[styles.chip, selectedExercise?.id === exercise.id && styles.activeChip]} onPress={() => setSelectedExerciseId(exercise.id)}>
              <Text style={[styles.chipText, selectedExercise?.id === exercise.id && styles.activeChipText]}>Câu {exercise.sortOrder || exercise.order}</Text>
            </Pressable>
          ))}
        </ScrollView>
        {selectedExercise ? (
          <>
            <Text style={styles.helpText}>Loại: {selectedExercise.type}</Text>
            <Field label="Câu hỏi" value={exerciseForm.prompt} onChangeText={(prompt) => setExerciseForm((current) => ({ ...current, prompt }))} multiline />
            <Field label="Đáp án text" value={exerciseForm.answerText} onChangeText={(answerText) => setExerciseForm((current) => ({ ...current, answerText }))} multiline />
            <Field label="Giải thích" value={exerciseForm.explanation} onChangeText={(explanation) => setExerciseForm((current) => ({ ...current, explanation }))} multiline />
            <Field label="Thứ tự" value={exerciseForm.sortOrder} onChangeText={(sortOrder) => setExerciseForm((current) => ({ ...current, sortOrder }))} keyboardType="number-pad" />
            <Field label="XP" value={exerciseForm.xpReward} onChangeText={(xpReward) => setExerciseForm((current) => ({ ...current, xpReward }))} keyboardType="number-pad" />
            {String(selectedExercise.type || '').toUpperCase() !== 'MATCHING' ? (
              <View style={styles.nestedEditor}>
                <View style={styles.nestedHeader}>
                  <Text style={styles.nestedTitle}>Options</Text>
                  <Pressable style={styles.smallButton} onPress={addOptionForm}>
                    <Text style={styles.smallButtonText}>Thêm</Text>
                  </Pressable>
                </View>
                {optionForms.map((option, index) => (
                  <View key={option.id || `new-option-${index}`} style={styles.nestedRow}>
                    <Field label={`Option ${index + 1}`} value={option.text} onChangeText={(text) => updateOptionForm(index, { text })} />
                    <View style={styles.rowActions}>
                      <Pressable style={[styles.secondaryButton, option.isCorrect && styles.correctButton]} onPress={() => markCorrectOption(index)}>
                        <Text style={[styles.secondaryButtonText, option.isCorrect && styles.correctButtonText]}>{option.isCorrect ? 'Đáp án đúng' : 'Chọn đúng'}</Text>
                      </Pressable>
                      <Pressable style={styles.dangerButton} onPress={() => removeOptionForm(index)}>
                        <Text style={styles.dangerButtonText}>Xóa</Text>
                      </Pressable>
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.nestedEditor}>
                <View style={styles.nestedHeader}>
                  <Text style={styles.nestedTitle}>Cặp matching</Text>
                  <Pressable style={styles.smallButton} onPress={addMatchingPairForm}>
                    <Text style={styles.smallButtonText}>Thêm</Text>
                  </Pressable>
                </View>
                {matchingPairForms.map((pair, index) => (
                  <View key={pair.id || `new-pair-${index}`} style={styles.nestedRow}>
                    <Field label={`Vế trái ${index + 1}`} value={pair.leftText} onChangeText={(leftText) => updateMatchingPairForm(index, { leftText })} />
                    <Field label={`Vế phải ${index + 1}`} value={pair.rightText} onChangeText={(rightText) => updateMatchingPairForm(index, { rightText })} />
                    <Pressable style={styles.dangerButton} onPress={() => removeMatchingPairForm(index)}>
                      <Text style={styles.dangerButtonText}>Xóa cặp</Text>
                    </Pressable>
                  </View>
                ))}
              </View>
            )}
            <Pressable style={styles.primaryButton} onPress={saveExercise} disabled={savingKey === 'exercise'}>
              <Text style={styles.primaryButtonText}>{savingKey === 'exercise' ? 'Đang lưu...' : 'Lưu câu hỏi'}</Text>
            </Pressable>
          </>
        ) : <Text style={styles.emptyText}>Chọn unit có câu hỏi để sửa.</Text>}
      </View>
    </View>
  );

  const renderUsers = () => (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Danh sách người dùng</Text>
      {users.map((targetUser) => (
        <View key={targetUser.id} style={styles.userCard}>
          <View style={styles.userHeader}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>{(targetUser.name || targetUser.email || '?').slice(0, 1).toUpperCase()}</Text>
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{targetUser.name}</Text>
              <Text style={styles.userEmail}>{targetUser.email}</Text>
              <Text style={styles.userMeta}>XP {targetUser.totalXp ?? 0} · Level {targetUser.level ?? 1} · Tim {targetUser.hearts ?? 0}/{targetUser.maxHearts ?? 5}</Text>
            </View>
          </View>
          <Field
            label="Mật khẩu mới"
            value={passwordByUserId[targetUser.id] || ''}
            onChangeText={(newPassword) => setPasswordByUserId((current) => ({ ...current, [targetUser.id]: newPassword }))}
          />
          <View style={styles.userActionRow}>
            <Pressable style={styles.secondaryButton} onPress={() => saveUserPassword(targetUser.id)} disabled={savingKey === `password-${targetUser.id}`}>
              <Text style={styles.secondaryButtonText}>{savingKey === `password-${targetUser.id}` ? 'Đang đổi...' : 'Đổi mật khẩu'}</Text>
            </Pressable>
            <Pressable style={styles.dangerButton} onPress={() => confirmResetProgress(targetUser)} disabled={savingKey === `reset-${targetUser.id}`}>
              <Text style={styles.dangerButtonText}>{savingKey === `reset-${targetUser.id}` ? 'Đang reset...' : 'Reset tiến trình'}</Text>
            </Pressable>
          </View>
        </View>
      ))}
    </View>
  );

  return (
    <AdminGuard>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <View>
            <Text style={styles.eyebrow}>ADMIN</Text>
            <Text style={styles.title}>Bảng quản trị</Text>
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
            {activeTab === 'settings' ? renderSettings() : null}
            {activeTab === 'content' ? renderContent() : null}
            {activeTab === 'users' ? renderUsers() : null}
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
  card: { marginBottom: 16, borderRadius: 24, backgroundColor: '#fff', borderWidth: 1, borderColor: '#E7E0EC', padding: 16, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 2 },
  cardTitle: { fontSize: 18, fontWeight: '900', color: '#1D1B20', marginBottom: 8 },
  helpText: { fontSize: 13, lineHeight: 20, color: '#625B71', marginBottom: 10 },
  fieldBlock: { marginTop: 10 },
  fieldLabel: { fontSize: 13, fontWeight: '800', color: '#49454F', marginBottom: 6 },
  input: { minHeight: 48, borderWidth: 1, borderColor: '#CAC4D0', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, color: '#1D1B20', fontSize: 15, backgroundColor: '#FFFBFE' },
  multilineInput: { minHeight: 92, textAlignVertical: 'top' },
  switchRow: { minHeight: 48, marginTop: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  primaryButton: { minHeight: 48, marginTop: 14, borderRadius: 16, backgroundColor: '#6750A4', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 18 },
  primaryButtonText: { color: '#fff', fontSize: 15, fontWeight: '900' },
  secondaryButton: { minHeight: 48, borderRadius: 16, backgroundColor: '#EADDFF', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 14 },
  secondaryButtonText: { color: '#4F378B', fontSize: 14, fontWeight: '900' },
  dangerButton: { minHeight: 48, borderRadius: 16, backgroundColor: '#F9DEDC', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 14 },
  dangerButtonText: { color: '#B3261E', fontSize: 14, fontWeight: '900' },
  chipRow: { gap: 8, paddingVertical: 6 },
  chip: { minHeight: 44, borderRadius: 22, paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: '#E7E0EC' },
  activeChip: { backgroundColor: '#6750A4' },
  chipText: { color: '#49454F', fontWeight: '800' },
  activeChipText: { color: '#fff' },
  emptyText: { color: '#625B71', fontSize: 14, lineHeight: 20, marginTop: 8 },
  message: { marginHorizontal: 16, marginBottom: 12, padding: 12, borderRadius: 16, fontWeight: '700', lineHeight: 18 },
  errorMessage: { color: '#B3261E', backgroundColor: '#F9DEDC' },
  successMessage: { color: '#146C2E', backgroundColor: '#DDF8E7' },
  loadingBox: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  userCard: { marginTop: 12, borderTopWidth: 1, borderTopColor: '#E7E0EC', paddingTop: 14 },
  userHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatarCircle: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#EADDFF', alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#4F378B', fontSize: 18, fontWeight: '900' },
  userInfo: { flex: 1 },
  userName: { fontSize: 16, fontWeight: '900', color: '#1D1B20' },
  userEmail: { marginTop: 2, color: '#625B71', fontSize: 13 },
  userMeta: { marginTop: 4, color: '#49454F', fontSize: 12, fontWeight: '700' },
  userActionRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
  nestedEditor: { marginTop: 14, borderTopWidth: 1, borderTopColor: '#E7E0EC', paddingTop: 12 },
  nestedHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  nestedTitle: { fontSize: 15, fontWeight: '900', color: '#1D1B20' },
  nestedRow: { marginTop: 8, padding: 10, borderRadius: 16, backgroundColor: '#FFFBFE', borderWidth: 1, borderColor: '#E7E0EC' },
  rowActions: { flexDirection: 'row', gap: 8, marginTop: 10 },
  smallButton: { minHeight: 40, borderRadius: 20, backgroundColor: '#EADDFF', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 14 },
  smallButtonText: { color: '#4F378B', fontSize: 13, fontWeight: '900' },
  correctButton: { backgroundColor: '#DDF8E7' },
  correctButtonText: { color: '#146C2E' },
});
