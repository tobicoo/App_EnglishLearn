import KuromiButton from '@/components/common/KuromiButton';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

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
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.closeBtn}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Đăng nhập</Text>
        <View style={{ width: 20 }} />
      </View>

      <View style={styles.form}>
        <TextInput
          placeholder="Email"
          style={styles.input}
          placeholderTextColor="#aaa"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <TextInput
          placeholder="Mật khẩu"
          secureTextEntry
          style={styles.input}
          placeholderTextColor="#aaa"
          value={password}
          onChangeText={setPassword}
        />

        <KuromiButton
          title={loading ? "Đang xử lý..." : "Đăng nhập"}
          onPress={handleLogin}
        />

        <TouchableOpacity style={styles.forgotPass}>
          <Text style={styles.forgotText}>QUÊN MẬT KHẨU?</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20 },
  closeBtn: { fontSize: 24, color: '#ccc', fontWeight: 'bold' },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#4b4b4b' },
  form: { padding: 25, flex: 1 },
  input: { backgroundColor: '#f7f7f7', borderWidth: 2, borderColor: '#e5e5e5', borderRadius: 16, padding: 15, fontSize: 16, marginBottom: 15 },
  forgotPass: { marginTop: 25, alignItems: 'center' },
  forgotText: { color: '#1cb0f6', fontWeight: 'bold', letterSpacing: 1 },
});
