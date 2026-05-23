import ChoiceOption from '@/components/quiz/ChoiceOption';
import FeedbackBar from '@/components/quiz/FeedbackBar';
import QuizHeader from '@/components/quiz/QuizHeader';
import ResultScreen from '@/components/quiz/ResultScreen';
import { GameConfig } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import {
  completeUnit,
  getSectionsWithUnits,
  getUnitExercises,
  startUnitAttempt,
  submitExerciseAttempt,
} from '@/services/api';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withTiming } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

const SUPPORTED_TYPES = new Set(['multiple_choice', 'fill_blank', 'matching']);

const MATCHING_OPTION_LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

const getInitialHeartInfo = (user) => ({
  maxHearts: user?.maxHearts ?? GameConfig.MAX_HEARTS,
  nextHeartAt: user?.nextHeartAt ?? null,
  minutesUntilNextHeart: user?.minutesUntilNextHeart ?? 0,
  heartRefillIntervalSeconds: user?.heartRefillIntervalSeconds ?? 120,
});

const getHeartInfoFromPayload = (payload, fallback) => ({
  hearts: payload?.hearts ?? fallback.hearts,
  maxHearts: payload?.maxHearts ?? fallback.maxHearts,
  nextHeartAt: payload?.nextHeartAt ?? fallback.nextHeartAt,
  secondsUntilNextHeart: payload?.secondsUntilNextHeart ?? fallback.secondsUntilNextHeart,
  minutesUntilNextHeart: payload?.minutesUntilNextHeart ?? fallback.minutesUntilNextHeart,
  heartRefillIntervalSeconds: payload?.heartRefillIntervalSeconds ?? fallback.heartRefillIntervalSeconds ?? 120,
  heartMetadataReceivedAt: typeof payload?.secondsUntilNextHeart === 'number' ? Date.now() : fallback.heartMetadataReceivedAt,
});

