// ProductsScreen.tsx
import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

type Product = {
  id: number;
  name: string;
  stock: number;
  price: number;
  category?: string;
  location?: string;
  status?: string;
  imageUrl?: string;
};

type FormState = {
  name: string;
  price: string;
  stock: string;
  category: string;
  location: string;
  imageUrl: string;
  status: string;
};

const API_BASE_URL = 'http://nindam.sytes.net:3012/api';

// Generic fetch wrapper
const apiCall = async (
  endpoint: string,
  options: { method?: string; body?: any; headers?: Record<string, string> } = {}
) => {
  if (!endpoint) throw new Error('Endpoint cannot be null');

  const config: any = {
    method: options.method || 'GET',
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(options.headers || {}),
    },
  };

  const res = await fetch(`${API_BASE_URL}${endpoint}`, config);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HTTP ${res.status}: ${text}`);
  }

  const contentType = res.headers.get('content-type') || '';
  return contentType.includes('application/json') ? await res.json() : await res.text();
};


export default function ProductsScreen() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState(''); // ✅ search state

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  const emptyForm: FormState = {
    name: '',
    price: '0',
    stock: '0',
    category: '',
    location: '',
    imageUrl: '',
    status: 'active',
  };
  const [form, setForm] = useState<FormState>({ ...emptyForm });
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Confirm modal
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [targetProduct, setTargetProduct] = useState<Product | null>(null);

  const buildImageUrl = useCallback((raw?: string) => {
    if (!raw) return undefined;
    if (raw.startsWith('http')) return raw;
    return `${API_BASE_URL}${raw}`;
  }, []);

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiCall('/product');
      const list = Array.isArray(data) ? data : data?.product || [];
      const parsed: Product[] = list.map((p: any) => ({
        id: p.id,
        name: p.name,
        stock: Number(p.stock) || 0,
        price: Number(p.price) || 0,
        category: p.category || '',
        location: p.location || '',
        status: p.status || 'active',
        imageUrl: buildImageUrl(p.imageUrl || p.image),
      }));
      setProducts(parsed);
    } catch (err: any) {
      setError(err.message);
      Alert.alert('Error', `Failed to load products: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [buildImageUrl]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleCreate = async () => {
    if (!form.name || Number(form.price) <= 0) {
      Alert.alert('Validation', 'โปรดระบุชื่อสินค้าและราคาที่ถูกต้อง');
      return;
    }
    try {
      setLoading(true);
      const payload = {
        name: form.name,
        price: Number(form.price),
        stock: Number(form.stock) || 0,
        category: form.category,
        location: form.location,
        status: form.status,
        image: form.imageUrl, // ✅ backend ต้องใช้ image
      };
      await apiCall('/product', { method: 'POST', body: JSON.stringify(payload) });
      Alert.alert('Success', 'สร้างสินค้าเรียบร้อย');
      setShowCreateModal(false);
      setForm({ ...emptyForm });
      await fetchProducts();
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  const openEdit = (p: Product) => {
    setSelectedProduct(p);
    setForm({
      name: p.name || '',
      price: (p.price ?? 0).toString(),
      stock: (p.stock ?? 0).toString(),
      category: p.category || '',
      location: p.location || '',
      imageUrl: p.imageUrl || '',
      status: p.status || 'active',
    });
    setShowEditModal(true);
  };

  const handleUpdate = async () => {
    if (!selectedProduct) return;
    if (!form.name || Number(form.price) <= 0) {
      Alert.alert('Validation', 'โปรดระบุชื่อสินค้าและราคาที่ถูกต้อง');
      return;
    }
    try {
      setLoading(true);
      const payload = {
        name: form.name,
        price: Number(form.price),
        stock: Number(form.stock) || 0,
        category: form.category,
        location: form.location,
        status: form.status,
        image: form.imageUrl, // ✅ backend ต้องใช้ image
      };
      await apiCall(`/product/${selectedProduct.id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
      Alert.alert('Success', 'อัปเดตสินค้าเรียบร้อย');
      setShowEditModal(false);
      setSelectedProduct(null);
      setForm({ ...emptyForm });
      await fetchProducts();
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = (p: Product) => {
    setTargetProduct(p);
    setConfirmVisible(true);
  };

  const doDelete = async () => {
    if (!targetProduct) return;
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/product/delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ id: targetProduct.id }),
      });
      const body = await res.text();
      console.log('delete response:', res.status, body);

      if (res.ok) {
        Alert.alert('Success', 'ลบสินค้าสำเร็จ');
        await fetchProducts();
      } else {
        Alert.alert('Error', `ลบสินค้าไม่สำเร็จ: ${res.status} ${body}`);
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'เกิดข้อผิดพลาด');
    } finally {
      setLoading(false);
      setConfirmVisible(false);
      setTargetProduct(null);
    }
  };

  // ✅ กรองด้วย search
  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8f8f8" />
<View>
    <View style={styles.header}>
      <TouchableOpacity style={styles.menuButton}>
        <Text style={styles.menuIcon}>≡</Text>
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Products</Text>
      <TouchableOpacity style={styles.profileButton}>
        <Text style={styles.profileIcon}>👤</Text>
      </TouchableOpacity>
    </View>

    <View style={styles.searchContainer}>
      <View style={styles.searchBar}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search products..."
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <TouchableOpacity
  style={styles.addButton}
  onPress={() => setShowCreateModal(true)}
>
  <Text style={styles.addButtonText}>+ Add Product</Text>
</TouchableOpacity>

      <TouchableOpacity style={styles.filterButton}>
        <Text style={styles.filterText}>Filter ⬇</Text>
      </TouchableOpacity>
    </View>
  </View>

      <ScrollView contentContainerStyle={styles.list}>
        {filteredProducts.map((p) => (
          <View key={p.id} style={styles.card}>
            {p.imageUrl ? (
              <Image source={{ uri: p.imageUrl }} style={styles.thumb} resizeMode="cover" />
            ) : (
              <View style={[styles.thumb, styles.thumbPlaceholder]}>
                <Text>No image</Text>
              </View>
            )}

            <View style={styles.info}>
              <Text style={styles.name}>{p.name}</Text>
              <Text>Stock: {p.stock}</Text>
              <Text>Price: {p.price}</Text>
              <Text>Category: {p.category}</Text>
              <Text>Location: {p.location}</Text>

              <View style={styles.rowActions}>
                <TouchableOpacity style={styles.smallBtn} onPress={() => openEdit(p)}>
                  <Text>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.smallBtn, { backgroundColor: '#fdd' }]}
                  onPress={() => confirmDelete(p)}
                >
                  <Text>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ))}

        {filteredProducts.length === 0 && !loading && (
          <View style={styles.empty}><Text>No products found</Text></View>
        )}
      </ScrollView>
     <View style={styles.bottomNav}>
             <TouchableOpacity style={styles.navItem}>
               <Text style={styles.navIcon}>🏠</Text>
               <Text style={styles.navText}>Home</Text>
             </TouchableOpacity>
             <TouchableOpacity style={styles.navItem}
              onPress={() => setShowCreateModal(true)}>
               <Text style={styles.navIcon}>➕</Text>
               <Text style={styles.navText}>Add</Text>
             </TouchableOpacity>
             <TouchableOpacity style={styles.navItem}>
               <Text style={styles.navIcon}>📦</Text>
               <Text style={styles.navText}>Products</Text>
             </TouchableOpacity>
             <TouchableOpacity style={styles.navItem}>
               <Text style={styles.navIcon}>📂</Text>
               <Text style={styles.navText}>Categories</Text>
             </TouchableOpacity>
           </View>
      {/* Confirm Delete Modal */}
      <Modal visible={confirmVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.confirmBox}>
            <Text style={{ marginBottom: 10 }}>
              ต้องการลบ "{targetProduct?.name}" หรือไม่?
            </Text>
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
              <TouchableOpacity onPress={() => setConfirmVisible(false)} style={styles.btn}>
                <Text>ยกเลิก</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={doDelete} style={[styles.btn, { backgroundColor: '#fdd' }]}>
                <Text style={{ color: 'red' }}>ลบ</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* CREATE MODAL */}
      <Modal visible={showCreateModal} animationType="slide">
        <SafeAreaView style={styles.modalWrap}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
            <ScrollView contentContainerStyle={styles.modalInner} keyboardShouldPersistTaps="handled">
              <Text style={styles.modalTitle}>Add Product</Text>

              <TextInput style={styles.input} placeholder="Name" value={form.name} onChangeText={(t) => setForm((s) => ({ ...s, name: t }))} />
              <TextInput style={styles.input} placeholder="Price" keyboardType="numeric" value={form.price} onChangeText={(t) => setForm((s) => ({ ...s, price: t }))} />
              <TextInput style={styles.input} placeholder="Stock" keyboardType="numeric" value={form.stock} onChangeText={(t) => setForm((s) => ({ ...s, stock: t }))} />
              <TextInput style={styles.input} placeholder="Category" value={form.category} onChangeText={(t) => setForm((s) => ({ ...s, category: t }))} />
              <TextInput style={styles.input} placeholder="Location" value={form.location} onChangeText={(t) => setForm((s) => ({ ...s, location: t }))} />
              <TextInput style={styles.input} placeholder="Image URL or server path" value={form.imageUrl} onChangeText={(t) => setForm((s) => ({ ...s, imageUrl: t }))} />

              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.btn} onPress={() => { setShowCreateModal(false); setForm({ ...emptyForm }); }}>
                  <Text>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.btn, styles.primaryBtn]} onPress={handleCreate}>
                  <Text style={{ color: '#fff' }}>Save</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>

      {/* EDIT MODAL */}
      <Modal visible={showEditModal} animationType="slide">
        <SafeAreaView style={styles.modalWrap}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
            <ScrollView contentContainerStyle={styles.modalInner} keyboardShouldPersistTaps="handled">
              <Text style={styles.modalTitle}>Edit Product</Text>

              <TextInput style={styles.input} placeholder="Name" value={form.name} onChangeText={(t) => setForm((s) => ({ ...s, name: t }))} />
              <TextInput style={styles.input} placeholder="Price" keyboardType="numeric" value={form.price} onChangeText={(t) => setForm((s) => ({ ...s, price: t }))} />
              <TextInput style={styles.input} placeholder="Stock" keyboardType="numeric" value={form.stock} onChangeText={(t) => setForm((s) => ({ ...s, stock: t }))} />
              <TextInput style={styles.input} placeholder="Category" value={form.category} onChangeText={(t) => setForm((s) => ({ ...s, category: t }))} />
              <TextInput style={styles.input} placeholder="Location" value={form.location} onChangeText={(t) => setForm((s) => ({ ...s, location: t }))} />
              <TextInput style={styles.input} placeholder="Image URL or server path" value={form.imageUrl} onChangeText={(t) => setForm((s) => ({ ...s, imageUrl: t }))} />

              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.btn} onPress={() => { setShowEditModal(false); setSelectedProduct(null); setForm({ ...emptyForm }); }}>
                  <Text>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.btn, styles.primaryBtn]} onPress={handleUpdate}>
                  <Text style={{ color: '#fff' }}>Update</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#4faaffff' },
  list: { padding: 12 },
  card: { flexDirection: 'row', marginBottom: 12, backgroundColor: '#fafafa', borderRadius: 8, overflow: 'hidden' },
  thumb: { width: 110, height: 110 },
  thumbPlaceholder: { alignItems: 'center', justifyContent: 'center', backgroundColor: '#eee' },
  info: { flex: 1, padding: 10 },
  name: { fontSize: 16, fontWeight: '600', marginBottom: 6 },
  rowActions: { flexDirection: 'row', marginTop: 8 },
  smallBtn: { paddingHorizontal: 10, paddingVertical: 6, backgroundColor: '#ddd', borderRadius: 6, marginRight: 8 },
  empty: { padding: 20, alignItems: 'center' },
  modalWrap: { flex: 1, backgroundColor: '#fff' },
  modalInner: { padding: 16 },
  modalTitle: { fontSize: 20, fontWeight: '700', marginBottom: 12 },
  input: { borderWidth: 1, borderColor: '#ddd', padding: 10, borderRadius: 6, marginBottom: 10 },
  modalActions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  btn: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 6, backgroundColor: '#eee' },
  primaryBtn: { backgroundColor: '#ffffffff' },
  flex: { flex: 1 },
  modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  confirmBox: { backgroundColor: '#fff', padding: 20, borderRadius: 10, width: '80%' },
  searchBox: { paddingHorizontal: 12, paddingVertical: 8, borderBottomWidth: 1, borderColor: '#eee', backgroundColor: '#fafafa' },
  menuButton: {
        width: 30,
        height: 30,
        justifyContent: 'center',
        alignItems: 'center',
    },
    menuIcon: {
        fontSize: 24,
        color: '#333'
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#ffffffff'
    },
    profileButton: {
        width: 30,
        height: 30,
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#ffffffff',
    },
    profileIcon: {
        fontSize: 24,
        color: 'white'
    },

    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 15,
        paddingHorizontal: 20,
        backgroundColor: '#ffffffff',
        borderBottomColor: '#0067c7ff',
        borderBottomWidth: 1,
    },
    searchBar: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ffffff',
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 10,
        marginRight: 10,
    },
    searchIcon: { fontSize: 18, marginRight: 8 },
    searchInput: { flex: 1, fontSize: 16 },
    addButton: {
        backgroundColor: '#4faaffff',
        paddingVertical: 4,
        paddingHorizontal: 15,
        borderRadius: 8,
        alignItems: 'center',
        marginRight: 10,
    },
    addButtonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    filterButton: {
        paddingHorizontal: 10,
        paddingVertical: 10
    },
    filterText: {
        color: '#333',
        fontSize: 18,
        fontWeight: '500'
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 15,
        paddingHorizontal: 20,
        backgroundColor: '#4faaffff',
        borderBottomColor: '#0067c7ff',
        borderBottomWidth: 1,
    },
  navItem: { alignItems: 'center' },
    navIcon: { fontSize: 24 },
    navText: { fontSize: 12, marginTop: 2 },
    bottomNav: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingVertical: 10,
        backgroundColor: '#d9f0ff',
        position: 'absolute', 
  bottom: 0,
  left: 0,
  right: 0,
    },
});
