import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../App';
import { adminGetTables, adminGetStats, adminSetOrderStatus, getOrder, adminGetWaiterCalls, adminResolveWaiterCall } from '../../api';
import { colors } from '../../core/theme';
import { fa } from '../../core/jalali';

type Props = NativeStackScreenProps<RootStackParamList, 'Admin'>;

type T = {
  id: number; number: number; section: string; capacity: number;
  activeOrder: null | {
    id: number; customerName: string; totalAmount: number; status: string;
    paymentStatus: string; itemCount: number;
  };
};

type Order = { id: number; tableNumber: number; customerName: string; status: string; paymentStatus: string; items: { name: string; quantity: number }[]; totalAmount: number; note?: string };

const ACTIONS: { key: string; label: string; color: string }[] = [
  { key: 'CONFIRMED', label: '✓ تایید', color: colors.green },
  { key: 'PREPARING', label: '👨‍🍳 آماده‌سازی', color: colors.amber },
  { key: 'SERVED', label: '🍽️ سرو شد', color: colors.blue },
  { key: 'COMPLETED', label: '🏁 تکمیل و آزادسازی میز', color: colors.red },
];

const STATUS_FA: Record<string, string> = {
  PENDING: 'در انتظار تایید', CONFIRMED: 'تایید شده', PREPARING: 'در حال آماده‌سازی',
  SERVED: 'سرو شده', COMPLETED: 'تکمیل شده', CANCELLED: 'لغو شده',
};

type Stats = {
  activeTables: number; totalTables: number; ordersToday: number; paidToday: number;
  revenueToday: number; avgOrder: number; pendingCount: number; totalUsers: number;
};

