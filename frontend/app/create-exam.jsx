import { addExamQuestion, createExam, deleteExamQuestion } from '@/services/api';
import { useTheme } from '@/context/ThemeContext';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Alert, ScrollView, StyleSheet, Text,
  TextInput, TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const CATEGORIES = ['Grammar', 'Vocabulary', 'Listening', 'Speaking', 'Reading', 'Mixed'];
const CAT_LABELS = { Grammar: 'Ngữ pháp', Vocabulary: 'Từ vựng', Listening: 'Nghe', Speaking: 'Nói', Reading: 'Đọc hiểu', Mixed: 'Tổng hợp' };
const DIFFICULTIES = [
  { key: 'EASY', label: 'Dễ' },
  { key: 'MEDIUM', label: 'Trung bình' },
  { key: 'HARD', label: 'Khó' },
];
const DIFF_COLORS = { EASY: '#58cc02', MEDIUM: '#ffc800', HARD: '#ff4b4b' };

const EMPTY_MC_OPTIONS = [
  { text: '', isCorrect: true },
  { text: '', isCorrect: false },
  { text: '', isCorrect: false },
  { text: '', isCorrect: false },
];

export default function CreateExamScreen() {
  const router = useRouter();
  const { theme, isDark } = useTheme();

  // Phase 1 — exam details
  const [phase, setPhase] = useState(1);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [examType, setExamType] = useState('free');
  const [difficulty, setDifficulty] = useState('');
  const [saving, setSaving] = useState(false);

  // Phase 2 — questions
  const [examId, setExamId] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [qType, setQType] = useState('MULTIPLE_CHOICE');
  const [qText, setQText] = useState('');
  const [mcOptions, setMcOptions] = useState(EMPTY_MC_OPTIONS.map((o) => ({ ...o })));
  const [fillAnswer, setFillAnswer] = useState('');
  const [qExplanation, setQExplanation] = useState('');
  const [addingQ, setAddingQ] = useState(false);

  // ── Phase 1 submit ───────────────────────────────────────────
  const handleCreateExam = async () => {
    if (!title.trim()) { Alert.alert('Thiếu thông tin', 'Vui lòng nhập tên đề thi.'); return; }
    if (!category) { Alert.alert('Thiếu thông tin', 'Vui lòng chọn danh mục.'); return; }
    if (!difficulty) { Alert.alert('Thiếu thông tin', 'Vui lòng chọn độ khó.'); return; }

    setSaving(true);
    const { data, error } = await createExam({
      title: title.trim(),
      category,
      description: description.trim() || null,
      difficulty,
      accountType: examType,
    });
    setSaving(false);

    if (error) { Alert.alert('Lỗi', error); return; }

    setExamId(data.exam?.id ?? data.id);
    setPhase(2);
  };

  // ── Phase 2 helpers ──────────────────────────────────────────
  const resetQuestionForm = () => {
    setQText('');
    setQType('MULTIPLE_CHOICE');
    setMcOptions(EMPTY_MC_OPTIONS.map((o) => ({ ...o })));
    setFillAnswer('');
    setQExplanation('');
  };

  const handleAddQuestion = async () => {
    if (!qText.trim()) { Alert.alert('Thiếu thông tin', 'Vui lòng nhập nội dung câu hỏi.'); return; }

    let payload;
    if (qType === 'MULTIPLE_CHOICE') {
      const filled = mcOptions.filter((o) => o.text.trim());
      if (filled.length < 2) { Alert.alert('Thiếu thông tin', 'Cần ít nhất 2 đáp án.'); return; }
      if (!filled.some((o) => o.isCorrect)) { Alert.alert('Thiếu thông tin', 'Vui lòng chọn đáp án đúng.'); return; }
      payload = { questionText: qText.trim(), type: 'MULTIPLE_CHOICE', options: filled, explanation: qExplanation.trim() || null };
    } else {
      if (!fillAnswer.trim()) { Alert.alert('Thiếu thông tin', 'Vui lòng nhập đáp án đúng.'); return; }
      payload = { questionText: qText.trim(), type: 'FILL_BLANK', correctAnswer: fillAnswer.trim(), explanation: qExplanation.trim() || null };
    }

    setAddingQ(true);
    const { data, error } = await addExamQuestion(examId, payload);
    setAddingQ(false);

    if (error) { Alert.alert('Lỗi', error); return; }
    setQuestions((prev) => [...prev, data.question]);
    resetQuestionForm();
    setShowForm(false);
  };

  const handleDeleteQuestion = (qId) => {
    Alert.alert('Xóa câu hỏi?', 'Câu hỏi này sẽ bị xóa vĩnh viễn.', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xóa', style: 'destructive',
        onPress: async () => {
          const { error } = await deleteExamQuestion(examId, qId);
          if (error) { Alert.alert('Lỗi', error); return; }
          setQuestions((prev) => prev.filter((q) => q.id !== qId));
        },
      },
    ]);
  };

  const setCorrectOption = (idx) => {
    setMcOptions((prev) => prev.map((o, i) => ({ ...o, isCorrect: i === idx })));
  };

  const updateOptionText = (idx, text) => {
    setMcOptions((prev) => prev.map((o, i) => (i === idx ? { ...o, text } : o)));
  };

  // ── Shared sub-component ─────────────────────────────────────
  const SectionLabel = ({ emoji, label }) => (
    <View style={styles.sectionLabel}>
      <Text style={styles.sectionEmoji}>{emoji}</Text>
      <Text style={[styles.sectionText, { color: theme.textSecondary }]}>{label}</Text>
    </View>
  );

  // ══════════════════════════════════════════════════════════════
  // PHASE 2 — Question editor
  // ══════════════════════════════════════════════════════════════
  if (phase === 2) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
          <View style={styles.backBtn} />
          <Text style={[styles.headerTitle, { color: theme.text }]}>Thêm câu hỏi</Text>
          <TouchableOpacity
            style={[styles.doneBtn, { backgroundColor: '#58cc02' }]}
            onPress={() => router.back()}
          >
            <Text style={styles.doneBtnText}>Xong</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scroll}>
          {/* Summary banner */}
          <View style={[styles.summaryBanner, { backgroundColor: isDark ? '#1a2f1a' : '#f0fff0', borderColor: '#58cc02' }]}>
            <Text style={[styles.summaryTitle, { color: theme.text }]}>{title}</Text>
            <Text style={[styles.summaryMeta, { color: theme.textSecondary }]}>
              {CAT_LABELS[category] ?? category} · {difficulty} · {questions.length} câu hỏi
            </Text>
          </View>

          {/* Question list */}
          {questions.map((q, idx) => (
            <View key={q.id} style={[styles.questionCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <View style={styles.questionCardTop}>
                <View style={[styles.qIndexBadge, { backgroundColor: '#CE82FF' }]}>
                  <Text style={styles.qIndexText}>{idx + 1}</Text>
                </View>
                <View style={[styles.qTypeBadge, { backgroundColor: q.type === 'FILL_BLANK' ? '#1cb0f6' : '#ffc800' }]}>
                  <Text style={styles.qTypeBadgeText}>{q.type === 'FILL_BLANK' ? 'Điền từ' : 'Trắc nghiệm'}</Text>
                </View>
                <TouchableOpacity style={styles.deleteQBtn} onPress={() => handleDeleteQuestion(q.id)}>
                  <Text style={styles.deleteQText}>✕</Text>
                </TouchableOpacity>
              </View>
              <Text style={[styles.questionText, { color: theme.text }]}>{q.questionText}</Text>
              {q.type === 'MULTIPLE_CHOICE' && Array.isArray(q.options) && (
                <View style={styles.optionPreviewList}>
                  {q.options.map((o, oi) => (
                    <Text
                      key={oi}
                      style={[styles.optionPreview, { color: o.isCorrect ? '#58cc02' : theme.textSecondary }]}
                    >
                      {o.isCorrect ? '✓' : '○'} {o.text}
                    </Text>
                  ))}
                </View>
              )}
              {q.type === 'FILL_BLANK' && (
                <Text style={[styles.optionPreview, { color: '#58cc02' }]}>Đáp án: {q.correctAnswer}</Text>
              )}
            </View>
          ))}

          {/* Add question form */}
          {showForm ? (
            <View style={[styles.addForm, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Text style={[styles.addFormTitle, { color: theme.text }]}>Câu hỏi mới</Text>

              {/* Type toggle */}
              <View style={[styles.toggleRow, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <TouchableOpacity
                  style={[styles.toggleItem, qType === 'MULTIPLE_CHOICE' && styles.toggleItemActive]}
                  onPress={() => setQType('MULTIPLE_CHOICE')}
                >
                  <Text style={[styles.toggleText, { color: qType === 'MULTIPLE_CHOICE' ? '#fff' : theme.textSecondary }]}>Trắc nghiệm</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.toggleItem, qType === 'FILL_BLANK' && [styles.toggleItemActive, { backgroundColor: '#1cb0f6' }]]}
                  onPress={() => setQType('FILL_BLANK')}
                >
                  <Text style={[styles.toggleText, { color: qType === 'FILL_BLANK' ? '#fff' : theme.textSecondary }]}>Điền từ</Text>
                </TouchableOpacity>
              </View>

              <TextInput
                style={[styles.textArea, { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.text, marginTop: 12 }]}
                placeholder="Nội dung câu hỏi..."
                placeholderTextColor={theme.textSecondary}
                value={qText}
                onChangeText={setQText}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />

              {qType === 'MULTIPLE_CHOICE' && (
                <View style={{ marginTop: 12 }}>
                  <Text style={[styles.smallLabel, { color: theme.textSecondary }]}>Đáp án (nhấn để chọn đúng)</Text>
                  {mcOptions.map((opt, idx) => (
                    <View key={idx} style={styles.optionRow}>
                      <TouchableOpacity
                        style={[styles.correctMark, { borderColor: opt.isCorrect ? '#58cc02' : theme.border, backgroundColor: opt.isCorrect ? '#58cc02' : 'transparent' }]}
                        onPress={() => setCorrectOption(idx)}
                      >
                        <Text style={{ color: '#fff', fontSize: 12, fontWeight: 'bold' }}>{opt.isCorrect ? '✓' : ''}</Text>
                      </TouchableOpacity>
                      <TextInput
                        style={[styles.optionInput, { backgroundColor: theme.inputBg, borderColor: opt.isCorrect ? '#58cc02' : theme.border, color: theme.text }]}
                        placeholder={`Đáp án ${idx + 1}...`}
                        placeholderTextColor={theme.textSecondary}
                        value={opt.text}
                        onChangeText={(t) => updateOptionText(idx, t)}
                      />
                    </View>
                  ))}
                </View>
              )}

              {qType === 'FILL_BLANK' && (
                <View style={{ marginTop: 12 }}>
                  <Text style={[styles.smallLabel, { color: theme.textSecondary }]}>Đáp án đúng</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: theme.inputBg, borderColor: '#58cc02', color: theme.text, marginTop: 6 }]}
                    placeholder="Nhập đáp án đúng..."
                    placeholderTextColor={theme.textSecondary}
                    value={fillAnswer}
                    onChangeText={setFillAnswer}
                  />
                </View>
              )}

              <View style={{ marginTop: 12 }}>
                <Text style={[styles.smallLabel, { color: theme.textSecondary }]}>Giải thích (tùy chọn)</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.text, marginTop: 6 }]}
                  placeholder="Giải thích đáp án..."
                  placeholderTextColor={theme.textSecondary}
                  value={qExplanation}
                  onChangeText={setQExplanation}
                />
              </View>

              <View style={styles.formBtns}>
                <TouchableOpacity
                  style={[styles.cancelBtn, { borderColor: theme.border }]}
                  onPress={() => { resetQuestionForm(); setShowForm(false); }}
                >
                  <Text style={[styles.cancelBtnText, { color: theme.textSecondary }]}>Hủy</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.addQBtn, addingQ && styles.disabledBtn]}
                  onPress={handleAddQuestion}
                  disabled={addingQ}
                >
                  <Text style={styles.addQBtnText}>{addingQ ? 'Đang thêm...' : '+ Thêm câu hỏi'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.addNewBtn, { borderColor: '#CE82FF' }]}
              onPress={() => setShowForm(true)}
            >
              <Text style={[styles.addNewBtnText, { color: '#CE82FF' }]}>+ Thêm câu hỏi mới</Text>
            </TouchableOpacity>
          )}

          {questions.length > 0 && (
            <TouchableOpacity
              style={[styles.submitBtn, { backgroundColor: '#58cc02', marginTop: 24 }]}
              onPress={() => router.back()}
            >
              <Text style={styles.submitText}>Hoàn thành ({questions.length} câu)</Text>
            </TouchableOpacity>
          )}

          <View style={{ height: 60 }} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ══════════════════════════════════════════════════════════════
  // PHASE 1 — Exam details
  // ══════════════════════════════════════════════════════════════
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={[styles.backText, { color: '#1cb0f6' }]}>‹ Quay lại</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Tạo đề thi</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={[styles.banner, { backgroundColor: isDark ? '#2a1f3d' : '#f5eeff' }]}>
          <Text style={styles.bannerEmoji}>📝✨</Text>
          <Text style={[styles.bannerTitle, { color: theme.text }]}>Tạo đề thi của bạn</Text>
          <Text style={[styles.bannerSub, { color: theme.textSecondary }]}>Chia sẻ kiến thức với cộng đồng!</Text>
        </View>

        <SectionLabel emoji="🏷️" label="Tên đề thi" />
        <TextInput
          style={[styles.input, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text }]}
          placeholder="Nhập tên đề thi..."
          placeholderTextColor={theme.textSecondary}
          value={title}
          onChangeText={setTitle}
        />

        <SectionLabel emoji="📂" label="Danh mục" />
        <View style={styles.chipRow}>
          {CATEGORIES.map((c) => (
            <TouchableOpacity
              key={c}
              style={[styles.chip, { borderColor: category === c ? '#CE82FF' : theme.border, backgroundColor: category === c ? '#CE82FF' : theme.surface }]}
              onPress={() => setCategory(c)}
            >
              <Text style={[styles.chipText, { color: category === c ? '#fff' : theme.text }]}>{CAT_LABELS[c]}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <SectionLabel emoji="📄" label="Mô tả" />
        <TextInput
          style={[styles.textArea, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text }]}
          placeholder="Mô tả ngắn về đề thi..."
          placeholderTextColor={theme.textSecondary}
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />

        <SectionLabel emoji="🔓" label="Loại tài khoản" />
        <View style={[styles.toggleRow, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <TouchableOpacity
            style={[styles.toggleItem, examType === 'free' && styles.toggleItemActive]}
            onPress={() => setExamType('free')}
          >
            <Text style={[styles.toggleText, { color: examType === 'free' ? '#fff' : theme.textSecondary }]}>Miễn phí</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleItem, examType === 'premium' && [styles.toggleItemActive, { backgroundColor: '#ffc800' }]]}
            onPress={() => setExamType('premium')}
          >
            <Text style={[styles.toggleText, { color: examType === 'premium' ? '#3c3c3c' : theme.textSecondary }]}>Nâng cấp</Text>
          </TouchableOpacity>
        </View>

        <SectionLabel emoji="🎯" label="Độ khó" />
        <View style={styles.diffRow}>
          {DIFFICULTIES.map(({ key, label }) => (
            <TouchableOpacity
              key={key}
              style={[
                styles.diffItem,
                { borderColor: difficulty === key ? DIFF_COLORS[key] : theme.border, backgroundColor: difficulty === key ? DIFF_COLORS[key] + '22' : theme.surface },
              ]}
              onPress={() => setDifficulty(key)}
            >
              <Text style={[styles.diffText, { color: difficulty === key ? DIFF_COLORS[key] : theme.text }]}>{label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.submitBtn, saving && styles.disabledBtn]}
          onPress={handleCreateExam}
          disabled={saving}
        >
          <Text style={styles.submitText}>{saving ? 'Đang tạo... ✨' : 'Tiếp theo — Thêm câu hỏi →'}</Text>
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
  doneBtn: { paddingHorizontal: 16, paddingVertical: 7, borderRadius: 20 },
  doneBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  scroll: { padding: 20, paddingBottom: 100 },
  banner: { borderRadius: 24, padding: 20, alignItems: 'center', marginBottom: 20 },
  bannerEmoji: { fontSize: 36, marginBottom: 8 },
  bannerTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 4 },
  bannerSub: { fontSize: 13, textAlign: 'center' },
  summaryBanner: { borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1.5 },
  summaryTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
  summaryMeta: { fontSize: 13 },
  sectionLabel: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 20, marginBottom: 10 },
  sectionEmoji: { fontSize: 16 },
  sectionText: { fontSize: 13, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  input: { borderWidth: 2, borderRadius: 18, padding: 14, fontSize: 15 },
  textArea: { borderWidth: 2, borderRadius: 18, padding: 14, fontSize: 15, minHeight: 90 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderWidth: 2, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8 },
  chipText: { fontSize: 13, fontWeight: '600' },
  toggleRow: { flexDirection: 'row', borderRadius: 18, borderWidth: 1, padding: 4, overflow: 'hidden' },
  toggleItem: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 14 },
  toggleItemActive: { backgroundColor: '#CE82FF' },
  toggleText: { fontSize: 14, fontWeight: '600' },
  diffRow: { flexDirection: 'row', gap: 10 },
  diffItem: { flex: 1, borderWidth: 2, borderRadius: 18, paddingVertical: 12, alignItems: 'center' },
  diffText: { fontSize: 14, fontWeight: 'bold' },
  submitBtn: { marginTop: 28, backgroundColor: '#CE82FF', borderRadius: 20, paddingVertical: 16, alignItems: 'center' },
  disabledBtn: { opacity: 0.6 },
  submitText: { color: '#fff', fontWeight: 'bold', fontSize: 16, letterSpacing: 0.3 },
  // Phase 2
  questionCard: {
    borderRadius: 16, borderWidth: 1.5, padding: 14, marginBottom: 12,
  },
  questionCardTop: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  qIndexBadge: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  qIndexText: { color: '#fff', fontWeight: 'bold', fontSize: 13 },
  qTypeBadge: { borderRadius: 12, paddingHorizontal: 10, paddingVertical: 3 },
  qTypeBadgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  deleteQBtn: { marginLeft: 'auto', padding: 4 },
  deleteQText: { color: '#ff4b4b', fontSize: 16, fontWeight: 'bold' },
  questionText: { fontSize: 14, fontWeight: '600', lineHeight: 20 },
  optionPreviewList: { marginTop: 8, gap: 4 },
  optionPreview: { fontSize: 13 },
  addForm: { borderRadius: 20, borderWidth: 1.5, padding: 16, marginBottom: 12 },
  addFormTitle: { fontSize: 15, fontWeight: 'bold', marginBottom: 12 },
  smallLabel: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.4 },
  optionRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  correctMark: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  optionInput: { flex: 1, borderWidth: 1.5, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 9, fontSize: 14 },
  formBtns: { flexDirection: 'row', gap: 10, marginTop: 16 },
  cancelBtn: { flex: 1, borderWidth: 1.5, borderRadius: 16, paddingVertical: 12, alignItems: 'center' },
  cancelBtnText: { fontSize: 14, fontWeight: '600' },
  addQBtn: { flex: 2, backgroundColor: '#CE82FF', borderRadius: 16, paddingVertical: 12, alignItems: 'center' },
  addQBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  addNewBtn: { borderWidth: 2, borderStyle: 'dashed', borderRadius: 20, paddingVertical: 16, alignItems: 'center', marginTop: 4 },
  addNewBtnText: { fontSize: 15, fontWeight: '700' },
});
