import { useLanguage } from '@/context/LanguageContext';
import { useTheme } from '@/context/ThemeContext';
import { useRoleBack } from '@/navigation/roleBack';
import {
  Alert, ScrollView, StyleSheet, Text,
  TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const CURRENT_LANGS = [
  { code: 'vi', label: 'Tiếng Việt', flag: '🇻🇳' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
];

const MORE_LANGS = [
  { code: 'ja', label: '日本語 (Tiếng Nhật)', flag: '🇯🇵' },
  { code: 'fr', label: 'Français (Tiếng Pháp)', flag: '🇫🇷' },
  { code: 'it', label: 'Italiano (Tiếng Ý)', flag: '🇮🇹' },
  { code: 'ko', label: '한국어 (Tiếng Hàn)', flag: '🇰🇷' },
  { code: 'zh', label: '中文 (Tiếng Trung)', flag: '🇨🇳' },
];

export default function LanguageScreen() {
  const { goBack } = useRoleBack('/(tabs)/settings');
  const { theme } = useTheme();
  const { lang, setLanguage, t } = useLanguage();

  const handleSelect = async (code) => {
    if (code !== 'vi' && code !== 'en') {
      Alert.alert('Sắp ra mắt', 'Ngôn ngữ này chưa được hỗ trợ.');
      return;
    }
    await setLanguage(code);
    Alert.alert(t('language_saved_title'), t('language_saved_msg'));
    goBack();
  };

  const LangItem = ({ item, disabled }) => {
    const isActive = lang === item.code;
    return (
      <TouchableOpacity
        style={[
          styles.langItem,
          {
            borderColor: isActive ? '#CE82FF' : theme.border,
            backgroundColor: isActive ? '#CE82FF' : disabled ? theme.card : theme.surface,
            opacity: disabled ? 0.5 : 1,
          },
        ]}
        onPress={() => handleSelect(item.code)}
        activeOpacity={0.8}
      >
        <Text style={styles.langFlag}>{item.flag}</Text>
        <View style={{ flex: 1 }}>
          <Text style={[styles.langLabel, { color: isActive ? '#fff' : theme.text }]}>
            {item.label}
          </Text>
          {disabled && (
            <Text style={[styles.comingSoon, { color: isActive ? '#ffffffaa' : theme.textSecondary }]}>
              Sắp ra mắt
            </Text>
          )}
        </View>
        {isActive && <Text style={styles.checkMark}>✓</Text>}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { borderBottomColor: theme.border, backgroundColor: theme.surface }]}>
        <TouchableOpacity onPress={() => goBack()} style={styles.backBtn}>
          <Text style={[styles.backText, { color: '#1cb0f6' }]}>{t('back')}</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>{t('language_title')}</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={[styles.sectionLabel, { color: theme.text }]}>{t('language_current')}</Text>
        <View style={styles.langList}>
          {CURRENT_LANGS.map((item) => (
            <LangItem key={item.code} item={item} disabled={false} />
          ))}
        </View>

        <Text style={[styles.sectionLabel, { color: theme.text, marginTop: 24 }]}>{t('language_more')}</Text>
        <View style={styles.langList}>
          {MORE_LANGS.map((item) => (
            <LangItem key={item.code} item={item} disabled />
          ))}
        </View>
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
  sectionLabel: { fontSize: 16, fontWeight: 'bold', marginBottom: 12 },
  langList: { gap: 10 },
  langItem: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 2, borderRadius: 14, padding: 16,
  },
  langFlag: { fontSize: 22, marginRight: 12 },
  langLabel: { fontSize: 16, fontWeight: '500' },
  comingSoon: { fontSize: 12, marginTop: 2 },
  checkMark: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
});

