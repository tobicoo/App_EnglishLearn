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
      <SafeAreaView style={styles.container}>
        <View style={styles.centerState}>
          <Text style={styles.stateText}>Đang tải...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <Image 
            source={require('../assets/images/logo.jpg')} 
            style={styles.logoImage} 
            resizeMode="contain" 
          />
        </View>
        <Text style={styles.logoText}>English</Text>
        <Text style={styles.slogan}>Học tập thật phong cách và đầy cá tính!</Text>
      </View>

      <View style={styles.footer}>
        <KuromiButton 
          title="Bắt đầu ngay" 
          onPress={() => router.replace('/register')} 
        />
        <KuromiButton 
          title="Tôi đã có tài khoản" 
          color="#fff" shadowColor="#e5e5e5" textColor="#ff4081"
          onPress={() => router.replace('/login')} 
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 30 },
  logoContainer: { width: 150, height: 150, marginBottom: 20 },
  logoImage: { width: '100%', height: '100%' },
  logoText: { fontSize: 45, fontWeight: 'bold', color: '#111' },
  slogan: { fontSize: 18, textAlign: 'center', color: '#888', marginTop: 15 },
  footer: { padding: 25, gap: 10, marginBottom: 20 },
  centerState: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  stateText: { fontSize: 16, color: '#888' },
});
