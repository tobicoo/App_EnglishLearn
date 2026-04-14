import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withSequence } from 'react-native-reanimated';
import { getQuizzesByUnit, completeUnit } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { GameConfig } from '@/constants/theme';
import QuizHeader from '@/components/quiz/QuizHeader';
import FeedbackBar from '@/components/quiz/FeedbackBar';
import ChoiceOption from '@/components/quiz/ChoiceOption';
import ResultScreen from '@/components/quiz/ResultScreen';

export default function QuizScreen() {
  const router = useRouter();
  const { unitId } = useLocalSearchParams();
  const { user, refreshUser } = useAuth();

  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [translateInput, setTranslateInput] = useState('');
  const [isAnswered, setIsAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [hearts, setHearts] = useState(GameConfig.MAX_HEARTS);
  const [correctCount, setCorrectCount] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);
  const [xpEarned, setXpEarned] = useState(0);

  // Animation hooks ở trên cùng (phải trước mọi early return)
  const shakeValue = useSharedValue(0);
  const feedbackOpacity = useSharedValue(0);

  const shakeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeValue.value }],
  }));
  const feedbackStyle = useAnimatedStyle(() => ({
    opacity: feedbackOpacity.value,
  }));

  useEffect(() => {
    loadQuiz();
  }, []);

  const loadQuiz = async () => {
    const { data, error } = await getQuizzesByUnit(unitId);
    if (error) {
      Alert.alert('Lỗi', error, [{ text: 'OK', onPress: () => router.back() }]);
      return;
    }
    if (data.length > 0) {
      setQuestions(data);
    } else {
      Alert.alert('Thông báo', 'Chưa có câu hỏi cho bài này', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    }
    setLoading(false);
  };

  if (loading || questions.length === 0) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#58cc02" />
      </SafeAreaView>
    );
  }

  const currentQ = questions[currentIndex];
  const totalQuestions = questions.length;
  const progress = ((currentIndex + (isAnswered ? 1 : 0)) / totalQuestions) * 100;

  const checkTranslateAnswer = (input, answer) => {
    const userInput = input.trim().toLowerCase();
    if (typeof answer === 'string') {
      return answer.split('|').map(a => a.trim().toLowerCase()).some(a => a === userInput);
    }
    return false;
  };

  const getDisplayAnswer = (answer) => {
    if (typeof answer === 'string' && answer.includes('|')) return answer.split('|').join(', ');
    return answer;
  };

  const checkAnswer = () => {
    let correct = false;
    if (currentQ.type === 'translate') {
      correct = checkTranslateAnswer(translateInput, currentQ.answer);
    } else {
      correct = selectedOption === currentQ.answer;
    }

    setIsCorrect(correct);
    setIsAnswered(true);
    feedbackOpacity.value = withTiming(1, { duration: 300 });

    if (correct) {
      setCorrectCount(correctCount + 1);
    } else {
      const newHearts = hearts - 1;
      setHearts(newHearts);
      shakeValue.value = withSequence(
        withTiming(-10, { duration: 50 }),
        withTiming(10, { duration: 50 }),
        withTiming(-10, { duration: 50 }),
        withTiming(0, { duration: 50 })
      );
      if (newHearts <= 0) {
        setTimeout(() => {
          Alert.alert('Hết mạng! 💔', 'Bạn đã hết mạng. Hãy thử lại!', [
            { text: 'OK', onPress: () => router.back() }
          ]);
        }, 500);
      }
    }
  };

  const nextQuestion = async () => {
    if (currentIndex < totalQuestions - 1) {
      setCurrentIndex(currentIndex + 1);
      setSelectedOption(null);
      setTranslateInput('');
      setIsAnswered(false);
      feedbackOpacity.value = withTiming(0, { duration: 200 });
    } else {
      const earned = correctCount * GameConfig.XP_PER_CORRECT_ANSWER;
      setXpEarned(earned);
      setQuizFinished(true);
      if (user?.id) {
        const { error } = await completeUnit(unitId, user.id, earned);
        if (!error) await refreshUser();
      }
    }
  };

  const canCheck = () => {
    if (currentQ.type === 'translate') return translateInput.trim().length > 0;
    return selectedOption !== null;
  };

  const getTypeLabel = () => {
    switch (currentQ.type) {
      case 'multiple_choice': return 'Chọn đáp án đúng';
      case 'translate': return 'Dịch câu sau';
      case 'fill_blank': return 'Điền vào chỗ trống';
      default: return '';
    }
  };

  const renderQuestion = () => {
    if (currentQ.type === 'translate') {
      return (
        <View style={styles.translateContainer}>
          <TextInput
            style={[
              styles.translateInput,
              isAnswered && isCorrect && styles.correctBorder,
              isAnswered && !isCorrect && styles.wrongBorder,
            ]}
            placeholder="Nhập bản dịch..."
            placeholderTextColor="#aaa"
            value={translateInput}
            onChangeText={setTranslateInput}
            editable={!isAnswered}
            autoCapitalize="none"
          />
          {isAnswered && !isCorrect && (
            <Text style={styles.correctAnswer}>Đáp án đúng: {getDisplayAnswer(currentQ.answer)}</Text>
          )}
        </View>
      );
    }

    return (
      <View style={styles.optionsContainer}>
        {currentQ.options.map((option, i) => (
          <ChoiceOption
            key={i}
            label={option}
            isSelected={i === selectedOption}
            isAnswered={isAnswered}
            isCorrect={isAnswered && i === currentQ.answer}
            isWrong={isAnswered && i === selectedOption && !isCorrect}
            onPress={() => setSelectedOption(i)}
          />
        ))}
      </View>
    );
  };

  if (quizFinished) {
    return (
      <ResultScreen
        correctCount={correctCount}
        totalQuestions={totalQuestions}
        xpEarned={xpEarned}
        heartsLeft={hearts}
        onNextUnit={() => router.replace({ pathname: '/quiz', params: { unitId: Number(unitId) + 1 } })}
        onGoHome={() => router.back()}
      />
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <QuizHeader progress={progress} hearts={hearts} onClose={() => router.back()} />

      <Animated.View style={[styles.questionArea, shakeStyle]}>
        <Text style={styles.typeLabel}>{getTypeLabel()}</Text>
        <Text style={styles.questionText}>{currentQ.question}</Text>
        {renderQuestion()}
      </Animated.View>

      <FeedbackBar isCorrect={isCorrect} animatedStyle={feedbackStyle} />

      <View style={styles.footer}>
        {!isAnswered ? (
          <TouchableOpacity
            style={[styles.checkBtn, !canCheck() && styles.checkBtnDisabled]}
            onPress={checkAnswer}
            disabled={!canCheck()}
          >
            <Text style={styles.checkBtnText}>KIỂM TRA</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.continueBtn} onPress={nextQuestion}>
            <Text style={styles.continueBtnText}>
              {currentIndex < totalQuestions - 1 ? 'TIẾP TỤC' : 'HOÀN THÀNH'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  questionArea: { flex: 1, padding: 25 },
  typeLabel: { fontSize: 14, color: '#afafaf', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 },
  questionText: { fontSize: 24, fontWeight: 'bold', color: '#3c3c3c', marginBottom: 30, lineHeight: 34 },
  optionsContainer: { gap: 12 },
  translateContainer: { gap: 10 },
  translateInput: { borderWidth: 2, borderColor: '#e5e5e5', borderRadius: 16, padding: 18, fontSize: 18, backgroundColor: '#f7f7f7', color: '#3c3c3c' },
  correctBorder: { borderColor: '#58cc02' },
  wrongBorder: { borderColor: '#ff4b4b' },
  correctAnswer: { color: '#58cc02', fontWeight: 'bold', fontSize: 15, marginLeft: 5 },
  footer: { padding: 20 },
  checkBtn: { backgroundColor: '#1cb0f6', borderRadius: 16, padding: 18, alignItems: 'center' },
  checkBtnDisabled: { backgroundColor: '#e5e5e5' },
  checkBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold', letterSpacing: 1 },
  continueBtn: { backgroundColor: '#58cc02', borderRadius: 16, padding: 18, alignItems: 'center' },
  continueBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold', letterSpacing: 1 },
});
