import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { useAuthStore, User, AssociationRole } from '../../stores/authStore';
import { useSocietyStore } from '../../stores/societyStore';
import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { COLORS } from '../../constants/colors';
import { TOUCH_TARGET } from '../../constants/theme';
import { useResponsive } from '../../hooks/useResponsive';

export type RoleType =
  | 'resident_owner'
  | 'resident_tenant'
  | 'admin'
  | 'facility_manager'
  | 'guard'
  | 'technician'
  | 'vendor'
  | 'supplier';

interface RoleOption {
  key: RoleType;
  title: string;
  subtitle: string;
  desc: string;
  emoji: string;
  cardBg: string;
  borderColor: string;
  activeBorderColor: string;
  iconBg: string;
  titleColor: string;
}

const ROLE_OPTIONS: RoleOption[] = [
  {
    key: 'resident_owner',
    title: 'Flat Owner',
    subtitle: 'Resident Owner',
    desc: 'Deed & voting rights',
    emoji: '🏡',
    cardBg: '#FFF7ED',
    borderColor: '#FED7AA',
    activeBorderColor: '#EA580C',
    iconBg: '#FFEDD5',
    titleColor: '#C2410C',
  },
  {
    key: 'resident_tenant',
    title: 'Tenant Resident',
    subtitle: 'Resident Renter',
    desc: 'Lease & amenities',
    emoji: '🔑',
    cardBg: '#F0FDF4',
    borderColor: '#BBF7D0',
    activeBorderColor: '#16A34A',
    iconBg: '#DCFCE7',
    titleColor: '#15803D',
  },
  {
    key: 'admin',
    title: 'Managing Committee',
    subtitle: 'RWA / AOA Board',
    desc: 'President & Secretary',
    emoji: '👑',
    cardBg: '#EEF2FF',
    borderColor: '#C7D2FE',
    activeBorderColor: '#4338CA',
    iconBg: '#E0E7FF',
    titleColor: '#4338CA',
  },
  {
    key: 'facility_manager',
    title: 'Facility Manager',
    subtitle: 'Estate & Ops Lead',
    desc: 'Clubhouse, DG & lifts',
    emoji: '🏢',
    cardBg: '#F0FDF9',
    borderColor: '#A7F3D0',
    activeBorderColor: '#059669',
    iconBg: '#CCFBF1',
    titleColor: '#0F766E',
  },
  {
    key: 'guard',
    title: 'Security Guard',
    subtitle: 'Gatekeeper',
    desc: 'Visitor QR & barrier pass',
    emoji: '🛡️',
    cardBg: '#FEF2F2',
    borderColor: '#FECACA',
    activeBorderColor: '#DC2626',
    iconBg: '#FEE2E2',
    titleColor: '#B91C1C',
  },
  {
    key: 'technician',
    title: 'Technician',
    subtitle: 'Maintenance Lead',
    desc: 'Electrical, plumbing, HVAC',
    emoji: '🔧',
    cardBg: '#FFFBEB',
    borderColor: '#FDE68A',
    activeBorderColor: '#D97706',
    iconBg: '#FEF3C7',
    titleColor: '#B45309',
  },
  {
    key: 'vendor',
    title: 'Society Vendor',
    subtitle: 'Mart Merchant',
    desc: 'Bazaar POS & receipts',
    emoji: '🏪',
    cardBg: '#EFF6FF',
    borderColor: '#BFDBFE',
    activeBorderColor: '#2563EB',
    iconBg: '#DBEAFE',
    titleColor: '#1D4ED8',
  },
  {
    key: 'supplier',
    title: 'Society Supplier',
    subtitle: 'B2B Wholesale',
    desc: 'Water, DG Fuel, Chemicals, HW',
    emoji: '🚛',
    cardBg: '#F0FDFA',
    borderColor: '#99F6E4',
    activeBorderColor: '#0D9488',
    iconBg: '#CCFBF1',
    titleColor: '#0F766E',
  },
];

const TOWERS = ['Tower A', 'Tower B', 'Tower C', 'Tower D', 'Clubhouse Villa'];
const COMMITTEE_POSITIONS = ['President', 'Vice President', 'Secretary', 'Treasurer', 'Committee Member'];
const FM_SHIFTS = ['General (09:00 AM - 06:00 PM)', 'Rotational Shift', '24/7 On-Call'];
const GUARD_POSTS = ['Gate 1 (Main Entrance)', 'Gate 2 (Service Gate)', 'Patrol Squad'];
const GUARD_SHIFTS = ['Day (07:00 AM - 07:00 PM)', 'Night (07:00 PM - 07:00 AM)'];
const TECH_TRADES = ['⚡ Electrical', '🚰 Plumbing', '🛗 Lift / Elevator', '❄️ HVAC / AC', '🪵 Carpentry'];
const VENDOR_CATEGORIES = [
  'Grocery & Mart',
  'Dairy & Fresh Produce',
  'Pharmacy & Essentials',
  'Laundry & Dry Clean',
];
const SUPPLIER_CATEGORIES = [
  '💧 Water Tankers & Bulk Water',
  '⛽ Diesel & Generator Fuel',
  '🧪 Pool & STP Chemicals',
  '⚡ Electrical & Heavy Cables',
  '🚰 Plumbing & Pumps',
  '🧹 Housekeeping & Facility Bulk',
];

