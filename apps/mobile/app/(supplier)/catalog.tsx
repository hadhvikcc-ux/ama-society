import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSupplierStore, SupplierCatalogItem, SupplierCategory } from '../../stores/supplierStore';

export default function SupplierCatalog() {
  const { catalog, addCatalogItem, updateCatalogItem } = useSupplierStore();

  const [activeCategory, setActiveCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [addModalVisible, setAddModalVisible] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [category, setCategory] = useState<SupplierCategory>(SupplierCategory.WATER_SUPPLY);
  const [unit, setUnit] = useState('Loads');
  const [unitPrice, setUnitPrice] = useState('');
  const [gstPercent, setGstPercent] = useState('5');
  const [stockQuantity, setStockQuantity] = useState('');
  const [moq, setMoq] = useState('1');
  const [leadTimeHours, setLeadTimeHours] = useState('4');
  const [specifications, setSpecifications] = useState('');

  const filteredItems = catalog.filter((item) => {
    const matchesCategory = activeCategory === 'ALL' || item.category === activeCategory;
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.specifications.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleAddItem = () => {
    if (!name.trim() || !unitPrice.trim() || !stockQuantity.trim()) {
      Alert.alert('Incomplete Form', 'Please enter item name, wholesale price, and current stock.');
      return;
    }

    addCatalogItem({
      name: name.trim(),
      category,
      unit: unit.trim() || 'Units',
      unitPrice: parseFloat(unitPrice) || 0,
      gstPercent: parseFloat(gstPercent) || 0,
      stockQuantity: parseInt(stockQuantity, 10) || 0,
      moq: parseInt(moq, 10) || 1,
      leadTimeHours: parseInt(leadTimeHours, 10) || 4,
      isAvailable: true,
      specifications: specifications.trim() || 'Society bulk supply material',
    });

    setAddModalVisible(false);
    setName('');
    setUnitPrice('');
    setStockQuantity('');
    setSpecifications('');
    Alert.alert('Material Added', 'New wholesale material has been added to your catalog.');
  };

  const handleToggleAvailability = (item: SupplierCatalogItem) => {
    updateCatalogItem(item.id, { isAvailable: !item.isAvailable });
  };

  return (
    <View style={styles.container}>
      {/* Search and Category Filter */}
      <View style={styles.searchHeader}>
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={18} color="#64748B" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search materials by name or SKU..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color="#94A3B8" />
            </TouchableOpacity>
          ) : null}
        </View>

        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => setAddModalVisible(true)}
          activeOpacity={0.85}
        >
          <Ionicons name="add" size={18} color="#FFFFFF" />
          <Text style={styles.addBtnText}>+ Material</Text>
        </TouchableOpacity>
      </View>

      {/* Category Pills */}
      <View style={styles.categoriesBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
          {[
            { key: 'ALL', label: 'All Items' },
            { key: SupplierCategory.WATER_SUPPLY, label: '💧 Water Tankers' },
            { key: SupplierCategory.DIESEL_FUEL, label: '⛽ DG Diesel' },
            { key: SupplierCategory.CHEMICALS_TREATMENT, label: '🧪 Pool/STP Chemicals' },
            { key: SupplierCategory.ELECTRICAL_HARDWARE, label: '⚡ Electrical' },
            { key: SupplierCategory.PLUMBING_HARDWARE, label: '🚰 Plumbing' },
            { key: SupplierCategory.HOUSEKEEPING_BULK, label: '🧹 Housekeeping' },
          ].map((cat) => (
            <TouchableOpacity
              key={cat.key}
              style={[styles.catPill, activeCategory === cat.key && styles.catPillActive]}
              onPress={() => setActiveCategory(cat.key)}
            >
              <Text style={[styles.catPillText, activeCategory === cat.key && styles.catPillTextActive]}>
                {cat.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Items List */}
      <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
        {filteredItems.map((item) => {
          const isLowStock = item.stockQuantity < 20 && item.stockQuantity > 0;
          const isOutOfStock = item.stockQuantity === 0 || !item.isAvailable;

          return (
            <View key={item.id} style={styles.card}>
              <View style={styles.cardTop}>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <View style={styles.skuBadge}>
                      <Text style={styles.skuText}>{item.sku}</Text>
                    </View>
                    <View style={styles.catBadge}>
                      <Text style={styles.catText}>{item.category.replace('_', ' ')}</Text>
                    </View>
                  </View>
                  <Text style={styles.itemName}>{item.name}</Text>
                </View>

                <TouchableOpacity
                  style={[styles.availToggle, item.isAvailable ? styles.availOn : styles.availOff]}
                  onPress={() => handleToggleAvailability(item)}
                >
                  <Text style={[styles.availToggleText, item.isAvailable ? styles.availTextOn : styles.availTextOff]}>
                    {item.isAvailable ? 'In Stock' : 'Paused'}
                  </Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.itemSpecs}>{item.specifications}</Text>

              <View style={styles.cardMetaGrid}>
                <View style={styles.metaCol}>
                  <Text style={styles.metaKey}>Wholesale Rate</Text>
                  <Text style={styles.metaValRate}>₹{item.unitPrice.toLocaleString('en-IN')}</Text>
                  <Text style={styles.metaUnit}>per {item.unit} (+{item.gstPercent}% GST)</Text>
                </View>

                <View style={styles.metaCol}>
                  <Text style={styles.metaKey}>Available Stock</Text>
                  <Text style={[
                    styles.metaValStock,
                    isLowStock && { color: '#D97706' },
                    isOutOfStock && { color: '#DC2626' },
                  ]}>
                    {item.stockQuantity} {item.unit}
                  </Text>
                  <Text style={styles.metaUnit}>
                    {isOutOfStock ? '⚠️ Out of Stock' : isLowStock ? '⚡ Restock Soon' : '✅ Ready to Dispatch'}
                  </Text>
                </View>

                <View style={styles.metaCol}>
                  <Text style={styles.metaKey}>Order Terms</Text>
                  <Text style={styles.metaValTerms}>MOQ: {item.moq} {item.unit}</Text>
                  <Text style={styles.metaUnit}>Lead SLA: {item.leadTimeHours}h</Text>
                </View>
              </View>
            </View>
          );
        })}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Add New Material Modal */}
      <Modal visible={addModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Wholesale Material</Text>
              <TouchableOpacity onPress={() => setAddModalVisible(false)}>
                <Ionicons name="close-circle" size={24} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 420 }}>
              <Text style={styles.inputLabel}>Material Name *</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="e.g. 12,000L Potable Water Tanker"
              />

              <Text style={styles.inputLabel}>Category</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 4 }}>
                {[
                  SupplierCategory.WATER_SUPPLY,
                  SupplierCategory.DIESEL_FUEL,
                  SupplierCategory.CHEMICALS_TREATMENT,
                  SupplierCategory.ELECTRICAL_HARDWARE,
                  SupplierCategory.PLUMBING_HARDWARE,
                  SupplierCategory.HOUSEKEEPING_BULK,
                ].map((c) => (
                  <TouchableOpacity
                    key={c}
                    style={[styles.smallCatChip, category === c && styles.smallCatChipActive]}
                    onPress={() => setCategory(c)}
                  >
                    <Text style={[styles.smallCatText, category === c && { color: '#FFFFFF' }]}>
                      {c.replace('_', ' ')}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <View style={{ flexDirection: 'row', gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Unit Wholesale Price (₹) *</Text>
                  <TextInput
                    style={styles.input}
                    value={unitPrice}
                    onChangeText={setUnitPrice}
                    placeholder="9500"
                    keyboardType="numeric"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Unit of Measure *</Text>
                  <TextInput
                    style={styles.input}
                    value={unit}
                    onChangeText={setUnit}
                    placeholder="Loads / Litres / KG"
                  />
                </View>
              </View>

              <View style={{ flexDirection: 'row', gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>GST Rate (%)</Text>
                  <TextInput
                    style={styles.input}
                    value={gstPercent}
                    onChangeText={setGstPercent}
                    placeholder="5 or 18"
                    keyboardType="numeric"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Initial Stock Count *</Text>
                  <TextInput
                    style={styles.input}
                    value={stockQuantity}
                    onChangeText={setStockQuantity}
                    placeholder="50"
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <Text style={styles.inputLabel}>Specifications & Quality Grade</Text>
              <TextInput
                style={[styles.input, { height: 60 }]}
                value={specifications}
                onChangeText={setSpecifications}
                placeholder="TDS rating, purity, warranty or delivery details..."
                multiline
              />
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.btnCancel}
                onPress={() => setAddModalVisible(false)}
              >
                <Text style={styles.btnCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.btnSubmit}
                onPress={handleAddItem}
              >
                <Text style={styles.btnSubmitText}>Save to Catalog</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  searchHeader: {
    backgroundColor: '#FFFFFF',
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 38,
    gap: 8,
  },
  searchInput: { flex: 1, fontSize: 13, color: '#0F172A' },
  addBtn: {
    backgroundColor: '#0D9488',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    height: 38,
    borderRadius: 8,
  },
  addBtnText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },

  categoriesBar: { backgroundColor: '#FFFFFF', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  categoryScroll: { paddingHorizontal: 12, gap: 8 },
  catPill: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: '#F1F5F9' },
  catPillActive: { backgroundColor: '#0D9488' },
  catPillText: { fontSize: 12, fontWeight: '600', color: '#64748B' },
  catPillTextActive: { color: '#FFFFFF' },

  listContent: { padding: 16 },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  skuBadge: { backgroundColor: '#F1F5F9', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  skuText: { fontSize: 10, fontWeight: '700', color: '#475569' },
  catBadge: { backgroundColor: '#F0FDFA', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  catText: { fontSize: 10, fontWeight: '700', color: '#0D9488' },
  itemName: { fontSize: 15, fontWeight: '700', color: '#0F172A' },
  itemSpecs: { fontSize: 12, color: '#64748B', lineHeight: 17, marginBottom: 12 },

  availToggle: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  availOn: { backgroundColor: '#DCFCE7' },
  availOff: { backgroundColor: '#FEE2E2' },
  availToggleText: { fontSize: 10, fontWeight: '700' },
  availTextOn: { color: '#16A34A' },
  availTextOff: { color: '#DC2626' },

  cardMetaGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 10,
  },
  metaCol: { flex: 1 },
  metaKey: { fontSize: 10, fontWeight: '600', color: '#94A3B8', textTransform: 'uppercase' },
  metaValRate: { fontSize: 15, fontWeight: '800', color: '#0D9488', marginVertical: 1 },
  metaValStock: { fontSize: 14, fontWeight: '700', color: '#16A34A', marginVertical: 1 },
  metaValTerms: { fontSize: 12, fontWeight: '600', color: '#334155', marginVertical: 1 },
  metaUnit: { fontSize: 10, color: '#64748B' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  modalTitle: { fontSize: 17, fontWeight: '800', color: '#0F172A' },
  inputLabel: { fontSize: 11, fontWeight: '600', color: '#334155', marginTop: 8, marginBottom: 4 },
  input: { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, fontSize: 13, color: '#0F172A' },
  smallCatChip: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12, backgroundColor: '#F1F5F9', marginRight: 6 },
  smallCatChipActive: { backgroundColor: '#0D9488' },
  smallCatText: { fontSize: 11, fontWeight: '600', color: '#475569' },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 16, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  btnCancel: { flex: 1, paddingVertical: 10, borderRadius: 8, borderWidth: 1, borderColor: '#CBD5E1', alignItems: 'center' },
  btnCancelText: { fontSize: 13, fontWeight: '600', color: '#64748B' },
  btnSubmit: { flex: 2, backgroundColor: '#0D9488', paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  btnSubmitText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
});
