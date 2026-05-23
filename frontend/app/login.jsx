import KuromiButton from '@/components/common/KuromiButton';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function LoginScreen() {
  const router = useRouter();
  const { login, user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && user) {
      router.replace(user.isAdmin || user.role === 'ADMIN' ? '/admin' : '/(tabs)/home');
    }
  }, [isLoading, user, router]);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Lỗi', 'Vui lòng nhập đầy đủ email và mật khẩu');
      return;
    }

    setLoading(true);
    const { data, error } = await login(email, password);
    setLoading(false);

    if (error) {
      Alert.alert('Lỗi', error);
      return;
    }

    if (data) {
      router.replace(data.isAdmin || data.role === 'ADMIN' ? '/admin' : '/(tabs)/home');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          {/* Gradient Header */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.backBtn} onPress={() => router.replace('/')}>
              <Text style={styles.backBtnText}>←</Text>
            </TouchableOpacity>

            <View style={styles.logoWrap}>
              <Image
                source={require('../assets/images/logo.jpg')}
                style={styles.logoImg}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.appName}>English Learn</Text>
            <Text style={styles.tagline}>Chào mừng trở lại! 👋</Text>
          </View>

          {/* Form Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Đăng nhập</Text>

            <View style={styles.inputWrap}>
              <Text style={styles.inputIcon}>📧</Text>
              <TextInput
                placeholder="Email"
                style={styles.input}
                placeholderTextColor="#bbb"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputWrap}>
              <Text style={styles.inputIcon}>🔒</Text>
              <TextInput
                placeholder="Mật khẩu"
                secureTextEntry={!showPassword}
                style={[styles.input, { flex: 1 }]}
                placeholderTextColor="#bbb"
                value={password}
                onChangeText={setPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                <Text style={styles.eyeIcon}>{showPassword ? '🙈' : '👁️'}</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.forgotWrap}>
              <Text style={styles.forgotText}>Quên mật khẩu?</Text>
            </TouchableOpacity>

            <KuromiButton
              title={loading ? 'Đang xử lý...' : 'Đăng nhập'}
              onPress={handleLogin}
              color="#7c3aed"
              shadowColor="#5b21b6"
              style={styles.loginBtn}
            />

            <View style={styles.registerRow}>
              <Text style={styles.registerHint}>Chưa có tài khoản? </Text>
              <TouchableOpacity onPress={() => router.replace('/register')}>
                <Text style={styles.registerLink}>Đăng ký ngay</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#7c3aed' },
  flex: { flex: 1 },
  scroll: { flexGrow: 1 },

  header: {
    backgroundColor: '#7c3aed',
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 40,
    paddingHorizontal: 24,
    position: 'relative',
  },
  backBtn: {
    position: 'absolute',
    top: 10,
    left: 20,
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backBtnText: { fontSize: 20, color: '#fff', fontWeight: 'bold' },

  logoWrap: {
    width: 90,
    height: 90,
    borderRadius: 28,
    backgroundColor: '#fff',
    padding: 8,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
    overflow: 'hidden',
  },
  logoImg: { width: '100%', height: '100%', borderRadius: 20 },
  appName: { fontSize: 26, fontWeight: 'bold', color: '#fff', letterSpacing: 0.5 },
  tagline: { fontSize: 15, color: 'rgba(255,255,255,0.85)', marginTop: 6 },

  card: {
    flex: 1,
    backgroundColor: '#fff',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 28,
    paddingTop: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 8,
  },
  cardTitle: { fontSize: 22, fontWeight: 'bold', color: '#1e1e2e', marginBottom: 24 },

  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f3ff',
    borderWidth: 1.5,
    borderColor: '#e0d7ff',
    borderRadius: 16,
    paddingHorizontal: 14,
    marginBottom: 14,
    height: 56,
  },
  inputIcon: { fontSize: 18, marginRight: 10 },
  input: { flex: 1, fontSize: 16, color: '#1e1e2e' },
  eyeBtn: { padding: 4 },
  eyeIcon: { fontSize: 18 },

  forgotWrap: { alignSelf: 'flex-end', marginBottom: 20 },
  forgotText: { color: '#7c3aed', fontWeight: '600', fontSize: 14 },

  loginBtn: { marginTop: 4 },

  registerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
    marginBottom: 8,
  },
  registerHint: { color: '#888', fontSize: 15 },
  registerLink: { color: '#7c3aed', fontWeight: 'bold', fontSize: 15 },
});
