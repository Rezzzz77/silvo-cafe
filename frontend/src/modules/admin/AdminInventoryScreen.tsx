import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../App';
import { adminGetInventory, adminSetStock } from '../../api';
import { colors } from '../../core/theme';
import { fa } from '../../core/jalali';

type Props = NativeStackScreenProps<RootStackParamList, 'AdminInventory'>;

type Row = { itemId: number; name: string; price: number; category: string; stock: number; low: boolean; out: boolean };

export default function AdminInventoryScreen({ navigation }: Props) {
  const [rows, setRows] = useState<Row[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setRefreshing(true);
    try { setRows(await adminGetInventory()); } catch { /* ignore */ } finally { setRefreshing(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const adjust = async (itemId: number, delta: number) => {
    const row = rows.find((r) => r.itemId === itemId);
    if (!row) return;
    const next = Math.max(0, row.stock + delta);
    await adminSetStock(itemId, next);
    await load();
  };

  const lowCount = rows.filter((r) => r.low).length;
  const outCount = rows.filter((r) => r.out).length;

  return (
    <View style={styles.root}>
      <View style={styles.summary}>
        <Text style={styles.summaryText}>📦 {fa(rows.length)} قلم کالا</Text>
        <Text style={[styles.summaryText, { color: colors.amber }]}>⚠️ {fa(lowCount)} رو به اتمام</Text>
        <Text style={[styles.summaryText, { color: colors.red }]}>🚫 {fa(outCount)} ناموجود</Text>
      </View>
      <FlatList
        data={rows}
        keyExtractor={(r) => String(r.itemId)}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={load} />}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={[styles.row, item.out && styles.rowOut]}>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.cat}>{item.category}</Text>
            </View>
            <View style={styles.stockBox}>
              <TouchableOpacity style={styles.qtyBtn} onPress={() => adjust(item.itemId, -10)}>
                <Text style={styles.qtyText}>−۱۰</Text>
              </TouchableOpacity>
              <Text style={[styles.stockNum, item.out ? { color: colors.red } : item.low ? { color: colors.amber } : { color: colors.greenDark }]}>
                {fa(item.stock)}
              </Text>
              <TouchableOpacity style={styles.qtyBtn} onPress={() => adjust(item.itemId, 10)}>
                <Text style={styles.qtyText}>+۱۰</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  summary: {
    flexDirection: 'row', justifyContent: 'space-around', padding: 12,
    backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  summaryText: { fontSize: 13, fontWeight: 'bold', color: colors.text },
  list: { padding: 12, paddingBottom: 40 },
  row: {
    backgroundColor: colors.card, borderRadius: 12, padding: 12, marginBottom: 8,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderWidth: 1, borderColor: colors.border,
  },
  rowOut: { backgroundColor: colors.redLight, borderColor: colors.red },
  name: { fontSize: 14, fontWeight: 'bold', color: colors.text, textAlign: 'right' },
  cat: { fontSize: 11, color: colors.muted, marginTop: 3, textAlign: 'right' },
  stockBox: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  qtyBtn: { backgroundColor: colors.greenLight, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 6, borderWidth: 1, borderColor: colors.green },
  qtyText: { fontSize: 11, color: colors.greenDark, fontWeight: 'bold' },
  stockNum: { fontSize: 15, fontWeight: 'bold', minWidth: 34, textAlign: 'center' },
});
