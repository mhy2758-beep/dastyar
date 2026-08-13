import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { AppHeader, IconButton, ModuleTile, ProgressBar, Screen, StatusPill } from '@/components/AppUI';
import { useProjects } from '@/context/ProjectContext';
import { useColors } from '@/hooks/useColors';
import { formatDate, getStageName } from '@/types/inspection';

export default function ProjectDetailsScreen() {
  const colors = useColors();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { projects } = useProjects();
  const project = projects.find((item) => item.id === id);

  if (!project) {
    return <Screen><AppHeader title="پروژه پیدا نشد" /><Text style={[styles.notFound, { color: colors.mutedForeground }]}>این پروژه دیگر در دسترس نیست.</Text></Screen>;
  }

  const showComingSoon = (moduleName: string) => Alert.alert(moduleName, 'این بخش در معماری برنامه آماده شده و در فاز بعدی تکمیل می‌شود.');
  const modules = [
    { icon: 'calendar' as const, title: 'بازدیدها', description: 'تاریخچه بازدیدها', onPress: () => router.push('/visits') },
    { icon: 'camera' as const, title: 'عکس‌ها', description: 'مستندات تصویری', onPress: () => showComingSoon('عکس‌های پروژه') },
    { icon: 'check-square' as const, title: 'چک‌لیست‌ها', description: 'کنترل مرحله‌ای', onPress: () => showComingSoon('چک‌لیست‌های پروژه') },
    { icon: 'edit-3' as const, title: 'یادداشت‌ها', description: 'یادداشت‌های فنی', onPress: () => showComingSoon('یادداشت‌های پروژه') },
    { icon: 'alert-triangle' as const, title: 'تخلفات', description: `${project.openViolationCount} مورد باز`, onPress: () => showComingSoon('تخلفات پروژه') },
    { icon: 'file-text' as const, title: 'گزارش‌ها', description: 'گزارش‌های فنی', onPress: () => router.push('/reports') },
    { icon: 'folder' as const, title: 'اسناد پروژه', description: 'نقشه و مدارک', onPress: () => showComingSoon('اسناد پروژه') },
    { icon: 'cpu' as const, title: 'دستیار هوشمند', description: 'در فاز بعدی', onPress: () => showComingSoon('دستیار هوشمند'), muted: true },
  ];

  return (
    <Screen>
      <AppHeader
        eyebrow="جزئیات پروژه"
        title={project.name}
        action={<IconButton icon="edit-2" accessibilityLabel="ویرایش پروژه" onPress={() => router.push({ pathname: '/new-project', params: { id: project.id } })} />}
      />
      <View style={[styles.location, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Feather name="map-pin" size={16} color={colors.primary} />
        <Text style={[styles.locationText, { color: colors.foreground }]}>{project.address}</Text>
      </View>
      <View style={[styles.progressCard, { backgroundColor: colors.primary }]}>
        <View style={styles.progressHeader}>
          <StatusPill status={project.status} />
          <View style={styles.progressCopy}>
            <Text style={[styles.progressLabel, { color: colors.primaryForeground }]}>پیشرفت کلی پروژه</Text>
            <Text style={[styles.progressValue, { color: colors.primaryForeground }]}>{project.progressPercentage}٪</Text>
          </View>
        </View>
        <ProgressBar progress={project.progressPercentage} />
        <View style={styles.progressFooter}>
          <Text style={[styles.progressMeta, { color: colors.primaryForeground }]}>آخرین بازدید: {formatDate(project.lastVisitAt)}</Text>
          <Text style={[styles.progressMeta, { color: colors.primaryForeground }]}>{getStageName(project.currentStageId)}</Text>
        </View>
      </View>
      <View style={styles.quickFacts}>
        {[
          ['نوع ساختمان', project.buildingType],
          ['تعداد طبقات', `${project.numberOfFloors} طبقه`],
          ['شماره پروانه', project.buildingPermitNumber || 'ثبت نشده'],
          ['کد نوسازی', project.renovationCode || 'ثبت نشده'],
        ].map(([label, value]) => (
          <View key={label} style={[styles.fact, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.factValue, { color: colors.foreground }]}>{value}</Text>
            <Text style={[styles.factLabel, { color: colors.mutedForeground }]}>{label}</Text>
          </View>
        ))}
      </View>
      <View style={styles.modulesHeading}>
        <Text style={[styles.modulesTitle, { color: colors.foreground }]}>ابزارهای پروژه</Text>
        <Text style={[styles.modulesHint, { color: colors.mutedForeground }]}>ماژول‌های قابل توسعه</Text>
      </View>
      <View style={styles.moduleGrid}>
        {modules.map((module) => <ModuleTile key={module.title} {...module} />)}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  notFound: { fontSize: 14, textAlign: 'right' },
  location: { minHeight: 55, borderRadius: 16, borderWidth: 1, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 8 },
  locationText: { flex: 1, fontSize: 13, textAlign: 'right' },
  progressCard: { minHeight: 165, borderRadius: 23, padding: 20, gap: 22 },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  progressCopy: { alignItems: 'flex-end' },
  progressLabel: { fontSize: 12, opacity: 0.8, textAlign: 'right' },
  progressValue: { fontSize: 33, fontWeight: '700', marginTop: 5 },
  progressFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  progressMeta: { fontSize: 11, opacity: 0.78, textAlign: 'right' },
  quickFacts: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 10 },
  fact: { width: '47.5%', minHeight: 75, borderRadius: 16, borderWidth: 1, padding: 12, justifyContent: 'center', gap: 6 },
  factValue: { fontSize: 13, fontWeight: '700', textAlign: 'right' },
  factLabel: { fontSize: 10.5, textAlign: 'right' },
  modulesHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 2 },
  modulesTitle: { fontSize: 18, fontWeight: '700', textAlign: 'right' },
  modulesHint: { fontSize: 11 },
  moduleGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 10 },
});