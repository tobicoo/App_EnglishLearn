import { forwardRef, useCallback, useImperativeHandle, useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Switch, Text, TextInput, View } from 'react-native';

const showValue = (value) => (value === null || value === undefined ? '' : String(value));

const UNIT_KIND_OPTIONS = [
  { value: 'LESSON', label: 'Lesson' },
  { value: 'REVIEW', label: 'Review' },
  { value: 'CHECKPOINT', label: 'Checkpoint' },
];

const EXERCISE_TYPE_OPTIONS = [
  { value: 'MULTIPLE_CHOICE', label: 'Trắc nghiệm' },
  { value: 'FILL_BLANK', label: 'Điền từ' },
  { value: 'MATCHING', label: 'Nối cặp' },
];

const DEFAULT_MATCHING_PROMPT = 'Nối các cặp phù hợp';

const splitAcceptedAnswers = (answerText) => {
  const answers = showValue(answerText)
    .split('|')
    .map((answer) => answer.trim())
    .filter(Boolean);

  return answers.length ? answers.map((text) => ({ text })) : [{ text: '' }];
};

const buildAnswerText = (answers) => answers.map((answer) => answer.text.trim()).filter(Boolean).join('|');

const getDefaultOptions = () => [{ id: null, text: '', isCorrect: true }, { id: null, text: '', isCorrect: false }];
const getDefaultMatchingPairs = () => [{ id: null, leftText: '', rightText: '' }];

function Field({ label, value, onChangeText, keyboardType = 'default', multiline = false }) {
  return (
    <View style={styles.fieldBlock}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={[styles.input, multiline && styles.multilineInput]}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        multiline={multiline}
        placeholderTextColor="#8a8f99"
      />
    </View>
  );
}

