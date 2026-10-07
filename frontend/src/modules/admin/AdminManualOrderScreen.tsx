import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput, Alert, RefreshControl } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../App';
import { adminManualOrder, getCafeMenu, getTables } from '../../api';
import { colors } from '../../core/theme';
import { fa } from '../../core/jalali';

type Props = NativeStackScreenProps<RootStackParamList, 'AdminManualOrder'>;

type MenuItem = { id: number; name: string; price: number };

export default function AdminManualOrderScreen({ navigation }: Props) {
  const [mode, setMode] = useState<'TABLE' | 'TAKEAWAY'>('TABLE');
  const [menu, setMenu] = useState<{ id: number; title: string; items: MenuItem[] }[]>([]);
  const [tables, setTables] = useState<any[]>([]);
  const [tableId, setTableId] = useState<number | null>(null);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [address, setAddress] = useState('');
  const [basket, setBasket] = useState<Record<number, number>>({});
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const d = await getCafeMenu(1);
      setMenu(d.menuCategories);
      setTables(await getTables(1));
    } catch { /* ignore */ }
  }, []);

  useEffect(() => { load(); }, [load]);

  const total = menu
    .flatMap((c) => c.items)
    .reduce((s, it) => s + it.price * (basket[it.id] || 0), 0);

  const submit = async () => {
    if (mode === 'TABLE' && !tableId) { Alert.alert('میز را انتخاب کنید'); return; }
    if (!customerName.trim()) { Alert.alert('نام مشتری را وارد کنید'); return; }
    const items = Object.entries(basket)
      .filter(([, q]) => q > 0)
      .map(([id, quantity]) => ({ menuItemId: Number(id), quantity }));
    if (items.length === 0) { Alert.alert('حداقل یک آیتم انتخاب کنید'); return; }
    setSaving(true);
    try {
      await adminManualOrder({
        cafeId: 1, tableId: mode === 'TABLE' ? tableId : undefined,
        orderType: mode, items,
        customerName, customerPhone, address,
      });
      Alert.alert('ثبت شد ✅', 'سفارش در پنل مدیریت ثبت شد');
      setBasket({}); setCustomerName(''); setAddress('');
      navigation.goBack();
    } catch (e: any) {
      Alert.alert('خطا', e.message || 'ثبت ناموفق');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.container} refreshControl={<RefreshControl refreshing={false} onRefresh={load} />}>
      <View style={styles.modeRow}>
        {(['TABLE', 'TAKEAWAY'] as const).map((m) => (
          <TouchableOpacity
            key={m}
            style={[styles.modeBtn, mode === m && styles.modeBtnActive]}
            onPress={() => setMode(m)}
          >
            <Text style={[styles.modeText, mode === m && styles.modeTextActive]}>
              {m === 'TABLE' ? '🪑 سفارش میز' : '🛵 بیرون‌بر'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {mode === 'TABLE' ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tableRow}>
          {tables.map((t) => (
            <TouchableOpacity
              key={t.id}
              style={[styles.tableChip, tableId === t.id && styles.tableChipActive, t.activeOrder && { opacity: 0.4 }]}
              disabled={!!t.activeOrder}
              onPress={() => setTableId(t.id)}
            >
              <Text style={[styles.tableChipText, tableId === t.id && { color: '#fff' }]}>میز {fa(t.number)}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      ) : (
        <View>
          <TextInput style={styles.input} placeholder="آدرس تحویل" placeholderTextColor={colors.muted} value={address} onChangeText={setAddress} />
          <TextInput style={styles.input} placeholder="تلفن مشتری" placeholderTextColor={colors.muted} keyboardType="phone-pad" value={customerPhone} onChangeText={setCustomerPhone} />
        </View>
      )}

      <TextInput style={styles.input} placeholder="نام مشتری" placeholderTextColor={colors.muted} value={customerName} onChangeText={setCustomerName} />

      {menu.map((cat) => (
        <View key={cat.id} style={styles.catBlock}>
          <Text style={styles.catTitle}>{cat.title}</Text>
          {cat.items.map((it) => {
            const q = basket[it.id] || 0;
            return (
              <View key={it.id} style={styles.itemRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemName}>{it.name}</Text>
                  <Text style={styles.itemPrice}>{fa(it.price)} تومان</Text>
                </View>
                <View style={styles.qtyBox}>
                  <TouchableOpacity style={styles.qtyBtn} onPress={() => setBasket((b) => ({ ...b, [it.id]: Math.max(0, (b[it.id] || 0) - 1) }))}>
                    <Text style={styles.qtyBtnText}>−</Text>
                  </TouchableOpacity>
                  <Text style={styles.qtyNum}>{fa(q)}</Text>
                  <TouchableOpacity style={styles.qtyBtn} onPress={() => setBasket((b) => ({ ...b, [it.id]: (b[it.id] || 0) + 1 }))}>
                    <Text style={styles.qtyBtnText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </View>
      ))}

      <View style={styles.footer}>
        <Text style={styles.totalText}>مجموع: {fa(total)} تومان</Text>
        <TouchableOpacity style={[styles.submitBtn, saving && { opacity: 0.5 }]} onPress={submit} disabled={saving}>
          <Text style={styles.submitText}>{saving ? '...' : 'ثبت سفارش'}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  container: { padding: 14, paddingBottom: 120 },
  modeRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  modeBtn: { flex: 1, borderRadius: 12, padding: 12, alignItems: 'center', backgroundColor: colors.card, borderWidth: 1.5, borderColor: colors.border },
  modeBtnActive: { backgroundColor: colors.greenLight, borderColor: colors.green },
  modeText: { fontSize: 14, fontWeight: 'bold', color: colors.muted },
  modeTextActive: { color: colors.greenDark },
  tableRow: { gap: 8, paddingVertical: 4, marginBottom: 12 },
  tableChip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
  tableChipActive: { backgroundColor: colors.green, borderColor: colors.green },
  tableChipText: { fontSize: 13, fontWeight: 'bold', color: colors.text },
  input: { backgroundColor: colors.card, borderRadius: 12, borderWidth: 1, borderColor: colors.border, padding: 12, fontSize: 14, marginBottom: 10, textAlign: 'right', color: colors.text },
  catBlock: { marginTop: 8 },
  catTitle: { fontSize: 14, fontWeight: 'bold', color: colors.greenDark, marginBottom: 8, textAlign: 'right' },
  itemRow: { backgroundColor: colors.card, borderRadius: 12, padding: 12, marginBottom: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: colors.border },
  itemName: { fontSize: 14, fontWeight: 'bold', color: colors.text, textAlign: 'right' },
  itemPrice: { fontSize: 12, color: colors.muted, marginTop: 3, textAlign: 'right' },
  qtyBox: { alignItems: 'center' },
  qtyBtn: { width: 30, height: 30, borderRadius: 15, backgroundColor: colors.greenLight, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.green },
  qtyBtnText: { fontSize: 16, color: colors.green, fontWeight: 'bold', lineHeight: 18 },
  qtyNum: { fontSize: 14, fontWeight: 'bold', color: colors.text, marginVertical: 2 },
  footer: { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: colors.card, borderTopWidth: 1, borderTopColor: colors.border, padding: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalText: { fontSize: 16, fontWeight: 'bold', color: colors.text },
  submitBtn: { backgroundColor: colors.green, borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12 },
  submitText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
});
