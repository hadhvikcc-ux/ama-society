import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { MessageBubble } from '../../components/chat/MessageBubble';
import { TicketCard } from '../../components/tickets/TicketCard';

export default function TagTimelineScreen() {
  const { tag } = useLocalSearchParams();

  // Mock timeline items
  const timelineItems = [
    {
      id: '1',
      entityType: 'CHAT',
      data: {
        id: 'c1',
        content: `Yes, it was near the #${tag} lot this morning.`,
        senderName: 'Priya (A-102)',
        createdAt: new Date(Date.now() - 3000000).toISOString(),
        isMine: false,
      },
    },
    {
      id: '2',
      entityType: 'TICKET',
      data: {
        id: 't1',
        category: 'Other',
        priority: 'MEDIUM',
        status: 'OPEN',
        description: `Lights are out in the #${tag} area.`,
        createdAt: new Date(Date.now() - 86400000).toISOString(),
      },
    }
  ];

  const renderItem = ({ item }: { item: any }) => {
    switch (item.entityType) {
      case 'CHAT':
        return (
          <View style={styles.itemWrapper}>
            <View style={styles.iconWrapper}>
              <Ionicons name="chatbubble-outline" size={16} color="#6B7280" />
            </View>
            <View style={styles.contentWrapper}>
              <MessageBubble message={item.data} />
            </View>
          </View>
        );
      case 'TICKET':
        return (
          <View style={styles.itemWrapper}>
            <View style={styles.iconWrapper}>
              <Ionicons name="build-outline" size={16} color="#6B7280" />
            </View>
            <View style={styles.contentWrapper}>
              <TicketCard ticket={item.data} />
            </View>
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>#{tag}</Text>
        <Text style={styles.subtitle}>Timeline across AMA</Text>
      </View>

      <View style={styles.analyticsCard}>
        <View style={styles.analyticsStat}>
          <Text style={styles.statLabel}>Mentions this month</Text>
          <Text style={styles.statValue}>14</Text>
        </View>
        <View style={styles.analyticsTrend}>
          <Ionicons name="trending-up" size={24} color="#10B981" />
          <Text style={styles.trendText}>+3 from last month</Text>
        </View>
      </View>

      <FlatList
        data={timelineItems}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1B4FD8',
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  analyticsCard: {
    margin: 16,
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  analyticsStat: {
    flex: 1,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  analyticsTrend: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  trendText: {
    color: '#059669',
    fontSize: 12,
    fontWeight: '600',
  },
  list: {
    padding: 16,
  },
  itemWrapper: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  iconWrapper: {
    width: 32,
    alignItems: 'center',
    paddingTop: 8,
  },
  contentWrapper: {
    flex: 1,
  },
});
