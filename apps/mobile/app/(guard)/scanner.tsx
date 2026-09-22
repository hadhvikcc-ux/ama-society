import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Modal,
  TextInput,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useBookingStore, FacilityBooking } from '../../stores/bookingStore';
import {
  useVisitorPassStore,
  VisitorPass,
  checkPassTimingValidity,
} from '../../stores/visitorPassStore';
import { LogoutConfirmModal } from '../../components/ui/LogoutConfirmModal';
import { useCallStore } from '../../stores/callStore';
import { UniversalCameraView } from '../../components/camera/UniversalCameraView';
import { useSupplierStore, DeliveryChallanStatus } from '../../stores/supplierStore';
import { useCabStore } from '../../stores/cabStore';

interface ScanResult {
  status: 'GRANTED' | 'DENIED';
  type: 'FACILITY' | 'VISITOR' | 'RESIDENT';
  booking?: FacilityBooking;
  visitorPass?: VisitorPass;
  title: string;
  message: string;
  residentName?: string;
  flatNumber?: string;
  tower?: string;
  timeSlot?: string;
  facilityName?: string;
  pin?: string;
  id?: string;
  category?: string;
}

interface RecentEntry {
  id: string;
  label: string;
  sub: string;
  type: 'FACILITY' | 'VISITOR' | 'RESIDENT';
  time: string;
  granted: boolean;
}

