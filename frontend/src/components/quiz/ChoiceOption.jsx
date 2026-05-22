import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function ChoiceOption({ label, description, isSelected, isAnswered, isCorrect, isWrong, onPress }) {
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
      <View style={styles.content}>
        <Text style={textStyle}>{label}</Text>
        {description ? <Text style={[styles.description, isAnswered && (isCorrect || isWrong) && styles.lightText]}>{description}</Text> : null}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: { padding: 18, borderRadius: 16, borderWidth: 2, borderColor: '#e5e5e5', backgroundColor: '#fff' },
  content: { gap: 4 },
  selected: { borderColor: '#1cb0f6', backgroundColor: '#e8f4fd' },
  correct: { borderColor: '#58cc02', backgroundColor: '#58cc02' },
  wrong: { borderColor: '#ff4b4b', backgroundColor: '#ff4b4b' },
  text: { fontSize: 16, color: '#3c3c3c', fontWeight: '600' },
  description: { fontSize: 13, color: '#777', lineHeight: 18 },
  lightText: { color: '#fff' },
});
