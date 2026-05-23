import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { updateUser } from '@/services/api';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Alert, ScrollView, StyleSheet, Text,
  TextInput, TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const AVATAR_OPTIONS = [
  '🐣', '🦁', '🐯', '🐻', '🦊', '🐼', '🐨', '🐸',
  '🦝', '🦄', '🐺', '🦋', '🐬', '🦜', '🐙', '🦖',
  '🧑', '👦', '👧', '🧒', '🧔', '👩',
];

export default function ProfileInfoScreen() {
  const router = useRouter();
  const { user, refreshUser } = useAuth();
  const { theme } = useTheme();

  const [name, setName] = useState(user?.name || '');
  const [avatar, setAvatar] = useState(user?.avatar || '🐣');
  const [showPicker, setShowPicker] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleSave = async () => {
    if (!name.trim()) {
      setMessage({ type: 'error', text: 'Tên không được để trống.' });
      return;
    }
    setSaving(true);
    setMessage({ type: '', text: '' });
    const { error } = await updateUser({ name: name.trim(), age: user?.age, avatar });
    setSaving(false);
    if (error) {
      setMessage({ type: 'error', text: error });
      return;
    }
    await refreshUser();
    setMessage({ type: 'success', text: 'Cập nhật thành công!' });
    setTimeout(() => router.back(), 800);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Xóa tài khoản',
      'Hành động này không thể hoàn tác. Bạn có chắc chắn muốn xóa tài khoản?',
      [
        { text: 'Hủy', style: 'cancel' },
        { text: 'Xóa', style: 'destructive', onPress: () => Alert.alert('Thông báo', 'Tính năng đang phát triển.') },
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.border, backgroundColor: theme.surface }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={[styles.backText, { color: '#1cb0f6' }]}>‹ Quay lại</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Thông tin cá nhân</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Avatar */}
        <View style={styles.avatarSection}>
          <TouchableOpacity onPress={() => setShowPicker(!showPicker)} activeOpacity={0.8}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarEmoji}>{avatar}</Text>
            </View>
            <View style={styles.editBadge}>
              <Text style={styles.editBadgeText}>✏️</Text>
            </View>
          </TouchableOpacity>
          <Text style={[styles.changeAvatarHint, { color: theme.textSecondary }]}>Nhấn để thay avatar</Text>
        </View>

        {/* Avatar picker */}
        {showPicker && (
          <View style={[styles.avatarPicker, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={styles.pickerGrid}>
              {AVATAR_OPTIONS.map((emoji) => (
                <TouchableOpacity
                  key={emoji}
                  style={[styles.pickerItem, avatar === emoji && styles.pickerItemActive]}
                  onPress={() => { setAvatar(emoji); setShowPicker(false); }}
                >
                  <Text style={styles.pickerEmoji}>{emoji}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Form */}
        <View style={[styles.formCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          {message.text ? (
            <Text style={[
              styles.message,
              message.type === 'error' ? styles.msgError : styles.msgSuccess,
            ]}>{message.text}</Text>
          ) : null}

          <Text style={[styles.label, { color: theme.textSecondary }]}>Họ và tên</Text>
          <TextInput
            style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.text }]}
            value={name}
            onChangeText={setName}
            placeholder="Nhập họ và tên"
            placeholderTextColor={theme.textSecondary}
          />

          <Text style={[styles.label, { color: theme.textSecondary }]}>Email</Text>
          <View style={[styles.readonlyBox, { backgroundColor: theme.inputBg, borderColor: theme.border }]}>
            <Text style={[styles.readonlyText, { color: theme.textSecondary }]}>{user?.email || '—'}</Text>
          </View>

          <Text style={[styles.label, { color: theme.textSecondary }]}>Vai trò</Text>
          <View style={[styles.readonlyBox, { backgroundColor: theme.inputBg, borderColor: theme.border }]}>
            <Text style={[styles.readonlyText, { color: theme.textSecondary }]}>
              {user?.role === 'ADMIN' ? 'Quản trị viên' : 'Người học'}
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.saveBtn, saving && styles.disabledBtn]}
            onPress={handleSave}
            disabled={saving}
          >
            <Text style={styles.saveBtnText}>{saving ? 'Đang lưu...' : 'LƯU THAY ĐỔI'}</Text>
          </TouchableOpacity>
        </View>

        {/* Delete account */}
        <TouchableOpacity style={[styles.deleteBtn, { borderColor: '#ff4b4b' }]} onPress={handleDeleteAccount}>
          <Text style={styles.deleteBtnText}>XÓA TÀI KHOẢN</Text>
        </TouchableOpacity>
      </ScrollView>
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
  scroll: { paddingBottom: 100 },

  avatarSection: { alignItems: 'center', paddingTop: 28, paddingBottom: 8 },
  avatarCircle: {
    width: 90, height: 90, borderRadius: 45,
    backgroundColor: '#CE82FF',
    justifyContent: 'center', alignItems: 'center',
  },
  avatarEmoji: { fontSize: 46 },
  editBadge: {
    position: 'absolute', bottom: 0, right: 0,
    backgroundColor: '#fff', borderRadius: 12, padding: 4,
    elevation: 3,
  },
  editBadgeText: { fontSize: 14 },
  changeAvatarHint: { fontSize: 13, marginTop: 10 },

  avatarPicker: {
    marginHorizontal: 16, marginBottom: 12,
    borderRadius: 18, borderWidth: 1, padding: 14,
  },
  pickerGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' },
  pickerItem: {
    width: 46, height: 46, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center',
    backgroundColor: 'transparent',
  },
  pickerItemActive: { backgroundColor: '#CE82FF33', borderWidth: 2, borderColor: '#CE82FF' },
  pickerEmoji: { fontSize: 26 },

  formCard: {
    marginHorizontal: 16, marginTop: 8,
    borderRadius: 20, borderWidth: 1, padding: 20,
  },
  message: {
    padding: 12, borderRadius: 12, marginBottom: 14,
    fontSize: 14, fontWeight: '600', lineHeight: 18,
  },
  msgError: { color: '#b73535', backgroundColor: '#fff4f4' },
  msgSuccess: { color: '#2f7a12', backgroundColor: '#edffe5' },
  label: { fontSize: 13, fontWeight: '600', marginBottom: 6, marginTop: 12 },
  input: { borderWidth: 2, borderRadius: 14, padding: 14, fontSize: 15 },
  readonlyBox: { borderWidth: 2, borderRadius: 14, padding: 14 },
  readonlyText: { fontSize: 15 },
  saveBtn: {
    backgroundColor: '#CE82FF', borderRadius: 14,
    padding: 16, alignItems: 'center', marginTop: 20,
  },
  disabledBtn: { opacity: 0.6 },
  saveBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },

  deleteBtn: {
    marginHorizontal: 16, marginTop: 14,
    borderWidth: 2, borderRadius: 14,
    padding: 16, alignItems: 'center',
  },
  deleteBtnText: { color: '#ff4b4b', fontWeight: 'bold', fontSize: 14 },
});
