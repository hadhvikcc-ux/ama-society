import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ScrollView,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useBazaarStore, ProductItem } from '../../../stores/bazaarStore';
import {
  BazaarGroupHeader,
  BazaarGroupTab,
} from '../../../components/bazaar/BazaarGroupHeader';
import { BazaarScannersView } from '../../../components/bazaar/BazaarScannersView';
import CombinedBazaarScreen from './cart';
import InventoryScreen from './inventory';
import OutstandingScreen from './outstanding';

export default function BazaarHubScreen() {
  const router = useRouter();
  const searchParams = useLocalSearchParams<{ tab?: string; mode?: string }>();
  const { products, cart, addToCart } = useBazaarStore();

  // Active Group Tab: 'STORE' | 'POS_CART' | 'INVENTORY' | 'OUTSTANDING' | 'SCANNERS'
  const getInitialTab = (): BazaarGroupTab => {
    const raw = (searchParams.tab || '').toLowerCase();
    if (raw === 'pos_cart' || raw === 'cart' || raw === 'pos') return 'POS_CART';
    if (raw === 'inventory' || raw === 'stock') return 'INVENTORY';
    if (raw === 'outstanding' || raw === 'khata') return 'OUTSTANDING';
    if (raw === 'scanners' || raw === 'scan' || raw === 'ocr') return 'SCANNERS';
    return 'STORE';
  };

  const [activeGroupTab, setActiveGroupTab] = useState<BazaarGroupTab>(getInitialTab());

  useEffect(() => {
    if (searchParams.tab) {
      setActiveGroupTab(getInitialTab());
    }
  }, [searchParams.tab]);

  // Storefront Specific States
  const [activeCat, setActiveCat] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const totalCartCount = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  }, [cart]);

  const categories = useMemo(() => {
    const cats = Array.from(new Set(products.map((p) => p.category)));
    return ['All', ...cats];
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchCat = activeCat === 'All' || p.category === activeCat;
      const matchQuery =
        !searchQuery.trim() ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.barcode && p.barcode.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchCat && matchQuery && p.active;
    });
  }, [products, activeCat, searchQuery]);

  const handleAddToCart = (item: ProductItem) => {
    if (item.type === 'STOCK' && item.stockQuantity <= 0) {
      showToast('⚠️ ' + item.name + ' is Out of Stock');
      return;
    }
    addToCart(item, 1);
    showToast('✓ Added ' + item.name + ' to cart');
  };

  const renderProduct = ({ item }: { item: ProductItem }) => {
    const isOut = item.type === 'STOCK' && item.stockQuantity === 0;
    const isLow = item.type === 'STOCK' && item.stockQuantity <= item.reorderLevel;

    return (
      <View style={[styles.productCard, isOut && styles.productCardOut]}>
        <Text style={styles.productEmoji}>{item.emoji}</Text>
        <Text style={styles.productName} numberOfLines={2}>
          {item.name}
        </Text>

        <View style={styles.priceRow}>
          <Text style={styles.productPrice}>₹{item.price}</Text>
          <Text style={styles.unitText}>/{item.unit}</Text>
        </View>

        {/* Stock status indicator */}
        <View style={styles.stockBadgeWrap}>
          {item.type === 'NON_STOCK' ? (
            <View style={styles.badgeNonStock}>
              <Text style={styles.badgeNonStockText}>⚡ Fresh / Loose</Text>
            </View>
          ) : isOut ? (
            <View style={styles.badgeOut}>
              <Text style={styles.badgeOutText}>Out of Stock</Text>
            </View>
          ) : isLow ? (
            <View style={styles.badgeLow}>
              <Text style={styles.badgeLowText}>{item.stockQuantity} left</Text>
            </View>
          ) : (
            <View style={styles.badgeIn}>
              <Text style={styles.badgeInText}>In Stock</Text>
            </View>
          )}
        </View>

        <TouchableOpacity
          style={[styles.addBtn, isOut && styles.addBtnDisabled]}
          onPress={() => handleAddToCart(item)}
          disabled={isOut}
          activeOpacity={0.8}
        >
          <Ionicons
            name={isOut ? 'close-circle' : 'add'}
            size={16}
            color={isOut ? '#94A3B8' : '#1B4FD8'}
            style={{ marginRight: 2 }}
          />
          <Text style={[styles.addBtnText, isOut && { color: '#94A3B8' }]}>
            {isOut ? 'Unavailable' : 'Add to Cart'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* 1. Persistent Top Bazaar Group Navigation Header */}
      <BazaarGroupHeader
        activeTab={activeGroupTab}
        onSelectTab={setActiveGroupTab}
      />

      {/* Floating Toast Notice */}
      {toastMessage && (
        <View style={styles.toastBox}>
          <Ionicons name="checkmark-circle" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
          <Text style={styles.toastText}>{toastMessage}</Text>
        </View>
      )}

      {/* ========================================================= */}
      {/* 2. GROUP VIEW: STORE CATALOG                              */}
      {/* ========================================================= */}
      {activeGroupTab === 'STORE' && (
        <View style={{ flex: 1 }}>
          {/* Header Search & Cart Shortcut */}
          <View style={styles.header}>
            <View style={styles.searchBar}>
              <Ionicons name="search" size={18} color="#9CA3AF" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search fresh groceries, dairy, pantry..."
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Ionicons name="close-circle" size={18} color="#9CA3AF" />
                </TouchableOpacity>
              )}
            </View>

            <TouchableOpacity
              style={styles.cartIcon}
              onPress={() => setActiveGroupTab('POS_CART')}
              activeOpacity={0.8}
            >
              <Ionicons name="cart-outline" size={24} color="#111827" />
              {totalCartCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{totalCartCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Quick Group Shortcuts Banner */}
          <View style={styles.shortcutsStrip}>
            <TouchableOpacity
              style={[styles.shortcutChip, { backgroundColor: '#EDE9FE' }]}
              onPress={() => setActiveGroupTab('POS_CART')}
            >
              <Ionicons name="flash" size={13} color="#7C3AED" />
              <Text style={[styles.shortcutText, { color: '#6D28D9' }]}>
                Cashier POS Terminal
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.shortcutChip, { backgroundColor: '#EFF6FF' }]}
              onPress={() => setActiveGroupTab('INVENTORY')}
            >
              <Ionicons name="cube" size={13} color="#2563EB" />
              <Text style={[styles.shortcutText, { color: '#1D4ED8' }]}>
                Stock & Excel Hub
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.shortcutChip, { backgroundColor: '#FEF3C7' }]}
              onPress={() => setActiveGroupTab('OUTSTANDING')}
            >
              <Ionicons name="wallet" size={13} color="#D97706" />
              <Text style={[styles.shortcutText, { color: '#B45309' }]}>
                Khata Dues
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.shortcutChip, { backgroundColor: '#F1F5F9' }]}
              onPress={() => setActiveGroupTab('SCANNERS')}
            >
              <Ionicons name="scan" size={13} color="#475569" />
              <Text style={[styles.shortcutText, { color: '#334155' }]}>
                Smart Scan
              </Text>
            </TouchableOpacity>
          </View>

          {/* Categories Filter Strip */}
          <View style={styles.categoriesWrap}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.catScroll}
            >
              {categories.map((item) => (
                <TouchableOpacity
                  key={item}
                  style={[styles.catChip, activeCat === item && styles.catChipActive]}
                  onPress={() => setActiveCat(item)}
                >
                  <Text
                    style={[
                      styles.catText,
                      activeCat === item && styles.catTextActive,
                    ]}
                  >
                    {item}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Product Grid List */}
          <FlatList
            data={filteredProducts}
            keyExtractor={(item) => item.id}
            renderItem={renderProduct}
            numColumns={2}
            contentContainerStyle={styles.gridList}
            columnWrapperStyle={{ gap: 12 }}
            ListEmptyComponent={
              <View style={styles.emptyWrap}>
                <Ionicons name="cart-outline" size={48} color="#CBD5E1" />
                <Text style={styles.emptyText}>No products matching your search</Text>
              </View>
            }
          />

          {/* Floating Bottom Cart Bar */}
          {totalCartCount > 0 && (
            <TouchableOpacity
              style={styles.fab}
              onPress={() => setActiveGroupTab('POS_CART')}
              activeOpacity={0.85}
            >
              <Ionicons name="cart" size={22} color="#FFFFFF" />
              <Text style={styles.fabText}>View Cart ({totalCartCount} items)</Text>
              <Ionicons name="arrow-forward" size={18} color="#FFFFFF" style={{ marginLeft: 6 }} />
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* ========================================================= */}
      {/* 3. GROUP VIEW: POS & CART TERMINAL                         */}
      {/* ========================================================= */}
      {activeGroupTab === 'POS_CART' && (
        <View style={{ flex: 1 }}>
          <CombinedBazaarScreen
            embedded={true}
            initialMode={searchParams.mode === 'pos' ? 'pos' : 'cart'}
          />
        </View>
      )}

      {/* ========================================================= */}
      {/* 4. GROUP VIEW: INVENTORY & EXCEL HUB                       */}
      {/* ========================================================= */}
      {activeGroupTab === 'INVENTORY' && (
        <View style={{ flex: 1 }}>
          <InventoryScreen embedded={true} />
        </View>
      )}

      {/* ========================================================= */}
      {/* 5. GROUP VIEW: OUTSTANDING GOODS & KHATA                   */}
      {/* ========================================================= */}
      {activeGroupTab === 'OUTSTANDING' && (
        <View style={{ flex: 1 }}>
          <OutstandingScreen embedded={true} />
        </View>
      )}

      {/* ========================================================= */}
      {/* 6. GROUP VIEW: SMART SCANNERS (BARCODE & OCR)              */}
      {/* ========================================================= */}
      {activeGroupTab === 'SCANNERS' && (
        <View style={{ flex: 1 }}>
          <BazaarScannersView
            onNavigateToCart={() => setActiveGroupTab('POS_CART')}
            onAddToCartSuccess={(name) => showToast(`✓ Added ${name} to cart!`)}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  toastBox: {
    position: 'absolute',
    top: 90,
    left: 20,
    right: 20,
    zIndex: 999,
    backgroundColor: '#0F172A',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  toastText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 40,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: '#1E293B',
  },
  cartIcon: {
    position: 'relative',
    padding: 6,
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  shortcutsStrip: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
    gap: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  shortcutChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 6,
    borderRadius: 8,
    gap: 4,
  },
  shortcutText: {
    fontSize: 11,
    fontWeight: '700',
  },
  categoriesWrap: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  catScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  catChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
  },
  catChipActive: {
    backgroundColor: '#1D4ED8',
  },
  catText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
  },
  catTextActive: {
    color: '#FFFFFF',
  },
  gridList: {
    padding: 16,
    paddingBottom: 80,
  },
  productCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  productCardOut: {
    opacity: 0.6,
  },
  productEmoji: {
    fontSize: 38,
    marginBottom: 6,
  },
  productName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E293B',
    textAlign: 'center',
    marginBottom: 4,
    height: 34,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 6,
  },
  productPrice: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  unitText: {
    fontSize: 11,
    color: '#64748B',
    marginLeft: 2,
  },
  stockBadgeWrap: {
    marginBottom: 10,
    width: '100%',
    alignItems: 'center',
  },
  badgeNonStock: {
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeNonStockText: {
    fontSize: 10,
    color: '#0369A1',
    fontWeight: '600',
  },
  badgeOut: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeOutText: {
    fontSize: 10,
    color: '#DC2626',
    fontWeight: '600',
  },
  badgeLow: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeLowText: {
    fontSize: 10,
    color: '#D97706',
    fontWeight: '600',
  },
  badgeIn: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeInText: {
    fontSize: 10,
    color: '#15803D',
    fontWeight: '600',
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    width: '100%',
  },
  addBtnDisabled: {
    backgroundColor: '#F1F5F9',
    borderColor: '#E2E8F0',
  },
  addBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1D4ED8',
  },
  emptyWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 14,
    color: '#94A3B8',
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: '#1D4ED8',
    borderRadius: 28,
    paddingVertical: 14,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  fabText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});
