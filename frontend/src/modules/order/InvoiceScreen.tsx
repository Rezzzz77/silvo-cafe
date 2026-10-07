import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Platform } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../App';
import { getOrder } from '../../api';
import { colors } from '../../core/theme';
import { fa, jalaliToday, formatJalali } from '../../core/jalali';

type Props = NativeStackScreenProps<RootStackParamList, 'Invoice'>;

export default function InvoiceScreen({ route, navigation }: Props) {
  const { orderId } = route.params;
  const [order, setOrder] = useState<any>(null);

  useEffect(() => {
    getOrder(orderId).then(setOrder).catch(() => {});
  }, [orderId]);

  const print = () => {
    if (Platform.OS === 'web') {
      // چاپ در مرورگر
      (globalThis as any).window?.print?.();
    } else {
      Alert.alert(
        '🖨️ چاپ فاکتور',
        'فاکتور از طریق پرینتر متصل (بلوتوث/شبکه) چاپ می‌شود.\nدر دمو: چاپ صندوق و آشپزخانه شبیه‌سازی شد.'
      );
    }
  };

  if (!order) {
    return <View style={styles.center}><Text style={styles.muted}>در حال آماده‌سازی فاکتور...</Text></View>;
  }

  const today = jalaliToday();

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.paper}>
          <Text style={styles.cafeName}>☕ کافه سیلو پلازا</Text>
          <Text style={styles.cafeAddr}>طرقبه مشهد — بلوار امام رضا، مجتمع پلازا</Text>
          <Text style={styles.date}>{formatJalali(today)}</Text>

          <View style={styles.divider} />

          <Text style={styles.invoiceTitle}>فاکتور فروش #{fa(order.id)}</Text>
          <Text style={styles.meta}>
            {order.orderType === 'TAKEAWAY' ? '🛵 سفارش بیرون‌بر' : `🪑 میز ${fa(order.tableNumber)}`} · {order.customerName}
          </Text>

          <View style={styles.divider} />

          {order.items.map((it: any, i: number) => (
            <View key={i} style={styles.itemRow}>
              <Text style={styles.itemName}>{it.name} × {fa(it.quantity)}</Text>
              <Text style={styles.itemPrice}>{fa(it.price * it.quantity)}</Text>
            </View>
          ))}

          <View style={styles.divider} />
          <View style={styles.itemRow}>
            <Text style={styles.totalLabel}>جمع کل</Text>
            <Text style={styles.totalValue}>{fa(order.totalAmount)} تومان</Text>
          </View>
          {order.discount ? (
            <View style={styles.itemRow}>
              <Text style={styles.discountLabel}>تخفیف {order.birthdayApplied ? '(تولد 🎂)' : ''}</Text>
              <Text style={styles.discountValue}>−{fa(order.discount)}</Text>
            </View>
          ) : null}
          {order.finalAmount !== undefined && (
            <View style={styles.itemRow}>
              <Text style={styles.finalLabel}>مبلغ پرداخت‌شده</Text>
              <Text style={styles.finalValue}>{fa(order.finalAmount)} تومان</Text>
            </View>
          )}

          <View style={styles.divider} />
          <Text style={styles.payMethod}>
            روش پرداخت: {order.paymentMethod === 'CARD_READER' ? '📟 کارتخوان' : '💳 درگاه آنلاین'}
          </Text>
          {order.prints && (
            <View style={styles.printRow}>
              <Text style={styles.printBadge}>🧾 چاپ صندوق ✓</Text>
              <Text style={styles.printBadge}>👨‍🍳 چاپ آشپزخانه ✓</Text>
            </View>
          )}

          <Text style={styles.thanks}>با تشکر از شما — منتظر دیدار دوباره‌تان هستیم 🌿</Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.printBtn} onPress={print}>
          <Text style={styles.printBtnText}>🖨️ چاپ فاکتور</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.popToTop()}>
          <Text style={styles.backBtnText}>بازگشت</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#e7e5e4' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#e7e5e4' },
  muted: { color: colors.muted },
  container: { padding: 16, paddingBottom: 100 },
  paper: {
    backgroundColor: '#fff', borderRadius: 8, padding: 20,
    borderWidth: 1, borderColor: '#d6d3d1',
    // سبک فاکتور
  },
  cafeName: { fontSize: 20, fontWeight: 'bold', color: colors.greenDark, textAlign: 'center' },
  cafeAddr: { fontSize: 11, color: colors.muted, textAlign: 'center', marginTop: 4 },
  date: { fontSize: 11, color: colors.muted, textAlign: 'center', marginTop: 8 },
  divider: { borderTopWidth: 1, borderTopColor: '#d6d3d1', borderStyle: 'dashed', marginVertical: 12 },
  invoiceTitle: { fontSize: 15, fontWeight: 'bold', color: colors.text, textAlign: 'right' },
  meta: { fontSize: 12, color: colors.muted, marginTop: 6, textAlign: 'right' },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  itemName: { fontSize: 13, color: colors.text, textAlign: 'right', flex: 1 },
  itemPrice: { fontSize: 13, color: colors.text },
  totalLabel: { fontSize: 14, fontWeight: 'bold', color: colors.text },
  totalValue: { fontSize: 14, fontWeight: 'bold', color: colors.text },
  discountLabel: { fontSize: 13, color: colors.green },
  discountValue: { fontSize: 13, fontWeight: 'bold', color: colors.green },
  finalLabel: { fontSize: 14, fontWeight: 'bold', color: colors.greenDark },
  finalValue: { fontSize: 14, fontWeight: 'bold', color: colors.greenDark },
  payMethod: { fontSize: 12, color: colors.muted, textAlign: 'right', marginTop: 4 },
  printRow: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 12 },
  printBadge: { fontSize: 11, color: colors.greenDark, backgroundColor: colors.greenLight, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5, fontWeight: 'bold' },
  thanks: { fontSize: 12, color: colors.muted, textAlign: 'center', marginTop: 16 },
  footer: { position: 'absolute', left: 0, right: 0, bottom: 0, flexDirection: 'row', gap: 10, padding: 14, backgroundColor: colors.card, borderTopWidth: 1, borderTopColor: colors.border },
  printBtn: { flex: 2, backgroundColor: colors.green, borderRadius: 12, padding: 14, alignItems: 'center' },
  printBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  backBtn: { flex: 1, backgroundColor: colors.card, borderRadius: 12, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: colors.border },
  backBtnText: { color: colors.text, fontWeight: 'bold', fontSize: 14 },
});
