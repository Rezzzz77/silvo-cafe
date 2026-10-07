import React, { useEffect, useState, useCallback, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../App';
import { kitchenGetQueue, kitchenSetStatus } from '../../api';
import { colors } from '../../core/theme';
import { fa } from '../../core/jalali';

type Props = NativeStackScreenProps<RootStackParamList, 'Kitchen'>;

type KitchenOrder = {
  orderId: number; tableNumber: number | null; orderType: string; customerName: string;
  status: string; items: { name: string; quantity: number }[]; note: string; elapsedSec: number;
};

const fmtDur = (sec: number) => {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return m > 0 ? `${fa(m)}:${String(s).padStart(2, '0')}` : `${fa(s)} ثانیه`;
};

export default function KitchenScreen({ navigation }: Props) {
  const [queue, setQueue] = useState<KitchenOrder[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [tick, setTick] = useState(0);
  const loadingRef = useRef(false);

  const load = useCallback(async () => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    try {
      setQueue(await kitchenGetQueue());
    } catch { /* ignore */ } finally {
      loadingRef.current = false;
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
    const poll = setInterval(load, 3000);
    const timer = setInterval(() => setTick((t) => t + 1), 1000);
    return () => { clearInterval(poll); clearInterval(timer); };
  }, [load]);

  const act = async (orderId: number, status: 'PREPARING' | 'SERVED') => {
    try {
      await kitchenSetStatus(orderId, status);
      await load();
    } catch { /* ignore */ }
  };

  const confirmed = queue.filter((o) => o.status === 'CONFIRMED').length;
  const preparing = queue.filter((o) => o.status === 'PREPARING').length;

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>👨‍🍳 نمایشگر آشپزخانه (KDS)</Text>
        <View style={styles.badges}>
          <View style={[styles.badge, { backgroundColor: colors.amberLight }]}>
            <Text style={[styles.badgeText, { color: colors.amber }]}>جدید: {fa(confirmed)}</Text>
          </View>
          <View style={[styles.badge, { backgroundColor: '#dbeafe' }]}>
            <Text style={[styles.badgeText, { color: colors.blue }]}>در حال پخت: {fa(preparing)}</Text>
          </View>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
      >
        {queue.length === 0 && (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>🍳 صف آشپزخانه خالی است — همه سفارش‌ها آماده‌اند!</Text>
          </View>
        )}

        {queue.map((o) => {
          const late = o.elapsedSec > 600; // بیشتر از ۱۰ دقیقه
          const warn = o.elapsedSec > 300;
          return (
            <View
              key={o.orderId}
              style={[
                styles.card,
                o.status === 'PREPARING' && { borderColor: colors.blue, borderWidth: 2 },
                late && { backgroundColor: colors.redLight },
              ]}
            >
              <View style={styles.cardTop}>
                <Text style={styles.orderLabel}>
                  #{fa(o.orderId)} {o.tableNumber ? `· میز ${fa(o.tableNumber)}` : '· بیرون‌بر'} · {o.customerName}
                </Text>
                <Text style={[styles.timer, late && { color: colors.red }, warn && !late && { color: colors.amber }]}>
                  ⏱ {fmtDur(o.elapsedSec + Math.floor(tick * 0))}
                </Text>
              </View>

              <View style={styles.itemsBox}>
                {o.items.map((it, i) => (
                  <Text key={i} style={styles.itemText}>
                    <Text style={styles.itemQty}>×{fa(it.quantity)}</Text> {it.name}
                  </Text>
                ))}
                {o.note ? <Text style={styles.note}>📝 {o.note}</Text> : null}
              </View>

              <View style={styles.actions}>
                {o.status === 'CONFIRMED' ? (
                  <TouchableOpacity style={[styles.btn, { backgroundColor: colors.blue }]} onPress={() => act(o.orderId, 'PREPARING')}>
                    <Text style={styles.btnText}>🔥 شروع آماده‌سازی</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity style={[styles.btn, { backgroundColor: colors.green }]} onPress={() => act(o.orderId, 'SERVED')}>
                    <Text style={styles.btnText}>✅ آماده شد — سرو کن</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  header: { padding: 14, backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.border },
  headerTitle: { fontSize: 16, fontWeight: 'bold', color: colors.text, textAlign: 'center' },
  badges: { flexDirection: 'row', justifyContent: 'center', gap: 10, marginTop: 8 },
  badge: { borderRadius: 12, paddingHorizontal: 12, paddingVertical: 5 },
  badgeText: { fontSize: 12, fontWeight: 'bold' },
  list: { padding: 12, paddingBottom: 40 },
  emptyBox: { backgroundColor: colors.greenLight, borderRadius: 14, padding: 24, alignItems: 'center', borderWidth: 1, borderColor: colors.green },
  emptyText: { color: colors.greenDark, fontWeight: 'bold', fontSize: 14, textAlign: 'center' },
  card: { backgroundColor: colors.card, borderRadius: 16, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: colors.border },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  orderLabel: { fontSize: 14, fontWeight: 'bold', color: colors.text, flex: 1, textAlign: 'right' },
  timer: { fontSize: 15, fontWeight: 'bold', color: colors.greenDark },
  itemsBox: { backgroundColor: colors.bg, borderRadius: 10, padding: 10 },
  itemText: { fontSize: 15, color: colors.text, marginBottom: 4, textAlign: 'right', lineHeight: 24 },
  itemQty: { fontWeight: 'bold', color: colors.greenDark, fontSize: 16 },
  note: { fontSize: 12, color: colors.amber, marginTop: 4, textAlign: 'right' },
  actions: { marginTop: 10 },
  btn: { borderRadius: 12, padding: 13, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
});
