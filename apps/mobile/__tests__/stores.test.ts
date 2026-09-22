import { describe, it, expect } from '@jest/globals';
import { generatePassId, checkPassTimingValidity } from '../stores/visitorPassStore';
import { useSocietyStore } from '../stores/societyStore';
import { useBazaarStore } from '../stores/bazaarStore';
import { useCabStore, RideType, RideStatus, calculateEstimatedFare } from '../stores/cabStore';
import { useTrackingStore, calculateBearing } from '../stores/trackingStore';
import { getAuthorizedHomeForRole, isRoleAuthorizedForSegment, isPublicRoute } from '../utils/rbac';

describe('AMA Mobile Stores Test Suite', () => {
  it('generates sequential pass IDs correctly', () => {
    expect(generatePassId(1)).toBe('AMAVP00001');
    expect(generatePassId(42)).toBe('AMAVP00042');
  });

  it('correctly validates pass timing rules', () => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const todayFormatted = `Today, ${String(now.getDate()).padStart(2, '0')} ${now.toLocaleDateString('en-US', { month: 'short' })} ${now.getFullYear()}`;
    const pass = {
      id: 'AMAVP00001',
      visitorName: 'Test Visitor',
      category: 'Guest' as const,
      validDate: todayFormatted,
      validDateRaw: today,
      startTime: '12:01 AM',
      endTime: '11:59 PM',
      timeSlotLabel: 'All Day',
      flatNumber: 'B-204',
      tower: 'Tower B',
      residentName: 'Aditya',
      accessPin: '123456',
      status: 'ACTIVE' as const,
      createdAt: now.toISOString(),
    };
    const result = checkPassTimingValidity(pass);
    expect(result.isValid).toBe(true);
  });

  it('rejects cancelled passes at gate', () => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const todayFormatted = `Today, ${String(now.getDate()).padStart(2, '0')} ${now.toLocaleDateString('en-US', { month: 'short' })} ${now.getFullYear()}`;
    const pass = {
      id: 'AMAVP00002',
      visitorName: 'Cancelled Visitor',
      category: 'Guest' as const,
      validDate: todayFormatted,
      validDateRaw: today,
      startTime: '12:01 AM',
      endTime: '11:59 PM',
      timeSlotLabel: 'All Day',
      flatNumber: 'B-204',
      tower: 'Tower B',
      residentName: 'Aditya',
      accessPin: '123456',
      status: 'CANCELLED' as const,
      createdAt: now.toISOString(),
    };
    const result = checkPassTimingValidity(pass);
    expect(result.canAdmit).toBe(false);
  });

  it('manages society registry and member counts', () => {
    const society = useSocietyStore.getState();
    expect(society.members.length).toBeGreaterThan(0);
    expect(society.totalFlatsCount).toBe(120);
  });

  it('maintains bazaar catalog products', () => {
    const bazaar = useBazaarStore.getState();
    expect(bazaar.products.length).toBeGreaterThan(0);
  });

  it('enforces RBAC role home mapping and strict segment authorization', () => {
    // 1. Role to Home Destination
    expect(getAuthorizedHomeForRole('resident')).toBe('/(resident)');
    expect(getAuthorizedHomeForRole('resident_owner')).toBe('/(resident)');
    expect(getAuthorizedHomeForRole('resident_tenant')).toBe('/(resident)');
    expect(getAuthorizedHomeForRole('admin')).toBe('/(admin)');
    expect(getAuthorizedHomeForRole('committee')).toBe('/(admin)');
    expect(getAuthorizedHomeForRole('facility_manager')).toBe('/(admin)');
    expect(getAuthorizedHomeForRole('guard')).toBe('/(guard)');
    expect(getAuthorizedHomeForRole('technician')).toBe('/(guard)');
    expect(getAuthorizedHomeForRole('vendor')).toBe('/(vendor)');
    expect(getAuthorizedHomeForRole('supplier')).toBe('/(supplier)');

    // 2. Strict Role Segment Permissions
    // Resident: can access (resident), cannot access (admin), (guard), (vendor), (supplier)
    expect(isRoleAuthorizedForSegment('resident', '(resident)')).toBe(true);
    expect(isRoleAuthorizedForSegment('resident', '(admin)')).toBe(false);
    expect(isRoleAuthorizedForSegment('resident', '(guard)')).toBe(false);
    expect(isRoleAuthorizedForSegment('resident', '(vendor)')).toBe(false);
    expect(isRoleAuthorizedForSegment('resident', '(supplier)')).toBe(false);

    // Guard: can access (guard), cannot access (admin), (resident), (vendor), (supplier)
    expect(isRoleAuthorizedForSegment('guard', '(guard)')).toBe(true);
    expect(isRoleAuthorizedForSegment('guard', '(admin)')).toBe(false);
    expect(isRoleAuthorizedForSegment('guard', '(resident)')).toBe(false);
    expect(isRoleAuthorizedForSegment('guard', '(supplier)')).toBe(false);

    // Supplier: can access (supplier), cannot access (guard), (admin), (resident)
    expect(isRoleAuthorizedForSegment('supplier', '(supplier)')).toBe(true);
    expect(isRoleAuthorizedForSegment('supplier', '(admin)')).toBe(false);
    expect(isRoleAuthorizedForSegment('supplier', '(guard)')).toBe(false);

    // Vendor: can access (vendor), cannot access (admin), (guard)
    expect(isRoleAuthorizedForSegment('vendor', '(vendor)')).toBe(true);
    expect(isRoleAuthorizedForSegment('vendor', '(admin)')).toBe(false);

    // 3. Public Route Gating: Only auth is public; test-bot is restricted
    expect(isPublicRoute(['auth'])).toBe(true);
    expect(isPublicRoute(['test-bot'])).toBe(false);
    expect(isPublicRoute(['(resident)'])).toBe(false);
    expect(isPublicRoute(['(admin)'])).toBe(false);
    expect(isPublicRoute(['(guard)'])).toBe(false);
    expect(isPublicRoute(['(supplier)'])).toBe(false);

    // 4. E2E Test Bot Gating: Exclusively enabled for Admin only
    expect(isRoleAuthorizedForSegment('admin', 'test-bot')).toBe(true);
    expect(isRoleAuthorizedForSegment('committee', 'test-bot')).toBe(false);
    expect(isRoleAuthorizedForSegment('facility_manager', 'test-bot')).toBe(false);
    expect(isRoleAuthorizedForSegment('resident', 'test-bot')).toBe(false);
    expect(isRoleAuthorizedForSegment('resident_owner', 'test-bot')).toBe(false);
    expect(isRoleAuthorizedForSegment('resident_tenant', 'test-bot')).toBe(false);
    expect(isRoleAuthorizedForSegment('guard', 'test-bot')).toBe(false);
    expect(isRoleAuthorizedForSegment('technician', 'test-bot')).toBe(false);
    expect(isRoleAuthorizedForSegment('vendor', 'test-bot')).toBe(false);
    expect(isRoleAuthorizedForSegment('supplier', 'test-bot')).toBe(false);
  });

  it('handles cab & auto ride booking, fare estimation, and gate transit pass clearance', () => {
    // 1. Fare Estimation
    const autoFare = calculateEstimatedFare(RideType.AUTO, 10);
    const sedanFare = calculateEstimatedFare(RideType.SEDAN, 10);
    expect(autoFare).toBe(45 + 10 * 14); // 185
    expect(sedanFare).toBe(130 + 10 * 22); // 350
    expect(sedanFare).toBeGreaterThan(autoFare);

    // 2. Book a ride
    const booking = useCabStore.getState().bookRide({
      rideType: RideType.AUTO,
      destinationName: "Kempegowda Int'l Airport (BLR)",
      distanceKm: 34,
      residentName: 'Aditya Sharma',
      residentFlat: 'B-204',
    });

    expect(booking).toBeDefined();
    expect(booking.passCode.startsWith('CP-')).toBe(true);
    expect(booking.gatePin.length).toBe(4);
    expect(booking.driver.name).toBeDefined();
    expect(booking.driver.vehicleNumber).toBeDefined();
    expect(booking.status).toBe(RideStatus.ASSIGNED);

    // 3. Guard Search & Inward Clearance
    const foundByPass = useCabStore.getState().findCabPass(booking.passCode);
    expect(foundByPass?.id).toBe(booking.id);

    const foundByPlate = useCabStore.getState().findCabPass(booking.driver.vehicleNumber);
    expect(foundByPlate?.id).toBe(booking.id);

    const foundByPin = useCabStore.getState().findCabPass(booking.gatePin);
    expect(foundByPin?.id).toBe(booking.id);

    // 4. Guard clears inward entry
    const cleared = useCabStore.getState().verifyGateInward(booking.passCode, 'Bahadur Singh (Gate 1)', 'Gate 1');
    expect(cleared).not.toBeNull();
    expect(cleared?.status).toBe(RideStatus.INSIDE_CAMPUS);
    expect(cleared?.transitExpiresAt).toBeDefined();

    // 5. Complete ride
    useCabStore.getState().completeRide(booking.id);
    const updated = useCabStore.getState().bookings.find((b) => b.id === booking.id);
    expect(updated?.status).toBe(RideStatus.COMPLETED);
  });

  it('supports Google Maps live tracking for cabs, autos, and deliveries', () => {
    const tracking = useTrackingStore.getState();

    // 1. Initial State & Preset Trips
    expect(tracking.trips.length).toBeGreaterThanOrEqual(4);
    const cabTrip = tracking.trips.find((t) => t.id === 'trip-cab-airport');
    expect(cabTrip).toBeDefined();
    expect(cabTrip?.tripType).toBe('CAB');
    expect(cabTrip?.waypoints.length).toBeGreaterThan(3);

    const martTrip = tracking.trips.find((t) => t.id === 'trip-delivery-mart');
    expect(martTrip).toBeDefined();
    expect(martTrip?.tripType).toBe('DELIVERY_MART');

    // 2. Bearing Angle Math
    const northHeading = calculateBearing(13.0, 77.0, 13.1, 77.0);
    expect(northHeading).toBeCloseTo(0, 0);

    const eastHeading = calculateBearing(13.0, 77.0, 13.0, 77.1);
    expect(eastHeading).toBeCloseTo(90, 0);

    // 3. Trip Switching
    tracking.setActiveTripId('trip-delivery-mart');
    expect(useTrackingStore.getState().activeTripId).toBe('trip-delivery-mart');
    const activeTrip = useTrackingStore.getState().getActiveTrip();
    expect(activeTrip.id).toBe('trip-delivery-mart');

    // 4. Dynamic Telemetry & GPS Interpolation
    useTrackingStore.getState().setProgress(0.5);
    const telemetry = useTrackingStore.getState().getLiveTelemetry();
    expect(telemetry.progressPercent).toBe(50);
    expect(telemetry.currentLat).toBeGreaterThan(13.0);
    expect(telemetry.currentLng).toBeGreaterThan(77.0);
    expect(telemetry.remainingDistanceKm).toBeLessThan(activeTrip.totalDistanceKm);
    expect(telemetry.remainingEtaMins).toBeLessThanOrEqual(activeTrip.totalDurationMins);
    expect(telemetry.currentStreet).toBeDefined();

    // 5. Simulation Playback Stepping
    useTrackingStore.getState().setProgress(0.1);
    useTrackingStore.getState().setIsPlaying(true);
    useTrackingStore.getState().setPlaybackSpeed(2);
    useTrackingStore.getState().stepSimulation(5);
    expect(useTrackingStore.getState().progress).toBeGreaterThan(0.1);

    // 6. Map Display Controls
    useTrackingStore.getState().setMapStyle('SATELLITE');
    expect(useTrackingStore.getState().mapStyle).toBe('SATELLITE');
    useTrackingStore.getState().toggleTraffic();
    expect(useTrackingStore.getState().showTraffic).toBe(false);
    useTrackingStore.getState().zoomIn();
    expect(useTrackingStore.getState().zoomLevel).toBe(4);
    useTrackingStore.getState().zoomOut();
    expect(useTrackingStore.getState().zoomLevel).toBe(3);
  });
});
