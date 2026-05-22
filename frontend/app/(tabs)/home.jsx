import React, { useState, useCallback } from 'react';
import { ScrollView, View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { getSectionsWithUnits } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';

const UnitCircle = ({ index, unitId, status, theme }) => {
  const router = useRouter();
  const zigzagMap = [0, 45, 90, 45, 0];
  const marginLeft = zigzagMap[index % 5];

  const handlePress = () => {
    if (status !== 'locked') {
      router.push({ pathname: '/quiz', params: { unitId } });
    }
  };

  return (
    <View style={{ marginLeft, marginBottom: 25 }}>
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={handlePress}
        style={[styles.shadow, status === 'locked' && styles.lockedShadow]}
      >
        <View style={[styles.top, status === 'done' && styles.doneTop, status === 'locked' && styles.lockedTop]}>
          <Text style={styles.unitIcon}>{status === 'done' ? '✓' : status === 'locked' ? '🔒' : '★'}</Text>
        </View>
      </TouchableOpacity>
      <Text style={[styles.unitStatus, { color: theme.textSecondary }]}>
        {status === 'done' ? 'Đã xong' : status === 'locked' ? 'Đã khóa' : 'Sẵn sàng'}
      </Text>
    </View>
  );
};

export default function HomeScreen() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [user?.id])
  );

  const loadData = async () => {
    setLoading(true);
    setErrorMessage('');
    if (!user?.id) {
      setSections([]);
      setErrorMessage('Bạn cần đăng nhập để xem lộ trình học.');
      setLoading(false);
      return;
    }
    const { data, error } = await getSectionsWithUnits();
    if (error) {
      setErrorMessage(error);
      setSections([]);
    } else {
      setSections(data);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center', backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color="#CE82FF" />
        <Text style={[styles.stateText, { color: theme.textSecondary }]}>Đang tải lộ trình học...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        {errorMessage ? (
          <View style={[styles.stateCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={[styles.stateTitle, { color: theme.text }]}>Chưa tải được bài học</Text>
            <Text style={[styles.stateText, { color: theme.textSecondary }]}>{errorMessage}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={loadData}>
              <Text style={styles.retryBtnText}>Thử lại</Text>
            </TouchableOpacity>
          </View>
        ) : sections.length === 0 ? (
          <View style={[styles.stateCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={[styles.stateTitle, { color: theme.text }]}>Chưa có lộ trình học</Text>
            <Text style={[styles.stateText, { color: theme.textSecondary }]}>Khi có section và unit, bạn sẽ thấy đường học ở đây.</Text>
          </View>
        ) : sections.map((section) => (
          <View key={section.id}>
            <View style={styles.banner}>
              <Text style={styles.bannerTitle}>{section.title}</Text>
              <Text style={styles.bannerSub}>{section.subTitle}</Text>
            </View>
            <View style={{ alignItems: 'flex-start', paddingLeft: 50 }}>
              {section.units.map((unit, i) => (
                <UnitCircle key={unit.id} index={i} unitId={unit.id} status={unit.type} theme={theme} />
              ))}
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  banner: { backgroundColor: '#CE82FF', padding: 20, margin: 15, borderRadius: 15 },
  bannerTitle: { color: '#fff', fontWeight: 'bold', opacity: 0.8 },
  bannerSub: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  shadow: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#a34fdb' },
  top: { width: 80, height: 72, borderRadius: 40, backgroundColor: '#CE82FF', justifyContent: 'center', alignItems: 'center' },
  doneTop: { backgroundColor: '#58cc02' },
  lockedShadow: { backgroundColor: '#8a8a8a' },
  lockedTop: { backgroundColor: '#d8d8d8' },
  unitIcon: { fontSize: 25, color: '#fff', fontWeight: 'bold' },
  unitStatus: { marginTop: 8, width: 80, textAlign: 'center', fontSize: 12, fontWeight: '600' },
  stateCard: { margin: 20, padding: 20, borderRadius: 18, borderWidth: 1, alignItems: 'center' },
  stateTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 8 },
  stateText: { fontSize: 14, textAlign: 'center', lineHeight: 20, marginTop: 10 },
  retryBtn: { marginTop: 16, backgroundColor: '#CE82FF', borderRadius: 14, paddingHorizontal: 18, paddingVertical: 12 },
  retryBtnText: { color: '#fff', fontWeight: 'bold' },
});
