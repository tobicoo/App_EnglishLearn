import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withTiming } from 'react-native-reanimated';
import { getAllFlashcards } from '@/services/api';
import { FLASHCARDS as FALLBACK_FLASHCARDS } from '@/constants/flashcardData';

export default function FlashcardScreen() {
  const router = useRouter();
  
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  // TẤT CẢ hooks phải ở TRÊN cùng, trước mọi early return
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
    const { data, error } = await getAllFlashcards();
    if (error || !data || data.length === 0) {
      setCards(FALLBACK_FLASHCARDS);
    } else {
      setCards(data);
    }
    setLoading(false);
  };

  // Early return SAU tất cả hooks
  if (loading || cards.length === 0) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#58cc02" />
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
        { text: "OK", onPress: () => router.back() }
      ]);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header & Progress Bar */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={30} color="#afafaf" />
        </TouchableOpacity>
        
        <View style={styles.progressBar}>
          <Animated.View 
            style={[styles.progressFill, { width: `${((currentIndex + 1) / totalCards) * 100}%` }]} 
          />
        </View>
      </View>

      {/* Main Flashcard */}
      <View style={styles.cardArea}>
        <TouchableOpacity activeOpacity={1} onPress={handleFlip} style={styles.cardWrapper}>
          
          <Animated.View style={[styles.card, frontAnimatedStyle]}>
            <Image source={{ uri: currentCard.imageUrl }} style={styles.image} />
            <Text style={styles.wordText}>{currentCard.word}</Text>
          </Animated.View>

          <Animated.View style={[styles.card, styles.cardBack, backAnimatedStyle]}>
            <Text style={styles.phoneticText}>{currentCard.phonetic}</Text>
            <Text style={styles.meaningText}>{currentCard.meaning}</Text>
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
            <Text style={styles.continueText}>TIẾP TỤC</Text>
          </View>
        </TouchableOpacity>
      </View>

      <Text style={styles.counterText}>{currentIndex + 1} / {totalCards}</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f4f8' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20 },
  progressBar: { flex: 1, height: 12, backgroundColor: '#e5e5e5', borderRadius: 10, marginLeft: 15, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#58cc02' },
  
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
