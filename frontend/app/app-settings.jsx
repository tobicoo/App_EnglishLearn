import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '@/context/ThemeContext';
import { useRoleBack } from '@/navigation/roleBack';
import { useEffect, useState } from 'react';
import {
  Alert, ScrollView, StyleSheet, Switch,
  Text, TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const PREFS_KEY = 'app_preferences';

const defaultPrefs = {
  soundEffects: true,
  animations: true,
  motivationalMessages: true,
  listeningExercises: false,
};

const ToggleRow = ({ icon, label, value, onValueChange, theme, last = false }) => (
  <View style={[styles.row, { borderBottomColor: theme.border, borderBottomWidth: last ? 0 : 1 }]}>
    <View style={styles.rowLeft}>
      <Text style={styles.rowIcon}>{icon}</Text>
      <Text style={[styles.rowLabel, { color: theme.text }]}>{label}</Text>
    </View>
    <Switch
      value={value}
      onValueChange={onValueChange}
      trackColor={{ false: '#ccc', true: '#CE82FF' }}
      thumbColor={value ? '#fff' : '#f4f3f4'}
    />
  </View>
);

export default function AppSettingsScreen() {
  const { goBack } = useRoleBack('/(tabs)/settings');
  const { isDark, toggleTheme, theme } = useTheme();
  const [prefs, setPrefs] = useState(defaultPrefs);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(PREFS_KEY).then((val) => {
      if (val) {
        try { setPrefs({ ...defaultPrefs, ...JSON.parse(val) }); } catch { /* ignore */ }
      }
    });
  }, []);

  const updatePref = (key, value) => setPrefs((p) => ({ ...p, [key]: value }));

  const handleSave = async () => {
    setSaving(true);
    await AsyncStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
    setSaving(false);
    Alert.alert('Đã lưu', 'Cài đặt đã được cập nhật.');
    goBack();
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.border, backgroundColor: theme.surface }]}>
        <TouchableOpacity onPress={() => goBack()} style={styles.backBtn}>
          <Text style={[styles.backText, { color: '#1cb0f6' }]}>‹ Quay lại</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Cài đặt</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <ToggleRow
            icon={isDark ? '🌙' : '☀️'}
            label={`Dark Mode (${isDark ? 'Enabled' : 'Disabled'})`}
            value={isDark}
            onValueChange={toggleTheme}
            theme={theme}
          />
          <ToggleRow
            icon="🔊"
            label="Sound effects"
            value={prefs.soundEffects}
            onValueChange={(v) => updatePref('soundEffects', v)}
            theme={theme}
          />
          <ToggleRow
            icon="✨"
            label="Animations"
            value={prefs.animations}
            onValueChange={(v) => updatePref('animations', v)}
            theme={theme}
          />
          <ToggleRow
            icon="💬"
            label="Motivational messages"
            value={prefs.motivationalMessages}
            onValueChange={(v) => updatePref('motivationalMessages', v)}
            theme={theme}
          />
          <ToggleRow
            icon="🎧"
            label="Listening exercises"
            value={prefs.listeningExercises}
            onValueChange={(v) => updatePref('listeningExercises', v)}
            theme={theme}
            last
          />
        </View>

        <TouchableOpacity
          style={[styles.saveBtn, saving && styles.disabledBtn]}
          onPress={handleSave}
          disabled={saving}
        >
          <Text style={styles.saveBtnText}>{saving ? 'Đang lưu...' : 'Lưu cài đặt'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1,
  },
  backBtn: { width: 80 },
  backText: { fontSize: 16, fontWeight: '600' },
  headerTitle: { fontSize: 17, fontWeight: 'bold' },
  scroll: { padding: 20, paddingBottom: 100 },
  card: {
    borderRadius: 20, borderWidth: 1, overflow: 'hidden',
  },
  row: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 16, paddingHorizontal: 18,
  },
  rowLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 12 },
  rowIcon: { fontSize: 20, width: 32 },
  rowLabel: { fontSize: 15, fontWeight: '500' },
  saveBtn: {
    marginTop: 24, backgroundColor: '#CE82FF',
    borderRadius: 16, paddingVertical: 16, alignItems: 'center',
  },
  disabledBtn: { opacity: 0.6 },
  saveBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});

