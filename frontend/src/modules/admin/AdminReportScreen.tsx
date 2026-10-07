import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../App';
import { adminGetReport } from '../../api';
import { colors } from '../../core/theme';
import { fa } from '../../core/jalali';

type Props = NativeStackScreenProps<RootStackParamList, 'AdminReport'>;

export default function AdminReportScreen({ navigation }: Props) {
  const [report, setReport] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setRefreshing(true);
    try { setReport(await adminGetReport()); } catch { /* ignore */ } finally { setRefreshing(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (!report) {
    return <View style={styles.center}><Text style={styles.muted}>در حال بارگذاری گزارش...</Text></View>;
  }

  const statusFa: Record<string, string> = {
    PENDING: 'در انتظار', CONFIRMED: 'تایید شده', PREPARING: 'آماده‌سازی',
    SERVED: 'سرو شده', COMPLETED: 'تکمیل', CANCELLED: 'لغو شده',
  };

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={load} />}>
      <Text style={styles.title}>📊 گزارش پایان شیفت</Text>

      <View style={styles.cardsRow}>
        <View style={styles.card}>
          <Text style={styles.cardLabel}>امروز</Text>
          <Text style={styles.cardValue}>{fa(report.today.revenue)}</Text>
          <Text style={styles.cardSub}>{fa(report.today.orders)} سفارش · میانگین {fa(report.today.avg)}</Text>
        </View>
        <View style={[styles.card, { backgroundColor: colors.amberLight }]}>
          <Text style={styles.cardLabel}>دیروز</Text>
          <Text style={styles.cardValue}>{fa(report.yesterday.revenue)}</Text>
          <Text style={styles.cardSub}>{fa(report.yesterday.orders)} سفارش · میانگین {fa(report.yesterday.avg)}</Text>
        </View>
      </View>

      <Text style={styles.section}>وضعیت سفارش‌ها</Text>
      <View style={styles.statusGrid}>
        {Object.entries(report.byStatus).map(([st, n]) => (
          <View key={st} style={styles.statusCell}>
            <Text style={styles.statusNum}>{fa(n as number)}</Text>
            <Text style={styles.statusLabel}>{statusFa[st] || st}</Text>
          </View>
        ))}
      </View>

      <Text style={styles.section}>🏆 پرفروش‌ترین آیتم‌ها</Text>
      {report.topItems.map((t: any, i: number) => (
        <View key={i} style={styles.topRow}>
          <Text style={styles.topRank}>{fa(i + 1)}</Text>
          <Text style={styles.topName}>{t.name}</Text>
          <Text style={styles.topQty}>{fa(t.qty)} عدد</Text>
        </View>
      ))}

      <Text style={styles.section}>فروش به تفکیک دسته</Text>
      {Object.entries(report.byCategory).map(([cat, n]) => (
        <View key={cat as string} style={styles.topRow}>
          <Text style={styles.topName}>{cat as string}</Text>
          <Text style={styles.topQty}>{fa(n as number)} عدد</Text>
        </View>
      ))}

      <View style={styles.cardsRow}>
        <View style={styles.card}>
          <Text style={styles.cardLabel}>مشتریان</Text>
          <Text style={styles.cardValue}>{fa(report.totalUsers)}</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.cardLabel}>امتیاز توزیع‌شده</Text>
          <Text style={styles.cardValue}>{fa(report.totalPointsGiven)}</Text>
        </View>
        <View style={[styles.card, report.lowStockCount > 0 && { backgroundColor: colors.redLight }]}>
          <Text style={styles.cardLabel}>هشدار انبار</Text>
          <Text style={styles.cardValue}>{fa(report.lowStockCount)}</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  container: { padding: 14, paddingBottom: 40 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
  muted: { color: colors.muted },
  title: { fontSize: 18, fontWeight: 'bold', color: colors.text, textAlign: 'center', marginBottom: 14 },
  cardsRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  card: { flex: 1, backgroundColor: colors.greenLight, borderRadius: 14, padding: 12, alignItems: 'center' },
  cardLabel: { fontSize: 11, color: colors.muted },
  cardValue: { fontSize: 16, fontWeight: 'bold', color: colors.greenDark, marginTop: 4 },
  cardSub: { fontSize: 10, color: colors.muted, marginTop: 4, textAlign: 'center' },
  section: { fontSize: 14, fontWeight: 'bold', color: colors.greenDark, marginTop: 6, marginBottom: 8, textAlign: 'right' },
  statusGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  statusCell: { width: '31%', backgroundColor: colors.card, borderRadius: 10, padding: 10, alignItems: 'center', borderWidth: 1, borderColor: colors.border },
  statusNum: { fontSize: 16, fontWeight: 'bold', color: colors.text },
  statusLabel: { fontSize: 10, color: colors.muted, marginTop: 2 },
  topRow: { backgroundColor: colors.card, borderRadius: 10, padding: 10, marginBottom: 6, flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderColor: colors.border },
  topRank: { fontSize: 13, fontWeight: 'bold', color: colors.amber, width: 24, textAlign: 'center' },
  topName: { flex: 1, fontSize: 13, color: colors.text, textAlign: 'right' },
  topQty: { fontSize: 12, color: colors.muted },
});
