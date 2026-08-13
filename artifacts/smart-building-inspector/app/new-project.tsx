import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { KeyboardAwareScrollViewCompat } from '@/components/KeyboardAwareScrollViewCompat';
import { IconButton, PrimaryButton } from '@/components/AppUI';
import { useProjects } from '@/context/ProjectContext';
import { useColors } from '@/hooks/useColors';
import { DEFAULT_STAGES, Project, ProjectStatus } from '@/types/inspection';

type FormState = {
  name: string;
  address: string;
  ownerName: string;
  ownerPhone: string;
  buildingPermitNumber: string;
  renovationCode: string;
  buildingType: string;
  numberOfFloors: string;
  currentStageId: string;
};

const emptyForm: FormState = {
  name: '',
  address: '',
  ownerName: '',
  ownerPhone: '',
  buildingPermitNumber: '',
  renovationCode: '',
  buildingType: 'مسکونی',
  numberOfFloors: '۱',
  currentStageId: DEFAULT_STAGES[0].id,
};

function Field({ label, value, onChangeText, placeholder, keyboardType = 'default' }: { label: string; value: string; onChangeText: (value: string) => void; placeholder: string; keyboardType?: 'default' | 'phone-pad' | 'numeric' }) {
  const colors = useColors();
  return (
    <View style={styles.field}>
      <Text style={[styles.label, { color: colors.foreground }]}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.mutedForeground}
        keyboardType={keyboardType}
        style={[styles.input, { color: colors.foreground, backgroundColor: colors.card, borderColor: colors.input, writingDirection: 'rtl' }]}
        textAlign="right"
      />
    </View>
  );
}

