import { Tabs } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/context/AuthContext';

export default function TabLayout() {
  const { user } = useAuth();

  return (
    <View style={{ flex: 1 }}>
      <SafeAreaView style={styles.header}>
        <View style={styles.headerRow}>
          <Text style={styles.stat}>🇺🇸</Text>
          <Text style={styles.stat}>🔥 {user?.streak || 0}</Text>
          <Text style={styles.stat}>💎 {user?.gems || 0}</Text>
          <Text style={styles.stat}>❤️ {user?.hearts || 0}</Text>
        </View>
      </SafeAreaView>

      <Tabs screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#1cb0f6',
        tabBarStyle: styles.tabBar,
      }}>
        <Tabs.Screen name="home" options={{ title: 'Học tập', tabBarIcon: () => <Text style={{ fontSize: 20 }}>📚</Text> }} />
        <Tabs.Screen name="leaderboard" options={{ title: 'Xếp hạng', tabBarIcon: () => <Text style={{ fontSize: 20 }}>🏆</Text> }} />
        <Tabs.Screen name="profile" options={{ title: 'Hồ sơ', tabBarIcon: () => <Text style={{ fontSize: 20 }}>👤</Text> }} />
      </Tabs>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { backgroundColor: '#fff', borderBottomWidth: 2, borderBottomColor: '#e5e5e5' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-around', padding: 10 },
  stat: { fontWeight: 'bold', fontSize: 14 },
  tabBar: { height: 60, borderTopWidth: 2, borderTopColor: '#e5e5e5' },
});
