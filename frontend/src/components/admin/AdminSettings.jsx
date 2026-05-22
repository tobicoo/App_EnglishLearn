import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

const showValue = (value) => (value === null || value === undefined ? '' : String(value));

function Field({ label, value, onChangeText, keyboardType = 'default' }) {
  return (
    <View style={styles.fieldBlock}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        placeholderTextColor="#8a8f99"
      />
    </View>
  );
}

export default function AdminSettings({ heartbeatSeconds, onChangeHeartbeat, onSave, saving }) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Interval hồi tim</Text>
      <Text style={styles.helpText}>Nhập số giây cho mỗi lần hồi 1 tim. Ví dụ 120 là 2 phút.</Text>
      <Field label="Số giây" value={heartbeatSeconds} onChangeText={onChangeHeartbeat} keyboardType="number-pad" />
      <Pressable style={[styles.primaryButton, saving && styles.disabledButton]} onPress={onSave} disabled={saving}>
        <Text style={styles.primaryButtonText}>{saving ? 'Đang lưu...' : 'Lưu interval'}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: 16, borderRadius: 24, backgroundColor: '#fff', borderWidth: 1, borderColor: '#E7E0EC', padding: 16, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 2 },
  cardTitle: { fontSize: 18, fontWeight: '900', color: '#1D1B20', marginBottom: 8 },
  helpText: { fontSize: 13, lineHeight: 20, color: '#625B71', marginBottom: 10 },
  fieldBlock: { marginTop: 10 },
  fieldLabel: { fontSize: 13, fontWeight: '800', color: '#49454F', marginBottom: 6 },
  input: { minHeight: 48, borderWidth: 1, borderColor: '#CAC4D0', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, color: '#1D1B20', fontSize: 15, backgroundColor: '#FFFBFE' },
  primaryButton: { minHeight: 48, marginTop: 14, borderRadius: 16, backgroundColor: '#6750A4', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 18 },
  disabledButton: { backgroundColor: '#E7E0EC' },
  primaryButtonText: { color: '#fff', fontSize: 15, fontWeight: '900' },
});
