import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput, Alert, RefreshControl } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../App';
import { getCafeMenu, adminAddMenuItem, adminUpdateMenuItem, adminDeleteMenuItem, adminAddCategory } from '../../api';
import { colors } from '../../core/theme';
import { fa } from '../../core/jalali';

type Props = NativeStackScreenProps<RootStackParamList, 'AdminMenu'>;

export default function AdminMenuScreen({ navigation }: Props) {
  const [menu, setMenu] = useState<any[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [showAddCat, setShowAddCat] = useState(false);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [desc, setDesc] = useState('');
  const [categoryId, setCategoryId] = useState<number>(1);
  const [catTitle, setCatTitle] = useState('');
  const [editId, setEditId] = useState<number | null>(null);
  const [editPrice, setEditPrice] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const d = await getCafeMenu(1);
      setMenu(d.menuCategories);
      if (!categoryId && d.menuCategories.length) setCategoryId(d.menuCategories[0].id);
    } catch { /* ignore */ }
  }, [categoryId]);

  useEffect(() => { load(); }, [load]);

  const addItem = async () => {
    if (!name.trim() || !Number(price)) { Alert.alert('نام و قیمت لازم است'); return; }
    setBusy(true);
    try {
      await adminAddMenuItem({ categoryId, name: name.trim(), price: Number(price), desc: desc.trim() });
      setName(''); setPrice(''); setDesc(''); setShowAdd(false);
      await load();
    } catch (e: any) { Alert.alert('خطا', e.message); } finally { setBusy(false); }
  };

  const addCat = async () => {
    if (!catTitle.trim()) return;
    setBusy(true);
    try {
      await adminAddCategory(catTitle.trim());
      setCatTitle(''); setShowAddCat(false);
      await load();
    } catch (e: any) { Alert.alert('خطا', e.message); } finally { setBusy(false); }
  };

  const savePrice = async (itemId: number) => {
    if (!Number(editPrice)) return;
    setBusy(true);
    try {
      await adminUpdateMenuItem(itemId, { price: Number(editPrice) });
      setEditId(null);
      await load();
    } catch (e: any) { Alert.alert('خطا', e.message); } finally { setBusy(false); }
  };

  const toggleItem = async (itemId: number, available: boolean) => {
    await adminUpdateMenuItem(itemId, { available });
    await load();
  };

  const delItem = (itemId: number) => {
    Alert.alert('حذف آیتم', 'مطمئن هستید؟', [
      { text: 'انصراف', style: 'cancel' },
      { text: 'حذف', style: 'destructive', onPress: async () => { await adminDeleteMenuItem(itemId); await load(); } },
    ]);
  };

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.container} refreshControl={<RefreshControl refreshing={false} onRefresh={load} />}>
      <View style={styles.topBtns}>
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowAdd(!showAdd)}>
          <Text style={styles.addBtnText}>+ آیتم جدید</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.addBtn, { backgroundColor: colors.blue }]} onPress={() => setShowAddCat(!showAddCat)}>
          <Text style={styles.addBtnText}>+ دسته‌بندی</Text>
        </TouchableOpacity>
      </View>

      {showAdd && (
        <View style={styles.form}>
          <TextInput style={styles.input} placeholder="نام آیتم" placeholderTextColor={colors.muted} value={name} onChangeText={setName} />
          <TextInput style={styles.input} placeholder="قیمت (تومان)" placeholderTextColor={colors.muted} keyboardType="number-pad" value={price} onChangeText={setPrice} />
          <TextInput style={styles.input} placeholder="توضیح (اختیاری)" placeholderTextColor={colors.muted} value={desc} onChangeText={setDesc} />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catRow}>
            {menu.map((c) => (
              <TouchableOpacity key={c.id} style={[styles.catChip, categoryId === c.id && { backgroundColor: colors.green, borderColor: colors.green }]} onPress={() => setCategoryId(c.id)}>
                <Text style={[styles.catChipText, categoryId === c.id && { color: '#fff' }]}>{c.title}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <TouchableOpacity style={[styles.saveBtn, busy && { opacity: 0.5 }]} onPress={addItem} disabled={busy}>
            <Text style={styles.saveBtnText}>ذخیره آیتم</Text>
          </TouchableOpacity>
        </View>
      )}

      {showAddCat && (
        <View style={styles.form}>
          <TextInput style={styles.input} placeholder="عنوان دسته‌بندی جدید" placeholderTextColor={colors.muted} value={catTitle} onChangeText={setCatTitle} />
          <TouchableOpacity style={styles.saveBtn} onPress={addCat}>
            <Text style={styles.saveBtnText}>افزودن دسته‌بندی</Text>
          </TouchableOpacity>
        </View>
      )}

      {menu.map((cat) => (
        <View key={cat.id} style={styles.catBlock}>
          <Text style={styles.catTitle}>{cat.title} ({fa(cat.items.length)})</Text>
          {cat.items.map((it: any) => (
            <View key={it.id} style={[styles.itemRow, it.available === false && { opacity: 0.5 }]}>
              <View style={{ flex: 1 }}>
                <Text style={styles.itemName}>{it.name}</Text>
                {editId === it.id ? (
                  <View style={styles.editRow}>
                    <TextInput style={styles.editInput} keyboardType="number-pad" value={editPrice} onChangeText={setEditPrice} placeholder="قیمت" placeholderTextColor={colors.muted} />
                    <TouchableOpacity style={styles.miniBtn} onPress={() => savePrice(it.id)}><Text style={styles.miniBtnText}>ذخیره</Text></TouchableOpacity>
                    <TouchableOpacity style={styles.miniBtn} onPress={() => setEditId(null)}><Text style={styles.miniBtnText}>لغو</Text></TouchableOpacity>
                  </View>
                ) : (
                  <Text style={styles.itemPrice}>{fa(it.price)} تومان</Text>
                )}
              </View>
              <TouchableOpacity style={styles.miniBtn} onPress={() => { setEditId(it.id); setEditPrice(String(it.price)); }}>
                <Text style={styles.miniBtnText}>✏️ قیمت</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.miniBtn} onPress={() => toggleItem(it.id, it.available === false)}>
                <Text style={styles.miniBtnText}>{it.available === false ? 'فعال کن' : 'غیرفعال'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.miniBtn, { backgroundColor: colors.redLight }]} onPress={() => delItem(it.id)}>
                <Text style={[styles.miniBtnText, { color: colors.red }]}>🗑</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  container: { padding: 14, paddingBottom: 40 },
  topBtns: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  addBtn: { flex: 1, backgroundColor: colors.green, borderRadius: 12, padding: 12, alignItems: 'center' },
  addBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 13 },
  form: { backgroundColor: colors.card, borderRadius: 14, padding: 14, marginBottom: 14, borderWidth: 1, borderColor: colors.border },
  input: { backgroundColor: colors.bg, borderRadius: 10, borderWidth: 1, borderColor: colors.border, padding: 10, fontSize: 13, marginBottom: 8, textAlign: 'right', color: colors.text },
  catRow: { gap: 8, paddingVertical: 4, marginBottom: 8 },
  catChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16, backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border },
  catChipText: { fontSize: 12, color: colors.text, fontWeight: 'bold' },
  saveBtn: { backgroundColor: colors.green, borderRadius: 10, padding: 12, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 13 },
  catBlock: { marginBottom: 14 },
  catTitle: { fontSize: 14, fontWeight: 'bold', color: colors.greenDark, marginBottom: 8, textAlign: 'right' },
  itemRow: { backgroundColor: colors.card, borderRadius: 12, padding: 10, marginBottom: 6, flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderColor: colors.border },
  itemName: { fontSize: 13, fontWeight: 'bold', color: colors.text, textAlign: 'right' },
  itemPrice: { fontSize: 11, color: colors.muted, marginTop: 3, textAlign: 'right' },
  editRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  editInput: { backgroundColor: colors.bg, borderRadius: 8, borderWidth: 1, borderColor: colors.border, padding: 6, fontSize: 12, width: 90, textAlign: 'center', color: colors.text },
  miniBtn: { backgroundColor: colors.greenLight, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 6 },
  miniBtnText: { fontSize: 11, color: colors.greenDark, fontWeight: 'bold' },
});
