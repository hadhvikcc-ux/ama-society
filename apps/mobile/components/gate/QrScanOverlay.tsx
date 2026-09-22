import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';

export function QrScanOverlay() {
  const glowAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 0.3, duration: 1000, useNativeDriver: true }),
      ])
    ).start();
  }, [glowAnim]);

  return (
    <View style={styles.overlay}>
      <Animated.View style={[styles.frame, { borderColor: glowAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['rgba(0, 255, 0, 0.3)', 'rgba(0, 255, 0, 1)']
      }) }]}>
        <View style={[styles.corner, styles.tl]} />
        <View style={[styles.corner, styles.tr]} />
        <View style={[styles.corner, styles.bl]} />
        <View style={[styles.corner, styles.br]} />
      </Animated.View>
      <Text style={styles.label}>Point at resident QR code</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  frame: { width: 250, height: 250, borderWidth: 2, borderRadius: 20 },
  corner: { position: 'absolute', width: 40, height: 40, borderColor: '#00FF00' },
  tl: { top: -2, left: -2, borderTopWidth: 4, borderLeftWidth: 4, borderTopLeftRadius: 20 },
  tr: { top: -2, right: -2, borderTopWidth: 4, borderRightWidth: 4, borderTopRightRadius: 20 },
  bl: { bottom: -2, left: -2, borderBottomWidth: 4, borderLeftWidth: 4, borderBottomLeftRadius: 20 },
  br: { bottom: -2, right: -2, borderBottomWidth: 4, borderRightWidth: 4, borderBottomRightRadius: 20 },
  label: { color: 'white', marginTop: 40, fontSize: 16, fontWeight: 'bold' },
});
