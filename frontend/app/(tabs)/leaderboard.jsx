import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { getLeaderboard } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';

export default function LeaderboardScreen() {
  const { user } = useAuth();
  const { theme, isDark } = useTheme();
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useFocusEffect(
    useCallback(() => {
      loadLeaderboard();
    }, [])
  );

  const loadLeaderboard = async () => {
    setLoading(true);
    setErrorMessage('');
    const { data, error } = await getLeaderboard();
    if (error) {
      setErrorMessage(error);
      setPlayers([]);
    } else {
      setPlayers(data);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center', backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color="#ffc800" />
        <Text style={[styles.stateText, { color: theme.textSecondary }]}>Đang tải bảng xếp hạng...</Text>
      </SafeAreaView>
    );
  }

  const getMedalEmoji = (rank) => {
    if (rank === 0) return '🥇';
    if (rank === 1) return '🥈';
    if (rank === 2) return '🥉';
    return `${rank + 1}`;
  };

  const getMedalBg = (rank) => {
    if (isDark) {
      if (rank === 0) return '#3d3520';
      if (rank === 1) return '#2a2a2a';
      if (rank === 2) return '#3d2a1a';
      return theme.surface;
    }
    if (rank === 0) return '#fff9e6';
    if (rank === 1) return '#f5f5f5';
    if (rank === 2) return '#fff0e6';
    return '#fff';
  };

  const renderPlayer = ({ item, index }) => {
    const isCurrentUser = String(item.userId || item.id) === String(user?.id);

    return (
      <View style={[
        styles.playerRow,
        { backgroundColor: getMedalBg(index), borderBottomColor: theme.border },
        isCurrentUser && { borderLeftWidth: 3, borderLeftColor: '#1cb0f6', backgroundColor: isDark ? '#183247' : '#e8f4fd' },
      ]}>
        <View style={styles.rankContainer}>
          <Text style={[styles.rankText, index < 3 && styles.medalText]}>
            {getMedalEmoji(index)}
          </Text>
        </View>
        <View style={styles.avatarContainer}>
          <Text style={styles.avatar}>{item.avatar}</Text>
        </View>
        <View style={styles.nameContainer}>
          <Text style={[styles.playerName, { color: isCurrentUser ? '#1cb0f6' : theme.text }]}>
            {item.name} {isCurrentUser ? '(Bạn)' : ''}
          </Text>
        </View>
        <View style={styles.xpContainer}>
          <Text style={[styles.xpText, { color: theme.textSecondary }]}>{item.totalXp ?? item.xp ?? 0} XP</Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: theme.text }]}>🏆 Bảng xếp hạng</Text>
        <Text style={[styles.headerSub, { color: theme.textSecondary }]}>Xếp hạng tuần này</Text>
      </View>

      {errorMessage ? (
        <View style={[styles.stateCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[styles.stateTitle, { color: theme.text }]}>Chưa tải được xếp hạng</Text>
          <Text style={[styles.stateText, { color: theme.textSecondary }]}>{errorMessage}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={loadLeaderboard}>
            <Text style={styles.retryBtnText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      ) : players.length === 0 ? (
        <View style={[styles.stateCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[styles.stateTitle, { color: theme.text }]}>Chưa có người học nào</Text>
          <Text style={[styles.stateText, { color: theme.textSecondary }]}>Hoàn thành bài học để xuất hiện trên bảng xếp hạng.</Text>
        </View>
      ) : players.length >= 3 && (
        <View style={styles.podium}>
          <View style={styles.podiumItem}>
            <Text style={styles.podiumAvatar}>{players[1].avatar}</Text>
            <Text style={[styles.podiumName, { color: theme.text }]}>{players[1].name}</Text>
            <View style={[styles.podiumBar, styles.podiumSilver]}>
              <Text style={styles.podiumRank}>2</Text>
            </View>
            <Text style={styles.podiumXp}>{players[1].totalXp ?? players[1].xp ?? 0}</Text>
          </View>
          <View style={styles.podiumItem}>
            <Text style={styles.podiumCrown}>👑</Text>
            <Text style={styles.podiumAvatar}>{players[0].avatar}</Text>
            <Text style={[styles.podiumName, { color: theme.text }]}>{players[0].name}</Text>
            <View style={[styles.podiumBar, styles.podiumGold]}>
              <Text style={styles.podiumRank}>1</Text>
            </View>
            <Text style={styles.podiumXp}>{players[0].totalXp ?? players[0].xp ?? 0}</Text>
          </View>
          <View style={styles.podiumItem}>
            <Text style={styles.podiumAvatar}>{players[2].avatar}</Text>
            <Text style={[styles.podiumName, { color: theme.text }]}>{players[2].name}</Text>
            <View style={[styles.podiumBar, styles.podiumBronze]}>
              <Text style={styles.podiumRank}>3</Text>
            </View>
            <Text style={styles.podiumXp}>{players[2].totalXp ?? players[2].xp ?? 0}</Text>
          </View>
        </View>
      )}

      <FlatList
        data={players}
        renderItem={renderPlayer}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ paddingBottom: 100, paddingTop: players.length < 3 && players.length > 0 ? 8 : 0 }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { padding: 20, alignItems: 'center' },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#3c3c3c' },
  headerSub: { color: '#afafaf', marginTop: 4 },
  podium: { flexDirection: 'row', justifyContent: 'center', alignItems: 'flex-end', paddingHorizontal: 20, marginBottom: 20 },
  podiumItem: { alignItems: 'center', flex: 1 },
  podiumCrown: { fontSize: 20, marginBottom: 2 },
  podiumAvatar: { fontSize: 30, marginBottom: 4 },
  podiumName: { fontSize: 12, fontWeight: '600', color: '#3c3c3c', marginBottom: 4 },
  podiumBar: { width: 50, borderRadius: 10, justifyContent: 'center', alignItems: 'center', paddingVertical: 8 },
  podiumGold: { height: 60, backgroundColor: '#ffc800' },
  podiumSilver: { height: 45, backgroundColor: '#c0c0c0' },
  podiumBronze: { height: 35, backgroundColor: '#cd7f32' },
  podiumRank: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  podiumXp: { fontSize: 11, color: '#afafaf', marginTop: 4 },
  playerRow: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 14,
    paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: '#f5f5f535',
  },
  rankContainer: { width: 35 },
  rankText: { fontSize: 16, fontWeight: 'bold', color: '#afafaf' },
  medalText: { fontSize: 20 },
  avatarContainer: { width: 40 },
  avatar: { fontSize: 24 },
  nameContainer: { flex: 1 },
  playerName: { fontSize: 16, fontWeight: '600', color: '#3c3c3c' },
  xpContainer: {},
  xpText: { fontSize: 14, fontWeight: 'bold', color: '#afafaf' },
  stateCard: { margin: 20, padding: 20, borderRadius: 18, borderWidth: 1, alignItems: 'center' },
  stateTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 8, textAlign: 'center' },
  stateText: { fontSize: 14, textAlign: 'center', lineHeight: 20, marginTop: 10 },
  retryBtn: { marginTop: 16, backgroundColor: '#ffc800', borderRadius: 14, paddingHorizontal: 18, paddingVertical: 12 },
  retryBtnText: { color: '#3c3c3c', fontWeight: 'bold' },
});
