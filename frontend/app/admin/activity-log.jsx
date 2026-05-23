import { getAdminActivityLog } from '@/services/api';
import { useTheme } from '@/context/ThemeContext';
import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';

const formatTime = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
};

export default function ActivityLogScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await getAdminActivityLog({ limit: 50 });
    if (data) setLogs(data);
    setLoading(false);
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const renderItem = ({ item }) => (
    <View style={[styles.logCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <View style={[styles.iconBox, { backgroundColor: theme.card }]}>
        <Text style={styles.icon}>{item.icon}</Text>
      </View>
      <View style={styles.logContent}>
        <Text style={[styles.action, { color: theme.text }]}>{item.action}</Text>
        <Text style={[styles.detail, { color: theme.textSecondary }]}>{item.detail}</Text>
        <View style={styles.timeRow}>
          <Text style={styles.clockIcon}>🕐</Text>
          <Text style={[styles.time, { color: theme.textSecondary }]}>{formatTime(item.time)}</Text>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={[styles.backText, { color: '#1cb0f6' }]}>‹ Quay lại</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Nhật ký hoạt động</Text>
        <View style={styles.backBtn} />
      </View>

      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator color="#1cb0f6" size="large" />
        </View>
      ) : (
        <>
          <View style={[styles.countBar, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
            <Text style={[styles.countText, { color: theme.textSecondary }]}>📋 {logs.length} hoạt động gần đây</Text>
          </View>
          <FlatList
            data={logs}
            renderItem={renderItem}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={styles.list}
            ListEmptyComponent={
              <View style={styles.loadingBox}>
                <Text style={{ fontSize: 40, marginBottom: 12 }}>📋</Text>
                <Text style={[{ fontSize: 16, color: theme.textSecondary }]}>Chưa có hoạt động nào</Text>
              </View>
            }
          />
        </>
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
  countBar: { paddingHorizontal: 20, paddingVertical: 10, borderBottomWidth: 1 },
  countText: { fontSize: 13, fontWeight: '600' },
  list: { padding: 16, gap: 10 },
  loadingBox: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  logCard: {
    flexDirection: 'row', alignItems: 'flex-start',
    borderRadius: 18, borderWidth: 1, padding: 14,
    borderLeftWidth: 3, borderLeftColor: '#1cb0f6', gap: 12,
  },
  iconBox: { width: 42, height: 42, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  icon: { fontSize: 20 },
  logContent: { flex: 1 },
  action: { fontSize: 14, fontWeight: 'bold', marginBottom: 3 },
  detail: { fontSize: 12, marginBottom: 6 },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  clockIcon: { fontSize: 11 },
  time: { fontSize: 11 },
});
