import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { getAdminContent, getAdminStats, getAdminUsers } from '@/services/api';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator, Alert, FlatList, ScrollView,
  StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// ─── Mini bar chart ────────────────────────────────────────────────
const MONTHS = ['T1','T2','T3','T4','T5','T6','T7','T8','T9','T10','T11','T12'];

function BarChart({ data = Array(12).fill(0), color = '#1cb0f6' }) {
  const max = Math.max(...data, 1);
  return (
    <View style={chart.wrap}>
      {data.map((val, i) => (
        <View key={i} style={chart.col}>
          <View style={[chart.bar, { height: (val / max) * 80, backgroundColor: color }]} />
          <Text style={chart.label}>{MONTHS[i]}</Text>
        </View>
      ))}
    </View>
  );
}
const chart = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'flex-end', gap: 3, height: 100 },
  col: { flex: 1, alignItems: 'center' },
  bar: { width: '100%', borderRadius: 4 },
  label: { fontSize: 8, color: '#afafaf', marginTop: 3 },
});

// ─── Pie-style percentage bars ─────────────────────────────────────
function PercentBars({ data = [] }) {
  return (
    <View>
      {data.map((item) => (
        <View key={item.label} style={pie.row}>
          <View style={[pie.dot, { backgroundColor: item.color }]} />
          <Text style={pie.label}>{item.label}</Text>
          <View style={pie.barBg}>
            <View style={[pie.barFill, { width: `${item.pct}%`, backgroundColor: item.color }]} />
          </View>
          <Text style={pie.pct}>{item.pct}%</Text>
        </View>
      ))}
    </View>
  );
}
const pie = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 8 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  label: { width: 70, fontSize: 13, color: '#3c3c3c' },
  barBg: { flex: 1, height: 10, backgroundColor: '#e5e5e5', borderRadius: 5, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 5 },
  pct: { width: 35, fontSize: 12, color: '#afafaf', textAlign: 'right' },
});

// ─── Stat Card ──────────────────────────────────────────────────────
function StatCard({ icon, value, label, bg }) {
  return (
    <View style={[sc.card, { backgroundColor: bg }]}>
      <Text style={sc.icon}>{icon}</Text>
      <Text style={sc.value}>{value}</Text>
      <Text style={sc.label}>{label}</Text>
    </View>
  );
}
const sc = StyleSheet.create({
  card: { width: '47%', borderRadius: 20, padding: 16, alignItems: 'flex-start', marginBottom: 12 },
  icon: { fontSize: 24, marginBottom: 8 },
  value: { fontSize: 28, fontWeight: 'bold', color: '#3c3c3c' },
  label: { fontSize: 12, color: '#666', marginTop: 4 },
});

