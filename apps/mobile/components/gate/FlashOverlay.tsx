import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface FlashOverlayProps {
  type: 'success' | 'error' | null;
  onAnimationEnd: () => void;
}

export function FlashOverlay({ type, onAnimationEnd }: FlashOverlayProps) {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (type) {
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 150, useNativeDriver: true }),
        Animated.delay(500),
        Animated.timing(opacity, { toValue: 0, duration: 150, useNativeDriver: true }),
      ]).start(() => onAnimationEnd());
    }
  }, [type, opacity, onAnimationEnd]);

  if (!type) return null;

  const isSuccess = type === 'success';
  const bgColor = isSuccess ? 'rgba(0,255,0,0.4)' : 'rgba(255,0,0,0.4)';
  const icon = isSuccess ? 'checkmark-circle' : 'close-circle';
  const text = isSuccess ? 'Access Granted' : 'Access Denied';

  return (
    <Animated.View style={[StyleSheet.absoluteFill, styles.container, { backgroundColor: bgColor, opacity }]}>
      <Ionicons name={icon} size={100} color="white" />
      <Text style={styles.text}>{text}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { justifyContent: 'center', alignItems: 'center', zIndex: 100 },
  text: { color: 'white', fontSize: 32, fontWeight: 'bold', marginTop: 20 },
});
