import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  APARTMENT_LEGAL_SECTIONS,
  PolicySection,
  PolicyClause,
} from '../../constants/legalContent';

interface LegalPolicyModalProps {
  visible: boolean;
  onClose: () => void;
  initialSection?: 'PRIVACY' | 'PAYMENT' | 'TERMS' | 'SECURITY';
}

export function LegalPolicyModal({
  visible,
  onClose,
  initialSection = 'PRIVACY',
}: LegalPolicyModalProps) {
  const [activeKey, setActiveKey] = useState<'PRIVACY' | 'PAYMENT' | 'TERMS' | 'SECURITY'>(initialSection);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedClauseIds, setExpandedClauseIds] = useState<Record<string, boolean>>({});
  const [acknowledged, setAcknowledged] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      setActiveKey(initialSection);
      setSearchQuery('');
      // Expand the first clause by default
      const sec = APARTMENT_LEGAL_SECTIONS.find((s) => s.key === initialSection);
      if (sec && sec.clauses[0]) {
        setExpandedClauseIds({ [sec.clauses[0].id]: true });
      }
    }
  }, [visible, initialSection]);

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

  const handleAcknowledge = () => {
    setAcknowledged(true);
    showToast('Thank you! You have acknowledged the society policies.');
    setTimeout(() => {
      onClose();
    }, 1200);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <View style={{ flex: 1 }}>
              <View style={styles.badgeRow}>
                <View style={styles.legalBadge}>
                  <Ionicons name="shield-checkmark" size={13} color="#FFFFFF" />
                  <Text style={styles.legalBadgeText}>Society Compliance</Text>
                </View>
                <Text style={styles.lastUpdatedText}>Updated Sep 2026</Text>
              </View>
              <Text style={styles.modalTitle}>Legal & Guidelines</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color="#64748B" />
            </TouchableOpacity>
          </View>

          {/* Navigation Category Tabs */}
          <View style={styles.tabsRow}>
            {APARTMENT_LEGAL_SECTIONS.map((sec) => (
              <TouchableOpacity
                key={sec.key}
                style={[styles.tabChip, activeKey === sec.key && styles.tabChipActive]}
                onPress={() => {
                  setActiveKey(sec.key);
                  setSearchQuery('');
                  if (sec.clauses[0]) {
                    setExpandedClauseIds({ [sec.clauses[0].id]: true });
                  }
                }}
              >
                <Ionicons
                  name={sec.icon as any}
                  size={14}
                  color={activeKey === sec.key ? '#FFFFFF' : '#475569'}
                  style={{ marginRight: 4 }}
                />
                <Text style={[styles.tabChipText, activeKey === sec.key && styles.tabChipTextActive]}>
                  {sec.shortTitle}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Search Bar */}
          <View style={styles.searchBar}>
            <Ionicons name="search" size={16} color="#94A3B8" style={{ marginRight: 8 }} />
            <TextInput
              style={styles.searchInput}
              placeholder={`Search within ${currentSection.shortTitle} (e.g. refund, CCTV, visitor)...`}
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

          {/* Toast Notification */}
          {toastMessage && (
            <View style={styles.toastBanner}>
              <Ionicons name="checkmark-circle" size={16} color="#15803D" style={{ marginRight: 6 }} />
              <Text style={styles.toastText}>{toastMessage}</Text>
            </View>
          )}

          {/* Section Summary Banner */}
          <View style={styles.sectionBanner}>
            <View style={styles.sectionBannerHeader}>
              <Text style={styles.sectionBannerTitle}>{currentSection.title}</Text>
              <TouchableOpacity style={styles.copyBtn} onPress={handleCopySection}>
                <Ionicons name="copy-outline" size={13} color="#1D4ED8" style={{ marginRight: 4 }} />
                <Text style={styles.copyBtnText}>Copy</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.sectionBannerSub}>{currentSection.tagline}</Text>
          </View>

          {/* Policy Clauses Accordion List */}
          <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {filteredClauses.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="document-text-outline" size={36} color="#94A3B8" />
                <Text style={styles.emptyTitle}>No matching clauses found</Text>
                <Text style={styles.emptySub}>Try searching with different keywords or clear the filter.</Text>
              </View>
            ) : (
              filteredClauses.map((clause: PolicyClause) => {
                const isExpanded = expandedClauseIds[clause.id];

                return (
                  <View key={clause.id} style={styles.clauseCard}>
                    {/* Clause Header / Tap to expand */}
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

                    {/* Expanded Content */}
                    {isExpanded && (
                      <View style={styles.clauseBody}>
                        <View style={styles.divider} />
                        {clause.details.map((detail, dIdx) => (
                          <View key={dIdx} style={styles.detailRow}>
                            <Ionicons name="ellipse" size={6} color="#3B82F6" style={{ marginTop: 6, marginRight: 8 }} />
                            <Text style={styles.detailText}>{detail}</Text>
                          </View>
                        ))}

                        {/* Key Highlights Box */}
                        {clause.keyHighlights && clause.keyHighlights.length > 0 && (
                          <View style={styles.highlightsBox}>
                            <Text style={styles.highlightsHeader}>Key Takeaways:</Text>
                            {clause.keyHighlights.map((hl, hIdx) => (
                              <View key={hIdx} style={styles.highlightItem}>
                                <Ionicons name="checkmark-circle" size={14} color="#15803D" style={{ marginRight: 6 }} />
                                <Text style={styles.highlightText}>{hl}</Text>
                              </View>
                            ))}
                          </View>
                        )}

                        {/* Legal Reference */}
                        {clause.legalReference && (
                          <View style={styles.legalRefRow}>
                            <Ionicons name="book-outline" size={13} color="#475569" style={{ marginRight: 5 }} />
                            <Text style={styles.legalRefText}>Reference: {clause.legalReference}</Text>
                          </View>
                        )}
                      </View>
                    )}
                  </View>
                );
              })
            )}

            <View style={{ height: 20 }} />
          </ScrollView>

          {/* Footer Actions */}
          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.closeActionBtn} onPress={onClose}>
              <Text style={styles.closeActionText}>Close</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.agreeBtn, acknowledged && styles.agreeBtnDone]}
              onPress={handleAcknowledge}
            >
              <Ionicons
                name={acknowledged ? 'checkmark-circle' : 'shield-checkmark-outline'}
                size={16}
                color="#FFFFFF"
                style={{ marginRight: 6 }}
              />
              <Text style={styles.agreeBtnText}>
                {acknowledged ? 'Acknowledged ✓' : 'I Acknowledge Policies'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    width: '100%',
    maxWidth: 580,
    maxHeight: '94%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  legalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E40AF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 4,
  },
  legalBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  lastUpdatedText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0F172A',
  },
  closeBtn: {
    padding: 6,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
  },

  // TABS
  tabsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    flexWrap: 'wrap',
  },
  tabChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  tabChipActive: {
    backgroundColor: '#1E40AF',
    borderColor: '#1E40AF',
  },
  tabChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  tabChipTextActive: {
    color: '#FFFFFF',
  },

  // SEARCH BAR
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    marginHorizontal: 16,
    marginTop: 10,
    paddingHorizontal: 12,
    height: 40,
    borderRadius: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#0F172A',
  },

  // TOAST BANNER
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

  // SECTION BANNER
  sectionBanner: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 12,
    marginHorizontal: 16,
    marginTop: 10,
    padding: 12,
  },
  sectionBannerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionBannerTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1E40AF',
  },
  sectionBannerSub: {
    fontSize: 11,
    color: '#3B82F6',
    marginTop: 2,
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  copyBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1D4ED8',
  },

  // SCROLL CONTENT & ACCORDION
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    flex: 1,
  },
  clauseCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 10,
    overflow: 'hidden',
  },
  clauseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
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
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
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
    paddingHorizontal: 14,
    paddingBottom: 14,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginBottom: 10,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  detailText: {
    flex: 1,
    fontSize: 12,
    color: '#334155',
    lineHeight: 18,
  },
  highlightsBox: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: 10,
    padding: 10,
    marginTop: 8,
  },
  highlightsHeader: {
    fontSize: 11,
    fontWeight: '800',
    color: '#15803D',
    marginBottom: 4,
  },
  highlightItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  highlightText: {
    fontSize: 11,
    color: '#166534',
    fontWeight: '600',
  },
  legalRefRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  legalRefText: {
    fontSize: 11,
    color: '#64748B',
    fontStyle: 'italic',
  },

  // EMPTY
  emptyState: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#475569',
    marginTop: 8,
  },
  emptySub: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
    textAlign: 'center',
  },

  // FOOTER
  modalFooter: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F8FAFC',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    gap: 10,
  },
  closeActionBtn: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  closeActionText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },
  agreeBtn: {
    flex: 2,
    flexDirection: 'row',
    height: 44,
    borderRadius: 10,
    backgroundColor: '#1E40AF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  agreeBtnDone: {
    backgroundColor: '#15803D',
  },
  agreeBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
