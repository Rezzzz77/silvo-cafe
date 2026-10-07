import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, Platform, Linking } from 'react-native';
import { WebView } from 'react-native-webview';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../App';
import { getOrder, payOrderWithCard, paymentRequest, paymentVerify } from '../../api';
import { colors } from '../../core/theme';
import { fa } from '../../core/jalali';

type Props = NativeStackScreenProps<RootStackParamList, 'Payment'>;

const CALLBACK_PREFIX = 'http://127.0.0.1:4000/api/payment/callback';

export default function PaymentScreen({ route, navigation }: Props) {
  const { orderId } = route.params;
  const [order, setOrder] = useState<any>(null);
  const [method, setMethod] = useState<'GATEWAY' | 'CARD'>('GATEWAY');
  const [gatewayUrl, setGatewayUrl] = useState<string | null>(null);
  const [authority, setAuthority] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [waitingVerify, setWaitingVerify] = useState(false);
  const busy = useRef(false);

  useEffect(() => {
    getOrder(orderId).then(setOrder).catch(() => {});
  }, [orderId]);

  // شروع پرداخت با درگاه: گرفتن authority از سرور
  const startGateway = async () => {
    setProcessing(true);
    try {
      const res = await paymentRequest(orderId);
      setAuthority(res.authority);
      setGatewayUrl(res.paymentUrl);
      setWaitingVerify(true);
    } catch (e: any) {
      Alert.alert('خطا', e.message || 'اتصال به درگاه ناموفق');
    } finally {
      setProcessing(false);
    }
  };

  // تایید نهایی در سرور
  const verify = useCallback(async () => {
    if (!authority || busy.current) return;
    busy.current = true;
    setProcessing(true);
    try {
      const res = await paymentVerify(orderId, authority);
      if (res.success) {
        setGatewayUrl(null);
        setWaitingVerify(false);
        navigation.replace('OrderStatus', { orderId });
      }
    } catch (e: any) {
      Alert.alert('تایید ناموفق', e.message || 'پرداخت تایید نشد. دوباره تلاش کنید');
      setGatewayUrl(null);
      setWaitingVerify(false);
    } finally {
      busy.current = false;
      setProcessing(false);
    }
  }, [authority, orderId, navigation]);

  // کارتخوان (شبیه‌سازی)
  const payCard = async () => {
    setProcessing(true);
    try {
      await payOrderWithCard(orderId);
      navigation.replace('OrderStatus', { orderId });
    } catch (e: any) {
      Alert.alert('خطا', e.message || 'پرداخت ناموفق بود');
      setProcessing(false);
    }
  };

  // روی وب: درگاه در تب جدید باز می‌شود
  const openGatewayWeb = () => {
    if (gatewayUrl && Platform.OS === 'web') {
      (globalThis as any).window?.open?.(gatewayUrl, '_blank');
    }
  };

  // حالت WebView درگاه
  if (gatewayUrl && waitingVerify) {
    // اندروید/آی‌اواس: WebView داخلی + تشخیص بازگشت به callback
    if (Platform.OS !== 'web') {
      return (
        <View style={styles.root}>
          <View style={styles.gatewayBar}>
            <Text style={styles.gatewayBarText}>🔒 درگاه پرداخت امن</Text>
            <TouchableOpacity onPress={() => { setGatewayUrl(null); setWaitingVerify(false); }}>
              <Text style={styles.gatewayCancel}>انصراف</Text>
            </TouchableOpacity>
          </View>
          <WebView
            source={{ uri: gatewayUrl }}
            style={{ flex: 1 }}
            startInLoadingState
            renderLoading={() => <ActivityIndicator size="large" color={colors.green} />}
            onNavigationStateChange={(state) => {
              if (state.url && state.url.startsWith(CALLBACK_PREFIX)) {
                // رسیدن به callback یعنی کاربر پرداخت را تمام کرده — verify کن
                if (state.url.includes('Status=OK')) {
                  verify();
                } else {
                  Alert.alert('پرداخت ناموفق', 'شما پرداخت را لغو کردید');
                  setGatewayUrl(null);
                  setWaitingVerify(false);
                }
              }
            }}
          />
        </View>
      );
    }

    // وب: تب جدید + دکمه «پرداخت را انجام دادم»
    return (
      <View style={styles.root}>
        <View style={styles.webWaitCard}>
          <Text style={styles.webWaitTitle}>🌐 درگاه پرداخت در تب جدید باز شد</Text>
          <Text style={styles.webWaitText}>
            اگر تب جدید باز نشد، روی لینک زیر بزنید:
          </Text>
          <TouchableOpacity onPress={openGatewayWeb}>
            <Text style={styles.webLink}>{gatewayUrl}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.payBtn, { marginTop: 20 }]} onPress={verify} disabled={processing}>
            {processing ? <ActivityIndicator color="#fff" /> : <Text style={styles.payBtnText}>پرداخت را انجام دادم — تایید نهایی ✓</Text>}
          </TouchableOpacity>
          <TouchableOpacity style={{ marginTop: 12 }} onPress={() => { setGatewayUrl(null); setWaitingVerify(false); }}>
            <Text style={styles.webCancel}>انصراف</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (!order) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.green} />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <View style={styles.amountCard}>
        <Text style={styles.amountLabel}>مبلغ قابل پرداخت</Text>
        <Text style={styles.amount}>{fa(order.totalAmount)} تومان</Text>
        <Text style={styles.orderInfo}>سفارش #{fa(order.id)} {order.tableNumber ? `· میز ${fa(order.tableNumber)}` : '· بیرون‌بر'}</Text>
      </View>

      <View style={styles.methodRow}>
        <TouchableOpacity
          style={[styles.methodBtn, method === 'GATEWAY' && styles.methodBtnActive]}
          onPress={() => setMethod('GATEWAY')}
        >
          <Text style={[styles.methodText, method === 'GATEWAY' && { color: '#fff' }]}>💳 درگاه پرداخت</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.methodBtn, method === 'CARD' && styles.methodBtnActive]}
          onPress={() => setMethod('CARD')}
        >
          <Text style={[styles.methodText, method === 'CARD' && { color: '#fff' }]}>📟 کارتخوان</Text>
        </TouchableOpacity>
      </View>

      {method === 'GATEWAY' ? (
        <View style={styles.gatewayInfo}>
          <Text style={styles.gatewayTitle}>🔒 پرداخت امن با درگاه بانکی</Text>
          <Text style={styles.gatewayDesc}>
            شما به درگاه پرداخت (زرین‌پال) منتقل می‌شوید و پس از پرداخت، خودکار به اپ برمی‌گردید.{'\n'}
            {Platform.OS === 'web' ? 'در نسخه وب، درگاه در تب جدید باز می‌شود.' : ''}
          </Text>
        </View>
      ) : (
        <View style={styles.gatewayInfo}>
          <Text style={styles.gatewayTitle}>📟 اتصال به کارتخوان</Text>
          <Text style={styles.gatewayDesc}>
            کارت خود را روی دستگاه کارتخوان بکشید.{'\n'}دستگاه متصل: PAX-A920 (بلوتوث ✓)
          </Text>
        </View>
      )}

      <TouchableOpacity
        style={[styles.payBtn, processing && { opacity: 0.5 }]}
        onPress={method === 'GATEWAY' ? startGateway : payCard}
        disabled={processing}
      >
        {processing ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.payBtnText}>
            {method === 'GATEWAY' ? `انتقال به درگاه پرداخت` : 'شروع پرداخت با کارتخوان'}
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg, padding: 18 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
  amountCard: { backgroundColor: colors.card, borderRadius: 16, padding: 18, alignItems: 'center', borderWidth: 1, borderColor: colors.border },
  amountLabel: { fontSize: 13, color: colors.muted },
  amount: { fontSize: 28, fontWeight: 'bold', color: colors.text, marginTop: 6 },
  orderInfo: { fontSize: 12, color: colors.muted, marginTop: 6 },
  methodRow: { flexDirection: 'row', gap: 10, marginTop: 16 },
  methodBtn: { flex: 1, borderRadius: 12, padding: 14, alignItems: 'center', backgroundColor: colors.card, borderWidth: 1.5, borderColor: colors.border },
  methodBtnActive: { backgroundColor: colors.green, borderColor: colors.green },
  methodText: { fontSize: 14, fontWeight: 'bold', color: colors.text },
  gatewayInfo: { backgroundColor: colors.card, borderRadius: 16, padding: 16, marginTop: 14, borderWidth: 1, borderColor: colors.border },
  gatewayTitle: { fontSize: 14, fontWeight: 'bold', color: colors.greenDark, textAlign: 'center', marginBottom: 8 },
  gatewayDesc: { fontSize: 13, color: colors.muted, textAlign: 'center', lineHeight: 22 },
  payBtn: { backgroundColor: colors.green, borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 16 },
  payBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  gatewayBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: colors.green, padding: 12, borderRadius: 10 },
  gatewayBarText: { color: '#fff', fontWeight: 'bold', fontSize: 13 },
  gatewayCancel: { color: '#dcfce7', fontWeight: 'bold', fontSize: 13 },
  webWaitCard: { backgroundColor: colors.card, borderRadius: 16, padding: 20, marginTop: 20, borderWidth: 1, borderColor: colors.border },
  webWaitTitle: { fontSize: 15, fontWeight: 'bold', color: colors.text, textAlign: 'center' },
  webWaitText: { fontSize: 12, color: colors.muted, textAlign: 'center', marginTop: 8 },
  webLink: { fontSize: 11, color: colors.blue, textAlign: 'center', marginTop: 8, textDecorationLine: 'underline' },
  webCancel: { color: colors.muted, textAlign: 'center', fontWeight: 'bold', fontSize: 13 },
});
