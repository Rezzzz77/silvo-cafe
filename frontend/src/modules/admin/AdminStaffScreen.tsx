import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput, Alert, RefreshControl } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../App';
import { adminGetStaff, adminAddStaff, adminDeleteStaff } from '../../api';
import { colors } from '../../core/theme';
import { fa } from '../../core/jalali';

type Props = NativeStackScreenProps<RootStackParamList, 'AdminStaff'>;

const ROLES = [
  { key: 'MANAGER', fa: '👑 مدیر' },
  { key: 'CASHIER', fa: '💵 صندوق‌دار' },
  { key: 'WAITER', fa: '🛎️ گارسون' },
  { key: 'CHEF', fa: '👨‍🍳 آشپز' },
];

const ROLE_COLOR: Record<string, string> = { MANAGER: colors.blue, CASHIER: colors.green, WAITER: colors.amber, CHEF: '#7c3aed' };

export default function AdminStaffScreen({ navigation }: Props) {
  const [staff, setStaff] = useState<any[]>([]);
  const [name, setName] = useState('');
  const [role, setRole] = useState('WAITER');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try { setStaff(await adminGetStaff()); } catch { /* ignore */ }
  }, []);

  useEffect(() => { load(); }, [load]);

  const add = async () => {
    if (!name.trim()) return;
    setBusy(true);
    try {
      await adminAddStaff(name.trim(), role);
      setName('');
      await load();
    } catch (e: any) { Alert.alert('خطا', e.message); } finally { setBusy(false); }
  };

  const del = (id: number) => {
    Alert.alert('حذف پرسنل', 'مطمئن هستید؟', [
      { text: 'انصراف', style: 'cancel' },
      { text: 'حذف', style: 'destructive', onPress: async () => { await adminDeleteStaff(id); await load(); } },
    ]);
  };

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.container} refreshControl={<RefreshControl refreshing={false} onRefresh={load} />}>
      <View style={styles.form}>
        <TextInput style={styles.input} placeholder="نام و نام خانوادگی" placeholderTextColor={colors.muted} value={name} onChangeText={setName} />
        <View style={styles.roleRow}>
          {ROLES.map((r) => (
            <TouchableOpacity
              key={r.key}
              style={[styles.roleChip, role === r.key && { backgroundColor: ROLE_COLOR[r.key], borderColor: ROLE_COLOR[r.key] }]}
              onPress={() => setRole(r.key)}
            >
              <Text style={[styles.roleText, role === r.key && { color: '#fff' }]}>{r.fa}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity style={[styles.addBtn, busy && { opacity: 0.5 }]} onPress={add} disabled={busy}>
          <Text style={styles.addBtnText}>افزودن پرسنل</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>لیست پرسنل ({fa(staff.length)})</Text>
      {staff.map((s) => (
        <View key={s.id} style={styles.row}>
          <View style={[styles.avatar, { backgroundColor: ROLE_COLOR[s.role] || colors.muted }]}>
            <Text style={styles.avatarText}>{s.name.slice(0, 1)}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{s.name}</Text>
            <Text style={styles.roleLabel}>سطح دسترسی: {ROLES.find((r) => r.key === s.role)?.fa || s.role}</Text>
          </View>
          {s.role !== 'MANAGER' && (
            <TouchableOpacity style={styles.delBtn} onPress={() => del(s.id)}>
              <Text style={styles.delText}>🗑</Text>
            </TouchableOpacity>
          )}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  container: { padding: 14, paddingBottom: 40 },
  form: { backgroundColor: colors.card, borderRadius: 14, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: colors.border },
  input: { backgroundColor: colors.bg, borderRadius: 10, borderWidth: 1, borderColor: colors.border, padding: 10, fontSize: 13, marginBottom: 10, textAlign: 'right', color: colors.text },
  roleRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  roleChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16, backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border },
  roleText: { fontSize: 12, color: colors.text, fontWeight: 'bold' },
  addBtn: { backgroundColor: colors.green, borderRadius: 10, padding: 12, alignItems: 'center' },
  addBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 13 },
  sectionTitle: { fontSize: 14, fontWeight: 'bold', color: colors.greenDark, marginBottom: 10, textAlign: 'right' },
  row: { backgroundColor: colors.card, borderRadius: 12, padding: 12, marginBottom: 8, flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderColor: colors.border },
  avatar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  name: { fontSize: 14, fontWeight: 'bold', color: colors.text, textAlign: 'right' },
  roleLabel: { fontSize: 11, color: colors.muted, marginTop: 3, textAlign: 'right' },
  delBtn: { backgroundColor: colors.redLight, borderRadius: 8, padding: 8 },
  delText: { fontSize: 14 },
});
