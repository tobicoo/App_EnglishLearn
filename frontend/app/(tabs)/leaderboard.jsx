import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { getLeaderboard } from '@/services/api';
import { useAuth } from '@/context/AuthContext';

export default function LeaderboardScreen() {
  const { user } = useAuth();
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      loadLeaderboard();
    }, [])
  );

  const loadLeaderboard = async () => {
    const { data, error } = await getLeaderboard();
    if (error) {
      Alert.alert('Lỗi', error);
      setPlayers([]);
    } else {
      setPlayers(data);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#ffc800" />
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
        { backgroundColor: getMedalBg(index) },
        isCurrentUser && styles.currentUserRow,
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
          <Text style={[styles.playerName, isCurrentUser && styles.currentUserName]}>
            {item.name} {isCurrentUser ? '(Bạn)' : ''}
          </Text>
        </View>
        <View style={styles.xpContainer}>
          <Text style={styles.xpText}>{item.xp} XP</Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🏆 Bảng xếp hạng</Text>
        <Text style={styles.headerSub}>Xếp hạng tuần này</Text>
      </View>

      {players.length >= 3 && (
        <View style={styles.podium}>
          <View style={styles.podiumItem}>
            <Text style={styles.podiumAvatar}>{players[1].avatar}</Text>
            <Text style={styles.podiumName}>{players[1].name}</Text>
            <View style={[styles.podiumBar, styles.podiumSilver]}>
              <Text style={styles.podiumRank}>2</Text>
            </View>
            <Text style={styles.podiumXp}>{players[1].xp}</Text>
          </View>
          <View style={styles.podiumItem}>
            <Text style={styles.podiumCrown}>👑</Text>
            <Text style={styles.podiumAvatar}>{players[0].avatar}</Text>
            <Text style={styles.podiumName}>{players[0].name}</Text>
            <View style={[styles.podiumBar, styles.podiumGold]}>
              <Text style={styles.podiumRank}>1</Text>
            </View>
            <Text style={styles.podiumXp}>{players[0].xp}</Text>
          </View>
          <View style={styles.podiumItem}>
            <Text style={styles.podiumAvatar}>{players[2].avatar}</Text>
            <Text style={styles.podiumName}>{players[2].name}</Text>
            <View style={[styles.podiumBar, styles.podiumBronze]}>
              <Text style={styles.podiumRank}>3</Text>
            </View>
            <Text style={styles.podiumXp}>{players[2].xp}</Text>
          </View>
        </View>
      )}

      <FlatList
        data={players}
        renderItem={renderPlayer}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ paddingBottom: 100 }}
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
    paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: '#f5f5f5',
  },
  currentUserRow: { backgroundColor: '#e8f4fd', borderLeftWidth: 3, borderLeftColor: '#1cb0f6' },
  rankContainer: { width: 35 },
  rankText: { fontSize: 16, fontWeight: 'bold', color: '#afafaf' },
  medalText: { fontSize: 20 },
  avatarContainer: { width: 40 },
  avatar: { fontSize: 24 },
  nameContainer: { flex: 1 },
  playerName: { fontSize: 16, fontWeight: '600', color: '#3c3c3c' },
  currentUserName: { color: '#1cb0f6' },
  xpContainer: {},
  xpText: { fontSize: 14, fontWeight: 'bold', color: '#afafaf' },
});
