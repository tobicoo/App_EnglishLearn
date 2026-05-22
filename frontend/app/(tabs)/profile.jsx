import { GameConfig } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ProfileScreen() {
  const { user, refreshUser } = useAuth();
  const { theme } = useTheme();
  const [loadingProfile, setLoadingProfile] = useState(!user);
  const [profileError, setProfileError] = useState('');
  const refreshUserRef = useRef(refreshUser);

  useEffect(() => {
    refreshUserRef.current = refreshUser;
  }, [refreshUser]);

  const loadProfile = useCallback(async () => {
    setLoadingProfile(true);
    setProfileError('');
    try {
      await refreshUserRef.current();
    } catch (error) {
      setProfileError(error?.message || 'Không thể cập nhật hồ sơ.');
    } finally {
      setLoadingProfile(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadProfile();
    }, [loadProfile])
  );

  if (loadingProfile) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center', backgroundColor: theme.background }]}> 
        <ActivityIndicator size="large" color="#CE82FF" />
        <Text style={[styles.stateText, { color: theme.textSecondary }]}>Đang tải hồ sơ...</Text>
      </SafeAreaView>
    );
  }

  if (!user) {
    return (
      <SafeAreaView style={[styles.container, styles.centerState, { backgroundColor: theme.background }]}>
        <Text style={[styles.stateTitle, { color: theme.text }]}>Chưa có thông tin hồ sơ</Text>
        <Text style={[styles.stateText, { color: theme.textSecondary }]}>{profileError || 'Vui lòng đăng nhập lại để xem hồ sơ của bạn.'}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={loadProfile}>
          <Text style={styles.retryBtnText}>Thử lại</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const xpProgress = Math.min(((user.totalXp || 0) % GameConfig.XP_PER_LEVEL) / GameConfig.XP_PER_LEVEL * 100, 100);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Avatar & Name */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarEmoji}>{user.avatar || '🐣'}</Text>
          </View>
          <Text style={[styles.userName, { color: theme.text }]}>{user.name}</Text>
          <View style={styles.levelBadge}>
            <Text style={styles.levelText}>Level {user.level || 1}</Text>
          </View>
        </View>

        {/* XP Progress */}
        <View style={styles.xpSection}>
          <Text style={[styles.xpLabel, { color: theme.textSecondary }]}>XP Progress</Text>
          <View style={[styles.xpBarBg, { backgroundColor: theme.border }]}> 
            <View style={[styles.xpBarFill, { width: `${xpProgress}%` }]} />
          </View>
          <Text style={[styles.xpText, { color: theme.textSecondary }]}>{user.totalXp || 0} XP</Text>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { backgroundColor: theme.statCardBg1 }]}>
            <Text style={styles.statEmoji}>🔥</Text>
            <Text style={[styles.statValue, { color: theme.text }]}>{user.streak || 0}</Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Streak</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: theme.statCardBg2 }]}>
            <Text style={styles.statEmoji}>💎</Text>
            <Text style={[styles.statValue, { color: theme.text }]}>{user.gems || 0}</Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Gems</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: theme.statCardBg3 }]}>
            <Text style={styles.statEmoji}>❤️</Text>
            <Text style={[styles.statValue, { color: theme.text }]}>{user.hearts || 0}</Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Hearts</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: theme.statCardBg4 }]}>
            <Text style={styles.statEmoji}>⚡</Text>
            <Text style={[styles.statValue, { color: theme.text }]}>{user.totalXp || 0}</Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Total XP</Text>
          </View>
        </View>

        {/* Account Info */}
        <View style={[styles.infoSection, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[styles.infoTitle, { color: theme.text }]}>Thông tin tài khoản</Text>
          <View style={[styles.infoRow, { borderBottomColor: theme.border }]}> 
            <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>Email</Text>
            <Text style={[styles.infoValue, { color: theme.text }]}>{user.email || '—'}</Text>
          </View>
          <View style={[styles.infoRow, { borderBottomColor: theme.border }]}> 
            <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>Ngày tham gia</Text>
            <Text style={[styles.infoValue, { color: theme.text }]}>
              {user.createdAt
                ? new Date(user.createdAt).toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' })
                : '—'}
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  scrollContent: { paddingBottom: 100 },
  centerState: { justifyContent: 'center', alignItems: 'center', padding: 24 },
  stateTitle: { fontSize: 20, fontWeight: 'bold', textAlign: 'center', marginBottom: 8 },
  stateText: { fontSize: 14, textAlign: 'center', lineHeight: 20, marginTop: 10 },
  retryBtn: { marginTop: 16, backgroundColor: '#CE82FF', borderRadius: 14, paddingHorizontal: 18, paddingVertical: 12 },
  retryBtnText: { color: '#fff', fontWeight: 'bold' },
  avatarSection: { alignItems: 'center', paddingTop: 30, paddingBottom: 20 },
  avatarCircle: {
    width: 100, height: 100, borderRadius: 50, backgroundColor: '#CE82FF',
    justifyContent: 'center', alignItems: 'center', marginBottom: 12,
    elevation: 5, shadowColor: '#CE82FF', shadowOpacity: 0.3, shadowRadius: 10,
  },
  avatarEmoji: { fontSize: 50 },
  userName: { fontSize: 24, fontWeight: 'bold', color: '#3c3c3c' },
  levelBadge: { backgroundColor: '#CE82FF', paddingHorizontal: 16, paddingVertical: 5, borderRadius: 20, marginTop: 8 },
  levelText: { color: '#fff', fontWeight: 'bold', fontSize: 13 },
  xpSection: { marginHorizontal: 25, marginBottom: 25 },
  xpLabel: { color: '#afafaf', fontWeight: '600', marginBottom: 8 },
  xpBarBg: { height: 14, backgroundColor: '#e5e5e5', borderRadius: 10, overflow: 'hidden' },
  xpBarFill: { height: '100%', backgroundColor: '#ffc800', borderRadius: 10 },
  xpText: { textAlign: 'right', color: '#afafaf', fontSize: 13, marginTop: 4 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 20, gap: 12, justifyContent: 'space-between' },
  statCard: { width: '47%', padding: 20, borderRadius: 20, alignItems: 'center' },
  statEmoji: { fontSize: 28, marginBottom: 6 },
  statValue: { fontSize: 24, fontWeight: 'bold', color: '#3c3c3c' },
  statLabel: { fontSize: 13, color: '#afafaf', marginTop: 2 },
  infoSection: { margin: 20, backgroundColor: '#fff', borderRadius: 20, padding: 20, borderWidth: 1, borderColor: '#f0f0f0' },
  infoTitle: { fontSize: 18, fontWeight: 'bold', color: '#3c3c3c', marginBottom: 15 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f5f5f5' },
  infoLabel: { color: '#afafaf', fontSize: 15 },
  infoValue: { color: '#3c3c3c', fontSize: 15, fontWeight: '500' },
});