function ChoiceSelector({ label, value, options, onChange }) {
  return (
    <View style={styles.fieldBlock}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.choiceRow}>
        {options.map((option) => {
          const selected = value === option.value;
          return (
            <Pressable
              key={option.value}
              style={[styles.choiceChip, selected && styles.choiceChipActive]}
              onPress={() => onChange(option.value)}
            >
              <Text style={[styles.choiceChipText, selected && styles.choiceChipTextActive]}>{option.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function Badge({ text, color = '#6750A4', bg = '#EADDFF' }) {
  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={[styles.badgeText, { color }]}>{text}</Text>
    </View>
  );
}

function MatchingPreview({ pairs }) {
  const completePairs = pairs.filter((pair) => pair.leftText.trim() && pair.rightText.trim());
  if (completePairs.length === 0) {
    return null;
  }

  return (
    <View style={styles.previewBox}>
      <Text style={styles.previewTitle}>Preview</Text>
      {completePairs.map((pair, index) => (
        <View key={`${pair.id || 'new'}-${index}`} style={styles.previewRow}>
          <Text style={styles.previewLeft}>{pair.leftText.trim()}</Text>
          <Text style={styles.previewArrow}>→</Text>
          <Text style={styles.previewRight}>{pair.rightText.trim()}</Text>
        </View>
      ))}
    </View>
  );
}

function Breadcrumb({ items, onPress }) {
  return (
    <View style={styles.breadcrumbRow}>
      {items.map((item, index) => (
        <Pressable key={item.key} onPress={() => onPress(index)} style={styles.breadcrumbItem}>
          <Text style={[styles.breadcrumbText, index === items.length - 1 && styles.breadcrumbActive]}>
            {item.label}
          </Text>
          {index < items.length - 1 ? <Text style={styles.breadcrumbSep}> › </Text> : null}
        </Pressable>
      ))}
    </View>
  );
}

const AdminContent = forwardRef(function AdminContent({
  sections,
  savingKey,
  onSetStatus,
  onSaveSection,
  onCreateSection,
  onDeleteSection,
  onSaveUnit,
  onCreateUnit,
  onDeleteUnit,
  onSaveExercise,
  onCreateExercise,
  onDeleteExercise,
}, ref) {
  const [view, setView] = useState('sections'); // sections | section | unit | exercise
  const [selectedSectionId, setSelectedSectionId] = useState(null);
  const [selectedUnitId, setSelectedUnitId] = useState(null);
  const [selectedExerciseId, setSelectedExerciseId] = useState(null);

  // Forms
  const [sectionForm, setSectionForm] = useState({ title: '', subtitle: '', sortOrder: '1', isPublished: true });
  const [unitForm, setUnitForm] = useState({ title: '', description: '', kind: 'LESSON', sortOrder: '1', xpReward: '20', isPublished: true });
  const [exerciseForm, setExerciseForm] = useState({ prompt: '', answerText: '', explanation: '', sortOrder: '1', xpReward: '5', type: 'MULTIPLE_CHOICE' });
  const [optionForms, setOptionForms] = useState([]);
  const [acceptedAnswerForms, setAcceptedAnswerForms] = useState([{ text: '' }]);
  const [matchingPairForms, setMatchingPairForms] = useState([]);

  const selectedSection = useMemo(() => sections.find((s) => s.id === selectedSectionId) || null, [sections, selectedSectionId]);
  const selectedUnit = useMemo(() => selectedSection?.units?.find((u) => u.id === selectedUnitId) || null, [selectedSection, selectedUnitId]);
  const selectedExercise = useMemo(() => selectedUnit?.exercises?.find((e) => e.id === selectedExerciseId) || null, [selectedUnit, selectedExerciseId]);

  const goSections = () => { setView('sections'); setSelectedSectionId(null); setSelectedUnitId(null); setSelectedExerciseId(null); };
  const goSection = (sectionId) => { setSelectedSectionId(sectionId); setView('section'); setSelectedUnitId(null); setSelectedExerciseId(null); };
  const goUnit = (unitId) => { setSelectedUnitId(unitId); setView('unit'); setSelectedExerciseId(null); };
  const goExercise = (exerciseId) => { setSelectedExerciseId(exerciseId); setView('exercise'); };

  const goBackOneLevel = useCallback(() => {
    if (view === 'create-section') { goSections(); return true; }
    if (view === 'create-unit') { goSection(selectedSectionId); return true; }
    if (view === 'create-exercise') { goUnit(selectedUnitId); return true; }
    if (view === 'exercise') { goUnit(selectedUnitId); return true; }
    if (view === 'unit') { goSection(selectedSectionId); return true; }
    if (view === 'section') { goSections(); return true; }
    return false;
  }, [selectedSectionId, selectedUnitId, view]);

  useImperativeHandle(ref, () => ({
    goBackOneLevel,
  }), [goBackOneLevel]);

  // Populate forms when selection changes
  const populateSectionForm = (section) => {
    setSectionForm({
      title: showValue(section.title),
      subtitle: showValue(section.subtitle ?? section.subTitle),
      sortOrder: showValue(section.sortOrder ?? section.order ?? 1),
      isPublished: section.isPublished !== false,
    });
  };

  const populateUnitForm = (unit) => {
    setUnitForm({
      title: showValue(unit.title),
      description: showValue(unit.description),
      kind: showValue(unit.kind || 'LESSON').toUpperCase(),
      sortOrder: showValue(unit.sortOrder ?? unit.order ?? 1),
      xpReward: showValue(unit.xpReward ?? unit.baseXp ?? 20),
      isPublished: unit.isPublished !== false,
    });
  };

  const populateExerciseForm = (exercise) => {
    setExerciseForm({
      prompt: showValue(exercise.prompt),
      answerText: showValue(exercise.answerText),
      explanation: showValue(exercise.explanation ?? exercise.instruction),
      sortOrder: showValue(exercise.sortOrder ?? exercise.order ?? 1),
      xpReward: showValue(exercise.xpReward ?? 5),
      type: showValue(exercise.type || 'MULTIPLE_CHOICE').toUpperCase(),
    });
    setOptionForms((exercise.options || []).map((option) => ({
      id: option.id,
      text: showValue(option.text),
      isCorrect: option.id === exercise.correctOptionId,
    })));
    setAcceptedAnswerForms(splitAcceptedAnswers(exercise.answerText));
    setMatchingPairForms((exercise.matchingPairs || exercise.pairs || []).map((pair) => ({
      id: pair.id,
      leftText: showValue(pair.leftText),
      rightText: showValue(pair.rightText),
    })));
  };

  const selectExerciseType = (nextType) => {
    setExerciseForm((current) => ({ ...current, type: nextType }));
    if (nextType === 'MULTIPLE_CHOICE' && optionForms.length === 0) setOptionForms(getDefaultOptions());
    if (nextType === 'FILL_BLANK' && acceptedAnswerForms.length === 0) setAcceptedAnswerForms([{ text: '' }]);
    if (nextType === 'MATCHING' && matchingPairForms.length === 0) setMatchingPairForms(getDefaultMatchingPairs());
  };

  // Create / Delete helpers
  const doCreateSection = async () => {
    if (!sectionForm.title.trim()) {
      onSetStatus('error', 'Tên section là bắt buộc.');
      return;
    }
    const data = await onCreateSection({
      title: sectionForm.title,
      subtitle: sectionForm.subtitle || null,
      sortOrder: Number(sectionForm.sortOrder) || 1,
      isPublished: sectionForm.isPublished,
    });
    if (!data) return;
    onSetStatus('success', 'Đã tạo section mới.');
    if (data?.id) goSection(data.id);
  };

  const doDeleteSection = (section) => {
    Alert.alert('Xóa section', `Xóa "${section.title}" và tất cả unit, câu hỏi bên trong?`, [
      { text: 'Hủy', style: 'cancel' },
      { text: 'Xóa', style: 'destructive', onPress: async () => {
        const ok = await onDeleteSection(section.id);
        if (!ok) return;
        onSetStatus('success', 'Đã xóa section.');
        goSections();
      }},
    ]);
  };

  const doCreateUnit = async () => {
    if (!selectedSection) return;
    const kind = UNIT_KIND_OPTIONS.some((option) => option.value === unitForm.kind) ? unitForm.kind : 'LESSON';
    const data = await onCreateUnit({
      sectionId: selectedSection.id,
      title: unitForm.title || null,
      description: unitForm.description || null,
      kind,
      sortOrder: Number(unitForm.sortOrder) || 1,
      xpReward: Number(unitForm.xpReward) || 20,
      isPublished: unitForm.isPublished,
    });
    if (!data) return;
    onSetStatus('success', 'Đã tạo unit mới.');
    if (data?.id) goUnit(data.id);
  };

  const doDeleteUnit = (unit) => {
    Alert.alert('Xóa unit', `Xóa "${unit.title || `Unit ${unit.sortOrder}`}" và tất cả câu hỏi bên trong?`, [
      { text: 'Hủy', style: 'cancel' },
      { text: 'Xóa', style: 'destructive', onPress: async () => {
        const ok = await onDeleteUnit(unit.id);
        if (!ok) return;
        onSetStatus('success', 'Đã xóa unit.');
        goSection(selectedSection.id);
      }},
    ]);
  };

  const doCreateExercise = async () => {
    if (!selectedUnit) return;
    const type = EXERCISE_TYPE_OPTIONS.some((option) => option.value === exerciseForm.type) ? exerciseForm.type : 'MULTIPLE_CHOICE';
    const prompt = type === 'MATCHING' ? DEFAULT_MATCHING_PROMPT : exerciseForm.prompt.trim();
    if (!prompt) {
      onSetStatus('error', 'Nội dung câu hỏi là bắt buộc.');
      return;
    }
    const extra = {};
    if (type === 'MULTIPLE_CHOICE') {
      const opts = optionForms.filter((o) => o.text.trim());
      if (opts.length < 2) { onSetStatus('error', 'Cần ít nhất 2 options.'); return; }
      if (!opts.some((option) => option.isCorrect)) { onSetStatus('error', 'Cần chọn 1 option đúng.'); return; }
      extra.options = opts;
    } else if (type === 'FILL_BLANK') {
      const answerText = buildAnswerText(acceptedAnswerForms);
      if (!answerText) { onSetStatus('error', 'Cần ít nhất 1 đáp án đúng.'); return; }
      extra.answerText = answerText;
    } else {
      const incompletePairIndex = matchingPairForms.findIndex((p) => p.leftText.trim() || p.rightText.trim() ? !(p.leftText.trim() && p.rightText.trim()) : false);
      if (incompletePairIndex >= 0) { onSetStatus('error', `Cặp matching ${incompletePairIndex + 1} cần đủ vế trái và vế phải.`); return; }
      const pairs = matchingPairForms.filter((p) => p.leftText.trim() && p.rightText.trim());
      if (pairs.length < 1) { onSetStatus('error', 'Cần ít nhất 1 cặp matching.'); return; }
      extra.matchingPairs = pairs;
    }
    const data = await onCreateExercise({
      unitId: selectedUnit.id,
      type,
      prompt,
      answerText: type === 'FILL_BLANK' ? extra.answerText : null,
      explanation: exerciseForm.explanation || null,
      sortOrder: Number(exerciseForm.sortOrder) || 1,
      xpReward: Number(exerciseForm.xpReward) || 5,
      ...extra,
    });
    if (!data) return;
    onSetStatus('success', 'Đã tạo câu hỏi mới.');
    if (data?.id) goExercise(data.id);
  };

  const doDeleteExercise = (exercise) => {
    Alert.alert('Xóa câu hỏi', `Xóa câu hỏi #${exercise.sortOrder || exercise.order}?`, [
      { text: 'Hủy', style: 'cancel' },
      { text: 'Xóa', style: 'destructive', onPress: async () => {
        const ok = await onDeleteExercise(exercise.id);
        if (!ok) return;
        onSetStatus('success', 'Đã xóa câu hỏi.');
        goUnit(selectedUnit.id);
      }},
    ]);
  };

  // Option / Pair form helpers
  const updateOptionForm = (index, patch) => setOptionForms((current) => current.map((o, i) => (i === index ? { ...o, ...patch } : o)));
  const markCorrectOption = (index) => setOptionForms((current) => current.map((o, i) => ({ ...o, isCorrect: i === index })));
  const addOptionForm = () => setOptionForms((current) => [...current, { id: null, text: '', isCorrect: current.length === 0 }]);
  const removeOptionForm = (index) => setOptionForms((current) => current.filter((_, i) => i !== index));
  const updateAcceptedAnswerForm = (index, text) => setAcceptedAnswerForms((current) => current.map((answer, i) => (i === index ? { ...answer, text } : answer)));
  const addAcceptedAnswerForm = () => setAcceptedAnswerForms((current) => [...current, { text: '' }]);
  const removeAcceptedAnswerForm = (index) => setAcceptedAnswerForms((current) => current.filter((_, i) => i !== index));
  const updateMatchingPairForm = (index, patch) => setMatchingPairForms((current) => current.map((p, i) => (i === index ? { ...p, ...patch } : p)));
  const addMatchingPairForm = () => setMatchingPairForms((current) => [...current, { id: null, leftText: '', rightText: '' }]);
  const removeMatchingPairForm = (index) => setMatchingPairForms((current) => current.filter((_, i) => i !== index));

  // --- Views ---

  const renderSectionsList = () => (
    <View>
      <View style={styles.rowBetween}>
        <Text style={styles.cardTitle}>Sections</Text>
        <Pressable style={styles.smallButton} onPress={() => { setSectionForm({ title: '', subtitle: '', sortOrder: '1', isPublished: true }); setView('create-section'); }}>
          <Text style={styles.smallButtonText}>+ Thêm</Text>
        </Pressable>
      </View>
      <Text style={styles.helpText}>Chạm để xem chi tiết và quản lý unit.</Text>
      {sections.map((section) => (
        <Pressable key={section.id} style={styles.listItem} onPress={() => { populateSectionForm(section); goSection(section.id); }}>
          <View style={styles.listItemRow}>
            <View style={styles.listItemMain}>
              <Text style={styles.listItemTitle}>{section.title}</Text>
              <Text style={styles.listItemSub}>{section.subtitle || section.subTitle || 'Không có mô tả'}</Text>
            </View>
            <View style={styles.listItemMeta}>
              <Badge text={section.isPublished !== false ? 'Published' : 'Draft'} color={section.isPublished !== false ? '#146C2E' : '#49454F'} bg={section.isPublished !== false ? '#DDF8E7' : '#F7F7F7'} />
              <Text style={styles.listItemCount}>{section.units?.length ?? 0} unit</Text>
            </View>
          </View>
          <Pressable style={styles.inlineDelete} onPress={() => doDeleteSection(section)}>
            <Text style={styles.inlineDeleteText}>Xóa</Text>
          </Pressable>
        </Pressable>
      ))}
      {sections.length === 0 ? <Text style={styles.emptyText}>Chưa có section.</Text> : null}
    </View>
  );

  const renderCreateSection = () => (
    <View>
      <Breadcrumb items={[{ key: 'sections', label: 'Sections' }]} onPress={() => goSections()} />
      <Text style={[styles.cardTitle, { marginTop: 12 }]}>Tạo section mới</Text>
      <Field label="Tên section *" value={sectionForm.title} onChangeText={(t) => setSectionForm((c) => ({ ...c, title: t }))} />
      <Field label="Mô tả" value={sectionForm.subtitle} onChangeText={(t) => setSectionForm((c) => ({ ...c, subtitle: t }))} />
      <Field label="Thứ tự" value={sectionForm.sortOrder} onChangeText={(t) => setSectionForm((c) => ({ ...c, sortOrder: t }))} keyboardType="number-pad" />
      <View style={styles.switchRow}>
        <Text style={styles.fieldLabel}>Hiển thị</Text>
        <Switch value={sectionForm.isPublished} onValueChange={(v) => setSectionForm((c) => ({ ...c, isPublished: v }))} />
      </View>
      <Pressable style={[styles.primaryButton, savingKey === 'create-section' && styles.disabledButton]} onPress={doCreateSection} disabled={savingKey === 'create-section'}>
        <Text style={styles.primaryButtonText}>{savingKey === 'create-section' ? 'Đang tạo...' : 'Tạo section'}</Text>
      </Pressable>
    </View>
  );

  const renderSectionDetail = () => {
    if (!selectedSection) return null;
    return (
      <View>
        <Breadcrumb
          items={[{ key: 'sections', label: 'Sections' }, { key: 'section', label: selectedSection.title || 'Section' }]}
          onPress={(idx) => idx === 0 ? goSections() : null}
        />
        <View style={styles.rowBetween}>
          <Text style={[styles.cardTitle, { marginTop: 12 }]}>Chỉnh sửa section</Text>
          <Pressable style={styles.inlineDelete} onPress={() => doDeleteSection(selectedSection)}>
            <Text style={styles.inlineDeleteText}>Xóa section</Text>
          </Pressable>
        </View>
        <Field label="Tên section" value={sectionForm.title} onChangeText={(t) => setSectionForm((c) => ({ ...c, title: t }))} />
        <Field label="Mô tả" value={sectionForm.subtitle} onChangeText={(t) => setSectionForm((c) => ({ ...c, subtitle: t }))} />
        <Field label="Thứ tự" value={sectionForm.sortOrder} onChangeText={(t) => setSectionForm((c) => ({ ...c, sortOrder: t }))} keyboardType="number-pad" />
        <View style={styles.switchRow}>
          <Text style={styles.fieldLabel}>Hiển thị</Text>
          <Switch value={sectionForm.isPublished} onValueChange={(v) => setSectionForm((c) => ({ ...c, isPublished: v }))} />
        </View>
        <Pressable style={[styles.primaryButton, savingKey === 'section' && styles.disabledButton]} onPress={() => onSaveSection(selectedSection.id, sectionForm)} disabled={savingKey === 'section'}>
          <Text style={styles.primaryButtonText}>{savingKey === 'section' ? 'Đang lưu...' : 'Lưu section'}</Text>
        </Pressable>

        <View style={styles.divider} />
        <View style={styles.rowBetween}>
          <Text style={styles.cardTitle}>Units trong section</Text>
          <Pressable style={styles.smallButton} onPress={() => { setUnitForm({ title: '', description: '', kind: 'LESSON', sortOrder: String((selectedSection.units?.length || 0) + 1), xpReward: '20', isPublished: true }); setView('create-unit'); }}>
            <Text style={styles.smallButtonText}>+ Thêm</Text>
          </Pressable>
        </View>
        {(selectedSection.units || []).map((unit) => (
          <Pressable key={unit.id} style={styles.listItem} onPress={() => { populateUnitForm(unit); goUnit(unit.id); }}>
            <View style={styles.listItemRow}>
              <View style={styles.listItemMain}>
                <Text style={styles.listItemTitle}>{unit.title || `Unit ${unit.sortOrder}`}</Text>
                <Text style={styles.listItemSub}>{unit.description ? (unit.description.slice(0, 60) + (unit.description.length > 60 ? '...' : '')) : 'Không có mô tả'}</Text>
              </View>
              <View style={styles.listItemMeta}>
                <Badge text={unit.kind || 'LESSON'} color="#1967a3" bg="#eef8ff" />
                <Badge text={unit.isPublished !== false ? 'Published' : 'Draft'} color={unit.isPublished !== false ? '#146C2E' : '#49454F'} bg={unit.isPublished !== false ? '#DDF8E7' : '#F7F7F7'} />
              </View>
            </View>
          </Pressable>
        ))}
        {(selectedSection.units || []).length === 0 ? <Text style={styles.emptyText}>Chưa có unit.</Text> : null}
      </View>
    );
  };

  const renderCreateUnit = () => {
    if (!selectedSection) return null;
    return (
      <View>
        <Breadcrumb items={[{ key: 'sections', label: 'Sections' }, { key: 'section', label: selectedSection.title || 'Section' }]} onPress={(idx) => idx === 0 ? goSections() : goSection(selectedSection.id)} />
        <Text style={[styles.cardTitle, { marginTop: 12 }]}>Tạo unit mới</Text>
        <Field label="Tên unit" value={unitForm.title} onChangeText={(t) => setUnitForm((c) => ({ ...c, title: t }))} />
        <Field label="Mô tả" value={unitForm.description} onChangeText={(t) => setUnitForm((c) => ({ ...c, description: t }))} multiline />
        <ChoiceSelector label="Loại unit" value={unitForm.kind} options={UNIT_KIND_OPTIONS} onChange={(kind) => setUnitForm((c) => ({ ...c, kind }))} />
        <Field label="Thứ tự" value={unitForm.sortOrder} onChangeText={(t) => setUnitForm((c) => ({ ...c, sortOrder: t }))} keyboardType="number-pad" />
        <Field label="XP" value={unitForm.xpReward} onChangeText={(t) => setUnitForm((c) => ({ ...c, xpReward: t }))} keyboardType="number-pad" />
        <View style={styles.switchRow}>
          <Text style={styles.fieldLabel}>Hiển thị</Text>
          <Switch value={unitForm.isPublished} onValueChange={(v) => setUnitForm((c) => ({ ...c, isPublished: v }))} />
        </View>
        <Pressable style={[styles.primaryButton, savingKey === 'create-unit' && styles.disabledButton]} onPress={doCreateUnit} disabled={savingKey === 'create-unit'}>
          <Text style={styles.primaryButtonText}>{savingKey === 'create-unit' ? 'Đang tạo...' : 'Tạo unit'}</Text>
        </Pressable>
      </View>
    );
  };

  const renderUnitDetail = () => {
    if (!selectedUnit) return null;
    return (
      <View>
        <Breadcrumb
          items={[
            { key: 'sections', label: 'Sections' },
            { key: 'section', label: selectedSection?.title || 'Section' },
            { key: 'unit', label: selectedUnit.title || `Unit ${selectedUnit.sortOrder}` },
          ]}
          onPress={(idx) => { if (idx === 0) goSections(); else if (idx === 1) goSection(selectedSection.id); }}
        />
        <View style={styles.rowBetween}>
          <Text style={[styles.cardTitle, { marginTop: 12 }]}>Chỉnh sửa unit</Text>
          <Pressable style={styles.inlineDelete} onPress={() => doDeleteUnit(selectedUnit)}>
            <Text style={styles.inlineDeleteText}>Xóa unit</Text>
          </Pressable>
        </View>
        <Field label="Tên unit" value={unitForm.title} onChangeText={(t) => setUnitForm((c) => ({ ...c, title: t }))} />
        <Field label="Mô tả" value={unitForm.description} onChangeText={(t) => setUnitForm((c) => ({ ...c, description: t }))} multiline />
        <ChoiceSelector label="Loại unit" value={unitForm.kind} options={UNIT_KIND_OPTIONS} onChange={(kind) => setUnitForm((c) => ({ ...c, kind }))} />
        <Field label="Thứ tự" value={unitForm.sortOrder} onChangeText={(t) => setUnitForm((c) => ({ ...c, sortOrder: t }))} keyboardType="number-pad" />
        <Field label="XP" value={unitForm.xpReward} onChangeText={(t) => setUnitForm((c) => ({ ...c, xpReward: t }))} keyboardType="number-pad" />
        <View style={styles.switchRow}>
          <Text style={styles.fieldLabel}>Hiển thị</Text>
          <Switch value={unitForm.isPublished} onValueChange={(v) => setUnitForm((c) => ({ ...c, isPublished: v }))} />
        </View>
        <Pressable style={[styles.primaryButton, savingKey === 'unit' && styles.disabledButton]} onPress={() => onSaveUnit(selectedUnit.id, unitForm)} disabled={savingKey === 'unit'}>
          <Text style={styles.primaryButtonText}>{savingKey === 'unit' ? 'Đang lưu...' : 'Lưu unit'}</Text>
        </Pressable>

        <View style={styles.divider} />
        <View style={styles.rowBetween}>
          <Text style={styles.cardTitle}>Câu hỏi trong unit</Text>
          <Pressable style={styles.smallButton} onPress={() => {
            setExerciseForm({ prompt: '', answerText: '', explanation: '', sortOrder: String((selectedUnit.exercises?.length || 0) + 1), xpReward: '5', type: 'MULTIPLE_CHOICE' });
            setOptionForms(getDefaultOptions());
            setAcceptedAnswerForms([{ text: '' }]);
            setMatchingPairForms(getDefaultMatchingPairs());
            setView('create-exercise');
          }}>
            <Text style={styles.smallButtonText}>+ Thêm</Text>
          </Pressable>
        </View>
        {(selectedUnit.exercises || []).map((exercise) => {
          const typeIcon = exercise.type === 'MULTIPLE_CHOICE' ? '📝' : exercise.type === 'FILL_BLANK' ? '✏️' : '🔗';
          return (
            <Pressable key={exercise.id} style={styles.listItem} onPress={() => { populateExerciseForm(exercise); goExercise(exercise.id); }}>
              <View style={styles.listItemRow}>
                <View style={styles.listItemMain}>
                  <Text style={styles.listItemTitle}>{typeIcon} Câu {exercise.sortOrder || exercise.order}</Text>
                  <Text style={styles.listItemSub}>{exercise.prompt ? (exercise.prompt.slice(0, 60) + (exercise.prompt.length > 60 ? '...' : '')) : 'Không có nội dung'}</Text>
                </View>
              </View>
            </Pressable>
          );
        })}
        {(selectedUnit.exercises || []).length === 0 ? <Text style={styles.emptyText}>Chưa có câu hỏi.</Text> : null}
      </View>
    );
  };

  const renderCreateExercise = () => {
    if (!selectedUnit) return null;
    const type = String(exerciseForm.type || 'MULTIPLE_CHOICE').toUpperCase();
    return (
      <View>
        <Breadcrumb
          items={[
            { key: 'sections', label: 'Sections' },
            { key: 'section', label: selectedSection?.title || 'Section' },
            { key: 'unit', label: selectedUnit.title || `Unit ${selectedUnit.sortOrder}` },
          ]}
          onPress={(idx) => { if (idx === 0) goSections(); else if (idx === 1) goSection(selectedSection.id); else goUnit(selectedUnit.id); }}
        />
        <Text style={[styles.cardTitle, { marginTop: 12 }]}>Tạo câu hỏi mới</Text>
        <ChoiceSelector label="Loại câu hỏi *" value={type} options={EXERCISE_TYPE_OPTIONS} onChange={selectExerciseType} />
        {type === 'MATCHING' ? (
          <Text style={styles.helpText}>Câu hỏi sẽ dùng mặc định: “{DEFAULT_MATCHING_PROMPT}”. Bạn chỉ cần nhập các cặp trái/phải bên dưới.</Text>
        ) : (
          <>
            <Field label="Câu hỏi *" value={exerciseForm.prompt} onChangeText={(t) => setExerciseForm((c) => ({ ...c, prompt: t }))} multiline />
          </>
        )}
        <Field label="Giải thích" value={exerciseForm.explanation} onChangeText={(t) => setExerciseForm((c) => ({ ...c, explanation: t }))} multiline />
        <Field label="Thứ tự" value={exerciseForm.sortOrder} onChangeText={(t) => setExerciseForm((c) => ({ ...c, sortOrder: t }))} keyboardType="number-pad" />
        <Field label="XP" value={exerciseForm.xpReward} onChangeText={(t) => setExerciseForm((c) => ({ ...c, xpReward: t }))} keyboardType="number-pad" />
        {type === 'MULTIPLE_CHOICE' ? (
          <View style={styles.nestedEditor}>
            <View style={styles.nestedHeader}>
              <Text style={styles.nestedTitle}>Options</Text>
              <Pressable style={styles.smallButton} onPress={addOptionForm}><Text style={styles.smallButtonText}>Thêm</Text></Pressable>
            </View>
            {optionForms.map((option, index) => (
              <View key={option.id || `new-opt-${index}`} style={styles.nestedRow}>
                <Field label={`Option ${index + 1}`} value={option.text} onChangeText={(text) => updateOptionForm(index, { text })} />
                <View style={styles.rowActions}>
                  <Pressable style={[styles.secondaryButton, option.isCorrect && styles.correctButton]} onPress={() => markCorrectOption(index)}>
                    <Text style={[styles.secondaryButtonText, option.isCorrect && styles.correctButtonText]}>{option.isCorrect ? 'Đáp án đúng' : 'Chọn đúng'}</Text>
                  </Pressable>
                  <Pressable style={styles.dangerButton} onPress={() => removeOptionForm(index)}><Text style={styles.dangerButtonText}>Xóa</Text></Pressable>
                </View>
              </View>
            ))}
          </View>
        ) : type === 'FILL_BLANK' ? (
          <View style={styles.nestedEditor}>
            <View style={styles.nestedHeader}>
              <Text style={styles.nestedTitle}>Các đáp án đúng</Text>
              <Pressable style={styles.smallButton} onPress={addAcceptedAnswerForm}><Text style={styles.smallButtonText}>Thêm</Text></Pressable>
            </View>
            <Text style={styles.helpText}>Mỗi dòng là một đáp án được chấp nhận. Ví dụ từ hello có thể thêm chào và xin chào ở 2 dòng riêng.</Text>
            {acceptedAnswerForms.map((answer, index) => (
              <View key={`new-answer-${index}`} style={styles.nestedRow}>
                <Field label={`Đáp án ${index + 1}`} value={answer.text} onChangeText={(text) => updateAcceptedAnswerForm(index, text)} />
                <Pressable style={styles.dangerButton} onPress={() => removeAcceptedAnswerForm(index)}><Text style={styles.dangerButtonText}>Xóa</Text></Pressable>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.nestedEditor}>
            <View style={styles.nestedHeader}>
              <Text style={styles.nestedTitle}>Cặp matching</Text>
              <Pressable style={styles.smallButton} onPress={addMatchingPairForm}><Text style={styles.smallButtonText}>Thêm</Text></Pressable>
            </View>
            <Text style={styles.helpText}>Mỗi hàng là một cặp cần nối: vế trái sẽ hiện trong câu hỏi, vế phải là đáp án đúng tương ứng. Khuyến nghị 3-5 cặp.</Text>
            {matchingPairForms.map((pair, index) => (
              <View key={pair.id || `new-pair-${index}`} style={styles.nestedRow}>
                <Field label={`Vế trái ${index + 1}`} value={pair.leftText} onChangeText={(t) => updateMatchingPairForm(index, { leftText: t })} />
                <Field label={`Vế phải ${index + 1}`} value={pair.rightText} onChangeText={(t) => updateMatchingPairForm(index, { rightText: t })} />
                <Pressable style={styles.dangerButton} onPress={() => removeMatchingPairForm(index)}><Text style={styles.dangerButtonText}>Xóa cặp</Text></Pressable>
              </View>
            ))}
            <MatchingPreview pairs={matchingPairForms} />
          </View>
        )}
        <Pressable style={[styles.primaryButton, savingKey === 'create-exercise' && styles.disabledButton]} onPress={doCreateExercise} disabled={savingKey === 'create-exercise'}>
          <Text style={styles.primaryButtonText}>{savingKey === 'create-exercise' ? 'Đang tạo...' : 'Tạo câu hỏi'}</Text>
        </Pressable>
      </View>
    );
  };

  const renderExerciseDetail = () => {
    if (!selectedExercise) return null;
    const type = String(exerciseForm.type || selectedExercise.type || '').toUpperCase();
    return (
      <View>
        <Breadcrumb
          items={[
            { key: 'sections', label: 'Sections' },
            { key: 'section', label: selectedSection?.title || 'Section' },
            { key: 'unit', label: selectedUnit?.title || `Unit ${selectedUnit?.sortOrder}` },
            { key: 'exercise', label: `Câu ${selectedExercise.sortOrder || selectedExercise.order}` },
          ]}
          onPress={(idx) => {
            if (idx === 0) goSections();
            else if (idx === 1) goSection(selectedSection.id);
            else if (idx === 2) goUnit(selectedUnit.id);
          }}
        />
        <View style={styles.rowBetween}>
          <Text style={[styles.cardTitle, { marginTop: 12 }]}>Chỉnh sửa câu hỏi</Text>
          <Pressable style={styles.inlineDelete} onPress={() => doDeleteExercise(selectedExercise)}>
            <Text style={styles.inlineDeleteText}>Xóa câu hỏi</Text>
          </Pressable>
        </View>
        <Badge text={type} color="#4F378B" bg="#EADDFF" />
        <ChoiceSelector label="Loại câu hỏi" value={type} options={EXERCISE_TYPE_OPTIONS} onChange={selectExerciseType} />
        {type === 'MATCHING' ? (
          <Text style={styles.helpText}>Câu hỏi sẽ dùng mặc định: “{DEFAULT_MATCHING_PROMPT}”. Bạn chỉ cần quản lý các cặp trái/phải bên dưới.</Text>
        ) : (
          <>
            <Field label="Câu hỏi" value={exerciseForm.prompt} onChangeText={(t) => setExerciseForm((c) => ({ ...c, prompt: t }))} multiline />
          </>
        )}
        <Field label="Giải thích" value={exerciseForm.explanation} onChangeText={(t) => setExerciseForm((c) => ({ ...c, explanation: t }))} multiline />
        <Field label="Thứ tự" value={exerciseForm.sortOrder} onChangeText={(t) => setExerciseForm((c) => ({ ...c, sortOrder: t }))} keyboardType="number-pad" />
        <Field label="XP" value={exerciseForm.xpReward} onChangeText={(t) => setExerciseForm((c) => ({ ...c, xpReward: t }))} keyboardType="number-pad" />
        {type === 'MULTIPLE_CHOICE' ? (
          <View style={styles.nestedEditor}>
            <View style={styles.nestedHeader}>
              <Text style={styles.nestedTitle}>Options</Text>
              <Pressable style={styles.smallButton} onPress={addOptionForm}><Text style={styles.smallButtonText}>Thêm</Text></Pressable>
            </View>
            {optionForms.map((option, index) => (
              <View key={option.id || `opt-${index}`} style={styles.nestedRow}>
                <Field label={`Option ${index + 1}`} value={option.text} onChangeText={(text) => updateOptionForm(index, { text })} />
                <View style={styles.rowActions}>
                  <Pressable style={[styles.secondaryButton, option.isCorrect && styles.correctButton]} onPress={() => markCorrectOption(index)}>
                    <Text style={[styles.secondaryButtonText, option.isCorrect && styles.correctButtonText]}>{option.isCorrect ? 'Đáp án đúng' : 'Chọn đúng'}</Text>
                  </Pressable>
                  <Pressable style={styles.dangerButton} onPress={() => removeOptionForm(index)}><Text style={styles.dangerButtonText}>Xóa</Text></Pressable>
                </View>
              </View>
            ))}
          </View>
        ) : type === 'FILL_BLANK' ? (
          <View style={styles.nestedEditor}>
            <View style={styles.nestedHeader}>
              <Text style={styles.nestedTitle}>Các đáp án đúng</Text>
              <Pressable style={styles.smallButton} onPress={addAcceptedAnswerForm}><Text style={styles.smallButtonText}>Thêm</Text></Pressable>
            </View>
            <Text style={styles.helpText}>Mỗi dòng là một đáp án được chấp nhận. Ví dụ từ hello có thể thêm chào và xin chào ở 2 dòng riêng.</Text>
            {acceptedAnswerForms.map((answer, index) => (
              <View key={`answer-${index}`} style={styles.nestedRow}>
                <Field label={`Đáp án ${index + 1}`} value={answer.text} onChangeText={(text) => updateAcceptedAnswerForm(index, text)} />
                <Pressable style={styles.dangerButton} onPress={() => removeAcceptedAnswerForm(index)}><Text style={styles.dangerButtonText}>Xóa</Text></Pressable>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.nestedEditor}>
            <View style={styles.nestedHeader}>
              <Text style={styles.nestedTitle}>Cặp matching</Text>
              <Pressable style={styles.smallButton} onPress={addMatchingPairForm}><Text style={styles.smallButtonText}>Thêm</Text></Pressable>
            </View>
            <Text style={styles.helpText}>Mỗi hàng là một cặp cần nối: vế trái sẽ hiện trong câu hỏi, vế phải là đáp án đúng tương ứng. Khuyến nghị 3-5 cặp.</Text>
            {matchingPairForms.map((pair, index) => (
              <View key={pair.id || `pair-${index}`} style={styles.nestedRow}>
                <Field label={`Vế trái ${index + 1}`} value={pair.leftText} onChangeText={(t) => updateMatchingPairForm(index, { leftText: t })} />
                <Field label={`Vế phải ${index + 1}`} value={pair.rightText} onChangeText={(t) => updateMatchingPairForm(index, { rightText: t })} />
                <Pressable style={styles.dangerButton} onPress={() => removeMatchingPairForm(index)}><Text style={styles.dangerButtonText}>Xóa cặp</Text></Pressable>
              </View>
            ))}
            <MatchingPreview pairs={matchingPairForms} />
          </View>
        )}
        <Pressable style={[styles.primaryButton, savingKey === 'exercise' && styles.disabledButton]} onPress={() => onSaveExercise(selectedExercise.id, exerciseForm, optionForms, matchingPairForms, acceptedAnswerForms)} disabled={savingKey === 'exercise'}>
          <Text style={styles.primaryButtonText}>{savingKey === 'exercise' ? 'Đang lưu...' : 'Lưu câu hỏi'}</Text>
        </Pressable>
      </View>
    );
  };

  const views = {
    sections: renderSectionsList,
    'create-section': renderCreateSection,
    section: renderSectionDetail,
    'create-unit': renderCreateUnit,
    unit: renderUnitDetail,
    'create-exercise': renderCreateExercise,
    exercise: renderExerciseDetail,
  };

  return (
    <View style={styles.container}>
      {views[view]()}
    </View>
  );
});

export default AdminContent;

const styles = StyleSheet.create({
  container: { flex: 1 },
  cardTitle: { fontSize: 18, fontWeight: '900', color: '#1D1B20', marginBottom: 8 },
  helpText: { fontSize: 13, lineHeight: 20, color: '#625B71', marginBottom: 10 },
  fieldBlock: { marginTop: 10 },
  fieldLabel: { fontSize: 13, fontWeight: '800', color: '#49454F', marginBottom: 6 },
  input: { minHeight: 48, borderWidth: 1, borderColor: '#CAC4D0', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, color: '#1D1B20', fontSize: 15, backgroundColor: '#FFFBFE' },
  multilineInput: { minHeight: 92, textAlignVertical: 'top' },
  choiceRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  choiceChip: { minHeight: 40, borderRadius: 999, borderWidth: 1, borderColor: '#CAC4D0', backgroundColor: '#FFFBFE', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 14 },
  choiceChipActive: { backgroundColor: '#6750A4', borderColor: '#6750A4' },
  choiceChipText: { color: '#4F378B', fontSize: 13, fontWeight: '900' },
  choiceChipTextActive: { color: '#fff' },
  switchRow: { minHeight: 48, marginTop: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  primaryButton: { minHeight: 48, marginTop: 14, borderRadius: 16, backgroundColor: '#6750A4', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 18 },
  disabledButton: { backgroundColor: '#E7E0EC' },
  primaryButtonText: { color: '#fff', fontSize: 15, fontWeight: '900' },
  secondaryButton: { minHeight: 40, borderRadius: 16, backgroundColor: '#EADDFF', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 14 },
  secondaryButtonText: { color: '#4F378B', fontSize: 14, fontWeight: '900' },
  correctButton: { backgroundColor: '#DDF8E7' },
  correctButtonText: { color: '#146C2E' },
  dangerButton: { minHeight: 40, borderRadius: 16, backgroundColor: '#F9DEDC', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 14 },
  dangerButtonText: { color: '#B3261E', fontSize: 14, fontWeight: '900' },
  smallButton: { minHeight: 40, borderRadius: 20, backgroundColor: '#EADDFF', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 14 },
  smallButtonText: { color: '#4F378B', fontSize: 13, fontWeight: '900' },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 },
  rowActions: { flexDirection: 'row', gap: 8, marginTop: 10 },
  divider: { height: 1, backgroundColor: '#E7E0EC', marginVertical: 20 },
  emptyText: { color: '#625B71', fontSize: 14, lineHeight: 20, marginTop: 8 },
  badge: { borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4, alignSelf: 'flex-start' },
  badgeText: { fontSize: 12, fontWeight: '800' },
  breadcrumbRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 8 },
  breadcrumbItem: { flexDirection: 'row', alignItems: 'center' },
  breadcrumbText: { fontSize: 13, color: '#6750A4', fontWeight: '700' },
  breadcrumbActive: { color: '#1D1B20' },
  breadcrumbSep: { fontSize: 13, color: '#625B71', fontWeight: '700' },
  listItem: { marginTop: 10, padding: 14, borderRadius: 16, backgroundColor: '#FFFBFE', borderWidth: 1, borderColor: '#E7E0EC' },
  listItemRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  listItemMain: { flex: 1, paddingRight: 10 },
  listItemTitle: { fontSize: 15, fontWeight: '900', color: '#1D1B20' },
  listItemSub: { fontSize: 13, color: '#625B71', marginTop: 4, lineHeight: 18 },
  listItemMeta: { alignItems: 'flex-end', gap: 6 },
  listItemCount: { fontSize: 12, color: '#49454F', fontWeight: '700', marginTop: 4 },
  inlineDelete: { marginTop: 10, alignSelf: 'flex-start', backgroundColor: '#F9DEDC', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8 },
  inlineDeleteText: { color: '#B3261E', fontSize: 13, fontWeight: '900' },
  nestedEditor: { marginTop: 14, borderTopWidth: 1, borderTopColor: '#E7E0EC', paddingTop: 12 },
  nestedHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  nestedTitle: { fontSize: 15, fontWeight: '900', color: '#1D1B20' },
  nestedRow: { marginTop: 8, padding: 10, borderRadius: 16, backgroundColor: '#FFFBFE', borderWidth: 1, borderColor: '#E7E0EC' },
  previewBox: { marginTop: 12, borderRadius: 16, backgroundColor: '#F7F2FA', borderWidth: 1, borderColor: '#E7E0EC', padding: 12 },
  previewTitle: { color: '#4F378B', fontSize: 13, fontWeight: '900', marginBottom: 8 },
  previewRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  previewLeft: { flex: 1, color: '#1D1B20', fontSize: 13, fontWeight: '800' },
  previewArrow: { color: '#6750A4', fontSize: 13, fontWeight: '900' },
  previewRight: { flex: 1, color: '#1D1B20', fontSize: 13 },
});
