import { Feather } from '@expo/vector-icons';
import React from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { AppHeader, Screen } from '@/components/AppUI';
import { useColors } from '@/hooks/useColors';

function SettingRow({
  icon,
  title,
  subtitle,
  onPress,
  trailing,
}: {
  icon: keyof typeof Feather.glyphMap;
  title: string;
  subtitle: string;
  onPress?: () => void;
  trailing?: React.ReactNode;
}) {
  const colors = useColors();
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.row, { borderBottomColor: colors.border, opacity: pressed ? 0.65 : 1 }]}>
      <View style={[styles.rowIcon, { backgroundColor: colors.secondary }]}>
        <Feather name={icon} size={18} color={colors.primary} />
      </View>
      <View style={styles.rowCopy}>
        <Text style={[styles.rowTitle, { color: colors.foreground }]}>{title}</Text>
        <Text style={[styles.rowSubtitle, { color: colors.mutedForeground }]}>{subtitle}</Text>
      </View>
      {trailing ?? <Feather name="chevron-left" size={17} color={colors.mutedForeground} />}
    </Pressable>
  );
}

export default function SettingsScreen() {
  const colors = useColors();
  return (
    <Screen>
      <AppHeader eyebrow="حساب و تنظیمات" title="تنظیمات" />
      <View style={[styles.profile, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
          <Text style={[styles.avatarText, { color: colors.primaryForeground }]}>م</Text>
        </View>
        <View style={styles.profileCopy}>
          <Text style={[styles.profileName, { color: colors.foreground }]}>مهندس ناظر</Text>
          <Text style={[styles.profileRole, { color: colors.mutedForeground }]}>حساب محلی • آماده همگام‌سازی</Text>
        </View>
        <Feather name="check-circle" size={18} color={colors.primary} />
      </View>
      <Text style={[styles.groupLabel, { color: colors.mutedForeground }]}>تنظیمات برنامه</Text>
      <View style={[styles.group, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <SettingRow icon="moon" title="حالت نمایش" subtitle="هماهنگ با تنظیمات دستگاه" trailing={<Text style={[styles.trailingText, { color: colors.primary }]}>خودکار</Text>} />
        <SettingRow icon="type" title="زبان برنامه" subtitle="زبان رابط کاربری و گزارش‌ها" trailing={<Text style={[styles.trailingText, { color: colors.primary }]}>فارسی</Text>} />
        <SettingRow icon="layers" title="مراحل ساخت" subtitle="مدیریت مراحل پیش‌فرض پروژه‌ها" onPress={() => Alert.alert('مراحل ساخت', 'مراحل پیش‌فرض آماده هستند و در نسخه بعدی قابل ویرایش می‌شوند.')} />
      </View>
      <Text style={[styles.groupLabel, { color: colors.mutedForeground }]}>داده و پشتیبان</Text>
      <View style={[styles.group, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <SettingRow icon="refresh-cw" title="وضعیت همگام‌سازی" subtitle="همگام‌سازی ابری در فاز بعد فعال می‌شود" trailing={<View style={[styles.offlinePill, { backgroundColor: colors.accent }]}><Text style={[styles.offlineText, { color: colors.accentForeground }]}>آفلاین</Text></View>} />
        <SettingRow icon="info" title="درباره برنامه" subtitle="دستیار مهندس ناظر • نسخه ۱.۰" onPress={() => Alert.alert('دستیار مهندس ناظر', 'پایه فنی نسخه اول برای بازرسی حرفه‌ای ساختمان.')} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  profile: { minHeight: 86, borderRadius: 20, borderWidth: 1, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 22, fontWeight: '700' },
  profileCopy: { flex: 1, alignItems: 'flex-end' },
  profileName: { fontSize: 15, fontWeight: '700', textAlign: 'right' },
  profileRole: { fontSize: 11, marginTop: 5, textAlign: 'right' },
  groupLabel: { fontSize: 12, fontWeight: '700', textAlign: 'right', marginTop: 1 },
  group: { borderRadius: 20, borderWidth: 1, paddingHorizontal: 15 },
  row: { minHeight: 70, borderBottomWidth: 1, flexDirection: 'row', alignItems: 'center', gap: 11 },
  rowIcon: { width: 37, height: 37, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  rowCopy: { flex: 1, alignItems: 'flex-end' },
  rowTitle: { fontSize: 13, fontWeight: '700', textAlign: 'right' },
  rowSubtitle: { fontSize: 10.5, marginTop: 4, textAlign: 'right' },
  trailingText: { fontSize: 12, fontWeight: '700' },
  offlinePill: { borderRadius: 999, paddingHorizontal: 9, paddingVertical: 5 },
  offlineText: { fontSize: 10, fontWeight: '700' },
});