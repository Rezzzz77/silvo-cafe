import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../App';
import { getPlans } from '../../api';
import { colors } from '../../core/theme';
import { fa } from '../../core/jalali';

type Props = NativeStackScreenProps<RootStackParamList, 'Plans'>;

type Plan = {
  id: string; name: string; emoji: string; color: string;
  price: number; tagline: string; popular: boolean; features: string[];
};

export default function PlansScreen({ navigation }: Props) {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPlans()
      .then(setPlans)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.green} />
      </View>
    );
  }

  const buy = (p: Plan) => {
    Alert.alert(
      `پلن ${p.name} — ${fa(p.price)} تومان`,
      'برای فعال‌سازی و عقد قرارداد، با کارشناس فروش ما تماس بگیرید:\n۰۹۱۵-۱۱۱-۲۲۳۳',
      [{ text: 'باشه', style: 'cancel' }]
    );
  };

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.container}>
      <Text style={styles.title}>پلن‌ها و تعرفه‌ها</Text>
      <Text style={styles.subtitle}>
        مناسب برای کافه‌ها، رستوران‌ها و فودکورت‌ها — پرداخت یک‌باره، یکسال پشتیبانی و آپدیت رایگان
      </Text>

      {plans.map((p) => (
        <View
          key={p.id}
          style={[styles.card, p.popular && { borderColor: colors.blue, borderWidth: 2 }]}
        >
          {p.popular && (
            <View style={styles.popularBadge}>
              <Text style={styles.popularText}>⭐ پیشنهاد ویژه</Text>
            </View>
          )}

          <View style={styles.planHeader}>
            <Text style={styles.planEmoji}>{p.emoji}</Text>
            <View style={{ flex: 1 }}>
              <Text style={[styles.planName, { color: p.color }]}>پلن {p.name}</Text>
              <Text style={styles.planTag}>{p.tagline}</Text>
            </View>
          </View>

          <Text style={styles.price}>
            {fa(p.price)} <Text style={styles.priceUnit}>تومان</Text>
          </Text>

          <View style={styles.features}>
            {p.features.map((f, i) => (
              <View key={i} style={styles.featureRow}>
                <Text style={[styles.check, { color: p.color }]}>✓</Text>
                <Text style={styles.featureText}>{f}</Text>
              </View>
            ))}
          </View>

          <TouchableOpacity
            style={[styles.buyBtn, { backgroundColor: p.color }]}
            onPress={() => buy(p)}
          >
            <Text style={styles.buyText}>درخواست فعال‌سازی</Text>
          </TouchableOpacity>
        </View>
      ))}

      <Text style={styles.footer}>
        💬 تمامی پلن‌ها شامل راه‌اندازی، آموزش پرسنل و نصب روی یک شعبه است.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  container: { padding: 16, paddingBottom: 40 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
  title: { fontSize: 22, fontWeight: 'bold', color: colors.text, textAlign: 'center' },
  subtitle: { fontSize: 13, color: colors.muted, textAlign: 'center', marginTop: 8, marginBottom: 20, lineHeight: 22 },
  card: {
    backgroundColor: colors.card, borderRadius: 18, padding: 18, marginBottom: 16,
    borderWidth: 1, borderColor: colors.border,
  },
  popularBadge: {
    position: 'absolute', top: -12, left: 20, backgroundColor: colors.blue,
    borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4,
  },
  popularText: { color: '#fff', fontSize: 11, fontWeight: 'bold' },
  planHeader: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  planEmoji: { fontSize: 40, marginLeft: 12 },
  planName: { fontSize: 19, fontWeight: 'bold', textAlign: 'right' },
  planTag: { fontSize: 12, color: colors.muted, marginTop: 3, textAlign: 'right' },
  price: { fontSize: 26, fontWeight: 'bold', color: colors.text, marginTop: 14, textAlign: 'right' },
  priceUnit: { fontSize: 14, color: colors.muted, fontWeight: 'normal' },
  features: { marginTop: 14 },
  featureRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 },
  check: { fontSize: 14, fontWeight: 'bold', marginLeft: 8, marginTop: 1 },
  featureText: { fontSize: 13, color: colors.text, flex: 1, textAlign: 'right', lineHeight: 20 },
  buyBtn: { borderRadius: 12, padding: 14, alignItems: 'center', marginTop: 14 },
  buyText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  footer: { textAlign: 'center', color: colors.muted, fontSize: 11, marginTop: 8, lineHeight: 18 },
});
