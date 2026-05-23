import { getLearningHistory, getCreatedHistory } from '@/services/api';
import { useTheme } from '@/context/ThemeContext';
import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator, FlatList, StyleSheet,
  Text, TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';

const TABS = ['Lịch sử làm', 'Lịch sử tạo'];

const DIFF_MAP = {
  EASY: 'Dễ', MEDIUM: 'Trung bình', HARD: 'Khó',
};
const DIFF_COLORS = {
  'Dễ': { bg: '#e6ffe6', text: '#2f7a12' },
  'Trung bình': { bg: '#fff4e0', text: '#a05c00' },
  'Khó': { bg: '#ffe6e6', text: '#b73535' },
};

const ScoreBadge = ({ score }) => {
  const color = score >= 80 ? '#58cc02' : score >= 60 ? '#ffc800' : '#ff4b4b';
  return (
    <View style={[styles.scoreBadge, { backgroundColor: color + '22', borderColor: color }]}>
      <Text style={[styles.scoreBadgeText, { color }]}>{score}%</Text>
    </View>
  );
};

const CategoryBadge = ({ label }) => (
  <View style={styles.catBadge}>
    <Text style={styles.catBadgeText}>{label || 'Chung'}</Text>
  </View>
);

const DiffBadge = ({ label }) => {
  const c = DIFF_COLORS[label] || { bg: '#e5e5e5', text: '#666' };
  return (
    <View style={[styles.diffBadge, { backgroundColor: c.bg }]}>
      <Text style={[styles.diffBadgeText, { color: c.text }]}>{label}</Text>
    </View>
  );
};

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
};

export default function HistoryScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [learningHistory, setLearningHistory] = useState([]);
  const [createdHistory, setCreatedHistory] = useState([]);

  const loadHistory = useCallback(async () => {
    setLoading(true);
    const [lr, cr] = await Promise.all([getLearningHistory(), getCreatedHistory()]);
    if (lr.data) setLearningHistory(lr.data.history || []);
    if (cr.data) setCreatedHistory(cr.data.history || []);
    setLoading(false);
  }, []);

  useFocusEffect(useCallback(() => { loadHistory(); }, [loadHistory]));

  const data = activeTab === 0 ? learningHistory : createdHistory;

  const renderLearning = ({ item }) => (
    <View style={[styles.historyCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <View style={styles.cardTop}>
        <Text style={[styles.cardTitle, { color: theme.text }]} numberOfLines={1}>{item.title}</Text>
        <ScoreBadge score={item.score} />
      </View>
      <View style={styles.cardBadges}>
        <CategoryBadge label={item.category} />
      </View>
      <Text style={[styles.cardDate, { color: theme.textSecondary }]}>
        📅 {formatDate(item.completedAt)} · {item.correctAnswers}/{item.totalExercises} câu đúng
      </Text>
    </View>
  );

  const renderCreated = ({ item }) => {
    const diff = DIFF_MAP[item.difficulty] || item.difficulty;
    return (
      <View style={[styles.historyCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <View style={styles.cardTop}>
          <Text style={[styles.cardTitle, { color: theme.text }]} numberOfLines={1}>{item.title}</Text>
          {item.isPremium && (
            <View style={[styles.scoreBadge, { backgroundColor: '#fff4e0', borderColor: '#ffc800' }]}>
              <Text style={[styles.scoreBadgeText, { color: '#a05c00' }]}>Premium</Text>
            </View>
          )}
        </View>
        <View style={styles.cardBadges}>
          {item.category ? <CategoryBadge label={item.category} /> : null}
          <DiffBadge label={diff} />
        </View>
        <Text style={[styles.cardDate, { color: theme.textSecondary }]}>
          📅 {formatDate(item.createdAt)} · {item.bookmarkCount} lượt lưu
        </Text>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#CE82FF" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={[styles.backText, { color: '#1cb0f6' }]}>‹ Quay lại</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Lịch sử</Text>
        <View style={styles.backBtn} />
      </View>

      <View style={[styles.tabWrap, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        <View style={[styles.tabPill, { backgroundColor: theme.card }]}>
          {TABS.map((t, i) => (
            <TouchableOpacity
              key={t}
              style={[styles.pillItem, activeTab === i && styles.pillItemActive]}
              onPress={() => setActiveTab(i)}
            >
              <Text style={[styles.pillText, { color: activeTab === i ? '#fff' : theme.textSecondary }]}>{t}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {data.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>📭</Text>
          <Text style={[styles.emptyTitle, { color: theme.text }]}>Chưa có lịch sử</Text>
          <Text style={[styles.emptyDesc, { color: theme.textSecondary }]}>
            {activeTab === 0 ? 'Hoàn thành bài học để xem lịch sử tại đây ✨' : 'Tạo đề thi để xem lịch sử tại đây ✨'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={data}
          renderItem={activeTab === 0 ? renderLearning : renderCreated}
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
  headerTitle: { fontSize: 17, fontWeight: 'bold' },
  tabWrap: { paddingVertical: 12, paddingHorizontal: 20, borderBottomWidth: 1 },
  tabPill: { flexDirection: 'row', borderRadius: 16, padding: 4, overflow: 'hidden' },
  pillItem: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 12 },
  pillItemActive: { backgroundColor: '#CE82FF' },
  pillText: { fontSize: 14, fontWeight: '600' },
  list: { padding: 16, gap: 12 },
  historyCard: { borderRadius: 22, borderWidth: 1, padding: 16, gap: 8 },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardTitle: { flex: 1, fontSize: 15, fontWeight: 'bold', marginRight: 8 },
  cardBadges: { flexDirection: 'row', gap: 8 },
  cardDate: { fontSize: 12 },
  scoreBadge: { borderWidth: 1.5, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 3 },
  scoreBadgeText: { fontSize: 13, fontWeight: 'bold' },
  catBadge: { backgroundColor: '#e8f4fd', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4 },
  catBadgeText: { color: '#1cb0f6', fontSize: 12, fontWeight: '600' },
  diffBadge: { borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4 },
  diffBadgeText: { fontSize: 12, fontWeight: '600' },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyEmoji: { fontSize: 64, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 8 },
  emptyDesc: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
});
