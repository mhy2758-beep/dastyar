import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { AppHeader, EmptyState, IconButton, ProjectCard, Screen } from '@/components/AppUI';
import { useProjects } from '@/context/ProjectContext';
import { useColors } from '@/hooks/useColors';
import { ProjectStatus } from '@/types/inspection';

type Filter = 'ALL' | 'ACTIVE' | 'COMPLETED';

export default function ProjectsScreen() {
  const colors = useColors();
  const router = useRouter();
  const { projects } = useProjects();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('ALL');
  const filteredProjects = useMemo(
    () =>
      projects.filter((project) => {
        const matchesQuery = `${project.name} ${project.address}`.includes(query.trim());
        const matchesFilter = filter === 'ALL' || project.status === filter;
        return matchesQuery && matchesFilter;
      }),
    [filter, projects, query],
  );

  return (
    <Screen>
      <AppHeader
        eyebrow="مدیریت ساخت‌وساز"
        title="پروژه‌ها"
        action={<IconButton icon="plus" accessibilityLabel="افزودن پروژه" onPress={() => router.push('/new-project')} />}
      />
      <View style={[styles.searchBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Feather name="search" size={18} color={colors.mutedForeground} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="جست‌وجوی نام یا آدرس پروژه"
          placeholderTextColor={colors.mutedForeground}
          style={[styles.searchInput, { color: colors.foreground, writingDirection: 'rtl' }]}
          textAlign="right"
        />
        {query ? <Pressable onPress={() => setQuery('')}><Feather name="x-circle" size={17} color={colors.mutedForeground} /></Pressable> : null}
      </View>
      <View style={styles.filterRow}>
        {([
          ['ALL', 'همه'],
          ['ACTIVE', 'فعال'],
          ['COMPLETED', 'تکمیل‌شده'],
        ] as [Filter, string][]).map(([value, label]) => (
          <Pressable
            key={value}
            onPress={() => setFilter(value)}
            style={[styles.filterChip, { backgroundColor: filter === value ? colors.primary : colors.card, borderColor: filter === value ? colors.primary : colors.border }]}
          >
            <Text style={[styles.filterText, { color: filter === value ? colors.primaryForeground : colors.mutedForeground }]}>{label}</Text>
          </Pressable>
        ))}
      </View>
      <View style={styles.listHeader}>
        <Text style={[styles.countText, { color: colors.mutedForeground }]}>{filteredProjects.length} پروژه</Text>
        <Text style={[styles.listTitle, { color: colors.foreground }]}>فهرست پروژه‌ها</Text>
      </View>
      {filteredProjects.length ? filteredProjects.map((project) => (
        <ProjectCard key={project.id} project={project} onPress={() => router.push({ pathname: '/project/[id]', params: { id: project.id } })} />
      )) : (
        <EmptyState icon="folder" title="پروژه‌ای پیدا نشد" description="فیلتر یا عبارت جست‌وجو را تغییر دهید، یا یک پروژه جدید بسازید." />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  searchBox: { minHeight: 50, borderRadius: 15, borderWidth: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, gap: 9 },
  searchInput: { flex: 1, fontSize: 13, minHeight: 48 },
  filterRow: { flexDirection: 'row-reverse', gap: 8 },
  filterChip: { borderRadius: 999, borderWidth: 1, paddingHorizontal: 16, paddingVertical: 9 },
  filterText: { fontSize: 12, fontWeight: '700' },
  listHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 3 },
  listTitle: { fontSize: 18, fontWeight: '700', textAlign: 'right' },
  countText: { fontSize: 12 },
});