import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Dimensions,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTestBotStore, TestSuite, TestScenario } from '../../stores/testBotStore';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export interface TestBotViewProps {
  isModal?: boolean;
  onClose?: () => void;
}

export function TestBotView({ isModal = false, onClose }: TestBotViewProps) {
  const {
    suites,
    isRunning,
    currentActionText,
    stats,
    logs,
    activeTab,
    setActiveTab,
    filterRole,
    setFilterRole,
    runAllTests,
    runSuite,
    runScenario,
    resetAll,
    setModalVisible,
  } = useTestBotStore();

  const handleClose = onClose || (() => setModalVisible(false));
  const [expandedSuiteId, setExpandedSuiteId] = useState<string | null>('suite-auth');

  const filteredSuites = suites.map((suite) => {
    if (filterRole === 'all') return suite;
    const filteredScenarios = suite.scenarios.filter((sc) => {
      if (filterRole === 'resident') return sc.role === 'Resident' || sc.role === 'All';
      if (filterRole === 'guard') return sc.role === 'Guard' || sc.role === 'All';
      if (filterRole === 'admin') return sc.role === 'President' || sc.role === 'All';
      if (filterRole === 'intercom') return sc.suiteId.includes('call') || sc.suiteId.includes('chat');
      if (filterRole === 'bazaar') return sc.suiteId.includes('baz');
      return true;
    });
    return { ...suite, scenarios: filteredScenarios };
  }).filter((suite) => suite.scenarios.length > 0);

  return (
    <View style={[styles.container, !isModal && styles.standaloneContainer]}>
      {/* ================= HEADER HUD ================= */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.botIconCircle}>
            <Text style={{ fontSize: 24 }}>🤖</Text>
          </View>
          <View style={{ marginLeft: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={styles.headerTitle}>AMA E2E Test Bot</Text>
              <View style={styles.livePulsePill}>
                <View style={[styles.pulseDot, isRunning ? { backgroundColor: '#3B82F6' } : { backgroundColor: '#10B981' }]} />
                <Text style={styles.pulseText}>{isRunning ? 'TESTING IN PROGRESS' : 'READY'}</Text>
              </View>
            </View>
            <Text style={styles.headerSubtitle}>
              Automated End-to-End Verification Engine • 12 Suites (40+ Scenarios)
            </Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={handleClose}
          style={styles.closeBtn}
          accessibilityLabel={isModal ? "Close Test Bot" : "Back to Application"}
        >
          {isModal ? (
            <Ionicons name="close" size={22} color="#94A3B8" />
          ) : (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 4 }}>
              <Ionicons name="arrow-back" size={18} color="#475569" />
              <Text style={{ fontSize: 13, fontWeight: '700', color: '#475569' }}>Back</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

          {/* ================= LIVE ACTION BANNER (IF RUNNING) ================= */}
          {isRunning && (
            <View style={styles.runningBanner}>
              <ActivityIndicator size="small" color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={styles.runningText} numberOfLines={1}>
                {currentActionText || 'Executing scenario assertions...'}
              </Text>
            </View>
          )}

          {/* ================= STATS OVERVIEW DOCK ================= */}
          <View style={styles.statsBar}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{stats.total}</Text>
              <Text style={styles.statLabel}>Total Tests</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: '#10B981' }]}>{stats.passed}</Text>
              <Text style={styles.statLabel}>Passed</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: stats.failed > 0 ? '#EF4444' : '#94A3B8' }]}>
                {stats.failed}
              </Text>
              <Text style={styles.statLabel}>Failed</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: '#6366F1' }]}>
                {Math.round((stats.durationMs || 0) / 100) / 10}s
              </Text>
              <Text style={styles.statLabel}>Duration</Text>
            </View>
          </View>

          {/* ================= PRIMARY CONTROLS & TABS ================= */}
          <View style={styles.controlsRow}>
            <TouchableOpacity
              style={[styles.runAllBtn, isRunning && styles.runAllBtnDisabled]}
              onPress={runAllTests}
              disabled={isRunning}
              activeOpacity={0.8}
            >
              <Ionicons name={isRunning ? 'hourglass' : 'play'} size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={styles.runAllBtnText}>
                {isRunning ? 'Running All Scenarios...' : '▶ Run All Tests End-to-End'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.resetBtn}
              onPress={resetAll}
              disabled={isRunning}
              activeOpacity={0.8}
            >
              <Ionicons name="refresh" size={16} color="#64748B" style={{ marginRight: 4 }} />
              <Text style={styles.resetBtnText}>Reset</Text>
            </TouchableOpacity>
          </View>

          {/* TAB SELECTOR */}
          <View style={styles.tabBar}>
            <TouchableOpacity
              style={[styles.tabItem, activeTab === 'suites' && styles.tabItemActive]}
              onPress={() => setActiveTab('suites')}
            >
              <Ionicons
                name="list-outline"
                size={16}
                color={activeTab === 'suites' ? '#4F46E5' : '#64748B'}
                style={{ marginRight: 6 }}
              />
              <Text style={[styles.tabText, activeTab === 'suites' && styles.tabTextActive]}>
                Test Suites ({filteredSuites.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabItem, activeTab === 'diagram' && styles.tabItemActive]}
              onPress={() => setActiveTab('diagram')}
            >
              <Ionicons
                name="git-network-outline"
                size={16}
                color={activeTab === 'diagram' ? '#4F46E5' : '#64748B'}
                style={{ marginRight: 6 }}
              />
              <Text style={[styles.tabText, activeTab === 'diagram' && styles.tabTextActive]}>
                Workflow Connections Map
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabItem, activeTab === 'logs' && styles.tabItemActive]}
              onPress={() => setActiveTab('logs')}
            >
              <Ionicons
                name="terminal-outline"
                size={16}
                color={activeTab === 'logs' ? '#4F46E5' : '#64748B'}
                style={{ marginRight: 6 }}
              />
              <Text style={[styles.tabText, activeTab === 'logs' && styles.tabTextActive]}>
                Live Logs ({logs.length})
              </Text>
            </TouchableOpacity>
          </View>

          {/* ================= TAB 1: SUITES & SCENARIOS ================= */}
          {activeTab === 'suites' && (
            <View style={{ flex: 1 }}>
              {/* Role filter pills */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.filterScrollView}
                contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
              >
                {(['all', 'resident', 'guard', 'admin', 'intercom', 'bazaar'] as const).map((r) => (
                  <TouchableOpacity
                    key={r}
                    style={[styles.filterPill, filterRole === r && styles.filterPillActive]}
                    onPress={() => setFilterRole(r)}
                  >
                    <Text style={[styles.filterPillText, filterRole === r && styles.filterPillTextActive]}>
                      {r === 'all' ? 'All Roles (40+)' : r.toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <ScrollView style={styles.suitesList} contentContainerStyle={{ padding: 16, gap: 12 }}>
                {filteredSuites.map((suite) => {
                  const isExpanded = expandedSuiteId === suite.id;
                  const passedCount = suite.scenarios.filter((s) => s.status === 'passed').length;
                  const failedCount = suite.scenarios.filter((s) => s.status === 'failed').length;

                  return (
                    <View key={suite.id} style={styles.suiteCard}>
                      {/* Suite Header */}
                      <TouchableOpacity
                        style={styles.suiteCardHeader}
                        onPress={() => setExpandedSuiteId(isExpanded ? null : suite.id)}
                        activeOpacity={0.8}
                      >
                        <View style={{ flex: 1 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                            <Text style={styles.suiteTitle}>{suite.name}</Text>
                            {passedCount === suite.scenarios.length && passedCount > 0 && (
                              <View style={styles.suitePassBadge}>
                                <Text style={styles.suitePassBadgeText}>100% PASSED</Text>
                              </View>
                            )}
                            {failedCount > 0 && (
                              <View style={styles.suiteFailBadge}>
                                <Text style={styles.suiteFailBadgeText}>{failedCount} FAILED</Text>
                              </View>
                            )}
                          </View>
                          <Text style={styles.suiteDesc}>{suite.description}</Text>
                        </View>

                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                          <TouchableOpacity
                            style={styles.runSuiteBtn}
                            onPress={() => runSuite(suite.id)}
                            disabled={isRunning}
                          >
                            <Ionicons name="play" size={14} color="#4F46E5" />
                            <Text style={styles.runSuiteBtnText}>Run Suite</Text>
                          </TouchableOpacity>

                          <Ionicons
                            name={isExpanded ? 'chevron-up' : 'chevron-down'}
                            size={18}
                            color="#94A3B8"
                          />
                        </View>
                      </TouchableOpacity>

                      {/* Scenarios within Suite */}
                      {isExpanded && (
                        <View style={styles.scenariosContainer}>
                          {suite.scenarios.map((sc) => (
                            <View key={sc.id} style={styles.scenarioCard}>
                              <View style={styles.scenarioHeaderRow}>
                                <View style={{ flex: 1 }}>
                                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                    <View
                                      style={[
                                        styles.statusDot,
                                        sc.status === 'passed'
                                          ? { backgroundColor: '#10B981' }
                                          : sc.status === 'failed'
                                          ? { backgroundColor: '#EF4444' }
                                          : sc.status === 'running'
                                          ? { backgroundColor: '#3B82F6' }
                                          : { backgroundColor: '#94A3B8' },
                                      ]}
                                    />
                                    <Text style={styles.scenarioTitle}>{sc.title}</Text>
                                    <View style={styles.roleTag}>
                                      <Text style={styles.roleTagText}>{sc.role}</Text>
                                    </View>
                                  </View>
                                  <Text style={styles.scenarioDesc}>{sc.description}</Text>
                                </View>

                                <TouchableOpacity
                                  style={styles.runSingleBtn}
                                  onPress={() => runScenario(sc.id)}
                                  disabled={isRunning}
                                >
                                  {sc.status === 'running' ? (
                                    <ActivityIndicator size="small" color="#4F46E5" />
                                  ) : (
                                    <Ionicons name="play" size={13} color="#4F46E5" />
                                  )}
                                </TouchableOpacity>
                              </View>

                              {/* Target Screen & Buttons Tested */}
                              <View style={styles.buttonsTestedBox}>
                                <Text style={styles.buttonsTestedLabel}>Buttons & Actions Tested:</Text>
                                <View style={styles.buttonsChipsWrap}>
                                  {sc.buttons.map((btn, bIdx) => (
                                    <View key={bIdx} style={styles.buttonChip}>
                                      <Ionicons name="radio-button-on" size={10} color="#6366F1" style={{ marginRight: 4 }} />
                                      <Text style={styles.buttonChipText}>{btn}</Text>
                                    </View>
                                  ))}
                                </View>
                              </View>

                              {/* Assertions Result */}
                              {sc.assertions.length > 0 && (
                                <View style={styles.assertionsList}>
                                  {sc.assertions.map((a, aIdx) => (
                                    <View key={aIdx} style={styles.assertionItem}>
                                      <Ionicons
                                        name={a.passed ? 'checkmark-circle' : 'close-circle'}
                                        size={14}
                                        color={a.passed ? '#10B981' : '#EF4444'}
                                        style={{ marginTop: 2, marginRight: 6 }}
                                      />
                                      <View style={{ flex: 1 }}>
                                        <Text style={[styles.assertionDesc, !a.passed && { color: '#EF4444' }]}>
                                          {a.description}
                                        </Text>
                                        {a.details && (
                                          <Text style={styles.assertionDetails}>{a.details}</Text>
                                        )}
                                      </View>
                                    </View>
                                  ))}
                                </View>
                              )}
                            </View>
                          ))}
                        </View>
                      )}
                    </View>
                  );
                })}
              </ScrollView>
            </View>
          )}

          {/* ================= TAB 2: WORKFLOW & CONNECTIONS MAP ================= */}
          {activeTab === 'diagram' && (
            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
              <View style={styles.mapCard}>
                <Text style={styles.mapTitle}>🗺️ AMA End-to-End Workflow Architecture</Text>
                <Text style={styles.mapSubtitle}>
                  Mapping how every user role, screen, button, Zustand store, and hardware bridge interacts.
                </Text>

                {/* Section 1: Auth & Society Registry */}
                <View style={styles.connectionBlock}>
                  <View style={styles.blockBadge}>
                    <Text style={styles.blockBadgeText}>1. AUTH & ONBOARDING GATING</Text>
                  </View>
                  <Text style={styles.blockFlow}>
                    <Text style={styles.nodeRole}>Registration Screen</Text> ➔{' '}
                    <Text style={styles.nodeAction}>[Read Terms]</Text> &{' '}
                    <Text style={styles.nodeAction}>[Read Policy]</Text> ➔{' '}
                    <Text style={styles.nodeState}>Checkboxes Unlocked</Text> ➔{' '}
                    <Text style={styles.nodeStore}>authStore.register()</Text> ➔{' '}
                    <Text style={styles.nodeBridge}>societyStore.registerMember()</Text>
                  </Text>
                  <Text style={styles.blockNote}>
                    • Ensures mandatory legal compliance and immediately propagates new residents into the President registry.
                  </Text>
                </View>

                {/* Section 2: Resident Pass & Timings */}
                <View style={styles.connectionBlock}>
                  <View style={[styles.blockBadge, { backgroundColor: '#EEF2FF' }]}>
                    <Text style={[styles.blockBadgeText, { color: '#4338CA' }]}>2. RESIDENT PASS & VISITOR GUEST PASS</Text>
                  </View>
                  <Text style={styles.blockFlow}>
                    <Text style={styles.nodeRole}>Pass Screen</Text> ➔{' '}
                    <Text style={styles.nodeAction}>[+ Issue Pass]</Text> ➔{' '}
                    <Text style={styles.nodeState}>Category (Guest/Delivery) + Time Window</Text> ➔{' '}
                    <Text style={styles.nodeStore}>visitorPassStore.issuePass()</Text> ➔{' '}
                    <Text style={styles.nodeBridge}>AMA-VISITOR:ID:PIN:WINDOW QR</Text>
                  </Text>
                  <Text style={styles.blockNote}>
                    • Generates sequential AMAVP ID and 6-digit gate entry PIN with cryptographic timestamp.
                  </Text>
                </View>

                {/* Section 3: Guard Verification */}
                <View style={styles.connectionBlock}>
                  <View style={[styles.blockBadge, { backgroundColor: '#F0FDF4' }]}>
                    <Text style={[styles.blockBadgeText, { color: '#15803D' }]}>3. SECURITY GUARD GATE VERIFICATION</Text>
                  </View>
                  <Text style={styles.blockFlow}>
                    <Text style={styles.nodeRole}>Guard Scanner</Text> ➔{' '}
                    <Text style={styles.nodeAction}>[Scan Barcode / Enter PIN]</Text> ➔{' '}
                    <Text style={styles.nodeState}>checkPassTimingValidity()</Text> ➔{' '}
                    <Text style={styles.nodeBridge}>ACCESS GRANTED (Green) / DENIED (Red)</Text> ➔{' '}
                    <Text style={styles.nodeStore}>Recent Log & markPassUsed()</Text>
                  </Text>
                  <Text style={styles.blockNote}>
                    • Strict day and time-of-day checking prevents unauthorized gate entries outside allowed windows.
                  </Text>
                </View>

                {/* Section 4: Intercom Calling */}
                <View style={styles.connectionBlock}>
                  <View style={[styles.blockBadge, { backgroundColor: '#FDF2F8' }]}>
                    <Text style={[styles.blockBadgeText, { color: '#BE185D' }]}>4. HIGH DEFINITION INTERCOM & CALLING</Text>
                  </View>
                  <Text style={styles.blockFlow}>
                    <Text style={styles.nodeRole}>Directory / Society</Text> ➔{' '}
                    <Text style={styles.nodeAction}>[Video Button]</Text> ➔{' '}
                    <Text style={styles.nodeState}>CallPickerModal</Text> ➔{' '}
                    <Text style={styles.nodeAction}>[⚡ In-App HD Video]</Text> ➔{' '}
                    <Text style={styles.nodeBridge}>ActiveCallOverlay (Camera + VoIP)</Text>
                  </Text>
                  <Text style={styles.blockNote}>
                    • WhatsApp choice opens chat and activates WhatsAppCallGuidanceModal with 1-tap fallback switch.
                  </Text>
                </View>

                {/* Section 5: Community Chat & Video Notes */}
                <View style={styles.connectionBlock}>
                  <View style={[styles.blockBadge, { backgroundColor: '#FEF3C7' }]}>
                    <Text style={[styles.blockBadgeText, { color: '#B45309' }]}>5. COMMUNITY CHAT & VIDEO NOTES</Text>
                  </View>
                  <Text style={styles.blockFlow}>
                    <Text style={styles.nodeRole}>General Chat</Text> ➔{' '}
                    <Text style={styles.nodeAction}>[📹 Record Button]</Text> ➔{' '}
                    <Text style={styles.nodeState}>MediaRecorder + Audio Fallback</Text> ➔{' '}
                    <Text style={styles.nodeStore}>chatStore.sendVideoMessage()</Text> ➔{' '}
                    <Text style={styles.nodeBridge}>Appended to Bottom + VideoPlayerModal</Text>
                  </Text>
                  <Text style={styles.blockNote}>
                    • Strict chronological timestamp sorting ensures newest messages always appear at bottom with auto-scroll.
                  </Text>
                </View>

                {/* Section 6: President Society Management */}
                <View style={styles.connectionBlock}>
                  <View style={[styles.blockBadge, { backgroundColor: '#F3E8FF' }]}>
                    <Text style={[styles.blockBadgeText, { color: '#7E22CE' }]}>6. PRESIDENT DASHBOARD & REGISTRY</Text>
                  </View>
                  <Text style={styles.blockFlow}>
                    <Text style={styles.nodeRole}>President Society</Text> ➔{' '}
                    <Text style={styles.nodeState}>Live Overview Counters (120 Units)</Text> ➔{' '}
                    <Text style={styles.nodeAction}>[Filter: Owners/Tenants/Guards]</Text> ➔{' '}
                    <Text style={styles.nodeAction}>[+ Add Member]</Text> ➔{' '}
                    <Text style={styles.nodeStore}>societyStore.addMember()</Text>
                  </Text>
                  <Text style={styles.blockNote}>
                    • Real-time synchronization allows President to manage all residents and contact them directly via intercom.
                  </Text>
                </View>

                {/* Section 7: Bazaar Fresh Mart & POS */}
                <View style={styles.connectionBlock}>
                  <View style={[styles.blockBadge, { backgroundColor: '#E0F2FE' }]}>
                    <Text style={[styles.blockBadgeText, { color: '#0369A1' }]}>7. BAZAAR FRESH MART & POS INVOICING</Text>
                  </View>
                  <Text style={styles.blockFlow}>
                    <Text style={styles.nodeRole}>Fresh Mart</Text> ➔{' '}
                    <Text style={styles.nodeAction}>[Add to Cart]</Text> ➔{' '}
                    <Text style={styles.nodeAction}>[Checkout]</Text> ➔{' '}
                    <Text style={styles.nodeStore}>bazaarStore.createOrder() (RCP-XXXX)</Text> ➔{' '}
                    <Text style={styles.nodeBridge}>WhatsAppPdfModal (jsPDF + Web Share)</Text>
                  </Text>
                  <Text style={styles.blockNote}>
                    • Exports itemized receipts with direct PDF download and WhatsApp integration.
                  </Text>
                </View>
              </View>
            </ScrollView>
          )}

          {/* ================= TAB 3: LIVE CONSOLE LOGS ================= */}
          {activeTab === 'logs' && (
            <ScrollView
              style={styles.logsConsole}
              contentContainerStyle={{ padding: 16, gap: 6 }}
            >
              {logs.map((log) => (
                <View key={log.id} style={styles.logRow}>
                  <Text style={styles.logTimestamp}>[{log.timestamp}]</Text>
                  <Text
                    style={[
                      styles.logMessage,
                      log.level === 'success' && { color: '#34D399' },
                      log.level === 'error' && { color: '#F87171' },
                      log.level === 'warn' && { color: '#FBBF24' },
                    ]}
                  >
                    {log.message}
                  </Text>
                </View>
              ))}
            </ScrollView>
          )}
        </View>
  );
}

export function E2ETestBotModal() {
  const { modalVisible, setModalVisible } = useTestBotStore();

  if (!modalVisible) return null;

  return (
    <Modal
      visible={modalVisible}
      animationType="slide"
      transparent
      onRequestClose={() => setModalVisible(false)}
    >
      <View style={styles.overlay}>
        <TestBotView isModal={true} onClose={() => setModalVisible(false)} />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Platform.OS === 'web' ? 24 : 10,
  },
  container: {
    width: '100%',
    maxWidth: 900,
    height: '92%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 30,
    display: 'flex',
    flexDirection: 'column',
  },
  standaloneContainer: {
    maxWidth: '100%',
    height: '100%',
    borderRadius: 0,
    shadowOpacity: 0,
    elevation: 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    backgroundColor: '#FFFFFF',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  botIconCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  livePulsePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  pulseText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#475569',
  },
  closeBtn: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#F8FAFC',
  },
  runningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4338CA',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  runningText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  statsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingVertical: 10,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    marginTop: 1,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#E2E8F0',
  },
  controlsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
    backgroundColor: '#FFFFFF',
  },
  runAllBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#16A34A',
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: '#16A34A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  runAllBtnDisabled: {
    backgroundColor: '#94A3B8',
    opacity: 0.8,
  },
  runAllBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  resetBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  tabItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabItemActive: {
    borderBottomColor: '#4F46E5',
    backgroundColor: '#F5F3FF',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  tabTextActive: {
    color: '#4F46E5',
    fontWeight: '800',
  },
  filterScrollView: {
    maxHeight: 44,
    paddingVertical: 6,
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  filterPill: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  filterPillActive: {
    backgroundColor: '#4F46E5',
    borderColor: '#4F46E5',
  },
  filterPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  filterPillTextActive: {
    color: '#FFFFFF',
  },
  suitesList: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  suiteCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  suiteCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    backgroundColor: '#FFFFFF',
  },
  suiteTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  suiteDesc: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  suitePassBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 6,
  },
  suitePassBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#15803D',
  },
  suiteFailBadge: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 6,
  },
  suiteFailBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#B91C1C',
  },
  runSuiteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  runSuiteBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4F46E5',
  },
  scenariosContainer: {
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    padding: 12,
    gap: 10,
    backgroundColor: '#FAFAFA',
  },
  scenarioCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  scenarioHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  scenarioTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  roleTag: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  roleTagText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#1D4ED8',
  },
  scenarioDesc: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  runSingleBtn: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: '#EEF2FF',
  },
  buttonsTestedBox: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  buttonsTestedLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
    marginBottom: 4,
  },
  buttonsChipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  buttonChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  buttonChipText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#3730A3',
  },
  assertionsList: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    gap: 4,
  },
  assertionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  assertionDesc: {
    fontSize: 11,
    color: '#334155',
    fontWeight: '600',
  },
  assertionDetails: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 1,
  },
  mapCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  mapTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  mapSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
    marginBottom: 16,
  },
  connectionBlock: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  blockBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginBottom: 6,
  },
  blockBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#334155',
  },
  blockFlow: {
    fontSize: 13,
    color: '#0F172A',
    lineHeight: 20,
    fontWeight: '500',
  },
  nodeRole: {
    fontWeight: '800',
    color: '#1D4ED8',
  },
  nodeAction: {
    fontWeight: '700',
    color: '#059669',
  },
  nodeState: {
    fontWeight: '700',
    color: '#D97706',
  },
  nodeStore: {
    fontWeight: '700',
    color: '#7C3AED',
  },
  nodeBridge: {
    fontWeight: '800',
    color: '#DC2626',
  },
  blockNote: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 6,
  },
  logsConsole: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  logRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  logTimestamp: {
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    color: '#64748B',
  },
  logMessage: {
    flex: 1,
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    color: '#E2E8F0',
  },
});
