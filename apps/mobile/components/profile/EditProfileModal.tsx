import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Modal, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../stores/authStore';
import { useVisitorPassStore } from '../../stores/visitorPassStore';
import { useBookingStore } from '../../stores/bookingStore';

interface EditProfileModalProps {
  visible: boolean;
  onClose: () => void;
}

export function EditProfileModal({ visible, onClose }: EditProfileModalProps) {
  const { user, updateUser } = useAuthStore();

  const [name, setName] = useState(user?.name || '');
  const [flatNumber, setFlatNumber] = useState(user?.flatNumber || '');
  const [tower, setTower] = useState(user?.tower || 'Tower B');
  const [phone, setPhone] = useState(user?.phone || '+91 98765 43210');
  const [email, setEmail] = useState(user?.email || 'aditya.sharma@example.com');
  const [emergencyContact, setEmergencyContact] = useState(user?.emergencyContact || '+91 91234 56789');

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setFlatNumber(user.flatNumber || '');
      setTower(user.tower || 'Tower B');
      setPhone(user.phone || '+91 98765 43210');
      setEmail(user.email || 'aditya.sharma@example.com');
      setEmergencyContact(user.emergencyContact || '+91 91234 56789');
    }
  }, [user, visible]);

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert('Validation Error', 'Name cannot be empty.');
      return;
    }
    if (!flatNumber.trim()) {
      Alert.alert('Validation Error', 'Flat number cannot be empty.');
      return;
    }

    const trimmedName = name.trim();
    const trimmedFlat = flatNumber.trim();
    const trimmedTower = tower.trim();
    const trimmedPhone = phone.trim();
    const trimmedEmail = email.trim();
    const trimmedEmergency = emergencyContact.trim();

    updateUser({
      name: trimmedName,
      flatNumber: trimmedFlat,
      tower: trimmedTower,
      phone: trimmedPhone,
      email: trimmedEmail,
      emergencyContact: trimmedEmergency,
    });

    // Dynamically synchronize host details across all visitor passes
    useVisitorPassStore.getState().syncHostDetails({
      residentName: trimmedName,
      flatNumber: trimmedFlat,
      tower: trimmedTower,
      residentPhone: trimmedPhone,
    });

    // Dynamically synchronize resident details across all facility bookings
    useBookingStore.getState().syncResidentDetails({
      residentName: trimmedName,
      flatNumber: trimmedFlat,
    });

    Alert.alert('Profile Updated', 'Your profile details and host passes have been successfully updated!');
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined} 
        style={styles.overlay}
      >
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Edit Profile</Text>
              <Text style={styles.subtitle}>Update your resident & unit information</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.formScroll} showsVerticalScrollIndicator={false}>
            {/* Full Name */}
            <Text style={styles.label}>Full Name *</Text>
            <View style={styles.inputBox}>
              <Ionicons name="person-outline" size={20} color="#6B7280" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Enter your full name"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            {/* Flat Number & Tower */}
            <View style={styles.row}>
              <View style={[styles.col, { marginRight: 10 }]}>
                <Text style={styles.label}>Flat / Unit # *</Text>
                <View style={styles.inputBox}>
                  <Ionicons name="home-outline" size={20} color="#6B7280" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    value={flatNumber}
                    onChangeText={setFlatNumber}
                    placeholder="e.g. B-204"
                    placeholderTextColor="#9CA3AF"
                  />
                </View>
              </View>
              <View style={styles.col}>
                <Text style={styles.label}>Tower / Wing</Text>
                <View style={styles.inputBox}>
                  <Ionicons name="business-outline" size={20} color="#6B7280" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    value={tower}
                    onChangeText={setTower}
                    placeholder="e.g. Tower B"
                    placeholderTextColor="#9CA3AF"
                  />
                </View>
              </View>
            </View>

            {/* Phone Number */}
            <Text style={styles.label}>Phone Number</Text>
            <View style={styles.inputBox}>
              <Ionicons name="call-outline" size={20} color="#6B7280" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                placeholder="+91 98765 43210"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            {/* Email Address */}
            <Text style={styles.label}>Email Address</Text>
            <View style={styles.inputBox}>
              <Ionicons name="mail-outline" size={20} color="#6B7280" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholder="you@example.com"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            {/* Emergency Contact */}
            <Text style={styles.label}>Emergency Contact</Text>
            <View style={styles.inputBox}>
              <Ionicons name="shield-checkmark-outline" size={20} color="#6B7280" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={emergencyContact}
                onChangeText={setEmergencyContact}
                keyboardType="phone-pad"
                placeholder="Emergency Contact #"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <View style={{ height: 20 }} />
          </ScrollView>

          {/* Footer Actions */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
              <Ionicons name="checkmark" size={20} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={styles.saveBtnText}>Save Changes</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  subtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
  },
  formScroll: {
    maxHeight: 450,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
    marginTop: 10,
  },
  row: {
    flexDirection: 'row',
  },
  col: {
    flex: 1,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 48,
    backgroundColor: '#F9FAFB',
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#111827',
  },
  footer: {
    flexDirection: 'row',
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
  },
  cancelBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#4B5563',
  },
  saveBtn: {
    flex: 2,
    height: 48,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1B4FD8',
  },
  saveBtnText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});
