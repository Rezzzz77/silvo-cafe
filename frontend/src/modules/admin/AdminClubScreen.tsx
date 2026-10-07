import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput, Alert, RefreshControl } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../App';
import { adminGetCustomers, adminSendSms, adminGetSmsLog, adminGetConfig } from '../../api';
import { colors } from '../../core/theme';
import { fa, isoToJalaliStr } from '../../core/jalali';

type Props = NativeStackScreenProps<RootStackParamList, 'AdminClub'>;

const TIER_FA: Record<string, string> = { Bronze: 'برنزی', Silver: 'نقره‌ای', Gold: 'طلایی', Platinum: 'پلاتینیوم' };

export default function AdminClubScreen({ navigation }: Props) {
  const [customers, setCustomers] = useState<any[]>([]);
  const [smsLog, setSmsLog] = useState<any[]>([]);
  const [config, setConfig] = useState<{ sms: string } | null>(null);
  const [message, setMessage] = useState('');
  const [target, setTarget] = useState<'all' | 'birthday'>('all');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      setCustomers(await adminGetCustomers());
      setSmsLog(await adminGetSmsLog());
      setConfig(await adminGetConfig());
    } catch { /* ignore */ }
  }, []);

  useEffect(() => { load(); }, [load]);

  const send = async () => {
    if (!message.trim()) { Alert.alert('متن پیامک را بنویسید'); return; }
    setBusy(true);
    try {
      const res = await adminSendSms(message.trim(), target);
      Alert.alert('ارسال شد 📨', res.message);
      setMessage('');
      await load();
    } catch (e: any) { Alert.alert('خطا', e.message); } finally { setBusy(false); }
  };

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.container} refreshControl={<RefreshControl refreshing={false} onRefresh={load} />}>
      <View style={styles.smsBox}>
        <Text style={styles.sectionTitle}>📨 پنل ارسال پیامک انبوه</Text>
        <View style={styles.channelBadge}>
          <Text style={styles.channelText}>
            {config?.sms === 'kavenegar' ? '📡 پیامک واقعی (کاوه‌نگار) فعال است' : '🧪 حالت شبیه‌سازی — برای ارسال واقعی، کلید کاوه‌نگار را در تنظیمات سرور بگذارید'}
          </Text>
        </View>
        <TextInput
          style={styles.smsInput}
          placeholder="متن پیامک... (مثلاً: این هفته ۱۵٪ تخفیف روی همه منو!)"
          placeholderTextColor={colors.muted}
          value={message}
          onChangeText={setMessage}
          multiline
        />
        <View style={styles.targetRow}>
          <TouchableOpacity style={[styles.targetChip, target === 'all' && { backgroundColor: colors.green, borderColor: colors.green }]} onPress={() => setTarget('all')}>
            <Text style={[styles.targetText, target === 'all' && { color: '#fff' }]}>همه مشتریان ({fa(customers.length)})</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.targetChip, target === 'birthday' && { backgroundColor: colors.green, borderColor: colors.green }]} onPress={() => setTarget('birthday')}>
            <Text style={[styles.targetText, target === 'birthday' && { color: '#fff' }]}>🎂 متولدین امروز</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={[styles.sendBtn, busy && { opacity: 0.5 }]} onPress={send} disabled={busy}>
          <Text style={styles.sendBtnText}>ارسال پیامک</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>👥 باشگاه مشتریان ({fa(customers.length)})</Text>
      {customers.map((c) => (
        <View key={c.id} style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{c.name} <Text style={styles.phone}>{c.phone}</Text></Text>
            <Text style={styles.meta}>
              {TIER_FA[c.tier] || c.tier} · ⭐ {fa(c.loyaltyPoints)} امتیاز · {fa(c.ordersCount)} سفارش · {fa(c.totalSpent)} تومان
            </Text>
            {c.birthdate && <Text style={styles.bday}>🎂 {isoToJalaliStr(c.birthdate)}</Text>}
          </View>
        </View>
      ))}

      {smsLog.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>📜 تاریخچه پیامک‌ها</Text>
          {smsLog.map((l) => (
            <View key={l.id} style={styles.logRow}>
              <Text style={styles.logText}>«{l.message}» — {l.target} ({fa(l.count)} نفر)</Text>
              <Text style={styles.logTime}>{l.at.slice(11, 16)}</Text>
            </View>
          ))}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  container: { padding: 14, paddingBottom: 40 },
  smsBox: { backgroundColor: colors.card, borderRadius: 14, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: colors.border },
  sectionTitle: { fontSize: 14, fontWeight: 'bold', color: colors.greenDark, marginBottom: 10, textAlign: 'right' },
  channelBadge: { backgroundColor: colors.amberLight, borderRadius: 10, padding: 8, marginBottom: 10 },
  channelText: { fontSize: 11, color: colors.amber, textAlign: 'center', fontWeight: 'bold', lineHeight: 18 },
  smsInput: { backgroundColor: colors.bg, borderRadius: 10, borderWidth: 1, borderColor: colors.border, padding: 10, fontSize: 13, minHeight: 70, textAlignVertical: 'top', textAlign: 'right', color: colors.text, marginBottom: 10 },
  targetRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  targetChip: { flex: 1, padding: 10, borderRadius: 10, backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border, alignItems: 'center' },
  targetText: { fontSize: 12, color: colors.text, fontWeight: 'bold' },
  sendBtn: { backgroundColor: colors.green, borderRadius: 10, padding: 12, alignItems: 'center' },
  sendBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 13 },
  row: { backgroundColor: colors.card, borderRadius: 12, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: colors.border },
  name: { fontSize: 14, fontWeight: 'bold', color: colors.text, textAlign: 'right' },
  phone: { fontSize: 12, color: colors.muted, fontWeight: 'normal' },
  meta: { fontSize: 11, color: colors.muted, marginTop: 4, textAlign: 'right' },
  bday: { fontSize: 11, color: colors.amber, marginTop: 3, textAlign: 'right' },
  logRow: { backgroundColor: colors.greenLight, borderRadius: 10, padding: 10, marginBottom: 6, flexDirection: 'row', justifyContent: 'space-between' },
  logText: { fontSize: 11, color: colors.greenDark, flex: 1, textAlign: 'right' },
  logTime: { fontSize: 10, color: colors.muted },
});
