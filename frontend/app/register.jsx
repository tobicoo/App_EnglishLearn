import { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import KuromiButton from '@/components/common/KuromiButton';
import { register } from '@/services/api';
import { saveUserId } from '@/services/auth';

export default function RegisterScreen() {
  const router = useRouter();
  const [age, setAge] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!email || !password) {
      Alert.alert('Lỗi', 'Vui lòng nhập email và mật khẩu');
      return;
    }

    setLoading(true);
    const { data: user, error } = await register({ name, email, password, age });
    setLoading(false);

    if (error) {
      Alert.alert('Lỗi', error);
      return;
    }

    if (user && user.id) {
      await saveUserId(user.id);
      Alert.alert('Thành công', 'Tạo tài khoản thành công!', [
        { text: 'OK', onPress: () => router.replace('/(tabs)/home') }
      ]);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.closeBtn}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tạo hồ sơ</Text>
        <View style={{ width: 20 }} />
      </View>

      <View style={styles.form}>
        <TextInput
          placeholder="Tuổi"
          keyboardType="numeric"
          style={styles.input}
          placeholderTextColor="#aaa"
          value={age}
          onChangeText={setAge}
        />
        <TextInput
          placeholder="Tên (Tùy chọn)"
          style={styles.input}
          placeholderTextColor="#aaa"
          value={name}
          onChangeText={setName}
        />
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
          title={loading ? "Đang xử lý..." : "Tạo tài khoản"}
          color="#111" shadowColor="#000"
          style={{ marginTop: 20 }}
          onPress={handleRegister}
        />
      </View>

      <Text style={styles.terms}>
        Bằng việc đăng ký, bạn đồng ý với các Điều khoản & Chính sách của Kuromi.
      </Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20 },
  closeBtn: { fontSize: 24, color: '#ccc', fontWeight: 'bold' },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#4b4b4b' },
  form: { padding: 25 },
  input: { backgroundColor: '#f7f7f7', borderWidth: 2, borderColor: '#e5e5e5', borderRadius: 16, padding: 15, fontSize: 16, marginBottom: 15 },
  terms: { textAlign: 'center', color: '#aaa', paddingHorizontal: 40, fontSize: 13, lineHeight: 18 },
});
