import React, { useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '@/context/AuthContext';
import { GameConfig } from '@/constants/theme';

export default function ProfileScreen() {
  const { user, refreshUser } = useAuth();

  // Tải lại profile mỗi khi quay lại tab này (sau khi hoàn thành quiz)
  useFocusEffect(
    useCallback(() => {
      refreshUser();
    }, [])
  );

  if (!user) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#CE82FF" />
      </SafeAreaView>
    );
  }

  const xpProgress = Math.min(((user.xp || 0) % GameConfig.XP_PER_LEVEL) / GameConfig.XP_PER_LEVEL * 100, 100);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Avatar & Name */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarEmoji}>{user.avatar || '🐣'}</Text>
          </View>
          <Text style={styles.userName}>{user.name}</Text>
          <View style={styles.levelBadge}>
            <Text style={styles.levelText}>Level {user.level || 1}</Text>
          </View>
        </View>

        {/* XP Progress */}
        <View style={styles.xpSection}>
          <Text style={styles.xpLabel}>XP Progress</Text>
          <View style={styles.xpBarBg}>
            <View style={[styles.xpBarFill, { width: `${xpProgress}%` }]} />
          </View>
          <Text style={styles.xpText}>{user.xp || 0} XP</Text>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { backgroundColor: '#fff4e6' }]}>
            <Text style={styles.statEmoji}>🔥</Text>
            <Text style={styles.statValue}>{user.streak || 0}</Text>
            <Text style={styles.statLabel}>Streak</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#e6f7ff' }]}>
            <Text style={styles.statEmoji}>💎</Text>
            <Text style={styles.statValue}>{user.gems || 0}</Text>
            <Text style={styles.statLabel}>Gems</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#ffe6e6' }]}>
            <Text style={styles.statEmoji}>❤️</Text>
            <Text style={styles.statValue}>{user.hearts || 0}</Text>
            <Text style={styles.statLabel}>Hearts</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#e6ffe6' }]}>
            <Text style={styles.statEmoji}>⚡</Text>
            <Text style={styles.statValue}>{user.xp || 0}</Text>
            <Text style={styles.statLabel}>Total XP</Text>
          </View>
        </View>

        {/* Account Info */}
        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>Thông tin tài khoản</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Email</Text>
            <Text style={styles.infoValue}>{user.email || '—'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Ngày tham gia</Text>
            <Text style={styles.infoValue}>Tháng 4, 2026</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  scrollContent: { paddingBottom: 100 },
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
