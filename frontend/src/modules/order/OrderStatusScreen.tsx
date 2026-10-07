import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput, Alert } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../App';
import { getOrder, submitSurvey, callWaiter } from '../../api';
import { useApp } from '../../core/store';
import { colors } from '../../core/theme';
import { fa } from '../../core/jalali';

type Props = NativeStackScreenProps<RootStackParamList, 'OrderStatus'>;

const STEPS = [
  { key: 'PENDING', label: 'ثبت شد', icon: '📝' },
  { key: 'CONFIRMED', label: 'تایید شد', icon: '✅' },
  { key: 'PREPARING', label: 'در حال آماده‌سازی', icon: '👨‍🍳' },
  { key: 'SERVED', label: 'سرو شد', icon: '🍽️' },
];

type Order = {
  id: number; tableNumber: number | null; tableId: number | null; status: string; paymentStatus: string;
  totalAmount: number; finalAmount?: number; discount?: number;
  birthdayApplied?: boolean; pointsUsed?: number; survey?: any; prints?: any;
  items: { name: string; quantity: number; price: number }[];
};

export default function OrderStatusScreen({ route, navigation }: Props) {
  const { orderId } = route.params;
  const { table } = useApp();
  const [order, setOrder] = useState<Order | null>(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [surveySent, setSurveySent] = useState(false);

  const load = useCallback(async () => {
    try {
      const o = await getOrder(orderId);
      setOrder(o);
    } catch { /* ignore */ }
  }, [orderId]);

  useEffect(() => {
    load();
    const t = setInterval(load, 3000);
    return () => clearInterval(t);
  }, [load]);

  if (!order) {
    return (
      <View style={styles.center}>
        <Text style={styles.loading}>در حال دریافت سفارش...</Text>
      </View>
    );
  }

  const currentIdx = STEPS.findIndex((s) => s.key === order.status);
  const done = order.status === 'COMPLETED';
  const showSurvey = done && order.paymentStatus === 'PAID' && !order.survey && !surveySent;
  const tId = order.tableId || (table as any)?.id || 0;

  const sendSurvey = async () => {
    if (!rating) { Alert.alert('امتیاز بدهید', 'لطفاً بین ۱ تا ۵ ستاره انتخاب کنید'); return; }
    try {
      await submitSurvey(orderId, rating, comment);
      setSurveySent(true);
    } catch { /* ignore */ }
  };

  const callTheWaiter = async () => {
    try {
      const res = await callWaiter(tId);
      Alert.alert('🛎️', res.message || 'گارسون خبردار شد');
    } catch (e: any) {
      Alert.alert('خطا', e.message || 'ناموفق');
    }
  };

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.container}>
      <View style={styles.card}>
        <Text style={styles.orderNum}>
          سفارش شماره {fa(order.id)} — {order.tableNumber ? `میز ${fa(order.tableNumber)}` : 'بیرون‌بر'}
        </Text>

        {order.birthdayApplied && (
          <View style={styles.birthdayBox}>
            <Text style={styles.birthdayText}>🎂 تولدتان مبارک! ۲۰٪ تخفیف تولد اعمال شد</Text>
          </View>
        )}

        <View style={styles.steps}>
          {STEPS.map((s, i) => (
            <View key={s.key} style={styles.stepRow}>
              <View style={[styles.stepDot, i <= currentIdx && currentIdx >= 0 ? styles.stepDotDone : {}]}>
                <Text style={styles.stepIcon}>{s.icon}</Text>
              </View>
              <Text style={[styles.stepLabel, i <= currentIdx && currentIdx >= 0 && styles.stepLabelDone]}>{s.label}</Text>
            </View>
          ))}
        </View>

        <View style={styles.divider} />

        {order.items.map((it, idx) => (
          <View key={idx} style={styles.itemRow}>
            <Text style={styles.itemName}>{it.name} × {fa(it.quantity)}</Text>
            <Text style={styles.itemPrice}>{fa(it.price * it.quantity)}</Text>
          </View>
        ))}

        <View style={styles.divider} />
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>مبلغ کل</Text>
          <Text style={styles.totalValue}>{fa(order.totalAmount)} تومان</Text>
        </View>
        {order.discount ? (
          <View style={styles.totalRow}>
            <Text style={styles.discountLabel}>تخفیف</Text>
            <Text style={styles.discountValue}>−{fa(order.discount)} تومان</Text>
          </View>
        ) : null}
        {order.finalAmount !== undefined && (
          <View style={styles.totalRow}>
            <Text style={styles.finalLabel}>پرداخت‌شده</Text>
            <Text style={styles.finalValue}>{fa(order.finalAmount)} تومان</Text>
          </View>
        )}
        <View style={[styles.paidBadge, order.paymentStatus === 'PAID' ? styles.paidOk : styles.paidNo]}>
          <Text style={styles.paidText}>
            {order.paymentStatus === 'PAID' ? '✓ پرداخت موفق' : 'در انتظار پرداخت'}
          </Text>
        </View>

        {order.prints && (
          <View style={styles.printRow}>
            <Text style={styles.printBadge}>🧾 چاپ صندوق ✓</Text>
            <Text style={styles.printBadge}>👨‍🍳 چاپ آشپزخانه ✓</Text>
          </View>
        )}
      </View>

      {tId > 0 && !done && (
        <TouchableOpacity style={styles.waiterBtn} onPress={callTheWaiter}>
          <Text style={styles.waiterBtnText}>🛎️ صدا زدن گارسون</Text>
        </TouchableOpacity>
      )}

      {showSurvey && (
        <View style={styles.surveyCard}>
          <Text style={styles.surveyTitle}>⭐ نظرتان درباره تجربه امروز چیست؟</Text>
          <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map((n) => (
              <TouchableOpacity key={n} onPress={() => setRating(n)}>
                <Text style={[styles.star, rating >= n && styles.starOn]}>{rating >= n ? '⭐' : '☆'}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TextInput
            style={styles.surveyInput}
            placeholder="نظر خود را بنویسید (اختیاری)"
            placeholderTextColor={colors.muted}
            value={comment}
            onChangeText={setComment}
            multiline
          />
          <TouchableOpacity style={styles.surveyBtn} onPress={sendSurvey}>
            <Text style={styles.surveyBtnText}>ثبت نظر</Text>
          </TouchableOpacity>
        </View>
      )}

      {surveySent && (
        <View style={styles.surveyThanks}>
          <Text style={styles.surveyThanksText}>💚 ممنون از نظرتان!</Text>
        </View>
      )}

      {done && order.paymentStatus === 'PAID' && (
        <TouchableOpacity
          style={[styles.invoiceBtn, { backgroundColor: colors.blue }]}
          onPress={() => navigation.navigate('Invoice', { orderId })}
        >
          <Text style={styles.homeBtnText}>🧾 مشاهده و چاپ فاکتور</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity style={styles.homeBtn} onPress={() => navigation.popToTop()}>
        <Text style={styles.homeBtnText}>بازگشت به صفحه اصلی</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  container: { padding: 16 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
  loading: { color: colors.muted, fontSize: 15 },
  card: { backgroundColor: colors.card, borderRadius: 16, padding: 18, borderWidth: 1, borderColor: colors.border },
  orderNum: { fontSize: 16, fontWeight: 'bold', color: colors.greenDark, textAlign: 'center', marginBottom: 14 },
  birthdayBox: {
    backgroundColor: '#fef9c3', borderRadius: 12, padding: 12, marginBottom: 14,
    borderWidth: 1, borderColor: '#facc15',
  },
  birthdayText: { color: '#854d0e', fontWeight: 'bold', textAlign: 'center', fontSize: 14 },
  steps: { marginBottom: 4 },
  stepRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  stepDot: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  stepDotDone: { backgroundColor: colors.greenLight, borderWidth: 2, borderColor: colors.green },
  stepIcon: { fontSize: 18 },
  stepLabel: { fontSize: 14, color: colors.muted, marginLeft: 12 },
  stepLabelDone: { color: colors.greenDark, fontWeight: 'bold' },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: 10 },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  itemName: { fontSize: 13, color: colors.text, textAlign: 'right', flex: 1 },
  itemPrice: { fontSize: 13, color: colors.muted },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  totalLabel: { fontSize: 14, color: colors.text },
  totalValue: { fontSize: 14, fontWeight: 'bold', color: colors.text },
  discountLabel: { fontSize: 13, color: colors.green },
  discountValue: { fontSize: 13, fontWeight: 'bold', color: colors.green },
  finalLabel: { fontSize: 14, fontWeight: 'bold', color: colors.text },
  finalValue: { fontSize: 14, fontWeight: 'bold', color: colors.greenDark },
  paidBadge: { borderRadius: 12, padding: 12, marginTop: 12 },
  paidOk: { backgroundColor: colors.greenLight },
  paidNo: { backgroundColor: colors.amberLight },
  paidText: { textAlign: 'center', fontWeight: 'bold', fontSize: 14, color: colors.greenDark },
  printRow: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 10 },
  printBadge: { fontSize: 11, color: colors.greenDark, backgroundColor: colors.greenLight, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5, fontWeight: 'bold' },
  waiterBtn: { marginTop: 14, backgroundColor: colors.amber, borderRadius: 14, padding: 14, alignItems: 'center' },
  waiterBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  surveyCard: { marginTop: 16, backgroundColor: colors.card, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: colors.border },
  surveyTitle: { fontSize: 14, fontWeight: 'bold', color: colors.text, textAlign: 'center' },
  starsRow: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginTop: 10 },
  star: { fontSize: 30, color: '#d6d3d1' },
  starOn: { color: '#f59e0b' },
  surveyInput: { backgroundColor: colors.bg, borderRadius: 10, borderWidth: 1, borderColor: colors.border, padding: 10, fontSize: 13, minHeight: 60, textAlignVertical: 'top', textAlign: 'right', color: colors.text, marginTop: 10 },
  surveyBtn: { backgroundColor: colors.green, borderRadius: 10, padding: 12, alignItems: 'center', marginTop: 10 },
  surveyBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 13 },
  surveyThanks: { marginTop: 14, backgroundColor: colors.greenLight, borderRadius: 12, padding: 12, alignItems: 'center' },
  surveyThanksText: { color: colors.greenDark, fontWeight: 'bold', fontSize: 13 },
  invoiceBtn: { marginTop: 14, borderRadius: 14, padding: 16, alignItems: 'center' },
  homeBtn: { marginTop: 14, backgroundColor: colors.green, borderRadius: 14, padding: 16, alignItems: 'center' },
  homeBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
});