// ─── Tab screens ───────────────────────────────────────────────────
function HomeTab({ stats, adminStats, loading, theme }) {
  if (loading) return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator color="#1cb0f6" /></View>;
  const avgScore = Number(adminStats?.avgScore ?? 0);
  const monthlyAttempts = adminStats?.monthlyAttempts ?? Array(12).fill(0);
  return (
    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
        <StatCard icon="👥" value={adminStats?.totalUsers ?? stats.totalUsers} label="Tổng số tài khoản" bg="#e8f4fd" />
        <StatCard icon="🆕" value={adminStats?.newUsersThisMonth ?? stats.newUsers} label="Tài khoản mới tháng này" bg="#e6ffe6" />
        <StatCard icon="📚" value={stats.totalUnits} label="Tổng số bài tập" bg="#fff4e0" />
        <StatCard icon="📅" value={stats.publishedSections} label="Section đã xuất bản" bg="#f5eeff" />
      </View>
      <View style={[tab.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <View style={tab.scoreRow}>
          <Text style={tab.scoreIcon}>📊</Text>
          <View>
            <Text style={[tab.scoreValue, { color: '#1cb0f6' }]}>{avgScore.toFixed(1)}</Text>
            <Text style={[tab.scoreLabel, { color: theme.textSecondary }]}>Điểm số trung bình</Text>
          </View>
        </View>
      </View>
      <View style={[tab.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <Text style={[tab.cardTitle, { color: theme.text }]}>📈 Tần Suất Làm Bài Trong Năm</Text>
        <BarChart data={monthlyAttempts} color="#1cb0f6" />
      </View>
    </ScrollView>
  );
}

function AccountsTab({ users, loading, theme }) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  const filtered = users.filter((u) => {
    const matchSearch = u.name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase());
    if (filter === 'admin') return matchSearch && u.role === 'ADMIN';
    if (filter === 'user') return matchSearch && u.role !== 'ADMIN';
    return matchSearch;
  });

  if (loading) return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator color="#1cb0f6" /></View>;

  return (
    <View style={{ flex: 1 }}>
      <View style={[tab.searchRow, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <View style={[tab.searchBox, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={{ fontSize: 16 }}>🔍</Text>
          <TextInput
            style={[{ flex: 1, fontSize: 14 }, { color: theme.text }]}
            placeholder="Tìm người dùng..."
            placeholderTextColor={theme.textSecondary}
            value={search}
            onChangeText={setSearch}
          />
        </View>
        <View style={tab.filterRow}>
          {[['all', 'Tất cả'], ['user', 'User'], ['admin', 'Admin']].map(([key, label]) => (
            <TouchableOpacity
              key={key}
              style={[tab.filterBtn, filter === key && tab.filterBtnActive]}
              onPress={() => setFilter(key)}
            >
              <Text style={[tab.filterBtnText, filter === key && { color: '#fff' }]}>{label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      <FlatList
        data={filtered}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ padding: 16, gap: 10 }}
        ListEmptyComponent={
          <View style={{ alignItems: 'center', padding: 40 }}>
            <Text style={{ fontSize: 40 }}>👤</Text>
            <Text style={[{ fontSize: 15, fontWeight: 'bold', marginTop: 12 }, { color: theme.text }]}>Không có người dùng</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={[tab.userCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={tab.userAvatar}>
              <Text style={{ fontSize: 22 }}>{item.avatar || '🐣'}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={[tab.userName, { color: theme.text }]}>{item.name}</Text>
                {item.role === 'ADMIN' && <View style={tab.adminBadge}><Text style={tab.adminBadgeText}>Admin</Text></View>}
              </View>
              <Text style={[tab.userEmail, { color: theme.textSecondary }]}>{item.email}</Text>
              <Text style={[tab.userStats, { color: theme.textSecondary }]}>⚡ {item.totalXp ?? 0} XP · 🔥 {item.streak ?? 0}</Text>
            </View>
          </View>
        )}
      />
    </View>
  );
}

function LessonsTab({ sections, loading, theme }) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  const allUnits = sections.flatMap((s) =>
    (s.units || []).map((u) => ({ ...u, sectionTitle: s.title, isPublished: u.isPublished ?? true }))
  );
  const filtered = allUnits.filter((u) => {
    const matchSearch = u.title?.toLowerCase().includes(search.toLowerCase()) ||
      u.sectionTitle?.toLowerCase().includes(search.toLowerCase());
    if (filter === 'visible') return matchSearch && u.isPublished;
    if (filter === 'hidden') return matchSearch && !u.isPublished;
    return matchSearch;
  });

  if (loading) return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator color="#1cb0f6" /></View>;

  return (
    <View style={{ flex: 1 }}>
      <View style={[tab.searchRow, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <View style={[tab.searchBox, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={{ fontSize: 16 }}>🔍</Text>
          <TextInput
            style={[{ flex: 1, fontSize: 14 }, { color: theme.text }]}
            placeholder="Tìm bài học..."
            placeholderTextColor={theme.textSecondary}
            value={search}
            onChangeText={setSearch}
          />
        </View>
        <View style={tab.filterRow}>
          {[['all', 'Tất cả'], ['visible', 'Hiện'], ['hidden', 'Ẩn']].map(([key, label]) => (
            <TouchableOpacity
              key={key}
              style={[tab.filterBtn, filter === key && tab.filterBtnActive]}
              onPress={() => setFilter(key)}
            >
              <Text style={[tab.filterBtnText, filter === key && { color: '#fff' }]}>{label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      <FlatList
        data={filtered}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ padding: 16, gap: 10 }}
        ListEmptyComponent={
          <View style={{ alignItems: 'center', padding: 40 }}>
            <Text style={{ fontSize: 40 }}>📚</Text>
            <Text style={[{ fontSize: 15, fontWeight: 'bold', marginTop: 12 }, { color: theme.text }]}>Không có bài học</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={[tab.lessonCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={{ flex: 1 }}>
              <Text style={[tab.lessonTitle, { color: item.isPublished ? theme.text : theme.textSecondary }]}>{item.title || '(Untitled)'}</Text>
              <Text style={[tab.lessonSection, { color: theme.textSecondary }]}>{item.sectionTitle}</Text>
              <Text style={[tab.lessonMeta, { color: theme.textSecondary }]}>{item.exercises?.length ?? 0} câu hỏi</Text>
            </View>
            <View style={[tab.publishBadge, { backgroundColor: item.isPublished ? '#e6ffe6' : '#f5f5f5' }]}>
              <Text style={[tab.publishText, { color: item.isPublished ? '#2f7a12' : '#afafaf' }]}>
                {item.isPublished ? 'Hiện' : 'Ẩn'}
              </Text>
            </View>
          </View>
        )}
      />
    </View>
  );
}

function RevenueTab({ theme, adminStats }) {
  const revenueThisMonth = Number(adminStats?.revenueThisMonth ?? 0);
  const totalRevenue = Number(adminStats?.totalRevenue ?? 0);
  const revenueByType = adminStats?.revenueByType ?? [];
  const monthlyAttempts = adminStats?.monthlyAttempts ?? Array(12).fill(0);
  const activeSubscriptions = adminStats?.activeSubscriptions ?? 0;
  return (
    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 14 }}>
        <View style={[sc.card, { backgroundColor: '#e8f4fd', width: '47%' }]}>
          <Text style={sc.icon}>💳</Text>
          <Text style={sc.value}>{activeSubscriptions}</Text>
          <Text style={sc.label}>Gói đang hoạt động</Text>
        </View>
        <View style={[sc.card, { backgroundColor: '#e6ffe6', width: '47%' }]}>
          <Text style={sc.icon}>📅</Text>
          <Text style={sc.value}>${revenueThisMonth.toFixed(2)}</Text>
          <Text style={sc.label}>Doanh thu tháng này</Text>
        </View>
      </View>
      <View style={[tab.revenueCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <Text style={[tab.revenueLabel, { color: theme.textSecondary }]}>Tổng doanh thu</Text>
        <Text style={tab.revenueValue}>${totalRevenue.toFixed(2)}</Text>
        <Text style={[tab.revenueSub, { color: theme.textSecondary }]}>Tất cả thời gian</Text>
      </View>
      <View style={[tab.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <Text style={[tab.cardTitle, { color: theme.text }]}>📊 Phân bổ gói đăng ký</Text>
        <PercentBars data={revenueByType} />
      </View>
      <View style={[tab.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <Text style={[tab.cardTitle, { color: theme.text }]}>📈 Tần suất làm bài theo tháng</Text>
        <BarChart data={monthlyAttempts} color="#CE82FF" />
      </View>
    </ScrollView>
  );
}

function AccountTab({ user, theme, onLogout, router }) {
  const menuItems = [
    { icon: '📦', label: 'Quản lý nội dung hệ thống', onPress: () => router.push('/admin/content-manager') },
    { icon: '⚙️', label: 'Cài đặt hệ thống', onPress: () => router.push('/admin/system-settings') },
    { icon: '📋', label: 'Xem nhật ký hoạt động', onPress: () => router.push('/admin/activity-log') },
  ];
  return (
    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
      <View style={[tab.profileCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <View style={tab.profileAvatar}>
          <Text style={{ fontSize: 36 }}>{user?.avatar || '🛡️'}</Text>
        </View>
        <Text style={[tab.profileName, { color: theme.text }]}>{user?.name}</Text>
        <Text style={[tab.profileEmail, { color: theme.textSecondary }]}>{user?.email}</Text>
        <View style={tab.profileRoleBadge}><Text style={tab.profileRoleText}>Quản trị viên</Text></View>
      </View>

      <View style={[tab.menuSection, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        {menuItems.map((item, idx) => (
          <TouchableOpacity
            key={item.label}
            style={[tab.menuItem, { borderBottomColor: theme.border, borderBottomWidth: idx < menuItems.length - 1 ? 1 : 0 }]}
            onPress={item.onPress}
            activeOpacity={0.7}
          >
            <Text style={tab.menuItemIcon}>{item.icon}</Text>
            <Text style={[tab.menuItemLabel, { color: theme.text }]}>{item.label}</Text>
            <Text style={[{ fontSize: 20, color: theme.textSecondary }]}>›</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={tab.logoutBtn} onPress={onLogout}>
        <Text style={tab.logoutText}>Đăng xuất</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

// ─── Main component ────────────────────────────────────────────────
const TABS = [
  { key: 'home', icon: '🏠', label: 'Home' },
  { key: 'accounts', icon: '👥', label: 'Accounts' },
  { key: 'lessons', icon: '📚', label: 'Lessons' },
  { key: 'revenue', icon: '📊', label: 'Revenue' },
  { key: 'account', icon: '👤', label: 'Account' },
];

export default function AdminDashboard() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState('home');
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [sections, setSections] = useState([]);
  const [adminStats, setAdminStats] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    const [usersResult, contentResult, statsResult] = await Promise.all([
      getAdminUsers(), getAdminContent(), getAdminStats(),
    ]);
    setUsers(usersResult.data || []);
    setSections(contentResult.data || []);
    setAdminStats(statsResult.data || null);
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const stats = {
    totalUsers: users.length,
    newUsers: Math.floor(users.length * 0.12) || 0,
    totalUnits: sections.reduce((sum, s) => sum + (s.units?.length || 0), 0),
    publishedSections: sections.filter((s) => s.isPublished !== false).length,
  };

  const handleLogout = () => {
    Alert.alert('Đăng xuất', 'Thoát khỏi trang quản trị?', [
      { text: 'Hủy', style: 'cancel' },
      { text: 'Đăng xuất', style: 'destructive', onPress: async () => { await logout(); router.replace('/'); } },
    ]);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Top bar */}
      <View style={[styles.topBar, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => router.replace('/(tabs)/settings')} style={styles.backBtn}>
          <Text style={[styles.backText, { color: '#1cb0f6' }]}>‹ Thoát</Text>
        </TouchableOpacity>
        <View style={styles.topCenter}>
          <Text style={[styles.topTitle, { color: theme.text }]}>🛡️ Admin</Text>
        </View>
        <TouchableOpacity onPress={loadData} style={styles.backBtn}>
          <Text style={{ color: '#1cb0f6', fontSize: 13, fontWeight: '600' }}>↻ Tải</Text>
        </TouchableOpacity>
      </View>

      {/* Tab content */}
      <View style={{ flex: 1 }}>
        {activeTab === 'home' && <HomeTab stats={stats} adminStats={adminStats} loading={loading} theme={theme} />}
        {activeTab === 'accounts' && <AccountsTab users={users} loading={loading} theme={theme} />}
        {activeTab === 'lessons' && <LessonsTab sections={sections} loading={loading} theme={theme} />}
        {activeTab === 'revenue' && <RevenueTab theme={theme} adminStats={adminStats} />}
        {activeTab === 'account' && <AccountTab user={user} theme={theme} onLogout={handleLogout} router={router} />}
      </View>

      {/* Bottom tab bar */}
      <View style={[styles.tabBar, { backgroundColor: theme.surface, borderTopColor: theme.border }]}>
        {TABS.map((t) => (
          <TouchableOpacity
            key={t.key}
            style={styles.tabItem}
            onPress={() => setActiveTab(t.key)}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabIcon, activeTab === t.key && styles.tabIconActive]}>{t.icon}</Text>
            <Text style={[styles.tabLabel, { color: activeTab === t.key ? '#1cb0f6' : theme.textSecondary }]}>{t.label}</Text>
            {activeTab === t.key && <View style={styles.tabDot} />}
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
}

const tab = StyleSheet.create({
  card: { borderRadius: 20, borderWidth: 1, padding: 16, marginBottom: 14 },
  cardTitle: { fontSize: 15, fontWeight: 'bold', marginBottom: 14 },
  scoreRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  scoreIcon: { fontSize: 36 },
  scoreValue: { fontSize: 32, fontWeight: 'bold' },
  scoreLabel: { fontSize: 13 },
  searchRow: { padding: 12, borderBottomWidth: 1, gap: 8 },
  searchBox: { flexDirection: 'row', alignItems: 'center', borderRadius: 16, borderWidth: 1.5, paddingHorizontal: 12, paddingVertical: 9, gap: 8 },
  filterRow: { flexDirection: 'row', gap: 8 },
  filterBtn: { flex: 1, paddingVertical: 7, borderRadius: 12, borderWidth: 1.5, borderColor: '#e5e5e5', alignItems: 'center' },
  filterBtnActive: { backgroundColor: '#1cb0f6', borderColor: '#1cb0f6' },
  filterBtnText: { fontSize: 12, fontWeight: '600', color: '#afafaf' },
  userCard: { flexDirection: 'row', alignItems: 'center', borderRadius: 18, borderWidth: 1, padding: 14, gap: 12 },
  userAvatar: { width: 46, height: 46, borderRadius: 23, backgroundColor: '#e8f4fd', justifyContent: 'center', alignItems: 'center' },
  userName: { fontSize: 15, fontWeight: 'bold' },
  userEmail: { fontSize: 12, marginTop: 2 },
  userStats: { fontSize: 11, marginTop: 4 },
  adminBadge: { backgroundColor: '#CE82FF', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2 },
  adminBadgeText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  lessonCard: { flexDirection: 'row', alignItems: 'center', borderRadius: 18, borderWidth: 1, padding: 14, gap: 10 },
  lessonTitle: { fontSize: 14, fontWeight: 'bold' },
  lessonSection: { fontSize: 11, marginTop: 2 },
  lessonMeta: { fontSize: 11, marginTop: 4 },
  publishBadge: { borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4 },
  publishText: { fontSize: 12, fontWeight: '600' },
  periodRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  periodBtn: { flex: 1, paddingVertical: 10, borderRadius: 14, borderWidth: 1.5, borderColor: '#e5e5e5', alignItems: 'center' },
  periodBtnActive: { backgroundColor: '#1cb0f6', borderColor: '#1cb0f6' },
  periodText: { fontSize: 12, fontWeight: '600', color: '#afafaf' },
  revenueCard: { borderRadius: 20, borderWidth: 1, padding: 20, marginBottom: 14, alignItems: 'center' },
  revenueLabel: { fontSize: 14 },
  revenueValue: { fontSize: 36, fontWeight: 'bold', color: '#1cb0f6', marginVertical: 6 },
  revenueSub: { fontSize: 12 },
  profileCard: { borderRadius: 22, borderWidth: 1, padding: 20, alignItems: 'center', marginBottom: 16 },
  profileAvatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#e8f4fd', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  profileName: { fontSize: 20, fontWeight: 'bold', marginBottom: 4 },
  profileEmail: { fontSize: 13, marginBottom: 10 },
  profileRoleBadge: { backgroundColor: '#1cb0f6', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 4 },
  profileRoleText: { color: '#fff', fontWeight: 'bold', fontSize: 12 },
  menuSection: { borderRadius: 20, borderWidth: 1, overflow: 'hidden', marginBottom: 16 },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 },
  menuItemIcon: { fontSize: 20, width: 30 },
  menuItemLabel: { flex: 1, fontSize: 15, fontWeight: '500' },
  logoutBtn: { backgroundColor: '#ff4b4b', borderRadius: 16, paddingVertical: 16, alignItems: 'center' },
  logoutText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1,
  },
  backBtn: { width: 60 },
  backText: { fontSize: 15, fontWeight: '600' },
  topCenter: { alignItems: 'center' },
  topTitle: { fontSize: 17, fontWeight: 'bold' },
  tabBar: {
    flexDirection: 'row', borderTopWidth: 1,
    paddingBottom: 4, paddingTop: 6,
  },
  tabItem: { flex: 1, alignItems: 'center', paddingVertical: 4 },
  tabIcon: { fontSize: 20, opacity: 0.5 },
  tabIconActive: { opacity: 1 },
  tabLabel: { fontSize: 10, marginTop: 2, fontWeight: '600' },
  tabDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#1cb0f6', marginTop: 2 },
});
