import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { AppHeader, EmptyState, PrimaryButton, Screen, SectionHeading } from '@/components/AppUI';
import { useProjects } from '@/context/ProjectContext';
import { useColors } from '@/hooks/useColors';
import { formatDate } from '@/types/inspection';

export default function VisitsScreen() {
  const colors = useColors();
  const router = useRouter();
  const { projects } = useProjects();
  const projectsWithVisits = projects.filter((project) => project.lastVisitAt);

  return (
    <Screen>
      <AppHeader eyebrow="ثبت و پیگیری" title="بازدیدها" />
      <View style={[styles.infoBanner, { backgroundColor: colors.accent }]}>
        <Feather name="wifi-off" size={18} color={colors.accentForeground} />
        <Text style={[styles.infoText, { color: colors.accentForeground }]}>اطلاعات بازدیدها روی دستگاه شما ذخیره می‌شود و برای کارگاه بدون اینترنت آماده است.</Text>
      </View>
      <PrimaryButton label="ثبت بازدید جدید" icon="plus" onPress={() => Alert.alert('ثبت بازدید', 'فرم ثبت بازدید در مرحله بعد اضافه می‌شود. پروژه مورد نظر را از فهرست پروژه‌ها انتخاب کنید.')} />
      <SectionHeading title="آخرین بازدیدها" action={`${projectsWithVisits.length} بازدید`} />
      {projectsWithVisits.length ? projectsWithVisits.map((project) => (
        <View key={project.id} style={[styles.visitCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.visitIcon, { backgroundColor: colors.secondary }]}>
            <Feather name="calendar" size={18} color={colors.primary} />
          </View>
          <View style={styles.visitCopy}>
            <Text style={[styles.visitTitle, { color: colors.foreground }]}>{project.name}</Text>
            <Text style={[styles.visitMeta, { color: colors.mutedForeground }]}>بازدید آخر • {formatDate(project.lastVisitAt)}</Text>
          </View>
          <Feather name="chevron-left" size={17} color={colors.mutedForeground} />
        </View>
      )) : <EmptyState icon="calendar" title="هنوز بازدیدی ثبت نشده" description="با ثبت اولین بازدید، تاریخچه و پیگیری پیشرفت پروژه‌ها را اینجا ببینید." />}
      <View style={styles.linkWrap}>
        <Text onPress={() => router.push('/projects')} style={[styles.link, { color: colors.primary }]}>انتخاب پروژه برای بازدید</Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  infoBanner: { borderRadius: 17, padding: 15, flexDirection: 'row', alignItems: 'center', gap: 10 },
  infoText: { flex: 1, fontSize: 12, lineHeight: 20, textAlign: 'right' },
  visitCard: { minHeight: 78, borderRadius: 18, borderWidth: 1, padding: 13, flexDirection: 'row', alignItems: 'center', gap: 11 },
  visitIcon: { width: 40, height: 40, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  visitCopy: { flex: 1, alignItems: 'flex-end' },
  visitTitle: { fontSize: 14, fontWeight: '700', textAlign: 'right' },
  visitMeta: { fontSize: 11, marginTop: 5, textAlign: 'right' },
  linkWrap: { alignItems: 'center', marginTop: -5 },
  link: { fontSize: 13, fontWeight: '700' },
});