export default function NewProjectScreen() {
  const colors = useColors();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { projects, addProject, updateProject } = useProjects();
  const existingProject = id ? projects.find((project) => project.id === id) : undefined;
  const [form, setForm] = useState<FormState>(emptyForm);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!existingProject) return;
    setForm({
      name: existingProject.name,
      address: existingProject.address,
      ownerName: existingProject.ownerName,
      ownerPhone: existingProject.ownerPhone ?? '',
      buildingPermitNumber: existingProject.buildingPermitNumber ?? '',
      renovationCode: existingProject.renovationCode ?? '',
      buildingType: existingProject.buildingType,
      numberOfFloors: String(existingProject.numberOfFloors),
      currentStageId: existingProject.currentStageId,
    });
  }, [existingProject]);

  const setField = (key: keyof FormState) => (value: string) => setForm((current) => ({ ...current, [key]: value }));

  const save = async () => {
    if (!form.name.trim() || !form.address.trim()) {
      Alert.alert('اطلاعات ناقص', 'نام پروژه و آدرس را وارد کنید.');
      return;
    }
    setIsSaving(true);
    try {
      if (existingProject) {
        await updateProject(existingProject.id, {
          name: form.name.trim(),
          address: form.address.trim(),
          ownerName: form.ownerName.trim() || 'ثبت نشده',
          ownerPhone: form.ownerPhone.trim(),
          buildingPermitNumber: form.buildingPermitNumber.trim(),
          renovationCode: form.renovationCode.trim(),
          buildingType: form.buildingType.trim() || 'مسکونی',
          numberOfFloors: Number(form.numberOfFloors) || 1,
          currentStageId: form.currentStageId,
        });
        router.back();
      } else {
        const nextProject = await addProject({
          name: form.name.trim(),
          address: form.address.trim(),
          ownerName: form.ownerName.trim() || 'ثبت نشده',
          ownerPhone: form.ownerPhone.trim(),
          caseNumber: '',
          buildingPermitNumber: form.buildingPermitNumber.trim(),
          renovationCode: form.renovationCode.trim(),
          permitDate: '',
          buildingType: form.buildingType.trim() || 'مسکونی',
          numberOfFloors: Number(form.numberOfFloors) || 1,
          startDate: new Date().toISOString(),
          currentStageId: form.currentStageId,
          progressPercentage: 0,
          status: 'ACTIVE' as ProjectStatus,
          lastVisitAt: undefined,
        });
        router.replace({ pathname: '/project/[id]', params: { id: nextProject.id } });
      }
    } catch {
      Alert.alert('ذخیره انجام نشد', 'امکان ذخیره پروژه وجود نداشت. دوباره تلاش کنید.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.topBar}>
        <IconButton icon="x" accessibilityLabel="بستن" onPress={() => router.back()} />
        <View style={styles.topTitle}>
          <Text style={[styles.eyebrow, { color: colors.primary }]}>{existingProject ? 'ویرایش اطلاعات' : 'پروژه جدید'}</Text>
          <Text style={[styles.title, { color: colors.foreground }]}>{existingProject ? 'ویرایش پروژه' : 'افزودن پروژه'}</Text>
        </View>
        <View style={styles.placeholder} />
      </View>
      <KeyboardAwareScrollViewCompat contentContainerStyle={styles.content} bottomOffset={24} showsVerticalScrollIndicator={false}>
        <Text style={[styles.helper, { color: colors.mutedForeground }]}>اطلاعات پایه پروژه را ثبت کنید. جزئیات تکمیلی را هر زمان می‌توانید ویرایش کنید.</Text>
        <Field label="نام پروژه *" value={form.name} onChangeText={setField('name')} placeholder="مثلاً پروژه مسکونی نیاوران" />
        <Field label="آدرس پروژه *" value={form.address} onChangeText={setField('address')} placeholder="شهر، محله، خیابان" />
        <Field label="نام مالک / کارفرما" value={form.ownerName} onChangeText={setField('ownerName')} placeholder="نام شخص یا شرکت" />
        <Field label="شماره تماس مالک" value={form.ownerPhone} onChangeText={setField('ownerPhone')} placeholder="۰۹۱۲..." keyboardType="phone-pad" />
        <View style={styles.fieldRow}>
          <View style={styles.halfField}><Field label="تعداد طبقات" value={form.numberOfFloors} onChangeText={setField('numberOfFloors')} placeholder="۱" keyboardType="numeric" /></View>
          <View style={styles.halfField}><Field label="نوع ساختمان" value={form.buildingType} onChangeText={setField('buildingType')} placeholder="مسکونی" /></View>
        </View>
        <View style={styles.fieldRow}>
          <View style={styles.halfField}><Field label="کد نوسازی" value={form.renovationCode} onChangeText={setField('renovationCode')} placeholder="اختیاری" /></View>
          <View style={styles.halfField}><Field label="شماره پروانه" value={form.buildingPermitNumber} onChangeText={setField('buildingPermitNumber')} placeholder="اختیاری" /></View>
        </View>
        <View style={styles.stageField}>
          <Text style={[styles.label, { color: colors.foreground }]}>مرحله فعلی</Text>
          <View style={styles.stageGrid}>
            {DEFAULT_STAGES.slice(0, 6).map((stage) => (
              <Pressable
                key={stage.id}
                onPress={() => setField('currentStageId')(stage.id)}
                style={[styles.stageChip, { backgroundColor: form.currentStageId === stage.id ? colors.primary : colors.card, borderColor: form.currentStageId === stage.id ? colors.primary : colors.input }]}
              >
                <Text style={[styles.stageChipText, { color: form.currentStageId === stage.id ? colors.primaryForeground : colors.mutedForeground }]}>{stage.name}</Text>
              </Pressable>
            ))}
          </View>
        </View>
        <PrimaryButton label={isSaving ? 'در حال ذخیره...' : existingProject ? 'ذخیره تغییرات' : 'ساخت پروژه'} icon={isSaving ? 'clock' : 'check'} onPress={save} />
        <View style={styles.localNote}>
          <Feather name="save" size={15} color={colors.primary} />
          <Text style={[styles.localNoteText, { color: colors.mutedForeground }]}>این اطلاعات فعلاً به‌صورت محلی روی دستگاه ذخیره می‌شود.</Text>
        </View>
      </KeyboardAwareScrollViewCompat>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  topTitle: { flex: 1, alignItems: 'flex-end' },
  eyebrow: { fontSize: 11, fontWeight: '700', marginBottom: 4, textAlign: 'right' },
  title: { fontSize: 23, fontWeight: '700', textAlign: 'right' },
  placeholder: { width: 42 },
  content: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 34, gap: 16 },
  helper: { fontSize: 12, lineHeight: 21, textAlign: 'right', marginBottom: 3 },
  field: { gap: 8 },
  label: { fontSize: 12, fontWeight: '700', textAlign: 'right' },
  input: { minHeight: 50, borderWidth: 1, borderRadius: 15, paddingHorizontal: 14, fontSize: 13 },
  fieldRow: { flexDirection: 'row', gap: 10 },
  halfField: { flex: 1 },
  stageField: { gap: 9 },
  stageGrid: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 8 },
  stageChip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 11, paddingVertical: 9 },
  stageChipText: { fontSize: 11, fontWeight: '600' },
  localNote: { flexDirection: 'row', gap: 8, justifyContent: 'center', alignItems: 'center', paddingTop: 1 },
  localNoteText: { fontSize: 11, textAlign: 'center' },
});