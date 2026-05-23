import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '@/context/ThemeContext';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Alert, StyleSheet, Switch, Text,
  TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const ADMIN_PREFS_KEY = 'admin_system_prefs';

export default function SystemSettingsScreen() {
  const router = useRouter();
  const { isDark, toggleTheme, theme } = useTheme();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(ADMIN_PREFS_KEY).then((val) => {
      if (val) {
        try {
          const prefs = JSON.parse(val);
          if (typeof prefs.notifications === 'boolean') setNotificationsEnabled(prefs.notifications);
        } catch { /* ignore */ }
      }
    });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    await AsyncStorage.setItem(ADMIN_PREFS_KEY, JSON.stringify({ notifications: notificationsEnabled }));
    setSaving(false);
    Alert.alert('✅ Đã lưu', 'Cấu hình hệ thống đã được cập nhật.');
    router.back();
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={[styles.backText, { color: '#1cb0f6' }]}>‹ Quay lại</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Cài đặt hệ thống</Text>
        <View style={styles.backBtn} />
      </View>

      <View style={styles.content}>
        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={[styles.row, { borderBottomColor: theme.border }]}>
            <View style={styles.rowLeft}>
              <Text style={styles.rowIcon}>{isDark ? '🌙' : '☀️'}</Text>
              <Text style={[styles.rowLabel, { color: theme.text }]}>Chế độ tối</Text>
            </View>
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{ false: '#ccc', true: '#1cb0f6' }}
              thumbColor={isDark ? '#fff' : '#f4f3f4'}
            />
          </View>
          <View style={[styles.row, { borderBottomWidth: 0 }]}>
            <View style={styles.rowLeft}>
              <Text style={styles.rowIcon}>🔔</Text>
              <Text style={[styles.rowLabel, { color: theme.text }]}>Thông báo</Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: '#ccc', true: '#1cb0f6' }}
              thumbColor={notificationsEnabled ? '#fff' : '#f4f3f4'}
            />
          </View>
        </View>

        <TouchableOpacity
          style={[styles.saveBtn, saving && styles.disabledBtn]}
          onPress={handleSave}
          disabled={saving}
        >
          <Text style={styles.saveBtnText}>
            {saving ? 'Đang lưu...' : '💾 Lưu cấu hình'}
          </Text>
        </TouchableOpacity>
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
  content: { padding: 20 },
  card: { borderRadius: 20, borderWidth: 1, overflow: 'hidden', marginBottom: 24 },
  row: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 16, paddingHorizontal: 18, borderBottomWidth: 1,
  },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rowIcon: { fontSize: 22 },
  rowLabel: { fontSize: 15, fontWeight: '500' },
  saveBtn: {
    backgroundColor: '#1cb0f6', borderRadius: 18,
    paddingVertical: 16, alignItems: 'center',
  },
  disabledBtn: { opacity: 0.6 },
  saveBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});
