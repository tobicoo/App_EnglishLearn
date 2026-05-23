import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { useTheme } from '@/context/ThemeContext';
import { useRouter } from 'expo-router';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const MenuItem = ({ icon, label, onPress, theme, danger = false, badge }) => (
  <TouchableOpacity
    style={[styles.menuItem, { borderBottomColor: theme.border }]}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <View style={styles.menuLeft}>
      <Text style={styles.menuIcon}>{icon}</Text>
      <Text style={[styles.menuLabel, { color: danger ? '#ff4b4b' : theme.text }]}>{label}</Text>
    </View>
    <View style={styles.menuRight}>
      {badge ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badge}</Text>
        </View>
      ) : null}
      {!danger && <Text style={[styles.chevron, { color: theme.textSecondary }]}>›</Text>}
    </View>
  </TouchableOpacity>
);

export default function MenuScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { theme } = useTheme();
  const { t } = useLanguage();

  const handleLogout = () => {
    Alert.alert(
      t('logout_confirm_title'),
      t('logout_confirm_msg'),
      [
        { text: t('logout_cancel'), style: 'cancel' },
        {
          text: t('logout'),
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/');
          },
        },
      ]
    );
  };

  if (!user) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.emptyState}>
          <Text style={[styles.emptyText, { color: theme.textSecondary }]}>{t('no_session')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.scroll}>

        {/* Profile card */}
        <View style={[styles.profileCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarEmoji}>{user.avatar || '🐣'}</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={[styles.profileName, { color: theme.text }]}>{user.name}</Text>
            <Text style={[styles.profileEmail, { color: theme.textSecondary }]}>{user.email}</Text>
            <View style={styles.levelBadge}>
              <Text style={styles.levelText}>Level {user.level || 1}</Text>
            </View>
          </View>
        </View>

        {/* Stats row */}
        <View style={[styles.statsRow, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={styles.statItem}>
            <Text style={styles.statEmoji}>🔥</Text>
            <Text style={[styles.statValue, { color: theme.text }]}>{user.streak || 0}</Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Streak</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: theme.border }]} />
          <View style={styles.statItem}>
            <Text style={styles.statEmoji}>💎</Text>
            <Text style={[styles.statValue, { color: theme.text }]}>{user.gems || 0}</Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Gems</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: theme.border }]} />
          <View style={styles.statItem}>
            <Text style={styles.statEmoji}>⚡</Text>
            <Text style={[styles.statValue, { color: theme.text }]}>{user.totalXp || 0}</Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>XP</Text>
          </View>
        </View>

        {/* Account section */}
        <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>{t('section_account')}</Text>
        <View style={[styles.menuSection, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <MenuItem icon="👤" label={t('menu_profile_info')} theme={theme} onPress={() => router.push('/profile-info')} />
          <MenuItem icon="🔒" label={t('menu_change_password')} theme={theme} onPress={() => router.push('/change-password')} />
        </View>

        {/* Hoạt động section */}
        <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>{t('section_activity')}</Text>
        <View style={[styles.menuSection, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <MenuItem icon="📖" label={t('menu_history')} theme={theme} onPress={() => router.push('/history')} />
          <MenuItem icon="📝" label={t('menu_create_exam')} theme={theme} onPress={() => router.push('/create-exam')} />
          <MenuItem icon="🔖" label={t('menu_saved_exams')} theme={theme} onPress={() => router.push('/saved-exams')} />
        </View>

        {/* App section */}
        <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>{t('section_app')}</Text>
        <View style={[styles.menuSection, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <MenuItem icon="🌐" label={t('menu_language')} theme={theme} onPress={() => router.push('/language')} />
          <MenuItem icon="⚙️" label={t('menu_settings')} theme={theme} onPress={() => router.push('/app-settings')} />
          <MenuItem icon="❓" label={t('menu_support')} theme={theme} onPress={() => Alert.alert(t('support_title'), t('support_msg'))} />
        </View>

        {/* Admin section */}
        {user.role === 'ADMIN' && (
          <>
            <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>{t('section_admin')}</Text>
            <View style={[styles.menuSection, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <MenuItem icon="🛡️" label={t('menu_admin_panel')} theme={theme} onPress={() => router.push('/admin')} badge="Admin" />
            </View>
          </>
        )}

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>{t('logout')}</Text>
        </TouchableOpacity>

        <Text style={[styles.version, { color: theme.textSecondary }]}>MQT Learn v1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingBottom: 100 },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  emptyText: { fontSize: 16, textAlign: 'center' },

  profileCard: {
    flexDirection: 'row', alignItems: 'center',
    margin: 16, borderRadius: 20, padding: 18,
    borderWidth: 1,
  },
  avatarCircle: {
    width: 68, height: 68, borderRadius: 34,
    backgroundColor: '#CE82FF',
    justifyContent: 'center', alignItems: 'center',
    marginRight: 16,
  },
  avatarEmoji: { fontSize: 34 },
  profileInfo: { flex: 1 },
  profileName: { fontSize: 18, fontWeight: 'bold', marginBottom: 2 },
  profileEmail: { fontSize: 13, marginBottom: 8 },
  levelBadge: {
    backgroundColor: '#CE82FF', alignSelf: 'flex-start',
    paddingHorizontal: 12, paddingVertical: 3, borderRadius: 12,
  },
  levelText: { color: '#fff', fontWeight: 'bold', fontSize: 12 },

  statsRow: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: 16, marginBottom: 8,
    borderRadius: 18, borderWidth: 1, paddingVertical: 14,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statEmoji: { fontSize: 20, marginBottom: 4 },
  statValue: { fontSize: 18, fontWeight: 'bold' },
  statLabel: { fontSize: 11, marginTop: 2 },
  statDivider: { width: 1, height: 40 },

  sectionLabel: {
    fontSize: 11, fontWeight: '700', letterSpacing: 0.8,
    marginHorizontal: 20, marginTop: 18, marginBottom: 6,
  },
  menuSection: {
    marginHorizontal: 16, borderRadius: 18, borderWidth: 1,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 15, paddingHorizontal: 18, borderBottomWidth: 1,
  },
  menuLeft: { flexDirection: 'row', alignItems: 'center' },
  menuIcon: { fontSize: 20, width: 32 },
  menuLabel: { fontSize: 15, fontWeight: '500' },
  menuRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  chevron: { fontSize: 22, fontWeight: '300' },
  badge: {
    backgroundColor: '#CE82FF', paddingHorizontal: 10, paddingVertical: 3,
    borderRadius: 10,
  },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: 'bold' },

  logoutBtn: {
    marginHorizontal: 16, marginTop: 24,
    backgroundColor: '#ff4b4b', borderRadius: 16,
    paddingVertical: 16, alignItems: 'center',
  },
  logoutText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  version: { textAlign: 'center', fontSize: 12, marginTop: 20 },
});
