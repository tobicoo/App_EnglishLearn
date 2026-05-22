import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated from 'react-native-reanimated';

export default function QuizHeader({ progress, hearts, maxHearts, heartCountdownLabel, showHeartInfo, onClose, onToggleHeartInfo }) {
  return (
    <View style={styles.header}>
      <TouchableOpacity onPress={onClose}>
        <Ionicons name="close" size={30} color="#afafaf" />
      </TouchableOpacity>
      <View style={styles.progressBar}>
        <Animated.View style={[styles.progressFill, { width: `${progress}%` }]} />
      </View>
      <View style={styles.heartsWrap}>
        <TouchableOpacity
          accessibilityLabel="Thông tin hồi tim"
          activeOpacity={0.75}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          onPress={onToggleHeartInfo}
          style={styles.heartsButton}
        >
          <Text style={styles.heartsText}>❤️ {hearts}/{maxHearts}</Text>
        </TouchableOpacity>
        {showHeartInfo ? (
          <View style={styles.heartBubble}>
            <View style={styles.heartBubbleArrow} />
            <Text style={styles.heartBubbleText}>{heartCountdownLabel}</Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', padding: 15, gap: 10, zIndex: 50, elevation: 50 },
  progressBar: { flex: 1, height: 12, backgroundColor: '#e5e5e5', borderRadius: 10, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#58cc02', borderRadius: 10 },
  heartsWrap: { alignItems: 'center', minWidth: 68, position: 'relative' },
  heartsButton: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 2 },
  heartsText: { fontSize: 16, fontWeight: 'bold', color: '#ff4b4b' },
  heartBubble: {
    position: 'absolute',
    top: 42,
    left: '50%',
    transform: [{ translateX: -58 }],
    zIndex: 100,
    width: 116,
    borderRadius: 10,
    backgroundColor: '#3c3c3c',
    paddingHorizontal: 10,
    paddingVertical: 7,
    shadowColor: '#000',
    shadowOpacity: 0.14,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 100,
  },
  heartBubbleArrow: {
    position: 'absolute',
    top: -5,
    left: '50%',
    marginLeft: -5,
    width: 10,
    height: 10,
    backgroundColor: '#3c3c3c',
    transform: [{ rotate: '45deg' }],
  },
  heartBubbleText: { color: '#fff', fontSize: 12, fontWeight: '700', textAlign: 'center' },
});
