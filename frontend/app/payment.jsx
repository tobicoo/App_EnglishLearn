import { createSubscription } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { useRoleBack } from '@/navigation/roleBack';
import { useTheme } from '@/context/ThemeContext';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  Alert, KeyboardAvoidingView, Platform, ScrollView,
  StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const PAYMENT_METHODS = [
  { id: 'card',     icon: '💳', label: 'Thẻ tín dụng / ghi nợ', sub: 'Visa · Mastercard · JCB' },
  { id: 'momo',     icon: '💜', label: 'Ví MoMo',                sub: 'Quét mã QR trong app MoMo' },
  { id: 'zalopay',  icon: '💙', label: 'ZaloPay',                sub: 'Quét mã QR trong app ZaloPay' },
  { id: 'paypal',   icon: '🅿️', label: 'PayPal',                 sub: 'Thanh toán qua PayPal' },
];

const PROCESSING_STEPS = [
  { label: 'Xác thực thông tin',  icon: '🔍' },
  { label: 'Xử lý thanh toán',    icon: '⚡' },
  { label: 'Kích hoạt gói Super', icon: '🚀' },
];

function formatCardNumber(raw) {
  return raw.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
}

function formatExpiry(raw) {
  const digits = raw.replace(/\D/g, '').slice(0, 4);
  return digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits;
}

