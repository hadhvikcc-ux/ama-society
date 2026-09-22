import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  Animated,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export interface UniversalCameraViewProps {
  mode?: 'scanner' | 'video-call' | 'preview';
  facing?: 'front' | 'back';
  isActive?: boolean;
  enableTorch?: boolean;
  mirror?: boolean;
  onBarcodeScanned?: (data: string) => void;
  style?: ViewStyle | ViewStyle[];
  children?: React.ReactNode;
  showFlipButton?: boolean;
  onFlipCamera?: () => void;
  showStatusIndicator?: boolean;
  scanIntervalMs?: number;
  fallbackTitle?: string;
}

export function UniversalCameraView({
  mode = 'preview',
  facing = 'back',
  isActive = true,
  enableTorch = false,
  mirror = false,
  onBarcodeScanned,
  style,
  children,
  showFlipButton = false,
  onFlipCamera,
  showStatusIndicator = true,
  scanIntervalMs = 400,
  fallbackTitle = 'Camera Feed',
}: UniversalCameraViewProps) {
  const videoRef = useRef<any>(null);
  const streamRef = useRef<any>(null);
  const fileInputRef = useRef<any>(null);

  const [permissionStatus, setPermissionStatus] = useState<
    'checking' | 'granted' | 'denied' | 'unavailable' | 'error'
  >('checking');
  const [isStreaming, setIsStreaming] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [useSimulatedFeed, setUseSimulatedFeed] = useState(false);
  const [lastScannedCode, setLastScannedCode] = useState<string | null>(null);

  // Animated pulse for simulated or active feed
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.15, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulseAnim]);

  // Callback ref to ensure video element always receives stream upon mounting
  const setVideoNode = useCallback((node: any) => {
    videoRef.current = node;
    if (node && streamRef.current) {
      if (node.srcObject !== streamRef.current) {
        node.srcObject = streamRef.current;
        node.play().catch(() => {});
      }
    }
  }, []);

  // Clean up media stream tracks
  const stopStream = useCallback(() => {
    if (streamRef.current) {
      try {
        const tracks = streamRef.current.getTracks();
        tracks.forEach((track: any) => {
          track.stop();
        });
      } catch (e) {
        console.warn('Error stopping stream tracks:', e);
      }
      streamRef.current = null;
    }
    if (videoRef.current) {
      try {
        videoRef.current.srcObject = null;
      } catch (e) {}
    }
    setIsStreaming(false);
  }, []);

  // Initialize web camera
  const startWebCamera = useCallback(async () => {
    if (Platform.OS !== 'web') return;

    if (!isActive) {
      stopStream();
      return;
    }

    setPermissionStatus('checking');
    setErrorMessage(null);

    // Check mediaDevices support in browser
    if (
      typeof navigator === 'undefined' ||
      !navigator.mediaDevices ||
      !navigator.mediaDevices.getUserMedia
    ) {
      setPermissionStatus('unavailable');
      setErrorMessage('Browser does not support camera capture APIs.');
      setUseSimulatedFeed(true);
      return;
    }

    try {
      stopStream();

      const facingModeStr = facing === 'front' ? 'user' : 'environment';
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: facingModeStr,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        try {
          await videoRef.current.play();
        } catch (playErr) {
          videoRef.current.muted = true;
          await videoRef.current.play().catch(() => {});
        }
      }

      setPermissionStatus('granted');
      setIsStreaming(true);
      setUseSimulatedFeed(false);
    } catch (err: any) {
      console.warn('getUserMedia error:', err?.name, err?.message);
      if (err?.name === 'NotAllowedError' || err?.name === 'PermissionDeniedError') {
        setPermissionStatus('denied');
        setErrorMessage('Camera permission was denied. Please allow camera access in your browser.');
      } else if (err?.name === 'NotFoundError' || err?.name === 'DevicesNotFoundError') {
        setPermissionStatus('unavailable');
        setErrorMessage('No camera hardware found on this device.');
        setUseSimulatedFeed(true);
      } else if (err?.name === 'NotReadableError' || err?.name === 'TrackStartError') {
        setPermissionStatus('error');
        setErrorMessage('Camera is currently in use by another application or tab.');
        setUseSimulatedFeed(true);
      } else {
        setPermissionStatus('error');
        setErrorMessage(err?.message || 'Unable to access camera.');
        setUseSimulatedFeed(true);
      }
      setIsStreaming(false);
    }
  }, [facing, isActive, stopStream]);

  // Torch control on Web
  useEffect(() => {
    if (Platform.OS === 'web' && streamRef.current) {
      try {
        const track = streamRef.current.getVideoTracks()[0];
        if (track) {
          const capabilities = track.getCapabilities ? track.getCapabilities() : null;
          if (capabilities && capabilities.torch) {
            track
              .applyConstraints({
                advanced: [{ torch: !!enableTorch }],
              } as any)
              .catch(() => {});
          }
        }
      } catch (e) {}
    }
  }, [enableTorch]);

  // Lifecycle start / stop on Web
  useEffect(() => {
    if (Platform.OS === 'web') {
      startWebCamera();
    }
    return () => {
      stopStream();
    };
  }, [startWebCamera, stopStream]);

  // Barcode / QR Scanning loop on Web
  useEffect(() => {
    if (Platform.OS !== 'web' || !onBarcodeScanned || !isStreaming || useSimulatedFeed) return;

    let barcodeDetector: any = null;
    if (typeof window !== 'undefined' && 'BarcodeDetector' in window) {
      try {
        barcodeDetector = new (window as any).BarcodeDetector({
          formats: ['qr_code', 'ean_13', 'ean_8', 'code_128', 'code_39', 'upc_a', 'upc_e'],
        });
      } catch (e) {
        barcodeDetector = null;
      }
    }

    let isScanning = true;
    let lastCode = '';
    let lastScanTime = 0;

    const interval = setInterval(async () => {
      if (!isScanning || !videoRef.current) return;
      if (videoRef.current.readyState < 2) return; // HAVE_CURRENT_DATA

      if (barcodeDetector) {
        try {
          const barcodes = await barcodeDetector.detect(videoRef.current);
          if (barcodes && barcodes.length > 0) {
            const code = barcodes[0].rawValue;
            const now = Date.now();
            if (code && (code !== lastCode || now - lastScanTime > 2500)) {
              lastCode = code;
              lastScanTime = now;
              setLastScannedCode(code);
              onBarcodeScanned(code);
            }
          }
        } catch (e) {
          // ignore detection frame drops
        }
      }
    }, scanIntervalMs);

    return () => {
      isScanning = false;
      clearInterval(interval);
    };
  }, [isStreaming, onBarcodeScanned, scanIntervalMs, useSimulatedFeed]);

  // Handle uploading / scanning a QR from an image file
  const handleUploadQrFile = (event: any) => {
    const file = event.target?.files?.[0];
    if (!file) return;

    if (typeof window !== 'undefined' && 'BarcodeDetector' in window) {
      const img = new Image();
      img.onload = async () => {
        try {
          const detector = new (window as any).BarcodeDetector({
            formats: ['qr_code', 'ean_13', 'ean_8', 'code_128', 'code_39', 'upc_a', 'upc_e'],
          });
          const barcodes = await detector.detect(img);
          if (barcodes && barcodes.length > 0) {
            const raw = barcodes[0].rawValue;
            setLastScannedCode(raw);
            if (onBarcodeScanned) onBarcodeScanned(raw);
          } else {
            alert('No QR code or barcode found in the uploaded image.');
          }
        } catch (err) {
          alert('Could not decode barcode from image.');
        }
      };
      img.src = URL.createObjectURL(file);
    } else {
      alert('Barcode Detector is not natively supported in this browser version. You can use the Quick Test Pass chips below to test verification.');
    }
  };

  // Render on Web
  if (Platform.OS === 'web') {
    const shouldMirror = mirror || facing === 'front';

    return (
      <View style={[styles.rootContainer, style]}>
        {/* Real Web Video Element - rendered directly to guarantee ref binding */}
        <View
          style={[
            styles.webVideoWrapper,
            (useSimulatedFeed || permissionStatus !== 'granted') && styles.hiddenVideoWrapper,
          ]}
        >
          {React.createElement('video', {
            ref: setVideoNode,
            autoPlay: true,
            playsInline: true,
            muted: true,
            style: {
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transform: shouldMirror ? 'scaleX(-1)' : 'none',
              backgroundColor: '#000000',
            },
          })}
        </View>

        {/* Simulated Feed Fallback (when hardware camera is missing or user requests simulation) */}
        {useSimulatedFeed && (
          <View style={styles.simulatedFeedContainer}>
            <Animated.View
              style={[
                styles.simulatedGridPulse,
                { transform: [{ scale: pulseAnim }] },
              ]}
            >
              <Ionicons
                name={mode === 'video-call' ? 'videocam' : 'qr-code-outline'}
                size={mode === 'video-call' ? 44 : 54}
                color="#10B981"
                style={{ opacity: 0.8 }}
              />
            </Animated.View>
            <Text style={styles.simulatedFeedTitle}>
              {mode === 'video-call' ? 'Live Video Intercom Stream' : 'Live Camera Viewfinder'}
            </Text>
            <Text style={styles.simulatedFeedSub}>
              {errorMessage || 'Hardware camera is simulated in this browser session'}
            </Text>

            {/* Quick action to retry hardware camera */}
            <TouchableOpacity
              style={styles.retryCameraBtn}
              onPress={() => {
                setUseSimulatedFeed(false);
                startWebCamera();
              }}
              activeOpacity={0.8}
            >
              <Ionicons name="refresh" size={14} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={styles.retryCameraBtnText}>Retry Physical Camera</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Permission Checking Spinner */}
        {permissionStatus === 'checking' && !useSimulatedFeed && (
          <View style={styles.permissionCard}>
            <ActivityIndicator size="large" color="#10B981" />
            <Text style={styles.permissionTitle}>Initializing Camera Feed...</Text>
            <Text style={styles.permissionSub}>Requesting camera stream access</Text>
          </View>
        )}

        {/* Permission Denied Card */}
        {permissionStatus === 'denied' && (
          <View style={styles.permissionCard}>
            <Ionicons name="videocam-off" size={48} color="#EF4444" style={{ marginBottom: 12 }} />
            <Text style={styles.permissionTitle}>Camera Permission Blocked</Text>
            <Text style={styles.permissionSub}>
              Please grant camera permission in your browser address bar to scan passes or make video calls.
            </Text>
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
              <TouchableOpacity
                style={[styles.permissionActionBtn, { backgroundColor: '#10B981' }]}
                onPress={startWebCamera}
              >
                <Ionicons name="reload" size={14} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.permissionActionBtnText}>Try Again</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.permissionActionBtn, { backgroundColor: '#334155' }]}
                onPress={() => setUseSimulatedFeed(true)}
              >
                <Text style={styles.permissionActionBtnText}>Use Simulation Mode</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Top Status Bar Overlays */}
        {showStatusIndicator && (
          <View style={styles.statusBarRow} pointerEvents="box-none">
            <View style={styles.livePill}>
              <View
                style={[
                  styles.liveDot,
                  { backgroundColor: isStreaming ? '#10B981' : '#F59E0B' },
                ]}
              />
              <Text style={styles.livePillText}>
                {isStreaming
                  ? `LIVE • ${facing === 'front' ? 'FRONT' : 'BACK'} CAM`
                  : useSimulatedFeed
                  ? 'CAM SIMULATOR'
                  : 'CONNECTING...'}
              </Text>
            </View>

            {/* Quick Controls: Flip & Torch */}
            <View style={styles.topControlsGroup}>
              {showFlipButton && onFlipCamera && (
                <TouchableOpacity
                  style={styles.circleIconBtn}
                  onPress={onFlipCamera}
                  activeOpacity={0.8}
                  accessibilityLabel="Flip camera"
                >
                  <Ionicons name="camera-reverse-outline" size={18} color="#FFFFFF" />
                </TouchableOpacity>
              )}

              {/* Upload QR image button in scanner mode on web */}
              {mode === 'scanner' && (
                <TouchableOpacity
                  style={styles.circleIconBtn}
                  onPress={() => fileInputRef.current?.click()}
                  activeOpacity={0.8}
                  accessibilityLabel="Scan QR from Image"
                >
                  <Ionicons name="image-outline" size={18} color="#FFFFFF" />
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        {/* Hidden file input for uploading QR code screenshot */}
        {mode === 'scanner' && (
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleUploadQrFile}
          />
        )}

        {/* Last scanned toast banner */}
        {lastScannedCode && mode === 'scanner' && (
          <View style={styles.lastScannedBanner}>
            <Ionicons name="checkmark-circle" size={14} color="#10B981" style={{ marginRight: 6 }} />
            <Text style={styles.lastScannedText} numberOfLines={1}>
              Scanned: {lastScannedCode}
            </Text>
          </View>
        )}

        {/* Overlay children (Reticle, HUD, buttons, etc.) */}
        {children}
      </View>
    );
  }

  // Fallback / Native implementation
  return (
    <View style={[styles.rootContainer, style]}>
      <View style={styles.simulatedFeedContainer}>
        <Ionicons name="videocam-outline" size={48} color="#10B981" />
        <Text style={styles.simulatedFeedTitle}>{fallbackTitle}</Text>
        <Text style={styles.simulatedFeedSub}>
          {facing === 'front' ? 'Front Camera Active' : 'Rear Camera Active'}
        </Text>
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  rootContainer: {
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: '#000000',
    width: '100%',
    height: '100%',
  },
  webVideoWrapper: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  hiddenVideoWrapper: {
    opacity: 0,
    position: 'absolute',
    pointerEvents: 'none',
  },
  simulatedFeedContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#0B0F19',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  simulatedGridPulse: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    marginBottom: 14,
  },
  simulatedFeedTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#F8FAFC',
    textAlign: 'center',
    marginTop: 4,
  },
  simulatedFeedSub: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 6,
    maxWidth: 280,
    lineHeight: 18,
  },
  retryCameraBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 18,
  },
  retryCameraBtnText: {
    color: '#F1F5F9',
    fontSize: 12,
    fontWeight: '700',
  },
  permissionCard: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    zIndex: 20,
  },
  permissionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 12,
    textAlign: 'center',
  },
  permissionSub: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
    maxWidth: 300,
  },
  permissionActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
  },
  permissionActionBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  statusBarRow: {
    position: 'absolute',
    top: 12,
    left: 14,
    right: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 30,
  },
  livePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    marginRight: 6,
  },
  livePillText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  topControlsGroup: {
    flexDirection: 'row',
    gap: 8,
  },
  circleIconBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  lastScannedBanner: {
    position: 'absolute',
    bottom: 12,
    left: 14,
    right: 14,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#10B981',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    zIndex: 30,
  },
  lastScannedText: {
    color: '#F8FAFC',
    fontSize: 11,
    fontWeight: '600',
  },
});