export default function GuardScanner() {
  const router = useRouter();
  const { openCallPicker } = useCallStore();
  const { bookings, findBooking } = useBookingStore();
  const { passes: visitorPasses, findPass, markPassUsed } = useVisitorPassStore();

  const [scanLineAnim] = useState(new Animated.Value(0));
  const [flashAnim] = useState(new Animated.Value(0));
  const [flashColor, setFlashColor] = useState<string>('rgba(16, 185, 129, 0.45)');
  const [flashVisible, setFlashVisible] = useState(false);

  const [manualModalVisible, setManualModalVisible] = useState(false);
  const [manualInput, setManualInput] = useState('');
  const [flashOn, setFlashOn] = useState(false);
  const [cameraActive, setCameraActive] = useState(true);
  const [facingBack, setFacingBack] = useState(true);
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);

  // Scan Verification Result Dialog
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);

  // Dynamic Recent Entries Log
  const [recentEntries, setRecentEntries] = useState<RecentEntry[]>([
    {
      id: '1',
      label: 'Rahul (Zomato) • A-101',
      sub: 'Visitor OTP',
      type: 'VISITOR',
      time: '10:14 AM',
      granted: true,
    },
    {
      id: '2',
      label: 'Clubhouse • B-204',
      sub: 'AMABK00001 (Aditya)',
      type: 'FACILITY',
      time: '09:42 AM',
      granted: true,
    },
    {
      id: '3',
      label: 'Sita (Maid) • B-205',
      sub: 'Daily Pass',
      type: 'VISITOR',
      time: '08:30 AM',
      granted: true,
    },
  ]);

  // Scan line animation
  useEffect(() => {
    const loopAnim = Animated.loop(
      Animated.sequence([
        Animated.timing(scanLineAnim, { toValue: 1, duration: 1800, useNativeDriver: true }),
        Animated.timing(scanLineAnim, { toValue: 0, duration: 1800, useNativeDriver: true }),
      ])
    );
    loopAnim.start();
    return () => loopAnim.stop();
  }, [scanLineAnim]);

  const scanLineY = scanLineAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 240],
  });

  const triggerFlash = (success: boolean) => {
    setFlashColor(success ? 'rgba(16, 185, 129, 0.45)' : 'rgba(239, 68, 68, 0.5)');
    setFlashVisible(true);
    flashAnim.setValue(1);
    Animated.timing(flashAnim, {
      toValue: 0,
      duration: 650,
      useNativeDriver: true,
    }).start(() => {
      setFlashVisible(false);
    });
  };

  // Process raw scanned QR string or code
  const handleVerifyCode = (rawCode: string) => {
    const code = rawCode.trim();
    if (!code) return;

    // 1. Check for Resident ID Pass QR: AMA-RESIDENT:<id>:<name>:<flat>:<tower>:<salt>
    if (code.startsWith('AMA-RESIDENT:')) {
      const parts = code.split(':');
      const resName = parts[2] || 'Resident';
      const resFlat = parts[3] || 'B-204';
      const resTower = parts[4] || 'Tower B';

      triggerFlash(true);
      setScanResult({
        status: 'GRANTED',
        type: 'RESIDENT',
        title: 'ACCESS GRANTED • RESIDENT ID',
        message: `Verified resident ${resName} (${resFlat}, ${resTower}). Instant contactless gate entry granted.`,
        residentName: resName,
        flatNumber: resFlat,
        tower: resTower,
        id: 'RESIDENT-PASS',
      });
      return;
    }

    // 2. Check for Visitor Pass QR format:
    // New format: AMA-VISITOR:<passId>:<pin>:<flatNumber>:<tower>:<residentName>:<date>:<start>:<end>
    // Legacy format: AMA-VISITOR:<passId>:<pin>:<flatNumber>:<date>:<start>:<end>
    if (code.startsWith('AMA-VISITOR:')) {
      const parts = code.split(':');
      const passId = parts[1] || '';
      const pin = parts[2] || '';

      let qFlat = 'B-204';
      let qTower = 'Tower B';
      let qResidentName = 'Aditya Sharma';
      let qDate = 'Today, 16 Sep 2026';
      let qStart = '08:00 AM';
      let qEnd = '10:00 PM';

      if (parts.length >= 9) {
        qFlat = parts[3] || 'B-204';
        qTower = parts[4] || 'Tower B';
        qResidentName = parts[5] || 'Aditya Sharma';
        qDate = parts[6] || 'Today, 16 Sep 2026';
        qStart = parts[7] || '08:00 AM';
        qEnd = parts[8] || '10:00 PM';
      } else {
        qFlat = parts[3] || 'B-204';
        qDate = parts[4] || 'Today, 16 Sep 2026';
        qStart = parts[5] || '08:00 AM';
        qEnd = parts[6] || '10:00 PM';
      }

      const matchedPass = findPass(passId) || findPass(pin);
      const effectivePass: VisitorPass = matchedPass || {
        id: passId || 'AMAVP-EXT',
        visitorName: 'Invited Guest / Visitor',
        category: 'Guest',
        validDate: qDate,
        validDateRaw: new Date().toISOString().split('T')[0],
        startTime: qStart,
        endTime: qEnd,
        timeSlotLabel: `${qStart} - ${qEnd}`,
        flatNumber: qFlat,
        tower: qTower,
        residentName: qResidentName,
        accessPin: pin,
        status: 'ACTIVE',
        createdAt: new Date().toISOString(),
      };

      const validity = checkPassTimingValidity(effectivePass);
      if (validity.canAdmit) {
        triggerFlash(true);
        setScanResult({
          status: 'GRANTED',
          type: 'VISITOR',
          visitorPass: effectivePass,
          title: 'ACCESS GRANTED • VISITOR PASS',
          message: `Valid visitor pass for ${effectivePass.visitorName} (${effectivePass.category}). Visiting Flat ${effectivePass.flatNumber}, ${effectivePass.tower} (Host: ${effectivePass.residentName}).`,
          residentName: effectivePass.residentName,
          flatNumber: effectivePass.flatNumber,
          tower: effectivePass.tower,
          timeSlot: `${effectivePass.validDate} • ${effectivePass.startTime} - ${effectivePass.endTime}`,
          pin: effectivePass.accessPin,
          id: effectivePass.id,
          category: effectivePass.category,
        });
      } else {
        triggerFlash(false);
        setScanResult({
          status: 'DENIED',
          type: 'VISITOR',
          visitorPass: effectivePass,
          title: effectivePass.status === 'CANCELLED'
            ? 'ACCESS DENIED • CANCELLED PASS'
            : validity.statusText.includes('Expired')
            ? 'ACCESS DENIED • EXPIRED PASS'
            : 'ACCESS DENIED • OUTSIDE TIMINGS',
          message: `Visitor pass #${effectivePass.id} (${effectivePass.visitorName}) is not permitted: ${validity.statusText}. Host: ${effectivePass.residentName}, Flat ${effectivePass.flatNumber}, ${effectivePass.tower}. Allowed timing: ${effectivePass.startTime} - ${effectivePass.endTime} on ${effectivePass.validDate}.`,
          residentName: effectivePass.residentName,
          flatNumber: effectivePass.flatNumber,
          tower: effectivePass.tower,
          timeSlot: `${effectivePass.validDate} • ${effectivePass.startTime} - ${effectivePass.endTime}`,
          pin: effectivePass.accessPin,
          id: effectivePass.id,
          category: effectivePass.category,
        });
      }
      return;
    }

    // 3. Check for Community Facility Booking QR format: AMA-FACILITY:<bookingId>:<pin>:<flatNumber>
    if (code.startsWith('AMA-FACILITY:')) {
      const parts = code.split(':');
      const bookingId = parts[1] || '';
      const matchedBooking = findBooking(bookingId);

      if (matchedBooking) {
        if (matchedBooking.status === 'CONFIRMED') {
          triggerFlash(true);
          setScanResult({
            status: 'GRANTED',
            type: 'FACILITY',
            booking: matchedBooking,
            title: 'ACCESS GRANTED • FACILITY PASS',
            message: `Valid reservation for ${matchedBooking.facilityName}. Resident ${matchedBooking.residentName} (${matchedBooking.flatNumber}).`,
            facilityName: matchedBooking.facilityName,
            timeSlot: `${matchedBooking.date} • ${matchedBooking.slot}`,
            residentName: matchedBooking.residentName,
            flatNumber: matchedBooking.flatNumber,
            pin: matchedBooking.accessPin,
            id: matchedBooking.id,
          });
        } else {
          triggerFlash(false);
          setScanResult({
            status: 'DENIED',
            type: 'FACILITY',
            booking: matchedBooking,
            title: 'ACCESS DENIED • CANCELLED BOOKING',
            message: `Reservation #${matchedBooking.id} for ${matchedBooking.facilityName} was cancelled by resident. Entry is prohibited.`,
            facilityName: matchedBooking.facilityName,
            timeSlot: `${matchedBooking.date} • ${matchedBooking.slot}`,
            residentName: matchedBooking.residentName,
            flatNumber: matchedBooking.flatNumber,
            id: matchedBooking.id,
          });
        }
        return;
      }
    }

    // 4. Supplier Inward Delivery Pass search (e.g. INW-8291, DC-2026-1044, KA-04-E-8821)
    const supplierChallan = useSupplierStore.getState().findInwardPass(code);
    if (supplierChallan) {
      useSupplierStore.getState().updateChallanGateStatus(
        supplierChallan.id,
        DeliveryChallanStatus.INSPECTED,
        'Bahadur Singh (Gate 1)',
        'Vehicle gross weight & seal verified. Admitted to unloading bay.'
      );
      triggerFlash(true);
      setScanResult({
        status: 'GRANTED',
        type: 'VISITOR',
        title: 'INWARD GRANTED • BULK SUPPLIER TRUCK',
        message: `Verified bulk delivery by ${supplierChallan.vehicleType} (${supplierChallan.vehicleNumber}). Driver: ${supplierChallan.driverName} (${supplierChallan.driverPhone}). Material: ${supplierChallan.materialsSummary} against PO #${supplierChallan.poNumber}. Gate boom barrier clearance permitted.`,
        residentName: `Supplier Driver: ${supplierChallan.driverName}`,
        flatNumber: 'Estate Office / Sump',
        tower: 'Gate 1 Delivery Bay',
        timeSlot: `Pass Token: ${supplierChallan.passCode} • Vehicle: ${supplierChallan.vehicleNumber}`,
        pin: supplierChallan.passCode,
        id: supplierChallan.challanNumber,
        category: 'Bulk Supplier Delivery',
      });
      setRecentEntries((prev) => [
        {
          id: `entry-${Date.now()}`,
          label: `${supplierChallan.vehicleNumber} • ${supplierChallan.driverName}`,
          sub: `Supplier: ${supplierChallan.materialsSummary}`,
          type: 'VISITOR',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          granted: true,
        },
        ...prev.slice(0, 9),
      ]);
      return;
    }

    // 4B. Cab & Auto Gate Transit Pass search (e.g. CP-7719, CAB-2026-7719, 5821, KA-03-AA-4921)
    // Or QR payload format: AMA-CAB:<passCode>:<pin>:<vehicleNumber>
    let cabCode = code;
    if (code.startsWith('AMA-CAB:')) {
      const parts = code.split(':');
      cabCode = parts[1] || parts[2] || parts[3] || code;
    }

    const cabBooking = useCabStore.getState().findCabPass(cabCode);
    if (cabBooking) {
      useCabStore.getState().verifyGateInward(
        cabBooking.passCode,
        'Bahadur Singh (Gate 1)',
        'Gate 1 (North Gate)'
      );
      triggerFlash(true);
      setScanResult({
        status: 'GRANTED',
        type: 'VISITOR',
        title: 'ACCESS GRANTED • TRANSIT CAB ENTRY',
        message: `Cleared ${cabBooking.driver.vehicleModel} (${cabBooking.driver.vehicleNumber}) driven by ${cabBooking.driver.name}. Pickup at ${cabBooking.pickupPoint.name} for resident ${cabBooking.residentName} (${cabBooking.residentFlat}). 15-minute campus transit window initiated.`,
        residentName: `${cabBooking.residentName} (${cabBooking.residentFlat})`,
        flatNumber: cabBooking.residentFlat,
        tower: cabBooking.pickupPoint.name,
        timeSlot: `15-Min Transit Window (Max 15 km/h) • Pass: ${cabBooking.passCode}`,
        pin: cabBooking.gatePin,
        id: cabBooking.passCode,
        category: `${cabBooking.rideType === 'AUTO' ? 'Auto Rickshaw' : 'Cab'} Transit`,
      });
      setRecentEntries((prev) => [
        {
          id: `entry-${Date.now()}`,
          label: `${cabBooking.driver.vehicleNumber} • ${cabBooking.driver.name}`,
          sub: `Cab/Auto Transit -> ${cabBooking.residentFlat} (${cabBooking.pickupPoint.name})`,
          type: 'VISITOR',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          granted: true,
        },
        ...prev.slice(0, 9),
      ]);
      return;
    }

    // 5. Direct Visitor Pass search by ID or Access PIN (e.g. AMAVP00001, 492810)
    const visitorMatch = findPass(code);
    if (visitorMatch) {
      const validity = checkPassTimingValidity(visitorMatch);
      if (validity.canAdmit) {
        triggerFlash(true);
        setScanResult({
          status: 'GRANTED',
          type: 'VISITOR',
          visitorPass: visitorMatch,
          title: 'ACCESS GRANTED • VISITOR PASS',
          message: `Valid visitor pass for ${visitorMatch.visitorName} (${visitorMatch.category}). Visiting Flat ${visitorMatch.flatNumber}, ${visitorMatch.tower} (Host: ${visitorMatch.residentName}).`,
          residentName: visitorMatch.residentName,
          flatNumber: visitorMatch.flatNumber,
          tower: visitorMatch.tower,
          timeSlot: `${visitorMatch.validDate} • ${visitorMatch.startTime} - ${visitorMatch.endTime}`,
          pin: visitorMatch.accessPin,
          id: visitorMatch.id,
          category: visitorMatch.category,
        });
      } else {
        triggerFlash(false);
        setScanResult({
          status: 'DENIED',
          type: 'VISITOR',
          visitorPass: visitorMatch,
          title: visitorMatch.status === 'CANCELLED'
            ? 'ACCESS DENIED • CANCELLED PASS'
            : validity.statusText.includes('Expired')
            ? 'ACCESS DENIED • EXPIRED PASS'
            : 'ACCESS DENIED • OUTSIDE TIMINGS',
          message: `Visitor pass #${visitorMatch.id} (${visitorMatch.visitorName}) is not permitted: ${validity.statusText}. Host: ${visitorMatch.residentName}, Flat ${visitorMatch.flatNumber}, ${visitorMatch.tower}. Allowed timing window: ${visitorMatch.startTime} - ${visitorMatch.endTime} on ${visitorMatch.validDate}.`,
          residentName: visitorMatch.residentName,
          flatNumber: visitorMatch.flatNumber,
          tower: visitorMatch.tower,
          timeSlot: `${visitorMatch.validDate} • ${visitorMatch.startTime} - ${visitorMatch.endTime}`,
          pin: visitorMatch.accessPin,
          id: visitorMatch.id,
          category: visitorMatch.category,
        });
      }
      return;
    }

    // 5. Direct booking search by ID or Access PIN (e.g. AMABK00001, 5821)
    const bookingMatch = findBooking(code);
    if (bookingMatch) {
      if (bookingMatch.status === 'CONFIRMED') {
        triggerFlash(true);
        setScanResult({
          status: 'GRANTED',
          type: 'FACILITY',
          booking: bookingMatch,
          title: 'ACCESS GRANTED • FACILITY PASS',
          message: `Valid reservation for ${bookingMatch.facilityName}. Resident ${bookingMatch.residentName} (${bookingMatch.flatNumber}).`,
          facilityName: bookingMatch.facilityName,
          timeSlot: `${bookingMatch.date} • ${bookingMatch.slot}`,
          residentName: bookingMatch.residentName,
          flatNumber: bookingMatch.flatNumber,
          pin: bookingMatch.accessPin,
          id: bookingMatch.id,
        });
      } else {
        triggerFlash(false);
        setScanResult({
          status: 'DENIED',
          type: 'FACILITY',
          booking: bookingMatch,
          title: 'ACCESS DENIED • CANCELLED BOOKING',
          message: `Reservation #${bookingMatch.id} for ${bookingMatch.facilityName} was cancelled by resident. Entry is prohibited.`,
          facilityName: bookingMatch.facilityName,
          timeSlot: `${bookingMatch.date} • ${bookingMatch.slot}`,
          residentName: bookingMatch.residentName,
          flatNumber: bookingMatch.flatNumber,
          id: bookingMatch.id,
        });
      }
      return;
    }

    // 6. Generic 6-digit OTP handling
    if (/^\d{6}$/.test(code)) {
      triggerFlash(true);
      setScanResult({
        status: 'GRANTED',
        type: 'VISITOR',
        title: 'ACCESS GRANTED • VISITOR PASS',
        message: 'Valid 6-digit visitor access code confirmed by resident portal.',
        residentName: 'Invited Guest',
        flatNumber: 'Tower A / B',
        pin: code,
        id: `OTP-${code}`,
      });
      return;
    }

    // Unknown or invalid QR code
    triggerFlash(false);
    setScanResult({
      status: 'DENIED',
      type: 'FACILITY',
      title: 'ACCESS DENIED • INVALID CODE',
      message: `No matching facility booking, visitor pass, or active resident found for "${code}".`,
      id: code,
    });
  };

  const handleAdmit = () => {
    if (!scanResult) return;

    if (scanResult.status === 'GRANTED') {
      const now = new Date();
      const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      if (scanResult.type === 'VISITOR' && scanResult.visitorPass) {
        markPassUsed(scanResult.visitorPass.id);
      }

      const newEntry: RecentEntry = {
        id: String(Date.now()),
        label: scanResult.type === 'FACILITY'
          ? `${scanResult.facilityName} • ${scanResult.flatNumber}`
          : scanResult.type === 'RESIDENT'
          ? `${scanResult.residentName} • ${scanResult.flatNumber}`
          : `${scanResult.visitorPass?.visitorName || 'Visitor'} • ${scanResult.flatNumber}`,
        sub: scanResult.type === 'FACILITY'
          ? `#${scanResult.id} (${scanResult.residentName})`
          : scanResult.type === 'RESIDENT'
          ? `Resident Member ID`
          : `Host: ${scanResult.residentName} • Pass #${scanResult.id}`,
        type: scanResult.type,
        time: timeStr,
        granted: true,
      };

      setRecentEntries((prev) => [newEntry, ...prev.slice(0, 5)]);
    }

    setScanResult(null);
  };

  // Preview match in manual entry modal
  const manualMatch = manualInput.trim() ? findBooking(manualInput.trim()) : null;
  const manualMatchVisitor = manualInput.trim() ? findPass(manualInput.trim()) : null;

  return (
    <View style={styles.container}>
      {/* Guard Security Header */}
      <View style={styles.guardTopHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.guardHeaderTitle}>Security Gate Scanner 🛡️</Text>
          <Text style={styles.guardHeaderSubtitle}>Orchid Towers • Guard Duty</Text>
        </View>
        <TouchableOpacity
          style={styles.guardLogoutBtn}
          onPress={() => setLogoutModalVisible(true)}
          activeOpacity={0.8}
          accessibilityLabel="Log Out"
        >
          <Ionicons name="log-out-outline" size={16} color="#FFFFFF" />
          <Text style={styles.guardLogoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Flash overlay for scan feedback */}
      {flashVisible && (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.flashOverlay,
            { backgroundColor: flashColor, opacity: flashAnim },
          ]}
        />
      )}

      {/* Main Scanner Live Camera Viewfinder */}
      <View style={styles.cameraContainer}>
        <View style={styles.cameraCardWrapper}>
          <UniversalCameraView
            mode="scanner"
            facing={facingBack ? 'back' : 'front'}
            isActive={cameraActive}
            enableTorch={flashOn}
            showFlipButton={true}
            onFlipCamera={() => setFacingBack(!facingBack)}
            onBarcodeScanned={(scannedData) => {
              handleVerifyCode(scannedData);
            }}
            fallbackTitle="Gate Intercom Scanner Camera"
            style={styles.cameraInnerFeed}
          >
            {/* Reticle Overlay on top of live camera */}
            <View style={styles.reticleOverlay} pointerEvents="box-none">
              <TouchableOpacity
                style={styles.reticle}
                activeOpacity={0.8}
                onPress={() => {
                  // Tap reticle to simulate scanning the primary active visitor pass
                  if (visitorPasses.length > 0) {
                    const p = visitorPasses[0];
                    handleVerifyCode(`AMA-VISITOR:${p.id}:${p.accessPin}:${p.flatNumber}:${p.tower}:${p.residentName}:${p.validDate}:${p.startTime}:${p.endTime}`);
                  } else {
                    handleVerifyCode('AMA-RESIDENT:res-01:Aditya Sharma:B-204:Tower B:salt123');
                  }
                }}
              >
                <View style={[styles.corner, styles.tl]} />
                <View style={[styles.corner, styles.tr]} />
                <View style={[styles.corner, styles.bl]} />
                <View style={[styles.corner, styles.br]} />
                <Animated.View style={[styles.scanLine, { transform: [{ translateY: scanLineY }] }]} />

                <View style={styles.reticleCenter}>
                  <Ionicons name="scan-outline" size={54} color="rgba(255,255,255,0.3)" />
                </View>
              </TouchableOpacity>
              <Text style={styles.scanHint}>Align Resident QR, Visitor Pass, or Facility QR in frame</Text>
            </View>
          </UniversalCameraView>
        </View>

        {/* Quick Simulation Bar for Live Demonstrations */}
        <View style={styles.simBar}>
          <Text style={styles.simLabel}>TAP TO TEST GATE SCAN:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.simList}>
            {/* Resident Pass Quick Test */}
            <TouchableOpacity
              style={[styles.simChip, styles.simChipConfirmed]}
              onPress={() => handleVerifyCode('AMA-RESIDENT:res-01:Aditya Sharma:B-204:Tower B:liveSalt')}
            >
              <Ionicons name="person-circle" size={14} color="#10B981" style={{ marginRight: 4 }} />
              <Text style={styles.simChipText}>Resident ID • Aditya (B-204)</Text>
            </TouchableOpacity>

            {/* Visitor Passes Quick Tests */}
            {visitorPasses.map((p) => {
              const validity = checkPassTimingValidity(p);
              return (
                <TouchableOpacity
                  key={p.id}
                  style={[
                    styles.simChip,
                    validity.canAdmit ? styles.simChipConfirmed : styles.simChipCancelled,
                  ]}
                  onPress={() => handleVerifyCode(`AMA-VISITOR:${p.id}:${p.accessPin}:${p.flatNumber}:${p.tower}:${p.residentName}:${p.validDate}:${p.startTime}:${p.endTime}`)}
                >
                  <Ionicons
                    name={validity.canAdmit ? 'checkmark-circle' : 'time-outline'}
                    size={14}
                    color={validity.canAdmit ? '#10B981' : '#EF4444'}
                    style={{ marginRight: 4 }}
                  />
                  <Text style={styles.simChipText}>
                    {p.id} • {p.visitorName.split(' ')[0]} (Host: {p.residentName.split(' ')[0]})
                  </Text>
                </TouchableOpacity>
              );
            })}

            {/* Facility Booking Quick Tests */}
            {bookings.slice(0, 3).map((b) => (
              <TouchableOpacity
                key={b.id}
                style={[
                  styles.simChip,
                  b.status === 'CANCELLED' ? styles.simChipCancelled : styles.simChipConfirmed,
                ]}
                onPress={() => handleVerifyCode(`AMA-FACILITY:${b.id}:${b.accessPin}:${b.flatNumber}`)}
              >
                <Ionicons
                  name={b.status === 'CANCELLED' ? 'close-circle' : 'football'}
                  size={14}
                  color={b.status === 'CANCELLED' ? '#EF4444' : '#10B981'}
                  style={{ marginRight: 4 }}
                />
                <Text style={styles.simChipText}>
                  {b.id} • {b.facilityName.split(' ')[0]} ({b.status})
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>

      {/* Bottom Control & Log Panel */}
      <View style={styles.bottomPanel}>
        <View style={styles.panelHeaderRow}>
          <Text style={styles.panelTitle}>Recent Admitted Entries</Text>
          <Text style={styles.panelCount}>{recentEntries.length} logged</Text>
        </View>

        <View style={styles.recentChips}>
          {recentEntries.map((item) => (
            <View key={item.id} style={styles.chip}>
              <View style={[
                styles.chipBadge,
                item.type === 'FACILITY' && styles.chipBadgeFacility,
                item.type === 'RESIDENT' && styles.chipBadgeResident,
              ]}>
                <Ionicons
                  name={item.type === 'FACILITY' ? 'football-outline' : item.type === 'RESIDENT' ? 'shield-checkmark' : 'person-outline'}
                  size={12}
                  color={item.type === 'FACILITY' ? '#3B82F6' : item.type === 'RESIDENT' ? '#10B981' : '#9CA3AF'}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.chipText} numberOfLines={1}>{item.label}</Text>
                <Text style={styles.chipSubText} numberOfLines={1}>{item.sub} • {item.time}</Text>
              </View>
              <Ionicons name="checkmark-circle" size={16} color="#10B981" style={{ marginLeft: 4 }} />
            </View>
          ))}
        </View>

        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.manualBtn, { flex: 1 }]}
            onPress={() => {
              setManualInput('');
              setManualModalVisible(true);
            }}
          >
            <Ionicons name="keypad" size={18} color="#FFF" />
            <Text style={styles.manualBtnText}>Manual PIN</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.manualBtn, { backgroundColor: '#4338CA', flex: 1 }]}
            onPress={() => router.push('/directory')}
          >
            <Ionicons name="call" size={18} color="#FFF" />
            <Text style={styles.manualBtnText}>Intercom</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.flashBtn, !cameraActive && { backgroundColor: '#EF4444', borderColor: '#EF4444' }]}
            onPress={() => setCameraActive(!cameraActive)}
            accessibilityLabel={cameraActive ? "Pause Camera" : "Resume Camera"}
          >
            <Ionicons name={cameraActive ? 'videocam' : 'videocam-off'} size={22} color="#FFF" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.flashBtn, flashOn && styles.flashBtnActive]}
            onPress={() => setFlashOn(!flashOn)}
            accessibilityLabel="Toggle Torch"
          >
            <Ionicons name={flashOn ? 'flash' : 'flash-off'} size={22} color="#FFF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* 1. MANUAL ENTRY MODAL */}
      <Modal visible={manualModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Manual Pass Verification</Text>
                <Text style={styles.modalSubtitle}>Enter Pass ID, Booking ID, or 6-digit PIN</Text>
              </View>
              <TouchableOpacity onPress={() => setManualModalVisible(false)} style={styles.modalCloseBtn}>
                <Ionicons name="close" size={22} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <View style={styles.inputContainer}>
              <Ionicons name="search-outline" size={20} color="#9CA3AF" style={{ marginRight: 8 }} />
              <TextInput
                style={styles.textInput}
                placeholder="e.g. AMAVP00001, AMABK00001, or 492810"
                placeholderTextColor="#9CA3AF"
                value={manualInput}
                onChangeText={setManualInput}
                autoCapitalize="characters"
                autoCorrect={false}
              />
              {manualInput.length > 0 && (
                <TouchableOpacity onPress={() => setManualInput('')}>
                  <Ionicons name="close-circle" size={18} color="#9CA3AF" />
                </TouchableOpacity>
              )}
            </View>

            {/* Live Search Match Preview - Facility Booking */}
            {manualMatch && (
              <View style={[
                styles.previewCard,
                manualMatch.status === 'CANCELLED' ? styles.previewCardCancelled : styles.previewCardActive,
              ]}>
                <Ionicons
                  name={manualMatch.status === 'CANCELLED' ? 'alert-circle' : 'checkmark-circle'}
                  size={24}
                  color={manualMatch.status === 'CANCELLED' ? '#DC2626' : '#16A34A'}
                  style={{ marginRight: 10 }}
                />
                <View style={{ flex: 1 }}>
                  <Text style={styles.previewTitle}>
                    {manualMatch.facilityName} ({manualMatch.id})
                  </Text>
                  <Text style={styles.previewSub}>
                    {manualMatch.residentName} • Flat {manualMatch.flatNumber}
                  </Text>
                  <Text style={[
                    styles.previewStatus,
                    manualMatch.status === 'CANCELLED' ? { color: '#DC2626' } : { color: '#16A34A' }
                  ]}>
                    Status: {manualMatch.status} • Slot: {manualMatch.slot}
                  </Text>
                </View>
              </View>
            )}

            {/* Live Search Match Preview - Visitor Pass */}
            {manualMatchVisitor && (
              <View style={[
                styles.previewCard,
                checkPassTimingValidity(manualMatchVisitor).canAdmit ? styles.previewCardActive : styles.previewCardCancelled,
              ]}>
                <Ionicons
                  name={checkPassTimingValidity(manualMatchVisitor).canAdmit ? 'checkmark-circle' : 'alert-circle'}
                  size={24}
                  color={checkPassTimingValidity(manualMatchVisitor).canAdmit ? '#16A34A' : '#DC2626'}
                  style={{ marginRight: 10 }}
                />
                <View style={{ flex: 1 }}>
                  <Text style={styles.previewTitle}>
                    {manualMatchVisitor.visitorName} ({manualMatchVisitor.category}) • #{manualMatchVisitor.id}
                  </Text>
                  <Text style={styles.previewSub}>
                    Host: {manualMatchVisitor.residentName} • Flat {manualMatchVisitor.flatNumber}
                  </Text>
                  <Text style={[
                    styles.previewStatus,
                    checkPassTimingValidity(manualMatchVisitor).canAdmit ? { color: '#16A34A' } : { color: '#DC2626' }
                  ]}>
                    Timing: {manualMatchVisitor.startTime} - {manualMatchVisitor.endTime} ({checkPassTimingValidity(manualMatchVisitor).statusText})
                  </Text>
                </View>
              </View>
            )}

            <TouchableOpacity
              style={[styles.verifyBtn, !manualInput.trim() && styles.verifyBtnDisabled]}
              disabled={!manualInput.trim()}
              onPress={() => {
                const target = manualInput.trim();
                setManualModalVisible(false);
                handleVerifyCode(target);
              }}
            >
              <Text style={styles.verifyBtnText}>Verify & Check Pass</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* 2. SCAN VERIFICATION RESULT MODAL */}
      <Modal visible={!!scanResult} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.resultCard}>
            {/* Status Header Banner */}
            <View style={[
              styles.statusHeaderBox,
              scanResult?.status === 'GRANTED' ? styles.statusBoxGranted : styles.statusBoxDenied,
            ]}>
              <Ionicons
                name={scanResult?.status === 'GRANTED' ? 'checkmark-circle' : 'close-circle'}
                size={44}
                color="#FFFFFF"
                style={{ marginBottom: 6 }}
              />
              <Text style={styles.resultTitle}>{scanResult?.title}</Text>
              <Text style={styles.resultMessage}>{scanResult?.message}</Text>
            </View>

            {/* Details Table - Facility Booking */}
            {scanResult?.booking && (
              <View style={styles.detailsTable}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Booking ID</Text>
                  <Text style={[styles.detailValue, { color: '#1D4ED8', fontWeight: 'bold' }]}>
                    #{scanResult.booking.id}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Facility</Text>
                  <Text style={styles.detailValue}>{scanResult.booking.facilityName}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Reserved Slot</Text>
                  <Text style={styles.detailValue}>{scanResult.booking.date} • {scanResult.booking.slot}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Resident</Text>
                  <Text style={styles.detailValue}>{scanResult.booking.residentName} (Flat {scanResult.booking.flatNumber})</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Access PIN</Text>
                  <Text style={[styles.detailValue, { letterSpacing: 1, fontWeight: 'bold' }]}>
                    {scanResult.booking.accessPin}
                  </Text>
                </View>
                <View style={[styles.detailRow, { borderBottomWidth: 0 }]}>
                  <Text style={styles.detailLabel}>Reservation Status</Text>
                  <Text style={[
                    styles.detailValue,
                    scanResult.booking.status === 'CANCELLED' ? { color: '#DC2626' } : { color: '#16A34A' }
                  ]}>
                    {scanResult.booking.status}
                  </Text>
                </View>
              </View>
            )}

            {/* Details Table - Visitor Pass */}
            {scanResult?.visitorPass && (
              <View style={styles.detailsTable}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Pass ID</Text>
                  <Text style={[styles.detailValue, { color: '#1D4ED8', fontWeight: 'bold' }]}>
                    #{scanResult.visitorPass.id}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Visitor Name</Text>
                  <Text style={styles.detailValue}>{scanResult.visitorPass.visitorName} ({scanResult.visitorPass.category})</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Host Resident</Text>
                  <Text style={[styles.detailValue, { fontWeight: 'bold', color: '#0F172A' }]}>
                    {scanResult.visitorPass.residentName}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Host Unit</Text>
                  <Text style={styles.detailValue}>Flat {scanResult.visitorPass.flatNumber}, {scanResult.visitorPass.tower}</Text>
                </View>
                {scanResult.visitorPass.residentPhone && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Host Contact</Text>
                    <Text style={styles.detailValue}>{scanResult.visitorPass.residentPhone}</Text>
                  </View>
                )}
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Valid Date</Text>
                  <Text style={styles.detailValue}>{scanResult.visitorPass.validDate}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Allowed Timing</Text>
                  <Text style={[styles.detailValue, { color: '#1D4ED8', fontWeight: 'bold' }]}>
                    {scanResult.visitorPass.startTime} - {scanResult.visitorPass.endTime}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Gate Access PIN</Text>
                  <Text style={[styles.detailValue, { letterSpacing: 1, fontWeight: 'bold' }]}>
                    {scanResult.visitorPass.accessPin}
                  </Text>
                </View>
                {scanResult.visitorPass.vehicleNumber && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Vehicle #</Text>
                    <Text style={styles.detailValue}>{scanResult.visitorPass.vehicleNumber}</Text>
                  </View>
                )}
                <View style={[styles.detailRow, { borderBottomWidth: 0 }]}>
                  <Text style={styles.detailLabel}>Pass Timing Status</Text>
                  <Text style={[
                    styles.detailValue,
                    checkPassTimingValidity(scanResult.visitorPass).canAdmit ? { color: '#16A34A' } : { color: '#DC2626' }
                  ]}>
                    {checkPassTimingValidity(scanResult.visitorPass).statusText}
                  </Text>
                </View>
              </View>
            )}

            {/* Details Table - Resident Member ID */}
            {scanResult?.type === 'RESIDENT' && (
              <View style={styles.detailsTable}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Resident Name</Text>
                  <Text style={[styles.detailValue, { fontWeight: 'bold', fontSize: 13 }]}>{scanResult.residentName}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Society Flat</Text>
                  <Text style={styles.detailValue}>{scanResult.flatNumber} • {scanResult.tower}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Identity Status</Text>
                  <Text style={[styles.detailValue, { color: '#16A34A', fontWeight: 'bold' }]}>Verified Resident Member</Text>
                </View>
                <View style={[styles.detailRow, { borderBottomWidth: 0 }]}>
                  <Text style={styles.detailLabel}>Gate Privilege</Text>
                  <Text style={[styles.detailValue, { color: '#1D4ED8' }]}>24/7 Unlimited Resident Access</Text>
                </View>
              </View>
            )}

            {/* Actions */}
            <View style={styles.resultActions}>
              {scanResult?.visitorPass && (
                <View style={{ flexDirection: 'row', gap: 8, marginBottom: 10, width: '100%' }}>
                  <TouchableOpacity
                    style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#16A34A', paddingVertical: 10, borderRadius: 10 }}
                    onPress={() => {
                      openCallPicker({
                        id: scanResult.visitorPass!.id,
                        name: scanResult.visitorPass!.residentName,
                        flat: scanResult.visitorPass!.flatNumber,
                        role: 'Host Resident',
                        phone: scanResult.visitorPass!.residentPhone || '9820445566',
                        category: 'resident',
                      }, 'AUDIO');
                    }}
                  >
                    <Ionicons name="call" size={16} color="#FFFFFF" style={{ marginRight: 4 }} />
                    <Text style={{ color: '#FFF', fontWeight: '700', fontSize: 12 }}>Audio Intercom</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#4338CA', paddingVertical: 10, borderRadius: 10 }}
                    onPress={() => {
                      openCallPicker({
                        id: scanResult.visitorPass!.id,
                        name: scanResult.visitorPass!.residentName,
                        flat: scanResult.visitorPass!.flatNumber,
                        role: 'Host Resident',
                        phone: scanResult.visitorPass!.residentPhone || '9820445566',
                        category: 'resident',
                      }, 'VIDEO');
                    }}
                  >
                    <Ionicons name="videocam" size={16} color="#FFFFFF" style={{ marginRight: 4 }} />
                    <Text style={{ color: '#FFF', fontWeight: '700', fontSize: 12 }}>Video Intercom</Text>
                  </TouchableOpacity>
                </View>
              )}

              {scanResult?.status === 'GRANTED' ? (
                <TouchableOpacity style={styles.admitBtn} onPress={handleAdmit}>
                  <Ionicons name="checkmark-done" size={20} color="#FFFFFF" style={{ marginRight: 6 }} />
                  <Text style={styles.admitBtnText}>Admit & Log Entry</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={styles.dismissBtn}
                  onPress={() => setScanResult(null)}
                >
                  <Text style={styles.dismissBtnText}>Deny Entry & Close</Text>
                </TouchableOpacity>
              )}
              {scanResult?.status === 'GRANTED' && (
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => setScanResult(null)}
                >
                  <Text style={styles.cancelBtnText}>Dismiss</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </Modal>

      {/* Logout Confirmation Modal */}
      <LogoutConfirmModal
        visible={logoutModalVisible}
        onClose={() => setLogoutModalVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },
  guardTopHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0F172A',
    paddingTop: 44,
    paddingBottom: 14,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
    zIndex: 10,
  },
  guardHeaderTitle: { color: '#FFFFFF', fontSize: 17, fontWeight: 'bold' },
  guardHeaderSubtitle: { color: '#94A3B8', fontSize: 12, marginTop: 2 },
  guardLogoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#DC2626',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  guardLogoutText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  cameraBg: { ...StyleSheet.absoluteFillObject, backgroundColor: '#0B0F19' },

  flashOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 999,
  },

  header: {
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    paddingTop: 48,
    paddingBottom: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold' },
  headerSubtitle: { color: '#94A3B8', fontSize: 12, marginTop: 3 },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#064E3B',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#059669',
  },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#10B981', marginRight: 5 },
  liveText: { color: '#A7F3D0', fontSize: 10, fontWeight: 'bold', letterSpacing: 0.5 },

  scannerOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 16 },
  cameraContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10 },
  cameraCardWrapper: {
    width: '100%',
    maxWidth: 380,
    height: 330,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#000000',
    borderWidth: 2,
    borderColor: '#334155',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraInnerFeed: {
    width: '100%',
    height: '100%',
  },
  reticleOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  scanArea: {
    width: 250,
    height: 250,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderRadius: 16,
    overflow: 'hidden',
  },
  reticle: {
    width: 250,
    height: 250,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.35)',
    borderRadius: 16,
    overflow: 'hidden',
  },
  corner: { position: 'absolute', width: 38, height: 38, borderColor: '#10B981', borderWidth: 3.5 },
  tl: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0, borderTopLeftRadius: 14 },
  tr: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0, borderTopRightRadius: 14 },
  bl: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0, borderBottomLeftRadius: 14 },
  br: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0, borderBottomRightRadius: 14 },
  scanLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 2.5,
    backgroundColor: '#10B981',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 6,
  },
  reticleCenter: { opacity: 0.4 },
  scanHint: {
    color: '#E2E8F0',
    marginTop: 20,
    fontSize: 13,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#334155',
    textAlign: 'center',
  },

  simBar: { width: '100%', marginTop: 20, alignItems: 'center' },
  simLabel: { fontSize: 11, fontWeight: '700', color: '#94A3B8', letterSpacing: 0.8, marginBottom: 8 },
  simList: { paddingHorizontal: 10, gap: 8 },
  simChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
  },
  simChipConfirmed: { backgroundColor: 'rgba(16, 185, 129, 0.15)', borderColor: '#059669' },
  simChipCancelled: { backgroundColor: 'rgba(239, 68, 68, 0.15)', borderColor: '#DC2626' },
  simChipText: { color: '#F1F5F9', fontSize: 11, fontWeight: '600' },

  bottomPanel: {
    backgroundColor: '#0F172A',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 30,
    borderTopWidth: 1,
    borderColor: '#1E293B',
  },
  panelHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  panelTitle: { color: '#E2E8F0', fontSize: 14, fontWeight: 'bold' },
  panelCount: { color: '#64748B', fontSize: 12 },

  recentChips: { gap: 8, marginBottom: 16 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  chipBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#334155',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  chipBadgeFacility: { backgroundColor: '#1E3A8A' },
  chipBadgeResident: { backgroundColor: '#065F46' },
  chipText: { color: '#F8FAFC', fontSize: 13, fontWeight: '600' },
  chipSubText: { color: '#94A3B8', fontSize: 11, marginTop: 1 },

  actionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  manualBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1D4ED8',
    paddingVertical: 14,
    borderRadius: 12,
  },
  manualBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: 'bold', marginLeft: 8 },
  flashBtn: {
    width: 50,
    height: 50,
    borderRadius: 12,
    backgroundColor: '#1E293B',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  flashBtnActive: { backgroundColor: '#F59E0B', borderColor: '#F59E0B' },

  // Manual Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    width: '100%',
    maxWidth: 420,
    borderRadius: 20,
    padding: 22,
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#0F172A' },
  modalSubtitle: { fontSize: 12, color: '#64748B', marginTop: 2 },
  modalCloseBtn: { padding: 4 },

  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
    backgroundColor: '#F8FAFC',
    marginBottom: 14,
  },
  textInput: { flex: 1, fontSize: 14, fontWeight: '600', color: '#0F172A' },

  previewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  previewCardActive: { backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' },
  previewCardCancelled: { backgroundColor: '#FEF2F2', borderColor: '#FECACA' },
  previewTitle: { fontSize: 14, fontWeight: 'bold', color: '#0F172A' },
  previewSub: { fontSize: 12, color: '#475569', marginTop: 2 },
  previewStatus: { fontSize: 11, fontWeight: '700', marginTop: 2 },

  verifyBtn: {
    backgroundColor: '#1D4ED8',
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  verifyBtnDisabled: { backgroundColor: '#94A3B8' },
  verifyBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: 'bold' },

  // Result Card
  resultCard: {
    backgroundColor: '#FFFFFF',
    width: '100%',
    maxWidth: 420,
    borderRadius: 24,
    overflow: 'hidden',
    alignItems: 'center',
  },
  statusHeaderBox: {
    width: '100%',
    paddingVertical: 22,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  statusBoxGranted: { backgroundColor: '#059669' },
  statusBoxDenied: { backgroundColor: '#DC2626' },
  resultTitle: { fontSize: 18, fontWeight: '900', color: '#FFFFFF', letterSpacing: 0.5 },
  resultMessage: { fontSize: 13, color: '#F1F5F9', textAlign: 'center', marginTop: 6, lineHeight: 18 },

  detailsTable: {
    width: '100%',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#F8FAFC',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  detailLabel: { fontSize: 12, color: '#64748B' },
  detailValue: { fontSize: 12, fontWeight: '600', color: '#0F172A', maxWidth: 200, textAlign: 'right' },

  resultActions: {
    width: '100%',
    padding: 18,
    gap: 10,
    backgroundColor: '#FFFFFF',
  },
  admitBtn: {
    flexDirection: 'row',
    height: 48,
    backgroundColor: '#059669',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  admitBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: 'bold' },
  dismissBtn: {
    height: 48,
    backgroundColor: '#DC2626',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dismissBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: 'bold' },
  cancelBtn: {
    height: 44,
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelBtnText: { color: '#475569', fontSize: 14, fontWeight: '600' },
});
