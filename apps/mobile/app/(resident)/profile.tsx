import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useAuthStore } from '../../stores/authStore';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { EditProfileModal } from '../../components/profile/EditProfileModal';
import { LegalPolicyModal } from '../../components/legal/LegalPolicyModal';
import { LogoutConfirmModal } from '../../components/ui/LogoutConfirmModal';

export default function ProfileScreen() {
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [legalModalVisible, setLegalModalVisible] = useState(false);
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  const [legalSection, setLegalSection] = useState<'PRIVACY' | 'PAYMENT' | 'TERMS' | 'SECURITY'>('PRIVACY');

  const handleLogout = () => {
    setLogoutModalVisible(true);
  };

  const getInitials = (name?: string) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#F3F4F6' }}>
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{getInitials(user?.name)}</Text>
          </View>
          <Text style={styles.name}>{user?.name || 'Resident Name'}</Text>
          <Text style={styles.flat}>{user?.flatNumber || 'Flat B-204'} • {user?.tower || 'Tower B'}</Text>
          <View style={styles.badgeRow}>
            <View style={styles.roleBadge}>
              <Text style={styles.roleText}>Resident / Owner</Text>
            </View>
            <TouchableOpacity 
              style={styles.editHeaderBtn} 
              onPress={() => setEditModalVisible(true)}
            >
              <Ionicons name="pencil" size={14} color="#FFFFFF" style={{ marginRight: 4 }} />
              <Text style={styles.editHeaderText}>Edit Profile</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.content}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Account</Text>
            <View style={styles.card}>
              <MenuItem 
                icon="person-outline" 
                title="Edit Profile" 
                onPress={() => setEditModalVisible(true)} 
              />
              <MenuItem icon="lock-closed-outline" title="Change Password" />
              <MenuItem icon="notifications-outline" title="Notification Settings" noBorder />
            </View>
          </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Society</Text>
          <View style={styles.card}>
            <MenuItem icon="megaphone-outline" title="View Announcements" onPress={() => router.push('/(resident)/community/announcements')} />
            <MenuItem icon="build-outline" title="Raise Ticket" onPress={() => router.push('/(resident)/tickets/new')} />
            <MenuItem icon="business-outline" title="Facility Bookings" onPress={() => router.push('/(resident)/community/facilities')} noBorder />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Legal & Policies</Text>
          <View style={styles.card}>
            <MenuItem
              icon="shield-checkmark-outline"
              title="Apartment Privacy Policy"
              value="DPDP 2023"
              onPress={() => {
                setLegalSection('PRIVACY');
                setLegalModalVisible(true);
              }}
            />
            <MenuItem
              icon="card-outline"
              title="Payment Policy & Guidelines"
              value="UPI / GPay"
              onPress={() => {
                setLegalSection('PAYMENT');
                setLegalModalVisible(true);
              }}
            />
            <MenuItem
              icon="document-text-outline"
              title="Terms of Service (ToS)"
              onPress={() => {
                setLegalSection('TERMS');
                setLegalModalVisible(true);
              }}
            />
            <MenuItem
              icon="lock-closed-outline"
              title="Gate Security & Pass Rules"
              onPress={() => {
                setLegalSection('SECURITY');
                setLegalModalVisible(true);
              }}
            />
            <MenuItem
              icon="open-outline"
              title="View Full Legal Center"
              onPress={() => router.push('/(resident)/legal')}
              noBorder
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>App</Text>
          <View style={styles.card}>
            <MenuItem icon="information-circle-outline" title="App Version" value="1.0.0" noBorder />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Danger Zone</Text>
          <View style={styles.card}>
            <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={24} color="#DC2626" />
              <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
      </ScrollView>

      {/* Edit Profile Modal */}
      <EditProfileModal 
        visible={editModalVisible} 
        onClose={() => setEditModalVisible(false)} 
      />

      {/* Legal & Policies Modal */}
      <LegalPolicyModal
        visible={legalModalVisible}
        onClose={() => setLegalModalVisible(false)}
        initialSection={legalSection}
      />

      {/* Logout Confirmation Modal */}
      <LogoutConfirmModal
        visible={logoutModalVisible}
        onClose={() => setLogoutModalVisible(false)}
      />
    </View>
  );
}

function MenuItem({ icon, title, value, noBorder, onPress }: { icon: any, title: string, value?: string, noBorder?: boolean, onPress?: () => void }) {
  return (
    <TouchableOpacity style={[styles.menuItem, !noBorder && styles.menuBorder]} onPress={onPress}>
      <View style={styles.menuLeft}>
        <Ionicons name={icon} size={20} color="#4B5563" style={styles.menuIcon} />
        <Text style={styles.menuTitle}>{title}</Text>
      </View>
      <View style={styles.menuRight}>
        {value && <Text style={styles.menuValue}>{value}</Text>}
        <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  header: { backgroundColor: '#1B4FD8', paddingVertical: 40, alignItems: 'center', paddingBottom: 60 },
  avatar: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  avatarText: { fontSize: 24, fontWeight: 'bold', color: '#1B4FD8' },
  name: { fontSize: 20, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 4 },
  flat: { fontSize: 16, color: 'rgba(255,255,255,0.8)', marginBottom: 12 },
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  roleBadge: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  roleText: { color: '#FFFFFF', fontSize: 12, fontWeight: '600' },
  editHeaderBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.25)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.4)' },
  editHeaderText: { color: '#FFFFFF', fontSize: 12, fontWeight: 'bold' },
  content: { marginTop: -20, paddingHorizontal: 16, paddingBottom: 40 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 14, fontWeight: '600', color: '#6B7280', marginLeft: 8, marginBottom: 8, textTransform: 'uppercase' },
  card: { backgroundColor: '#FFFFFF', borderRadius: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2, overflow: 'hidden' },
  menuItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 16, paddingHorizontal: 16 },
  menuBorder: { borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  menuLeft: { flexDirection: 'row', alignItems: 'center' },
  menuIcon: { marginRight: 12 },
  menuTitle: { fontSize: 16, color: '#374151', fontWeight: '500' },
  menuRight: { flexDirection: 'row', alignItems: 'center' },
  menuValue: { fontSize: 14, color: '#6B7280', marginRight: 8 },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  logoutText: { fontSize: 16, color: '#DC2626', fontWeight: '600', marginLeft: 12 },
});
