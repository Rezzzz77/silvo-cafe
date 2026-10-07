import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ScrollView, TextInput, Alert } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../App';
import { useApp } from '../../core/store';
import { getCafeMenu, callWaiter } from '../../api';
import { colors } from '../../core/theme';
import { fa } from '../../core/jalali';

type Props = NativeStackScreenProps<RootStackParamList, 'Menu'>;

type Item = { id: number; name: string; price: number; desc: string };
type Category = { id: number; title: string; items: Item[] };

export default function MenuScreen({ navigation }: Props) {
  const { table, cart, addToCart, removeFromCart, cartTotal, cartCount } = useApp();
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeCat, setActiveCat] = useState(0);
  const [search, setSearch] = useState('');

  useEffect(() => {
    getCafeMenu(1).then((d) => {
      setCategories(d.menuCategories);
      if (d.menuCategories.length) setActiveCat(d.menuCategories[0].id);
    }).catch(() => {});
  }, []);

  const cat = categories.find((c) => c.id === activeCat) || categories[0];

  const qtyOf = useCallback(
    (id: number) => cart.find((i) => i.menuItemId === id)?.quantity || 0,
    [cart]
  );

  const items = cat ? cat.items.filter((i) => i.name.includes(search)) : [];

  const renderItem = ({ item }: { item: Item }) => {
    const qty = qtyOf(item.id);
    return (
      <View style={styles.card}>
        <View style={styles.cardInfo}>
          <Text style={styles.itemName}>{item.name}</Text>
          <Text style={styles.itemDesc}>{item.desc}</Text>
          <Text style={styles.itemPrice}>{fa(item.price)} تومان</Text>
        </View>
        <View style={styles.qtyBox}>
          {qty === 0 ? (
            <TouchableOpacity style={styles.addBtn} onPress={() => addToCart({ menuItemId: item.id, name: item.name, price: item.price })}>
              <Text style={styles.addBtnText}>+ افزودن</Text>
            </TouchableOpacity>
          ) : (
            <>
              <TouchableOpacity style={styles.qtyBtn} onPress={() => removeFromCart(item.id)}>
                <Text style={styles.qtyBtnText}>−</Text>
              </TouchableOpacity>
              <Text style={styles.qtyNum}>{fa(qty)}</Text>
              <TouchableOpacity style={styles.qtyBtn} onPress={() => addToCart({ menuItemId: item.id, name: item.name, price: item.price })}>
                <Text style={styles.qtyBtnText}>+</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.root}>
      <View style={styles.topBar}>
        <View style={{ flex: 1 }}>
          <Text style={styles.cafeName}>کافه سیلو پلازا</Text>
          <Text style={styles.tableInfo}>{table ? `میز ${fa(table.number)} · ${table.section}` : 'میز انتخاب نشده'}</Text>
        </View>
        {table && (
          <TouchableOpacity
            style={styles.waiterBtn}
            onPress={async () => {
              try {
                const res = await callWaiter(table.id);
                Alert.alert('🛎️', res.message || 'گارسون خبردار شد');
              } catch (e: any) {
                Alert.alert('خطا', e.message || 'ناموفق');
              }
            }}
          >
            <Text style={styles.waiterBtnText}>🛎️ گارسون</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.catsWrap}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.cats}>
          {categories.map((c) => (
            <TouchableOpacity
              key={c.id}
              style={[styles.catChip, c.id === activeCat && styles.catChipActive]}
              onPress={() => { setActiveCat(c.id); setSearch(''); }}
            >
              <Text style={[styles.catText, c.id === activeCat && styles.catTextActive]}>{c.title}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.searchWrap}>
        <TextInput
          style={styles.searchInput}
          placeholder="🔍 جستجو در منو... (مثلاً لاته، پیتزا، قلیان)"
          placeholderTextColor={colors.muted}
          value={search}
          onChangeText={setSearch}
        />
        {search !== '' && (
          <Text style={styles.searchCount}>{fa(items.length)} مورد</Text>
        )}
      </View>

      <FlatList
        data={items}
        keyExtractor={(i) => String(i.id)}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.empty}>آیتمی یافت نشد</Text>}
      />

      {cartCount > 0 && (
        <TouchableOpacity style={styles.cartBar} onPress={() => navigation.navigate('Cart')}>
          <Text style={styles.cartBarText}>🛒 {fa(cartCount)} آیتم</Text>
          <Text style={styles.cartBarTotal}>{fa(cartTotal)} تومان</Text>
          <Text style={styles.cartBarGo}>ادامه ←</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  topBar: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8, flexDirection: 'row', alignItems: 'center' },
  waiterBtn: { backgroundColor: colors.amber, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 },
  waiterBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 12 },
  cafeName: { fontSize: 18, fontWeight: 'bold', color: colors.greenDark },
  tableInfo: { fontSize: 12, color: colors.muted, marginTop: 2 },
  catsWrap: { borderBottomWidth: 1, borderBottomColor: colors.border },
  cats: { paddingHorizontal: 12, paddingVertical: 10, gap: 8 },
  searchWrap: { paddingHorizontal: 12, paddingTop: 10, flexDirection: 'row', alignItems: 'center' },
  searchInput: {
    flex: 1, backgroundColor: colors.card, borderRadius: 12, borderWidth: 1, borderColor: colors.border,
    paddingHorizontal: 14, paddingVertical: 10, fontSize: 13, color: colors.text, textAlign: 'right',
  },
  searchCount: { marginLeft: 10, fontSize: 12, color: colors.green, fontWeight: 'bold' },
  catChip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
  },
  catChipActive: { backgroundColor: colors.green, borderColor: colors.green },
  catText: { fontSize: 13, color: colors.text },
  catTextActive: { color: '#fff', fontWeight: 'bold' },
  list: { padding: 12, paddingBottom: 100 },
  card: {
    backgroundColor: colors.card, borderRadius: 14, padding: 14, marginBottom: 10,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderWidth: 1, borderColor: colors.border,
  },
  cardInfo: { flex: 1, marginLeft: 10 },
  itemName: { fontSize: 15, fontWeight: 'bold', color: colors.text, textAlign: 'right' },
  itemDesc: { fontSize: 12, color: colors.muted, marginTop: 3, textAlign: 'right', lineHeight: 18 },
  itemPrice: { fontSize: 13, color: colors.green, fontWeight: '600', marginTop: 6, textAlign: 'right' },
  qtyBox: { alignItems: 'center', justifyContent: 'center' },
  addBtn: { backgroundColor: colors.green, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 },
  addBtnText: { color: '#fff', fontSize: 13, fontWeight: 'bold' },
  qtyBtn: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: colors.greenLight,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.green,
  },
  qtyBtnText: { fontSize: 18, color: colors.green, fontWeight: 'bold', lineHeight: 20 },
  qtyNum: { fontSize: 15, fontWeight: 'bold', color: colors.text, marginVertical: 4 },
  cartBar: {
    position: 'absolute', left: 12, right: 12, bottom: 16,
    backgroundColor: colors.green, borderRadius: 16, padding: 16,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  cartBarText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  cartBarTotal: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  cartBarGo: { color: '#dcfce7', fontWeight: 'bold', fontSize: 14 },
  empty: { textAlign: 'center', color: colors.muted, marginTop: 40 },
});