export default function RegisterScreen() {
  const router = useRouter();
  const { setUser, setTokens } = useAuthStore();
  const { isSmallPhone } = useResponsive();

  // Selected Role
  const [role, setRole] = useState<RoleType>('resident_owner');

  // Common Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [societyCode, setSocietyCode] = useState('ORC123');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [emergencyContact, setEmergencyContact] = useState('');

  // 1. Flat Owner Fields
  const [ownerTower, setOwnerTower] = useState('Tower B');
  const [ownerFlat, setOwnerFlat] = useState('');
  const [shareCertNumber, setShareCertNumber] = useState('');
  const [ownerVehicle, setOwnerVehicle] = useState('');

  // 2. Tenant Resident Fields
  const [tenantTower, setTenantTower] = useState('Tower C');
  const [tenantFlat, setTenantFlat] = useState('');
  const [landlordName, setLandlordName] = useState('');
  const [leaseEndDate, setLeaseEndDate] = useState('');
  const [tenantVehicle, setTenantVehicle] = useState('');

  // 3. Committee / Admin Fields
  const [committeePosition, setCommitteePosition] = useState('President');
  const [regNumber, setRegNumber] = useState('');
  const [totalUnits, setTotalUnits] = useState('120');

  // 4. Facility Manager Fields
  const [fmAgency, setFmAgency] = useState('CBRE Estate Services');
  const [fmBadgeId, setFmBadgeId] = useState('');
  const [fmShift, setFmShift] = useState('General (09:00 AM - 06:00 PM)');
  const [fmAssets, setFmAssets] = useState('DG Backup, Elevators & Pumps');

  // 5. Security Guard Fields
  const [guardAgency, setGuardAgency] = useState('SIS Security Group');
  const [guardBadgeId, setGuardBadgeId] = useState('');
  const [guardPost, setGuardPost] = useState('Gate 1 (Main Entrance)');
  const [guardShift, setGuardShift] = useState('Day (07:00 AM - 07:00 PM)');

  // 6. Maintenance Technician Fields
  const [techTrade, setTechTrade] = useState('⚡ Electrical');
  const [techBadgeId, setTechBadgeId] = useState('');
  const [techAgency, setTechAgency] = useState('Urban Services & Co.');
  const [techHotline, setTechHotline] = useState('');

  // 7. Society Vendor Fields
  const [vendorShopName, setVendorShopName] = useState('');
  const [vendorCategory, setVendorCategory] = useState('Grocery & Mart');
  const [vendorStallNumber, setVendorStallNumber] = useState('');
  const [vendorUpiId, setVendorUpiId] = useState('');

  // 8. Society Bulk Supplier Fields
  const [supplierCompanyName, setSupplierCompanyName] = useState('');
  const [supplierGstin, setSupplierGstin] = useState('');
  const [supplierCategory, setSupplierCategory] = useState('💧 Water Tankers & Bulk Water');
  const [supplierUpiId, setSupplierUpiId] = useState('');

  // Mandatory Legal Acknowledgements & Reading Verification
  const [hasReadTerms, setHasReadTerms] = useState(false);
  const [hasReadPrivacy, setHasReadPrivacy] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreePrivacy, setAgreePrivacy] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);

  // Error State
  const [errorMsg, setErrorMsg] = useState('');

  const triggerHaptic = (style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light) => {
    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(style).catch(() => {});
      } catch (e) {}
    }
  };

  const handleRoleChange = (newRole: RoleType) => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
    setRole(newRole);
    setErrorMsg('');
  };

  const getRoleDisplayName = (r: RoleType): string => {
    switch (r) {
      case 'resident_owner':
        return 'Flat Owner';
      case 'resident_tenant':
        return 'Tenant Resident';
      case 'admin':
        return 'Managing Committee';
      case 'facility_manager':
        return 'Facility Manager';
      case 'guard':
        return 'Security Guard';
      case 'technician':
        return 'Technician';
      case 'vendor':
        return 'Society Vendor';
      case 'supplier':
        return 'Society Bulk Supplier';
    }
  };

  const getDestinationRoute = (userRole: RoleType) => {
    if (userRole === 'admin' || userRole === 'facility_manager') {
      return '/(admin)';
    }
    if (userRole === 'guard' || userRole === 'technician') {
      return '/(guard)';
    }
    if (userRole === 'vendor') {
      return '/(vendor)';
    }
    if (userRole === 'supplier') {
      return '/(supplier)';
    }
    return '/(resident)';
  };

  const handleToggleTerms = () => {
    if (!hasReadTerms) {
      triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
      setErrorMsg('Please open and read the Terms of Service to enable acknowledgement.');
      setShowTermsModal(true);
      return;
    }
    triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
    setAgreeTerms(!agreeTerms);
    setErrorMsg('');
  };

  const handleTogglePrivacy = () => {
    if (!hasReadPrivacy) {
      triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
      setErrorMsg('Please open and read the Apartment Privacy Policy to enable acknowledgement.');
      setShowPrivacyModal(true);
      return;
    }
    triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
    setAgreePrivacy(!agreePrivacy);
    setErrorMsg('');
  };

  const handleRegister = () => {
    setErrorMsg('');

    // Common Validation
    if (!name.trim()) {
      setErrorMsg('Please enter your full name');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setErrorMsg('Please enter a valid email address');
      return;
    }
    if (!phone.trim() || phone.length < 10) {
      setErrorMsg('Please enter a 10-digit mobile phone number');
      return;
    }
    if (!societyCode.trim()) {
      setErrorMsg('Please enter your society authorization code (e.g. ORC123)');
      return;
    }
    if (!password || password.length < 6) {
      setErrorMsg('Password must be at least 6 characters');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match');
      return;
    }

    // Role-Specific Validation
    if (role === 'resident_owner' && !ownerFlat.trim()) {
      setErrorMsg('Please enter your flat / unit number (e.g. B-204)');
      return;
    }
    if (role === 'resident_tenant') {
      if (!tenantFlat.trim()) {
        setErrorMsg('Please enter your rented flat number (e.g. C-302)');
        return;
      }
      if (!landlordName.trim()) {
        setErrorMsg('Please enter your landlord / flat owner full name');
        return;
      }
    }
    if (role === 'facility_manager' && !fmBadgeId.trim()) {
      setErrorMsg('Please enter your facility manager staff ID (e.g. FM-501)');
      return;
    }
    if (role === 'guard' && !guardBadgeId.trim()) {
      setErrorMsg('Please enter your security guard badge ID (e.g. GRD-9042)');
      return;
    }
    if (role === 'technician' && !techBadgeId.trim()) {
      setErrorMsg('Please enter your technician badge / employee ID (e.g. TECH-4401)');
      return;
    }
    if (role === 'vendor' && !vendorShopName.trim()) {
      setErrorMsg('Please enter your store or business name (e.g. AMA Fresh Mart)');
      return;
    }

    // Mandatory Policy Acknowledgements — Requires reading & acknowledging
    if (!hasReadTerms || !agreeTerms) {
      setErrorMsg('Mandatory: Please read and acknowledge the Apartment Association Terms of Service.');
      triggerHaptic(Haptics.ImpactFeedbackStyle.Heavy);
      if (!hasReadTerms) {
        setShowTermsModal(true);
      }
      return;
    }
    if (!hasReadPrivacy || !agreePrivacy) {
      setErrorMsg('Mandatory: Please read and acknowledge the Apartment Privacy Policy & CCTV Disclosure.');
      triggerHaptic(Haptics.ImpactFeedbackStyle.Heavy);
      if (!hasReadPrivacy) {
        setShowPrivacyModal(true);
      }
      return;
    }

    triggerHaptic(Haptics.ImpactFeedbackStyle.Heavy);

    // Build User Payload
    const newUser: User = {
      id: `user-${role}-${Date.now().toString().slice(-4)}`,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      role: role as AssociationRole,
      societyCode: societyCode.trim().toUpperCase(),
      emergencyContact: emergencyContact.trim() || undefined,
      agreedToTerms: true,
      agreedToPrivacy: true,
      agreedAt: new Date().toISOString(),
      // Conditional Role Metadata
      ...(role === 'resident_owner' && {
        flatNumber: ownerFlat.trim().toUpperCase(),
        tower: ownerTower,
        tenancyType: 'Owner',
        shareCertNumber: shareCertNumber.trim() || undefined,
        vehicleNumber: ownerVehicle.trim().toUpperCase() || undefined,
      }),
      ...(role === 'resident_tenant' && {
        flatNumber: tenantFlat.trim().toUpperCase(),
        tower: tenantTower,
        tenancyType: 'Tenant',
        ownerName: landlordName.trim(),
        leaseEndDate: leaseEndDate.trim() || undefined,
        vehicleNumber: tenantVehicle.trim().toUpperCase() || undefined,
      }),
      ...(role === 'admin' && {
        designation: committeePosition,
        committeePosition,
        regNumber: regNumber.trim() || 'MAH/BOM/HSG/TC/1042',
        totalUnits: parseInt(totalUnits, 10) || 120,
      }),
      ...(role === 'facility_manager' && {
        designation: 'Facility & Estate Manager',
        agencyName: fmAgency.trim() || 'CBRE Facility Management',
        badgeId: fmBadgeId.trim().toUpperCase(),
        shift: fmShift,
      }),
      ...(role === 'guard' && {
        agencyName: guardAgency.trim() || 'SIS Security Services',
        badgeId: guardBadgeId.trim().toUpperCase(),
        gatePost: guardPost,
        shift: guardShift,
      }),
      ...(role === 'technician' && {
        tradeSpecialization: techTrade,
        badgeId: techBadgeId.trim().toUpperCase(),
        agencyName: techAgency.trim() || 'Urban Company & Services',
        phone: techHotline.trim() || phone.trim(),
      }),
      ...(role === 'vendor' && {
        shopName: vendorShopName.trim(),
        category: vendorCategory,
        stallNumber: vendorStallNumber.trim() || 'Commercial Stall #01',
        upiId: vendorUpiId.trim() || `${name.toLowerCase().replace(/\s+/g, '')}@upi`,
      }),
      ...(role === 'supplier' && {
        companyName: supplierCompanyName.trim() || `${name.trim()} Bulk Supplies`,
        gstin: supplierGstin.trim().toUpperCase() || '29AAACA1234A1Z5',
        supplierCategory: supplierCategory,
        upiId: supplierUpiId.trim() || `${name.toLowerCase().replace(/\s+/g, '')}.supplies@icici`,
      }),
    };

    // Save to Zustand Auth Store
    setUser(newUser);
    setTokens(`mock-access-token-${role}`, `mock-refresh-token-${role}`);

    // Register into Society Store so President & Managing Committee see them immediately
    useSocietyStore.getState().registerMember(newUser);

    const roleName = getRoleDisplayName(role);
    const successMsg = `Welcome to AMA Society, ${name.trim()}! Registered as ${roleName}.`;

    if (Platform.OS === 'web') {
      alert(successMsg);
    } else {
      Alert.alert('Registration Successful', successMsg);
    }

    // Navigate to role-specific dashboard
    const destination = getDestinationRoute(role);
    router.replace(destination as any);
  };

  const currentRoleConfig = ROLE_OPTIONS.find((opt) => opt.key === role) || ROLE_OPTIONS[0];
  const allAgreementsComplete = hasReadTerms && agreeTerms && hasReadPrivacy && agreePrivacy;

  return (
    <View style={styles.container}>
      <ScreenHeader title="Create AMA Account" showBack />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          {/* Hero Header */}
          <View style={styles.heroSection}>
            <View style={styles.titleBadge}>
              <Text style={styles.titleBadgeText}>APARTMENT ASSOCIATION ONBOARDING</Text>
            </View>
            <Text style={styles.heading}>Choose Your Society Role</Text>
            <Text style={styles.subheading}>
              Select your role in the apartment association to configure your personalized dashboard and permissions.
            </Text>

            {/* 7-Role Association Bento Selector */}
            <View style={styles.roleGrid}>
              {ROLE_OPTIONS.map((opt, idx) => {
                const isSelected = role === opt.key;
                const isLastOdd = idx === ROLE_OPTIONS.length - 1 && ROLE_OPTIONS.length % 2 !== 0;

                return (
                  <TouchableOpacity
                    key={opt.key}
                    style={[
                      styles.roleCard,
                      isLastOdd && styles.roleCardWide,
                      { backgroundColor: opt.cardBg, borderColor: opt.borderColor },
                      isSelected && [styles.roleCardActive, { borderColor: opt.activeBorderColor }],
                    ]}
                    onPress={() => handleRoleChange(opt.key)}
                    activeOpacity={0.82}
                    accessibilityRole="button"
                    accessibilityLabel={`Register as ${opt.title}`}
                  >
                    <View style={styles.roleCardHeader}>
                      <View style={[styles.roleIconCircle, { backgroundColor: opt.iconBg }]}>
                        <Text style={styles.roleEmoji}>{opt.emoji}</Text>
                      </View>
                      {isSelected && (
                        <View style={[styles.activeDotBadge, { backgroundColor: opt.activeBorderColor }]}>
                          <Ionicons name="checkmark" size={12} color="#FFFFFF" />
                        </View>
                      )}
                    </View>
                    <Text style={[styles.roleTitle, isSelected && { color: opt.titleColor }]}>
                      {opt.title}
                    </Text>
                    <Text style={styles.roleSubtitle}>{opt.subtitle}</Text>
                    <Text style={styles.roleDesc}>{opt.desc}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Validation Error Banner */}
          {errorMsg ? (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle" size={18} color="#DC2626" />
              <Text style={styles.errorBannerText}>{errorMsg}</Text>
            </View>
          ) : null}

          {/* 1. Common Personal Credentials */}
          <View style={styles.sectionBlock}>
            <View style={styles.sectionHeaderRow}>
              <View style={styles.stepCircle}>
                <Text style={styles.stepCircleText}>1</Text>
              </View>
              <Text style={styles.sectionHeader}>Personal Credentials</Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Full Name *</Text>
              <TextInput
                style={styles.input}
                placeholder={
                  role === 'admin'
                    ? 'e.g. Rajesh Kumar'
                    : role === 'guard'
                    ? 'e.g. Bahadur Singh'
                    : role === 'facility_manager'
                    ? 'e.g. Vikram Patil'
                    : role === 'technician'
                    ? 'e.g. Ramesh Kumar'
                    : role === 'vendor'
                    ? 'e.g. Suresh Patel'
                    : 'e.g. Aditya Sharma'
                }
                value={name}
                onChangeText={setName}
              />
            </View>

            <View style={[styles.row, isSmallPhone && { flexDirection: 'column' }]}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>Email Address *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="name@example.com"
                  keyboardType="email-address"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>Mobile Phone (10-Digit) *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 9876543210"
                  keyboardType="phone-pad"
                  value={phone}
                  onChangeText={setPhone}
                  maxLength={10}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Society Authorization Code *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. ORC123"
                value={societyCode}
                onChangeText={setSocietyCode}
                autoCapitalize="characters"
                maxLength={8}
              />
              <Text style={styles.helperText}>Provided by your Apartment Association / RWA Committee</Text>
            </View>

            <View style={[styles.row, isSmallPhone && { flexDirection: 'column' }]}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>Password *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="At least 6 characters"
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={setPassword}
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>Confirm Password *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Re-enter password"
                  secureTextEntry={!showPassword}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                />
              </View>
            </View>

            <TouchableOpacity
              style={styles.togglePasswordRow}
              onPress={() => setShowPassword(!showPassword)}
            >
              <Ionicons
                name={showPassword ? 'checkbox' : 'square-outline'}
                size={18}
                color="#4338CA"
              />
              <Text style={styles.togglePasswordText}>Show password characters</Text>
            </TouchableOpacity>
          </View>

          {/* 2. Role-Specific Information */}
          <View style={styles.sectionBlock}>
            <View style={styles.sectionHeaderRow}>
              <View style={[styles.stepCircle, { backgroundColor: currentRoleConfig.iconBg }]}>
                <Text style={styles.roleEmojiStep}>{currentRoleConfig.emoji}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.sectionHeader}>
                  {currentRoleConfig.title} Details
                </Text>
                <Text style={styles.sectionSubHeader}>
                  Role-tailored credentials for {currentRoleConfig.subtitle}
                </Text>
              </View>
            </View>

            {/* ----------------- 1. FLAT OWNER ----------------- */}
            {role === 'resident_owner' && (
              <>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Select Tower / Wing</Text>
                  <View style={styles.pickerRow}>
                    {TOWERS.map((tw) => (
                      <TouchableOpacity
                        key={tw}
                        style={[styles.miniPill, ownerTower === tw && styles.miniPillActive]}
                        onPress={() => setOwnerTower(tw)}
                      >
                        <Text style={[styles.miniPillText, ownerTower === tw && styles.miniPillTextActive]}>
                          {tw}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={[styles.row, isSmallPhone && { flexDirection: 'column' }]}>
                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={styles.label}>Owned Flat / Unit Number *</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="e.g. B-204"
                      value={ownerFlat}
                      onChangeText={setOwnerFlat}
                      autoCapitalize="characters"
                    />
                  </View>
                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={styles.label}>Share Certificate / Deed No.</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="e.g. SC-8821 / Deed #4012"
                      value={shareCertNumber}
                      onChangeText={setShareCertNumber}
                      autoCapitalize="characters"
                    />
                  </View>
                </View>

                <View style={[styles.row, isSmallPhone && { flexDirection: 'column' }]}>
                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={styles.label}>Vehicle Number (Gate RFID Tag)</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="e.g. MH 12 AB 1234"
                      value={ownerVehicle}
                      onChangeText={setOwnerVehicle}
                      autoCapitalize="characters"
                    />
                  </View>
                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={styles.label}>Emergency Phone (Optional)</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="e.g. 9876543219"
                      keyboardType="phone-pad"
                      value={emergencyContact}
                      onChangeText={setEmergencyContact}
                    />
                  </View>
                </View>
              </>
            )}

            {/* ----------------- 2. TENANT RESIDENT ----------------- */}
            {role === 'resident_tenant' && (
              <>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Select Tower / Wing</Text>
                  <View style={styles.pickerRow}>
                    {TOWERS.map((tw) => (
                      <TouchableOpacity
                        key={tw}
                        style={[styles.miniPill, tenantTower === tw && styles.miniPillActive]}
                        onPress={() => setTenantTower(tw)}
                      >
                        <Text style={[styles.miniPillText, tenantTower === tw && styles.miniPillTextActive]}>
                          {tw}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={[styles.row, isSmallPhone && { flexDirection: 'column' }]}>
                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={styles.label}>Rented Flat / Unit Number *</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="e.g. C-302"
                      value={tenantFlat}
                      onChangeText={setTenantFlat}
                      autoCapitalize="characters"
                    />
                  </View>
                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={styles.label}>Landlord / Flat Owner Name *</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="e.g. Dr. K. Ramanathan"
                      value={landlordName}
                      onChangeText={setLandlordName}
                    />
                  </View>
                </View>

                <View style={[styles.row, isSmallPhone && { flexDirection: 'column' }]}>
                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={styles.label}>Lease / Tenancy End Date</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="e.g. 31/12/2026"
                      value={leaseEndDate}
                      onChangeText={setLeaseEndDate}
                    />
                  </View>
                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={styles.label}>Vehicle Number (Optional)</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="e.g. DL 3C 9081"
                      value={tenantVehicle}
                      onChangeText={setTenantVehicle}
                      autoCapitalize="characters"
                    />
                  </View>
                </View>
              </>
            )}

            {/* ----------------- 3. MANAGING COMMITTEE ----------------- */}
            {role === 'admin' && (
              <>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Managing Committee Designation</Text>
                  <View style={styles.pickerRow}>
                    {COMMITTEE_POSITIONS.map((pos) => (
                      <TouchableOpacity
                        key={pos}
                        style={[styles.miniPill, committeePosition === pos && styles.miniPillActive]}
                        onPress={() => setCommitteePosition(pos)}
                      >
                        <Text style={[styles.miniPillText, committeePosition === pos && styles.miniPillTextActive]}>
                          {pos}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={[styles.row, isSmallPhone && { flexDirection: 'column' }]}>
                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={styles.label}>Society Registration No.</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="e.g. BOM/HSG/TC/1042"
                      value={regNumber}
                      onChangeText={setRegNumber}
                      autoCapitalize="characters"
                    />
                  </View>
                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={styles.label}>Total Units Managed</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="e.g. 120"
                      keyboardType="numeric"
                      value={totalUnits}
                      onChangeText={setTotalUnits}
                    />
                  </View>
                </View>
              </>
            )}

            {/* ----------------- 4. FACILITY MANAGER ----------------- */}
            {role === 'facility_manager' && (
              <>
                <View style={[styles.row, isSmallPhone && { flexDirection: 'column' }]}>
                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={styles.label}>Facility Agency / Employer</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="e.g. CBRE Estate Services"
                      value={fmAgency}
                      onChangeText={setFmAgency}
                    />
                  </View>
                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={styles.label}>Staff / Manager Badge ID *</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="e.g. FM-501"
                      value={fmBadgeId}
                      onChangeText={setFmBadgeId}
                      autoCapitalize="characters"
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Operations Duty Shift</Text>
                  <View style={styles.pickerRow}>
                    {FM_SHIFTS.map((sh) => (
                      <TouchableOpacity
                        key={sh}
                        style={[styles.miniPill, fmShift === sh && styles.miniPillActive]}
                        onPress={() => setFmShift(sh)}
                      >
                        <Text style={[styles.miniPillText, fmShift === sh && styles.miniPillTextActive]}>
                          {sh}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Supervised Critical Assets</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. Clubhouse, DG Backup, Elevators & Pumps"
                    value={fmAssets}
                    onChangeText={setFmAssets}
                  />
                </View>
              </>
            )}

            {/* ----------------- 5. SECURITY GUARD ----------------- */}
            {role === 'guard' && (
              <>
                <View style={[styles.row, isSmallPhone && { flexDirection: 'column' }]}>
                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={styles.label}>Security Agency / Employer</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="e.g. SIS Security Group"
                      value={guardAgency}
                      onChangeText={setGuardAgency}
                    />
                  </View>
                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={styles.label}>Security Badge / Guard ID *</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="e.g. GRD-9042"
                      value={guardBadgeId}
                      onChangeText={setGuardBadgeId}
                      autoCapitalize="characters"
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Assigned Gate Barrier Post</Text>
                  <View style={styles.pickerRow}>
                    {GUARD_POSTS.map((gp) => (
                      <TouchableOpacity
                        key={gp}
                        style={[styles.miniPill, guardPost === gp && styles.miniPillActive]}
                        onPress={() => setGuardPost(gp)}
                      >
                        <Text style={[styles.miniPillText, guardPost === gp && styles.miniPillTextActive]}>
                          {gp}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Guard Shift Window</Text>
                  <View style={styles.pickerRow}>
                    {GUARD_SHIFTS.map((sh) => (
                      <TouchableOpacity
                        key={sh}
                        style={[styles.miniPill, guardShift === sh && styles.miniPillActive]}
                        onPress={() => setGuardShift(sh)}
                      >
                        <Text style={[styles.miniPillText, guardShift === sh && styles.miniPillTextActive]}>
                          {sh}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </>
            )}

            {/* ----------------- 6. MAINTENANCE TECHNICIAN ----------------- */}
            {role === 'technician' && (
              <>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Trade Specialization</Text>
                  <View style={styles.pickerRow}>
                    {TECH_TRADES.map((tr) => (
                      <TouchableOpacity
                        key={tr}
                        style={[styles.miniPill, techTrade === tr && styles.miniPillActive]}
                        onPress={() => setTechTrade(tr)}
                      >
                        <Text style={[styles.miniPillText, techTrade === tr && styles.miniPillTextActive]}>
                          {tr}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={[styles.row, isSmallPhone && { flexDirection: 'column' }]}>
                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={styles.label}>Technician Badge / ID *</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="e.g. TECH-4401"
                      value={techBadgeId}
                      onChangeText={setTechBadgeId}
                      autoCapitalize="characters"
                    />
                  </View>
                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={styles.label}>Contractor / Agency</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="e.g. Otis Elevators / Urban Services"
                      value={techAgency}
                      onChangeText={setTechAgency}
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Emergency Breakdown Hotline (Optional)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. +91 98765 00111"
                    keyboardType="phone-pad"
                    value={techHotline}
                    onChangeText={setTechHotline}
                  />
                  <Text style={styles.helperText}>Published to residents during out-of-hours lift / power breakdowns</Text>
                </View>
              </>
            )}

            {/* ----------------- 7. SOCIETY VENDOR ----------------- */}
            {role === 'vendor' && (
              <>
                <View style={[styles.row, isSmallPhone && { flexDirection: 'column' }]}>
                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={styles.label}>Shop / Business Name *</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="e.g. AMA Fresh Mart & Provisions"
                      value={vendorShopName}
                      onChangeText={setVendorShopName}
                    />
                  </View>
                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={styles.label}>Commercial Stall / Unit</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="e.g. Commercial Block #01"
                      value={vendorStallNumber}
                      onChangeText={setVendorStallNumber}
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Retail Category</Text>
                  <View style={styles.pickerRow}>
                    {VENDOR_CATEGORIES.map((cat) => (
                      <TouchableOpacity
                        key={cat}
                        style={[styles.miniPill, vendorCategory === cat && styles.miniPillActive]}
                        onPress={() => setVendorCategory(cat)}
                      >
                        <Text style={[styles.miniPillText, vendorCategory === cat && styles.miniPillTextActive]}>
                          {cat}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Merchant UPI ID (For Direct Khata Settlements)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. orchidmart@icici"
                    value={vendorUpiId}
                    onChangeText={setVendorUpiId}
                    autoCapitalize="none"
                  />
                  <Text style={styles.helperText}>Enables instant digital settlements in Society Bazaar POS</Text>
                </View>
              </>
            )}

            {/* ----------------- 8. SOCIETY BULK SUPPLIER ----------------- */}
            {role === 'supplier' && (
              <>
                <View style={[styles.row, isSmallPhone && { flexDirection: 'column' }]}>
                  <View style={[styles.inputGroup, { flex: 1.4 }]}>
                    <Text style={styles.label}>Company / Agency Name *</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="e.g. AquaPure Infrastructure & Bulk Supplies"
                      value={supplierCompanyName}
                      onChangeText={setSupplierCompanyName}
                    />
                  </View>
                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={styles.label}>GSTIN Number *</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="e.g. 29AAACA1234A1Z5"
                      value={supplierGstin}
                      onChangeText={setSupplierGstin}
                      autoCapitalize="characters"
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Supply Category</Text>
                  <View style={styles.pickerRow}>
                    {SUPPLIER_CATEGORIES.map((cat) => (
                      <TouchableOpacity
                        key={cat}
                        style={[styles.miniPill, supplierCategory === cat && styles.miniPillActive]}
                        onPress={() => setSupplierCategory(cat)}
                      >
                        <Text style={[styles.miniPillText, supplierCategory === cat && styles.miniPillTextActive]}>
                          {cat}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Receiving UPI ID / Bank Remittance Handle</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. aquapure.orders@icici"
                    value={supplierUpiId}
                    onChangeText={setSupplierUpiId}
                    autoCapitalize="none"
                  />
                  <Text style={styles.helperText}>Used for B2B GST tax invoice payouts and society Khata settlements</Text>
                </View>
              </>
            )}
          </View>

          {/* ============================================================= */}
          {/* 3. MANDATORY POLICY & PRIVACY ACKNOWLEDGEMENTS                 */}
          {/* ============================================================= */}
          <View style={[styles.sectionBlock, !allAgreementsComplete && styles.sectionBlockLegal]}>
            <View style={styles.sectionHeaderRow}>
              <View style={[styles.stepCircle, { backgroundColor: allAgreementsComplete ? '#DCFCE7' : '#EEF2FF' }]}>
                {allAgreementsComplete ? (
                  <Ionicons name="checkmark-done" size={16} color="#16A34A" />
                ) : (
                  <Text style={styles.stepCircleText}>3</Text>
                )}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.sectionHeader}>Mandatory Legal &amp; Policy Agreements</Text>
                <Text style={styles.sectionSubHeader}>
                  Reading &amp; acknowledgement required by Society Byelaws &amp; DPDP Act
                </Text>
              </View>
              <View style={[styles.mandatoryBadge, allAgreementsComplete && { backgroundColor: '#DCFCE7', borderColor: '#BBF7D0' }]}>
                <Text style={[styles.mandatoryBadgeText, allAgreementsComplete && { color: '#15803D' }]}>
                  {allAgreementsComplete ? 'VERIFIED' : 'MANDATORY'}
                </Text>
              </View>
            </View>

            <Text style={styles.legalNoticeText}>
              To guarantee community safety and statutory compliance, checkboxes unlock and highlight <Text style={{ fontWeight: '800' }}>only after</Text> you have opened, read, and acknowledged the respective society terms.
            </Text>

            {/* ========================================================= */}
            {/* ACKNOWLEDGEMENT ITEM 1: TERMS OF SERVICE                  */}
            {/* ========================================================= */}
            <TouchableOpacity
              style={[
                styles.policyCard,
                hasReadTerms && agreeTerms
                  ? styles.policyCardTermsHighlighted
                  : styles.policyCardLocked,
              ]}
              onPress={handleToggleTerms}
              activeOpacity={0.85}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: hasReadTerms && agreeTerms }}
              accessibilityLabel="Terms of Service & Byelaws Acknowledgement"
            >
              {/* Highlighted Checkbox ONLY if read and acknowledged */}
              <View
                style={[
                  styles.checkboxSquare,
                  hasReadTerms && agreeTerms
                    ? styles.checkboxSquareTermsHighlighted
                    : styles.checkboxSquareLocked,
                ]}
              >
                {hasReadTerms && agreeTerms ? (
                  <Ionicons name="checkmark" size={15} color="#FFFFFF" />
                ) : (
                  <Ionicons name="lock-closed" size={11} color="#94A3B8" />
                )}
              </View>

              <View style={{ flex: 1 }}>
                <View style={styles.policyTitleRow}>
                  <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
                    <Text style={[styles.policyTitle, hasReadTerms && agreeTerms && styles.policyTitleTermsActive]}>
                      Terms of Service &amp; Byelaws *
                    </Text>
                    {hasReadTerms && agreeTerms ? (
                      <View style={styles.badgeAcknowledged}>
                        <Ionicons name="checkmark-circle" size={11} color="#4338CA" style={{ marginRight: 3 }} />
                        <Text style={styles.badgeAcknowledgedText}>READ &amp; ACKNOWLEDGED</Text>
                      </View>
                    ) : (
                      <View style={styles.badgeLocked}>
                        <Ionicons name="book-outline" size={10} color="#D97706" style={{ marginRight: 3 }} />
                        <Text style={styles.badgeLockedText}>READ REQUIRED</Text>
                      </View>
                    )}
                  </View>

                  {/* Read Terms Action Button */}
                  <TouchableOpacity
                    style={hasReadTerms && agreeTerms ? styles.rereadBtn : styles.readPolicyBtnPrimaryTerms}
                    onPress={() => setShowTermsModal(true)}
                    activeOpacity={0.8}
                  >
                    <Ionicons
                      name={hasReadTerms && agreeTerms ? "refresh-outline" : "book-outline"}
                      size={13}
                      color={hasReadTerms && agreeTerms ? "#4338CA" : "#FFFFFF"}
                      style={{ marginRight: 4 }}
                    />
                    <Text style={hasReadTerms && agreeTerms ? styles.rereadBtnText : styles.readPolicyBtnPrimaryText}>
                      {hasReadTerms && agreeTerms ? 'Re-read' : 'Read Terms \u2192'}
                    </Text>
                  </TouchableOpacity>
                </View>

                <Text style={styles.policyDescription}>
                  {hasReadTerms && agreeTerms ? (
                    <Text style={{ color: '#3730A3', fontWeight: '600' }}>
                      ✓ You have read and accepted the association byelaws: quiet hours (10 PM - 7 AM), dues by the 10th, and common amenity rules.
                    </Text>
                  ) : (
                    'Tap "Read Terms →" above to review quiet hours (10 PM - 7 AM), monthly assessments, parking, and common amenity byelaws to unlock this checkbox.'
                  )}
                </Text>
              </View>
            </TouchableOpacity>

            {/* ========================================================= */}
            {/* ACKNOWLEDGEMENT ITEM 2: APARTMENT PRIVACY POLICY          */}
            {/* ========================================================= */}
            <TouchableOpacity
              style={[
                styles.policyCard,
                hasReadPrivacy && agreePrivacy
                  ? styles.policyCardPrivacyHighlighted
                  : styles.policyCardLocked,
              ]}
              onPress={handleTogglePrivacy}
              activeOpacity={0.85}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: hasReadPrivacy && agreePrivacy }}
              accessibilityLabel="Apartment Privacy Policy & CCTV Disclosure Acknowledgement"
            >
              {/* Highlighted Checkbox ONLY if read and acknowledged */}
              <View
                style={[
                  styles.checkboxSquare,
                  hasReadPrivacy && agreePrivacy
                    ? styles.checkboxSquarePrivacyHighlighted
                    : styles.checkboxSquareLocked,
                ]}
              >
                {hasReadPrivacy && agreePrivacy ? (
                  <Ionicons name="checkmark" size={15} color="#FFFFFF" />
                ) : (
                  <Ionicons name="lock-closed" size={11} color="#94A3B8" />
                )}
              </View>

              <View style={{ flex: 1 }}>
                <View style={styles.policyTitleRow}>
                  <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
                    <Text style={[styles.policyTitle, hasReadPrivacy && agreePrivacy && styles.policyTitlePrivacyActive]}>
                      Apartment Privacy &amp; CCTV Disclosure *
                    </Text>
                    {hasReadPrivacy && agreePrivacy ? (
                      <View style={[styles.badgeAcknowledged, { backgroundColor: '#DCFCE7', borderColor: '#BBF7D0' }]}>
                        <Ionicons name="shield-checkmark" size={11} color="#15803D" style={{ marginRight: 3 }} />
                        <Text style={[styles.badgeAcknowledgedText, { color: '#15803D' }]}>READ &amp; ACKNOWLEDGED</Text>
                      </View>
                    ) : (
                      <View style={styles.badgeLocked}>
                        <Ionicons name="shield-outline" size={10} color="#D97706" style={{ marginRight: 3 }} />
                        <Text style={styles.badgeLockedText}>READ REQUIRED</Text>
                      </View>
                    )}
                  </View>

                  {/* Read Policy Action Button */}
                  <TouchableOpacity
                    style={hasReadPrivacy && agreePrivacy ? styles.rereadBtn : styles.readPolicyBtnPrimaryPrivacy}
                    onPress={() => setShowPrivacyModal(true)}
                    activeOpacity={0.8}
                  >
                    <Ionicons
                      name={hasReadPrivacy && agreePrivacy ? "refresh-outline" : "shield-checkmark-outline"}
                      size={13}
                      color={hasReadPrivacy && agreePrivacy ? "#15803D" : "#FFFFFF"}
                      style={{ marginRight: 4 }}
                    />
                    <Text style={hasReadPrivacy && agreePrivacy ? styles.rereadBtnText : styles.readPolicyBtnPrimaryText}>
                      {hasReadPrivacy && agreePrivacy ? 'Re-read' : 'Read Policy \u2192'}
                    </Text>
                  </TouchableOpacity>
                </View>

                <Text style={styles.policyDescription}>
                  {hasReadPrivacy && agreePrivacy ? (
                    <Text style={{ color: '#166534', fontWeight: '600' }}>
                      ✓ You have read and accepted the DPDP charter: 24/7 common area CCTV disclosure, masked phone numbers, and 48h visitor log purging.
                    </Text>
                  ) : (
                    'Tap "Read Policy →" above to review CCTV disclosures, RFID tracking, resident phone masking, and strict no-data-selling protections to unlock this checkbox.'
                  )}
                </Text>
              </View>
            </TouchableOpacity>

            {/* Quick Sequential Review Action if unread */}
            {!allAgreementsComplete && (
              <TouchableOpacity
                style={styles.reviewBothBtn}
                onPress={() => {
                  triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
                  if (!hasReadTerms) {
                    setShowTermsModal(true);
                  } else if (!hasReadPrivacy) {
                    setShowPrivacyModal(true);
                  }
                }}
                activeOpacity={0.85}
              >
                <Ionicons name="book" size={16} color="#4338CA" style={{ marginRight: 8 }} />
                <Text style={styles.reviewBothBtnText}>
                  {!hasReadTerms
                    ? '1. Open & Review Terms of Service'
                    : '2. Open & Review Apartment Privacy Policy'}
                </Text>
              </TouchableOpacity>
            )}

            {allAgreementsComplete && (
              <View style={styles.agreedConfirmedBanner}>
                <Ionicons name="checkmark-circle" size={18} color="#16A34A" style={{ marginRight: 8 }} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.agreedConfirmedTitle}>
                    All Policies Verified &amp; Checkboxes Highlighted
                  </Text>
                  <Text style={styles.agreedConfirmedSub}>
                    You may now complete your society association registration below.
                  </Text>
                </View>
              </View>
            )}
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[
              styles.primaryBtn,
              !allAgreementsComplete && styles.primaryBtnPending,
            ]}
            onPress={handleRegister}
            activeOpacity={0.88}
            accessibilityRole="button"
            accessibilityLabel={`Register as ${getRoleDisplayName(role)}`}
          >
            <View style={styles.primaryBtnRow}>
              <Ionicons
                name={allAgreementsComplete ? "checkmark-circle" : "lock-closed-outline"}
                size={18}
                color="#FFFFFF"
                style={{ marginRight: 8 }}
              />
              <Text style={styles.primaryBtnText}>
                {allAgreementsComplete
                  ? `Register as ${getRoleDisplayName(role)} \u2192`
                  : `Read & Acknowledge Policies to Register \u2192`}
              </Text>
            </View>
          </TouchableOpacity>

          {/* Login Redirection Link */}
          <TouchableOpacity
            style={styles.footerLink}
            onPress={() => router.replace('/auth/login')}
            accessibilityRole="button"
          >
            <Text style={styles.footerText}>
              Already registered? <Text style={styles.loginLink}>Sign In to your workspace</Text>
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* ============================================================= */}
      {/* MODAL 1: APARTMENT ASSOCIATION TERMS OF SERVICE               */}
      {/* ============================================================= */}
      <Modal
        visible={showTermsModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowTermsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />

            {/* Modal Header */}
            <View style={styles.modalHeaderRow}>
              <View style={{ flex: 1 }}>
                <View style={styles.modalBadge}>
                  <Text style={styles.modalBadgeText}>ASSOCIATION BYELAWS</Text>
                </View>
                <Text style={styles.modalTitle}>Terms of Service</Text>
                <Text style={styles.modalSubtitle}>
                  Model Code of Conduct &amp; Community Rules (Rev. 2026)
                </Text>
              </View>
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setShowTermsModal(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close" size={20} color="#334155" />
              </TouchableOpacity>
            </View>

            {/* Scrollable Terms Content */}
            <ScrollView
              style={styles.modalBodyScroll}
              showsVerticalScrollIndicator={true}
              contentContainerStyle={styles.modalBodyContent}
            >
              <View style={styles.policySection}>
                <Text style={styles.policySectionHeading}>1. Scope &amp; Legal Enforceability</Text>
                <Text style={styles.policyParagraph}>
                  These Terms of Service govern onboarding, access, and residency conduct within the Apartment Owners Association (AOA/CHS). By registering on this platform, all flat owners, tenant residents, managing committee members, facility staff, guards, and commercial vendors contractually agree to abide by these byelaws and any resolutions enacted in General Body Meetings (GBM).
                </Text>
              </View>

              <View style={styles.policySection}>
                <Text style={styles.policySectionHeading}>2. Community Code of Conduct &amp; Quiet Hours</Text>
                <Text style={styles.policyParagraph}>
                  • Official quiet hours are maintained daily between 10:00 PM and 07:00 AM. High-decibel audio, noisy social gatherings, or heavy domestic equipment usage is prohibited during quiet hours.
                </Text>
                <Text style={styles.policyParagraph}>
                  • Common hallways, lobbies, fire staircases, and lift landings must remain clear of personal storage, shoe racks, cycles, and debris at all times for fire safety compliance.
                </Text>
                <Text style={styles.policyParagraph}>
                  • Residential units shall be utilized solely for residential purposes. Commercial warehousing, guest house operations, or unauthorized subletting is strictly prohibited.
                </Text>
              </View>

              <View style={styles.policySection}>
                <Text style={styles.policySectionHeading}>3. Maintenance Assessments &amp; Sinking Fund</Text>
                <Text style={styles.policyParagraph}>
                  • All flat owners and tenants must remit monthly maintenance contributions and utility charges on or before the 10th calendar day of each billing cycle.
                </Text>
                <Text style={styles.policyParagraph}>
                  • Late payments carry a statutory interest penalty of 18% per annum as approved in society resolutions. Continued default exceeding 60 days may result in suspension of discretionary clubhouse and amenity access.
                </Text>
              </View>

              <View style={styles.policySection}>
                <Text style={styles.policySectionHeading}>4. Common Amenities &amp; Facility Usage</Text>
                <Text style={styles.policyParagraph}>
                  • Amenities including the Swimming Pool, Gymnasium, Clubhouse Party Hall, and Sports Courts require prior time-slot bookings via the AMA app.
                </Text>
                <Text style={styles.policyParagraph}>
                  • Users must adhere to posted dress codes, hygiene protocols, and guest quotas. Commercial coaching or unapproved external rentals are not permitted without Managing Committee authorization.
                </Text>
              </View>

              <View style={styles.policySection}>
                <Text style={styles.policySectionHeading}>5. Security, Gate Passes &amp; Vehicle Parking</Text>
                <Text style={styles.policyParagraph}>
                  • Residents must pre-approve visitors, delivery agents, and cabs via the AMA digital pass system or provide immediate OTP authorization to the guard post.
                </Text>
                <Text style={styles.policyParagraph}>
                  • Motor vehicles must display active RFID association tags and be parked strictly within designated numbered bays. Unauthorized parking in visitor or emergency bays is subject to wheel clamping and fines.
                </Text>
              </View>

              <View style={styles.policySection}>
                <Text style={styles.policySectionHeading}>6. Fit-Outs, Renovation &amp; Vendor Work Hours</Text>
                <Text style={styles.policyParagraph}>
                  • Interior modifications, carpentry, and drilling are permitted exclusively between 09:00 AM and 06:00 PM, Monday through Saturday.
                </Text>
                <Text style={styles.policyParagraph}>
                  • No noisy structural or renovation work is permitted on Sundays or national holidays. Debris must be removed via service elevators and hauled outside society boundaries at owner's expense.
                </Text>
              </View>

              <View style={styles.policySection}>
                <Text style={styles.policySectionHeading}>7. Grievances, Arbitration &amp; Penalties</Text>
                <Text style={styles.policyParagraph}>
                  • Disputes shall be escalated through the digital Service Ticket grievance portal to the Managing Committee. The committee reserves the right to issue warnings and levy standard byelaw penalties for verified violations.
                </Text>
              </View>
            </ScrollView>

            {/* Modal Footer with Explicit Read & Acknowledge Action */}
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.modalSecondaryBtn}
                onPress={() => setShowTermsModal(false)}
              >
                <Text style={styles.modalSecondaryBtnText}>Close</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalPrimaryBtn}
                onPress={() => {
                  triggerHaptic(Haptics.ImpactFeedbackStyle.Heavy);
                  setHasReadTerms(true);
                  setAgreeTerms(true);
                  setShowTermsModal(false);
                  setErrorMsg('');
                }}
              >
                <Ionicons name="checkmark-done-circle" size={17} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.modalPrimaryBtnText}>I Have Read &amp; Acknowledge Terms</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ============================================================= */}
      {/* MODAL 2: APARTMENT PRIVACY POLICY & CCTV DISCLOSURE           */}
      {/* ============================================================= */}
      <Modal
        visible={showPrivacyModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowPrivacyModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />

            {/* Modal Header */}
            <View style={styles.modalHeaderRow}>
              <View style={{ flex: 1 }}>
                <View style={[styles.modalBadge, { backgroundColor: '#DCFCE7', borderColor: '#BBF7D0' }]}>
                  <Text style={[styles.modalBadgeText, { color: '#15803D' }]}>DPDP ACT COMPLIANT</Text>
                </View>
                <Text style={styles.modalTitle}>Apartment Privacy Policy</Text>
                <Text style={styles.modalSubtitle}>
                  Resident Data Protection &amp; CCTV Surveillance Charter
                </Text>
              </View>
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setShowPrivacyModal(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close" size={20} color="#334155" />
              </TouchableOpacity>
            </View>

            {/* Scrollable Privacy Content */}
            <ScrollView
              style={styles.modalBodyScroll}
              showsVerticalScrollIndicator={true}
              contentContainerStyle={styles.modalBodyContent}
            >
              <View style={styles.policySection}>
                <Text style={styles.policySectionHeading}>1. Purpose &amp; Regulatory Framework</Text>
                <Text style={styles.policyParagraph}>
                  This Privacy Policy outlines how the Apartment Association and AMA platform collect, store, and safeguard your personal data in strict compliance with the Digital Personal Data Protection (DPDP) Act and municipal cooperative housing guidelines.
                </Text>
              </View>

              <View style={styles.policySection}>
                <Text style={styles.policySectionHeading}>2. Information Collected</Text>
                <Text style={styles.policyParagraph}>
                  • **Resident Identity**: Full name, primary email address, registered mobile phone number, unit/flat assignment, tower, and emergency contact details.
                </Text>
                <Text style={styles.policyParagraph}>
                  • **Access &amp; Vehicle Data**: Vehicle license plate numbers, RFID barrier tag identifiers, and digital visitor gate pass records.
                </Text>
                <Text style={styles.policyParagraph}>
                  • **Staff &amp; Vendor Records**: Security badge numbers, trade specializations, agency employment credentials, and commercial merchant UPI IDs.
                </Text>
              </View>

              <View style={styles.policySection}>
                <Text style={styles.policySectionHeading}>3. CCTV &amp; Video Surveillance Disclosure</Text>
                <Text style={styles.policyParagraph}>
                  • Common residential areas including main perimeter entry/exit gates, basement parking basements, elevator lobbies, clubhouse corridors, and perimeter fences are monitored 24/7 by Closed-Circuit Television (CCTV) cameras.
                </Text>
                <Text style={styles.policyParagraph}>
                  • Video footage is stored securely on encrypted Network Video Recorders (NVR) with an automated 30-day retention cycle, after which older data is automatically overwritten.
                </Text>
                <Text style={styles.policyParagraph}>
                  • Access to surveillance feeds is strictly restricted to designated Security In-Charge personnel and the Managing Committee, released only to official law enforcement agencies upon formal written summons.
                </Text>
              </View>

              <View style={styles.policySection}>
                <Text style={styles.policySectionHeading}>4. Resident Contact Privacy &amp; Phone Masking</Text>
                <Text style={styles.policyParagraph}>
                  • To ensure personal confidentiality, resident mobile numbers are dynamically masked (e.g. `987****210`) in guard scanning feeds, domestic worker manifests, and community bazaar order receipts.
                </Text>
                <Text style={styles.policyParagraph}>
                  • Your direct contact details are never exposed to other residents in public channels without your explicit consent.
                </Text>
              </View>

              <View style={styles.policySection}>
                <Text style={styles.policySectionHeading}>5. Strict Prohibition on Third-Party Data Selling</Text>
                <Text style={styles.policyParagraph}>
                  • The Apartment Association and AMA maintain an absolute zero-tolerance policy against commercial data monetisation.
                </Text>
                <Text style={styles.policyParagraph}>
                  • Resident telephone numbers, emails, vehicle logs, and family directory details are **never** sold, rented, leased, or disclosed to third-party telemarketers, real estate brokers, banks, or external commercial advertisers.
                </Text>
              </View>

              <View style={styles.policySection}>
                <Text style={styles.policySectionHeading}>6. Visitor Log Data Minimization</Text>
                <Text style={styles.policyParagraph}>
                  • Visitor entry records, delivery pass timestamps, and cab logs are retained solely for 48 hours for immediate incident tracking, after which temporary visitor tokens are securely purged.
                </Text>
              </View>

              <View style={styles.policySection}>
                <Text style={styles.policySectionHeading}>7. Data Subject Rights &amp; Tenancy Termination</Text>
                <Text style={styles.policyParagraph}>
                  • You retain the right to inspect, update, or rectify your profile data at any time via the AMA app. Upon moving out or terminating tenancy, residents may request immediate account de-identification and RFID deactivation.
                </Text>
              </View>
            </ScrollView>

            {/* Modal Footer with Explicit Read & Acknowledge Action */}
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.modalSecondaryBtn}
                onPress={() => setShowPrivacyModal(false)}
              >
                <Text style={styles.modalSecondaryBtnText}>Close</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalPrimaryBtn, { backgroundColor: '#16A34A' }]}
                onPress={() => {
                  triggerHaptic(Haptics.ImpactFeedbackStyle.Heavy);
                  setHasReadPrivacy(true);
                  setAgreePrivacy(true);
                  setShowPrivacyModal(false);
                  setErrorMsg('');
                }}
              >
                <Ionicons name="shield-checkmark" size={17} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.modalPrimaryBtnText}>I Have Read &amp; Acknowledge Privacy</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  scroll: {
    padding: 20,
    paddingBottom: 48,
  },
  heroSection: {
    marginBottom: 20,
  },
  titleBadge: {
    backgroundColor: '#EEF2FF',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#C7D2FE',
    marginBottom: 8,
  },
  titleBadgeText: {
    color: '#4338CA',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  heading: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  subheading: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
    marginBottom: 16,
  },
  roleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 6,
  },
  roleCard: {
    width: '48%',
    flexGrow: 1,
    borderWidth: 1.5,
    borderRadius: 18,
    padding: 12,
    position: 'relative',
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  roleCardWide: {
    width: '100%',
  },
  roleCardActive: {
    borderWidth: 2,
    shadowOpacity: 0.1,
    elevation: 3,
  },
  roleCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  roleIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleEmoji: {
    fontSize: 19,
  },
  activeDotBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1E293B',
  },
  roleSubtitle: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    marginTop: 1,
  },
  roleDesc: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 3,
    lineHeight: 13,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECDD3',
    padding: 12,
    borderRadius: 14,
    marginBottom: 16,
  },
  errorBannerText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#DC2626',
    flex: 1,
  },
  sectionBlock: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 22,
    padding: 18,
    marginBottom: 16,
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1,
  },
  sectionBlockLegal: {
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  stepCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCircleText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#4338CA',
  },
  roleEmojiStep: {
    fontSize: 16,
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1E293B',
    letterSpacing: -0.2,
  },
  sectionSubHeader: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  mandatoryBadge: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  mandatoryBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#DC2626',
    letterSpacing: 0.5,
  },
  legalNoticeText: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 17,
    marginBottom: 14,
  },

  // Policy Cards Styles
  policyCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    gap: 12,
  },
  policyCardLocked: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  policyCardTermsHighlighted: {
    backgroundColor: '#F5F3FF',
    borderWidth: 2,
    borderColor: '#4338CA',
    shadowColor: '#4338CA',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  policyCardPrivacyHighlighted: {
    backgroundColor: '#F0FDF4',
    borderWidth: 2,
    borderColor: '#16A34A',
    shadowColor: '#16A34A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },

  // Checkbox Styles
  checkboxSquare: {
    width: 22,
    height: 22,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  checkboxSquareLocked: {
    backgroundColor: '#F1F5F9',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
  },
  checkboxSquareTermsHighlighted: {
    backgroundColor: '#4338CA',
    borderWidth: 2,
    borderColor: '#4338CA',
    shadowColor: '#4338CA',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
    elevation: 3,
  },
  checkboxSquarePrivacyHighlighted: {
    backgroundColor: '#16A34A',
    borderWidth: 2,
    borderColor: '#16A34A',
    shadowColor: '#16A34A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
    elevation: 3,
  },

  policyTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
    flexWrap: 'wrap',
    gap: 6,
  },
  policyTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#334155',
  },
  policyTitleTermsActive: {
    color: '#4338CA',
  },
  policyTitlePrivacyActive: {
    color: '#15803D',
  },
  policyDescription: {
    fontSize: 11,
    color: '#64748B',
    lineHeight: 16,
  },

  // Badges
  badgeAcknowledged: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#C7D2FE',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeAcknowledgedText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#4338CA',
    letterSpacing: 0.4,
  },
  badgeLocked: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeLockedText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#B45309',
    letterSpacing: 0.4,
  },

  // Action Buttons on Policy Cards
  readPolicyBtnPrimaryTerms: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4338CA',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    shadowColor: '#4338CA',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 2,
  },
  readPolicyBtnPrimaryPrivacy: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#16A34A',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    shadowColor: '#16A34A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 2,
  },
  readPolicyBtnPrimaryText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  rereadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  rereadBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },

  // Review Both Shortcut Button
  reviewBothBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EEF2FF',
    borderWidth: 1.5,
    borderColor: '#C7D2FE',
    borderRadius: 14,
    paddingVertical: 11,
    marginTop: 4,
    marginBottom: 2,
  },
  reviewBothBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#4338CA',
  },

  agreedConfirmedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderWidth: 1.5,
    borderColor: '#BBF7D0',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginTop: 6,
  },
  agreedConfirmedTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#15803D',
  },
  agreedConfirmedSub: {
    fontSize: 10,
    color: '#166534',
    marginTop: 2,
  },

  inputGroup: {
    marginBottom: 14,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6,
  },
  input: {
    minHeight: TOUCH_TARGET.minHeight,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 14,
    paddingHorizontal: 14,
    fontSize: 13,
    color: '#0F172A',
  },
  helperText: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 4,
  },
  togglePasswordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
    minHeight: 32,
  },
  togglePasswordText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4338CA',
  },
  pickerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  miniPill: {
    minHeight: 36,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniPillActive: {
    backgroundColor: '#4338CA',
    borderColor: '#4338CA',
  },
  miniPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  miniPillTextActive: {
    color: '#FFFFFF',
  },
  primaryBtn: {
    minHeight: 52,
    backgroundColor: '#4338CA',
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    marginBottom: 16,
    shadowColor: '#4338CA',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 3,
  },
  primaryBtnPending: {
    opacity: 0.85,
    backgroundColor: '#334155',
  },
  primaryBtnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  footerLink: {
    minHeight: TOUCH_TARGET.minHeight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerText: {
    fontSize: 13,
    color: '#64748B',
  },
  loginLink: {
    fontWeight: '800',
    color: '#4338CA',
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  modalSheet: {
    width: '100%',
    maxWidth: 680,
    maxHeight: '85%',
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 36 : 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 10,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#CBD5E1',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 14,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 12,
  },
  modalBadge: {
    backgroundColor: '#EEF2FF',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#C7D2FE',
    marginBottom: 4,
  },
  modalBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#4338CA',
    letterSpacing: 0.5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  modalSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBodyScroll: {
    flex: 1,
  },
  modalBodyContent: {
    paddingVertical: 8,
    paddingRight: 4,
  },
  policySection: {
    marginBottom: 16,
  },
  policySectionHeading: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 6,
  },
  policyParagraph: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 18,
    marginBottom: 6,
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  modalSecondaryBtn: {
    flex: 1,
    minHeight: 46,
    backgroundColor: '#F1F5F9',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSecondaryBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },
  modalPrimaryBtn: {
    flex: 2,
    minHeight: 46,
    backgroundColor: '#4338CA',
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalPrimaryBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
