import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { BazaarGroupHeader } from '../../../components/bazaar/BazaarGroupHeader';
import { BazaarScannersView } from '../../../components/bazaar/BazaarScannersView';

export default function OcrScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <BazaarGroupHeader
        activeTab="SCANNERS"
        showBack
      />
      <BazaarScannersView
        onNavigateToCart={() => router.push('/(resident)/bazaar/cart' as any)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
});
