import React, { useState, useCallback } from 'react';
import { ScrollView, View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { getSectionsWithUnits } from '@/services/api';
import { useAuth } from '@/context/AuthContext';

const UnitCircle = ({ index, unitId, status }) => {
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
        style={[styles.shadow, status === 'locked' && { backgroundColor: '#afafaf' }]}
      >
        <View style={[styles.top, status === 'locked' && { backgroundColor: '#e5e5e5' }]}>
          <Text style={{ fontSize: 25, color: '#fff' }}>
            {status === 'done' ? '✔️' : status === 'locked' ? '🔒' : '⭐'}
          </Text>
        </View>
      </TouchableOpacity>
    </View>
  );
};

export default function HomeScreen() {
  const { user } = useAuth();
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [user?.id])
  );

  const loadData = async () => {
    if (!user?.id) return;
    const { data, error } = await getSectionsWithUnits(user.id);
    if (error) {
      Alert.alert('Lỗi', error);
    } else {
      setSections(data);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#CE82FF" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        {sections.map((section) => (
          <View key={section.id}>
            <View style={styles.banner}>
              <Text style={styles.bannerTitle}>{section.title}</Text>
              <Text style={styles.bannerSub}>{section.subTitle}</Text>
            </View>
            <View style={{ alignItems: 'flex-start', paddingLeft: 50 }}>
              {section.units.map((unit, i) => (
                <UnitCircle key={unit.id} index={i} unitId={unit.id} status={unit.type} />
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
});
