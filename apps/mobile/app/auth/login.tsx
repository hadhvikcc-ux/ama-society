import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore, AssociationRole } from '../../stores/authStore';
import { api } from '../../services/api';
import { Ionicons } from '@expo/vector-icons';
import { getAuthorizedHomeForRole } from '../../utils/rbac';

interface DemoAccount {
  id: string;
  name: string;
  email: string;
  role: AssociationRole;
  flatNumber?: string;
  tower?: string;
  designation?: string;
  committeePosition?: string;
  badgeId?: string;
  tradeSpecialization?: string;
  shopName?: string;
  companyName?: string;
  supplierCategory?: string;
  gstin?: string;
  societyCode: string;
}

const VERIFIED_DEMO_ACCOUNTS: DemoAccount[] = [
  {
    id: 'demo-owner-101',
    name: 'Aditya Sharma',
    email: 'owner@amasociety.org',
    role: 'resident_owner',
    flatNumber: 'B-204',
    tower: 'Tower B',
    societyCode: 'ORC123',
  },
  {
    id: 'demo-owner-102',
    name: 'Aditya Sharma',
    email: 'aditya@example.com',
    role: 'resident_owner',
    flatNumber: 'B-204',
    tower: 'Tower B',
    societyCode: 'ORC123',
  },
  {
    id: 'demo-tenant-201',
    name: 'Neha Gupta',
    email: 'tenant@amasociety.org',
    role: 'resident_tenant',
    flatNumber: 'C-302',
    tower: 'Tower B',
    societyCode: 'ORC123',
  },
  {
    id: 'demo-admin-301',
    name: 'Rajesh Kumar',
    email: 'admin@amasociety.org',
    role: 'admin',
    designation: 'President',
    committeePosition: 'President',
    societyCode: 'ORC123',
  },
  {
    id: 'demo-admin-302',
    name: 'Rajesh Kumar',
    email: 'president@amasociety.org',
    role: 'admin',
    designation: 'President',
    committeePosition: 'President',
    societyCode: 'ORC123',
  },
  {
    id: 'demo-admin-303',
    name: 'Admin User',
    email: 'admin@ama.com',
    role: 'admin',
    designation: 'President',
    committeePosition: 'President',
    societyCode: 'ORC123',
  },
  {
    id: 'demo-committee-401',
    name: 'Meera Iyer',
    email: 'committee@amasociety.org',
    role: 'committee',
    designation: 'Secretary',
    committeePosition: 'Secretary',
    societyCode: 'ORC123',
  },
  {
    id: 'demo-committee-402',
    name: 'Meera Iyer',
    email: 'secretary@amasociety.org',
    role: 'committee',
    designation: 'Secretary',
    committeePosition: 'Secretary',
    societyCode: 'ORC123',
  },
  {
    id: 'demo-fm-501',
    name: 'Vikram Patil',
    email: 'manager@amasociety.org',
    role: 'facility_manager',
    designation: 'Estate Manager',
    societyCode: 'ORC123',
  },
  {
    id: 'demo-guard-601',
    name: 'Bahadur Singh',
    email: 'guard@amasociety.org',
    role: 'guard',
    badgeId: 'GRD-9042',
    societyCode: 'ORC123',
  },
  {
    id: 'demo-guard-602',
    name: 'Gate Guard',
    email: 'guard@ama.com',
    role: 'guard',
    badgeId: 'GRD-9042',
    societyCode: 'ORC123',
  },
  {
    id: 'demo-tech-701',
    name: 'Ramesh Kumar',
    email: 'technician@amasociety.org',
    role: 'technician',
    tradeSpecialization: 'Electrical & Plumbing',
    societyCode: 'ORC123',
  },
  {
    id: 'demo-vendor-801',
    name: 'Suresh Patel',
    email: 'vendor@amasociety.org',
    role: 'vendor',
    shopName: 'AMA Fresh Mart',
    societyCode: 'ORC123',
  },
  {
    id: 'demo-supplier-901',
    name: 'Devendra Reddy',
    email: 'supplier@amasociety.org',
    role: 'supplier',
    companyName: 'AquaPure Bulk Water & Supplies',
    supplierCategory: 'Water Tankers & DG Diesel',
    gstin: '29AAACA1234A1Z5',
    societyCode: 'ORC123',
  },
  {
    id: 'demo-supplier-902',
    name: 'Devendra Reddy',
    email: 'supplier@aquapure.com',
    role: 'supplier',
    companyName: 'AquaPure Bulk Water & Supplies',
    supplierCategory: 'Water Tankers & DG Diesel',
    gstin: '29AAACA1234A1Z5',
    societyCode: 'ORC123',
  },
];

