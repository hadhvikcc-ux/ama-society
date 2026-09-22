import React from 'react';
import { View, Text, StyleSheet, Pressable, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatDistanceToNow } from 'date-fns';

export interface Ticket {
  id: string;
  category: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: 'OPEN' | 'ASSIGNED' | 'IN_PROGRESS' | 'PENDING_VERIFICATION' | 'CLOSED';
  description: string;
  createdAt: string;
  attachments?: any[];
}

interface TicketCardProps {
  ticket: Ticket;
  onPress?: () => void;
}

const getCategoryIcon = (category: string) => {
  switch (category.toLowerCase()) {
    case 'plumbing': return 'water-outline';
    case 'electrical': return 'flash-outline';
    case 'garbage': return 'trash-outline';
    case 'road': return 'car-outline';
    case 'pest control': return 'bug-outline';
    default: return 'help-circle-outline';
  }
};

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'LOW': return '#10B981'; // Green
    case 'MEDIUM': return '#F59E0B'; // Yellow
    case 'HIGH': return '#EF4444'; // Red
    case 'URGENT': return '#991B1B'; // Dark Red
    default: return '#6B7280'; // Gray
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'OPEN': return '#3B82F6';
    case 'IN_PROGRESS': return '#8B5CF6';
    case 'PENDING_VERIFICATION': return '#F59E0B';
    case 'CLOSED': return '#10B981';
    default: return '#6B7280';
  }
};

export const TicketCard: React.FC<TicketCardProps> = ({ ticket, onPress }) => {
  const images = (ticket.attachments || []).filter((a: any) => a.type === 'IMAGE' && a.uri);

  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.header}>
        <View style={styles.categoryContainer}>
          <Ionicons name={getCategoryIcon(ticket.category) as any} size={20} color="#4B5563" />
          <Text style={styles.categoryText}>{ticket.category}</Text>
          <View style={styles.idBadge}>
            <Text style={styles.idBadgeText}>#{ticket.id}</Text>
          </View>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(ticket.status) + '20' }]}>
          <Text style={[styles.statusText, { color: getStatusColor(ticket.status) }]}>
            {ticket.status.replace('_', ' ')}
          </Text>
        </View>
      </View>
      <View style={styles.content}>
        <View style={styles.priorityContainer}>
          <View style={[styles.priorityDot, { backgroundColor: getPriorityColor(ticket.priority) }]} />
          <Text style={styles.priorityText}>{ticket.priority}</Text>
        </View>
        <Text style={styles.description} numberOfLines={2}>
          {ticket.description}
        </Text>
      </View>

      {images.length > 0 && (
        <View style={styles.photoAttachedStrip}>
          <View style={styles.photoAttachedThumbWrapper}>
            <Image source={{ uri: images[0].uri }} style={styles.photoAttachedThumb} resizeMode="cover" />
            <View style={styles.photoAttachedBadge}>
              <Text style={styles.photoAttachedBadgeText}>HD</Text>
            </View>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.photoAttachedLabel}>
              📸 {images.length} {images.length === 1 ? 'High-Res Photo' : 'High-Res Photos'} Attached
            </Text>
            <Text style={styles.photoAttachedName} numberOfLines={1}>
              {images[0].name}
            </Text>
          </View>
        </View>
      )}

      <View style={styles.footer}>
        <Text style={styles.dateText}>
          {formatDistanceToNow(new Date(ticket.createdAt), { addSuffix: true })}
        </Text>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  categoryText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    textTransform: 'capitalize',
  },
  idBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  idBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1D4ED8',
    letterSpacing: 0.5,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  content: {
    marginBottom: 12,
  },
  priorityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  priorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  priorityText: {
    fontSize: 12,
    color: '#4B5563',
    fontWeight: '500',
  },
  description: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
  },
  photoAttachedStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F7FF',
    borderWidth: 1,
    borderColor: '#DBEAFE',
    borderRadius: 8,
    padding: 6,
    marginBottom: 10,
    gap: 8,
  },
  photoAttachedThumbWrapper: {
    width: 36,
    height: 36,
    borderRadius: 6,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#E2E8F0',
  },
  photoAttachedThumb: {
    width: '100%',
    height: '100%',
  },
  photoAttachedBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: '#1D4ED8',
    borderRadius: 3,
    paddingHorizontal: 3,
    paddingVertical: 1,
  },
  photoAttachedBadgeText: {
    fontSize: 6,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  photoAttachedLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1D4ED8',
  },
  photoAttachedName: {
    fontSize: 10,
    color: '#4B5563',
    marginTop: 1,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  dateText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
});
