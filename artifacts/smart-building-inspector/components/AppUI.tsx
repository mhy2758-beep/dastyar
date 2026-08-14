import { Feather } from '@expo/vector-icons';
import React from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useProjects } from '@/context/ProjectContext';
import { useColors } from '@/hooks/useColors';
import { formatDate, Project } from '@/types/inspection';

export function Screen({
  children,
  scroll = true,
}: {
  children: React.ReactNode;
  scroll?: boolean;
}) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const contentStyle = [
    styles.screenContent,
    {
      paddingTop: Math.max(insets.top, Platform.OS === 'web' ? 67 : 18),
      paddingBottom: Math.max(insets.bottom, Platform.OS === 'web' ? 34 : 104),
    },
  ];

  if (!scroll) {
    return <View style={[styles.screen, { backgroundColor: colors.background }]}><View style={contentStyle}>{children}</View></View>;
  }

  return (
    <ScrollView
      style={[styles.screen, { backgroundColor: colors.background }]}
      contentContainerStyle={contentStyle}
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  );
}

export function AppHeader({
  eyebrow,
  title,
  action,
}: {
  eyebrow?: string;
  title: string;
  action?: React.ReactNode;
}) {
  const colors = useColors();
  return (
    <View style={styles.headerRow}>
      <View style={styles.headerText}>
        {eyebrow ? <Text style={[styles.eyebrow, { color: colors.primary }]}>{eyebrow}</Text> : null}
        <Text style={[styles.screenTitle, { color: colors.foreground }]}>{title}</Text>
      </View>
      {action}
    </View>
  );
}

export function IconButton({
  icon,
  onPress,
  accessibilityLabel,
}: {
  icon: keyof typeof Feather.glyphMap;
  onPress: () => void;
  accessibilityLabel: string;
}) {
  const colors = useColors();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [
        styles.iconButton,
        { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.65 : 1 },
      ]}
    >
      <Feather name={icon} size={19} color={colors.foreground} />
    </Pressable>
  );
}

export function PrimaryButton({
  label,
  icon = 'arrow-left',
  onPress,
  compact = false,
}: {
  label: string;
  icon?: keyof typeof Feather.glyphMap;
  onPress: () => void;
  compact?: boolean;
}) {
  const colors = useColors();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.primaryButton,
        compact && styles.primaryButtonCompact,
        { backgroundColor: colors.primary, opacity: pressed ? 0.82 : 1 },
      ]}
    >
      <Text style={[styles.primaryButtonLabel, { color: colors.primaryForeground }]}>{label}</Text>
      <Feather name={icon} size={18} color={colors.primaryForeground} />
    </Pressable>
  );
}

