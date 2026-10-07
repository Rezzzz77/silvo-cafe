import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, Platform } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../App';
import { useApp } from '../../core/store';
import { getTables } from '../../api';
import { colors } from '../../core/theme';
import { fa } from '../../core/jalali';

type Props = NativeStackScreenProps<RootStackParamList, 'Scan'>;

// محتوای QR هر میز: SILVO-TABLE-<شماره میز>
export const QR_PATTERN = /SILVO-TABLE-(\d+)/i;

export default function ScannerScreen({ navigation }: Props) {
  const { setTable } = useApp();
  const [permission, requestPermission] = useCameraPermissions();
  const [manual, setManual] = useState('');
  const [handled, setHandled] = useState(false);

  const handleTableNumber = useCallback(
    async (num: number) => {
      if (handled) return;
      setHandled(true);
      try {
        const tables = await getTables(1);
        const t = tables.find((x: any) => x.number === num);
        if (!t) {
          Alert.alert('میز یافت نشد', `میز ${fa(num)} در این کافه وجود ندارد`);
          setHandled(false);
          return;
        }
        if (t.activeOrder) {
          Alert.alert('میز در حال سرویس است', `میز ${fa(num)} سفارش فعال دارد. میز دیگری انتخاب کنید.`);
          setHandled(false);
          return;
        }
        setTable({ id: t.id, number: t.number, section: t.section, capacity: t.capacity });
        navigation.replace('Login');
      } catch {
        setHandled(false);
      }
    },
    [handled, setTable, navigation]
  );

  const onScanned = useCallback(
    ({ data }: { data: string }) => {
      const m = String(data).match(QR_PATTERN);
      if (m) handleTableNumber(Number(m[1]));
    },
    [handleTableNumber]
  );

  const submitManual = () => {
    const n = Number(String(manual).replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d))));
    if (!n || n < 1) return;
    handleTableNumber(n);
  };

  const isWeb = Platform.OS === 'web';

  // وب: دوربین در دسترس نیست → ورود دستی
  if (isWeb) {
    return (
      <View style={styles.root}>
        <TouchableOpacity style={styles.closeBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.closeText}>✕ بستن</Text>
        </TouchableOpacity>
        <View style={styles.manualBox}>
          <Text style={styles.title}>📷 دوربین در نسخه وب فعال نیست</Text>
          <Text style={styles.subtitle}>شماره میز را دستی وارد کنید:</Text>
          <TextInput
            style={styles.input}
            placeholder="شماره میز (مثلاً ۵)"
            placeholderTextColor={colors.muted}
            keyboardType="number-pad"
            value={manual}
            onChangeText={setManual}
          />
          <TouchableOpacity style={styles.btn} onPress={submitManual}>
            <Text style={styles.btnText}>ورود به میز</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (!permission) {
    return (
      <View style={styles.root}>
        <Text style={styles.loading}>در حال بررسی دسترسی دوربین...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.root}>
        <Text style={styles.title}>برای اسکن QR به دسترسی دوربین نیاز است</Text>
        <TouchableOpacity style={styles.btn} onPress={requestPermission}>
          <Text style={styles.btnText}>دادن دسترسی دوربین</Text>
        </TouchableOpacity>
        <View style={styles.manualBox}>
          <TextInput
            style={styles.input}
            placeholder="یا شماره میز را دستی وارد کنید"
            placeholderTextColor={colors.muted}
            keyboardType="number-pad"
            value={manual}
            onChangeText={setManual}
          />
          <TouchableOpacity style={styles.btn} onPress={submitManual}>
            <Text style={styles.btnText}>ورود به میز</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.closeBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.closeText}>✕ بازگشت</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        onBarcodeScanned={handled ? undefined : onScanned}
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
      />
      <View style={styles.overlay}>
        <View style={styles.frame}>
          <View style={[styles.corner, styles.cornerTL]} />
          <View style={[styles.corner, styles.cornerTR]} />
          <View style={[styles.corner, styles.cornerBL]} />
          <View style={[styles.corner, styles.cornerBR]} />
        </View>
        <Text style={styles.hint}>QR روی میز را داخل کادر بگیرید</Text>
        {handled && <Text style={styles.working}>در حال اتصال به میز...</Text>}
        <TouchableOpacity style={styles.closeBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.closeText}>✕ بستن</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  loading: { color: '#fff', textAlign: 'center', marginTop: 100, fontSize: 15 },
  title: { color: '#fff', fontSize: 18, fontWeight: 'bold', textAlign: 'center', marginTop: 80, marginBottom: 16 },
  subtitle: { color: '#d6d3d1', fontSize: 14, textAlign: 'center', marginBottom: 12 },
  overlay: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  frame: { width: 240, height: 240 },
  corner: { position: 'absolute', width: 40, height: 40, borderColor: '#4ade80', borderWidth: 4 },
  cornerTL: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0, borderTopLeftRadius: 12 },
  cornerTR: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0, borderTopRightRadius: 12 },
  cornerBL: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0, borderBottomLeftRadius: 12 },
  cornerBR: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0, borderBottomRightRadius: 12 },
  hint: { color: '#fff', fontSize: 14, marginTop: 24, textAlign: 'center' },
  working: { color: '#4ade80', fontSize: 14, marginTop: 10, fontWeight: 'bold' },
  closeBtn: {
    position: 'absolute', top: 50, right: 20,
    backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8,
  },
  closeText: { color: '#fff', fontWeight: 'bold' },
  manualBox: { paddingHorizontal: 30, width: '100%', marginTop: 20 },
  input: {
    backgroundColor: '#fff', borderRadius: 12, padding: 14, fontSize: 15, marginBottom: 14,
    textAlign: 'center', color: colors.text,
  },
  btn: { backgroundColor: colors.green, borderRadius: 12, padding: 14, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
});
