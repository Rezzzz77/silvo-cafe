import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../App';
import { useApp } from '../../core/store';
import { colors } from '../../core/theme';
import { fa, jalaliStrToIso } from '../../core/jalali';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

export default function LoginScreen({ navigation }: Props) {
  const { login, table } = useApp();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [birthdate, setBirthdate] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!name.trim() || phone.trim().length < 10) {
      Alert.alert('خطا', 'نام و شماره موبایل معتبر وارد کنید');
      return;
    }
    // اگر تاریخ تولد وارد شده، اعتبار و تبدیل آن را بررسی کن
    let isoBirth: string | undefined;
    if (birthdate.trim()) {
      isoBirth = jalaliStrToIso(birthdate) ?? undefined;
      if (!isoBirth) {
        Alert.alert('تاریخ نامعتبر', 'تاریخ تولد را به شکل ۱۳۷۴/۷/۱۵ وارد کنید (اختیاری)');
        return;
      }
    }
    setLoading(true);
    try {
      await login(name.trim(), phone.trim(), isoBirth);
      navigation.replace('Menu');
    } catch (e: any) {
      Alert.alert('خطا', e.message || 'ورود ناموفق بود');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.container}>
        {table && (
          <View style={styles.tableBadge}>
            <Text style={styles.tableBadgeText}>شما روی میز {fa(table.number)} هستید ({table.section})</Text>
          </View>
        )}
        <Text style={styles.title}>خوش آمدید 👋</Text>
        <Text style={styles.subtitle}>برای ثبت سفارش و دریافت امتیاز، وارد شوید</Text>

        <TextInput
          style={styles.input}
          placeholder="نام شما (مثلاً: رضا محمدی)"
          placeholderTextColor={colors.muted}
          value={name}
          onChangeText={setName}
        />
        <TextInput
          style={styles.input}
          placeholder="شماره موبایل (۰۹۱۵...)‎"
          placeholderTextColor={colors.muted}
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
        />
        <TextInput
          style={styles.input}
          placeholder="تاریخ تولد (اختیاری) — مثلاً ۱۳۷۴/۷/۱۵"
          placeholderTextColor={colors.muted}
          value={birthdate}
          onChangeText={setBirthdate}
        />

        <TouchableOpacity style={[styles.btn, loading && { opacity: 0.6 }]} onPress={submit} disabled={loading}>
          <Text style={styles.btnText}>{loading ? 'در حال ورود...' : 'ورود و مشاهده منو'}</Text>
        </TouchableOpacity>

        <Text style={styles.note}>
          💡 ورود یعنی ثبت‌نام خودکار. اگر روز تولدتان باشد، هنگام پرداخت ۲۰٪ تخفیف می‌گیرید!
          تاریخ تولد را با اعداد فارسی یا انگلیسی بنویسید.
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  container: { flex: 1, padding: 24, justifyContent: 'center' },
  tableBadge: {
    backgroundColor: colors.amberLight, borderRadius: 12, padding: 12, marginBottom: 20,
    borderWidth: 1, borderColor: colors.amber,
  },
  tableBadgeText: { color: colors.amber, fontWeight: 'bold', textAlign: 'center', fontSize: 14 },
  title: { fontSize: 26, fontWeight: 'bold', color: colors.text, textAlign: 'center' },
  subtitle: { fontSize: 14, color: colors.muted, textAlign: 'center', marginTop: 8, marginBottom: 28 },
  input: {
    backgroundColor: colors.card, borderRadius: 12, borderWidth: 1, borderColor: colors.border,
    padding: 14, fontSize: 15, marginBottom: 14, color: colors.text, textAlign: 'right',
  },
  btn: { backgroundColor: colors.green, borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 6 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  note: { marginTop: 20, fontSize: 12, color: colors.muted, textAlign: 'center', lineHeight: 20 },
});
