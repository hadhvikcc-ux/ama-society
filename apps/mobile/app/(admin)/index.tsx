import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LogoutConfirmModal } from '../../components/ui/LogoutConfirmModal';
import { useAuthStore } from '../../stores/authStore';
import { useSocietyStore } from '../../stores/societyStore';

export default function AdminDashboard() {
  const router = useRouter();
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  const { user } = useAuthStore();
  const { members, totalFlatsCount } = useSocietyStore();

  const ownersCount = members.filter((m) => m.roleCategory === 'owner').length;
  const tenantsCount = members.filter((m) => m.roleCategory === 'tenant').length;
  const staffCount = members.filter(
    (m) =>
      m.roleCategory === 'guard' ||
      m.roleCategory === 'facility_manager' ||
      m.roleCategory === 'technician' ||
      m.roleCategory === 'vendor'
  ).length;

  const stats = [
    { id: '1', title: 'Total Units', value: `${totalFlatsCount}`, subtitle: '16 vacant', icon: 'home', color: '#1B4FD8' },
    {
      id: '2',
      title: 'Reg. Residents',
      value: `${ownersCount + tenantsCount}`,
      subtitle: `${ownersCount} owners • ${tenantsCount} tenants`,
      icon: 'people',
      color: '#16A34A',
      trend: 'up',
    },
    {
      id: '3',
      title: 'Staff & Vendors',
      value: `${staffCount}`,
      subtitle: 'Guards, Techs & Mart',
      icon: 'shield-checkmark',
      color: '#7C3AED',
    },
    { id: '4', title: 'Collection Rate', value: '87%', subtitle: '₹4.5L / ₹5.2L', icon: 'wallet', color: '#D97706' },
  ];

  const quickActions = [
    { id: '1', title: 'Invoices', icon: 'document-text', route: '/(admin)/billing' },
    { id: '2', title: 'Reminders', icon: 'mail', route: '/(admin)/billing' },
    { id: '3', title: 'Intercom', icon: 'call', route: '/directory' },
    { id: '4', title: 'Add Resident', icon: 'person-add', route: '/(admin)/society' },
    { id: '5', title: 'View Ledger', icon: 'bar-chart', route: '/(admin)/billing' },
    { id: '6', title: 'Broadcast', icon: 'megaphone', route: '/' },
    { id: '7', title: 'Export', icon: 'download', route: '/(admin)/reports' },
    ...(user?.role?.toLowerCase() === 'admin'
      ? [{ id: '8', title: 'Test Bot', icon: 'hardware-chip', route: '/test-bot' }]
      : []),
  ];

  const recentActivity = [
    { id: '1', title: 'Invoice Paid', desc: 'Flat A-101 paid ₹4,500', time: '10 mins ago', icon: 'cash', color: '#16A34A' },
    { id: '2', title: 'Ticket Raised', desc: 'Plumbing issue in B-205', time: '1 hour ago', icon: 'construct', color: '#D97706' },
    { id: '3', title: 'Visitor Entry', desc: 'Rahul (Delivery) for C-302', time: '2 hours ago', icon: 'person', color: '#3B82F6' },
    { id: '4', title: 'New Resident', desc: 'Priya Mehta moved to A-404', time: '5 hours ago', icon: 'home', color: '#1B4FD8' },
    { id: '5', title: 'Invoice Paid', desc: 'Flat D-102 paid ₹4,500', time: '1 day ago', icon: 'cash', color: '#16A34A' },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: '#F3F4F6' }}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <View style={{ flex: 1, marginRight: 12 }}>
            <Text style={styles.heroTitle}>
              Good Morning, {user?.name ? user.name.split(' ')[0] : 'President'} 👑
            </Text>
            <Text style={styles.heroSubtitle}>
              {user?.committeePosition || 'RWA President'} • Orchid Towers • {new Date().toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' })}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.adminLogoutBtn}
            onPress={() => setLogoutModalVisible(true)}
            activeOpacity={0.8}
            accessibilityLabel="Log Out"
          >
            <Ionicons name="log-out-outline" size={18} color="#FFFFFF" />
            <Text style={styles.adminLogoutText}>Logout</Text>
          </TouchableOpacity>
        </View>

      <TouchableOpacity style={styles.alertBanner} onPress={() => router.push('/(admin)/tickets')}>
        <Ionicons name="warning" size={24} color="#FFF" />
        <Text style={styles.alertText}>3 Urgent Tickets Pending — Tap to view</Text>
      </TouchableOpacity>

      <View style={styles.statsGrid}>
        {stats.map(stat => (
          <View key={stat.id} style={styles.statCard}>
            <View style={styles.statHeader}>
              <Ionicons name={stat.icon as any} size={24} color={stat.color} />
              {stat.trend === 'up' && <Ionicons name="arrow-up" size={16} color="#16A34A" />}
            </View>
            <Text style={styles.statValue}>{stat.value}</Text>
            <Text style={styles.statTitle}>{stat.title}</Text>
            <Text style={[styles.statSubtitle, stat.color === '#DC2626' && { color: '#DC2626' }]}>{stat.subtitle}</Text>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.actionsScroll}>
          {quickActions.map(action => (
            <TouchableOpacity key={action.id} style={styles.actionButton} onPress={() => action.route !== '/' && router.push(action.route as any)}>
              <View style={styles.actionIcon}>
                <Ionicons name={action.icon as any} size={24} color="#1B4FD8" />
              </View>
              <Text style={styles.actionText}>{action.title}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        <View style={styles.activityList}>
          {recentActivity.map(activity => (
            <View key={activity.id} style={styles.activityItem}>
              <View style={[styles.activityIcon, { backgroundColor: activity.color + '20' }]}>
                <Ionicons name={activity.icon as any} size={20} color={activity.color} />
              </View>
              <View style={styles.activityContent}>
                <Text style={styles.activityTitle}>{activity.title}</Text>
                <Text style={styles.activityDesc}>{activity.desc}</Text>
              </View>
              <Text style={styles.activityTime}>{activity.time}</Text>
            </View>
          ))}
        </View>
      </View>
      </ScrollView>

      {/* Logout Confirmation Modal */}
      <LogoutConfirmModal
        visible={logoutModalVisible}
        onClose={() => setLogoutModalVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  content: { paddingBottom: 24 },
  hero: { backgroundColor: '#1B4FD8', padding: 24, paddingTop: 40, borderBottomLeftRadius: 24, borderBottomRightRadius: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  heroTitle: { fontSize: 24, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 8 },
  heroSubtitle: { fontSize: 14, color: '#E5E7EB' },
  adminLogoutBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(239, 68, 68, 0.9)', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.15, shadowRadius: 2, elevation: 2 },
  adminLogoutText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  alertBanner: { backgroundColor: '#DC2626', margin: 16, borderRadius: 12, padding: 16, flexDirection: 'row', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  alertText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 16, marginLeft: 12 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', padding: 8 },
  statCard: { backgroundColor: '#FFFFFF', width: '45%', margin: '2.5%', borderRadius: 16, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 },
  statHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  statValue: { fontSize: 24, fontWeight: 'bold', color: '#111827', marginBottom: 4 },
  statTitle: { fontSize: 14, color: '#6B7280', marginBottom: 4 },
  statSubtitle: { fontSize: 12, color: '#9CA3AF' },
  section: { padding: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#111827', marginBottom: 16 },
  actionsScroll: { flexDirection: 'row' },
  actionButton: { alignItems: 'center', marginRight: 24 },
  actionIcon: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center', marginBottom: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  actionText: { fontSize: 12, color: '#374151', fontWeight: '500' },
  activityList: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 },
  activityItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  activityIcon: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  activityContent: { flex: 1 },
  activityTitle: { fontSize: 16, fontWeight: '600', color: '#111827' },
  activityDesc: { fontSize: 14, color: '#6B7280' },
  activityTime: { fontSize: 12, color: '#9CA3AF' },
});
