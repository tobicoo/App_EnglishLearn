import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ResultScreen({
  correctCount,
  totalQuestions,
  xpEarned,
  gemsEarned,
  previousLevel,
  level,
  leveledUp,
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
  const shouldShowLevelUp = leveledUp && typeof previousLevel === 'number' && typeof level === 'number';

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

        {shouldShowLevelUp ? (
          <View style={styles.levelUpCard}>
            <Text style={styles.levelUpLabel}>Lên cấp!</Text>
            <Text style={styles.levelUpValue}>Level {previousLevel} → {level}</Text>
          </View>
        ) : null}

        <View style={styles.stats}>
          <View style={styles.statItem}>
            <Text style={styles.statEmoji}>⚡</Text>
            <Text style={styles.statValue}>+{xpEarned}</Text>
            <Text style={styles.statLabel}>XP</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statEmoji}>💎</Text>
            <Text style={styles.statValue}>+{gemsEarned ?? 0}</Text>
            <Text style={styles.statLabel}>Gems</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statEmoji}>🎯</Text>
            <Text style={styles.statValue}>{safeAccuracy}%</Text>
            <Text style={styles.statLabel}>Chính xác</Text>
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
  levelUpCard: { width: '100%', backgroundColor: '#fff8db', borderColor: '#ffc800', borderWidth: 2, borderRadius: 18, padding: 16, alignItems: 'center', marginBottom: 24 },
  levelUpLabel: { color: '#b77900', fontSize: 14, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 },
  levelUpValue: { color: '#3c3c3c', fontSize: 24, fontWeight: 'bold', marginTop: 4 },
  stats: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'center', width: '100%', marginBottom: 40 },
  statItem: { alignItems: 'center', backgroundColor: '#f8f9fa', paddingVertical: 16, paddingHorizontal: 12, borderRadius: 20, width: '30%', minWidth: 92 },
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
