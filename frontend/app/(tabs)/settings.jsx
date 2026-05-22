import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { changeCurrentUserPassword, updateUser } from '@/services/api';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SettingsScreen() {
  const router = useRouter();
  const { user, logout, refreshUser } = useAuth();
  const { isDark, toggleTheme, theme } = useTheme();

  // Edit profile states
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [saving, setSaving] = useState(false);
  const [profileMessage, setProfileMessage] = useState({ type: '', text: '' });
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState({ type: '', text: '' });

  // Sound toggle state
  const [soundEnabled, setSoundEnabled] = useState(true);

  const openEditProfile = () => {
    setEditName(user?.name || '');
    setProfileMessage({ type: '', text: '' });
    setIsEditing(true);
  };

  const handleSaveProfile = async () => {
    if (!editName.trim()) {
      setProfileMessage({ type: 'error', text: 'Tên không được để trống.' });
      return;
    }
    setSaving(true);
    setProfileMessage({ type: '', text: '' });
    const { error } = await updateUser({
      name: editName.trim(),
      age: user.age,
      avatar: user.avatar,
    });
    setSaving(false);

    if (error) {
      setProfileMessage({ type: 'error', text: error });
      return;
    }

    await refreshUser();
    setProfileMessage({ type: 'success', text: 'Cập nhật hồ sơ thành công.' });
    setTimeout(() => setIsEditing(false), 600);
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword) {
      setPasswordMessage({ type: 'error', text: 'Vui lòng nhập mật khẩu hiện tại và mật khẩu mới.' });
      return;
    }

    if (newPassword.length < 6) {
      setPasswordMessage({ type: 'error', text: 'Mật khẩu mới phải có ít nhất 6 ký tự.' });
      return;
    }

    setChangingPassword(true);
    setPasswordMessage({ type: '', text: '' });
    const { error } = await changeCurrentUserPassword(currentPassword, newPassword);
    setChangingPassword(false);

    if (error) {
      setPasswordMessage({ type: 'error', text: error });
      return;
    }

    setCurrentPassword('');
    setNewPassword('');
    setPasswordMessage({ type: 'success', text: 'Đổi mật khẩu thành công.' });
  };

  const handleLogout = () => {
    Alert.alert(
      'Đăng xuất',
      'Bạn có chắc chắn muốn đăng xuất?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Đăng xuất',
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/');
          },
        },
      ],
    );
  };

  if (!user) {
    return (
      <SafeAreaView style={[styles.container, styles.centerState, { backgroundColor: theme.background }]}> 
        <Text style={[styles.stateTitle, { color: theme.text }]}>Chưa có phiên đăng nhập</Text>
        <Text style={[styles.stateText, { color: theme.textSecondary }]}>Vui lòng đăng nhập lại để chỉnh sửa cài đặt tài khoản.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.headerSection}>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Cài đặt</Text>
        </View>

        {/* ============ EDIT PROFILE SECTION ============ */}
        <View style={[styles.section, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={styles.sectionHeaderRow}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Hồ sơ cá nhân</Text>
            {!isEditing && (
              <TouchableOpacity onPress={openEditProfile} style={styles.editBtn}>
                <Text style={styles.editBtnText}>Sửa</Text>
              </TouchableOpacity>
            )}
          </View>

          {profileMessage.text ? (
            <Text style={[styles.inlineMessage, profileMessage.type === 'error' ? styles.errorText : styles.successText]}>{profileMessage.text}</Text>
          ) : null}

          {isEditing ? (
            <View style={styles.editForm}>
              <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Tên hiển thị</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.text }]}
                value={editName}
                onChangeText={setEditName}
                placeholder="Nhập tên"
                placeholderTextColor={theme.textSecondary}
              />

              <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Email</Text>
              <View style={[styles.readonlyField, { backgroundColor: theme.inputBg, borderColor: theme.border }]}>
                <Text style={[styles.readonlyValue, { color: theme.text }]}>{user.email || '—'}</Text>
              </View>

              <View style={styles.editBtnRow}>
                <TouchableOpacity
                  style={[styles.actionBtn, styles.cancelBtn]}
                  onPress={() => { setProfileMessage({ type: '', text: '' }); setIsEditing(false); }}
                >
                  <Text style={styles.cancelBtnText}>Hủy</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionBtn, styles.saveBtn, saving && styles.disabledBtn]}
                  onPress={handleSaveProfile}
                  disabled={saving}
                >
                  <Text style={styles.saveBtnText}>
                    {saving ? 'Đang lưu...' : 'Lưu'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View>
              <View style={[styles.infoRow, { borderBottomColor: theme.border }]}>
                <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>Tên</Text>
                <Text style={[styles.infoValue, { color: theme.text }]}>{user.name}</Text>
              </View>
              <View style={[styles.infoRow, { borderBottomColor: 'transparent' }]}>
                <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>Email</Text>
                <Text style={[styles.infoValue, { color: theme.text }]}>{user.email || '—'}</Text>
              </View>
            </View>
          )}
        </View>

        {/* ============ CHANGE PASSWORD SECTION ============ */}
        <View style={[styles.section, { backgroundColor: theme.surface, borderColor: theme.border }]}> 
          <View style={styles.sectionHeaderRow}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Đổi mật khẩu</Text>
          </View>
          {passwordMessage.text ? (
            <Text style={[styles.inlineMessage, passwordMessage.type === 'error' ? styles.errorText : styles.successText]}>{passwordMessage.text}</Text>
          ) : null}
          <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Mật khẩu hiện tại</Text>
          <TextInput
            style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.text }]}
            value={currentPassword}
            onChangeText={setCurrentPassword}
            placeholder="Nhập mật khẩu hiện tại"
            placeholderTextColor={theme.textSecondary}
            secureTextEntry
          />
          <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Mật khẩu mới</Text>
          <TextInput
            style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.text }]}
            value={newPassword}
            onChangeText={setNewPassword}
            placeholder="Ít nhất 6 ký tự"
            placeholderTextColor={theme.textSecondary}
            secureTextEntry
          />
          <TouchableOpacity
            style={[styles.savePasswordBtn, changingPassword && styles.disabledBtn]}
            onPress={handleChangePassword}
            disabled={changingPassword}
          >
            <Text style={styles.saveBtnText}>{changingPassword ? 'Đang đổi...' : 'Đổi mật khẩu'}</Text>
          </TouchableOpacity>
        </View>

        {/* ============ PREFERENCES SECTION ============ */}
        <View style={[styles.section, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[styles.sectionTitle, { color: theme.text, marginBottom: 15 }]}>Tùy chỉnh</Text>

          {/* Sound Toggle */}
          <View style={[styles.preferenceRow, { borderBottomColor: theme.border }]}>
            <View style={styles.preferenceInfo}>
              <Text style={[styles.preferenceLabel, { color: theme.text }]}>Âm thanh</Text>
              <Text style={[styles.preferenceDesc, { color: theme.textSecondary }]}>Bật/tắt hiệu ứng âm thanh</Text>
            </View>
            <Switch
              value={soundEnabled}
              onValueChange={setSoundEnabled}
              trackColor={{ false: '#ccc', true: '#CE82FF' }}
              thumbColor={soundEnabled ? '#fff' : '#f4f3f4'}
            />
          </View>

          {/* Dark Mode Toggle */}
          <View style={[styles.preferenceRow, { borderBottomColor: 'transparent' }]}>
            <View style={styles.preferenceInfo}>
              <Text style={[styles.preferenceLabel, { color: theme.text }]}>Chế độ tối</Text>
              <Text style={[styles.preferenceDesc, { color: theme.textSecondary }]}>Giao diện tối cho mắt thoải mái hơn</Text>
            </View>
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{ false: '#ccc', true: '#CE82FF' }}
              thumbColor={isDark ? '#fff' : '#f4f3f4'}
            />
          </View>
        </View>

        {/* ============ LOGOUT BUTTON ============ */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutBtnText}>Đăng xuất</Text>
        </TouchableOpacity>

        {/* App info */}
        <Text style={[styles.versionText, { color: theme.textSecondary }]}>English Learn App v1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centerState: { justifyContent: 'center', alignItems: 'center', padding: 24 },
  stateTitle: { fontSize: 20, fontWeight: 'bold', textAlign: 'center', marginBottom: 8 },
  stateText: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
  scrollContent: { paddingBottom: 120 },
  headerSection: {
    paddingHorizontal: 20, paddingTop: 20, paddingBottom: 10,
  },
  headerTitle: {
    fontSize: 28, fontWeight: 'bold',
  },
  section: {
    marginHorizontal: 16, marginTop: 16, borderRadius: 20,
    padding: 20, borderWidth: 1,
  },
  sectionHeaderRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 5,
  },
  sectionTitle: {
    fontSize: 17, fontWeight: 'bold',
  },
  editBtn: {
    backgroundColor: '#CE82FF', paddingHorizontal: 16, paddingVertical: 6,
    borderRadius: 20,
  },
  editBtnText: {
    color: '#fff', fontWeight: 'bold', fontSize: 13,
  },
  unavailableBadge: {
    borderWidth: 1, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,
  },
  unavailableBadgeText: { fontWeight: 'bold', fontSize: 12 },
  unavailableText: { fontSize: 13, lineHeight: 19, marginTop: 12 },
  editForm: {
    marginTop: 15,
  },
  inputLabel: {
    fontSize: 13, fontWeight: '600', marginBottom: 6, marginTop: 10,
  },
  input: {
    borderWidth: 2, borderRadius: 14, padding: 14, fontSize: 15,
  },
  readonlyField: {
    borderWidth: 2, borderRadius: 14, padding: 14,
  },
  readonlyValue: {
    fontSize: 15,
  },
  editBtnRow: {
    flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 18,
  },
  actionBtn: {
    paddingHorizontal: 24, paddingVertical: 12, borderRadius: 14,
  },
  cancelBtn: {
    backgroundColor: '#e5e5e5',
  },
  cancelBtnText: {
    color: '#666', fontWeight: 'bold', fontSize: 14,
  },
  saveBtn: {
    backgroundColor: '#CE82FF',
  },
  savePasswordBtn: {
    minHeight: 48,
    backgroundColor: '#CE82FF',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
  },
  disabledBtn: { opacity: 0.6 },
  saveBtnText: {
    color: '#fff', fontWeight: 'bold', fontSize: 14,
  },
  infoRow: {
    flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 14,
    borderBottomWidth: 1,
  },
  infoLabel: { fontSize: 15 },
  infoValue: { fontSize: 15, fontWeight: '500' },
  inlineMessage: { marginTop: 12, padding: 10, borderRadius: 12, fontWeight: '600', lineHeight: 18 },
  errorText: { color: '#b73535', backgroundColor: '#fff4f4' },
  successText: { color: '#2f7a12', backgroundColor: '#edffe5' },
  preferenceRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 14, borderBottomWidth: 1,
  },
  preferenceInfo: { flex: 1, marginRight: 15 },
  preferenceLabel: { fontSize: 15, fontWeight: '600' },
  preferenceDesc: { fontSize: 12, marginTop: 3 },
  logoutBtn: {
    marginHorizontal: 16, marginTop: 25, backgroundColor: '#ff4b4b',
    borderRadius: 16, padding: 16, alignItems: 'center',
    ...Platform.select({
      ios: { shadowColor: '#ff4b4b', shadowOpacity: 0.3, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } },
      android: { elevation: 6 },
    }),
  },
  logoutBtnText: {
    color: '#fff', fontWeight: 'bold', fontSize: 16, letterSpacing: 0.5,
  },
  versionText: {
    textAlign: 'center', fontSize: 12, marginTop: 20, marginBottom: 10,
  },
});
