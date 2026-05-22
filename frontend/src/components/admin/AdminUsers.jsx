import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

const showValue = (value) => (value === null || value === undefined ? '' : String(value));

function Field({ label, value, onChangeText }) {
  return (
    <View style={styles.fieldBlock}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholderTextColor="#8a8f99"
      />
    </View>
  );
}

function UserStatBadge({ emoji, value, label }) {
  return (
    <View style={styles.badge}>
      <Text style={styles.badgeEmoji}>{emoji}</Text>
      <Text style={styles.badgeValue}>{value}</Text>
      <Text style={styles.badgeLabel}>{label}</Text>
    </View>
  );
}

export default function AdminUsers({ users, passwordByUserId, onPasswordChange, onSavePassword, onResetProgress, savingKey }) {
  const [query, setQuery] = useState('');

  const filteredUsers = query.trim()
    ? users.filter((u) =>
        (u.name || '').toLowerCase().includes(query.toLowerCase()) ||
        (u.email || '').toLowerCase().includes(query.toLowerCase())
      )
    : users;

  const confirmReset = (targetUser) => {
    Alert.alert(
      'Reset tiến trình',
      `Xóa toàn bộ dữ liệu học tập của ${targetUser.email}? Tài khoản sẽ trở về như mới.`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => onResetProgress(targetUser),
        },
      ]
    );
  };

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Danh sách người dùng</Text>
      <TextInput
        style={styles.searchInput}
        value={query}
        onChangeText={setQuery}
        placeholder="Tìm theo tên hoặc email..."
        placeholderTextColor="#8a8f99"
      />
      <Text style={styles.countLabel}>{filteredUsers.length} người dùng</Text>
      {filteredUsers.map((targetUser) => (
        <View key={targetUser.id} style={styles.userCard}>
          <View style={styles.userHeader}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>{(targetUser.name || targetUser.email || '?').slice(0, 1).toUpperCase()}</Text>
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{targetUser.name}</Text>
              <Text style={styles.userEmail}>{targetUser.email}</Text>
              <View style={styles.badgesRow}>
                <UserStatBadge emoji="🔥" value={targetUser.streak ?? 0} label="Streak" />
                <UserStatBadge emoji="💎" value={targetUser.gems ?? 0} label="Gems" />
                <UserStatBadge emoji="⚡" value={targetUser.totalXp ?? 0} label="XP" />
                <UserStatBadge emoji="❤️" value={`${targetUser.hearts ?? 0}/${targetUser.maxHearts ?? 5}`} label="Tim" />
              </View>
            </View>
          </View>
          <Field
            label="Mật khẩu mới"
            value={passwordByUserId[targetUser.id] || ''}
            onChangeText={(newPassword) => onPasswordChange(targetUser.id, newPassword)}
          />
          <View style={styles.userActionRow}>
            <Pressable style={styles.secondaryButton} onPress={() => onSavePassword(targetUser.id)} disabled={savingKey === `password-${targetUser.id}`}>
              <Text style={styles.secondaryButtonText}>{savingKey === `password-${targetUser.id}` ? 'Đang đổi...' : 'Đổi mật khẩu'}</Text>
            </Pressable>
            <Pressable style={styles.dangerButton} onPress={() => confirmReset(targetUser)} disabled={savingKey === `reset-${targetUser.id}`}>
              <Text style={styles.dangerButtonText}>{savingKey === `reset-${targetUser.id}` ? 'Đang reset...' : 'Reset tiến trình'}</Text>
            </Pressable>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: 16, borderRadius: 24, backgroundColor: '#fff', borderWidth: 1, borderColor: '#E7E0EC', padding: 16, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 2 },
  cardTitle: { fontSize: 18, fontWeight: '900', color: '#1D1B20', marginBottom: 8 },
  searchInput: { minHeight: 48, borderWidth: 1, borderColor: '#CAC4D0', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, color: '#1D1B20', fontSize: 15, backgroundColor: '#FFFBFE', marginBottom: 10 },
  countLabel: { fontSize: 13, color: '#625B71', marginBottom: 10, fontWeight: '700' },
  fieldBlock: { marginTop: 10 },
  fieldLabel: { fontSize: 13, fontWeight: '800', color: '#49454F', marginBottom: 6 },
  input: { minHeight: 48, borderWidth: 1, borderColor: '#CAC4D0', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, color: '#1D1B20', fontSize: 15, backgroundColor: '#FFFBFE' },
  userCard: { marginTop: 12, borderTopWidth: 1, borderTopColor: '#E7E0EC', paddingTop: 14 },
  userHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  avatarCircle: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#EADDFF', alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#4F378B', fontSize: 18, fontWeight: '900' },
  userInfo: { flex: 1 },
  userName: { fontSize: 16, fontWeight: '900', color: '#1D1B20' },
  userEmail: { marginTop: 2, color: '#625B71', fontSize: 13 },
  badgesRow: { flexDirection: 'row', gap: 8, marginTop: 8, flexWrap: 'wrap' },
  badge: { backgroundColor: '#F7F7F7', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6, alignItems: 'center', minWidth: 56 },
  badgeEmoji: { fontSize: 14 },
  badgeValue: { fontSize: 13, fontWeight: '900', color: '#1D1B20', marginTop: 2 },
  badgeLabel: { fontSize: 11, color: '#625B71', marginTop: 2 },
  userActionRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
  secondaryButton: { minHeight: 48, borderRadius: 16, backgroundColor: '#EADDFF', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 14, flex: 1 },
  secondaryButtonText: { color: '#4F378B', fontSize: 14, fontWeight: '900' },
  dangerButton: { minHeight: 48, borderRadius: 16, backgroundColor: '#F9DEDC', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 14, flex: 1 },
  dangerButtonText: { color: '#B3261E', fontSize: 14, fontWeight: '900' },
});
