import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput, Alert } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../App';
import { useApp } from '../../core/store';
import { createOrder } from '../../api';
import { colors } from '../../core/theme';
import { fa } from '../../core/jalali';

type Props = NativeStackScreenProps<RootStackParamList, 'Cart'>;

export default function CartScreen({ navigation }: Props) {
  const { cart, addToCart, removeFromCart, cartTotal, table, user, clearCart } = useApp();
  const [orderType, setOrderType] = useState<'TABLE' | 'TAKEAWAY'>(table ? 'TABLE' : 'TAKEAWAY');
  const [note, setNote] = useState('');
  const [address, setAddress] = useState('');
  const [usePoints, setUsePoints] = useState(false);
  const [loading, setLoading] = useState(false);

  const pay = async () => {
    if (orderType === 'TABLE' && !table) {
      Alert.alert('میز انتخاب نشده', 'لطفاً از صفحه اصلی میز خود را انتخاب کنید');
      navigation.navigate('Tables');
      return;
    }
    if (orderType === 'TAKEAWAY' && !address.trim()) {
      Alert.alert('آدرس لازم است', 'آدرس تحویل سفارش بیرون‌بر را وارد کنید');
      return;
    }
    setLoading(true);
    try {
      const order = await createOrder({
        cafeId: 1,
        tableId: orderType === 'TABLE' ? table!.id : undefined,
        orderType,
        address: orderType === 'TAKEAWAY' ? address.trim() : undefined,
        items: cart.map((i) => ({ menuItemId: i.menuItemId, quantity: i.quantity })),
        note,
      } as any);
      clearCart();
      navigation.replace('Payment', { orderId: order.id });
    } catch (e: any) {
      Alert.alert('خطا', e.message || 'ثبت سفارش ناموفق بود');
      setLoading(false);
    }
  };

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={styles.list}>
        <View style={styles.modeRow}>
          <TouchableOpacity
            style={[styles.modeBtn, orderType === 'TABLE' && styles.modeBtnActive]}
            onPress={() => setOrderType('TABLE')}
          >
            <Text style={[styles.modeText, orderType === 'TABLE' && { color: '#fff' }]}>🪑 سفارش میز</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modeBtn, orderType === 'TAKEAWAY' && styles.modeBtnActive]}
            onPress={() => setOrderType('TAKEAWAY')}
          >
            <Text style={[styles.modeText, orderType === 'TAKEAWAY' && { color: '#fff' }]}>🛵 بیرون‌بر</Text>
          </TouchableOpacity>
        </View>

        {orderType === 'TAKEAWAY' && (
          <TextInput
            style={styles.addressInput}
            placeholder="آدرس تحویل سفارش"
            placeholderTextColor={colors.muted}
            value={address}
            onChangeText={setAddress}
          />
        )}

        {cart.length === 0 ? (
          <Text style={styles.empty}>سبد خرید خالی است</Text>
        ) : (
          cart.map((i) => (
            <View key={i.menuItemId} style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{i.name}</Text>
                <Text style={styles.price}>{fa(i.price)} تومان × {fa(i.quantity)}</Text>
              </View>
              <View style={styles.qtyBox}>
                <TouchableOpacity style={styles.qtyBtn} onPress={() => removeFromCart(i.menuItemId)}>
                  <Text style={styles.qtyBtnText}>−</Text>
                </TouchableOpacity>
                <Text style={styles.qtyNum}>{fa(i.quantity)}</Text>
                <TouchableOpacity style={styles.qtyBtn} onPress={() => addToCart({ menuItemId: i.menuItemId, name: i.name, price: i.price })}>
                  <Text style={styles.qtyBtnText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}

        {user && user.loyaltyPoints > 0 && (
          <TouchableOpacity
            style={[styles.pointsBox, usePoints && { borderColor: colors.green, backgroundColor: colors.greenLight }]}
            onPress={() => setUsePoints(!usePoints)}
          >
            <Text style={styles.pointsText}>
              ⭐ استفاده از {fa(user.loyaltyPoints)} امتیاز (هر امتیاز = ۱۰۰ تومان)
            </Text>
            <Text style={{ color: usePoints ? colors.green : colors.muted, fontSize: 16 }}>{usePoints ? '✓' : ''}</Text>
          </TouchableOpacity>
        )}

        {orderType === 'TABLE' && table && (
          <View style={styles.tableBox}>
            <Text style={styles.tableText}>🪑 میز {fa(table.number)} · {table.section}</Text>
          </View>
        )}

        <TextInput
          style={styles.noteInput}
          placeholder="یادداشت برای گارسون (اختیاری)"
          placeholderTextColor={colors.muted}
          value={note}
          onChangeText={setNote}
          multiline
        />
      </ScrollView>

      <View style={styles.footer}>
        <View>
          <Text style={styles.totalLabel}>مبلغ قابل پرداخت</Text>
          <Text style={styles.total}>{fa(cartTotal)} تومان</Text>
        </View>
        <TouchableOpacity
          style={[styles.payBtn, (loading || cart.length === 0) && { opacity: 0.5 }]}
          onPress={pay}
          disabled={loading || cart.length === 0}
        >
          <Text style={styles.payBtnText}>{loading ? 'در حال ثبت...' : 'ادامه و پرداخت 💳'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  list: { padding: 16, paddingBottom: 120 },
  modeRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  modeBtn: { flex: 1, borderRadius: 12, padding: 12, alignItems: 'center', backgroundColor: colors.card, borderWidth: 1.5, borderColor: colors.border },
  modeBtnActive: { backgroundColor: colors.green, borderColor: colors.green },
  modeText: { fontSize: 14, fontWeight: 'bold', color: colors.text },
  addressInput: { backgroundColor: colors.card, borderRadius: 12, borderWidth: 1, borderColor: colors.border, padding: 12, fontSize: 13, marginBottom: 12, textAlign: 'right', color: colors.text },
  row: {
    backgroundColor: colors.card, borderRadius: 14, padding: 14, marginBottom: 10,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderWidth: 1, borderColor: colors.border,
  },
  name: { fontSize: 15, fontWeight: 'bold', color: colors.text, textAlign: 'right' },
  price: { fontSize: 12, color: colors.muted, marginTop: 4, textAlign: 'right' },
  qtyBox: { alignItems: 'center' },
  qtyBtn: {
    width: 30, height: 30, borderRadius: 15, backgroundColor: colors.greenLight,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.green,
  },
  qtyBtnText: { fontSize: 16, color: colors.green, fontWeight: 'bold', lineHeight: 18 },
  qtyNum: { fontSize: 14, fontWeight: 'bold', color: colors.text, marginVertical: 2 },
  pointsBox: {
    backgroundColor: colors.card, borderRadius: 12, padding: 14, marginBottom: 10,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderWidth: 1.5, borderColor: colors.border,
  },
  pointsText: { fontSize: 13, color: colors.text, flex: 1, textAlign: 'right' },
  tableBox: { backgroundColor: colors.amberLight, borderRadius: 12, padding: 12, marginBottom: 10 },
  tableText: { color: colors.amber, fontWeight: 'bold', textAlign: 'center', fontSize: 14 },
  noteInput: {
    backgroundColor: colors.card, borderRadius: 12, borderWidth: 1, borderColor: colors.border,
    padding: 12, fontSize: 13, minHeight: 60, textAlignVertical: 'top', textAlign: 'right', color: colors.text,
  },
  empty: { textAlign: 'center', color: colors.muted, marginTop: 60, fontSize: 16 },
  footer: {
    position: 'absolute', left: 0, right: 0, bottom: 0,
    backgroundColor: colors.card, borderTopWidth: 1, borderTopColor: colors.border,
    padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  totalLabel: { fontSize: 11, color: colors.muted, textAlign: 'right' },
  total: { fontSize: 18, fontWeight: 'bold', color: colors.text, marginTop: 2, textAlign: 'right' },
  payBtn: { backgroundColor: colors.green, borderRadius: 14, paddingHorizontal: 22, paddingVertical: 14 },
  payBtnText: { color: '#fff', fontSize: 15, fontWeight: 'bold' },
});
