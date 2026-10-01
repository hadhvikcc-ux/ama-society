import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { BentoGrid, BentoRow } from '../../components/ui/BentoGrid';
import { BentoTile } from '../../components/ui/BentoTile';
import { useResponsive } from '../../hooks/useResponsive';
import { RECAPTCHA_CONTAINER_ID, useFirebaseSignIn } from '../../hooks/useFirebaseSignIn';
import { APARTMENT_LEGAL_SECTIONS } from '../../constants/legalContent';
import { COLORS } from '../../constants/colors';
import { DEFAULT_SIGNUP_ROLE, SignupRolePicker } from '../../components/auth/SignupRolePicker';
import { getChosenSignupRole, setChosenSignupRole } from '../../services/pendingRegistration';

const POLICIES = APARTMENT_LEGAL_SECTIONS.filter((s) => s.key === 'TERMS' || s.key === 'PRIVACY');

/**
 * Resident sign-up: Google or mobile OTP (Firebase), then /auth/complete-profile for
 * name + society code. Staff accounts are created by the committee, not here.
 */
export default function RegisterScreen() {
  const router = useRouter();
  const { containerPadding, isPhone } = useResponsive();

  const [agreed, setAgreed] = useState(false);
  const [role, setRole] = useState(getChosenSignupRole() ?? DEFAULT_SIGNUP_ROLE);
  const chooseRole = (key: string) => {
    setRole(key);
    setChosenSignupRole(key); // the complete-profile step starts with this role
  };
  const [openPolicy, setOpenPolicy] = useState<string | null>(null);
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const auth = useFirebaseSignIn({ setError, setLoading });

  const requireAgreement = (action: () => void) => () => {
    if (!agreed) {
      setError('Please accept the Terms of Service and Privacy Policy first.');
      return;
    }
    action();
  };

  return (
    <ScrollView style={styles.page} contentContainerStyle={{ padding: containerPadding, paddingBottom: 40 }}>
      <BentoGrid>
        <BentoRow weights={[1.05, 1]}>
          {/* Hero */}
          <View style={[styles.hero, { padding: isPhone ? 22 : 32 }]}>
            <View style={styles.brandChip}>
              <Ionicons name="business" size={14} color="#FFFFFF" />
              <Text style={styles.brandChipText}>AMA Society</Text>
            </View>
            <Text style={[styles.heroTitle, isPhone && { fontSize: 28, lineHeight: 34 }]}>Join your society in under a minute.</Text>
            <Text style={styles.heroBody}>
              Pay maintenance, issue gate passes, book the clubhouse and raise tickets — all in one place.
            </Text>
            <View style={{ gap: 12, marginTop: 8 }}>
              {[
                ['shield-checkmark', 'Verified by Google or an SMS code'],
                ['key', 'Your committee gives you a society code, e.g. AMA-001'],
                ['flash', 'Resident access as soon as you sign up'],
              ].map(([icon, text]) => (
                <View key={text} style={styles.heroPoint}>
                  <View style={styles.heroPointIcon}>
                    <Ionicons name={icon as any} size={16} color="#1B4FD8" />
                  </View>
                  <Text style={styles.heroPointText}>{text}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Sign-up */}
          <BentoTile style={styles.fill}>
            <Text style={styles.cardTitle}>Create your account</Text>
            <Text style={styles.cardSubtitle}>Choose your role. Residents get access straight away; staff roles are approved by your society admin.</Text>

            {error && (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle" size={18} color="#B91C1C" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            <View style={{ marginBottom: 14 }}>
              <SignupRolePicker value={role} onChange={chooseRole} />
            </View>

            <TouchableOpacity
              style={styles.agreeRow}
              onPress={() => { setAgreed(!agreed); setError(null); }}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: agreed }}
            >
              <Ionicons name={agreed ? 'checkbox' : 'square-outline'} size={22} color={agreed ? '#1B4FD8' : '#9CA3AF'} />
              <Text style={styles.agreeText}>
                I agree to the society's <Text style={styles.link}>Terms of Service & Byelaws</Text> and <Text style={styles.link}>Privacy & CCTV Policy</Text> (see below).
              </Text>
            </TouchableOpacity>

            {!auth.available ? (
              <View style={styles.notice}>
                <Ionicons name="information-circle" size={18} color="#1E3A8A" />
                <Text style={styles.noticeText}>
                  Google and mobile sign-up are available on the AMA website. On this device, ask your committee admin to create your account.
                </Text>
              </View>
            ) : (
              <>
                <TouchableOpacity
                  style={[styles.googleBtn, (!agreed || loading) && styles.dimmed]}
                  onPress={requireAgreement(auth.googleSignIn)}
                  disabled={loading}
                  accessibilityRole="button"
                  accessibilityLabel="Continue with Google"
                >
                  <Ionicons name="logo-google" size={18} color="#DB4437" style={{ marginRight: 10 }} />
                  <Text style={styles.googleText}>Continue with Google</Text>
                </TouchableOpacity>

                <View style={styles.orRow}>
                  <View style={styles.orLine} />
                  <Text style={styles.orText}>or use your mobile number</Text>
                  <View style={styles.orLine} />
                </View>

                {!auth.otpSent ? (
                  <View style={styles.inlineRow}>
                    <View style={[styles.inputBox, { flex: 1 }]}>
                      <Text style={styles.prefix}>+91</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="10-digit mobile number"
                        value={phone}
                        onChangeText={(v) => { setPhone(v.replace(/\D/g, '')); setError(null); }}
                        keyboardType="phone-pad"
                        maxLength={10}
                      />
                    </View>
                    <TouchableOpacity
                      style={[styles.primaryBtn, (!agreed || loading) && styles.dimmed]}
                      onPress={requireAgreement(() => auth.sendOtp(phone))}
                      disabled={loading}
                    >
                      {loading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.primaryText}>Send code</Text>}
                    </TouchableOpacity>
                  </View>
                ) : (
                  <>
                    <View style={styles.inlineRow}>
                      <View style={[styles.inputBox, { flex: 1 }]}>
                        <Ionicons name="keypad-outline" size={18} color="#6B7280" style={{ marginRight: 8 }} />
                        <TextInput
                          style={styles.input}
                          placeholder="6-digit code"
                          value={code}
                          onChangeText={(v) => { setCode(v.replace(/\D/g, '')); setError(null); }}
                          keyboardType="number-pad"
                          maxLength={6}
                        />
                      </View>
                      <TouchableOpacity style={[styles.primaryBtn, loading && styles.dimmed]} onPress={() => auth.verifyOtp(code)} disabled={loading}>
                        {loading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.primaryText}>Verify</Text>}
                      </TouchableOpacity>
                    </View>
                    <TouchableOpacity onPress={() => { auth.resetOtp(); setCode(''); }}>
                      <Text style={styles.subtleLink}>Code sent to +91 {phone}. Change number or resend</Text>
                    </TouchableOpacity>
                  </>
                )}
                <View nativeID={RECAPTCHA_CONTAINER_ID} />
              </>
            )}

            <TouchableOpacity onPress={() => router.replace('/auth/login')} style={{ marginTop: 18 }}>
              <Text style={styles.footerText}>
                Already registered? <Text style={styles.link}>Sign in</Text>
              </Text>
            </TouchableOpacity>
          </BentoTile>
        </BentoRow>

        {/* How it works */}
        <BentoRow>
          {[
            { color: 'lavender' as const, icon: 'person-circle', step: '1', title: 'Verify it’s you', body: 'Continue with Google, or get a 6-digit code by SMS.' },
            { color: 'sage' as const, icon: 'key', step: '2', title: 'Pick your role & society', body: 'Owner, tenant or staff, plus the society code (e.g. AMA-001).' },
            { color: 'peach' as const, icon: 'home', step: '3', title: 'You’re in', body: 'Residents start right away. Staff roles open once the admin approves.' },
          ].map((s) => (
            <BentoTile key={s.step} color={s.color} style={styles.fill}>
              <View style={styles.stepHead}>
                <Ionicons name={s.icon as any} size={22} color={COLORS.PASTEL[s.color].text} />
                <Text style={[styles.stepNumber, { color: COLORS.PASTEL[s.color].text }]}>Step {s.step}</Text>
              </View>
              <Text style={[styles.stepTitle, { color: COLORS.PASTEL[s.color].text }]}>{s.title}</Text>
              <Text style={styles.stepBody}>{s.body}</Text>
            </BentoTile>
          ))}
        </BentoRow>

        {/* Policies */}
        <BentoRow>
          {POLICIES.map((policy) => {
            const open = openPolicy === policy.key;
            return (
              <BentoTile key={policy.key} color={policy.key === 'TERMS' ? 'cream' : 'powder'} style={styles.fill}>
                <TouchableOpacity style={styles.policyHead} onPress={() => setOpenPolicy(open ? null : policy.key)} accessibilityRole="button">
                  <Ionicons name={policy.icon as any} size={20} color="#1F2937" />
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={styles.policyTitle}>{policy.title}</Text>
                    <Text style={styles.policyTagline}>{policy.tagline}</Text>
                  </View>
                  <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={18} color="#4B5563" />
                </TouchableOpacity>
                {open && (
                  <View style={{ marginTop: 12, gap: 10 }}>
                    {policy.clauses.map((clause) => (
                      <View key={clause.id}>
                        <Text style={styles.clauseTitle}>{clause.title}</Text>
                        <Text style={styles.clauseBody}>{clause.summary}</Text>
                      </View>
                    ))}
                    <Text style={styles.policyUpdated}>Last updated {policy.lastUpdated}</Text>
                  </View>
                )}
              </BentoTile>
            );
          })}
        </BentoRow>
      </BentoGrid>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#F1F3F9' },
  fill: { flexGrow: 1 },
  hero: { flexGrow: 1, backgroundColor: '#1B4FD8', borderRadius: 24, gap: 14, justifyContent: 'center' },
  brandChip: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.18)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999 },
  brandChipText: { color: '#FFFFFF', fontWeight: '700', fontSize: 13 },
  heroTitle: { color: '#FFFFFF', fontSize: 36, lineHeight: 42, fontWeight: '800', letterSpacing: -0.5 },
  heroBody: { color: '#DBEAFE', fontSize: 15, lineHeight: 22 },
  heroPoint: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  heroPointIcon: { width: 30, height: 30, borderRadius: 10, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
  heroPointText: { color: '#FFFFFF', fontSize: 14, fontWeight: '600', flex: 1 },
  cardTitle: { fontSize: 24, fontWeight: '800', color: '#111827' },
  cardSubtitle: { fontSize: 13, color: '#6B7280', marginTop: 4, marginBottom: 16, lineHeight: 19 },
  errorBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#FEF2F2', borderColor: '#FECACA', borderWidth: 1, borderRadius: 14, padding: 12, marginBottom: 14 },
  errorText: { color: '#B91C1C', fontSize: 13, fontWeight: '600', flex: 1 },
  agreeRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, backgroundColor: '#F9FAFB', borderRadius: 14, padding: 12, marginBottom: 16 },
  agreeText: { flex: 1, fontSize: 13, color: '#374151', lineHeight: 19 },
  link: { color: '#1B4FD8', fontWeight: '700' },
  notice: { flexDirection: 'row', gap: 8, backgroundColor: COLORS.PASTEL.powder.fill, borderRadius: 14, padding: 12 },
  noticeText: { flex: 1, color: '#1E3A8A', fontSize: 13, lineHeight: 19 },
  googleBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 50, borderRadius: 14, borderWidth: 1.5, borderColor: '#D1D5DB', backgroundColor: '#FFFFFF' },
  googleText: { fontSize: 15, fontWeight: '700', color: '#111827' },
  dimmed: { opacity: 0.55 },
  orRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 16, gap: 10 },
  orLine: { flex: 1, height: 1, backgroundColor: '#E5E7EB' },
  orText: { fontSize: 12, color: '#6B7280', fontWeight: '600' },
  inlineRow: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  inputBox: { flexDirection: 'row', alignItems: 'center', height: 50, borderRadius: 14, borderWidth: 1.5, borderColor: '#E5E7EB', backgroundColor: '#F9FAFB', paddingHorizontal: 12 },
  prefix: { fontWeight: '700', color: '#374151', marginRight: 8 },
  input: { flex: 1, fontSize: 15, color: '#111827', minWidth: 0 },
  primaryBtn: { height: 50, paddingHorizontal: 18, borderRadius: 14, backgroundColor: '#1B4FD8', alignItems: 'center', justifyContent: 'center', minWidth: 104 },
  primaryText: { color: '#FFFFFF', fontWeight: '700', fontSize: 15 },
  subtleLink: { color: '#6B7280', fontSize: 13, marginTop: 10, textAlign: 'center' },
  footerText: { textAlign: 'center', color: '#6B7280', fontSize: 14 },
  stepHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  stepNumber: { fontSize: 12, fontWeight: '800', letterSpacing: 0.5, textTransform: 'uppercase' },
  stepTitle: { fontSize: 17, fontWeight: '800', marginBottom: 4 },
  stepBody: { fontSize: 13, color: '#374151', lineHeight: 19 },
  policyHead: { flexDirection: 'row', alignItems: 'center' },
  policyTitle: { fontSize: 15, fontWeight: '800', color: '#111827' },
  policyTagline: { fontSize: 12, color: '#4B5563', marginTop: 2 },
  clauseTitle: { fontSize: 13, fontWeight: '700', color: '#1F2937' },
  clauseBody: { fontSize: 13, color: '#374151', lineHeight: 19, marginTop: 2 },
  policyUpdated: { fontSize: 11, color: '#6B7280', marginTop: 4 },
});
