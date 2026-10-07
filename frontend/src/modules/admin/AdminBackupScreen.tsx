import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, RefreshControl } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../App';
import { adminBackup, adminGetBackups } from '../../api';
import { colors } from '../../core/theme';
import { fa } from '../../core/jalali';

type Props = NativeStackScreenProps<RootStackParamList, 'AdminBackup'>;

export default function AdminBackupScreen({ navigation }: Props) {
  const [backups, setBackups] = useState<any[]>([]);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try { setBackups(await adminGetBackups()); } catch { /* ignore */ }
  }, []);

  useEffect(() => { load(); }, [load]);

  const doBackup = async () => {
    setBusy(true);
    try {
      const res = await adminBackup();
      Alert.alert('✅ پشتیبان‌گیری', res.message);
      await load();
    } catch (e: any) {
      Alert.alert('خطا', e.message || 'پشتیبان‌گیری ناموفق');
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.container} refreshControl={<RefreshControl refreshing={false} onRefresh={load} />}>
      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>🗄️ پشتیبان‌گیری هوشمند</Text>
        <Text style={styles.infoText}>
          نسخه پشتیبان از تمام اطلاعات (منو، سفارش‌ها، مشتریان، انبار) هم روی دستگاه و هم قابل انتقال به فضای ابری ذخیره می‌شود.
        </Text>
        <TouchableOpacity style={[styles.backupBtn, busy && { opacity: 0.5 }]} onPress={doBackup} disabled={busy}>
          <Text style={styles.backupBtnText}>{busy ? 'در حال پشتیبان‌گیری...' : '📀 پشتیبان‌گیری همین حالا'}</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>نسخه‌های پشتیبان ({fa(backups.length)})</Text>
      {backups.map((b, i) => (
        <View key={i} style={styles.row}>
          <Text style={styles.rowText}>📄 {b.file}</Text>
          <Text style={styles.rowMeta}>{b.at.slice(0, 16).replace('T', ' ')} · {fa(b.size)} بایت</Text>
        </View>
      ))}
      {backups.length === 0 && <Text style={styles.empty}>هنوز نسخه پشتیبان ندارید</Text>}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  container: { padding: 14, paddingBottom: 40 },
  infoCard: { backgroundColor: colors.card, borderRadius: 16, padding: 18, marginBottom: 16, borderWidth: 1, borderColor: colors.border, alignItems: 'center' },
  infoTitle: { fontSize: 17, fontWeight: 'bold', color: colors.text },
  infoText: { fontSize: 12, color: colors.muted, textAlign: 'center', marginTop: 8, lineHeight: 20 },
  backupBtn: { backgroundColor: colors.blue, borderRadius: 14, padding: 14, alignItems: 'center', marginTop: 14, width: '100%' },
  backupBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  sectionTitle: { fontSize: 14, fontWeight: 'bold', color: colors.greenDark, marginBottom: 10, textAlign: 'right' },
  row: { backgroundColor: colors.card, borderRadius: 10, padding: 12, marginBottom: 6, borderWidth: 1, borderColor: colors.border },
  rowText: { fontSize: 12, color: colors.text, textAlign: 'right' },
  rowMeta: { fontSize: 10, color: colors.muted, marginTop: 4, textAlign: 'right' },
  empty: { textAlign: 'center', color: colors.muted, marginTop: 20 },
});
