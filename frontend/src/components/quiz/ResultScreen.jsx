import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

/**
 * Màn hình kết quả sau khi hoàn thành quiz.
 * Props:
 *  - correctCount: number
 *  - totalQuestions: number
 *  - xpEarned: number
 *  - heartsLeft: number
 *  - onNextUnit: fn
 *  - onGoHome: fn
 */
export default function ResultScreen({ correctCount, totalQuestions, xpEarned, heartsLeft, onNextUnit, onGoHome }) {
  const accuracy = Math.round((correctCount / totalQuestions) * 100);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.emoji}>
          {accuracy >= 80 ? '🎉' : accuracy >= 50 ? '👍' : '💪'}
        </Text>
        <Text style={styles.title}>
          {accuracy >= 80 ? 'Xuất sắc!' : accuracy >= 50 ? 'Khá tốt!' : 'Cố gắng thêm!'}
        </Text>
        <Text style={styles.score}>{correctCount}/{totalQuestions} câu đúng</Text>

        <View style={styles.stats}>
          <View style={styles.statItem}>
            <Text style={styles.statEmoji}>⚡</Text>
            <Text style={styles.statValue}>+{xpEarned}</Text>
            <Text style={styles.statLabel}>XP</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statEmoji}>🎯</Text>
            <Text style={styles.statValue}>{accuracy}%</Text>
            <Text style={styles.statLabel}>Chính xác</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statEmoji}>❤️</Text>
            <Text style={styles.statValue}>{heartsLeft}</Text>
            <Text style={styles.statLabel}>Mạng còn</Text>
          </View>
        </View>

        <View style={{ gap: 12, width: '100%' }}>
          <TouchableOpacity style={styles.nextBtn} onPress={onNextUnit}>
            <Text style={styles.nextBtnText}>BÀI TIẾP →</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.homeBtn} onPress={onGoHome}>
            <Text style={styles.homeBtnText}>VỀ TRANG CHỦ</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: 30 },
  emoji: { fontSize: 80, marginBottom: 15 },
  title: { fontSize: 32, fontWeight: 'bold', color: '#3c3c3c', marginBottom: 8 },
  score: { fontSize: 18, color: '#afafaf', marginBottom: 30 },
  stats: { flexDirection: 'row', gap: 20, marginBottom: 40 },
  statItem: { alignItems: 'center', backgroundColor: '#f8f9fa', padding: 20, borderRadius: 20, minWidth: 90 },
  statEmoji: { fontSize: 24, marginBottom: 4 },
  statValue: { fontSize: 22, fontWeight: 'bold', color: '#3c3c3c' },
  statLabel: { fontSize: 12, color: '#afafaf', marginTop: 2 },
  nextBtn: { backgroundColor: '#58cc02', borderRadius: 16, padding: 18, alignItems: 'center' },
  nextBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold', letterSpacing: 1 },
  homeBtn: { backgroundColor: '#fff', borderRadius: 16, padding: 18, alignItems: 'center', borderWidth: 2, borderColor: '#e5e5e5' },
  homeBtnText: { color: '#afafaf', fontSize: 16, fontWeight: 'bold', letterSpacing: 1 },
});