export default function AdminScreen({ navigation }: Props) {
  const [tables, setTables] = useState<T[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [selected, setSelected] = useState<Order | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [calls, setCalls] = useState<any[]>([]);

  const loadCalls = useCallback(async () => {
    try { setCalls(await adminGetWaiterCalls()); } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    loadCalls();
    const t = setInterval(loadCalls, 5000);
    return () => clearInterval(t);
  }, [loadCalls]);

  const load = useCallback(async () => {
    try {
      const tabs: T[] = await adminGetTables();
      setTables(tabs);
      setStats(await adminGetStats());
      setSelected((prev) => {
        if (!prev) return prev;
        const t = tabs.find((x) => x.id === prev.tableNumber);
        if (t?.activeOrder?.id !== prev.id) return null;
        return prev;
      });
    } catch { /* ignore */ }
  }, []);

  const loadOrder = useCallback(async (id: number) => {
    try { setSelected(await getOrder(id)); } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 4000);
    return () => clearInterval(t);
  }, [load]);

  useEffect(() => {
    if (selected) {
      const t = setInterval(() => loadOrder(selected.id), 4000);
      return () => clearInterval(t);
    }
  }, [selected, loadOrder]);

  const act = async (status: string) => {
    if (!selected) return;
    try {
      await adminSetOrderStatus(selected.id, status);
      if (status === 'COMPLETED' || status === 'CANCELLED') setSelected(null);
      await load();
    } catch (e: any) {
      /* ignore */
    }
  };

  const resolveCall = async (id: number) => {
    try {
      await adminResolveWaiterCall(id);
      await loadCalls();
      await load();
    } catch { /* ignore */ }
  };

  const activeCount = tables.filter((t) => t.activeOrder).length;

  return (
    <View style={styles.root}>
      <View style={styles.summary}>
        <Text style={styles.summaryText}>
          {fa(activeCount)} میز فعال · {fa(tables.length)} میز کل
        </Text>
        <TouchableOpacity onPress={load}>
          <Text style={styles.refresh}>⟳ بروزرسانی</Text>
        </TouchableOpacity>
      </View>

      {stats && (
        <View style={styles.statsBar}>
          <View style={styles.statCell}>
            <Text style={styles.statValue}>{fa(stats.revenueToday)}</Text>
            <Text style={styles.statLabel}>درآمد امروز (تومان)</Text>
          </View>
          <View style={styles.statCell}>
            <Text style={styles.statValue}>{fa(stats.ordersToday)}</Text>
            <Text style={styles.statLabel}>سفارش امروز</Text>
          </View>
          <View style={styles.statCell}>
            <Text style={styles.statValue}>{fa(stats.avgOrder)}</Text>
            <Text style={styles.statLabel}>میانگین سفارش</Text>
          </View>
          <View style={styles.statCell}>
            <Text style={[styles.statValue, stats.pendingCount > 0 && { color: colors.red }]}>{fa(stats.pendingCount)}</Text>
            <Text style={styles.statLabel}>در انتظار تایید</Text>
          </View>
        </View>
      )}

      {calls.length > 0 && (
        <View style={styles.callsBar}>
          {calls.map((c) => (
            <View key={c.id} style={styles.callRow}>
              <Text style={styles.callText}>🔔 میز {fa(c.tableNumber)} گارسون می‌خواهد</Text>
              <TouchableOpacity style={styles.callBtn} onPress={() => resolveCall(c.id)}>
                <Text style={styles.callBtnText}>حل شد ✓</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      <View style={styles.navGrid}>
        {[
          { key: 'Kitchen', icon: '👨‍🍳', label: 'آشپزخانه (KDS)' },
          { key: 'AdminManualOrder', icon: '🧾', label: 'سفارش دستی' },
          { key: 'AdminMenu', icon: '📋', label: 'مدیریت منو' },
          { key: 'AdminInventory', icon: '📦', label: 'انبارداری' },
          { key: 'AdminStaff', icon: '👥', label: 'پرسنل' },
          { key: 'AdminClub', icon: '💌', label: 'باشگاه + پیامک' },
          { key: 'AdminReport', icon: '📊', label: 'گزارش‌ها' },
          { key: 'AdminSurveys', icon: '⭐', label: 'نظرسنجی‌ها' },
          { key: 'AdminBackup', icon: '🗄️', label: 'پشتیبان‌گیری' },
        ].map((item) => (
          <TouchableOpacity
            key={item.key}
            style={styles.navCell}
            onPress={() => (navigation as any).navigate(item.key)}
          >
            <Text style={styles.navIcon}>{item.icon}</Text>
            <Text style={styles.navLabel}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={load} />}
      >
        {['سالن اصلی', 'تراس'].map((sec) => (
          <View key={sec} style={styles.section}>
            <Text style={styles.sectionTitle}>{sec}</Text>
            <View style={styles.grid}>
              {tables.filter((t) => t.section === sec).map((t) => (
                <TouchableOpacity
                  key={t.id}
                  style={[styles.cell, t.activeOrder ? styles.cellBusy : styles.cellFree]}
                  onPress={() => t.activeOrder && loadOrder(t.activeOrder.id)}
                >
                  <Text style={styles.cellNum}>میز {fa(t.number)}</Text>
                  <Text style={[styles.cellStatus, t.activeOrder ? { color: colors.red } : { color: colors.green }]}>
                    {t.activeOrder ? STATUS_FA[t.activeOrder.status] || t.activeOrder.status : 'آزاد'}
                  </Text>
                  {t.activeOrder && (
                    <Text style={styles.cellInfo}>{t.activeOrder.customerName} · {fa(t.activeOrder.totalAmount)}ت</Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        {selected && (
          <View style={styles.orderCard}>
            <View style={styles.orderHeader}>
              <Text style={styles.orderTitle}>سفارش #{fa(selected.id)} — میز {fa(selected.tableNumber)}</Text>
              <Text style={styles.orderCustomer}>{selected.customerName}</Text>
              <Text style={styles.orderPay}>
                {selected.paymentStatus === 'PAID' ? '💳 پرداخت شده' : '⚠️ پرداخت نشده'} · {STATUS_FA[selected.status]}
              </Text>
            </View>
            {selected.items.map((it, idx) => (
              <Text key={idx} style={styles.orderItem}>• {it.name} × {fa(it.quantity)}</Text>
            ))}
            {selected.note ? <Text style={styles.orderNote}>یادداشت: {selected.note}</Text> : null}
            <View style={styles.actions}>
              {ACTIONS.filter((a) => selected.status !== a.key).map((a) => (
                <TouchableOpacity
                  key={a.key}
                  style={[styles.actionBtn, { backgroundColor: a.color }]}
                  onPress={() => act(a.key)}
                >
                  <Text style={styles.actionText}>{a.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  summary: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 14, backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  summaryText: { fontWeight: 'bold', color: colors.text, fontSize: 14 },
  refresh: { color: colors.blue, fontWeight: 'bold', fontSize: 13 },
  statsBar: {
    flexDirection: 'row', backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.border,
    paddingVertical: 10,
  },
  statCell: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 15, fontWeight: 'bold', color: colors.greenDark },
  statLabel: { fontSize: 10, color: colors.muted, marginTop: 2 },
  callsBar: { backgroundColor: colors.amberLight, padding: 10, borderBottomWidth: 1, borderBottomColor: '#fde68a' },
  callRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 3 },
  callText: { color: colors.amber, fontWeight: 'bold', fontSize: 13 },
  callBtn: { backgroundColor: colors.green, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  callBtnText: { color: '#fff', fontSize: 11, fontWeight: 'bold' },
  navGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 8, padding: 14, paddingBottom: 4,
    backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  navCell: {
    width: '23%', backgroundColor: colors.greenLight, borderRadius: 12, paddingVertical: 12, alignItems: 'center',
    borderWidth: 1, borderColor: colors.green,
  },
  navIcon: { fontSize: 22 },
  navLabel: { fontSize: 10, color: colors.greenDark, fontWeight: 'bold', marginTop: 4, textAlign: 'center' },
  container: { padding: 14, paddingBottom: 40 },
  section: { marginBottom: 18 },
  sectionTitle: { fontSize: 15, fontWeight: 'bold', color: colors.greenDark, marginBottom: 10 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  cell: {
    width: '31%', borderRadius: 12, padding: 12, borderWidth: 1.5, alignItems: 'center',
  },
  cellFree: { backgroundColor: colors.greenLight, borderColor: colors.green },
  cellBusy: { backgroundColor: colors.redLight, borderColor: colors.red },
  cellNum: { fontSize: 14, fontWeight: 'bold', color: colors.text },
  cellStatus: { fontSize: 11, fontWeight: '600', marginTop: 4 },
  cellInfo: { fontSize: 10, color: colors.muted, marginTop: 4, textAlign: 'center' },
  orderCard: {
    backgroundColor: colors.card, borderRadius: 16, padding: 16, marginTop: 6,
    borderWidth: 1.5, borderColor: colors.green,
  },
  orderHeader: { marginBottom: 10 },
  orderTitle: { fontSize: 16, fontWeight: 'bold', color: colors.text, textAlign: 'right' },
  orderCustomer: { fontSize: 13, color: colors.muted, marginTop: 4, textAlign: 'right' },
  orderPay: { fontSize: 12, fontWeight: 'bold', color: colors.amber, marginTop: 4, textAlign: 'right' },
  orderItem: { fontSize: 13, color: colors.text, marginBottom: 4, textAlign: 'right' },
  orderNote: { fontSize: 12, color: colors.muted, marginTop: 6, textAlign: 'right', fontStyle: 'italic' },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 },
  actionBtn: { borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10 },
  actionText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
});
