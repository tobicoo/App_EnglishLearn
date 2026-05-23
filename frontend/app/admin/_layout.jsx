import { useAuth } from '@/context/AuthContext';
import { Stack, useRouter } from 'expo-router';
import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

function AdminGuard({ children }) {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();

  if (isLoading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator color="#1cb0f6" size="large" />
      </SafeAreaView>
    );
  }

  if (!user?.isAdmin && user?.role !== 'ADMIN') {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={styles.lockIcon}>🔒</Text>
        <Text style={styles.blockedTitle}>Chỉ admin mới được truy cập</Text>
        <Text style={styles.blockedText}>Đăng nhập bằng tài khoản admin để mở trang quản trị.</Text>
        <Pressable style={styles.primaryBtn} onPress={() => router.replace('/login')}>
          <Text style={styles.primaryBtnText}>Đăng nhập admin</Text>
        </Pressable>
        {user && (
          <Pressable style={styles.secondaryBtn} onPress={async () => { await logout(); router.replace('/'); }}>
            <Text style={styles.secondaryBtnText}>Đăng xuất tài khoản hiện tại</Text>
          </Pressable>
        )}
      </SafeAreaView>
    );
  }

  return children;
}

export default function AdminLayout() {
  return (
    <AdminGuard>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="content-manager" />
        <Stack.Screen name="system-settings" />
        <Stack.Screen name="activity-log" />
      </Stack>
    </AdminGuard>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, backgroundColor: '#f8f9fa' },
  lockIcon: { fontSize: 48, marginBottom: 16 },
  blockedTitle: { fontSize: 20, fontWeight: 'bold', color: '#3c3c3c', textAlign: 'center', marginBottom: 8 },
  blockedText: { fontSize: 14, color: '#afafaf', textAlign: 'center', lineHeight: 20, marginBottom: 20 },
  primaryBtn: { backgroundColor: '#1cb0f6', borderRadius: 16, paddingHorizontal: 24, paddingVertical: 14, marginBottom: 10 },
  primaryBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  secondaryBtn: { borderWidth: 2, borderColor: '#1cb0f6', borderRadius: 16, paddingHorizontal: 24, paddingVertical: 12 },
  secondaryBtnText: { color: '#1cb0f6', fontWeight: 'bold', fontSize: 14 },
});
