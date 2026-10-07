import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../App';
import { useApp } from '../../core/store';
import { colors } from '../../core/theme';
import { jalaliToday, formatJalali, fa } from '../../core/jalali';

type Props = NativeStackScreenProps<RootStackParamList, 'Welcome'>;

export default function WelcomeScreen({ navigation }: Props) {
  const { user, table, cartCount } = useApp();
  const today = jalaliToday();

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.container}>
      <View style={styles.hero}>
        <Text style={styles.logo}>☕</Text>
        <Text style={styles.title}>کافه سیلو پلازا</Text>
        <Text style={styles.subtitle}>طرقبه مشهد — بلوار امام رضا، مجتمع پلازا</Text>
        <View style={styles.dateBox}>
          <Text style={styles.dateText}>
            {today.weekday}، {formatJalali(today)}
          </Text>
        </View>
      </View>

      {user && (
        <TouchableOpacity style={styles.userBar} onPress={() => navigation.navigate('Profile')}>
          <Text style={styles.userName}>👤 {user.name}</Text>
          <Text style={styles.userPoints}>⭐ {fa(user.loyaltyPoints)} امتیاز · {user.tier}</Text>
        </TouchableOpacity>
      )}

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.bigBtn, { backgroundColor: colors.green }]}
          onPress={() => navigation.navigate('Scan')}
        >
          <Text style={styles.bigBtnText}>📱 اسکن QR میز</Text>
          <Text style={styles.bigBtnSub}>دوربین را روی QR میز بگیرید — سفارش و پرداخت بدون گارسون</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.linkBtn} onPress={() => navigation.navigate('Tables')}>
          <Text style={styles.linkText}>یا انتخاب دستی میز ←</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.bigBtn, { backgroundColor: colors.amber }]}
          onPress={() => navigation.navigate('Spin')}
        >
          <Text style={styles.bigBtnText}>🎡 چرخ شانس روزانه</Text>
          <Text style={styles.bigBtnSub}>هر روز یک جایزه: امتیاز یا کوپن تخفیف</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.bigBtn, { backgroundColor: colors.blue }]}
          onPress={() => navigation.navigate('Admin')}
        >
          <Text style={styles.bigBtnText}>🛎️ پنل مدیریت</Text>
          <Text style={styles.bigBtnSub}>مشاهده زندهٔ میزها و سفارش‌ها</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.plansBtn} onPress={() => navigation.navigate('Plans')}>
          <Text style={styles.plansText}>💼 مخصوص صاحبان کافه: مشاهده پلن‌ها و تعرفه‌ها</Text>
        </TouchableOpacity>
      </View>

      {cartCount > 0 && (
        <TouchableOpacity style={styles.cartFab} onPress={() => navigation.navigate('Cart')}>
          <Text style={styles.cartFabText}>🛒 سبد خرید ({fa(cartCount)})</Text>
        </TouchableOpacity>
      )}

      <Text style={styles.footer}>پرداخت آنلاین · تقویم جلالی · تخفیف تولد · امتیاز وفاداری</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  container: { padding: 20, paddingTop: 60 },
  hero: { alignItems: 'center', marginBottom: 24 },
  logo: { fontSize: 64 },
  title: { fontSize: 30, fontWeight: 'bold', color: colors.green, marginTop: 8 },
  subtitle: { fontSize: 14, color: colors.muted, marginTop: 6, textAlign: 'center' },
  dateBox: {
    marginTop: 12, backgroundColor: colors.greenLight,
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
  },
  dateText: { color: colors.greenDark, fontSize: 14, fontWeight: '600' },
  userBar: {
    backgroundColor: colors.card, borderRadius: 12, padding: 14,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 20, borderWidth: 1, borderColor: colors.border,
  },
  userName: { fontSize: 15, fontWeight: 'bold', color: colors.text },
  userPoints: { fontSize: 13, color: colors.amber },
  actions: { gap: 14 },
  bigBtn: { borderRadius: 16, padding: 18 },
  bigBtnText: { color: '#fff', fontSize: 17, fontWeight: 'bold', textAlign: 'center' },
  bigBtnSub: { color: 'rgba(255,255,255,0.85)', fontSize: 12, textAlign: 'center', marginTop: 6 },
  linkBtn: { paddingVertical: 8, alignItems: 'center' },
  linkText: { color: colors.green, fontWeight: 'bold', fontSize: 13 },
  plansBtn: {
    marginTop: 4, borderWidth: 1.5, borderColor: colors.blue, borderRadius: 14,
    padding: 14, alignItems: 'center', backgroundColor: '#eff6ff',
  },
  plansText: { color: colors.blue, fontWeight: 'bold', fontSize: 13 },
  cartFab: {
    marginTop: 20, backgroundColor: colors.green, borderRadius: 14, padding: 16, alignItems: 'center',
  },
  cartFabText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  footer: { marginTop: 28, textAlign: 'center', color: colors.muted, fontSize: 11 },
});
