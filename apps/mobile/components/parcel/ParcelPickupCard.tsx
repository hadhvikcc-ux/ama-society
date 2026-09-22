import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Share,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useParcelStore, GateParcel, COURIER_ICONS } from '../../stores/parcelStore';
import { BentoTile } from '../ui/BentoTile';

interface ParcelPickupCardProps {
  flatNumber: string;
}

export const ParcelPickupCard: React.FC<ParcelPickupCardProps> = ({ flatNumber }) => {
  const { getParcelsForFlat } = useParcelStore();
  const flatParcels = getParcelsForFlat(flatNumber);
  const pendingParcels = flatParcels.filter((p) => p.status === 'HELD_AT_GATE');

  if (pendingParcels.length === 0) return null;

  const latest = pendingParcels[0];
  const courierInfo = COURIER_ICONS[latest.courier] || { emoji: '📦', color: '#475569', bg: '#F1F5F9' };

  const handleSharePin = async () => {
    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
      } catch (e) {}
    }

    const message = `📦 AMA Society Gate Parcel Pickup PIN\n\nCourier: ${latest.courier}\nUnit: ${latest.flatNumber}\nPackages: ${latest.itemCount}\nGate Pickup PIN: 👉 ${latest.pickupPin} 👈\n\nPlease show this PIN to the Main Gate Security Guard to collect the delivery.`;

    try {
      await Share.share({ message });
    } catch (e) {}
  };

  return (
    <BentoTile color="cream" style={styles.tile}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <View style={[styles.courierIconBox, { backgroundColor: courierInfo.bg }]}>
            <Text style={{ fontSize: 20 }}>{courierInfo.emoji}</Text>
          </View>
          <View>
            <Text style={styles.badgeText}>HELD AT MAIN GATE DESK</Text>
            <Text style={styles.titleText}>
              {pendingParcels.length === 1
                ? `${latest.courier} Delivery`
                : `${pendingParcels.length} Deliveries Waiting`}
            </Text>
          </View>
        </View>

        <View style={styles.countBadge}>
          <Text style={styles.countBadgeText}>{pendingParcels.length} pkg</Text>
        </View>
      </View>

      <Text style={styles.notesText} numberOfLines={2}>
        {latest.notes || `Received at Main Gate entrance. Verify PIN to collect.`}
      </Text>

      {/* PIN Box */}
      <View style={styles.pinContainer}>
        <View style={styles.pinLeft}>
          <Text style={styles.pinLabel}>4-DIGIT GATE PICKUP PIN</Text>
          <Text style={styles.pinValue}>{latest.pickupPin}</Text>
        </View>

        <TouchableOpacity style={styles.shareBtn} onPress={handleSharePin} activeOpacity={0.8}>
          <Ionicons name="share-social-outline" size={16} color="#4338CA" />
          <Text style={styles.shareBtnText}>Share PIN</Text>
        </TouchableOpacity>
      </View>
    </BentoTile>
  );
};

const styles = StyleSheet.create({
  tile: {
    marginVertical: 6,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  courierIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#B45309',
    letterSpacing: 0.5,
  },
  titleText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  countBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  countBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#B45309',
  },
  notesText: {
    fontSize: 13,
    color: '#475569',
    marginBottom: 12,
    lineHeight: 18,
  },
  pinContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  pinLeft: {
    flex: 1,
  },
  pinLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  pinValue: {
    fontSize: 22,
    fontWeight: '900',
    color: '#4338CA',
    letterSpacing: 4,
    marginTop: 2,
  },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  shareBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4338CA',
  },
});
