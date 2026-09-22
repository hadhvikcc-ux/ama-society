import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ScreenHeader } from '../../components/ui/ScreenHeader';
import {
  APARTMENT_LEGAL_SECTIONS,
  PolicySection,
  PolicyClause,
} from '../../constants/legalContent';

export default function LegalScreen() {
  const router = useRouter();
  const [activeKey, setActiveKey] = useState<'PRIVACY' | 'PAYMENT' | 'TERMS' | 'SECURITY'>('PRIVACY');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedClauseIds, setExpandedClauseIds] = useState<Record<string, boolean>>({
    PRIV_DATA_COLLECTION: true,
    PAY_UPI_STANDARDS: true,
    TOS_ELIGIBILITY: true,
    SEC_PASS_TIMINGS: true,
  });
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [acknowledged, setAcknowledged] = useState(false);

  const currentSection = useMemo(() => {
    return APARTMENT_LEGAL_SECTIONS.find((s) => s.key === activeKey) || APARTMENT_LEGAL_SECTIONS[0];
  }, [activeKey]);

  // Filter clauses by search query
  const filteredClauses = useMemo(() => {
    if (!searchQuery.trim()) return currentSection.clauses;
    const q = searchQuery.toLowerCase();
    return currentSection.clauses.filter((c) => {
      return (
        c.title.toLowerCase().includes(q) ||
        c.summary.toLowerCase().includes(q) ||
        c.details.some((d) => d.toLowerCase().includes(q)) ||
        (c.badge && c.badge.toLowerCase().includes(q)) ||
        (c.keyHighlights && c.keyHighlights.some((h) => h.toLowerCase().includes(q)))
      );
    });
  }, [currentSection, searchQuery]);

  const toggleClause = (id: string) => {
    setExpandedClauseIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleCopySection = async () => {
    const lines: string[] = [
      `*${currentSection.title}*`,
      `${currentSection.tagline}`,
      `Last Updated: ${currentSection.lastUpdated}\n`,
    ];

    currentSection.clauses.forEach((c) => {
      lines.push(`*${c.title}* [${c.badge || 'Policy'}]`);
      lines.push(`${c.summary}`);
      c.details.forEach((d) => lines.push(` • ${d}`));
      lines.push('');
    });

    const fullText = lines.join('\n');

    if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(fullText);
      showToast('Policy summary copied to clipboard!');
    } else {
      showToast('Policy copied to clipboard!');
    }
  };

  return (
    <View style={styles.container}>
      <ScreenHeader title="Policies & Terms of Service" showBack />

      {/* Navigation Category Tabs */}
      <View style={styles.tabsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsScroll}>
          {APARTMENT_LEGAL_SECTIONS.map((sec) => (
            <TouchableOpacity
              key={sec.key}
              style={[styles.tabChip, activeKey === sec.key && styles.tabChipActive]}
              onPress={() => {
                setActiveKey(sec.key);
                setSearchQuery('');
              }}
            >
              <Ionicons
                name={sec.icon as any}
                size={15}
                color={activeKey === sec.key ? '#FFFFFF' : '#475569'}
                style={{ marginRight: 6 }}
              />
              <Text style={[styles.tabChipText, activeKey === sec.key && styles.tabChipTextActive]}>
                {sec.title}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Search Filter */}
      <View style={styles.searchSection}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={16} color="#94A3B8" style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            placeholder={`Search within ${currentSection.shortTitle} (e.g. refund, CCTV, visitor, quiet hours)...`}
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={16} color="#94A3B8" />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Toast Notification */}
      {toastMessage && (
        <View style={styles.toastBanner}>
          <Ionicons name="checkmark-circle" size={16} color="#15803D" style={{ marginRight: 6 }} />
          <Text style={styles.toastText}>{toastMessage}</Text>
        </View>
      )}

      <ScrollView style={styles.contentScroll} showsVerticalScrollIndicator={false}>
        {/* Section Header Card */}
        <View style={styles.sectionHeaderCard}>
          <View style={styles.sectionHeaderTop}>
            <View style={styles.sectionIconBadge}>
              <Ionicons name={currentSection.icon as any} size={22} color="#1E40AF" />
            </View>
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={styles.sectionHeaderTitle}>{currentSection.title}</Text>
              <Text style={styles.sectionHeaderDate}>Last Updated: {currentSection.lastUpdated}</Text>
            </View>
            <TouchableOpacity style={styles.copyActionBtn} onPress={handleCopySection}>
              <Ionicons name="copy-outline" size={14} color="#1E40AF" style={{ marginRight: 4 }} />
              <Text style={styles.copyActionText}>Copy</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.sectionHeaderTagline}>{currentSection.tagline}</Text>
        </View>

        {/* Clauses List */}
        <View style={styles.clausesList}>
          {filteredClauses.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons name="document-text-outline" size={40} color="#94A3B8" />
              <Text style={styles.emptyTitle}>No matching clauses</Text>
              <Text style={styles.emptySub}>No results matched "{searchQuery}". Please try another keyword.</Text>
            </View>
          ) : (
            filteredClauses.map((clause: PolicyClause) => {
              const isExpanded = expandedClauseIds[clause.id];

              return (
                <View key={clause.id} style={styles.clauseCard}>
                  <TouchableOpacity
                    style={styles.clauseHeader}
                    onPress={() => toggleClause(clause.id)}
                    activeOpacity={0.7}
                  >
                    <View style={{ flex: 1 }}>
                      <View style={styles.clauseTitleRow}>
                        <Text style={styles.clauseTitle}>{clause.title}</Text>
                        {clause.badge && (
                          <View style={styles.clauseBadge}>
                            <Text style={styles.clauseBadgeText}>{clause.badge}</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.clauseSummary} numberOfLines={isExpanded ? undefined : 2}>
                        {clause.summary}
                      </Text>
                    </View>
                    <Ionicons
                      name={isExpanded ? 'chevron-up' : 'chevron-down'}
                      size={20}
                      color="#64748B"
                      style={{ marginLeft: 8 }}
                    />
                  </TouchableOpacity>

                  {isExpanded && (
                    <View style={styles.clauseBody}>
                      <View style={styles.divider} />
                      {clause.details.map((detail, dIdx) => (
                        <View key={dIdx} style={styles.detailRow}>
                          <Ionicons name="ellipse" size={6} color="#2563EB" style={{ marginTop: 6, marginRight: 8 }} />
                          <Text style={styles.detailText}>{detail}</Text>
                        </View>
                      ))}

                      {clause.keyHighlights && clause.keyHighlights.length > 0 && (
                        <View style={styles.highlightsBox}>
                          <Text style={styles.highlightsHeader}>Key Policy Takeaways:</Text>
                          {clause.keyHighlights.map((hl, hIdx) => (
                            <View key={hIdx} style={styles.highlightItem}>
                              <Ionicons name="checkmark-circle" size={14} color="#15803D" style={{ marginRight: 6 }} />
                              <Text style={styles.highlightText}>{hl}</Text>
                            </View>
                          ))}
                        </View>
                      )}

                      {clause.legalReference && (
                        <View style={styles.legalRefRow}>
                          <Ionicons name="book-outline" size={13} color="#64748B" style={{ marginRight: 5 }} />
                          <Text style={styles.legalRefText}>Statutory Reference: {clause.legalReference}</Text>
                        </View>
                      )}
                    </View>
                  )}
                </View>
              );
            })
          )}
        </View>

        {/* Resident Acknowledgment Action Box */}
        <View style={styles.ackCard}>
          <Ionicons name="shield-checkmark" size={28} color="#15803D" />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.ackTitle}>Society Legal Compliance</Text>
            <Text style={styles.ackSub}>
              By residing in this complex and using the AMA application, you agree to adhere to these community bye-laws, payment policies, and privacy terms.
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.ackBtn, acknowledged && { backgroundColor: '#15803D' }]}
            onPress={() => {
              setAcknowledged(true);
              showToast('Acknowledged successfully!');
            }}
          >
            <Text style={styles.ackBtnText}>{acknowledged ? 'Agreed ✓' : 'Acknowledge'}</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  tabsContainer: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingVertical: 10,
  },
  tabsScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  tabChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  tabChipActive: {
    backgroundColor: '#1E40AF',
    borderColor: '#1E40AF',
  },
  tabChipText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },
  tabChipTextActive: {
    color: '#FFFFFF',
  },

  searchSection: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#0F172A',
  },

  toastBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  toastText: {
    fontSize: 12,
    color: '#15803D',
    fontWeight: '700',
  },

  contentScroll: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
  },

  sectionHeaderCard: {
    backgroundColor: '#EFF6FF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    marginBottom: 14,
  },
  sectionHeaderTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionIconBadge: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionHeaderTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1E40AF',
  },
  sectionHeaderDate: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  copyActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  copyActionText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E40AF',
  },
  sectionHeaderTagline: {
    fontSize: 12,
    color: '#3B82F6',
    marginTop: 8,
    lineHeight: 18,
  },

  clausesList: {
    gap: 12,
  },
  clauseCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  clauseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  clauseTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 4,
  },
  clauseTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  clauseBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  clauseBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#475569',
  },
  clauseSummary: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 17,
  },
  clauseBody: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  detailText: {
    flex: 1,
    fontSize: 13,
    color: '#334155',
    lineHeight: 19,
  },
  highlightsBox: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: 12,
    padding: 12,
    marginTop: 8,
  },
  highlightsHeader: {
    fontSize: 12,
    fontWeight: '800',
    color: '#15803D',
    marginBottom: 6,
  },
  highlightItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
  },
  highlightText: {
    fontSize: 12,
    color: '#166534',
    fontWeight: '600',
  },
  legalRefRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  legalRefText: {
    fontSize: 11,
    color: '#64748B',
    fontStyle: 'italic',
  },

  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 30,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#334155',
    marginTop: 10,
  },
  emptySub: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 4,
    textAlign: 'center',
  },

  ackCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#86EFAC',
    marginTop: 16,
  },
  ackTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#15803D',
  },
  ackSub: {
    fontSize: 11,
    color: '#475569',
    marginTop: 2,
    lineHeight: 16,
  },
  ackBtn: {
    backgroundColor: '#1E40AF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginLeft: 8,
  },
  ackBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
});