const formatHeartSeconds = (seconds) => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${String(remainingSeconds).padStart(2, '0')}`;
};

const getHeartCountdownLabel = (hearts, heartInfo, nowMs) => {
  if (hearts >= heartInfo.maxHearts) {
    return 'Đầy tim';
  }

  const secondsUntilNextHeart = typeof heartInfo.secondsUntilNextHeart === 'number' && typeof heartInfo.heartMetadataReceivedAt === 'number'
    ? Math.max(heartInfo.secondsUntilNextHeart - Math.floor((nowMs - heartInfo.heartMetadataReceivedAt) / 1000), 0)
    : Math.max(Number(heartInfo.secondsUntilNextHeart) || 0, 0);

  if (secondsUntilNextHeart <= 0) {
    return 'Sắp hồi tim';
  }

  if (secondsUntilNextHeart < 600) {
    return `Tim tiếp theo: ${formatHeartSeconds(secondsUntilNextHeart)}`;
  }

  return `Tim tiếp theo: ${Math.ceil(secondsUntilNextHeart / 60)} phút`;
};

const getNextHeartDelayMs = (heartInfo) => {
  if (typeof heartInfo.secondsUntilNextHeart === 'number' && typeof heartInfo.heartMetadataReceivedAt === 'number') {
    return Math.max(heartInfo.secondsUntilNextHeart * 1000 - (Date.now() - heartInfo.heartMetadataReceivedAt), 0);
  }

  const nextHeartTime = heartInfo.nextHeartAt ? new Date(heartInfo.nextHeartAt).getTime() : null;
  return nextHeartTime ? Math.max(nextHeartTime - Date.now(), 0) : 0;
};

const getExerciseLabel = (type, hasOptions) => {
  switch (type) {
    case 'multiple_choice':
      return 'Chọn đáp án đúng';
    case 'fill_blank':
      return hasOptions ? 'Chọn từ đúng để điền' : 'Điền từ còn thiếu';
    case 'matching':
      return 'Nối cặp phù hợp';
    default:
      return 'Dạng bài chưa hỗ trợ';
  }
};

const buildCorrectAnswerText = (exercise, feedback) => {
  if (!feedback?.correctAnswer) {
    return '';
  }

  if (exercise.type === 'multiple_choice') {
    return feedback.correctAnswer.text || '';
  }

  if (exercise.type === 'fill_blank') {
    return String(feedback.correctAnswer || '');
  }

  if (exercise.type === 'matching' && Array.isArray(feedback.correctAnswer)) {
    return feedback.correctAnswer.map((pair) => `${pair.leftText} → ${pair.rightText}`).join('\n');
  }

  return '';
};

export default function QuizScreen() {
  const router = useRouter();
  const { unitId } = useLocalSearchParams();
  const { user, refreshUser } = useAuth();
  const goToLearningPath = useCallback(() => {
    router.dismissAll();
    router.replace('/(tabs)/home');
  }, [router]);

  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOptionId, setSelectedOptionId] = useState(null);
  const [fillBlankInput, setFillBlankInput] = useState('');
  const [selectedWordOptionId, setSelectedWordOptionId] = useState(null);
  const [selectedMatches, setSelectedMatches] = useState({});
  const [isAnswered, setIsAnswered] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [hearts, setHearts] = useState(user?.hearts ?? GameConfig.MAX_HEARTS);
  const [heartInfo, setHeartInfo] = useState(() => getInitialHeartInfo(user));
  const [showHeartInfo, setShowHeartInfo] = useState(false);
  const [heartCountdownNow, setHeartCountdownNow] = useState(Date.now());
  const [correctCount, setCorrectCount] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);
  const [resultSummary, setResultSummary] = useState(null);
  const [nextUnitId, setNextUnitId] = useState(null);
  const [unitAttemptId, setUnitAttemptId] = useState(null);

  const shakeValue = useSharedValue(0);
  const feedbackOpacity = useSharedValue(0);

  const heartsRef = useRef(hearts);
  const heartInfoRef = useRef(heartInfo);
  const heartTimerRef = useRef(null);

  useEffect(() => { heartsRef.current = hearts; }, [hearts]);
  useEffect(() => { heartInfoRef.current = heartInfo; }, [heartInfo]);

  const shakeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeValue.value }],
  }));
  const feedbackStyle = useAnimatedStyle(() => ({
    opacity: feedbackOpacity.value,
  }));

  useEffect(() => {
    loadQuiz();
  }, [unitId]);

  useEffect(() => {
    if (!showHeartInfo) {
      return undefined;
    }

    setHeartCountdownNow(Date.now());
    const timer = setInterval(() => setHeartCountdownNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [showHeartInfo]);

  useEffect(() => {
    if (hearts >= heartInfo.maxHearts || !heartInfo.nextHeartAt) {
      if (heartTimerRef.current) {
        clearTimeout(heartTimerRef.current);
        heartTimerRef.current = null;
      }
      return undefined;
    }

    const delay = getNextHeartDelayMs(heartInfo);
    const expectedNextHeartAt = heartInfo.nextHeartAt;

    heartTimerRef.current = setTimeout(() => {
      heartTimerRef.current = null;
      const currentHearts = heartsRef.current;
      const currentInfo = heartInfoRef.current;
      if (currentHearts >= currentInfo.maxHearts || currentInfo.nextHeartAt !== expectedNextHeartAt) {
        return;
      }
      const nextHearts = Math.min(currentHearts + 1, currentInfo.maxHearts);
      setHearts(nextHearts);
      setHeartInfo({
        ...currentInfo,
        nextHeartAt: nextHearts >= currentInfo.maxHearts
          ? null
          : new Date(Date.now() + (currentInfo.heartRefillIntervalSeconds ?? 120) * 1000).toISOString(),
        minutesUntilNextHeart: nextHearts >= currentInfo.maxHearts ? 0 : Math.ceil((currentInfo.heartRefillIntervalSeconds ?? 120) / 60),
        secondsUntilNextHeart: nextHearts >= currentInfo.maxHearts ? 0 : (currentInfo.heartRefillIntervalSeconds ?? 120),
        heartMetadataReceivedAt: Date.now(),
      });
      refreshUser();
    }, delay);

    return () => {
      if (heartTimerRef.current) {
        clearTimeout(heartTimerRef.current);
        heartTimerRef.current = null;
      }
    };
  }, [hearts, heartInfo.maxHearts, heartInfo.nextHeartAt]);

  const currentQ = questions[currentIndex];
  const totalQuestions = questions.length;
  const answeredCount = quizFinished ? totalQuestions : currentIndex + (isAnswered ? 1 : 0);
  const progress = totalQuestions === 0 ? 0 : (answeredCount / totalQuestions) * 100;
  const heartCountdownLabel = getHeartCountdownLabel(hearts, heartInfo, heartCountdownNow);

  const matchingRightOptions = useMemo(() => {
    if (!currentQ?.pairs?.length) {
      return [];
    }

    return currentQ.pairs.map((pair, index) => ({
      key: `${pair.id}-${pair.rightText}`,
      label: MATCHING_OPTION_LETTERS[index] || String(index + 1),
      text: pair.rightText,
    }));
  }, [currentQ]);

  const loadQuiz = async () => {
    setLoading(true);
    setErrorMessage('');
    setSubmitError('');
    setQuizFinished(false);
    setResultSummary(null);
    setCorrectCount(0);
    setNextUnitId(null);
    setUnitAttemptId(null);
    setCurrentIndex(0);
    setSelectedOptionId(null);
    setFillBlankInput('');
    setSelectedWordOptionId(null);
    setSelectedMatches({});
    setIsAnswered(false);
    setFeedback(null);
    setShowHeartInfo(false);
    feedbackOpacity.value = 0;

    const [{ data: exercises, error: exercisesError }, { data: startedAttempt, error: attemptError }] = await Promise.all([
      getUnitExercises(unitId),
      startUnitAttempt(unitId),
    ]);

    const combinedError = exercisesError || attemptError;
    if (combinedError) {
      setErrorMessage(combinedError);
      setQuestions([]);
      setLoading(false);
      return;
    }

    setQuestions(exercises || []);
    setUnitAttemptId(startedAttempt?.unitAttemptId || startedAttempt?.unitAttempt?.id || null);
    const initialHeartInfo = getHeartInfoFromPayload(startedAttempt || {}, getInitialHeartInfo(user));
    setHearts(initialHeartInfo.hearts);
    setHeartInfo(initialHeartInfo);
    setLoading(false);
  };

  const resetExerciseState = () => {
    setSelectedOptionId(null);
    setFillBlankInput('');
    setSelectedWordOptionId(null);
    setSelectedMatches({});
    setIsAnswered(false);
    setFeedback(null);
    setSubmitError('');
    feedbackOpacity.value = withTiming(0, { duration: 200 });
  };

  const loadNextUnitId = async () => {
    const { data: sections } = await getSectionsWithUnits();
    if (!sections) {
      setNextUnitId(null);
      return;
    }

    const allUnits = sections.flatMap((section) => section.units || []);
    const todoUnit = allUnits.find((unit) => unit.type === 'todo');
    setNextUnitId(todoUnit?.id ? String(todoUnit.id) : null);
  };

  const getAttemptPayload = () => {
    if (!currentQ || !unitAttemptId) {
      return null;
    }

    if (currentQ.type === 'multiple_choice') {
      return selectedOptionId ? { unitAttemptId, selectedOptionId } : null;
    }

    if (currentQ.type === 'fill_blank') {
      if (currentQ.options?.length > 0) {
        const selectedWord = currentQ.options.find((option) => option.id === selectedWordOptionId)?.text;
        return selectedWord ? { unitAttemptId, answerText: selectedWord } : null;
      }

      return fillBlankInput.trim() ? { unitAttemptId, answerText: fillBlankInput.trim() } : null;
    }

    if (currentQ.type === 'matching') {
      if (!currentQ.pairs?.length) {
        return null;
      }

      const pairs = currentQ.pairs.map((pair) => ({
        leftText: pair.leftText,
        rightText: selectedMatches[pair.leftText],
      }));
      const isComplete = pairs.every((pair) => typeof pair.rightText === 'string' && pair.rightText.trim().length > 0);
      return isComplete ? { unitAttemptId, pairs } : null;
    }

    return null;
  };

  const canCheck = () => {
    if (!currentQ || isSubmitting || isAnswered || !SUPPORTED_TYPES.has(currentQ.type)) {
      return false;
    }

    return Boolean(getAttemptPayload());
  };

  const handleSubmitAnswer = async () => {
    const payload = getAttemptPayload();
    if (!currentQ || !payload) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError('');

    const { data, error } = await submitExerciseAttempt(currentQ.id, payload);
    setIsSubmitting(false);

    if (error) {
      setSubmitError(error);
      return;
    }

    if (heartTimerRef.current) {
      clearTimeout(heartTimerRef.current);
      heartTimerRef.current = null;
    }

    setFeedback(data);
    setIsAnswered(true);
    setHearts(typeof data?.hearts === 'number' ? data.hearts : hearts);
    setHeartInfo((current) => getHeartInfoFromPayload(data, current));
    refreshUser();
    if (data?.isCorrect) {
      setCorrectCount((value) => value + 1);
    } else {
      shakeValue.value = withSequence(
        withTiming(-10, { duration: 50 }),
        withTiming(10, { duration: 50 }),
        withTiming(-10, { duration: 50 }),
        withTiming(0, { duration: 50 })
      );
    }

    feedbackOpacity.value = withTiming(1, { duration: 300 });
  };

  const finishQuiz = async () => {
    if (!unitAttemptId) {
      setSubmitError('Không tìm thấy lượt làm bài hiện tại');
      return;
    }

    setIsSubmitting(true);
    setSubmitError('');
    const { data, error } = await completeUnit(unitId, unitAttemptId);
    setIsSubmitting(false);

    if (error) {
      setSubmitError(error);
      return;
    }

    setHearts(typeof data?.hearts === 'number' ? data.hearts : hearts);
    setHeartInfo((current) => getHeartInfoFromPayload(data, current));
    setResultSummary({
      xpEarned: data?.xpAwarded ?? 0,
      gemsEarned: data?.gemsAwarded ?? 0,
      previousLevel: data?.previousLevel,
      level: data?.level,
      leveledUp: Boolean(data?.leveledUp),
      accuracy: data?.unitAttempt?.score ?? 0,
      completionState: data?.progress?.status ?? data?.unitAttempt?.status ?? 'completed',
      totalQuestions,
      correctCount: data?.unitAttempt?.correctAnswers ?? correctCount,
    });
    setQuizFinished(true);
    await Promise.all([refreshUser(), loadNextUnitId()]);
  };

  const nextQuestion = async () => {
    if (!SUPPORTED_TYPES.has(currentQ?.type)) {
      if (currentIndex < totalQuestions - 1) {
        setCurrentIndex((value) => value + 1);
        resetExerciseState();
      } else {
        setSubmitError('Unit này có dạng bài chưa được app hỗ trợ nên chưa thể hoàn thành trọn vẹn trên màn hình quiz hiện tại.');
      }
      return;
    }

    if (currentIndex < totalQuestions - 1) {
      setCurrentIndex((value) => value + 1);
      resetExerciseState();
      return;
    }

    await finishQuiz();
  };

  const toggleMatchingChoice = (leftText, rightText) => {
    if (isAnswered) {
      return;
    }

    setSelectedMatches((current) => {
      const next = { ...current };
      next[leftText] = current[leftText] === rightText ? '' : rightText;
      return next;
    });
  };

  const renderFillBlank = () => {
    const hasWordOptions = currentQ.options?.length > 0;
    const wrongAnswerText = !feedback?.isCorrect ? buildCorrectAnswerText(currentQ, feedback) : '';

    return (
      <View style={styles.translateContainer}>
        {hasWordOptions ? (
          <View style={styles.optionsContainer}>
            {currentQ.options.map((option) => (
              <ChoiceOption
                key={option.id}
                label={option.text}
                isSelected={option.id === selectedWordOptionId}
                isAnswered={isAnswered}
                isCorrect={isAnswered && feedback?.isCorrect && option.id === selectedWordOptionId}
                isWrong={isAnswered && !feedback?.isCorrect && option.id === selectedWordOptionId}
                onPress={() => setSelectedWordOptionId(option.id)}
              />
            ))}
          </View>
        ) : (
          <TextInput
            style={[
              styles.translateInput,
              isAnswered && feedback?.isCorrect && styles.correctBorder,
              isAnswered && !feedback?.isCorrect && styles.wrongBorder,
            ]}
            placeholder="Nhập câu trả lời..."
            placeholderTextColor="#aaa"
            value={fillBlankInput}
            onChangeText={setFillBlankInput}
            editable={!isAnswered}
            autoCapitalize="none"
          />
        )}

        {isAnswered && !feedback?.isCorrect && wrongAnswerText ? (
          <View style={styles.guidanceBox}>
            <Text style={styles.guidanceTitle}>Đáp án đúng:</Text>
            <Text style={styles.correctAnswer}>{wrongAnswerText}</Text>
          </View>
        ) : null}
      </View>
    );
  };

  const renderMultipleChoice = () => (
    <View style={styles.optionsContainer}>
      {currentQ.options.map((option) => {
        const correctOptionId = feedback?.correctAnswer?.selectedOptionId;

        return (
          <ChoiceOption
            key={option.id}
            label={option.text}
            isSelected={option.id === selectedOptionId}
            isAnswered={isAnswered}
            isCorrect={isAnswered && option.id === correctOptionId}
            isWrong={isAnswered && !feedback?.isCorrect && option.id === selectedOptionId}
            onPress={() => setSelectedOptionId(option.id)}
          />
        );
      })}
    </View>
  );

  const renderMatching = () => {
    const correctAnswerText = !feedback?.isCorrect ? buildCorrectAnswerText(currentQ, feedback) : '';

    return (
      <View style={styles.matchingContainer}>
        <View style={styles.matchingGuideBox}>
          <Text style={styles.matchingGuideText}>Chọn đáp án bên phải cho từng mục bên trái.</Text>
        </View>

        <View style={styles.matchingOptionsWrap}>
          {matchingRightOptions.map((option) => (
            <View key={option.key} style={styles.matchingLegendItem}>
              <Text style={styles.matchingLegendBadge}>{option.label}</Text>
              <Text style={styles.matchingLegendText}>{option.text}</Text>
            </View>
          ))}
        </View>

        <View style={styles.matchingRows}>
          {currentQ.pairs.map((pair) => (
            <View key={pair.id} style={styles.matchingRowCard}>
              <Text style={styles.matchingLeftText}>{pair.leftText}</Text>
              <View style={styles.matchingButtonsRow}>
                {matchingRightOptions.map((option) => {
                  const isSelected = selectedMatches[pair.leftText] === option.text;

                  return (
                    <Pressable
                      key={`${pair.id}-${option.key}`}
                      style={[styles.matchingChoice, isSelected && styles.matchingChoiceSelected, isAnswered && styles.matchingChoiceDisabled]}
                      onPress={() => toggleMatchingChoice(pair.leftText, option.text)}
                      disabled={isAnswered}
                    >
                      <Text style={[styles.matchingChoiceText, isSelected && styles.matchingChoiceTextSelected]}>{option.label}</Text>
                    </Pressable>
                  );
                })}
              </View>
              <Text style={styles.matchingSelectedText}>
                {selectedMatches[pair.leftText] ? `Đã chọn: ${selectedMatches[pair.leftText]}` : 'Chưa chọn đáp án'}
              </Text>
            </View>
          ))}
        </View>

        {isAnswered && !feedback?.isCorrect && correctAnswerText ? (
          <View style={styles.guidanceBox}>
            <Text style={styles.guidanceTitle}>Cặp đúng là:</Text>
            <Text style={styles.correctAnswer}>{correctAnswerText}</Text>
          </View>
        ) : null}
      </View>
    );
  };

  const renderUnsupported = () => (
    <View style={styles.unsupportedBox}>
      <Text style={styles.unsupportedTitle}>Dạng bài này chưa được hỗ trợ trong ứng dụng.</Text>
      <Text style={styles.unsupportedText}>Bạn có thể bỏ qua câu này an toàn và quay lại sau khi app được cập nhật.</Text>
    </View>
  );

  const renderQuestion = () => {
    if (!currentQ) {
      return null;
    }

    if (currentQ.type === 'multiple_choice') {
      return renderMultipleChoice();
    }

    if (currentQ.type === 'fill_blank') {
      return renderFillBlank();
    }

    if (currentQ.type === 'matching') {
      return renderMatching();
    }

    return renderUnsupported();
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.centerState]}>
        <ActivityIndicator size="large" color="#58cc02" />
        <Text style={styles.stateText}>Đang tải câu hỏi...</Text>
      </SafeAreaView>
    );
  }

  if (errorMessage || questions.length === 0) {
    return (
      <SafeAreaView style={[styles.container, styles.centerState]}>
        <Text style={styles.stateTitle}>{errorMessage ? 'Chưa tải được bài quiz' : 'Unit này chưa có câu hỏi'}</Text>
        <Text style={styles.stateText}>{errorMessage || 'Hãy quay lại lộ trình và chọn bài khác trong lúc chờ nội dung mới.'}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={errorMessage ? loadQuiz : goToLearningPath}>
          <Text style={styles.retryBtnText}>{errorMessage ? 'Thử lại' : 'Về lộ trình'}</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  if (quizFinished && resultSummary) {
    return (
      <ResultScreen
        correctCount={resultSummary.correctCount}
        totalQuestions={resultSummary.totalQuestions}
        xpEarned={resultSummary.xpEarned}
        gemsEarned={resultSummary.gemsEarned}
        previousLevel={resultSummary.previousLevel}
        level={resultSummary.level}
        leveledUp={resultSummary.leveledUp}
        heartsLeft={hearts}
        accuracy={resultSummary.accuracy}
        completionState={resultSummary.completionState}
        onNextUnit={nextUnitId ? () => router.replace({ pathname: '/quiz', params: { unitId: nextUnitId } }) : null}
        onGoHome={goToLearningPath}
      />
    );
  }

  const typeLabel = getExerciseLabel(currentQ.type, currentQ.options?.length > 0);
  const feedbackMessage = feedback?.isCorrect
    ? '✅ Chính xác!'
    : currentQ.type === 'matching'
      ? '❌ Chưa khớp hết các cặp.'
      : '❌ Sai rồi!';

  return (
    <SafeAreaView style={styles.container}>
      <QuizHeader
        progress={progress}
        hearts={hearts}
        maxHearts={heartInfo.maxHearts}
        heartCountdownLabel={heartCountdownLabel}
        showHeartInfo={showHeartInfo}
        onToggleHeartInfo={() => setShowHeartInfo((value) => !value)}
        onClose={goToLearningPath}
      />

      <Animated.View style={[styles.questionArea, shakeStyle]}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <Text style={styles.typeLabel}>{typeLabel}</Text>
          <Text style={styles.questionMeta}>Câu {currentIndex + 1}/{totalQuestions} • Trạng thái mạng hiện tại: {hearts}</Text>
          <Text style={styles.questionText}>{currentQ.prompt}</Text>
          {currentQ.instruction ? <Text style={styles.instructionText}>{currentQ.instruction}</Text> : null}
          {renderQuestion()}
          {submitError ? <Text style={styles.submitError}>{submitError}</Text> : null}
        </ScrollView>
      </Animated.View>

      {isAnswered ? <FeedbackBar isCorrect={Boolean(feedback?.isCorrect)} animatedStyle={feedbackStyle} message={feedbackMessage} /> : null}
      {isAnswered && !feedback?.isCorrect && hearts <= 0 ? (
        <View style={styles.heartsWarning}>
          <Text style={styles.heartsWarningText}>Bạn đã hết mạng, nhưng backend vẫn cho phép tiếp tục hoàn thành unit và nhận kết quả cuối bài.</Text>
        </View>
      ) : null}

      <View style={styles.footer}>
        {!isAnswered ? (
          <TouchableOpacity
            style={[styles.checkBtn, !canCheck() && styles.checkBtnDisabled]}
            onPress={handleSubmitAnswer}
            disabled={!canCheck()}
          >
            <Text style={styles.checkBtnText}>{isSubmitting ? 'ĐANG GỬI...' : 'KIỂM TRA'}</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={[styles.continueBtn, isSubmitting && styles.checkBtnDisabled]} onPress={nextQuestion} disabled={isSubmitting}>
            <Text style={styles.continueBtnText}>
              {isSubmitting ? 'ĐANG HOÀN THÀNH...' : currentIndex < totalQuestions - 1 ? 'TIẾP TỤC CÂU SAU' : 'HOÀN THÀNH BÀI'}
            </Text>
          </TouchableOpacity>
        )}

        {!SUPPORTED_TYPES.has(currentQ.type) ? (
          <TouchableOpacity style={styles.skipBtn} onPress={nextQuestion}>
            <Text style={styles.skipBtnText}>{currentIndex < totalQuestions - 1 ? 'BỎ QUA CÂU NÀY' : 'THỬ HOÀN THÀNH UNIT'}</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  questionArea: { flex: 1, paddingHorizontal: 25 },
  scrollContent: { paddingBottom: 24 },
  centerState: { justifyContent: 'center', alignItems: 'center', padding: 24 },
  stateTitle: { fontSize: 20, fontWeight: 'bold', color: '#3c3c3c', marginBottom: 8, textAlign: 'center' },
  stateText: { fontSize: 14, color: '#777', textAlign: 'center', lineHeight: 20, marginTop: 10 },
  retryBtn: { marginTop: 16, backgroundColor: '#58cc02', borderRadius: 14, paddingHorizontal: 18, paddingVertical: 12 },
  retryBtnText: { color: '#fff', fontWeight: 'bold' },
  typeLabel: { fontSize: 14, color: '#afafaf', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 },
  questionMeta: { fontSize: 13, color: '#777', marginBottom: 12, lineHeight: 19 },
  questionText: { fontSize: 24, fontWeight: 'bold', color: '#3c3c3c', marginBottom: 12, lineHeight: 34 },
  instructionText: { fontSize: 15, color: '#6f6f6f', marginBottom: 24, lineHeight: 22 },
  optionsContainer: { gap: 12 },
  translateContainer: { gap: 10 },
  translateInput: { borderWidth: 2, borderColor: '#e5e5e5', borderRadius: 16, padding: 18, fontSize: 18, backgroundColor: '#f7f7f7', color: '#3c3c3c' },
  correctBorder: { borderColor: '#58cc02' },
  wrongBorder: { borderColor: '#ff4b4b' },
  guidanceBox: { backgroundColor: '#fff4f4', borderColor: '#ffb3b3', borderWidth: 1, borderRadius: 12, padding: 12, marginTop: 10 },
  guidanceTitle: { color: '#b73535', fontWeight: '700', marginBottom: 4 },
  correctAnswer: { color: '#3c3c3c', fontWeight: 'bold', fontSize: 15, lineHeight: 22 },
  heartsWarning: { marginHorizontal: 20, marginBottom: 10, padding: 12, borderRadius: 14, backgroundColor: '#fff4e6', borderWidth: 1, borderColor: '#ffc800' },
  heartsWarningText: { color: '#7a4b00', fontWeight: '600', lineHeight: 20, textAlign: 'center' },
  footer: { padding: 20, gap: 12 },
  checkBtn: { backgroundColor: '#1cb0f6', borderRadius: 16, padding: 18, alignItems: 'center' },
  checkBtnDisabled: { backgroundColor: '#e5e5e5' },
  checkBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold', letterSpacing: 1 },
  continueBtn: { backgroundColor: '#58cc02', borderRadius: 16, padding: 18, alignItems: 'center' },
  continueBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold', letterSpacing: 1 },
  submitError: { color: '#ff4b4b', marginTop: 16, fontWeight: '600', lineHeight: 20 },
  unsupportedBox: { borderRadius: 16, borderWidth: 1, borderColor: '#ffd699', backgroundColor: '#fff8eb', padding: 16, gap: 8 },
  unsupportedTitle: { fontSize: 16, fontWeight: '700', color: '#7a4b00' },
  unsupportedText: { fontSize: 14, color: '#8c6200', lineHeight: 20 },
  skipBtn: { borderRadius: 16, padding: 16, alignItems: 'center', borderWidth: 2, borderColor: '#e5e5e5', backgroundColor: '#fff' },
  skipBtnText: { fontSize: 15, color: '#777', fontWeight: '700' },
  matchingContainer: { gap: 16 },
  matchingGuideBox: { backgroundColor: '#eef8ff', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#c9e6fb' },
  matchingGuideText: { color: '#1967a3', fontWeight: '600', lineHeight: 20 },
  matchingOptionsWrap: { gap: 8 },
  matchingLegendItem: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#f7f7f7', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10 },
  matchingLegendBadge: { width: 28, height: 28, borderRadius: 14, textAlign: 'center', textAlignVertical: 'center', overflow: 'hidden', backgroundColor: '#1cb0f6', color: '#fff', fontWeight: '700', lineHeight: 28 },
  matchingLegendText: { flex: 1, color: '#3c3c3c', fontWeight: '600' },
  matchingRows: { gap: 12 },
  matchingRowCard: { borderWidth: 1, borderColor: '#ececec', borderRadius: 16, padding: 14, gap: 12, backgroundColor: '#fff' },
  matchingLeftText: { fontSize: 16, fontWeight: '700', color: '#3c3c3c' },
  matchingButtonsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  matchingChoice: { minWidth: 42, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12, borderWidth: 2, borderColor: '#d9d9d9', backgroundColor: '#fff' },
  matchingChoiceSelected: { borderColor: '#1cb0f6', backgroundColor: '#e8f4fd' },
  matchingChoiceDisabled: { opacity: 0.85 },
  matchingChoiceText: { fontWeight: '700', color: '#777', textAlign: 'center' },
  matchingChoiceTextSelected: { color: '#1cb0f6' },
  matchingSelectedText: { color: '#666', lineHeight: 20 },
});