export default function PaymentScreen() {
  const router = useRouter();
  const { goBack } = useRoleBack('/(tabs)/home');
  const { theme, isDark } = useTheme();
  const { refreshUser } = useAuth();
  const params = useLocalSearchParams();

  const planName   = params.planName || 'Gói hàng tháng';
  const price      = params.price    || '129.000 đ';
  const period     = params.period   || 'tháng';
  const planKey    = params.planKey  || (period === 'năm' ? 'yearly' : period === 'tuần' ? 'trial' : 'monthly');

  // ── Phase ────────────────────────────────────────────────────
  // 'select' | 'processing' | 'success'
  const [phase, setPhase] = useState('select');

  // ── Method selection ─────────────────────────────────────────
  const [selected, setSelected] = useState('card');

  // ── Card form ────────────────────────────────────────────────
  const [cardNumber, setCardNumber]   = useState('');
  const [cardHolder, setCardHolder]   = useState('');
  const [cardExpiry, setCardExpiry]   = useState('');
  const [cardCvv,    setCardCvv]      = useState('');

  // ── Processing ───────────────────────────────────────────────
  const [processingStep, setProcessingStep] = useState(0);
  const apiResultRef  = useRef(null);
  const isMountedRef  = useRef(true);
  const [successInfo, setSuccessInfo] = useState(null);

  useEffect(() => () => { isMountedRef.current = false; }, []);

  useEffect(() => {
    if (phase !== 'processing') return;

    apiResultRef.current = null;

    createSubscription({ plan: planKey, paymentMethod: selected }).then((result) => {
      apiResultRef.current = result;
    });

    setProcessingStep(0);

    const t1 = setTimeout(() => {
      if (!isMountedRef.current) return;
      setProcessingStep(1);

      const t2 = setTimeout(() => {
        if (!isMountedRef.current) return;
        setProcessingStep(2);

        const waitForApi = () => {
          if (!isMountedRef.current) return;
          if (apiResultRef.current !== null) {
            const { data, error } = apiResultRef.current;
            if (error) {
              setPhase('select');
              Alert.alert('Thanh toán thất bại', error);
            } else {
              setSuccessInfo(data);
              setTimeout(() => {
                if (isMountedRef.current) {
                  refreshUser();
                  setPhase('success');
                }
              }, 700);
            }
          } else {
            setTimeout(waitForApi, 120);
          }
        };
        setTimeout(waitForApi, 500);
      }, 900);

      return () => clearTimeout(t2);
    }, 900);

    return () => clearTimeout(t1);
  }, [phase]);

  // ── Validate & start processing ──────────────────────────────
  const handleConfirm = () => {
    if (selected === 'card') {
      const digits = cardNumber.replace(/\s/g, '');
      if (digits.length < 16)    { Alert.alert('Thẻ không hợp lệ', 'Vui lòng nhập đủ 16 số thẻ.'); return; }
      if (!cardHolder.trim())    { Alert.alert('Thiếu thông tin', 'Vui lòng nhập tên chủ thẻ.'); return; }
      if (cardExpiry.length < 5) { Alert.alert('Thiếu thông tin', 'Vui lòng nhập ngày hết hạn (MM/YY).'); return; }
      if (cardCvv.length < 3)    { Alert.alert('Thiếu thông tin', 'Vui lòng nhập mã CVV.'); return; }
    }
    setPhase('processing');
  };

  // ═══════════════════════════════════════════════════════════
  // PHASE: processing
  // ═══════════════════════════════════════════════════════════
  if (phase === 'processing') {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.processingWrap}>
          <View style={[styles.processingCard, { backgroundColor: isDark ? '#1e1e2e' : '#fff', shadowColor: '#000' }]}>
            <Text style={styles.processingEmoji}>⚙️</Text>
            <Text style={[styles.processingTitle, { color: theme.text }]}>Đang xử lý</Text>
            <Text style={[styles.processingSubtitle, { color: theme.textSecondary }]}>
              Vui lòng không thoát khỏi màn hình này
            </Text>

            <View style={styles.stepsList}>
              {PROCESSING_STEPS.map((step, idx) => {
                const isDone    = processingStep > idx;
                const isActive  = processingStep === idx;
                return (
                  <View key={idx} style={styles.stepRow}>
                    <View style={[
                      styles.stepIconBox,
                      isDone   && { backgroundColor: '#58cc02' },
                      isActive && { backgroundColor: '#CE82FF' },
                      !isDone && !isActive && { backgroundColor: theme.card },
                    ]}>
                      <Text style={styles.stepIcon}>{isDone ? '✓' : step.icon}</Text>
                    </View>
                    <View style={styles.stepTextWrap}>
                      <Text style={[
                        styles.stepLabel,
                        { color: isDone ? '#58cc02' : isActive ? theme.text : theme.textSecondary },
                        isActive && { fontWeight: '700' },
                      ]}>
                        {step.label}
                      </Text>
                      {isActive && (
                        <Text style={[styles.stepSub, { color: '#CE82FF' }]}>Đang xử lý...</Text>
                      )}
                      {isDone && (
                        <Text style={[styles.stepSub, { color: '#58cc02' }]}>Hoàn tất</Text>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>

            {/* Progress bar */}
            <View style={[styles.progressTrack, { backgroundColor: theme.card }]}>
              <View style={[styles.progressFill, {
                width: `${Math.min(100, (processingStep / PROCESSING_STEPS.length) * 100 + 10)}%`,
              }]} />
            </View>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // ═══════════════════════════════════════════════════════════
  // PHASE: success
  // ═══════════════════════════════════════════════════════════
  if (phase === 'success') {
    const sub = successInfo?.subscription;
    const expiresDate = sub?.expiresAt
      ? new Date(sub.expiresAt).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
      : null;
    const daysLeft = sub?.daysRemaining ?? null;

    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.successWrap}>
          {/* Glow ring */}
          <View style={styles.successRingOuter}>
            <View style={styles.successRingInner}>
              <Text style={styles.successCheckmark}>✓</Text>
            </View>
          </View>

          <Text style={[styles.successTitle, { color: theme.text }]}>Thanh toán thành công!</Text>
          <Text style={[styles.successSub, { color: theme.textSecondary }]}>
            Chào mừng bạn gia nhập{'\n'}EnglishLearn Super ⭐
          </Text>

          {/* Plan card */}
          <View style={[styles.successPlanCard, { backgroundColor: isDark ? '#2a1f3d' : '#f5eeff', borderColor: '#CE82FF' }]}>
            <View style={styles.successPlanRow}>
              <Text style={styles.successPlanEmoji}>🎉</Text>
              <View>
                <Text style={[styles.successPlanName, { color: theme.text }]}>{planName}</Text>
                <Text style={[styles.successPlanMeta, { color: theme.textSecondary }]}>
                  {daysLeft !== null ? `Còn ${daysLeft} ngày` : ''}
                  {expiresDate ? ` · Hết hạn ${expiresDate}` : ''}
                </Text>
              </View>
            </View>

            <View style={styles.successBenefitList}>
              {['Năng lượng vô tận', 'Luyện tập không giới hạn', 'Không quảng cáo', 'Truy cập toàn bộ bài học'].map((b) => (
                <View key={b} style={styles.successBenefitRow}>
                  <Text style={styles.successBenefitIcon}>✓</Text>
                  <Text style={[styles.successBenefitText, { color: theme.text }]}>{b}</Text>
                </View>
              ))}
            </View>
          </View>

          <TouchableOpacity
            style={styles.successBtn}
            onPress={() => router.replace('/(tabs)/home')}
          >
            <Text style={styles.successBtnText}>Bắt đầu học ngay →</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ═══════════════════════════════════════════════════════════
  // PHASE: select
  // ═══════════════════════════════════════════════════════════
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => goBack()} style={styles.backBtn}>
          <Text style={[styles.backText, { color: '#1cb0f6' }]}>‹ Quay lại</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Thanh toán</Text>
        <View style={styles.backBtn} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={80}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

          {/* Plan summary */}
          <View style={[styles.planCard, { backgroundColor: isDark ? '#2a1f3d' : '#f5eeff', borderColor: '#CE82FF' }]}>
            <View style={styles.planTop}>
              <Text style={styles.planEmoji}>⭐</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.planName, { color: theme.text }]}>{planName}</Text>
                <Text style={[styles.planPeriod, { color: theme.textSecondary }]}>
                  Mỗi {period} · Hủy bất kỳ lúc nào
                </Text>
              </View>
              <View style={[styles.priceBadge, { backgroundColor: '#CE82FF' }]}>
                <Text style={styles.priceBadgeText}>{price}</Text>
              </View>
            </View>
            <View style={[styles.planDivider, { backgroundColor: '#CE82FF33' }]} />
            <View style={styles.planFeatures}>
              {['Năng lượng vô tận', 'Luyện tập không giới hạn', 'Không quảng cáo'].map((f) => (
                <Text key={f} style={[styles.planFeatureItem, { color: theme.textSecondary }]}>✓ {f}</Text>
              ))}
            </View>
            <View style={styles.trialBadge}>
              <Text style={styles.trialText}>🎁 Thử miễn phí 7 ngày đầu</Text>
            </View>
          </View>

          {/* Payment methods */}
          <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>PHƯƠNG THỨC THANH TOÁN</Text>
          <View style={[styles.methodList, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            {PAYMENT_METHODS.map((method, idx) => (
              <TouchableOpacity
                key={method.id}
                style={[
                  styles.methodItem,
                  idx < PAYMENT_METHODS.length - 1 && { borderBottomWidth: 1, borderBottomColor: theme.border },
                  selected === method.id && { backgroundColor: isDark ? '#2a1f3d' : '#f5eeff' },
                ]}
                onPress={() => setSelected(method.id)}
                activeOpacity={0.8}
              >
                <View style={[styles.methodIconBox, { backgroundColor: isDark ? '#3d2a5a' : '#ede0ff' }]}>
                  <Text style={styles.methodIcon}>{method.icon}</Text>
                </View>
                <View style={styles.methodInfo}>
                  <Text style={[styles.methodLabel, { color: theme.text }]}>{method.label}</Text>
                  <Text style={[styles.methodSub, { color: theme.textSecondary }]}>{method.sub}</Text>
                </View>
                <View style={[styles.radio, { borderColor: selected === method.id ? '#CE82FF' : theme.border }]}>
                  {selected === method.id && <View style={styles.radioDot} />}
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {/* Card form */}
          {selected === 'card' && (
            <View style={[styles.cardForm, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Text style={[styles.cardFormTitle, { color: theme.text }]}>Thông tin thẻ</Text>

              <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Số thẻ</Text>
              <TextInput
                style={[styles.fieldInput, { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.text }]}
                placeholder="1234 5678 9012 3456"
                placeholderTextColor={theme.textSecondary}
                keyboardType="numeric"
                value={cardNumber}
                onChangeText={(t) => setCardNumber(formatCardNumber(t))}
                maxLength={19}
              />

              <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Tên chủ thẻ</Text>
              <TextInput
                style={[styles.fieldInput, { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.text }]}
                placeholder="NGUYEN VAN A"
                placeholderTextColor={theme.textSecondary}
                autoCapitalize="characters"
                value={cardHolder}
                onChangeText={setCardHolder}
              />

              <View style={styles.cardRow}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Ngày hết hạn</Text>
                  <TextInput
                    style={[styles.fieldInput, { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.text }]}
                    placeholder="MM/YY"
                    placeholderTextColor={theme.textSecondary}
                    keyboardType="numeric"
                    value={cardExpiry}
                    onChangeText={(t) => setCardExpiry(formatExpiry(t))}
                    maxLength={5}
                  />
                </View>
                <View style={{ width: 14 }} />
                <View style={{ width: 110 }}>
                  <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>CVV</Text>
                  <TextInput
                    style={[styles.fieldInput, { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.text }]}
                    placeholder="•••"
                    placeholderTextColor={theme.textSecondary}
                    keyboardType="numeric"
                    secureTextEntry
                    value={cardCvv}
                    onChangeText={(t) => setCardCvv(t.replace(/\D/g, '').slice(0, 3))}
                    maxLength={3}
                  />
                </View>
              </View>
            </View>
          )}

          {/* MoMo / ZaloPay wallet note */}
          {(selected === 'momo' || selected === 'zalopay') && (
            <View style={[styles.walletNote, { backgroundColor: isDark ? '#1a2340' : '#e8f4ff', borderColor: '#1cb0f6' }]}>
              <Text style={styles.walletNoteIcon}>📱</Text>
              <Text style={[styles.walletNoteText, { color: theme.text }]}>
                Một mã QR sẽ được tạo sau khi xác nhận. Mở app{' '}
                <Text style={{ fontWeight: '700' }}>
                  {selected === 'momo' ? 'MoMo' : 'ZaloPay'}
                </Text>{' '}
                và quét mã để hoàn tất thanh toán.
              </Text>
            </View>
          )}

          {/* Security */}
          <View style={[styles.secureNote, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={styles.secureIcon}>🔒</Text>
            <Text style={[styles.secureText, { color: theme.textSecondary }]}>
              Thanh toán được mã hóa SSL 256-bit. Thông tin thẻ không được lưu trữ trên máy chủ.
            </Text>
          </View>

          {/* Confirm */}
          <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirm}>
            <Text style={styles.confirmText}>✨ XÁC NHẬN THANH TOÁN · {price}</Text>
          </TouchableOpacity>

          <Text style={[styles.termsText, { color: theme.textSecondary }]}>
            Bằng cách xác nhận, bạn đồng ý với Điều khoản dịch vụ và Chính sách bảo mật của EnglishLearn.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1,
  },
  backBtn:     { width: 80 },
  backText:    { fontSize: 16, fontWeight: '600' },
  headerTitle: { fontSize: 17, fontWeight: 'bold' },

  scroll: { padding: 20, paddingBottom: 100 },

  // Plan card
  planCard: { borderRadius: 24, borderWidth: 2, padding: 18, marginBottom: 22 },
  planTop:  { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  planEmoji:   { fontSize: 34 },
  planName:    { fontSize: 17, fontWeight: 'bold', marginBottom: 2 },
  planPeriod:  { fontSize: 13 },
  priceBadge:  { borderRadius: 14, paddingHorizontal: 12, paddingVertical: 6 },
  priceBadgeText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  planDivider: { height: 1, marginBottom: 12 },
  planFeatures: { gap: 4, marginBottom: 12 },
  planFeatureItem: { fontSize: 13 },
  trialBadge: { backgroundColor: '#CE82FF22', borderRadius: 12, paddingVertical: 8, alignItems: 'center' },
  trialText:  { color: '#CE82FF', fontWeight: 'bold', fontSize: 13 },

  // Method list
  sectionLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.8, marginBottom: 10 },
  methodList: { borderRadius: 22, borderWidth: 1, overflow: 'hidden', marginBottom: 18 },
  methodItem: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 },
  methodIconBox: { width: 46, height: 46, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  methodIcon:   { fontSize: 22 },
  methodInfo:   { flex: 1 },
  methodLabel:  { fontSize: 15, fontWeight: '600', marginBottom: 2 },
  methodSub:    { fontSize: 12 },
  radio:     { width: 22, height: 22, borderRadius: 11, borderWidth: 2, justifyContent: 'center', alignItems: 'center' },
  radioDot:  { width: 11, height: 11, borderRadius: 6, backgroundColor: '#CE82FF' },

  // Card form
  cardForm: { borderRadius: 20, borderWidth: 1.5, padding: 16, marginBottom: 18 },
  cardFormTitle: { fontSize: 15, fontWeight: 'bold', marginBottom: 14 },
  fieldLabel: { fontSize: 12, fontWeight: '700', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.3 },
  fieldInput: {
    borderWidth: 1.5, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 15, marginBottom: 12,
  },
  cardRow: { flexDirection: 'row' },

  // Wallet note
  walletNote: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    borderRadius: 16, borderWidth: 1.5, padding: 14, marginBottom: 18,
  },
  walletNoteIcon: { fontSize: 20 },
  walletNoteText: { flex: 1, fontSize: 13, lineHeight: 20 },

  // Secure
  secureNote: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    borderRadius: 16, borderWidth: 1, padding: 14, marginBottom: 22,
  },
  secureIcon: { fontSize: 18 },
  secureText: { flex: 1, fontSize: 12, lineHeight: 18 },

  // Confirm
  confirmBtn: {
    backgroundColor: '#CE82FF', borderRadius: 20,
    paddingVertical: 18, alignItems: 'center', marginBottom: 14,
    shadowColor: '#CE82FF', shadowOpacity: 0.4, shadowRadius: 12, shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  confirmText: { color: '#fff', fontWeight: 'bold', fontSize: 15, letterSpacing: 0.3 },
  termsText: { fontSize: 11, textAlign: 'center', lineHeight: 16 },

  // ── Processing phase ────────────────────────────────────────
  processingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  processingCard: {
    width: '100%', maxWidth: 360, borderRadius: 28, padding: 28,
    alignItems: 'center',
    shadowOpacity: 0.15, shadowRadius: 20, shadowOffset: { width: 0, height: 8 }, elevation: 10,
  },
  processingEmoji:    { fontSize: 44, marginBottom: 12 },
  processingTitle:    { fontSize: 20, fontWeight: 'bold', marginBottom: 6 },
  processingSubtitle: { fontSize: 13, textAlign: 'center', marginBottom: 28 },

  stepsList: { width: '100%', gap: 16, marginBottom: 24 },
  stepRow:   { flexDirection: 'row', alignItems: 'center', gap: 14 },
  stepIconBox: {
    width: 42, height: 42, borderRadius: 21,
    justifyContent: 'center', alignItems: 'center',
  },
  stepIcon:     { fontSize: 18 },
  stepTextWrap: { flex: 1 },
  stepLabel:    { fontSize: 15 },
  stepSub:      { fontSize: 12, marginTop: 2 },

  progressTrack: { width: '100%', height: 6, borderRadius: 3, overflow: 'hidden' },
  progressFill:  { height: '100%', borderRadius: 3, backgroundColor: '#CE82FF' },

  // ── Success phase ───────────────────────────────────────────
  successWrap: {
    flex: 1, justifyContent: 'center', alignItems: 'center', padding: 28,
  },
  successRingOuter: {
    width: 110, height: 110, borderRadius: 55,
    backgroundColor: '#58cc0220', justifyContent: 'center', alignItems: 'center',
    marginBottom: 20,
  },
  successRingInner: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: '#58cc02', justifyContent: 'center', alignItems: 'center',
  },
  successCheckmark: { fontSize: 38, color: '#fff' },
  successTitle: { fontSize: 24, fontWeight: 'bold', marginBottom: 8 },
  successSub: {
    fontSize: 15, textAlign: 'center', lineHeight: 22, marginBottom: 24,
  },

  successPlanCard: {
    width: '100%', borderRadius: 22, borderWidth: 2, padding: 18, marginBottom: 28,
  },
  successPlanRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  successPlanEmoji: { fontSize: 28 },
  successPlanName:  { fontSize: 16, fontWeight: 'bold', marginBottom: 2 },
  successPlanMeta:  { fontSize: 12 },
  successBenefitList: { gap: 8 },
  successBenefitRow:  { flexDirection: 'row', alignItems: 'center', gap: 8 },
  successBenefitIcon: { color: '#58cc02', fontWeight: 'bold', fontSize: 15 },
  successBenefitText: { fontSize: 14 },

  successBtn: {
    width: '100%', backgroundColor: '#CE82FF', borderRadius: 20,
    paddingVertical: 18, alignItems: 'center',
    shadowColor: '#CE82FF', shadowOpacity: 0.4, shadowRadius: 12, shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  successBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});