export function MetricCard({
  label,
  value,
  icon,
  tone = 'primary',
}: {
  label: string;
  value: string;
  icon: keyof typeof Feather.glyphMap;
  tone?: 'primary' | 'amber' | 'red' | 'blue';
}) {
  const colors = useColors();
  const tones = {
    primary: { bg: colors.secondary, icon: colors.primary },
    amber: { bg: colors.accent, icon: colors.accentForeground },
    red: { bg: `${colors.destructive}18`, icon: colors.destructive },
    blue: { bg: '#e5eff7', icon: '#3e718e' },
  } as const;
  const toneColors = tones[tone];
  return (
    <View style={[styles.metricCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={[styles.metricIcon, { backgroundColor: toneColors.bg }]}>
        <Feather name={icon} size={17} color={toneColors.icon} />
      </View>
      <Text style={[styles.metricValue, { color: colors.foreground }]}>{value}</Text>
      <Text style={[styles.metricLabel, { color: colors.mutedForeground }]}>{label}</Text>
    </View>
  );
}

export function StatusPill({ status }: { status: Project['status'] }) {
  const colors = useColors();
  const label = status === 'ACTIVE' ? 'فعال' : status === 'COMPLETED' ? 'تکمیل‌شده' : status === 'SUSPENDED' ? 'متوقف' : 'بایگانی';
  const isCompleted = status === 'COMPLETED';
  return (
    <View style={[styles.statusPill, { backgroundColor: isCompleted ? colors.secondary : colors.accent }]}>
      <View style={[styles.statusDot, { backgroundColor: isCompleted ? colors.primary : colors.accentForeground }]} />
      <Text style={[styles.statusText, { color: isCompleted ? colors.primary : colors.accentForeground }]}>{label}</Text>
    </View>
  );
}

export function ProgressBar({ progress }: { progress: number }) {
  const colors = useColors();
  const width = `${Math.max(0, Math.min(100, progress))}%` as `${number}%`;
  return (
    <View style={[styles.progressTrack, { backgroundColor: colors.muted }]}>
      <View style={[styles.progressFill, { width, backgroundColor: colors.primary }]} />
    </View>
  );
}

export function ProjectCard({ project, onPress }: { project: Project; onPress: () => void }) {
  const colors = useColors();
  const { stages } = useProjects();
  const stageName = stages.find((stage) => stage.id === project.currentStageId)?.name ?? 'در حال بارگذاری';
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.projectCard,
        { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.72 : 1 },
      ]}
    >
      <View style={styles.cardTopRow}>
        <StatusPill status={project.status} />
        <View style={styles.cardTitleBlock}>
          <Text style={[styles.cardTitle, { color: colors.foreground }]} numberOfLines={1}>{project.name}</Text>
          <View style={styles.locationRow}>
            <Feather name="map-pin" size={13} color={colors.mutedForeground} />
            <Text style={[styles.locationText, { color: colors.mutedForeground }]} numberOfLines={1}>{project.address}</Text>
          </View>
        </View>
      </View>
      <View style={styles.stageRow}>
        <Text style={[styles.stageText, { color: colors.foreground }]}>{stageName}</Text>
        <Text style={[styles.progressText, { color: colors.primary }]}>{project.progressPercentage}٪</Text>
      </View>
      <ProgressBar progress={project.progressPercentage} />
      <View style={styles.cardMetaRow}>
        <View style={styles.metaItem}>
          <Feather name="clock" size={13} color={colors.mutedForeground} />
          <Text style={[styles.metaText, { color: colors.mutedForeground }]}>آخرین بازدید: {formatDate(project.lastVisitAt)}</Text>
        </View>
        {project.openViolationCount > 0 ? (
          <View style={styles.metaItem}>
            <Feather name="alert-triangle" size={13} color={colors.destructive} />
            <Text style={[styles.metaText, { color: colors.destructive }]}>{project.openViolationCount} مورد باز</Text>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

export function EmptyState({
  icon,
  title,
  description,
}: {
  icon: keyof typeof Feather.glyphMap;
  title: string;
  description: string;
}) {
  const colors = useColors();
  return (
    <View style={[styles.emptyState, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={[styles.emptyIcon, { backgroundColor: colors.secondary }]}>
        <Feather name={icon} size={24} color={colors.primary} />
      </View>
      <Text style={[styles.emptyTitle, { color: colors.foreground }]}>{title}</Text>
      <Text style={[styles.emptyDescription, { color: colors.mutedForeground }]}>{description}</Text>
    </View>
  );
}

export function LoadingState() {
  const colors = useColors();
  return <View style={styles.loading}><ActivityIndicator color={colors.primary} /></View>;
}

export function SectionHeading({ title, action }: { title: string; action?: string }) {
  const colors = useColors();
  return (
    <View style={styles.sectionHeading}>
      {action ? <Text style={[styles.sectionAction, { color: colors.primary }]}>{action}</Text> : <View />}
      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{title}</Text>
    </View>
  );
}

export function ModuleTile({
  icon,
  title,
  description,
  onPress,
  muted = false,
}: {
  icon: keyof typeof Feather.glyphMap;
  title: string;
  description: string;
  onPress: () => void;
  muted?: boolean;
}) {
  const colors = useColors();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.moduleTile,
        { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.7 : muted ? 0.72 : 1 },
      ]}
    >
      <View style={[styles.moduleIcon, { backgroundColor: muted ? colors.muted : colors.secondary }]}>
        <Feather name={icon} size={19} color={muted ? colors.mutedForeground : colors.primary} />
      </View>
      <Text style={[styles.moduleTitle, { color: colors.foreground }]}>{title}</Text>
      <Text style={[styles.moduleDescription, { color: colors.mutedForeground }]} numberOfLines={1}>{description}</Text>
      <Feather name="chevron-left" size={16} color={colors.mutedForeground} style={styles.moduleArrow} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  screenContent: { paddingHorizontal: 20, gap: 20 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  headerText: { flex: 1, alignItems: 'flex-end' },
  eyebrow: { fontSize: 12, fontWeight: '700', letterSpacing: 0.5, marginBottom: 5, textAlign: 'right' },
  screenTitle: { fontSize: 28, fontWeight: '700', textAlign: 'right', letterSpacing: -0.4 },
  iconButton: { width: 42, height: 42, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  primaryButton: { minHeight: 52, borderRadius: 16, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  primaryButtonCompact: { minHeight: 44, paddingHorizontal: 14, borderRadius: 13 },
  primaryButtonLabel: { fontSize: 15, fontWeight: '700', textAlign: 'center' },
  metricCard: { width: '47.5%', minHeight: 126, borderRadius: 18, borderWidth: 1, padding: 15, gap: 8 },
  metricIcon: { width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  metricValue: { fontSize: 25, fontWeight: '700', textAlign: 'right' },
  metricLabel: { fontSize: 12, fontWeight: '500', textAlign: 'right' },
  statusPill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 9, paddingVertical: 6, borderRadius: 999 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 11, fontWeight: '700' },
  projectCard: { borderRadius: 20, borderWidth: 1, padding: 16, gap: 15, marginBottom: 12 },
  cardTopRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 },
  cardTitleBlock: { flex: 1, alignItems: 'flex-end' },
  cardTitle: { fontSize: 16, fontWeight: '700', textAlign: 'right' },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 7, maxWidth: '100%' },
  locationText: { fontSize: 12, textAlign: 'right', flexShrink: 1 },
  stageRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  stageText: { fontSize: 13, fontWeight: '600', textAlign: 'right' },
  progressText: { fontSize: 14, fontWeight: '700' },
  progressTrack: { height: 7, borderRadius: 5, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 5 },
  cardMetaRow: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 5, flexShrink: 1 },
  metaText: { fontSize: 11, textAlign: 'right', flexShrink: 1 },
  emptyState: { minHeight: 250, borderRadius: 20, borderWidth: 1, alignItems: 'center', justifyContent: 'center', padding: 28, gap: 10 },
  emptyIcon: { width: 54, height: 54, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  emptyTitle: { fontSize: 17, fontWeight: '700', textAlign: 'center' },
  emptyDescription: { fontSize: 13, lineHeight: 21, textAlign: 'center', maxWidth: 280 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  sectionHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { fontSize: 18, fontWeight: '700', textAlign: 'right' },
  sectionAction: { fontSize: 12, fontWeight: '700' },
  moduleTile: { width: '47.5%', minHeight: 118, padding: 13, borderRadius: 18, borderWidth: 1, gap: 8, position: 'relative' },
  moduleIcon: { width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  moduleTitle: { fontSize: 14, fontWeight: '700', textAlign: 'right' },
  moduleDescription: { fontSize: 11, textAlign: 'right', paddingRight: 1 },
  moduleArrow: { position: 'absolute', left: 12, bottom: 13 },
});