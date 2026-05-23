import { AuthProvider } from '@/context/AuthContext';
import { RoleBackHardwareGuard, RoleBackProvider } from '@/navigation/roleBack';
import { LanguageProvider } from '@/context/LanguageContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <LanguageProvider>
            <RoleBackProvider>
              <RoleBackHardwareGuard />
              <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="login" />
            <Stack.Screen name="register" />
            <Stack.Screen name="admin" />
            <Stack.Screen name="flashcard" />
            <Stack.Screen name="quiz" />
            <Stack.Screen name="profile-info" />
            <Stack.Screen name="change-password" />
            <Stack.Screen name="language" />
            <Stack.Screen name="app-settings" />
            <Stack.Screen name="notifications" />
            <Stack.Screen name="history" />
            <Stack.Screen name="create-exam" />
            <Stack.Screen name="saved-exams" />
            <Stack.Screen name="payment" />
          </Stack>
            </RoleBackProvider>
          </LanguageProvider>
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