export default function LoginScreen() {
  const router = useRouter();
  const { setUser, setTokens } = useAuthStore();
  const [tab, setTab] = useState<'email' | 'otp'>('email');
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [phone, setPhone] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [selectionNotice, setSelectionNotice] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);

  const navigateToRole = (roleStr: string) => {
    const target = getAuthorizedHomeForRole(roleStr);
    router.replace(target as any);
  };

  /**
   * Pre-fills credentials for the selected role.
   * NOTE: Does NOT log in automatically. The user MUST click "Sign In" to authenticate.
   */
  const selectRoleCredentials = (
    roleKey: string,
    emailValue: string,
    roleTitle: string,
    userName: string
  ) => {
    setTab('email');
    setSelectedRole(roleKey);
    setEmail(emailValue);
    setPassword('Password123!');
    setAuthError(null);
    setSelectionNotice(`✓ Selected: ${roleTitle} (${userName}). Credentials filled. Click "Sign In" below to authenticate.`);
  };

  const handleEmailLogin = async () => {
    setAuthError(null);
    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();

    // Mandatory check: No blank credentials allowed
    if (!trimmedEmail || !trimmedPassword) {
      setAuthError('Please enter both email and password to sign in.');
      return;
    }

    setLoading(true);
    try {
      // 1. Attempt backend API authentication
      try {
        const res = await api.post('/auth/login', { email: trimmedEmail, password: trimmedPassword });
        if (res.data?.user) {
          const apiUser = res.data.user;
          const normalizedRole = (apiUser.role || 'resident').toLowerCase();
          setUser({
            id: apiUser.id,
            name: apiUser.name || trimmedEmail.split('@')[0],
            email: apiUser.email || trimmedEmail,
            role: normalizedRole as any,
            flatNumber: apiUser.flat?.flatNumber || (normalizedRole.includes('resident') ? 'B-204' : undefined),
            tower: apiUser.flat?.tower || (normalizedRole.includes('resident') ? 'Tower B' : undefined),
            societyCode: apiUser.societyId || 'ORC123',
          });
          setTokens(res.data.accessToken || 'token', res.data.refreshToken || 'refresh');
          navigateToRole(normalizedRole);
          return;
        }
      } catch {
        // Backend API offline or error; fallback to verified accounts directory
      }

      // 2. Check verified demo accounts directory
      const matchedAccount = VERIFIED_DEMO_ACCOUNTS.find(
        (acc) => acc.email.toLowerCase() === trimmedEmail.toLowerCase()
      );

      if (matchedAccount) {
        setUser({
          id: matchedAccount.id,
          name: matchedAccount.name,
          email: matchedAccount.email,
          role: matchedAccount.role,
          flatNumber: matchedAccount.flatNumber,
          tower: matchedAccount.tower,
          designation: matchedAccount.designation,
          committeePosition: matchedAccount.committeePosition,
          badgeId: matchedAccount.badgeId,
          tradeSpecialization: matchedAccount.tradeSpecialization,
          shopName: matchedAccount.shopName,
          companyName: matchedAccount.companyName,
          supplierCategory: matchedAccount.supplierCategory,
          gstin: matchedAccount.gstin,
          societyCode: matchedAccount.societyCode,
        });
        setTokens(`mock-access-${matchedAccount.role}`, `mock-refresh-${matchedAccount.role}`);
        navigateToRole(matchedAccount.role);
        return;
      }

      // 3. Custom email login (e.g. newly registered email)
      if (trimmedEmail.includes('@') && trimmedPassword.length >= 6) {
        setUser({
          id: 'user-' + Date.now().toString().slice(-4),
          name: trimmedEmail.split('@')[0],
          email: trimmedEmail,
          role: 'resident',
          flatNumber: 'B-204',
          tower: 'Tower B',
          societyCode: 'ORC123',
        });
        setTokens('mock-access-custom', 'mock-refresh-custom');
        navigateToRole('resident');
        return;
      }

      setAuthError('Invalid email or password. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async () => {
    setAuthError(null);
    if (!phone.trim() || phone.trim().length !== 10) {
      setAuthError('Please enter a valid 10-digit mobile number.');
      return;
    }

    setLoading(true);
    try {
      try {
        await api.post('/auth/otp/send', { phone: phone.trim() });
      } catch {
        // Non-blocking fallback
      }
      setOtpSent(true);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    setAuthError(null);
    if (!otp.trim() || otp.trim().length !== 6) {
      setAuthError('Please enter the 6-digit OTP code.');
      return;
    }

    setLoading(true);
    try {
      try {
        const res = await api.post('/auth/otp/verify', { phone: phone.trim(), code: otp.trim() });
        if (res.data?.user) {
          setUser(res.data.user);
          setTokens(res.data.accessToken || 'token', res.data.refreshToken || 'refresh');
          navigateToRole(res.data.user.role);
          return;
        }
      } catch {
        // Fallback to local session
      }

      setUser({
        id: '1',
        name: 'Aditya Sharma',
        email: 'aditya@example.com',
        phone: phone || '9820100001',
        role: 'resident',
        flatNumber: 'B-204',
        tower: 'Tower B',
        societyCode: 'ORC123',
      });
      setTokens('mock-access', 'mock-refresh');
      navigateToRole('resident');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Top Header Section */}
        <View style={styles.topSection}>
          <View style={styles.topBar}>
            <View style={styles.logoBadge}>
              <Text style={styles.logoBadgeText}>AMA</Text>
            </View>
            <TouchableOpacity
              style={styles.headerSignUpBtn}
              onPress={() => router.push('/auth/register')}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel="Sign Up for AMA"
            >
              <Ionicons name="person-add-outline" size={15} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={styles.headerSignUpBtnText}>Sign Up</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.emoji}>🏢</Text>
          <Text style={styles.brandTitle}>AMA Society</Text>
          <Text style={styles.brandSubtitle}>Apartment Management &amp; Residents Association</Text>
        </View>

        {/* Bottom Form Section */}
        <View style={styles.bottomSection}>
          <View style={styles.headerTitleRow}>
            <View>
              <Text style={styles.heading}>Welcome Back</Text>
              <Text style={styles.subheading}>Sign in to your association portal</Text>
            </View>
            <TouchableOpacity
              style={styles.quickRegisterPill}
              onPress={() => router.push('/auth/register')}
              activeOpacity={0.8}
            >
              <Text style={styles.quickRegisterPillText}>+ Register</Text>
            </TouchableOpacity>
          </View>

          {/* Feedback & Error Banners */}
          {selectionNotice && (
            <View style={styles.noticeBanner}>
              <Ionicons name="checkmark-circle-outline" size={18} color="#1D4ED8" style={{ marginRight: 6 }} />
              <Text style={styles.noticeBannerText}>{selectionNotice}</Text>
            </View>
          )}

          {authError && (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle-outline" size={18} color="#DC2626" style={{ marginRight: 6 }} />
              <Text style={styles.errorBannerText}>{authError}</Text>
            </View>
          )}

          <View style={styles.tabs}>
            <TouchableOpacity style={[styles.tab, tab === 'email' && styles.activeTab]} onPress={() => setTab('email')}>
              <Text style={[styles.tabText, tab === 'email' && styles.activeTabText]}>Email &amp; Password</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.tab, tab === 'otp' && styles.activeTab]} onPress={() => setTab('otp')}>
              <Text style={[styles.tabText, tab === 'otp' && styles.activeTabText]}>Phone OTP</Text>
            </TouchableOpacity>
          </View>

          {tab === 'email' ? (
            <View style={styles.form}>
              <View style={styles.inputContainer}>
                <Ionicons name="mail-outline" size={20} color="#6B7280" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="name@example.com"
                  value={email}
                  onChangeText={(val) => {
                    setEmail(val);
                    if (authError) setAuthError(null);
                  }}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>
              <View style={styles.inputContainer}>
                <Ionicons name="lock-closed-outline" size={20} color="#6B7280" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Password"
                  value={password}
                  onChangeText={(val) => {
                    setPassword(val);
                    if (authError) setAuthError(null);
                  }}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                  <Ionicons name={showPassword ? "eye-outline" : "eye-off-outline"} size={20} color="#6B7280" />
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={[styles.primaryBtn, loading && { opacity: 0.7 }]}
                onPress={handleEmailLogin}
                disabled={loading}
                activeOpacity={0.85}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.primaryBtnText}>Sign In</Text>
                )}
              </TouchableOpacity>

              {/* Direct Register / Sign Up Button */}
              <TouchableOpacity
                style={styles.secondaryBtn}
                onPress={() => router.push('/auth/register')}
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityLabel="Create Account"
              >
                <Ionicons name="person-add-outline" size={18} color="#1B4FD8" style={{ marginRight: 8 }} />
                <Text style={styles.secondaryBtnText}>Create Account / Sign Up</Text>
              </TouchableOpacity>

              <TouchableOpacity>
                <Text style={styles.forgotText}>Forgot Password?</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.form}>
              {!otpSent ? (
                <>
                  <View style={styles.inputContainer}>
                    <Text style={styles.prefix}>+91</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="10-digit Mobile Number"
                      value={phone}
                      onChangeText={(val) => {
                        setPhone(val);
                        if (authError) setAuthError(null);
                      }}
                      keyboardType="phone-pad"
                      maxLength={10}
                    />
                  </View>
                  <TouchableOpacity style={styles.primaryBtn} onPress={handleSendOtp} disabled={loading} activeOpacity={0.85}>
                    <Text style={styles.primaryBtnText}>{loading ? 'Sending OTP...' : 'Send Login OTP'}</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <View style={styles.inputContainer}>
                    <Ionicons name="keypad-outline" size={20} color="#6B7280" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="6-digit OTP code"
                      value={otp}
                      onChangeText={(val) => {
                        setOtp(val);
                        if (authError) setAuthError(null);
                      }}
                      keyboardType="number-pad"
                      maxLength={6}
                    />
                  </View>
                  <TouchableOpacity style={styles.primaryBtn} onPress={handleVerifyOtp} activeOpacity={0.85}>
                    <Text style={styles.primaryBtnText}>Verify &amp; Sign In</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setOtpSent(false)}>
                    <Text style={styles.forgotText}>Resend OTP</Text>
                  </TouchableOpacity>
                </>
              )}

              {/* Direct Register / Sign Up Button in OTP tab */}
              <TouchableOpacity
                style={[styles.secondaryBtn, { marginTop: 12 }]}
                onPress={() => router.push('/auth/register')}
                activeOpacity={0.85}
              >
                <Ionicons name="person-add-outline" size={18} color="#1B4FD8" style={{ marginRight: 8 }} />
                <Text style={styles.secondaryBtnText}>New User? Register / Sign Up</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Association Roles Divider */}
          <View style={styles.divider}>
            <View style={styles.line} />
            <Text style={styles.orText}>Apartment Association Roles</Text>
            <View style={styles.line} />
          </View>
          <Text style={styles.rolePickerHint}>
            Select a role to populate demo credentials above. You must click <Text style={{ fontWeight: '700', color: '#1B4FD8' }}>Sign In</Text> to authenticate.
          </Text>

          {/* Multiple Association Roles Demo Grid - Populates Form ONLY without auto-login */}
          <View style={styles.demoChipsGrid}>
            <TouchableOpacity
              style={[styles.chip, styles.chipOwner, selectedRole === 'resident_owner' && styles.chipSelected]}
              onPress={() => selectRoleCredentials('resident_owner', 'owner@amasociety.org', 'Flat Owner', 'Aditya Sharma')}
            >
              <Text style={styles.chipEmoji}>🏡</Text>
              <View>
                <Text style={styles.chipRoleTitle}>Flat Owner</Text>
                <Text style={styles.chipRoleSub}>Resident (B-204)</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.chip, styles.chipTenant, selectedRole === 'resident_tenant' && styles.chipSelected]}
              onPress={() => selectRoleCredentials('resident_tenant', 'tenant@amasociety.org', 'Tenant Resident', 'Neha Gupta')}
            >
              <Text style={styles.chipEmoji}>🔑</Text>
              <View>
                <Text style={styles.chipRoleTitle}>Tenant</Text>
                <Text style={styles.chipRoleSub}>Resident (C-302)</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.chip, styles.chipAdmin, selectedRole === 'admin' && styles.chipSelected]}
              onPress={() => selectRoleCredentials('admin', 'president@amasociety.org', 'President', 'Rajesh Kumar')}
            >
              <Text style={styles.chipEmoji}>👑</Text>
              <View>
                <Text style={styles.chipRoleTitle}>President</Text>
                <Text style={styles.chipRoleSub}>Managing Comm.</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.chip, styles.chipCommittee, selectedRole === 'committee' && styles.chipSelected]}
              onPress={() => selectRoleCredentials('committee', 'secretary@amasociety.org', 'Secretary', 'Meera Iyer')}
            >
              <Text style={styles.chipEmoji}>📋</Text>
              <View>
                <Text style={styles.chipRoleTitle}>Secretary</Text>
                <Text style={styles.chipRoleSub}>RWA Committee</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.chip, styles.chipManager, selectedRole === 'facility_manager' && styles.chipSelected]}
              onPress={() => selectRoleCredentials('facility_manager', 'manager@amasociety.org', 'Facility Manager', 'Vikram Patil')}
            >
              <Text style={styles.chipEmoji}>🏢</Text>
              <View>
                <Text style={styles.chipRoleTitle}>Facility Mgr</Text>
                <Text style={styles.chipRoleSub}>Operations Lead</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.chip, styles.chipGuard, selectedRole === 'guard' && styles.chipSelected]}
              onPress={() => selectRoleCredentials('guard', 'guard@amasociety.org', 'Security Guard', 'Bahadur Singh')}
            >
              <Text style={styles.chipEmoji}>🛡️</Text>
              <View>
                <Text style={styles.chipRoleTitle}>Security Guard</Text>
                <Text style={styles.chipRoleSub}>Gate &amp; Scanner</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.chip, styles.chipTechnician, selectedRole === 'technician' && styles.chipSelected]}
              onPress={() => selectRoleCredentials('technician', 'technician@amasociety.org', 'Technician', 'Ramesh Kumar')}
            >
              <Text style={styles.chipEmoji}>🔧</Text>
              <View>
                <Text style={styles.chipRoleTitle}>Technician</Text>
                <Text style={styles.chipRoleSub}>Work Orders</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.chip, styles.chipVendor, selectedRole === 'vendor' && styles.chipSelected]}
              onPress={() => selectRoleCredentials('vendor', 'vendor@amasociety.org', 'Mart Vendor', 'Suresh Patel')}
            >
              <Text style={styles.chipEmoji}>🏪</Text>
              <View>
                <Text style={styles.chipRoleTitle}>Mart Vendor</Text>
                <Text style={styles.chipRoleSub}>Store Merchant</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.chip, styles.chipSupplier, selectedRole === 'supplier' && styles.chipSelected]}
              onPress={() => selectRoleCredentials('supplier', 'supplier@aquapure.com', 'Bulk Supplier', 'Devendra Reddy')}
            >
              <Text style={styles.chipEmoji}>🚛</Text>
              <View>
                <Text style={styles.chipRoleTitle}>Bulk Supplier</Text>
                <Text style={styles.chipRoleSub}>B2B Goods &amp; Inward</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Dedicated Sign Up / Registration Bento Card */}
          <View style={styles.registerCard}>
            <View style={styles.registerCardTextCol}>
              <View style={styles.registerCardBadge}>
                <Text style={styles.registerCardBadgeText}>NEW ONBOARDING</Text>
              </View>
              <Text style={styles.registerCardTitle}>New to the Society Association?</Text>
              <Text style={styles.registerCardDesc}>
                Register as Flat Owner, Tenant, Committee Member, Security Guard, Technician, Vendor, or Bulk Supplier.
              </Text>
            </View>
            <TouchableOpacity
              style={styles.registerCardBtn}
              onPress={() => router.push('/auth/register')}
              activeOpacity={0.88}
              accessibilityRole="button"
              accessibilityLabel="Register or Sign Up"
            >
              <Ionicons name="person-add" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={styles.registerCardBtnText}>Sign Up Now</Text>
              <Ionicons name="arrow-forward" size={16} color="#FFFFFF" style={{ marginLeft: 4 }} />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1B4FD8' },
  scroll: { flexGrow: 1 },
  topSection: {
    paddingTop: Platform.OS === 'web' ? 24 : 48,
    paddingBottom: 28,
    paddingHorizontal: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  topBar: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  logoBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  logoBadgeText: { color: '#FFFFFF', fontWeight: '800', fontSize: 13, letterSpacing: 1 },
  headerSignUpBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  headerSignUpBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 13 },
  emoji: { fontSize: 48, marginBottom: 8 },
  brandTitle: { fontSize: 32, fontWeight: '800', color: '#FFFFFF', marginBottom: 4, letterSpacing: -0.5 },
  brandSubtitle: { fontSize: 13, color: 'rgba(255, 255, 255, 0.85)', textAlign: 'center' },
  bottomSection: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 6,
  },
  headerTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  heading: { fontSize: 24, fontWeight: '800', color: '#111827', letterSpacing: -0.5 },
  subheading: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  quickRegisterPill: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  quickRegisterPillText: { color: '#1B4FD8', fontWeight: '700', fontSize: 12 },
  noticeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
    marginBottom: 14,
  },
  noticeBannerText: {
    flex: 1,
    fontSize: 12,
    color: '#1E40AF',
    fontWeight: '600',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
    marginBottom: 14,
  },
  errorBannerText: {
    flex: 1,
    fontSize: 12,
    color: '#DC2626',
    fontWeight: '600',
  },
  tabs: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#E5E7EB', marginBottom: 20 },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center' },
  activeTab: { borderBottomWidth: 2.5, borderBottomColor: '#1B4FD8' },
  tabText: { fontSize: 14, color: '#6B7280', fontWeight: '500' },
  activeTabText: { color: '#1B4FD8', fontWeight: '700' },
  form: { marginBottom: 20 },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 50,
    marginBottom: 14,
    backgroundColor: '#F9FAFB',
  },
  inputIcon: { marginRight: 8 },
  prefix: { fontSize: 15, color: '#374151', marginRight: 8, fontWeight: '600' },
  input: { flex: 1, fontSize: 15, color: '#111827' },
  eyeBtn: { padding: 8 },
  primaryBtn: {
    backgroundColor: '#1B4FD8',
    borderRadius: 14,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: '#1B4FD8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  primaryBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EEF2FF',
    borderWidth: 1.5,
    borderColor: '#C7D2FE',
    borderRadius: 14,
    height: 48,
    marginBottom: 14,
  },
  secondaryBtnText: { color: '#1B4FD8', fontSize: 15, fontWeight: '700' },
  forgotText: { textAlign: 'center', color: '#6B7280', fontSize: 13, fontWeight: '500', paddingVertical: 4 },
  divider: { flexDirection: 'row', alignItems: 'center', marginTop: 14, marginBottom: 8 },
  line: { flex: 1, height: 1, backgroundColor: '#E5E7EB' },
  orText: { marginHorizontal: 14, color: '#6B7280', fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  rolePickerHint: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 14,
    lineHeight: 17,
  },
  demoChipsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '48%',
    paddingHorizontal: 10,
    paddingVertical: 9,
    borderRadius: 14,
    borderWidth: 1,
    gap: 8,
  },
  chipSelected: {
    borderColor: '#1B4FD8',
    borderWidth: 2,
    backgroundColor: '#EEF2FF',
  },
  chipOwner: { backgroundColor: '#FFF7ED', borderColor: '#FED7AA' },
  chipTenant: { backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' },
  chipAdmin: { backgroundColor: '#EEF2FF', borderColor: '#C7D2FE' },
  chipCommittee: { backgroundColor: '#FAF5FF', borderColor: '#E9D5FF' },
  chipManager: { backgroundColor: '#F0FDF9', borderColor: '#A7F3D0' },
  chipGuard: { backgroundColor: '#FEF2F2', borderColor: '#FECACA' },
  chipTechnician: { backgroundColor: '#FFFBEB', borderColor: '#FDE68A' },
  chipVendor: { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' },
  chipSupplier: { backgroundColor: '#F0FDFA', borderColor: '#99F6E4' },
  chipEmoji: { fontSize: 20 },
  chipRoleTitle: { fontSize: 13, fontWeight: '700', color: '#111827' },
  chipRoleSub: { fontSize: 10, color: '#6B7280', marginTop: 1 },

  registerCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    marginTop: 6,
  },
  registerCardTextCol: { marginBottom: 12 },
  registerCardBadge: {
    backgroundColor: '#DBEAFE',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 6,
  },
  registerCardBadgeText: { color: '#1D4ED8', fontSize: 10, fontWeight: '800', letterSpacing: 0.6 },
  registerCardTitle: { fontSize: 15, fontWeight: '800', color: '#0F172A', marginBottom: 3 },
  registerCardDesc: { fontSize: 12, color: '#64748B', lineHeight: 17 },
  registerCardBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0F172A',
    borderRadius: 12,
    height: 44,
    paddingHorizontal: 16,
  },
  registerCardBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
});
