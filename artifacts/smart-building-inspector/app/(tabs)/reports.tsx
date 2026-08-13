import { Feather } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AppHeader, EmptyState, Screen } from '@/components/AppUI';
import { useColors } from '@/hooks/useColors';

export default function ReportsScreen() {
  const colors = useColors();
  return (
    <Screen>
      <AppHeader eyebrow="خروجی‌های فنی" title="گزارش‌ها" />
      <View style={[styles.summary, { backgroundColor: colors.primary }]}>
        <View style={styles.summaryIcon}><Feather name="file-text" size={22} color={colors.primaryForeground} /></View>
        <View style={styles.summaryCopy}>
          <Text style={[styles.summaryValue, { color: colors.primaryForeground }]}>۷</Text>
          <Text style={[styles.summaryLabel, { color: colors.primaryForeground }]}>گزارش در این ماه</Text>
        </View>
        <Text style={[styles.summaryHint, { color: colors.primaryForeground }]}>گزارش‌های بازدید، تخلفات و پیشرفت پروژه در یک فضای واحد آماده می‌شوند.</Text>
      </View>
      <EmptyState icon="file-text" title="گزارشی برای نمایش نیست" description="پس از ثبت اولین بازدید و تکمیل چک‌لیست، گزارش‌های پروژه در این بخش قرار می‌گیرند." />
    </Screen>
  );
}

const styles = StyleSheet.create({
  summary: { minHeight: 170, borderRadius: 24, padding: 20, gap: 17, alignItems: 'flex-end' },
  summaryIcon: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#ffffff22', alignItems: 'center', justifyContent: 'center' },
  summaryCopy: { alignItems: 'flex-end' },
  summaryValue: { fontSize: 34, fontWeight: '700' },
  summaryLabel: { fontSize: 13, opacity: 0.8, marginTop: 1 },
  summaryHint: { fontSize: 12, lineHeight: 20, opacity: 0.84, textAlign: 'right' },
});