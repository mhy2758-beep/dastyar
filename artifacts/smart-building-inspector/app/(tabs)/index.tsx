import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import {
  AppHeader,
  MetricCard,
  PrimaryButton,
  ProjectCard,
  Screen,
  SectionHeading,
} from '@/components/AppUI';
import { useProjects } from '@/context/ProjectContext';
import { useColors } from '@/hooks/useColors';

export default function HomeScreen() {
  const colors = useColors();
  const router = useRouter();
  const { projects, isHydrated } = useProjects();
  const activeProjects = projects.filter((project) => project.status === 'ACTIVE');
  const openViolations = projects.reduce((sum, project) => sum + project.openViolationCount, 0);
  const recentProjects = [...projects].sort((a, b) => (b.lastVisitAt ?? '').localeCompare(a.lastVisitAt ?? '')).slice(0, 2);

  return (
    <Screen>
      <View style={styles.brandRow}>
        <View style={styles.syncBadge}>
          <View style={[styles.syncDot, { backgroundColor: colors.primary }]} />
          <Text style={[styles.syncText, { color: colors.primary }]}>ذخیره محلی</Text>
        </View>
        <View style={styles.brandBlock}>
          <Text style={[styles.greeting, { color: colors.mutedForeground }]}>سه‌شنبه، ۲۲ مرداد</Text>
          <Text style={[styles.greetingTitle, { color: colors.foreground }]}>سلام، مهندس</Text>
        </View>
        <Image source={require('../../assets/images/icon.png')} style={styles.logo} />
      </View>

      <View style={[styles.hero, { backgroundColor: colors.primary }]}>
        <View style={styles.heroGlow} />
        <View style={styles.heroCopy}>
          <Text style={[styles.heroEyebrow, { color: colors.primaryForeground }]}>داشبورد نظارت</Text>
          <Text style={[styles.heroTitle, { color: colors.primaryForeground }]}>همه‌چیز برای بازدید بعدی آماده است.</Text>
          <Text style={[styles.heroDescription, { color: colors.primaryForeground }]}>پروژه‌ها، پیشرفت و موارد باز را یک‌جا دنبال کنید.</Text>
        </View>
        <Feather name="clipboard" size={44} color={`${colors.primaryForeground}55`} style={styles.heroIcon} />
      </View>

      <PrimaryButton label="ثبت بازدید جدید" icon="plus" onPress={() => router.push('/visits')} />

      <View style={styles.metricsGrid}>
        <MetricCard label="پروژه‌های فعال" value={String(activeProjects.length)} icon="briefcase" />
        <MetricCard label="بازدید این هفته" value="۴" icon="calendar" tone="blue" />
        <MetricCard label="موارد باز" value={String(openViolations)} icon="alert-triangle" tone="red" />
        <MetricCard label="گزارش این ماه" value="۷" icon="file-text" tone="amber" />
      </View>

      <SectionHeading title="پروژه‌های اخیر" action={`${projects.length} پروژه`} />
      {!isHydrated ? null : recentProjects.map((project) => (
        <ProjectCard key={project.id} project={project} onPress={() => router.push({ pathname: '/project/[id]', params: { id: project.id } })} />
      ))}

      <Pressable
        onPress={() => router.push('/projects')}
        style={({ pressed }) => [styles.allProjects, { borderColor: colors.border, opacity: pressed ? 0.65 : 1 }]}
      >
        <Text style={[styles.allProjectsText, { color: colors.primary }]}>مشاهده همه پروژه‌ها</Text>
        <Feather name="arrow-left" size={17} color={colors.primary} />
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  brandRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  brandBlock: { flex: 1, alignItems: 'flex-end' },
  logo: { width: 47, height: 47, borderRadius: 15 },
  greeting: { fontSize: 12, textAlign: 'right', marginBottom: 5 },
  greetingTitle: { fontSize: 24, fontWeight: '700', textAlign: 'right' },
  syncBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 999, backgroundColor: '#e8efed' },
  syncDot: { width: 7, height: 7, borderRadius: 4 },
  syncText: { fontSize: 11, fontWeight: '700' },
  hero: { minHeight: 174, borderRadius: 25, padding: 22, overflow: 'hidden', justifyContent: 'flex-end' },
  heroGlow: { position: 'absolute', width: 180, height: 180, borderRadius: 90, backgroundColor: '#ffffff14', top: -80, left: -30 },
  heroCopy: { alignItems: 'flex-end', maxWidth: '82%', zIndex: 1 },
  heroEyebrow: { fontSize: 12, fontWeight: '700', opacity: 0.8, marginBottom: 8 },
  heroTitle: { fontSize: 23, lineHeight: 31, fontWeight: '700', textAlign: 'right' },
  heroDescription: { fontSize: 12, lineHeight: 20, textAlign: 'right', opacity: 0.78, marginTop: 8 },
  heroIcon: { position: 'absolute', left: 19, top: 22 },
  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 10 },
  allProjects: { minHeight: 49, borderWidth: 1, borderRadius: 15, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 },
  allProjectsText: { fontSize: 13, fontWeight: '700' },
});