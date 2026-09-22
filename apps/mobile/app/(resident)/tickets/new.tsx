import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator, Image } from 'react-native';
import { ScreenHeader } from '../../../components/ui/ScreenHeader';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTicketStore } from '../../../stores/ticketStore';
import { useAuthStore } from '../../../stores/authStore';
import { AttachmentUploader } from '../../../components/ui/AttachmentUploader';
import { AppAttachment } from '../../../utils/filePicker';

const categories = [
  { id: 'Plumbing', icon: 'water', label: 'Plumbing' },
  { id: 'Electrical', icon: 'flash', label: 'Electrical' },
  { id: 'Carpentry', icon: 'hammer', label: 'Carpentry' },
  { id: 'Pest Control', icon: 'bug', label: 'Pest Control' },
  { id: 'Civil Work', icon: 'construct', label: 'Civil Work' },
  { id: 'Other', icon: 'list', label: 'Other' },
];

const priorities = ['Low', 'Medium', 'High', 'Urgent'];

export default function NewTicketScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { addTicket } = useTicketStore();
  const [category, setCategory] = useState('Plumbing');
  const [priority, setPriority] = useState('Medium');
  const [desc, setDesc] = useState('');
  const [location, setLocation] = useState('');
  const [attachments, setAttachments] = useState<AppAttachment[]>([]);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  // Holds the submitted ticket details to display on screen
  const [submittedTicket, setSubmittedTicket] = useState<{
    id: string;
    category: string;
    priority: string;
    location: string;
    desc: string;
    time: string;
    attachments?: AppAttachment[];
  } | null>(null);

  const handleSubmit = () => {
    if (desc.trim().length < 10) {
      Alert.alert('Incomplete Details', 'Please provide a description of at least 10 characters.');
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      const newTicketId = addTicket({
        category,
        priority: priority.toUpperCase() as any,
        status: 'OPEN',
        description: desc.trim(),
        location: location.trim() || 'General Unit Area',
        flat: user?.flatNumber || 'B-204',
        raisedBy: user?.name || 'Resident',
        attachments,
      });

      // Display the ticket number and confirmation directly on screen
      setSubmittedTicket({
        id: newTicketId,
        category,
        priority,
        location: location.trim() || 'General Unit Area',
        desc: desc.trim(),
        time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
        attachments,
      });
    }, 800);
  };

  const handleReset = () => {
    setSubmittedTicket(null);
    setDesc('');
    setLocation('');
    setAttachments([]);
    setCategory('Plumbing');
    setPriority('Medium');
    setCopied(false);
  };

  // ON-SCREEN TICKET CONFIRMATION VIEW
  if (submittedTicket) {
    return (
      <View style={styles.container}>
        <ScreenHeader title="Ticket Confirmation" />
        <ScrollView style={styles.content} contentContainerStyle={styles.successScroll}>
          
          {/* Success Checkmark & Header */}
          <View style={styles.successHeader}>
            <View style={styles.successIconBox}>
              <Ionicons name="checkmark-circle" size={64} color="#16A34A" />
            </View>
            <Text style={styles.successTitle}>Ticket Raised Successfully!</Text>
            <Text style={styles.successSubtitle}>
              Your maintenance request has been registered in the society system.
            </Text>
          </View>

          {/* Ticket Number Highlight Card */}
          <View style={styles.ticketNumberCard}>
            <Text style={styles.ticketNumberLabel}>TICKET NUMBER</Text>
            <Text style={styles.ticketNumberValue}>{submittedTicket.id}</Text>
            <TouchableOpacity 
              style={styles.copyButton}
              onPress={() => setCopied(true)}
            >
              <Ionicons name={copied ? "checkmark" : "copy-outline"} size={16} color="#1B4FD8" />
              <Text style={styles.copyButtonText}>{copied ? "Copied to clipboard" : "Copy Ticket #"}</Text>
            </TouchableOpacity>
          </View>

          {/* Ticket Summary Details Card */}
          <View style={styles.summaryCard}>
            <Text style={styles.summaryHeader}>Request Summary</Text>
            
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Category</Text>
              <View style={styles.summaryValueRow}>
                <Ionicons 
                  name={(categories.find(c => c.id === submittedTicket.category)?.icon as any) || 'construct'} 
                  size={16} 
                  color="#4B5563" 
                />
                <Text style={styles.summaryValue}>{submittedTicket.category}</Text>
              </View>
            </View>

            <View style={styles.summaryDivider} />

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Priority</Text>
              <Text style={[
                styles.summaryValue, 
                submittedTicket.priority === 'Urgent' && { color: '#DC2626', fontWeight: 'bold' }
              ]}>
                {submittedTicket.priority}
              </Text>
            </View>

            <View style={styles.summaryDivider} />

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Location</Text>
              <Text style={styles.summaryValue}>{submittedTicket.location}</Text>
            </View>

            <View style={styles.summaryDivider} />

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Status</Text>
              <StatusBadge status="OPEN" size="sm" />
            </View>

            <View style={styles.summaryDivider} />

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Logged At</Text>
              <Text style={styles.summaryValue}>Today, {submittedTicket.time}</Text>
            </View>

            {submittedTicket.attachments && submittedTicket.attachments.length > 0 && (
              <>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Attachments</Text>
                  <Text style={[styles.summaryValue, { color: '#1B4FD8' }]}>
                    {submittedTicket.attachments.length} file(s) attached
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
                  {submittedTicket.attachments.map((att) => (
                    <View
                      key={att.id}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        backgroundColor: '#FFFFFF',
                        borderWidth: 1,
                        borderColor: '#DBEAFE',
                        borderRadius: 8,
                        padding: 6,
                        gap: 6,
                        maxWidth: '100%',
                      }}
                    >
                      {att.type === 'IMAGE' && att.uri ? (
                        <Image
                          source={{ uri: att.uri }}
                          style={{ width: 28, height: 28, borderRadius: 4 }}
                          resizeMode="cover"
                        />
                      ) : (
                        <Ionicons
                          name={
                            att.type === 'IMAGE'
                              ? 'image-outline'
                              : att.type === 'VIDEO'
                              ? 'videocam-outline'
                              : att.type === 'EXCEL'
                              ? 'grid-outline'
                              : 'document-text-outline'
                          }
                          size={16}
                          color="#1B4FD8"
                        />
                      )}
                      <Text style={{ fontSize: 11, color: '#1E40AF', fontWeight: '500', maxWidth: 180 }} numberOfLines={1}>
                        {att.name}
                      </Text>
                      {att.type === 'IMAGE' && (
                        <View style={{ backgroundColor: '#DBEAFE', borderRadius: 3, paddingHorizontal: 4, paddingVertical: 1 }}>
                          <Text style={{ fontSize: 9, fontWeight: '700', color: '#1D4ED8' }}>HD</Text>
                        </View>
                      )}
                    </View>
                  ))}
                </View>
              </>
            )}
          </View>

          {/* Info Notice Box */}
          <View style={styles.noticeBox}>
            <Ionicons name="information-circle" size={20} color="#1E40AF" style={{ marginRight: 8 }} />
            <Text style={styles.noticeText}>
              A maintenance supervisor has been notified. You will receive updates as the ticket progresses from Assignment to Completion.
            </Text>
          </View>

          {/* Navigation Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={styles.primaryActionBtn} 
              onPress={() => router.replace(`/(resident)/tickets/${submittedTicket.id}` as any)}
            >
              <Text style={styles.primaryActionBtnText}>View Ticket Details</Text>
              <Ionicons name="arrow-forward" size={18} color="#FFFFFF" style={{ marginLeft: 6 }} />
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.secondaryActionBtn} 
              onPress={() => router.replace('/(resident)/tickets')}
            >
              <Text style={styles.secondaryActionBtnText}>View All Tickets</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.textActionBtn} 
              onPress={handleReset}
            >
              <Text style={styles.textActionBtnText}>+ Raise Another Ticket</Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </View>
    );
  }

  // TICKET CREATION FORM VIEW
  return (
    <View style={styles.container}>
      <ScreenHeader title="Raise Ticket" showBack />
      <ScrollView style={styles.content}>
        
        <Text style={styles.sectionTitle}>Category</Text>
        <View style={styles.grid}>
          {categories.map(cat => (
            <TouchableOpacity 
              key={cat.id} 
              style={[styles.catCard, category === cat.id && styles.catCardActive]} 
              onPress={() => setCategory(cat.id)}
            >
              <Ionicons name={cat.icon as any} size={24} color={category === cat.id ? '#1B4FD8' : '#6B7280'} />
              <Text style={[styles.catLabel, category === cat.id && styles.catLabelActive]}>{cat.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Priority</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.priorityScroll}>
          {priorities.map(p => (
            <TouchableOpacity 
              key={p} 
              style={[styles.priorityPill, priority === p && styles.priorityPillActive]} 
              onPress={() => setPriority(p)}
            >
              <Text style={[styles.priorityText, priority === p && styles.priorityTextActive]}>{p}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text style={styles.sectionTitle}>Location in Flat</Text>
        <TextInput 
          style={styles.input} 
          placeholder="e.g. Master Bedroom Washroom" 
          value={location} 
          onChangeText={setLocation} 
        />

        <Text style={styles.sectionTitle}>Description</Text>
        <TextInput 
          style={styles.textArea} 
          placeholder="Describe the issue in detail..." 
          multiline 
          numberOfLines={4} 
          textAlignVertical="top"
          value={desc} 
          onChangeText={setDesc} 
        />
        <Text style={styles.charCount}>{desc.length}/100 chars min</Text>

        <AttachmentUploader
          attachments={attachments}
          onChange={setAttachments}
          title="Attachments & Evidence"
          subtitle="Upload pictures, inspection videos, Excel BOQ sheets, or invoice documents"
        />

      </ScrollView>
      <View style={styles.footer}>
        <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={loading}>
          {loading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.submitBtnText}>Submit Ticket</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  content: { padding: 20 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#111827', marginBottom: 12, marginTop: 8 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  catCard: { width: '31%', backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, padding: 16, alignItems: 'center', marginBottom: 12 },
  catCardActive: { backgroundColor: '#EFF6FF', borderColor: '#1B4FD8' },
  catLabel: { fontSize: 12, fontWeight: '500', color: '#6B7280', marginTop: 8, textAlign: 'center' },
  catLabelActive: { color: '#1B4FD8', fontWeight: 'bold' },
  priorityScroll: { marginBottom: 16 },
  priorityPill: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, backgroundColor: '#F3F4F6', marginRight: 12, borderWidth: 1, borderColor: '#E5E7EB' },
  priorityPillActive: { backgroundColor: '#1B4FD8', borderColor: '#1B4FD8' },
  priorityText: { fontSize: 14, fontWeight: '500', color: '#4B5563' },
  priorityTextActive: { color: '#FFFFFF', fontWeight: 'bold' },
  input: { borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 12, paddingHorizontal: 16, height: 50, fontSize: 16, marginBottom: 16 },
  textArea: { borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 12, padding: 16, fontSize: 16, height: 120 },
  charCount: { fontSize: 12, color: '#6B7280', textAlign: 'right', marginTop: 4, marginBottom: 16 },
  photoRow: { flexDirection: 'row', gap: 12, marginBottom: 40 },
  photoBox: { width: 80, height: 80, borderRadius: 12, borderWidth: 1, borderStyle: 'dashed', borderColor: '#9CA3AF', justifyContent: 'center', alignItems: 'center', backgroundColor: '#F9FAFB' },
  photoBoxPlaceholder: { width: 80, height: 80, borderRadius: 12, backgroundColor: '#F3F4F6' },
  footer: { padding: 20, borderTopWidth: 1, borderTopColor: '#E5E7EB' },
  submitBtn: { backgroundColor: '#1B4FD8', borderRadius: 12, height: 54, justifyContent: 'center', alignItems: 'center' },
  submitBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },

  // Success Screen Styles
  successScroll: { paddingBottom: 40 },
  successHeader: { alignItems: 'center', marginTop: 16, marginBottom: 24 },
  successIconBox: { marginBottom: 12 },
  successTitle: { fontSize: 22, fontWeight: 'bold', color: '#111827', textAlign: 'center', marginBottom: 6 },
  successSubtitle: { fontSize: 14, color: '#6B7280', textAlign: 'center', paddingHorizontal: 20 },
  
  ticketNumberCard: {
    backgroundColor: '#EFF6FF',
    borderWidth: 2,
    borderColor: '#93C5FD',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#1B4FD8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },
  ticketNumberLabel: { fontSize: 13, fontWeight: '700', color: '#1E40AF', letterSpacing: 1.5, marginBottom: 8 },
  ticketNumberValue: { fontSize: 34, fontWeight: '900', color: '#1B4FD8', letterSpacing: 2, marginBottom: 12 },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    gap: 6,
  },
  copyButtonText: { fontSize: 12, fontWeight: '600', color: '#1B4FD8' },

  summaryCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 18,
    marginBottom: 20,
  },
  summaryHeader: { fontSize: 15, fontWeight: 'bold', color: '#374151', marginBottom: 14 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4 },
  summaryLabel: { fontSize: 14, color: '#6B7280' },
  summaryValue: { fontSize: 14, fontWeight: '600', color: '#111827' },
  summaryValueRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  summaryDivider: { height: 1, backgroundColor: '#E5E7EB', marginVertical: 8 },

  noticeBox: {
    flexDirection: 'row',
    backgroundColor: '#EFF6FF',
    padding: 14,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#1B4FD8',
    marginBottom: 28,
  },
  noticeText: { flex: 1, fontSize: 13, color: '#1E3A8A', lineHeight: 18 },

  actionButtons: { gap: 12 },
  primaryActionBtn: {
    flexDirection: 'row',
    backgroundColor: '#1B4FD8',
    borderRadius: 12,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryActionBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
  secondaryActionBtn: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  secondaryActionBtnText: { color: '#374151', fontSize: 15, fontWeight: '600' },
  textActionBtn: { paddingVertical: 10, alignItems: 'center' },
  textActionBtnText: { color: '#1B4FD8', fontSize: 14, fontWeight: '600' },
});
