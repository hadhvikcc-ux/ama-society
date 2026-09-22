import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { usePollStore, PollCategory } from '../../stores/pollStore';

interface CreatePollModalProps {
  visible: boolean;
  onClose: () => void;
}

const CATEGORIES: PollCategory[] = ['General', 'Budget', 'AGM', 'Amenities', 'Festival', 'Guidelines'];

export const CreatePollModal: React.FC<CreatePollModalProps> = ({ visible, onClose }) => {
  const { createPoll } = usePollStore();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<PollCategory>('General');
  const [option1, setOption1] = useState('');
  const [option2, setOption2] = useState('');
  const [option3, setOption3] = useState('');
  const [expiryDays, setExpiryDays] = useState('7');

  const triggerHaptic = (style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light) => {
    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(style).catch(() => {});
      } catch (e) {}
    }
  };

  const handleCreate = () => {
    if (!title.trim()) {
      Alert.alert('Missing Title', 'Please enter a poll question or title.');
      return;
    }
    if (!option1.trim() || !option2.trim()) {
      Alert.alert('Options Required', 'Please provide at least two voting options.');
      return;
    }

    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);

    const options = [
      { text: option1.trim(), emoji: '✨' },
      { text: option2.trim(), emoji: '🪔' },
    ];
    if (option3.trim()) {
      options.push({ text: option3.trim(), emoji: '🌿' });
    }

    const poll = createPoll({
      title: title.trim(),
      description: description.trim() || 'Society-wide democratic decision.',
      category,
      options,
      expiryDays: parseInt(expiryDays, 10) || 7,
      createdBy: 'President Vikram Malhotra',
    });

    Alert.alert('Poll Published', `Poll "${poll.title}" is now open for resident voting!`);

    // Reset
    setTitle('');
    setDescription('');
    setOption1('');
    setOption2('');
    setOption3('');
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <Text style={{ fontSize: 24 }}>🗳️</Text>
              <Text style={styles.headerTitle}>Create Society Democratic Poll</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color="#475569" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={styles.inputLabel}>Poll Title / Question *</Text>
            <TextInput
              style={styles.textInput}
              value={title}
              onChangeText={setTitle}
              placeholder="e.g. Install Solar Panels on Tower B & C Rooftop?"
              placeholderTextColor="#94A3B8"
            />

            <Text style={styles.inputLabel}>Description & Background Details</Text>
            <TextInput
              style={[styles.textInput, { height: 60 }]}
              value={description}
              onChangeText={setDescription}
              placeholder="Provide context on budget, timeline, and impact..."
              placeholderTextColor="#94A3B8"
              multiline
            />

            <Text style={styles.inputLabel}>Category</Text>
            <View style={styles.categoryGrid}>
              {CATEGORIES.map((c) => {
                const selected = category === c;
                return (
                  <TouchableOpacity
                    key={c}
                    style={[
                      styles.categoryChip,
                      selected && { backgroundColor: '#881337', borderColor: '#881337' },
                    ]}
                    onPress={() => {
                      triggerHaptic();
                      setCategory(c);
                    }}
                  >
                    <Text style={[styles.categoryChipText, selected && { color: '#FFFFFF' }]}>
                      {c}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.inputLabel}>Voting Option 1 *</Text>
            <TextInput
              style={styles.textInput}
              value={option1}
              onChangeText={setOption1}
              placeholder="e.g. Option A: Approve 100kW Solar Installation"
              placeholderTextColor="#94A3B8"
            />

            <Text style={styles.inputLabel}>Voting Option 2 *</Text>
            <TextInput
              style={styles.textInput}
              value={option2}
              onChangeText={setOption2}
              placeholder="e.g. Option B: Defer to Annual General Meeting"
              placeholderTextColor="#94A3B8"
            />

            <Text style={styles.inputLabel}>Voting Option 3 (Optional)</Text>
            <TextInput
              style={styles.textInput}
              value={option3}
              onChangeText={setOption3}
              placeholder="e.g. Option C: Conduct Feasibility Study First"
              placeholderTextColor="#94A3B8"
            />

            <Text style={styles.inputLabel}>Voting Duration (Days)</Text>
            <TextInput
              style={styles.textInput}
              value={expiryDays}
              onChangeText={setExpiryDays}
              keyboardType="numeric"
              placeholder="7"
              placeholderTextColor="#94A3B8"
            />

            <TouchableOpacity style={styles.submitBtn} onPress={handleCreate}>
              <Ionicons name="megaphone-outline" size={18} color="#FFFFFF" />
              <Text style={styles.submitBtnText}>Publish Poll to All Residents</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    width: '100%',
    maxWidth: 500,
    maxHeight: '90%',
    borderRadius: 24,
    padding: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  closeBtn: {
    padding: 4,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
    marginTop: 12,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  textInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0F172A',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  categoryChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#881337',
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 22,
    marginBottom: 10,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
});
