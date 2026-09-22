import React from 'react';
import { View, Text, StyleSheet, Pressable, Linking } from 'react-native';
import { format } from 'date-fns';
import { useRouter } from 'expo-router';

export interface Invoice {
  id: string;
  period: string;
  amount: number;
  status: 'PAID' | 'ISSUED' | 'OVERDUE';
  dueDate: string;
  pdfUrl?: string;
}

interface InvoiceCardProps {
  invoice: Invoice;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'PAID': return '#10B981'; // Green
    case 'ISSUED': return '#3B82F6'; // Blue
    case 'OVERDUE': return '#EF4444'; // Red
    default: return '#6B7280'; // Gray
  }
};

export const InvoiceCard: React.FC<InvoiceCardProps> = ({ invoice }) => {
  const router = useRouter();

  const handleDownload = () => {
    if (invoice.pdfUrl) {
      Linking.openURL(invoice.pdfUrl);
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.period}>{invoice.period}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(invoice.status) + '20' }]}>
          <Text style={[styles.statusText, { color: getStatusColor(invoice.status) }]}>
            {invoice.status}
          </Text>
        </View>
      </View>
      
      <View style={styles.amountContainer}>
        <Text style={styles.currencySymbol}>₹</Text>
        <Text style={styles.amount}>{invoice.amount.toLocaleString('en-IN')}</Text>
      </View>
      
      <View style={styles.footer}>
        <View>
          <Text style={styles.dueLabel}>Due Date</Text>
          <Text style={[
            styles.dueDate, 
            invoice.status === 'OVERDUE' ? { color: '#EF4444', fontWeight: 'bold' } : {}
          ]}>
            {format(new Date(invoice.dueDate), 'MMM dd, yyyy')}
          </Text>
        </View>
        
        {invoice.status === 'PAID' ? (
          <Pressable style={styles.downloadButton} onPress={handleDownload}>
            <Text style={styles.downloadButtonText}>Download Receipt</Text>
          </Pressable>
        ) : (
          <Pressable 
            style={styles.payButton} 
            onPress={() => router.push(`/resident/billing/pay?id=${invoice.id}`)}
          >
            <Text style={styles.payButtonText}>Pay Now</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  period: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 20,
  },
  currencySymbol: {
    fontSize: 24,
    fontWeight: '600',
    color: '#111827',
    marginRight: 4,
  },
  amount: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#111827',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  dueLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  dueDate: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  payButton: {
    backgroundColor: '#1B4FD8',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
  },
  payButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  downloadButton: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  downloadButtonText: {
    color: '#4B5563',
    fontWeight: '600',
    fontSize: 14,
  },
});
