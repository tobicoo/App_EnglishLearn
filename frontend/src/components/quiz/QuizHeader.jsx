import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Animated from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

/**
 * Thanh header của quiz: nút đóng + progress bar + số tim.
 * Props:
 *  - progress: number (0-100)
 *  - hearts: number
 *  - onClose: fn
 */
export default function QuizHeader({ progress, hearts, onClose }) {
  return (
    <View style={styles.header}>
      <TouchableOpacity onPress={onClose}>
        <Ionicons name="close" size={30} color="#afafaf" />
      </TouchableOpacity>
      <View style={styles.progressBar}>
        <Animated.View style={[styles.progressFill, { width: `${progress}%` }]} />
      </View>
      <Text style={styles.heartsText}>❤️ {hearts}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', padding: 15, gap: 10 },
  progressBar: { flex: 1, height: 12, backgroundColor: '#e5e5e5', borderRadius: 10, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#58cc02', borderRadius: 10 },
  heartsText: { fontSize: 16, fontWeight: 'bold', color: '#ff4b4b' },
});
