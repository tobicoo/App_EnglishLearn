import { getAllFlashcards } from '@/services/api';
import { Ionicons } from '@expo/vector-icons';
import { useRoleBack } from '@/navigation/roleBack';
import * as Speech from 'expo-speech';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function FlashcardScreen() {
  const { goBack } = useRoleBack('/(tabs)/home');
  
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  const flipValue = useSharedValue(0);

  const frontAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotateY: `${flipValue.value}deg` }],
  }));
  const backAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotateY: `${flipValue.value - 180}deg` }],
  }));

  useEffect(() => {
    loadFlashcards();
  }, []);

  const loadFlashcards = async () => {
    setLoading(true);
    setLoadError('');
    const { data, error } = await getAllFlashcards();
    if (error) {
      setCards([]);
      setLoadError(error);
    } else {
      setCards(data || []);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#58cc02" />
        <Text style={styles.stateText}>Đang tải flashcard...</Text>
      </SafeAreaView>
    );
  }

  if (cards.length === 0) {
    return (
      <SafeAreaView style={[styles.container, styles.centerState]}>
        <Text style={styles.stateTitle}>{loadError ? 'Chưa tải được flashcard' : 'Chưa có flashcard'}</Text>
        <Text style={styles.stateText}>{loadError || 'Unit này chưa có thẻ từ vựng để luyện tập.'}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={loadError ? loadFlashcards : () => goBack()}>
          <Text style={styles.retryBtnText}>{loadError ? 'Thử lại' : 'Quay lại'}</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const totalCards = cards.length;
  const currentCard = cards[currentIndex];

  const handlePlayAudio = () => {
    Speech.speak(currentCard.word, { language: 'en-US', rate: 0.8 });
  };

  const handleFlip = () => {
    flipValue.value = withSpring(isFlipped ? 0 : 180, { damping: 15 });
    setIsFlipped(!isFlipped);
  };

  const handleContinue = () => {
    if (currentIndex < totalCards - 1) {
      flipValue.value = withTiming(0, { duration: 200 });
      setIsFlipped(false);
      setTimeout(() => setCurrentIndex(currentIndex + 1), 250);
    } else {
      Alert.alert("Chúc mừng!", "Bạn đã hoàn thành tất cả flashcards!", [
        { text: "OK", onPress: () => goBack() }
      ]);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header & Progress Bar */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => goBack()}>
          <Ionicons name="close" size={30} color="#afafaf" />
        </TouchableOpacity>
        
        <View style={styles.progressBar}>
          <Animated.View 
            style={[styles.progressFill, { width: `${((currentIndex + 1) / totalCards) * 100}%` }]} 
          />
        </View>
        <Text style={styles.headerCounter}>{currentIndex + 1}/{totalCards}</Text>
      </View>

      {/* Main Flashcard */}
      <View style={styles.cardArea}>
        <TouchableOpacity activeOpacity={1} onPress={handleFlip} style={styles.cardWrapper}>
          
          <Animated.View style={[styles.card, frontAnimatedStyle]}>
            <Image source={{ uri: currentCard.imageUrl }} style={styles.image} />
            <Text style={styles.wordText}>{currentCard.word}</Text>
            <Text style={styles.flipHint}>Chạm thẻ để xem nghĩa</Text>
          </Animated.View>

          <Animated.View style={[styles.card, styles.cardBack, backAnimatedStyle]}>
            <Text style={styles.phoneticText}>{currentCard.phonetic}</Text>
            <Text style={styles.meaningText}>{currentCard.meaning}</Text>
            <Text style={styles.flipHint}>Chạm lại để xem từ</Text>
          </Animated.View>

        </TouchableOpacity>
      </View>

      {/* Footer Buttons */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.soundBtn} onPress={handlePlayAudio}>
          <Ionicons name="volume-high" size={32} color="#fff" />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.continueBtn} onPress={handleContinue}>
          <View style={styles.btnShadow} />
          <View style={styles.btnTop}>
            <Text style={styles.continueText}>{currentIndex < totalCards - 1 ? 'THẺ TIẾP THEO' : 'HOÀN THÀNH'}</Text>
          </View>
        </TouchableOpacity>
      </View>

      <Text style={styles.counterText}>{currentIndex + 1} / {totalCards}</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f4f8' },
  centerState: { justifyContent: 'center', alignItems: 'center', padding: 24 },
  stateTitle: { fontSize: 20, fontWeight: 'bold', color: '#3c3c3c', marginBottom: 8, textAlign: 'center' },
  stateText: { fontSize: 14, color: '#777', textAlign: 'center', lineHeight: 20, marginTop: 10 },
  retryBtn: { marginTop: 16, backgroundColor: '#58cc02', borderRadius: 14, paddingHorizontal: 18, paddingVertical: 12 },
  retryBtnText: { color: '#fff', fontWeight: 'bold' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20 },
  progressBar: { flex: 1, height: 12, backgroundColor: '#e5e5e5', borderRadius: 10, marginLeft: 15, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#58cc02' },
  headerCounter: { marginLeft: 10, color: '#777', fontWeight: 'bold' },
  cardArea: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  cardWrapper: { width: '100%', height: 450 },
  card: {
    position: 'absolute', width: '100%', height: '100%', backgroundColor: '#fff', borderRadius: 30,
    padding: 20, alignItems: 'center', justifyContent: 'center',
    backfaceVisibility: 'hidden', elevation: 5, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10,
    borderWidth: 2, borderColor: '#e5e5e5'
  },
  cardBack: { backgroundColor: '#fdfdfd' },
  image: { width: '100%', height: '75%', borderRadius: 20, marginBottom: 15 },
  wordText: { fontSize: 36, fontWeight: 'bold', color: '#3c3c3c' },
  flipHint: { marginTop: 12, color: '#afafaf', fontWeight: '600' },
  phoneticText: { fontSize: 22, color: '#afafaf', marginBottom: 10 },
  meaningText: { fontSize: 32, fontWeight: 'bold', color: '#58cc02' },

  footer: { flexDirection: 'row', padding: 20, gap: 15, alignItems: 'center' },
  soundBtn: { width: 65, height: 60, borderRadius: 20, backgroundColor: '#1cb0f6', justifyContent: 'center', alignItems: 'center', elevation: 2 },
  continueBtn: { flex: 1, height: 65 },
  btnShadow: { position: 'absolute', width: '100%', height: '100%', backgroundColor: '#46a302', borderRadius: 20, marginTop: 4 },
  btnTop: { flex: 1, backgroundColor: '#58cc02', borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  continueText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  counterText: { textAlign: 'center', color: '#afafaf', fontWeight: 'bold', marginBottom: 15 }
});

