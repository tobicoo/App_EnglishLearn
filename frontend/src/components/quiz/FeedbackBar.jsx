import { StyleSheet, Text } from 'react-native';
import Animated from 'react-native-reanimated';

export default function FeedbackBar({ isCorrect, animatedStyle, message }) {
  return (
    <Animated.View style={[
      styles.bar,
      isCorrect ? styles.correct : styles.wrong,
      animatedStyle,
    ]}>
      <Text style={styles.text}>
        {message || (isCorrect ? '✅ Chính xác!' : '❌ Sai rồi!')}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  bar: { padding: 15, marginHorizontal: 20, borderRadius: 16, marginBottom: 10 },
  correct: { backgroundColor: '#d7ffb8' },
  wrong: { backgroundColor: '#ffdfe0' },
  text: { fontSize: 16, fontWeight: 'bold', textAlign: 'center' },
});
