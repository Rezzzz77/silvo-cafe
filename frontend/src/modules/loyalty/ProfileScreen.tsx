import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../App';
import { useApp } from '../../core/store';
import { getProfile } from '../../api';
import { colors } from '../../core/theme';
import { fa } from '../../core/jalali';

type Props = NativeStackScreenProps<RootStackParamList, 'Profile'>;

const TIER_FA: Record<string, string> = {
  Bronze: 'برنزی', Silver: 'نقره‌ای', Gold: 'طلایی', Platinum: 'پلاتینیوم',
};

export default function ProfileScreen({ navigation }: Props) {
  const { user, logout } = useApp();
  const [profile, setProfile] = useState<any>(null);

  const load = useCallback(async () => {
    if (!user) return;
    try { setProfile(await getProfile(user.id)); } catch { /* ignore */ }
  }, [user]);

  useEffect(() => {
    load();
    const t = setInterval(load, 5000);
    return () => clearInterval(t);
  }, [load]);

  if (!user) {
    return (
      <View style={styles.center}>
        <Text style={styles.muted}>هنوز وارد نشده‌اید</Text>
        <TouchableOpacity style={styles.loginBtn} onPress={() => navigation.navigate('Login')}>
          <Text style={styles.loginBtnText}>ورود</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const nextTier = user.loyaltyPoints < 500 ? { name: 'Silver', min: 500 } : user.loyaltyPoints < 2000 ? { name: 'Gold', min: 2000 } : user.loyaltyPoints < 5000 ? { name: 'Platinum', min: 5000 } : null;

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.container}>
      <View style={styles.card}>
        <Text style={styles.name}>👤 {user.name}</Text>
        <Text style={styles.phone}>📱 {user.phone}</Text>
        <View style={styles.tierRow}>
          <Text style={styles.tierBadge}>{TIER_FA[user.tier] || user.tier}</Text>
          <Text style={styles.points}>⭐ {fa(user.loyaltyPoints)} امتیاز</Text>
        </View>
        {nextTier && (
          <Text style={styles.nextTier}>
            {fa(nextTier.min - user.loyaltyPoints)} امتیاز تا سطح {TIER_FA[nextTier.name]} بعدی
          </Text>
        )}
      </View>

      {profile?.orders?.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>سفارش‌های اخیر</Text>
          {profile.orders.slice(-5).map((o: any, i: number) => (
            <View key={i} style={styles.orderRow}>
              <Text style={styles.orderText}>#{fa(o.id)} — میز {fa(o.tableNumber)}</Text>
              <Text style={styles.orderAmount}>{fa(o.totalAmount)} تومان</Text>
            </View>
          ))}
        </View>
      )}

      {profile?.spins?.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>جوایز چرخ شانس</Text>
          {profile.spins.map((s: any, i: number) => (
            <Text key={i} style={styles.spinText}>🎁 {s.label} ({fa(s.date)})</Text>
          ))}
        </View>
      )}

      <TouchableOpacity
        style={styles.logoutBtn}
        onPress={() => { logout(); navigation.popToTop(); }}
      >
        <Text style={styles.logoutText}>خروج از حساب</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  container: { padding: 16 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg, gap: 16 },
  muted: { color: colors.muted, fontSize: 15 },
  loginBtn: { backgroundColor: colors.green, borderRadius: 12, paddingHorizontal: 32, paddingVertical: 12 },
  loginBtnText: { color: '#fff', fontWeight: 'bold' },
  card: {
    backgroundColor: colors.card, borderRadius: 16, padding: 16, marginBottom: 14,
    borderWidth: 1, borderColor: colors.border,
  },
  name: { fontSize: 18, fontWeight: 'bold', color: colors.text, textAlign: 'right' },
  phone: { fontSize: 13, color: colors.muted, marginTop: 6, textAlign: 'right' },
  tierRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 },
  tierBadge: {
    backgroundColor: colors.greenLight, color: colors.greenDark,
    fontWeight: 'bold', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, overflow: 'hidden', fontSize: 13,
  },
  points: { fontSize: 15, fontWeight: 'bold', color: colors.amber },
  nextTier: { fontSize: 12, color: colors.muted, marginTop: 10, textAlign: 'right' },
  sectionTitle: { fontSize: 15, fontWeight: 'bold', color: colors.greenDark, marginBottom: 10, textAlign: 'right' },
  orderRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  orderText: { fontSize: 13, color: colors.text },
  orderAmount: { fontSize: 13, color: colors.muted },
  spinText: { fontSize: 13, color: colors.text, marginBottom: 4, textAlign: 'right' },
  logoutBtn: {
    marginTop: 6, backgroundColor: colors.redLight, borderRadius: 14, padding: 14, alignItems: 'center',
    borderWidth: 1, borderColor: colors.red,
  },
  logoutText: { color: colors.red, fontWeight: 'bold' },
});
