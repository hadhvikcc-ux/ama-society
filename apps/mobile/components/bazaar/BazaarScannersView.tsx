import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useBazaarStore, ProductItem } from '../../stores/bazaarStore';
import { UniversalCameraView } from '../camera/UniversalCameraView';

interface BazaarScannersViewProps {
  onAddToCartSuccess?: (productName: string) => void;
  onNavigateToCart?: () => void;
}

export function BazaarScannersView({
  onAddToCartSuccess,
  onNavigateToCart,
}: BazaarScannersViewProps) {
  const { products, addToCart } = useBazaarStore();

  const [activeScannerMode, setActiveScannerMode] = useState<'BARCODE' | 'OCR'>('BARCODE');
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  // Barcode State
  const [manualBarcode, setManualBarcode] = useState('');
  const [matchedProduct, setMatchedProduct] = useState<ProductItem | null>(null);
  const [barcodeNotFound, setBarcodeNotFound] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // OCR Grocery List State
  const [ocrProcessing, setOcrProcessing] = useState(false);
  const [ocrItems, setOcrItems] = useState<
    Array<{
      id: string;
      rawText: string;
      matchedProduct?: ProductItem;
      quantity: number;
      selected: boolean;
    }>
  >([]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Quick lookup barcode
  const handleLookupBarcode = (code: string) => {
    const trimmed = code.trim();
    if (!trimmed) return;

    const found = products.find(
      (p) => p.barcode && p.barcode.toLowerCase() === trimmed.toLowerCase()
    );

    if (found) {
      setMatchedProduct(found);
      setBarcodeNotFound(false);
      showToast(`✓ Scanned: ${found.name}`);
    } else {
      setMatchedProduct(null);
      setBarcodeNotFound(true);
      showToast(`⚠️ No product found for barcode: ${trimmed}`);
    }
  };

  const handleAddScannedToCart = (item: ProductItem) => {
    if (item.type === 'STOCK' && item.stockQuantity <= 0) {
      showToast(`⚠️ ${item.name} is currently out of stock!`);
      return;
    }
    addToCart(item, 1);
    showToast(`✓ Added 1x ${item.name} to Mart Cart!`);
    if (onAddToCartSuccess) onAddToCartSuccess(item.name);
  };

  // OCR List Simulation & Matching
  const handleSimulateOcrGroceryList = (scenario: 'DAILY' | 'BREAKFAST' | 'VEGETABLES') => {
    setOcrProcessing(true);
    setTimeout(() => {
      let rawList: Array<{ text: string; defaultQty: number }> = [];
      if (scenario === 'DAILY') {
        rawList = [
          { text: 'Amul Milk 1L', defaultQty: 2 },
          { text: 'Aashirvaad Atta 5kg', defaultQty: 1 },
          { text: 'Tata Salt 1kg', defaultQty: 1 },
          { text: 'Farm Eggs 12', defaultQty: 1 },
        ];
      } else if (scenario === 'BREAKFAST') {
        rawList = [
          { text: 'Bread', defaultQty: 1 },
          { text: 'Amul Butter', defaultQty: 1 },
          { text: 'Eggs', defaultQty: 1 },
          { text: 'Bananas 1kg', defaultQty: 1 },
        ];
      } else {
        rawList = [
          { text: 'Tomatoes 1kg', defaultQty: 2 },
          { text: 'Potatoes 2kg', defaultQty: 1 },
          { text: 'Onions 1kg', defaultQty: 2 },
          { text: 'Coriander Bunch', defaultQty: 1 },
        ];
      }

      const parsed = rawList.map((item, index) => {
        // Find best match in catalog
        const found = products.find(
          (p) =>
            p.name.toLowerCase().includes(item.text.toLowerCase()) ||
            item.text.toLowerCase().includes(p.name.toLowerCase().split(' ')[0])
        );

        return {
          id: `ocr-${index}-${Date.now()}`,
          rawText: item.text,
          matchedProduct: found,
          quantity: item.defaultQty,
          selected: true,
        };
      });

      setOcrItems(parsed);
      setOcrProcessing(false);
      showToast(`✓ Digitized ${parsed.length} grocery items from note!`);
    }, 1000);
  };

  const handleToggleOcrItem = (id: string) => {
    setOcrItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, selected: !item.selected } : item))
    );
  };

  const handleChangeOcrQty = (id: string, delta: number) => {
    setOcrItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const nextQty = Math.max(1, item.quantity + delta);
          return { ...item, quantity: nextQty };
        }
        return item;
      })
    );
  };

  const handleAddAllSelectedOcrItems = () => {
    const selected = ocrItems.filter((i) => i.selected && i.matchedProduct);
    if (selected.length === 0) {
      showToast('⚠️ No matched items selected to add.');
      return;
    }

    selected.forEach((i) => {
      if (i.matchedProduct) {
        addToCart(i.matchedProduct, i.quantity);
      }
    });

    showToast(`🎉 Added ${selected.length} items to Mart Cart!`);
    if (onNavigateToCart) {
      setTimeout(() => onNavigateToCart(), 800);
    }
  };

  // Demo SKU chips for instant barcode testing
  const DEMO_BARCODES = [
    { label: '🥛 Amul Milk 1L', code: '8901233024891' },
    { label: '🌾 Atta 5kg', code: '8901030383829' },
    { label: '🌻 Fortune Oil 1L', code: '8901491101839' },
    { label: '🧂 Tata Salt 1kg', code: '8906001020019' },
    { label: '🍞 Whole Wheat Bread', code: '8902001004128' },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Toast */}
      {toastMessage && (
        <View style={styles.toastBox}>
          <Ionicons name="checkmark-circle" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
          <Text style={styles.toastText}>{toastMessage}</Text>
        </View>
      )}

      {/* Sub-tool Switcher */}
      <View style={styles.modeToggleRow}>
        <TouchableOpacity
          style={[
            styles.modeToggleBtn,
            activeScannerMode === 'BARCODE' && styles.modeToggleBtnActive,
          ]}
          onPress={() => setActiveScannerMode('BARCODE')}
          activeOpacity={0.8}
        >
          <Ionicons
            name="barcode-outline"
            size={18}
            color={activeScannerMode === 'BARCODE' ? '#FFFFFF' : '#475569'}
            style={{ marginRight: 6 }}
          />
          <Text
            style={[
              styles.modeToggleBtnText,
              activeScannerMode === 'BARCODE' && styles.modeToggleBtnTextActive,
            ]}
          >
            Barcode Scanner
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.modeToggleBtn,
            activeScannerMode === 'OCR' && styles.modeToggleBtnActive,
          ]}
          onPress={() => setActiveScannerMode('OCR')}
          activeOpacity={0.8}
        >
          <Ionicons
            name="document-text-outline"
            size={18}
            color={activeScannerMode === 'OCR' ? '#FFFFFF' : '#475569'}
            style={{ marginRight: 6 }}
          />
          <Text
            style={[
              styles.modeToggleBtnText,
              activeScannerMode === 'OCR' && styles.modeToggleBtnTextActive,
            ]}
          >
            Smart List OCR (AI)
          </Text>
        </TouchableOpacity>
      </View>

      {/* ========================================================= */}
      {/* MODE 1: BARCODE SCANNER                                   */}
      {/* ========================================================= */}
      {activeScannerMode === 'BARCODE' && (
        <View>
          {/* Live Camera Viewfinder Card */}
          <View style={styles.viewfinderCard}>
            <View style={styles.cameraViewfinderBox}>
              <UniversalCameraView
                mode="scanner"
                facing="back"
                isActive={activeScannerMode === 'BARCODE'}
                showFlipButton={true}
                onBarcodeScanned={(code) => {
                  setManualBarcode(code);
                  handleLookupBarcode(code);
                }}
                fallbackTitle="Bazaar Barcode Camera"
                style={styles.cameraInnerFeed}
              >
                <View style={styles.barcodeOverlay} pointerEvents="none">
                  <View style={styles.laserRedLine} />
                  <Text style={styles.laserRedHint}>Align barcode within camera frame</Text>
                </View>
              </UniversalCameraView>
            </View>

            {/* Manual / Barcode input */}
            <View style={styles.manualInputWrap}>
              <View style={styles.manualInputRow}>
                <Ionicons name="barcode" size={20} color="#64748B" style={{ marginRight: 8 }} />
                <TextInput
                  style={styles.manualInput}
                  placeholder="Enter or scan barcode number..."
                  value={manualBarcode}
                  onChangeText={setManualBarcode}
                  keyboardType="numeric"
                  onSubmitEditing={() => handleLookupBarcode(manualBarcode)}
                />
                <TouchableOpacity
                  style={styles.lookupBtn}
                  onPress={() => handleLookupBarcode(manualBarcode)}
                >
                  <Text style={styles.lookupBtnText}>Lookup</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Quick Demo Barcodes */}
            <View style={styles.demoSection}>
              <Text style={styles.demoLabel}>Quick Test Barcodes (Click to simulate scan):</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 6 }}>
                <View style={{ flexDirection: 'row', gap: 6 }}>
                  {DEMO_BARCODES.map((item) => (
                    <TouchableOpacity
                      key={item.code}
                      style={styles.demoPill}
                      onPress={() => {
                        setManualBarcode(item.code);
                        handleLookupBarcode(item.code);
                      }}
                    >
                      <Text style={styles.demoPillText}>{item.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>
          </View>

          {/* Scanned Result Card */}
          {matchedProduct && (
            <View style={styles.resultCard}>
              <View style={styles.resultHeader}>
                <Text style={styles.resultEmoji}>{matchedProduct.emoji}</Text>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.resultName}>{matchedProduct.name}</Text>
                  <Text style={styles.resultMeta}>
                    {matchedProduct.category} • Barcode: {matchedProduct.barcode}
                  </Text>
                </View>
                <View style={styles.resultPriceWrap}>
                  <Text style={styles.resultPrice}>₹{matchedProduct.price}</Text>
                  <Text style={styles.resultUnit}>/{matchedProduct.unit}</Text>
                </View>
              </View>

              <View style={styles.resultDetailsRow}>
                <View style={styles.resultDetailBadge}>
                  <Text style={styles.detailBadgeLabel}>Stock Status:</Text>
                  <Text
                    style={[
                      styles.detailBadgeValue,
                      {
                        color:
                          matchedProduct.type === 'NON_STOCK'
                            ? '#0284C7'
                            : matchedProduct.stockQuantity > matchedProduct.reorderLevel
                            ? '#16A34A'
                            : '#DC2626',
                      },
                    ]}
                  >
                    {matchedProduct.type === 'NON_STOCK'
                      ? '⚡ Fresh / Loose'
                      : `${matchedProduct.stockQuantity} units available`}
                  </Text>
                </View>

                {matchedProduct.storageLocation && (
                  <View style={styles.resultDetailBadge}>
                    <Text style={styles.detailBadgeLabel}>Location:</Text>
                    <Text style={styles.detailBadgeValue}>{matchedProduct.storageLocation}</Text>
                  </View>
                )}
              </View>

              <View style={styles.resultActions}>
                <TouchableOpacity
                  style={styles.addCartBtn}
                  onPress={() => handleAddScannedToCart(matchedProduct)}
                  activeOpacity={0.85}
                >
                  <Ionicons name="cart" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                  <Text style={styles.addCartBtnText}>Add to Mart Cart</Text>
                </TouchableOpacity>

                {onNavigateToCart && (
                  <TouchableOpacity
                    style={styles.viewCartBtn}
                    onPress={onNavigateToCart}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.viewCartBtnText}>View Cart</Text>
                    <Ionicons name="arrow-forward" size={16} color="#1D4ED8" style={{ marginLeft: 4 }} />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}

          {barcodeNotFound && (
            <View style={styles.notFoundCard}>
              <Ionicons name="alert-circle" size={32} color="#DC2626" />
              <View style={{ marginLeft: 10, flex: 1 }}>
                <Text style={styles.notFoundTitle}>Barcode Not Found</Text>
                <Text style={styles.notFoundSub}>
                  This SKU is not currently cataloged. You can add it via the Inventory tab or scan another item.
                </Text>
              </View>
            </View>
          )}
        </View>
      )}

      {/* ========================================================= */}
      {/* MODE 2: OCR GROCERY LIST DIGITIZER                        */}
      {/* ========================================================= */}
      {activeScannerMode === 'OCR' && (
        <View>
          <View style={styles.ocrPromptCard}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Ionicons name="sparkles" size={20} color="#7C3AED" />
              <Text style={styles.ocrPromptTitle}>Smart Grocery Note Reader</Text>
            </View>
            <Text style={styles.ocrPromptSub}>
              Snap a picture of handwritten chits, WhatsApp text lists, or kitchen notes. AMA AI automatically matches them to fresh mart stock!
            </Text>

            <View style={styles.ocrPresetsRow}>
              <Text style={styles.presetsLabel}>Simulate list scan:</Text>
              <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginTop: 6 }}>
                <TouchableOpacity
                  style={styles.presetBtn}
                  onPress={() => handleSimulateOcrGroceryList('DAILY')}
                >
                  <Text style={styles.presetBtnText}>📝 Daily Essentials (Milk, Atta, Salt, Eggs)</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.presetBtn}
                  onPress={() => handleSimulateOcrGroceryList('BREAKFAST')}
                >
                  <Text style={styles.presetBtnText}>🍳 Breakfast List (Bread, Butter, Bananas)</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.presetBtn}
                  onPress={() => handleSimulateOcrGroceryList('VEGETABLES')}
                >
                  <Text style={styles.presetBtnText}>🥦 Fresh Mandi (Tomatoes, Potatoes, Onions)</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {ocrProcessing && (
            <View style={styles.processingCard}>
              <Ionicons name="sync" size={28} color="#7C3AED" />
              <Text style={styles.processingText}>Analyzing handwritten text & matching inventory...</Text>
            </View>
          )}

          {/* Parsed Grocery Items List */}
          {ocrItems.length > 0 && !ocrProcessing && (
            <View style={styles.ocrResultsContainer}>
              <View style={styles.ocrResultsHeader}>
                <Text style={styles.ocrResultsTitle}>Recognized Products ({ocrItems.length})</Text>
                <TouchableOpacity onPress={handleAddAllSelectedOcrItems} style={styles.addAllBtn}>
                  <Ionicons name="cart-outline" size={16} color="#FFFFFF" style={{ marginRight: 4 }} />
                  <Text style={styles.addAllBtnText}>Add All Selected to Cart</Text>
                </TouchableOpacity>
              </View>

              {ocrItems.map((item) => {
                const isMatched = !!item.matchedProduct;
                return (
                  <View
                    key={item.id}
                    style={[
                      styles.ocrItemRow,
                      !item.selected && { opacity: 0.6 },
                    ]}
                  >
                    <TouchableOpacity
                      style={styles.checkboxTouch}
                      onPress={() => handleToggleOcrItem(item.id)}
                    >
                      <Ionicons
                        name={item.selected ? 'checkbox' : 'square-outline'}
                        size={22}
                        color={item.selected ? '#1D4ED8' : '#94A3B8'}
                      />
                    </TouchableOpacity>

                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <Text style={styles.ocrItemRawText}>"{item.rawText}"</Text>
                      {isMatched ? (
                        <View style={styles.matchedTagRow}>
                          <Text style={styles.matchedTagEmoji}>{item.matchedProduct?.emoji}</Text>
                          <Text style={styles.matchedTagName}>
                            {item.matchedProduct?.name} • ₹{item.matchedProduct?.price}/{item.matchedProduct?.unit}
                          </Text>
                        </View>
                      ) : (
                        <Text style={styles.unmatchedText}>⚠️ No catalog match found</Text>
                      )}
                    </View>

                    {/* Quantity Selector */}
                    {isMatched && (
                      <View style={styles.qtyControlRow}>
                        <TouchableOpacity
                          style={styles.qtyBtn}
                          onPress={() => handleChangeOcrQty(item.id, -1)}
                        >
                          <Ionicons name="remove" size={14} color="#334155" />
                        </TouchableOpacity>
                        <Text style={styles.qtyNumber}>{item.quantity}</Text>
                        <TouchableOpacity
                          style={styles.qtyBtn}
                          onPress={() => handleChangeOcrQty(item.id, 1)}
                        >
                          <Ionicons name="add" size={14} color="#334155" />
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          )}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  toastBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    marginBottom: 12,
  },
  toastText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  modeToggleRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  modeToggleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  modeToggleBtnActive: {
    backgroundColor: '#1D4ED8',
    borderColor: '#1D4ED8',
  },
  modeToggleBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  modeToggleBtnTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  viewfinderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
  },
  cameraViewfinderBox: {
    width: '100%',
    height: 240,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#000000',
    borderWidth: 1.5,
    borderColor: '#3B82F6',
    position: 'relative',
  },
  cameraInnerFeed: {
    width: '100%',
    height: '100%',
  },
  barcodeOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  laserRedLine: {
    width: '80%',
    height: 2,
    backgroundColor: '#EF4444',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 6,
    elevation: 4,
  },
  laserRedHint: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 11,
    fontWeight: '700',
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 16,
  },
  viewfinderInner: {
    alignItems: 'center',
    paddingVertical: 14,
  },
  viewfinderTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 10,
  },
  viewfinderSub: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
  },
  manualInputWrap: {
    width: '100%',
    marginTop: 14,
  },
  manualInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 12,
    backgroundColor: '#F8FAFC',
  },
  manualInput: {
    flex: 1,
    height: 42,
    fontSize: 14,
    color: '#0F172A',
  },
  lookupBtn: {
    backgroundColor: '#1D4ED8',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  lookupBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },
  demoSection: {
    width: '100%',
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 12,
  },
  demoLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  demoPill: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
  },
  demoPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1D4ED8',
  },
  resultCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#93C5FD',
    padding: 16,
    marginBottom: 16,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  resultEmoji: {
    fontSize: 32,
  },
  resultName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  resultMeta: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  resultPriceWrap: {
    alignItems: 'flex-end',
  },
  resultPrice: {
    fontSize: 18,
    fontWeight: '800',
    color: '#16A34A',
  },
  resultUnit: {
    fontSize: 10,
    color: '#64748B',
  },
  resultDetailsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 10,
  },
  resultDetailBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  detailBadgeLabel: {
    fontSize: 10,
    color: '#64748B',
  },
  detailBadgeValue: {
    fontSize: 11,
    fontWeight: '700',
  },
  resultActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  addCartBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1D4ED8',
    paddingVertical: 10,
    borderRadius: 8,
  },
  addCartBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  viewCartBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
  },
  viewCartBtnText: {
    color: '#1D4ED8',
    fontWeight: '700',
    fontSize: 13,
  },
  notFoundCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 12,
    padding: 14,
  },
  notFoundTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#991B1B',
  },
  notFoundSub: {
    fontSize: 12,
    color: '#B91C1C',
    marginTop: 2,
  },
  ocrPromptCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    marginBottom: 16,
  },
  ocrPromptTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  ocrPromptSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 6,
    lineHeight: 18,
  },
  ocrPresetsRow: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 10,
  },
  presetsLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  presetBtn: {
    backgroundColor: '#F3E8FF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E9D5FF',
  },
  presetBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#7C3AED',
  },
  processingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAF5FF',
    borderRadius: 12,
    padding: 16,
    gap: 12,
    marginBottom: 16,
  },
  processingText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B21A8',
  },
  ocrResultsContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
  },
  ocrResultsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    marginBottom: 10,
  },
  ocrResultsTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  addAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#059669',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  addAllBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  ocrItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  checkboxTouch: {
    padding: 2,
  },
  ocrItemRawText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    fontStyle: 'italic',
  },
  matchedTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  matchedTagEmoji: {
    fontSize: 14,
  },
  matchedTagName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#16A34A',
  },
  unmatchedText: {
    fontSize: 11,
    color: '#DC2626',
    marginTop: 2,
  },
  qtyControlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 6,
    paddingHorizontal: 4,
    paddingVertical: 2,
    gap: 6,
  },
  qtyBtn: {
    padding: 4,
  },
  qtyNumber: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
});
