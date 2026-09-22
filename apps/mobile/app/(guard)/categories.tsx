import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ScreenHeader } from '../../components/ui/ScreenHeader';

const categories = [
  { id: '1', emoji: '🧑🤝🧑', title: 'Guest', desc: 'Verify resident has approved. Call resident if unannounced.' },
  { id: '2', emoji: '📦', title: 'Delivery', desc: 'Check parcel details. Resident app notification sent.' },
  { id: '3', emoji: '🚕', title: 'Cab', desc: 'Verify booking app screenshot. Brief entry.' },
  { id: '4', emoji: '🔧', title: 'Service', desc: 'Check service ID. Resident must confirm booking.' },
  { id: '5', emoji: '👶', title: 'Domestic Helper', desc: 'Regular staff — verify face and ID card.' },
  { id: '6', emoji: '🚑', title: 'Emergency', desc: 'Always allow. Log details after.' },
];

export default function GuardCategories() {
  return (
    <View style={styles.container}>
      <ScreenHeader title="Visitor Categories" />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.grid}>
          {categories.map(cat => (
            <View key={cat.id} style={styles.card}>
              <Text style={styles.emoji}>{cat.emoji}</Text>
              <Text style={styles.title}>{cat.title}</Text>
              <Text style={styles.desc}>{cat.desc}</Text>
            </View>
          ))}
        </View>

        <View style={styles.protocolCard}>
          <View style={styles.protocolHeader}>
            <Ionicons name="shield-checkmark" size={24} color="#16A34A" />
            <Text style={styles.protocolTitle}>Quick Entry Protocol</Text>
          </View>
          <View style={styles.stepRow}>
            <View style={styles.stepNum}><Text style={styles.stepNumText}>1</Text></View>
            <Text style={styles.stepText}>Ask for entry code if pre-approved</Text>
          </View>
          <View style={styles.stepRow}>
            <View style={styles.stepNum}><Text style={styles.stepNumText}>2</Text></View>
            <Text style={styles.stepText}>If no code, ask for flat number and purpose</Text>
          </View>
          <View style={styles.stepRow}>
            <View style={styles.stepNum}><Text style={styles.stepNumText}>3</Text></View>
            <Text style={styles.stepText}>Enter details in scanner app to send approval request</Text>
          </View>
          <View style={styles.stepRow}>
            <View style={styles.stepNum}><Text style={styles.stepNumText}>4</Text></View>
            <Text style={styles.stepText}>Wait for green screen to allow entry</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  content: { padding: 16, paddingBottom: 40 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  card: { width: '48%', backgroundColor: '#FFF', borderRadius: 16, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2, alignItems: 'center' },
  emoji: { fontSize: 32, marginBottom: 8 },
  title: { fontSize: 16, fontWeight: 'bold', color: '#111827', marginBottom: 8, textAlign: 'center' },
  desc: { fontSize: 12, color: '#6B7280', textAlign: 'center', lineHeight: 18 },
  protocolCard: { backgroundColor: '#FFF', borderRadius: 16, padding: 20, marginTop: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 3 },
  protocolHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  protocolTitle: { fontSize: 18, fontWeight: 'bold', color: '#111827', marginLeft: 8 },
  stepRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  stepNum: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#E0E7FF', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  stepNumText: { color: '#4F46E5', fontSize: 12, fontWeight: 'bold' },
  stepText: { fontSize: 14, color: '#374151', flex: 1 },
});
