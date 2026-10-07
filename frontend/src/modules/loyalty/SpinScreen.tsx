import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Animated, Easing } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../App';
import { useApp } from '../../core/store';
import { spinWheel } from '../../api';
import { colors } from '../../core/theme';
import { fa } from '../../core/jalali';

type Props = NativeStackScreenProps<RootStackParamList, 'Spin'>;

const SEGMENTS = [
  { label: '۵۰۰ امتیاز', color: '#16a34a' },
  { label: 'کوپن ۱۰٪', color: '#ca8a04' },
  { label: '۱۰۰۰ امتیاز', color: '#2563eb' },
  { label: 'کوپن ۲۰٪', color: '#dc2626' },
  { label: '۵۰۰ امتیاز', color: '#16a34a' },
  { label: 'کوپن ۵۰٪', color: '#9333ea' },
];

export default function SpinScreen({ navigation }: Props) {
  const { user } = useApp();
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const rotation = useRef(new Animated.Value(0)).current;
  const totalDeg = useRef(0);

  const animateWheel = (): Promise<void> =>
    new Promise((resolve) => {
      const target = totalDeg.current + 1440 + Math.floor(Math.random() * 360); // ۴+ دور کامل + توقف تصادفی
      totalDeg.current = target;
      Animated.timing(rotation, {
        toValue: target,
        duration: 2600,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start(() => resolve());
    });

  const spin = async () => {
    if (!user) {
      Alert.alert('ورود لازم است', 'برای استفاده از چرخ شانس ابتدا وارد شوید');
      return;
    }
    setSpinning(true);
    setResult(null);
    setError(null);
    try {
      const res = await spinWheel(user.id);
      await animateWheel();
      setResult(`🎉 ${res.label}${res.rewardType === 'POINTS' ? ' به حساب امتیاز شما اضافه شد' : ' برای سفارش بعدی شما'}`);
    } catch (e: any) {
      setError(e.message || 'خطا');
    } finally {
      setSpinning(false);
    }
  };

  const rotate = rotation.interpolate({ inputRange: [0, 36000], outputRange: ['0deg', '36000deg'] });

  return (
    <View style={styles.root}>
      <Text style={styles.title}>🎡 چرخ شانس روزانه</Text>
      <Text style={styles.subtitle}>هر روز یک بار شانس خود را امتحان کنید</Text>

      <View style={styles.wheelArea}>
        <View style={styles.pointer}>
          <Text style={styles.pointerText}>▼</Text>
        </View>
        <Animated.View style={[styles.wheel, { transform: [{ rotate }] }]}>
          <Text style={styles.wheelCenter}>🎁</Text>
          <View style={styles.segments}>
            {SEGMENTS.map((s, i) => (
              <View key={i} style={[styles.segment, { backgroundColor: s.color, transform: [{ rotate: `${i * 60}deg` }] }]}>
                <Text style={styles.segmentText}>{s.label}</Text>
              </View>
            ))}
          </View>
        </Animated.View>
      </View>

      {result && (
        <View style={styles.resultBox}>
          <Text style={styles.resultText}>{result}</Text>
        </View>
      )}
      {error && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <TouchableOpacity style={[styles.btn, spinning && { opacity: 0.5 }]} onPress={spin} disabled={spinning}>
        <Text style={styles.btnText}>{spinning ? 'در حال چرخش...' : 'چرخاندن!'}</Text>
      </TouchableOpacity>

      {user && (
        <Text style={styles.points}>⭐ موجودی امتیاز شما: {fa(user.loyaltyPoints)}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg, padding: 20, alignItems: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', color: colors.text, marginTop: 20 },
  subtitle: { fontSize: 13, color: colors.muted, marginTop: 8, marginBottom: 24 },
  wheelArea: { alignItems: 'center', marginBottom: 24 },
  pointer: { zIndex: 3, marginBottom: -8 },
  pointerText: { fontSize: 22, color: colors.red, fontWeight: 'bold' },
  wheel: { width: 240, height: 240 },
  wheelCenter: {
    position: 'absolute', top: 95, left: 95, fontSize: 40, zIndex: 2,
  },
  segments: { flex: 1 },
  segment: {
    position: 'absolute', top: 0, left: 118, width: 4, height: 120,
    alignItems: 'center', justifyContent: 'flex-start',
  },
  segmentText: { fontSize: 9, color: '#fff', fontWeight: 'bold', width: 60, textAlign: 'center' },
  resultBox: {
    backgroundColor: colors.greenLight, borderRadius: 14, padding: 16, marginBottom: 16,
    borderWidth: 1, borderColor: colors.green,
  },
  resultText: { color: colors.greenDark, fontWeight: 'bold', fontSize: 14, textAlign: 'center' },
  errorBox: { backgroundColor: colors.amberLight, borderRadius: 14, padding: 14, marginBottom: 16 },
  errorText: { color: colors.amber, fontWeight: 'bold', fontSize: 13, textAlign: 'center' },
  btn: { backgroundColor: colors.green, borderRadius: 16, paddingHorizontal: 40, paddingVertical: 16 },
  btnText: { color: '#fff', fontSize: 17, fontWeight: 'bold' },
  points: { marginTop: 20, fontSize: 14, color: colors.amber, fontWeight: 'bold' },
});
