import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, RefreshControl, Modal } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../App';
import { useApp } from '../../core/store';
import { getTables } from '../../api';
import { colors } from '../../core/theme';
import { fa } from '../../core/jalali';
import QrMatrix from './QrMatrix';

type Props = NativeStackScreenProps<RootStackParamList, 'Tables'>;

type T = {
  id: number; number: number; section: string; capacity: number;
  activeOrder: { status: string; customerName: string } | null;
};

export default function TableScreen({ navigation }: Props) {
  const { setTable } = useApp();
  const [tables, setTables] = useState<T[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [actionTable, setActionTable] = useState<T | null>(null);
  const [qrTable, setQrTable] = useState<T | null>(null);

  const load = useCallback(async () => {
    try {
      setTables(await getTables(1));
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 5000);
    return () => clearInterval(t);
  }, [load]);

  const pick = (t: T) => {
    if (t.activeOrder) return;
    setActionTable(t);
  };

  const sitDown = (t: T) => {
    setTable({ id: t.id, number: t.number, section: t.section, capacity: t.capacity });
    setActionTable(null);
    navigation.navigate('Login');
  };

  const sections = ['سالن اصلی', 'تراس'];

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={load} />}
    >
      <Text style={styles.hint}>
        📷 در حالت واقعی، مشتری QR روی میز را اسکن می‌کند و مستقیم وارد منوی همان میز می‌شود.
        برای دمو، میز خود را انتخاب کنید:
      </Text>
      {sections.map((sec) => (
        <View key={sec} style={styles.section}>
          <Text style={styles.sectionTitle}>{sec}</Text>
          <View style={styles.grid}>
            {tables.filter((t) => t.section === sec).map((t) => {
              const busy = !!t.activeOrder;
              return (
                <TouchableOpacity
                  key={t.id}
                  style={[styles.cell, busy ? styles.cellBusy : styles.cellFree]}
                  onPress={() => pick(t)}
                  disabled={busy}
                >
                  <Text style={[styles.cellNum, busy && { color: colors.red }]}>میز {fa(t.number)}</Text>
                  <Text style={styles.cellCap}>{fa(t.capacity)} نفر</Text>
                  <Text style={[styles.cellStatus, busy ? styles.statusBusy : styles.statusFree]}>
                    {busy ? 'در حال سرویس' : 'آزاد'}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      ))}
      {actionTable && (
        <Modal transparent animationType="fade" visible onRequestClose={() => setActionTable(null)}>
          <View style={styles.modalBackdrop}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>میز {fa(actionTable.number)} — {actionTable.section}</Text>
              <Text style={styles.modalSub}>{fa(actionTable.capacity)} نفر · وضعیت: آزاد</Text>

              <TouchableOpacity style={styles.modalBtn} onPress={() => sitDown(actionTable)}>
                <Text style={styles.modalBtnText}>🪑 نشستن سر این میز</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnAlt]}
                onPress={() => { setQrTable(actionTable); }}
              >
                <Text style={styles.modalBtnText}>🔳 نمایش QR میز (برای چاپ)</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.modalClose} onPress={() => setActionTable(null)}>
                <Text style={styles.modalCloseText}>بستن</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}

      {qrTable && (
        <Modal transparent animationType="fade" visible onRequestClose={() => setQrTable(null)}>
          <View style={styles.modalBackdrop}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>QR میز {fa(qrTable.number)}</Text>
              <Text style={styles.modalSub}>این کد را چاپ کنید و روی میز بچسبانید — مشتری با اسکن آن مستقیم وارد منوی همین میز می‌شود</Text>
              <View style={styles.qrWrap}>
                <QrMatrix value={`SILVO-TABLE-${qrTable.number}`} size={200} />
              </View>
              <Text style={styles.qrLabel}>کافه سیلو پلازا · میز {fa(qrTable.number)}</Text>
              <TouchableOpacity
                style={styles.modalBtn}
                onPress={() => { setQrTable(null); setActionTable(null); }}
              >
                <Text style={styles.modalBtnText}>فهمیدم</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  container: { padding: 16 },
  hint: { color: colors.muted, fontSize: 13, lineHeight: 22, marginBottom: 16, textAlign: 'right' },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: colors.greenDark, marginBottom: 10 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  cell: {
    width: '30%', borderRadius: 12, padding: 14, alignItems: 'center',
    borderWidth: 1.5,
  },
  cellFree: { backgroundColor: colors.greenLight, borderColor: colors.green },
  cellBusy: { backgroundColor: colors.redLight, borderColor: colors.red },
  cellNum: { fontSize: 16, fontWeight: 'bold', color: colors.text },
  cellCap: { fontSize: 11, color: colors.muted, marginTop: 2 },
  cellStatus: { fontSize: 11, fontWeight: '600', marginTop: 6 },
  statusFree: { color: colors.green },
  statusBusy: { color: colors.red },
  modalBackdrop: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center', padding: 24,
  },
  modalCard: {
    backgroundColor: colors.card, borderRadius: 18, padding: 22, width: '100%', maxWidth: 360, alignItems: 'center',
  },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: colors.text, textAlign: 'center' },
  modalSub: { fontSize: 13, color: colors.muted, marginTop: 6, marginBottom: 18, textAlign: 'center', lineHeight: 20 },
  modalBtn: {
    backgroundColor: colors.green, borderRadius: 12, padding: 14, width: '100%', alignItems: 'center', marginBottom: 10,
  },
  modalBtnAlt: { backgroundColor: colors.blue },
  modalBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  modalClose: { padding: 10 },
  modalCloseText: { color: colors.muted, fontWeight: 'bold', fontSize: 13 },
  qrWrap: { padding: 10, backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: colors.border },
  qrLabel: { marginTop: 12, marginBottom: 14, fontSize: 12, color: colors.muted, fontWeight: 'bold' },
});
