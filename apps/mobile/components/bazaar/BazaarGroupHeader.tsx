import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useBazaarStore } from '../../stores/bazaarStore';

export type BazaarGroupTab = 'STORE' | 'POS_CART' | 'INVENTORY' | 'OUTSTANDING' | 'SCANNERS';

interface BazaarGroupHeaderProps {
  activeTab: BazaarGroupTab;
  onSelectTab?: (tab: BazaarGroupTab) => void;
  showBack?: boolean;
  onBackPress?: () => void;
  compact?: boolean;
}

export function BazaarGroupHeader({
  activeTab,
  onSelectTab,
  showBack = false,
  onBackPress,
  compact = false,
}: BazaarGroupHeaderProps) {
  const router = useRouter();
  const { products, cart, khataAccounts, orders } = useBazaarStore();

  // Dynamic Badge Calculations
  const totalProducts = products.filter((p) => p.active).length;
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const lowStockCount = products.filter(
    (p) => p.type === 'STOCK' && p.active && p.stockQuantity <= p.reorderLevel
  ).length;

  const totalOutstandingDues = Object.values(khataAccounts || {}).reduce(
    (sum, acc) => sum + (acc?.totalOutstanding || 0),
    0
  );

  const handleTabPress = (tab: BazaarGroupTab) => {
    if (onSelectTab) {
      onSelectTab(tab);
    } else {
      // Direct navigation when used on a standalone screen
      switch (tab) {
        case 'STORE':
          router.push('/(resident)/bazaar?tab=store' as any);
          break;
        case 'POS_CART':
          router.push('/(resident)/bazaar/cart' as any);
          break;
        case 'INVENTORY':
          router.push('/(resident)/bazaar/inventory' as any);
          break;
        case 'OUTSTANDING':
          router.push('/(resident)/bazaar/outstanding' as any);
          break;
        case 'SCANNERS':
          router.push('/(resident)/bazaar?tab=scanners' as any);
          break;
      }
    }
  };

  const tabs: Array<{
    key: BazaarGroupTab;
    label: string;
    icon: keyof typeof Ionicons.glyphMap;
    badge?: string | number;
    badgeColor?: string;
    badgeTextColor?: string;
  }> = [
    {
      key: 'STORE',
      label: 'Storefront',
      icon: 'storefront',
      badge: totalProducts > 0 ? `${totalProducts}` : undefined,
      badgeColor: '#EEF2FF',
      badgeTextColor: '#4F46E5',
    },
    {
      key: 'POS_CART',
      label: 'Cart & POS',
      icon: 'flash',
      badge: cartItemCount > 0 ? cartItemCount : undefined,
      badgeColor: '#3B82F6',
      badgeTextColor: '#FFFFFF',
    },
    {
      key: 'INVENTORY',
      label: 'Stock & Excel',
      icon: 'cube',
      badge: lowStockCount > 0 ? `${lowStockCount} low` : undefined,
      badgeColor: '#FEE2E2',
      badgeTextColor: '#DC2626',
    },
    {
      key: 'OUTSTANDING',
      label: 'Khata Dues',
      icon: 'wallet',
      badge: totalOutstandingDues > 0 ? `₹${(totalOutstandingDues / 1000).toFixed(1)}k` : undefined,
      badgeColor: '#FEF3C7',
      badgeTextColor: '#D97706',
    },
    {
      key: 'SCANNERS',
      label: 'Smart Scan',
      icon: 'scan',
      badge: 'AI',
      badgeColor: '#EDE9FE',
      badgeTextColor: '#7C3AED',
    },
  ];

  return (
    <View style={styles.headerContainer}>
      {/* Top Brand Bar */}
      {!compact && (
        <View style={styles.topBrandBar}>
          <View style={styles.brandLeft}>
            {showBack && (
              <TouchableOpacity
                style={styles.backBtn}
                onPress={onBackPress || (() => router.back())}
                activeOpacity={0.7}
              >
                <Ionicons name="arrow-back" size={20} color="#1E293B" />
              </TouchableOpacity>
            )}
            <View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={styles.brandTitle}>AMA Society Bazaar</Text>
                <View style={styles.statusPill}>
                  <View style={styles.statusDot} />
                  <Text style={styles.statusPillText}>Open</Text>
                </View>
              </View>
              <Text style={styles.brandSub}>
                Wing B Ground Floor • Counter 8AM-10PM • Live Synced
              </Text>
            </View>
          </View>

          <View style={styles.brandRight}>
            <View style={styles.quickStat}>
              <Text style={styles.quickStatLabel}>Mart Cart</Text>
              <Text style={styles.quickStatVal}>
                {cartItemCount} {cartItemCount === 1 ? 'item' : 'items'}
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Segmented Group Tabs Navigation Strip */}
      <View style={styles.tabBarWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabScrollContent}
        >
          {tabs.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                style={[
                  styles.groupTabPill,
                  isActive && styles.groupTabPillActive,
                ]}
                onPress={() => handleTabPress(tab.key)}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={tab.icon}
                  size={15}
                  color={isActive ? '#FFFFFF' : '#475569'}
                  style={{ marginRight: 5 }}
                />
                <Text
                  style={[
                    styles.groupTabLabel,
                    isActive && styles.groupTabLabelActive,
                  ]}
                >
                  {tab.label}
                </Text>

                {tab.badge !== undefined && (
                  <View
                    style={[
                      styles.tabBadge,
                      {
                        backgroundColor: isActive
                          ? 'rgba(255,255,255,0.25)'
                          : tab.badgeColor || '#E2E8F0',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.tabBadgeText,
                        {
                          color: isActive
                            ? '#FFFFFF'
                            : tab.badgeTextColor || '#475569',
                        },
                      ]}
                    >
                      {tab.badge}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0 2px 4px rgba(0,0,0,0.04)',
      },
    }),
  },
  topBrandBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 10,
    backgroundColor: '#FFFFFF',
  },
  brandLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  backBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 12,
    gap: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#16A34A',
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#15803D',
  },
  brandSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  brandRight: {
    alignItems: 'flex-end',
  },
  quickStat: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DBEAFE',
    alignItems: 'flex-end',
  },
  quickStatLabel: {
    fontSize: 9,
    fontWeight: '600',
    color: '#3B82F6',
    textTransform: 'uppercase',
  },
  quickStatVal: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1D4ED8',
  },
  tabBarWrapper: {
    backgroundColor: '#F8FAFC',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingVertical: 8,
  },
  tabScrollContent: {
    paddingHorizontal: 12,
    gap: 8,
    alignItems: 'center',
  },
  groupTabPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  groupTabPillActive: {
    backgroundColor: '#1D4ED8',
    borderColor: '#1D4ED8',
  },
  groupTabLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
  },
  groupTabLabelActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  tabBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 6,
  },
  tabBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
});
