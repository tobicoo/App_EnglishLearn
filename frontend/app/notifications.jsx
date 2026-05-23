import { getNotifications, markNotificationRead, markAllNotificationsRead } from '@/services/api';
import { useTheme } from '@/context/ThemeContext';
import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator, FlatList, StyleSheet, Text,
  TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';

const TABS = ['Tất cả', 'system', 'exam'];
const TAB_LABELS = { 'Tất cả': 'Tất cả', system: 'Hệ thống', exam: 'Đề' };

const formatTime = (dateStr) => {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Vừa xong';
  if (mins < 60) return `${mins} phút trước`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} giờ trước`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Hôm qua';
  return `${days} ngày trước`;
};

export default function NotificationsScreen() {
  const router = useRouter();
  const { theme, isDark } = useTheme();
  const [activeTab, setActiveTab] = useState('Tất cả');
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await getNotifications();
    if (res.data) {
      setNotifications(res.data.notifications || []);
      setUnreadCount(res.data.unreadCount || 0);
    }
    setLoading(false);
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const filtered = activeTab === 'Tất cả'
    ? notifications
    : notifications.filter((n) => n.type === activeTab);

  const handlePress = async (item) => {
    if (item.isRead) return;
    await markNotificationRead(item.id);
    setNotifications((prev) => prev.map((n) => n.id === item.id ? { ...n, isRead: true } : n));
    setUnreadCount((c) => Math.max(0, c - 1));
  };

  const handleMarkAll = async () => {
    await markAllNotificationsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => handlePress(item)}
      style={[
        styles.notifCard,
        { backgroundColor: item.isRead ? theme.surface : (isDark ? '#2a1f3d' : '#f5eeff'), borderColor: theme.border },
        !item.isRead && { borderLeftColor: '#CE82FF', borderLeftWidth: 3 },
      ]}
    >
      <View style={[styles.iconBox, { backgroundColor: isDark ? '#3d2a5a' : '#ede0ff' }]}>
        <Text style={styles.iconText}>{item.icon}</Text>
      </View>
      <View style={styles.notifContent}>
        <View style={styles.notifTop}>
          <Text style={[styles.notifTitle, { color: theme.text }]} numberOfLines={1}>{item.title}</Text>
          {!item.isRead && <View style={styles.redDot} />}
        </View>
        <Text style={[styles.notifDesc, { color: theme.textSecondary }]} numberOfLines={2}>{item.body}</Text>
        <Text style={[styles.notifTime, { color: theme.textSecondary }]}>{formatTime(item.createdAt)}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={[styles.backText, { color: '#1cb0f6' }]}>‹ Quay lại</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Thông báo</Text>
          {unreadCount > 0 && (
            <View style={styles.headerBadge}>
              <Text style={styles.headerBadgeText}>{unreadCount}</Text>
            </View>
          )}
        </View>
        {unreadCount > 0 ? (
          <TouchableOpacity onPress={handleMarkAll} style={styles.backBtn}>
            <Text style={[styles.readAllText, { color: '#CE82FF' }]}>Đọc hết</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.backBtn} />
        )}
      </View>

      <View style={[styles.tabBar, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, { color: activeTab === tab ? '#CE82FF' : theme.textSecondary }]}>
              {TAB_LABELS[tab]}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.emptyState}>
          <ActivityIndicator color="#CE82FF" size="large" />
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>🌸</Text>
          <Text style={[styles.emptyTitle, { color: theme.text }]}>Không có thông báo</Text>
          <Text style={[styles.emptyDesc, { color: theme.textSecondary }]}>Bạn đã xem hết rồi, siêu sạch! ✨</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          renderItem={renderItem}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
        />
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
  readAllText: { fontSize: 13, fontWeight: '600', textAlign: 'right' },
  headerCenter: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  headerTitle: { fontSize: 17, fontWeight: 'bold' },
  headerBadge: { backgroundColor: '#ff4b4b', borderRadius: 10, paddingHorizontal: 7, paddingVertical: 2 },
  headerBadgeText: { color: '#fff', fontSize: 11, fontWeight: 'bold' },
  tabBar: { flexDirection: 'row', borderBottomWidth: 1, paddingHorizontal: 8 },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabActive: { borderBottomColor: '#CE82FF' },
  tabText: { fontSize: 14, fontWeight: '600' },
  list: { padding: 16, gap: 10 },
  notifCard: {
    flexDirection: 'row', alignItems: 'flex-start',
    borderRadius: 20, borderWidth: 1, padding: 14, gap: 12,
  },
  iconBox: { width: 46, height: 46, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  iconText: { fontSize: 22 },
  notifContent: { flex: 1 },
  notifTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  notifTitle: { flex: 1, fontSize: 14, fontWeight: 'bold' },
  redDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#ff4b4b', marginLeft: 6 },
  notifDesc: { fontSize: 13, lineHeight: 18, marginBottom: 6 },
  notifTime: { fontSize: 11 },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyEmoji: { fontSize: 64, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 8 },
  emptyDesc: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
});
