import KuromiButton from '@/components/common/KuromiButton';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function WelcomeScreen() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && user) {
      router.replace(user.isAdmin || user.role === 'ADMIN' ? '/admin' : '/(tabs)/home');
    }
  }, [isLoading, user, router]);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centerState}>
          <Text style={styles.loadingText}>Đang tải...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Top section — hero */}
      <View style={styles.hero}>
        {/* Decorative circles */}
        <View style={styles.circleTopLeft} />
        <View style={styles.circleBottomRight} />

        <View style={styles.logoWrap}>
          <Image
            source={require('../assets/images/logo.jpg')}
            style={styles.logoImg}
            resizeMode="contain"
          />
        </View>

        <Text style={styles.appName}>English Learn</Text>
        <Text style={styles.slogan}>Học tập thật phong cách{'\n'}và đầy cá tính! ✨</Text>

        {/* Feature pills */}
        <View style={styles.pillRow}>
          <View style={styles.pill}><Text style={styles.pillText}>📚 Bài học</Text></View>
          <View style={styles.pill}><Text style={styles.pillText}>🏆 Xếp hạng</Text></View>
          <View style={styles.pill}><Text style={styles.pillText}>🃏 Flashcard</Text></View>
        </View>
      </View>

      {/* Bottom card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Bắt đầu hành trình của bạn</Text>
        <Text style={styles.cardSub}>Tham gia cùng hàng nghìn người học tiếng Anh mỗi ngày</Text>

        <KuromiButton
          title="Tạo tài khoản mới"
          onPress={() => router.replace('/register')}
          color="#7c3aed"
          shadowColor="#5b21b6"
        />
        <KuromiButton
          title="Tôi đã có tài khoản"
          onPress={() => router.replace('/login')}
          color="#fff"
          shadowColor="#e0d7ff"
          textColor="#7c3aed"
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#7c3aed' },
  centerState: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { fontSize: 16, color: 'rgba(255,255,255,0.8)' },

  hero: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
    position: 'relative',
    overflow: 'hidden',
  },

  circleTopLeft: {
    position: 'absolute',
    top: -60,
    left: -60,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  circleBottomRight: {
    position: 'absolute',
    bottom: -40,
    right: -40,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },

  logoWrap: {
    width: 110,
    height: 110,
    borderRadius: 32,
    backgroundColor: '#fff',
    padding: 10,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 10,
    overflow: 'hidden',
  },
  logoImg: { width: '100%', height: '100%', borderRadius: 22 },

  appName: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  slogan: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 28,
  },

  pillRow: {
    flexDirection: 'row',
    gap: 10,
  },
  pill: {
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  pillText: { color: '#fff', fontSize: 13, fontWeight: '600' },

  card: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 28,
    paddingTop: 32,
    paddingBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 8,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e1e2e',
    marginBottom: 6,
    textAlign: 'center',
  },
  cardSub: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
});
