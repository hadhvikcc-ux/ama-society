import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LogoutConfirmModal } from '../../components/ui/LogoutConfirmModal';
import { useAuthStore } from '../../stores/authStore';
import { useSocietyStore } from '../../stores/societyStore';
import { BentoGrid, BentoRow } from '../../components/ui/BentoGrid';
import { BentoTile, BentoTileColor } from '../../components/ui/BentoTile';
import { useResponsive } from '../../hooks/useResponsive';
import { PendingApprovalsTile } from '../../components/admin/PendingApprovalsTile';
import { RoleRequestsBanner } from '../../components/admin/RoleRequestsBanner';

export default function AdminDashboard() {
  const router = useRouter();
  const { containerPadding, tileGap, isPhone } = useResponsive();
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
    { id: '4b', title: 'Member Roles', icon: 'people-circle', route: '/(admin)/members' },
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

  const statColors: BentoTileColor[] = ['powder', 'sage', 'lavender', 'cream'];

  return (
    <View style={{ flex: 1, backgroundColor: '#F1F3F9' }}>
      <ScrollView style={styles.container} contentContainerStyle={{ padding: containerPadding, paddingBottom: 32 }}>
        <BentoGrid>
          <BentoRow weights={[2, 1]}>
            <View style={styles.hero}>
              <View style={styles.heroTop}>
                <View style={{ flex: 1, marginRight: 12 }}>
                  <Text style={styles.heroTitle}>
                    Good Morning, {user?.name ? user.name.split(' ')[0] : 'President'} 👑
                  </Text>
                  <Text style={styles.heroSubtitle}>
                    {user?.committeePosition || 'RWA President'} • {user?.societyName || 'Orchid Towers'} • {new Date().toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' })}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => setLogoutModalVisible(true)} activeOpacity={0.8} accessibilityLabel="Log Out">
                  <View style={styles.adminLogoutBtn}>
                    <Ionicons name="log-out-outline" size={18} color="#FFFFFF" />
                    <Text style={styles.adminLogoutText}>Logout</Text>
                  </View>
                </TouchableOpacity>
              </View>
              {/^[A-Z]+-\d{3,}$/.test(user?.societyCode ?? '') && (
                <View style={styles.societyCodeChip}>
                  <Ionicons name="key" size={16} color="#1B4FD8" />
                  <Text style={styles.societyCodeText}>
                    Society code <Text style={{ fontWeight: '800' }}>{user?.societyCode}</Text> — share it with residents so they can sign up
                  </Text>
                </View>
              )}
            </View>

            <BentoTile color="rose" style={{ flexGrow: 1, justifyContent: 'space-between' }} onPress={() => router.push('/(admin)/tickets')} accessibilityLabel="View urgent tickets">
              <Ionicons name="warning" size={26} color="#881337" />
              <View>
                <Text style={styles.alertValue}>3</Text>
                <Text style={styles.alertText}>Urgent tickets pending</Text>
                <Text style={styles.alertLink}>Tap to view →</Text>
              </View>
            </BentoTile>
          </BentoRow>

          <RoleRequestsBanner />
          <PendingApprovalsTile />

          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: tileGap }}>
            {stats.map((stat, i) => (
              <BentoTile key={stat.id} color={statColors[i % statColors.length]} style={{ flexGrow: 1, flexBasis: isPhone ? '45%' : '22%' }}>
                <View style={styles.statHeader}>
                  <Ionicons name={stat.icon as any} size={24} color={stat.color} />
                  {stat.trend === 'up' && <Ionicons name="arrow-up" size={16} color="#16A34A" />}
                </View>
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statTitle}>{stat.title}</Text>
                <Text style={styles.statSubtitle}>{stat.subtitle}</Text>
              </BentoTile>
            ))}
          </View>

          <BentoRow weights={[1.2, 1]}>
            <BentoTile style={{ flexGrow: 1 }}>
              <Text style={styles.sectionTitle}>Quick actions</Text>
              <View style={styles.actionsGrid}>
                {quickActions.map((action) => (
                  <TouchableOpacity key={action.id} style={styles.actionButton} onPress={() => action.route !== '/' && router.push(action.route as any)}>
                    <View style={styles.actionIcon}>
                      <Ionicons name={action.icon as any} size={22} color="#1B4FD8" />
                    </View>
                    <Text style={styles.actionText}>{action.title}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </BentoTile>

            <BentoTile style={{ flexGrow: 1 }}>
              <Text style={styles.sectionTitle}>Recent activity</Text>
              {recentActivity.map((activity) => (
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
            </BentoTile>
          </BentoRow>
        </BentoGrid>
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
  container: { flex: 1, backgroundColor: '#F1F3F9' },
  hero: { flexGrow: 1, backgroundColor: '#1B4FD8', borderRadius: 24, padding: 24, gap: 16, justifyContent: 'space-between' },
  heroTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  heroTitle: { fontSize: 26, fontWeight: '800', color: '#FFFFFF', marginBottom: 8 },
  heroSubtitle: { fontSize: 14, color: '#DBEAFE' },
  societyCodeChip: { flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-start', backgroundColor: '#FFFFFF', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 14 },
  societyCodeText: { color: '#1E3A8A', fontSize: 13, fontWeight: '600' },
  adminLogoutBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(239, 68, 68, 0.9)', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12 },
  adminLogoutText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  alertValue: { fontSize: 36, fontWeight: '800', color: '#881337', marginTop: 12 },
  alertText: { color: '#881337', fontWeight: '700', fontSize: 15 },
  alertLink: { color: '#9F1239', fontSize: 13, marginTop: 6 },
  statHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  statValue: { fontSize: 28, fontWeight: '800', color: '#111827', marginBottom: 4 },
  statTitle: { fontSize: 14, color: '#374151', fontWeight: '600', marginBottom: 4 },
  statSubtitle: { fontSize: 12, color: '#6B7280' },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#111827', marginBottom: 14 },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  actionButton: { alignItems: 'center', width: 84, paddingVertical: 10, borderRadius: 16, backgroundColor: '#F6F4FE' },
  actionIcon: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center', marginBottom: 6 },
  actionText: { fontSize: 12, color: '#374151', fontWeight: '600', textAlign: 'center' },
  activityItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  activityIcon: { width: 40, height: 40, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  activityContent: { flex: 1 },
  activityTitle: { fontSize: 15, fontWeight: '700', color: '#111827' },
  activityDesc: { fontSize: 13, color: '#6B7280' },
  activityTime: { fontSize: 12, color: '#9CA3AF' },
});
