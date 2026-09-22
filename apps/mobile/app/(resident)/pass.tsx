import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../stores/authStore';
import { EditProfileModal } from '../../components/profile/EditProfileModal';
import { LegalPolicyModal } from '../../components/legal/LegalPolicyModal';
import {
  useVisitorPassStore,
  VisitorPass,
  VisitorCategory,
  checkPassTimingValidity,
} from '../../stores/visitorPassStore';
import {
  sharePassWithQrCode,
  downloadQrCodeImage,
  copyPassToClipboard,
  getQrImageUrl,
} from '../../utils/qrShare';

export default function PassScreen() {
  const { user } = useAuthStore();
  const { passes, addPass, cancelPass } = useVisitorPassStore();

  // SVG QR Code refs for exporting base64 images
  const residentQrRef = useRef<any>(null);
  const visitorQrRef = useRef<any>(null);

  // Active Tab: 'RESIDENT' or 'VISITOR'
  const [activeTab, setActiveTab] = useState<'RESIDENT' | 'VISITOR'>('RESIDENT');

  // Edit Resident Profile Modal
  const [editProfileVisible, setEditProfileVisible] = useState(false);
  const [legalModalVisible, setLegalModalVisible] = useState(false);

  // Dynamic Resident QR token state (refreshed on demand)
  const [qrSalt, setQrSalt] = useState(Date.now().toString());

  // Issue Visitor Pass Modal
  const [issueModalVisible, setIssueModalVisible] = useState(false);
  const [visitorName, setVisitorName] = useState('');
  const [visitorPhone, setVisitorPhone] = useState('');
  const [category, setCategory] = useState<VisitorCategory>('Guest');
  const [selectedDatePreset, setSelectedDatePreset] = useState<'today' | 'tomorrow' | 'dayAfter' | 'custom'>('today');
  const [customDate, setCustomDate] = useState('');
  const [selectedTimePreset, setSelectedTimePreset] = useState<string>('Afternoon (02:00 PM - 06:00 PM)');
  const [customStartTime, setCustomStartTime] = useState('02:00 PM');
  const [customEndTime, setCustomEndTime] = useState('06:00 PM');
  const [vehicleNumber, setVehicleNumber] = useState('');

  // Selected Visitor Pass for QR / Details Modal
  const [selectedPass, setSelectedPass] = useState<VisitorPass | null>(null);

  // Filter for Visitor Passes list
  const [passFilter, setPassFilter] = useState<'ALL' | 'ACTIVE' | 'SCHEDULED' | 'PAST'>('ALL');

  // Compute Resident Details
  const residentName = user?.name || 'Aditya Sharma';
  const residentFlat = user?.flatNumber || 'B-204';
  const residentTower = user?.tower || 'Tower B';
  const residentPhone = user?.phone || '+91 98765 43210';
  const residentQrData = `AMA-RESIDENT:${user?.id || 'res-01'}:${residentName}:${residentFlat}:${residentTower}:${qrSalt}`;

  // Helper to build robust visitor QR payload with full host information
  const getVisitorQrPayload = (pass: VisitorPass) => {
    const hostFlat = pass.flatNumber || residentFlat;
    const hostTower = pass.tower || residentTower;
    const hostName = pass.residentName || residentName;
    return `AMA-VISITOR:${pass.id}:${pass.accessPin}:${hostFlat}:${hostTower}:${hostName}:${pass.validDate}:${pass.startTime}:${pass.endTime}`;
  };

  // Helper to extract base64 PNG from QRCode component ref
  const getQrBase64 = (ref: React.MutableRefObject<any>): Promise<string | undefined> => {
    return new Promise((resolve) => {
      try {
        if (ref.current && typeof ref.current.toDataURL === 'function') {
          ref.current.toDataURL((data: string) => {
            resolve(data);
          });
        } else {
          resolve(undefined);
        }
      } catch (e) {
        resolve(undefined);
      }
    });
  };

  // Date calculation helper
  const getDateString = (offsetDays: number) => {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    const day = d.getDate();
    const month = d.toLocaleDateString('en-US', { month: 'short' });
    const year = d.getFullYear();
    const weekday = d.toLocaleDateString('en-US', { weekday: 'short' });
    if (offsetDays === 0) return `Today, ${day} ${month} ${year}`;
    if (offsetDays === 1) return `Tomorrow, ${day} ${month} ${year}`;
    return `${weekday}, ${day} ${month} ${year}`;
  };

  const getRawDateString = (offsetDays: number) => {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    return d.toISOString().split('T')[0];
  };

  const timePresets = [
    { label: 'Morning (08:00 AM - 12:00 PM)', start: '08:00 AM', end: '12:00 PM' },
    { label: 'Mid-Day (11:00 AM - 04:00 PM)', start: '11:00 AM', end: '04:00 PM' },
    { label: 'Afternoon (02:00 PM - 06:00 PM)', start: '02:00 PM', end: '06:00 PM' },
    { label: 'Evening (05:00 PM - 09:00 PM)', start: '05:00 PM', end: '09:00 PM' },
    { label: 'All Day (08:00 AM - 10:00 PM)', start: '08:00 AM', end: '10:00 PM' },
    { label: 'Custom Time Window', start: customStartTime, end: customEndTime },
  ];

  // Refresh Resident QR code
  const handleRefreshQr = () => {
    setQrSalt(Date.now().toString());
    Alert.alert('QR Code Refreshed', 'A new dynamic security token has been generated.');
  };

  // Share Resident Pass with scannable QR Code
  const handleShareResidentPass = async () => {
    const base64 = await getQrBase64(residentQrRef);
    await sharePassWithQrCode(
      {
        passId: qrSalt.slice(-6),
        passType: 'RESIDENT',
        title: `AMA Resident Gate Pass - ${residentName}`,
        residentName,
        flatNumber: residentFlat,
        tower: residentTower,
        validDate: 'Active Member Pass',
        accessPin: qrSalt.slice(-6),
        qrPayload: residentQrData,
      },
      base64
    );
  };

  // Download Resident QR code image directly
  const handleDownloadResidentQr = async () => {
    const base64 = await getQrBase64(residentQrRef);
    await downloadQrCodeImage(residentQrData, `Resident-${residentFlat}`, base64);
  };

  // Share Visitor Pass with scannable QR Code
  const handleShareVisitorPass = async (pass: VisitorPass) => {
    const hostName = pass.residentName || residentName;
    const hostFlat = pass.flatNumber || residentFlat;
    const hostTower = pass.tower || residentTower;
    const hostPhone = pass.residentPhone || residentPhone;
    const qrPayload = getVisitorQrPayload(pass);
    let base64: string | undefined;
    if (selectedPass?.id === pass.id) {
      base64 = await getQrBase64(visitorQrRef);
    }

    await sharePassWithQrCode(
      {
        passId: pass.id,
        passType: 'VISITOR',
        title: `AMA Visitor Gate Pass for ${pass.visitorName}`,
        visitorName: pass.visitorName,
        category: pass.category,
        residentName: hostName,
        flatNumber: hostFlat,
        tower: hostTower,
        residentPhone: hostPhone,
        validDate: pass.validDate,
        timeWindow: `${pass.startTime} - ${pass.endTime}`,
        accessPin: pass.accessPin,
        vehicleNumber: pass.vehicleNumber,
        qrPayload,
      },
      base64
    );
  };

  // Download Visitor QR code image directly
  const handleDownloadVisitorQr = async (pass: VisitorPass) => {
    const qrPayload = getVisitorQrPayload(pass);
    let base64: string | undefined;
    if (selectedPass?.id === pass.id) {
      base64 = await getQrBase64(visitorQrRef);
    }
    await downloadQrCodeImage(qrPayload, `Visitor-${pass.id}`, base64);
  };

  // Copy Visitor Pass link & PIN to clipboard
  const handleCopyVisitorPass = async (pass: VisitorPass) => {
    const hostName = pass.residentName || residentName;
    const hostFlat = pass.flatNumber || residentFlat;
    const hostTower = pass.tower || residentTower;
    const hostPhone = pass.residentPhone || residentPhone;
    const qrPayload = getVisitorQrPayload(pass);
    await copyPassToClipboard({
      passId: pass.id,
      passType: 'VISITOR',
      visitorName: pass.visitorName,
      category: pass.category,
      residentName: hostName,
      flatNumber: hostFlat,
      tower: hostTower,
      residentPhone: hostPhone,
      validDate: pass.validDate,
      timeWindow: `${pass.startTime} - ${pass.endTime}`,
      accessPin: pass.accessPin,
      vehicleNumber: pass.vehicleNumber,
      qrPayload,
    });
  };

  // Handle Create Visitor Pass
  const handleCreateVisitorPass = () => {
    if (!visitorName.trim()) {
      Alert.alert('Validation Error', 'Please enter the visitor or delivery person name.');
      return;
    }

    let finalDate = '';
    let finalDateRaw = '';

    if (selectedDatePreset === 'today') {
      finalDate = getDateString(0);
      finalDateRaw = getRawDateString(0);
    } else if (selectedDatePreset === 'tomorrow') {
      finalDate = getDateString(1);
      finalDateRaw = getRawDateString(1);
    } else if (selectedDatePreset === 'dayAfter') {
      finalDate = getDateString(2);
      finalDateRaw = getRawDateString(2);
    } else {
      if (!customDate.trim()) {
        Alert.alert('Validation Error', 'Please specify a valid date (e.g. 18 Sep 2026).');
        return;
      }
      finalDate = customDate.trim();
      finalDateRaw = customDate.trim();
    }

    // Past date check
    const targetDateObj = new Date(finalDate.replace(/^[A-Za-z]+,\s*/, ''));
    if (!isNaN(targetDateObj.getTime())) {
      const todayZero = new Date();
      todayZero.setHours(0, 0, 0, 0);
      const targetZero = new Date(targetDateObj.getFullYear(), targetDateObj.getMonth(), targetDateObj.getDate());
      if (targetZero < todayZero) {
        Alert.alert('Invalid Date', 'Visitor passes cannot be created for past dates.');
        return;
      }
    }

    let startTime = '';
    let endTime = '';

    if (selectedTimePreset === 'Custom Time Window') {
      if (!customStartTime.trim() || !customEndTime.trim()) {
        Alert.alert('Validation Error', 'Please enter both start time and end time.');
        return;
      }
      startTime = customStartTime.trim();
      endTime = customEndTime.trim();
    } else {
      const presetObj = timePresets.find((p) => p.label === selectedTimePreset);
      if (presetObj) {
        startTime = presetObj.start;
        endTime = presetObj.end;
      } else {
        startTime = '09:00 AM';
        endTime = '05:00 PM';
      }
    }

    const newPassId = addPass({
      visitorName: visitorName.trim(),
      visitorPhone: visitorPhone.trim() || undefined,
      category,
      validDate: finalDate,
      validDateRaw: finalDateRaw,
      startTime,
      endTime,
      timeSlotLabel: `${startTime} - ${endTime}`,
      flatNumber: residentFlat,
      tower: residentTower,
      residentName: residentName,
      residentPhone: residentPhone,
      vehicleNumber: vehicleNumber.trim() || undefined,
    });

    setIssueModalVisible(false);
    // Reset inputs
    setVisitorName('');
    setVisitorPhone('');
    setVehicleNumber('');

    // Open created pass QR preview
    const createdPass = useVisitorPassStore.getState().getPassById(newPassId);
    if (createdPass) {
      setSelectedPass(createdPass);
    }
  };

  // Filtered visitor passes
  const filteredPasses = passes.filter((p) => {
    const validity = checkPassTimingValidity(p);
    if (passFilter === 'ACTIVE') return validity.isToday && p.status === 'ACTIVE';
    if (passFilter === 'SCHEDULED') return !validity.isToday && validity.isValid && p.status === 'ACTIVE';
    if (passFilter === 'PAST') return !validity.isValid || p.status !== 'ACTIVE';
    return true;
  });

  const getCategoryIcon = (cat: VisitorCategory) => {
    switch (cat) {
      case 'Delivery': return 'cube-outline';
      case 'Cab': return 'car-outline';
      case 'Maintenance': return 'construct-outline';
      case 'Guest': return 'person-outline';
      default: return 'people-outline';
    }
  };

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.topHeader}>
        <View>
          <Text style={styles.screenHeading}>Digital Access Passes</Text>
          <Text style={styles.screenSub}>Smart gate entry for residents and visitors</Text>
        </View>
        {activeTab === 'RESIDENT' ? (
          <TouchableOpacity
            style={styles.editProfilePill}
            onPress={() => setEditProfileVisible(true)}
          >
            <Ionicons name="pencil" size={14} color="#1D4ED8" />
            <Text style={styles.editProfilePillText}>Edit Profile</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.issuePassBtn}
            onPress={() => setIssueModalVisible(true)}
          >
            <Ionicons name="add" size={18} color="#FFFFFF" />
            <Text style={styles.issuePassBtnText}>+ Issue Pass</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Segmented Tab Switcher */}
      <View style={styles.segmentedContainer}>
        <TouchableOpacity
          style={[styles.segmentBtn, activeTab === 'RESIDENT' && styles.segmentBtnActive]}
          onPress={() => setActiveTab('RESIDENT')}
        >
          <Ionicons
            name="person-circle-outline"
            size={18}
            color={activeTab === 'RESIDENT' ? '#1D4ED8' : '#64748B'}
            style={{ marginRight: 6 }}
          />
          <Text style={[styles.segmentText, activeTab === 'RESIDENT' && styles.segmentTextActive]}>
            My Resident ID
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.segmentBtn, activeTab === 'VISITOR' && styles.segmentBtnActive]}
          onPress={() => setActiveTab('VISITOR')}
        >
          <Ionicons
            name="ticket-outline"
            size={18}
            color={activeTab === 'VISITOR' ? '#1D4ED8' : '#64748B'}
            style={{ marginRight: 6 }}
          />
          <Text style={[styles.segmentText, activeTab === 'VISITOR' && styles.segmentTextActive]}>
            Visitor Passes
          </Text>
          <View style={styles.tabBadge}>
            <Text style={styles.tabBadgeText}>{passes.length}</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* TAB 1: MY RESIDENT PASS */}
      {activeTab === 'RESIDENT' && (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View>
                <Text style={styles.cardTitle}>Resident Gate Pass</Text>
                <Text style={styles.cardSub}>Society Member ID</Text>
              </View>
              <View style={styles.statusBadge}>
                <View style={styles.statusDot} />
                <Text style={styles.statusText}>Active Resident</Text>
              </View>
            </View>

            {/* Scannable Dynamic QR Code */}
            <View style={styles.qrContainer}>
              <QRCode
                value={residentQrData}
                size={220}
                backgroundColor="white"
                color="#0F172A"
                getRef={(c) => { residentQrRef.current = c; }}
              />
              <Text style={styles.qrSubCaption}>Scannable by Gatekeeper & Security</Text>
            </View>

            {/* Resident Details (Dynamically bound to useAuthStore) */}
            <View style={styles.infoSection}>
              <Text style={styles.name}>{residentName}</Text>
              <Text style={styles.unit}>{residentFlat} • {residentTower}</Text>
              <View style={styles.contactRow}>
                <Ionicons name="call-outline" size={14} color="#64748B" />
                <Text style={styles.contactText}>{residentPhone}</Text>
              </View>
            </View>

            {/* Security token details */}
            <View style={styles.metaBox}>
              <Ionicons name="shield-checkmark" size={16} color="#10B981" />
              <Text style={styles.metaText}>
                Live Token: <Text style={{ fontWeight: 'bold' }}>{qrSalt.slice(-6)}</Text>
              </Text>
            </View>

            <Text style={styles.instructions}>
              Show this QR code at any society checkpoint for instant contactless access, or share the verified QR image.
            </Text>
          </View>

          {/* Action Buttons Row */}
          <View style={styles.actionsContainer}>
            <TouchableOpacity style={styles.actionButton} onPress={handleRefreshQr}>
              <View style={styles.actionIconWrap}>
                <Ionicons name="refresh" size={20} color="#1D4ED8" />
              </View>
              <Text style={styles.actionText}>Refresh QR</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => setEditProfileVisible(true)}
            >
              <View style={styles.actionIconWrap}>
                <Ionicons name="person" size={20} color="#1D4ED8" />
              </View>
              <Text style={styles.actionText}>Edit Details</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton} onPress={handleShareResidentPass}>
              <View style={[styles.actionIconWrap, { backgroundColor: '#DCFCE7', borderColor: '#BBF7D0' }]}>
                <Ionicons name="share-social" size={20} color="#16A34A" />
              </View>
              <Text style={[styles.actionText, { color: '#16A34A' }]}>Share Pass</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton} onPress={handleDownloadResidentQr}>
              <View style={styles.actionIconWrap}>
                <Ionicons name="download-outline" size={20} color="#1D4ED8" />
              </View>
              <Text style={styles.actionText}>Save QR</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}

      {/* TAB 2: VISITOR PASSES LIST */}
      {activeTab === 'VISITOR' && (
        <View style={{ flex: 1 }}>
          {/* Visitor Privacy & Auto-Purge Strip */}
          <TouchableOpacity
            style={styles.visitorPrivacyStrip}
            onPress={() => setLegalModalVisible(true)}
            activeOpacity={0.8}
          >
            <Ionicons name="shield-checkmark" size={13} color="#15803D" style={{ marginRight: 6 }} />
            <Text style={styles.visitorPrivacyText}>
              48h Auto-Purge & Phone Masking Policy Active • View Privacy Notice &rarr;
            </Text>
          </TouchableOpacity>

          {/* Quick Filter Tabs */}
          <View style={styles.filterRow}>
            {(['ALL', 'ACTIVE', 'SCHEDULED', 'PAST'] as const).map((filter) => (
              <TouchableOpacity
                key={filter}
                style={[styles.filterChip, passFilter === filter && styles.filterChipActive]}
                onPress={() => setPassFilter(filter)}
              >
                <Text style={[styles.filterChipText, passFilter === filter && styles.filterChipTextActive]}>
                  {filter === 'ALL' ? 'All Passes' : filter === 'ACTIVE' ? 'Active Today' : filter === 'SCHEDULED' ? 'Scheduled' : 'Past / Used'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Passes List */}
          <ScrollView contentContainerStyle={styles.passesList} showsVerticalScrollIndicator={false}>
            {filteredPasses.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="ticket-outline" size={54} color="#CBD5E1" />
                <Text style={styles.emptyTitle}>No Visitor Passes</Text>
                <Text style={styles.emptySub}>
                  Issue a digital pass to your guests, deliveries, or service personnel with specific date and timings.
                </Text>
                <TouchableOpacity
                  style={styles.emptyActionBtn}
                  onPress={() => setIssueModalVisible(true)}
                >
                  <Text style={styles.emptyActionText}>+ Issue First Visitor Pass</Text>
                </TouchableOpacity>
              </View>
            ) : (
              filteredPasses.map((pass) => {
                const validity = checkPassTimingValidity(pass);
                const isCancelled = pass.status === 'CANCELLED';
                const isUsed = pass.status === 'USED';

                return (
                  <View key={pass.id} style={[styles.passCard, isCancelled && styles.passCardCancelled]}>
                    <View style={styles.passCardHeader}>
                      <View style={styles.passHeaderLeft}>
                        <View style={styles.categoryBadge}>
                          <Ionicons name={getCategoryIcon(pass.category) as any} size={14} color="#1D4ED8" />
                          <Text style={styles.categoryBadgeText}>{pass.category}</Text>
                        </View>
                        <Text style={styles.passId}>#{pass.id}</Text>
                      </View>

                      {/* Status chip */}
                      <View
                        style={[
                          styles.validityChip,
                          validity.canAdmit ? styles.validityChipActive :
                          isCancelled ? styles.validityChipCancelled :
                          isUsed ? styles.validityChipUsed : styles.validityChipScheduled
                        ]}
                      >
                        <Text
                          style={[
                            styles.validityChipText,
                            validity.canAdmit ? styles.validityTextActive :
                            isCancelled ? styles.validityTextCancelled :
                            isUsed ? styles.validityTextUsed : styles.validityTextScheduled
                          ]}
                        >
                          {validity.statusText}
                        </Text>
                      </View>
                    </View>

                    {/* Visitor & timing info */}
                    <Text style={styles.visitorCardName}>{pass.visitorName}</Text>

                    {/* Host Details Row */}
                    <View style={styles.hostCardRow}>
                      <Ionicons name="person-circle-outline" size={15} color="#1D4ED8" style={{ marginRight: 5 }} />
                      <Text style={styles.hostCardText}>
                        Host: <Text style={styles.hostCardHighlight}>{pass.residentName || residentName}</Text> • Flat {pass.flatNumber || residentFlat}, {pass.tower || residentTower}
                      </Text>
                    </View>

                    <View style={styles.timingBox}>
                      <View style={styles.timingRow}>
                        <Ionicons name="calendar-outline" size={15} color="#475569" />
                        <Text style={styles.timingText}>{pass.validDate}</Text>
                      </View>
                      <View style={styles.timingRow}>
                        <Ionicons name="time-outline" size={15} color="#475569" />
                        <Text style={styles.timingText}>{pass.startTime} - {pass.endTime}</Text>
                      </View>
                    </View>

                    {/* Access PIN Banner */}
                    <View style={styles.pinBanner}>
                      <View>
                        <Text style={styles.pinLabel}>GATE ACCESS PIN</Text>
                        <Text style={styles.pinValue}>{pass.accessPin}</Text>
                      </View>
                      <View style={styles.flatTag}>
                        <Ionicons name="home-outline" size={12} color="#1D4ED8" style={{ marginRight: 4 }} />
                        <Text style={styles.flatTagText}>{pass.flatNumber || residentFlat} • {pass.tower || residentTower}</Text>
                      </View>
                    </View>

                    {/* Footer Actions */}
                    <View style={styles.passCardFooter}>
                      <TouchableOpacity
                        style={styles.viewQrBtn}
                        onPress={() => setSelectedPass(pass)}
                      >
                        <Ionicons name="qr-code-outline" size={16} color="#FFFFFF" />
                        <Text style={styles.viewQrBtnText}>View Pass QR</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.sharePassBtn}
                        onPress={() => handleShareVisitorPass(pass)}
                      >
                        <Ionicons name="share-social" size={16} color="#16A34A" />
                        <Text style={styles.sharePassBtnText}>Share</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.saveQrSmallBtn}
                        onPress={() => handleDownloadVisitorQr(pass)}
                      >
                        <Ionicons name="download-outline" size={16} color="#1D4ED8" />
                      </TouchableOpacity>

                      {!isCancelled && !isUsed && (
                        <TouchableOpacity
                          style={styles.cancelPassBtn}
                          onPress={() => {
                            Alert.alert(
                              'Revoke Pass',
                              `Are you sure you want to cancel the pass for ${pass.visitorName}?`,
                              [
                                { text: 'No', style: 'cancel' },
                                {
                                  text: 'Revoke',
                                  style: 'destructive',
                                  onPress: () => cancelPass(pass.id),
                                },
                              ]
                            );
                          }}
                        >
                          <Ionicons name="close" size={16} color="#DC2626" />
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                );
              })
            )}
            <View style={{ height: 40 }} />
          </ScrollView>
        </View>
      )}

      {/* MODAL 1: ISSUE NEW VISITOR PASS */}
      <Modal visible={issueModalVisible} transparent animationType="slide" onRequestClose={() => setIssueModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalSheetHeader}>
              <View>
                <Text style={styles.modalSheetTitle}>Issue Visitor Pass</Text>
                <Text style={styles.modalSheetSub}>Schedule gate access with custom day & timings</Text>
              </View>
              <TouchableOpacity onPress={() => setIssueModalVisible(false)} style={styles.closeBtn}>
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalFormScroll} showsVerticalScrollIndicator={false}>
              {/* Active Host & Destination Confirmation Card */}
              <View style={styles.issueHostBanner}>
                <View style={styles.issueHostLeft}>
                  <View style={styles.issueHostIconWrap}>
                    <Ionicons name="business" size={18} color="#1D4ED8" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.issueHostLabel}>HOST RESIDENT & DESTINATION</Text>
                    <Text style={styles.issueHostName}>{residentName}</Text>
                    <Text style={styles.issueHostUnit}>Flat {residentFlat}, {residentTower} • {residentPhone}</Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.issueHostEditBtn}
                  onPress={() => {
                    setIssueModalVisible(false);
                    setEditProfileVisible(true);
                  }}
                >
                  <Ionicons name="pencil" size={12} color="#1D4ED8" style={{ marginRight: 3 }} />
                  <Text style={styles.issueHostEditText}>Edit</Text>
                </TouchableOpacity>
              </View>

              {/* Category Selector */}
              <Text style={styles.inputLabel}>Visitor Type *</Text>
              <View style={styles.categoryRow}>
                {(['Guest', 'Delivery', 'Cab', 'Maintenance', 'Other'] as VisitorCategory[]).map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[styles.categoryTile, category === cat && styles.categoryTileActive]}
                    onPress={() => setCategory(cat)}
                  >
                    <Ionicons
                      name={getCategoryIcon(cat) as any}
                      size={18}
                      color={category === cat ? '#1D4ED8' : '#64748B'}
                    />
                    <Text style={[styles.categoryTileText, category === cat && styles.categoryTileTextActive]}>
                      {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Visitor Name */}
              <Text style={styles.inputLabel}>Visitor / Guest Name *</Text>
              <View style={styles.inputBox}>
                <Ionicons name="person-outline" size={18} color="#64748B" style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. Suresh Verma or Swiggy Delivery"
                  placeholderTextColor="#9CA3AF"
                  value={visitorName}
                  onChangeText={setVisitorName}
                />
              </View>

              {/* Visitor Phone */}
              <Text style={styles.inputLabel}>Visitor Phone (Optional)</Text>
              <View style={styles.inputBox}>
                <Ionicons name="call-outline" size={18} color="#64748B" style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. 9876543210"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="phone-pad"
                  value={visitorPhone}
                  onChangeText={setVisitorPhone}
                />
              </View>

              {/* Date Selection */}
              <Text style={styles.inputLabel}>Valid Day / Date *</Text>
              <View style={styles.datePresetRow}>
                <TouchableOpacity
                  style={[styles.datePresetBtn, selectedDatePreset === 'today' && styles.datePresetBtnActive]}
                  onPress={() => setSelectedDatePreset('today')}
                >
                  <Text style={[styles.datePresetText, selectedDatePreset === 'today' && styles.datePresetTextActive]}>
                    Today ({getDateString(0).split(',')[1]?.trim().split(' ').slice(0, 2).join(' ')})
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.datePresetBtn, selectedDatePreset === 'tomorrow' && styles.datePresetBtnActive]}
                  onPress={() => setSelectedDatePreset('tomorrow')}
                >
                  <Text style={[styles.datePresetText, selectedDatePreset === 'tomorrow' && styles.datePresetTextActive]}>
                    Tomorrow ({getDateString(1).split(',')[1]?.trim().split(' ').slice(0, 2).join(' ')})
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.datePresetBtn, selectedDatePreset === 'dayAfter' && styles.datePresetBtnActive]}
                  onPress={() => setSelectedDatePreset('dayAfter')}
                >
                  <Text style={[styles.datePresetText, selectedDatePreset === 'dayAfter' && styles.datePresetTextActive]}>
                    Day After
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Timing Windows */}
              <Text style={styles.inputLabel}>Allowed Timing Window *</Text>
              <View style={styles.timingPresetList}>
                {timePresets.map((preset) => (
                  <TouchableOpacity
                    key={preset.label}
                    style={[
                      styles.timingPresetItem,
                      selectedTimePreset === preset.label && styles.timingPresetItemActive,
                    ]}
                    onPress={() => setSelectedTimePreset(preset.label)}
                  >
                    <Ionicons
                      name={selectedTimePreset === preset.label ? 'radio-button-on' : 'radio-button-off'}
                      size={18}
                      color={selectedTimePreset === preset.label ? '#1D4ED8' : '#94A3B8'}
                    />
                    <Text
                      style={[
                        styles.timingPresetText,
                        selectedTimePreset === preset.label && styles.timingPresetTextActive,
                      ]}
                    >
                      {preset.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Custom Time Range Inputs if Custom Selected */}
              {selectedTimePreset === 'Custom Time Window' && (
                <View style={styles.customTimeRow}>
                  <View style={{ flex: 1, marginRight: 8 }}>
                    <Text style={styles.subLabel}>Start Time</Text>
                    <TextInput
                      style={styles.customTimeInput}
                      value={customStartTime}
                      onChangeText={setCustomStartTime}
                      placeholder="e.g. 02:00 PM"
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.subLabel}>End Time</Text>
                    <TextInput
                      style={styles.customTimeInput}
                      value={customEndTime}
                      onChangeText={setCustomEndTime}
                      placeholder="e.g. 06:00 PM"
                    />
                  </View>
                </View>
              )}

              {/* Vehicle Number */}
              <Text style={styles.inputLabel}>Vehicle Number (Optional)</Text>
              <View style={styles.inputBox}>
                <Ionicons name="car-outline" size={18} color="#64748B" style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. KA 03 MX 4412"
                  placeholderTextColor="#9CA3AF"
                  autoCapitalize="characters"
                  value={vehicleNumber}
                  onChangeText={setVehicleNumber}
                />
              </View>

              <View style={{ height: 24 }} />
            </ScrollView>

            <View style={styles.modalSheetFooter}>
              <TouchableOpacity
                style={styles.sheetCancelBtn}
                onPress={() => setIssueModalVisible(false)}
              >
                <Text style={styles.sheetCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.sheetCreateBtn}
                onPress={handleCreateVisitorPass}
              >
                <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.sheetCreateText}>Generate Pass</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL 2: VISITOR QR PASS PREVIEW & SHARE WITH QR CODE */}
      {selectedPass && (
        <Modal visible={!!selectedPass} transparent animationType="fade" onRequestClose={() => setSelectedPass(null)}>
          <View style={styles.modalOverlay}>
            <View style={styles.visitorPassCard}>
              {/* Header */}
              <View style={styles.visitorPassHeader}>
                <View>
                  <Text style={styles.vpBadge}>VISITOR ENTRY PASS</Text>
                  <Text style={styles.vpId}>#{selectedPass.id}</Text>
                </View>
                <TouchableOpacity onPress={() => setSelectedPass(null)} style={styles.closeBtn}>
                  <Ionicons name="close" size={24} color="#64748B" />
                </TouchableOpacity>
              </View>

              {/* QR Code with Ref */}
              <View style={styles.vpQrBox}>
                <QRCode
                  value={getVisitorQrPayload(selectedPass)}
                  size={200}
                  backgroundColor="white"
                  color="#0F172A"
                  getRef={(c) => { visitorQrRef.current = c; }}
                />
                <Text style={styles.vpQrHint}>Scan at Security Gate for Instant Entry</Text>
              </View>

              {/* 6-Digit PIN display */}
              <View style={styles.vpPinContainer}>
                <Text style={styles.vpPinTitle}>GATE ENTRY PIN</Text>
                <Text style={styles.vpPinDigits}>{selectedPass.accessPin}</Text>
              </View>

              {/* Details table */}
              <View style={styles.vpDetailsTable}>
                <View style={styles.vpDetailRow}>
                  <Text style={styles.vpDetailLabel}>Visitor Name</Text>
                  <Text style={styles.vpDetailValue}>{selectedPass.visitorName} ({selectedPass.category})</Text>
                </View>
                <View style={styles.vpDetailRow}>
                  <Text style={styles.vpDetailLabel}>Host Resident</Text>
                  <Text style={[styles.vpDetailValue, { color: '#0F172A', fontWeight: 'bold' }]}>
                    {selectedPass.residentName || residentName}
                  </Text>
                </View>
                <View style={styles.vpDetailRow}>
                  <Text style={styles.vpDetailLabel}>Host Unit</Text>
                  <Text style={styles.vpDetailValue}>
                    Flat {selectedPass.flatNumber || residentFlat}, {selectedPass.tower || residentTower}
                  </Text>
                </View>
                {(selectedPass.residentPhone || residentPhone) && (
                  <View style={styles.vpDetailRow}>
                    <Text style={styles.vpDetailLabel}>Host Contact</Text>
                    <Text style={styles.vpDetailValue}>
                      {selectedPass.residentPhone || residentPhone}
                    </Text>
                  </View>
                )}
                <View style={styles.vpDetailRow}>
                  <Text style={styles.vpDetailLabel}>Valid Date</Text>
                  <Text style={styles.vpDetailValue}>{selectedPass.validDate}</Text>
                </View>
                <View style={styles.vpDetailRow}>
                  <Text style={styles.vpDetailLabel}>Timing Window</Text>
                  <Text style={[styles.vpDetailValue, { color: '#1D4ED8', fontWeight: 'bold' }]}>
                    {selectedPass.startTime} - {selectedPass.endTime}
                  </Text>
                </View>
                {selectedPass.vehicleNumber && (
                  <View style={styles.vpDetailRow}>
                    <Text style={styles.vpDetailLabel}>Vehicle</Text>
                    <Text style={styles.vpDetailValue}>{selectedPass.vehicleNumber}</Text>
                  </View>
                )}
              </View>

              {/* Shared QR Explanation */}
              <View style={styles.qrShareNote}>
                <Ionicons name="information-circle-outline" size={16} color="#047857" style={{ marginRight: 6 }} />
                <Text style={styles.qrShareNoteText}>
                  Sharing sends this scannable QR Code image and the 6-digit gate PIN directly to your visitor.
                </Text>
              </View>

              {/* Multi-Channel Sharing Actions */}
              <View style={styles.vpActions}>
                {/* 1. Share with QR Code */}
                <TouchableOpacity
                  style={styles.vpShareBtn}
                  onPress={() => handleShareVisitorPass(selectedPass)}
                >
                  <Ionicons name="logo-whatsapp" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
                  <Text style={styles.vpShareBtnText}>Share Pass & QR Code</Text>
                </TouchableOpacity>

                {/* 2. Download QR Image & Copy Link Row */}
                <View style={styles.vpSecondaryActionsRow}>
                  <TouchableOpacity
                    style={styles.vpDownloadBtn}
                    onPress={() => handleDownloadVisitorQr(selectedPass)}
                  >
                    <Ionicons name="download-outline" size={18} color="#1D4ED8" style={{ marginRight: 6 }} />
                    <Text style={styles.vpDownloadBtnText}>Save QR Image</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.vpCopyBtn}
                    onPress={() => handleCopyVisitorPass(selectedPass)}
                  >
                    <Ionicons name="copy-outline" size={18} color="#475569" style={{ marginRight: 6 }} />
                    <Text style={styles.vpCopyBtnText}>Copy Link</Text>
                  </TouchableOpacity>
                </View>

                {/* Dismiss */}
                <TouchableOpacity
                  style={styles.vpDismissBtn}
                  onPress={() => setSelectedPass(null)}
                >
                  <Text style={styles.vpDismissBtnText}>Done</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* Edit Profile Modal */}
      <EditProfileModal
        visible={editProfileVisible}
        onClose={() => setEditProfileVisible(false)}
      />

      {/* Legal & Privacy Policy Modal */}
      <LegalPolicyModal
        visible={legalModalVisible}
        onClose={() => setLegalModalVisible(false)}
        initialSection="PRIVACY"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    paddingTop: 48,
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  screenHeading: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  screenSub: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  editProfilePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  editProfilePillText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1D4ED8',
    marginLeft: 5,
  },
  issuePassBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1D4ED8',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  issuePassBtnText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginLeft: 4,
  },

  // Segmented Tabs
  segmentedContainer: {
    flexDirection: 'row',
    backgroundColor: '#E2E8F0',
    marginHorizontal: 20,
    borderRadius: 14,
    padding: 4,
    marginBottom: 16,
  },
  segmentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
  },
  segmentBtnActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  segmentText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  segmentTextActive: {
    color: '#1D4ED8',
    fontWeight: 'bold',
  },
  tabBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 6,
  },
  tabBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#1D4ED8',
  },

  // Tab 1: Resident Pass Card
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    alignItems: 'center',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  cardSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
    marginRight: 6,
  },
  statusText: {
    color: '#059669',
    fontWeight: 'bold',
    fontSize: 11,
  },
  qrContainer: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  qrSubCaption: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 10,
    fontWeight: '500',
  },
  infoSection: {
    alignItems: 'center',
    marginBottom: 16,
  },
  name: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 4,
  },
  unit: {
    fontSize: 15,
    color: '#475569',
    fontWeight: '600',
    marginBottom: 6,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  contactText: {
    fontSize: 13,
    color: '#64748B',
  },
  metaBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
    gap: 6,
  },
  metaText: {
    fontSize: 12,
    color: '#475569',
  },
  instructions: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 12,
  },

  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginTop: 24,
    flexWrap: 'wrap',
  },
  actionButton: {
    alignItems: 'center',
    width: 76,
  },
  actionIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  actionText: {
    fontSize: 11,
    color: '#1D4ED8',
    fontWeight: '600',
    textAlign: 'center',
  },

  // TAB 2: VISITOR PASSES LIST
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 8,
    marginBottom: 12,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#E2E8F0',
  },
  filterChipActive: {
    backgroundColor: '#1D4ED8',
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  passesList: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    gap: 12,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0F172A',
    marginTop: 12,
  },
  emptySub: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
  emptyActionBtn: {
    marginTop: 20,
    backgroundColor: '#1D4ED8',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 14,
  },
  emptyActionText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },

  passCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
  },
  passCardCancelled: {
    opacity: 0.6,
    backgroundColor: '#F8FAFC',
  },
  passCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  passHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  categoryBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1D4ED8',
  },
  passId: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#64748B',
  },
  validityChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  validityChipActive: { backgroundColor: '#ECFDF5' },
  validityChipScheduled: { backgroundColor: '#EFF6FF' },
  validityChipCancelled: { backgroundColor: '#FEF2F2' },
  validityChipUsed: { backgroundColor: '#F3E8FF' },
  validityChipText: { fontSize: 10, fontWeight: '700' },
  validityTextActive: { color: '#059669' },
  validityTextScheduled: { color: '#2563EB' },
  validityTextCancelled: { color: '#DC2626' },
  validityTextUsed: { color: '#7C3AED' },

  visitorCardName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 8,
  },
  timingBox: {
    backgroundColor: '#F8FAFC',
    padding: 10,
    borderRadius: 10,
    gap: 6,
    marginBottom: 10,
  },
  timingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  timingText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '500',
  },
  pinBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    marginBottom: 12,
  },
  pinLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  pinValue: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: 2,
  },
  flatTag: {
    backgroundColor: '#CBD5E1',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  flatTagText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E293B',
  },
  passCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  viewQrBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1D4ED8',
    paddingVertical: 9,
    borderRadius: 10,
    gap: 6,
  },
  viewQrBtnText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  sharePassBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    gap: 5,
  },
  sharePassBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#16A34A',
  },
  saveQrSmallBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  cancelPassBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#FEF2F2',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FECACA',
  },

  // MODAL STYLING
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 28,
    maxHeight: '90%',
  },
  modalSheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalSheetTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  modalSheetSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
  },
  modalFormScroll: {
    maxHeight: 460,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 8,
    marginTop: 10,
  },
  categoryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 6,
  },
  categoryTile: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    gap: 6,
  },
  categoryTileActive: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#3B82F6',
  },
  categoryTileText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  categoryTileTextActive: {
    color: '#1D4ED8',
    fontWeight: 'bold',
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 46,
    backgroundColor: '#F8FAFC',
    marginBottom: 6,
  },
  inputIcon: {
    marginRight: 8,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    color: '#0F172A',
  },
  datePresetRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  datePresetBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
  },
  datePresetBtnActive: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#3B82F6',
  },
  datePresetText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  datePresetTextActive: {
    color: '#1D4ED8',
    fontWeight: 'bold',
  },
  timingPresetList: {
    gap: 6,
    marginBottom: 8,
  },
  timingPresetItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 10,
  },
  timingPresetItemActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#93C5FD',
  },
  timingPresetText: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '500',
  },
  timingPresetTextActive: {
    color: '#1D4ED8',
    fontWeight: '700',
  },
  customTimeRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  subLabel: {
    fontSize: 11,
    color: '#64748B',
    marginBottom: 4,
  },
  customTimeInput: {
    height: 42,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 10,
    fontSize: 13,
    backgroundColor: '#F8FAFC',
  },
  modalSheetFooter: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  sheetCancelBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
  },
  sheetCancelText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  sheetCreateBtn: {
    flex: 2,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#1D4ED8',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sheetCreateText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },

  // VISITOR PASS MODAL (QR CARD)
  visitorPassCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 22,
    alignItems: 'center',
    maxHeight: '94%',
  },
  visitorPassHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    width: '100%',
    marginBottom: 12,
  },
  vpBadge: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#1D4ED8',
    letterSpacing: 1,
  },
  vpId: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
  },
  vpQrBox: {
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  vpQrHint: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 6,
    fontWeight: '600',
  },
  vpPinContainer: {
    backgroundColor: '#0F172A',
    width: '100%',
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
    marginBottom: 10,
  },
  vpPinTitle: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  vpPinDigits: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: 4,
    marginTop: 2,
  },
  vpDetailsTable: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 10,
  },
  vpDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  vpDetailLabel: {
    fontSize: 12,
    color: '#64748B',
  },
  vpDetailValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0F172A',
    maxWidth: 220,
    textAlign: 'right',
  },
  qrShareNote: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    marginBottom: 12,
    width: '100%',
  },
  qrShareNoteText: {
    flex: 1,
    fontSize: 11,
    color: '#065F46',
    fontWeight: '500',
    lineHeight: 15,
  },
  vpActions: {
    width: '100%',
    gap: 8,
  },
  vpShareBtn: {
    flexDirection: 'row',
    backgroundColor: '#16A34A',
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#16A34A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  vpShareBtnText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  vpSecondaryActionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  vpDownloadBtn: {
    flex: 1,
    flexDirection: 'row',
    height: 42,
    backgroundColor: '#EFF6FF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  vpDownloadBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1D4ED8',
  },
  vpCopyBtn: {
    flex: 1,
    flexDirection: 'row',
    height: 42,
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  vpCopyBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  vpDismissBtn: {
    height: 40,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  vpDismissBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  hostCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F9FF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginTop: 6,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  hostCardText: {
    fontSize: 12,
    color: '#0369A1',
  },
  hostCardHighlight: {
    fontWeight: '700',
    color: '#0C4A6E',
  },
  issueHostBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  issueHostLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  issueHostIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#DBEAFE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  issueHostLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#1D4ED8',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  issueHostName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  issueHostUnit: {
    fontSize: 12,
    color: '#475569',
    marginTop: 1,
  },
  issueHostEditBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#93C5FD',
  },
  issueHostEditText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1D4ED8',
  },
  visitorPrivacyStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 14,
    paddingVertical: 9,
    marginHorizontal: 16,
    marginTop: 6,
    marginBottom: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  visitorPrivacyText: {
    fontSize: 11,
    color: '#15803D',
    fontWeight: '700',
    flex: 1,
  },
});
