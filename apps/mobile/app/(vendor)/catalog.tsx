import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Modal, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ScreenHeader } from '../../components/ui/ScreenHeader';

const mockProducts = [
  { id: '1', name: 'Amul Taaza Milk 1L', price: 68, stock: 45, category: 'Dairy', emoji: '🥛', active: true },
  { id: '2', name: 'Farm Fresh Eggs (12)', price: 95, stock: 3, category: 'Dairy', emoji: '🥚', active: true },
  { id: '3', name: 'Aashirvaad Atta 5kg', price: 250, stock: 12, category: 'Grocery', emoji: '🌾', active: true },
  { id: '4', name: 'Onion 1kg', price: 40, stock: 20, category: 'Vegetables', emoji: '🧅', active: true },
  { id: '5', name: 'Tomato 1kg', price: 50, stock: 0, category: 'Vegetables', emoji: '🍅', active: false },
  { id: '6', name: 'Maggi 2-Min Noodles', price: 14, stock: 100, category: 'Snacks', emoji: '🍜', active: true },
  { id: '7', name: 'Lays Classic Salted', price: 20, stock: 40, category: 'Snacks', emoji: '🥔', active: true },
  { id: '8', name: 'Coca Cola 1.5L', price: 90, stock: 15, category: 'Beverages', emoji: '🥤', active: true },
];

export default function VendorCatalog() {
  const [search, setSearch] = useState('');
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [products, setProducts] = useState(mockProducts);

  const filteredProducts = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

  const toggleActive = (id: string) => {
    setProducts(products.map(p => p.id === id ? { ...p, active: !p.active } : p));
  };

  const updateStock = (id: string, increment: number) => {
    setProducts(products.map(p => p.id === id ? { ...p, stock: Math.max(0, p.stock + increment) } : p));
  };

  const renderProduct = ({ item }: { item: any }) => (
    <View style={[styles.card, !item.active && styles.cardInactive]}>
      <View style={styles.cardHeader}>
        <View style={styles.productInfo}>
          <View style={styles.emojiContainer}><Text style={styles.emoji}>{item.emoji}</Text></View>
          <View style={styles.details}>
            <Text style={styles.productName}>{item.name}</Text>
            <Text style={styles.category}>{item.category}</Text>
          </View>
        </View>
        <Switch value={item.active} onValueChange={() => toggleActive(item.id)} trackColor={{ false: '#D1D5DB', true: '#C4B5FD' }} thumbColor={item.active ? '#7C3AED' : '#F3F4F6'} />
      </View>

      <View style={styles.cardFooter}>
        <Text style={styles.price}>₹{item.price}</Text>
        <View style={styles.stockControl}>
          <TouchableOpacity style={styles.stockBtn} onPress={() => updateStock(item.id, -1)}><Ionicons name="remove" size={16} color="#4B5563" /></TouchableOpacity>
          <Text style={[styles.stockText, item.stock < 5 && { color: '#DC2626', fontWeight: 'bold' }]}>{item.stock}</Text>
          <TouchableOpacity style={styles.stockBtn} onPress={() => updateStock(item.id, 1)}><Ionicons name="add" size={16} color="#4B5563" /></TouchableOpacity>
        </View>
      </View>
      {item.stock < 5 && item.active && <Text style={styles.lowStockWarn}>Low Stock!</Text>}
    </View>
  );

  return (
    <View style={styles.container}>
      <ScreenHeader title="My Products" />
      
      <View style={styles.summaryRow}>
        <View style={styles.summaryCard}><Text style={styles.summaryVal}>{products.length}</Text><Text style={styles.summaryLabel}>Total</Text></View>
        <View style={styles.summaryCard}><Text style={[styles.summaryVal, { color: '#10B981' }]}>{products.filter(p=>p.active).length}</Text><Text style={styles.summaryLabel}>Active</Text></View>
        <View style={styles.summaryCard}><Text style={[styles.summaryVal, { color: '#DC2626' }]}>{products.filter(p=>p.stock === 0).length}</Text><Text style={styles.summaryLabel}>Out of Stock</Text></View>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#9CA3AF" style={styles.searchIcon} />
        <TextInput style={styles.searchInput} placeholder="Search products..." value={search} onChangeText={setSearch} />
      </View>

      <FlatList
        data={filteredProducts}
        keyExtractor={item => item.id}
        renderItem={renderProduct}
        contentContainerStyle={styles.listContent}
      />

      <TouchableOpacity style={styles.fab} onPress={() => setAddModalVisible(true)}>
        <Ionicons name="add" size={24} color="#FFF" />
      </TouchableOpacity>

      <Modal visible={addModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Product</Text>
            <TextInput style={styles.input} placeholder="Product Name" placeholderTextColor="#9CA3AF" />
            <TextInput style={styles.input} placeholder="Price (₹)" keyboardType="number-pad" placeholderTextColor="#9CA3AF" />
            <TextInput style={styles.input} placeholder="Category" placeholderTextColor="#9CA3AF" />
            <TextInput style={styles.input} placeholder="Initial Stock" keyboardType="number-pad" placeholderTextColor="#9CA3AF" />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setAddModalVisible(false)}><Text style={styles.cancelBtnText}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={() => setAddModalVisible(false)}><Text style={styles.saveBtnText}>Save</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  summaryRow: { flexDirection: 'row', padding: 16, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  summaryCard: { flex: 1, alignItems: 'center' },
  summaryVal: { fontSize: 18, fontWeight: 'bold', color: '#111827' },
  summaryLabel: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', margin: 16, paddingHorizontal: 12, borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB' },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, paddingVertical: 12, fontSize: 16, color: '#111827' },
  listContent: { paddingHorizontal: 16, paddingBottom: 80 },
  card: { backgroundColor: '#FFF', borderRadius: 16, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  cardInactive: { opacity: 0.6 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  productInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  emojiContainer: { width: 48, height: 48, borderRadius: 12, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  emoji: { fontSize: 24 },
  details: { flex: 1 },
  productName: { fontSize: 16, fontWeight: 'bold', color: '#111827', marginBottom: 4 },
  category: { fontSize: 13, color: '#6B7280' },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#F3F4F6', paddingTop: 12 },
  price: { fontSize: 18, fontWeight: 'bold', color: '#7C3AED' },
  stockControl: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F3F4F6', borderRadius: 8, padding: 4 },
  stockBtn: { padding: 4, backgroundColor: '#FFF', borderRadius: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 1, elevation: 1 },
  stockText: { fontSize: 16, fontWeight: '600', width: 40, textAlign: 'center' },
  lowStockWarn: { color: '#DC2626', fontSize: 12, fontWeight: 'bold', position: 'absolute', top: 16, right: 64 },
  fab: { position: 'absolute', bottom: 24, right: 24, width: 56, height: 56, borderRadius: 28, backgroundColor: '#7C3AED', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 6 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#FFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#111827', marginBottom: 20 },
  input: { borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 12, padding: 12, marginBottom: 16, fontSize: 16 },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 8 },
  cancelBtn: { padding: 12, marginRight: 12 },
  cancelBtnText: { color: '#6B7280', fontSize: 16, fontWeight: '600' },
  saveBtn: { backgroundColor: '#7C3AED', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  saveBtnText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
});
