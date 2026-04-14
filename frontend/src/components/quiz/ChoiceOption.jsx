import { TouchableOpacity, Text, StyleSheet } from 'react-native';

/**
 * Nút chọn đáp án dùng chung cho multiple_choice và fill_blank.
 * Props:
 *  - label: string
 *  - isSelected: bool
 *  - isAnswered: bool
 *  - isCorrect: bool (đáp án có phải là đáp án đúng?)
 *  - isWrong: bool (đáp án này bị chọn sai?)
 *  - onPress: fn
 */
export default function ChoiceOption({ label, isSelected, isAnswered, isCorrect, isWrong, onPress }) {
  let optStyle = styles.btn;
  let textStyle = styles.text;

  if (isAnswered) {
    if (isCorrect) {
      optStyle = [styles.btn, styles.correct];
      textStyle = [styles.text, styles.lightText];
    } else if (isWrong) {
      optStyle = [styles.btn, styles.wrong];
      textStyle = [styles.text, styles.lightText];
    }
  } else if (isSelected) {
    optStyle = [styles.btn, styles.selected];
  }

  return (
    <TouchableOpacity style={optStyle} onPress={onPress} disabled={isAnswered}>
      <Text style={textStyle}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: { padding: 18, borderRadius: 16, borderWidth: 2, borderColor: '#e5e5e5', backgroundColor: '#fff' },
  selected: { borderColor: '#1cb0f6', backgroundColor: '#e8f4fd' },
  correct: { borderColor: '#58cc02', backgroundColor: '#58cc02' },
  wrong: { borderColor: '#ff4b4b', backgroundColor: '#ff4b4b' },
  text: { fontSize: 16, color: '#3c3c3c', fontWeight: '600' },
  lightText: { color: '#fff' },
});
