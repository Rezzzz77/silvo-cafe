import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../App';
import { adminGetSurveys } from '../../api';
import { colors } from '../../core/theme';
import { fa } from '../../core/jalali';

type Props = NativeStackScreenProps<RootStackParamList, 'AdminSurveys'>;

export default function AdminSurveysScreen({ navigation }: Props) {
  const [data, setData] = useState<{ avg: number; count: number; list: any[] } | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setRefreshing(true);
    try { setData(await adminGetSurveys()); } catch { /* ignore */ } finally { setRefreshing(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const stars = (n: number) => '⭐'.repeat(n) + '☆'.repeat(5 - n);

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={load} />}>
      {data && (
        <View style={styles.avgCard}>
          <Text style={styles.avgNum}>{fa(data.avg)}</Text>
          <Text style={styles.avgLabel}>میانگین رضایت از {fa(data.count)} نظرسنجی</Text>
        </View>
      )}

      {data?.list.map((s) => (
        <View key={s.orderId} style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={styles.starsText}>{stars(s.rating)}</Text>
            <Text style={styles.who}>
              {s.customerName} — سفارش #{fa(s.orderId)}{s.tableNumber ? ` · میز ${fa(s.tableNumber)}` : ''}
            </Text>
            {s.comment ? <Text style={styles.comment}>«{s.comment}»</Text> : null}
          </View>
        </View>
      ))}

      {data && data.list.length === 0 && (
        <Text style={styles.empty}>هنوز نظرسنجی ثبت نشده است</Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  container: { padding: 14, paddingBottom: 40 },
  avgCard: { backgroundColor: colors.greenLight, borderRadius: 16, padding: 20, alignItems: 'center', marginBottom: 14, borderWidth: 1, borderColor: colors.green },
  avgNum: { fontSize: 40, fontWeight: 'bold', color: colors.greenDark },
  avgLabel: { fontSize: 13, color: colors.greenDark, marginTop: 6 },
  row: { backgroundColor: colors.card, borderRadius: 12, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: colors.border },
  starsText: { fontSize: 14, textAlign: 'right' },
  who: { fontSize: 12, color: colors.muted, marginTop: 4, textAlign: 'right' },
  comment: { fontSize: 13, color: colors.text, marginTop: 6, textAlign: 'right', fontStyle: 'italic' },
  empty: { textAlign: 'center', color: colors.muted, marginTop: 40 },
});
