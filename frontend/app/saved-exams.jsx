import { getSavedExams, removeExamBookmark } from '@/services/api';
import { useTheme } from '@/context/ThemeContext';
import { useRoleBack } from '@/navigation/roleBack';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator, FlatList, StyleSheet, Text, TextInput,
  TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';

const DIFF_MAP = { EASY: 'Dễ', MEDIUM: 'Trung bình', HARD: 'Khó' };
const DIFF_COLORS = {
  'Dễ': { bg: '#e6ffe6', text: '#2f7a12' },
  'Trung bình': { bg: '#fff4e0', text: '#a05c00' },
  'Khó': { bg: '#ffe6e6', text: '#b73535' },
};

export default function SavedExamsScreen() {
  const { goBack } = useRoleBack('/(tabs)/settings');
  const { theme } = useTheme();
  const [search, setSearch] = useState('');
  const [savedItems, setSavedItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await getSavedExams();
    if (data) setSavedItems(data.exams || []);
    setLoading(false);
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const filtered = savedItems.filter((item) =>
    item.title.toLowerCase().includes(search.toLowerCase()) ||
    (item.category || '').toLowerCase().includes(search.toLowerCase())
  );

  const handleUnsave = async (id) => {
    await removeExamBookmark(id);
    setSavedItems((prev) => prev.filter((item) => item.id !== id));
  };

  const diff = (d) => DIFF_MAP[d] || d;
  const diffColor = (d) => DIFF_COLORS[DIFF_MAP[d]] || { bg: '#e5e5e5', text: '#666' };

  const renderItem = ({ item }) => (
    <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <View style={styles.cardTitleWrap}>
        <Text style={[styles.cardTitle, { color: theme.text }]} numberOfLines={1}>{item.title}</Text>
        <TouchableOpacity onPress={() => handleUnsave(item.id)} style={styles.unsaveBtn}>
          <Text style={styles.unsaveIcon}>🔖</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.cardBadges}>
        {item.category ? (
          <View style={styles.catBadge}>
            <Text style={styles.catText}>{item.category}</Text>
          </View>
        ) : null}
        <View style={[styles.diffBadge, { backgroundColor: diffColor(item.difficulty).bg }]}>
          <Text style={[styles.diffText, { color: diffColor(item.difficulty).text }]}>{diff(item.difficulty)}</Text>
        </View>
        {item.isPremium && (
          <View style={[styles.diffBadge, { backgroundColor: '#fff4e0' }]}>
            <Text style={[styles.diffText, { color: '#a05c00' }]}>⭐ Premium</Text>
          </View>
        )}
      </View>
      <Text style={[styles.cardMeta, { color: theme.textSecondary }]}>
        {item.creatorName ? `👤 ${item.creatorName}` : ''}{item.bookmarkCount ? ` · 🔖 ${item.bookmarkCount}` : ''}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => goBack()} style={styles.backBtn}>
          <Text style={[styles.backText, { color: '#1cb0f6' }]}>‹ Quay lại</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Đề đã lưu</Text>
        <View style={styles.backBtn} />
      </View>

      <View style={[styles.searchWrap, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        <View style={[styles.searchBox, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={[styles.searchInput, { color: theme.text }]}
            placeholder="Tìm đề đã lưu..."
            placeholderTextColor={theme.textSecondary}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Text style={[styles.clearBtn, { color: theme.textSecondary }]}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {loading ? (
        <View style={styles.emptyState}>
          <ActivityIndicator color="#CE82FF" size="large" />
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>🌷</Text>
          <Text style={[styles.emptyTitle, { color: theme.text }]}>
            {search ? 'Không tìm thấy' : 'Chưa có đề nào'}
          </Text>
          <Text style={[styles.emptyDesc, { color: theme.textSecondary }]}>
            {search ? 'Thử tìm từ khóa khác nhé ✨' : 'Lưu đề yêu thích để ôn luyện sau! 💫'}
          </Text>
        </View>
      ) : (
        <>
          <View style={styles.countRow}>
            <Text style={[styles.countText, { color: theme.textSecondary }]}>✨ {filtered.length} đề đã lưu</Text>
          </View>
          <FlatList
            data={filtered}
            renderItem={renderItem}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={styles.list}
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
  searchWrap: { paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 },
  searchBox: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 18, borderWidth: 1.5, paddingHorizontal: 14, paddingVertical: 10, gap: 8,
  },
  searchIcon: { fontSize: 16 },
  searchInput: { flex: 1, fontSize: 15 },
  clearBtn: { fontSize: 16, paddingHorizontal: 4 },
  countRow: { paddingHorizontal: 20, paddingVertical: 10 },
  countText: { fontSize: 13, fontWeight: '600' },
  list: { padding: 16, gap: 12 },
  card: { borderRadius: 22, borderWidth: 1, padding: 16, gap: 10 },
  cardTitleWrap: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardTitle: { flex: 1, fontSize: 15, fontWeight: 'bold', marginRight: 8 },
  unsaveBtn: { padding: 4 },
  unsaveIcon: { fontSize: 20 },
  cardBadges: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  catBadge: { backgroundColor: '#e8f4fd', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4 },
  catText: { color: '#1cb0f6', fontSize: 12, fontWeight: '600' },
  diffBadge: { borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4 },
  diffText: { fontSize: 12, fontWeight: '600' },
  cardMeta: { fontSize: 12 },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyEmoji: { fontSize: 64, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 8 },
  emptyDesc: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
});

