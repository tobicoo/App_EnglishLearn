import { useTheme } from '@/context/ThemeContext';
import { changeCurrentUserPassword } from '@/services/api';
import { useRoleBack } from '@/navigation/roleBack';
import { useState } from 'react';
import {
  StyleSheet, Text, TextInput,
  TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ChangePasswordScreen() {
  const { goBack } = useRoleBack('/(tabs)/settings');
  const { theme } = useTheme();

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleSave = async () => {
    setMessage({ type: '', text: '' });
    if (!oldPassword || !newPassword || !confirmPassword) {
      setMessage({ type: 'error', text: 'Vui lòng điền đầy đủ tất cả các trường.' });
      return;
    }
    if (newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Mật khẩu mới phải có ít nhất 6 ký tự.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'Xác nhận mật khẩu không khớp.' });
      return;
    }
    setLoading(true);
    const { error } = await changeCurrentUserPassword(oldPassword, newPassword);
    setLoading(false);
    if (error) {
      setMessage({ type: 'error', text: error });
      return;
    }
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setMessage({ type: 'success', text: 'Đổi mật khẩu thành công!' });
    setTimeout(() => goBack(), 900);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.border, backgroundColor: theme.surface }]}>
        <TouchableOpacity onPress={() => goBack()} style={styles.backBtn}>
          <Text style={[styles.backText, { color: '#1cb0f6' }]}>‹ Quay lại</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Đổi mật khẩu</Text>
        <View style={styles.backBtn} />
      </View>

      {/* Content */}
      <View style={styles.content}>
        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          {message.text ? (
            <Text style={[styles.message, message.type === 'error' ? styles.msgError : styles.msgSuccess]}>
              {message.text}
            </Text>
          ) : null}

          <View style={[styles.inputRow, { borderColor: theme.border, backgroundColor: theme.inputBg }]}>
            <Text style={styles.lockIcon}>🔒</Text>
            <TextInput
              style={[styles.input, { color: theme.text }]}
              placeholder="Mật khẩu cũ"
              placeholderTextColor={theme.textSecondary}
              secureTextEntry
              value={oldPassword}
              onChangeText={setOldPassword}
            />
          </View>

          <View style={[styles.inputRow, { borderColor: theme.border, backgroundColor: theme.inputBg }]}>
            <Text style={styles.lockIcon}>🔒</Text>
            <TextInput
              style={[styles.input, { color: theme.text }]}
              placeholder="Mật khẩu mới"
              placeholderTextColor={theme.textSecondary}
              secureTextEntry
              value={newPassword}
              onChangeText={setNewPassword}
            />
          </View>

          <View style={[styles.inputRow, { borderColor: theme.border, backgroundColor: theme.inputBg }]}>
            <Text style={styles.lockIcon}>🔒</Text>
            <TextInput
              style={[styles.input, { color: theme.text }]}
              placeholder="Xác nhận mật khẩu mới"
              placeholderTextColor={theme.textSecondary}
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />
          </View>

          <View style={styles.btnRow}>
            <TouchableOpacity
              style={[styles.cancelBtn, { backgroundColor: theme.card, borderColor: theme.border }]}
              onPress={() => goBack()}
            >
              <Text style={[styles.cancelText, { color: theme.textSecondary }]}>Hủy</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.saveBtn, loading && styles.disabledBtn]}
              onPress={handleSave}
              disabled={loading}
            >
              <Text style={styles.saveBtnText}>{loading ? 'Đang đổi...' : 'LƯU THAY ĐỔI'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
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
  content: { flex: 1, justifyContent: 'center', paddingHorizontal: 20 },
  card: {
    borderRadius: 22, borderWidth: 1, padding: 24,
  },
  message: {
    padding: 12, borderRadius: 12, marginBottom: 16,
    fontSize: 14, fontWeight: '600', lineHeight: 18,
  },
  msgError: { color: '#b73535', backgroundColor: '#fff4f4' },
  msgSuccess: { color: '#2f7a12', backgroundColor: '#edffe5' },
  inputRow: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 2, borderRadius: 14,
    marginBottom: 14, paddingHorizontal: 14,
  },
  lockIcon: { fontSize: 18, marginRight: 10 },
  input: { flex: 1, paddingVertical: 14, fontSize: 15 },
  btnRow: { flexDirection: 'row', gap: 12, marginTop: 8 },
  cancelBtn: {
    flex: 1, borderWidth: 1, borderRadius: 14,
    paddingVertical: 14, alignItems: 'center',
  },
  cancelText: { fontWeight: 'bold', fontSize: 14 },
  saveBtn: {
    flex: 2, backgroundColor: '#CE82FF',
    borderRadius: 14, paddingVertical: 14, alignItems: 'center',
  },
  disabledBtn: { opacity: 0.6 },
  saveBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
});

