import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ResultScreen({
  correctCount,
  totalQuestions,
  xpEarned,
  heartsLeft,
  completionState,
  accuracy,
  onNextUnit,
  onGoHome,
}) {
  const safeAccuracy = typeof accuracy === 'number'
    ? accuracy
    : Math.round(((correctCount || 0) / Math.max(totalQuestions || 1, 1)) * 100);
  const completionLabel = completionState === 'COMPLETED' || completionState === 'completed'
    ? 'Đã hoàn thành'
    : 'Chưa hoàn thành';

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.emoji}>
          {safeAccuracy >= 80 ? '🎉' : safeAccuracy >= 50 ? '👍' : '💪'}
        </Text>
        <Text style={styles.title}>
          {safeAccuracy >= 80 ? 'Xuất sắc!' : safeAccuracy >= 50 ? 'Khá tốt!' : 'Cố gắng thêm!'}
        </Text>
        <Text style={styles.score}>{correctCount}/{totalQuestions} câu đúng • {xpEarned} XP nhận được</Text>
        <Text style={styles.completionState}>{completionLabel}</Text>

        <View style={styles.stats}>
          <View style={styles.statItem}>
            <Text style={styles.statEmoji}>⚡</Text>
            <Text style={styles.statValue}>+{xpEarned}</Text>
            <Text style={styles.statLabel}>XP</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statEmoji}>🎯</Text>
            <Text style={styles.statValue}>{safeAccuracy}%</Text>
            <Text style={styles.statLabel}>Chính xác</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statEmoji}>❤️</Text>
            <Text style={styles.statValue}>{heartsLeft}</Text>
            <Text style={styles.statLabel}>Mạng còn</Text>
          </View>
        </View>

        <View style={{ gap: 12, width: '100%' }}>
          {onNextUnit && (
            <TouchableOpacity style={styles.nextBtn} onPress={onNextUnit}>
              <Text style={styles.nextBtnText}>HỌC BÀI TIẾP THEO →</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={[styles.homeBtn, !onNextUnit && styles.homeBtnPrimary]} onPress={onGoHome}>
            <Text style={[styles.homeBtnText, !onNextUnit && styles.homeBtnPrimaryText]}>{onNextUnit ? 'VỀ LỘ TRÌNH' : 'HOÀN TẤT VÀ VỀ LỘ TRÌNH'}</Text>
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
  completionState: { fontSize: 15, color: '#58cc02', fontWeight: '700', marginBottom: 24 },
  stats: { flexDirection: 'row', gap: 20, marginBottom: 40 },
  statItem: { alignItems: 'center', backgroundColor: '#f8f9fa', padding: 20, borderRadius: 20, minWidth: 90 },
  statEmoji: { fontSize: 24, marginBottom: 4 },
  statValue: { fontSize: 22, fontWeight: 'bold', color: '#3c3c3c' },
  statLabel: { fontSize: 12, color: '#afafaf', marginTop: 2 },
  nextBtn: { backgroundColor: '#58cc02', borderRadius: 16, padding: 18, alignItems: 'center' },
  nextBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold', letterSpacing: 1 },
  homeBtn: { backgroundColor: '#fff', borderRadius: 16, padding: 18, alignItems: 'center', borderWidth: 2, borderColor: '#e5e5e5' },
  homeBtnText: { color: '#afafaf', fontSize: 16, fontWeight: 'bold', letterSpacing: 1 },
  homeBtnPrimary: { backgroundColor: '#58cc02', borderColor: '#58cc02' },
  homeBtnPrimaryText: { color: '#fff' },
});
