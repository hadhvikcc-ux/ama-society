import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { Redirect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../services/api';
import { useAuthStore } from '../../stores/authStore';
import { getAuthorizedHomeForRole } from '../../utils/rbac';
import { userFromApi } from '../../utils/session';
import { getChosenSignupRole, getPendingRegistration, setChosenSignupRole, setPendingRegistration } from '../../services/pendingRegistration';
import { DEFAULT_SIGNUP_ROLE, SIGNUP_ROLE_OPTIONS, SignupRolePicker } from '../../components/auth/SignupRolePicker';
import { BentoGrid, BentoRow } from '../../components/ui/BentoGrid';
import { BentoTile } from '../../components/ui/BentoTile';
import { useResponsive } from '../../hooks/useResponsive';

/** Last step of Google / phone OTP sign-up: collects what the provider did not give us. */
export default function CompleteProfileScreen() {
  const router = useRouter();
  const { setUser, setTokens } = useAuthStore();
  const pending = getPendingRegistration();
  const { containerPadding, isPhone } = useResponsive();

  const [name, setName] = useState(pending?.name ?? '');
  const [phone, setPhone] = useState('');
  const [societyCode, setSocietyCode] = useState('');
  const [role, setRole] = useState(getChosenSignupRole() ?? DEFAULT_SIGNUP_ROLE);
  // Set when a staff sign-up is created but waits for the admin's approval.
  const [awaitingApproval, setAwaitingApproval] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Opened directly or after a refresh: the in-memory sign-up session is gone.
  if (!pending && !awaitingApproval) return <Redirect href="/auth/login" />;
  if (awaitingApproval) {
    const roleTitle = SIGNUP_ROLE_OPTIONS.find((o) => o.key === role)?.title ?? 'Staff';
    return (
      <View style={[styles.container, { justifyContent: 'center', padding: containerPadding }]}>
        <BentoTile style={styles.pendingCard}>
          <View style={styles.pendingIcon}>
            <Ionicons name="time" size={30} color="#B45309" />
          </View>
          <Text style={styles.title}>Waiting for approval</Text>
          <Text style={[styles.subtitle, { textAlign: 'center' }]}>
            Your <Text style={{ fontWeight: '800', color: '#111827' }}>{roleTitle}</Text> account has been created. {awaitingApproval}
          </Text>
          <TouchableOpacity onPress={() => router.replace('/auth/login')} accessibilityRole="button">
            <View style={styles.primaryBtn}>
              <Text style={styles.primaryBtnText}>Back to sign in</Text>
            </View>
          </TouchableOpacity>
        </BentoTile>
      </View>
    );
  }
  if (!pending) return null;
  const needsPhone = !pending.phone;

  const submit = async () => {
    setError(null);
    if (!name.trim()) return setError('Please enter your full name.');
    if (needsPhone && !/^[6-9]\d{9}$/.test(phone.trim())) return setError('Please enter a valid 10-digit Indian mobile number.');
    if (!societyCode.trim()) return setError('Please enter your society code.');

    setLoading(true);
    try {
      const res = await api.post('/auth/register/complete', {
        registrationToken: pending.registrationToken,
        name: name.trim(),
        societyCode: societyCode.trim(),
        role,
        ...(needsPhone ? { phone: `+91${phone.trim()}` } : {}),
      });
      setPendingRegistration(null);
      setChosenSignupRole(null);
      if (res.data.pendingApproval) {
        setAwaitingApproval(res.data.message || 'You can sign in once your society admin approves it.');
        return;
      }
      const user = userFromApi(res.data.user);
      setUser(user);
      setTokens(res.data.accessToken, res.data.refreshToken);
      router.replace(getAuthorizedHomeForRole(user.role) as any);
    } catch (err: any) {
      const status = err?.response?.status;
      const message = err?.response?.data?.message;
      if (status === 401) {
        setPendingRegistration(null);
        setError('Your sign-up session expired. Please go back and sign in again.');
      } else if (status === 404 || status === 409) {
        setError(message);
      } else if (status === 400) {
        setError(Array.isArray(message) ? message.join('\n') : message || 'Please check the details and try again.');
      } else {
        setError(status ? `Sign-up is unavailable right now (server error ${status}).` : 'Unable to reach the server. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={{ padding: containerPadding, paddingBottom: 40, flexGrow: 1, justifyContent: 'center' }}>
        <BentoGrid style={{ maxWidth: 980 }}>
          <BentoRow weights={[0.85, 1.15]}>
            <View style={[styles.hero, { padding: isPhone ? 22 : 30 }]}>
              <View style={styles.heroChip}>
                <Ionicons name="checkmark-circle" size={14} color="#FFFFFF" />
                <Text style={styles.heroChipText}>Verified</Text>
              </View>
              <Text style={styles.heroTitle}>Almost there.</Text>
              <Text style={styles.heroBody}>
                Signed in as {pending.email ?? `+91 ${pending.phone?.slice(-10)}`}. Tell us who you are and which society you live in.
              </Text>
              <View style={styles.codeHint}>
                <Ionicons name="key" size={18} color="#1B4FD8" />
                <Text style={styles.codeHintText}>Your committee shares the society code. It looks like <Text style={{ fontWeight: '800' }}>AMA-001</Text>.</Text>
              </View>
            </View>

            <BentoTile style={{ flexGrow: 1 }}>
              <Text style={styles.title}>Complete your profile</Text>
              <Text style={styles.subtitle}>Residents get access straight away. Staff roles are approved by your society admin first.</Text>

              {error && (
                <View style={styles.errorBox}>
                  <Ionicons name="alert-circle-outline" size={18} color="#B91C1C" />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}

              <View style={{ marginBottom: 14 }}>
                <SignupRolePicker value={role} onChange={setRole} />
              </View>

              <Text style={styles.label}>Full name</Text>
              <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="e.g. Asha Rao" autoComplete="name" />

              {needsPhone && (
                <>
                  <Text style={styles.label}>Mobile number</Text>
                  <View style={styles.phoneRow}>
                    <Text style={styles.prefix}>+91</Text>
                    <TextInput
                      style={[styles.input, { flex: 1, marginBottom: 0 }]}
                      value={phone}
                      onChangeText={setPhone}
                      placeholder="10-digit mobile number"
                      keyboardType="phone-pad"
                      maxLength={10}
                    />
                  </View>
                </>
              )}

              <Text style={[styles.label, needsPhone && { marginTop: 14 }]}>Society code</Text>
              <TextInput style={styles.input} value={societyCode} onChangeText={setSocietyCode} placeholder="e.g. AMA-001" autoCapitalize="characters" autoCorrect={false} />

              <TouchableOpacity onPress={submit} disabled={loading} activeOpacity={0.85} accessibilityLabel="Create my account">
                <View style={[styles.primaryBtn, loading && { opacity: 0.7 }]}>
                  {loading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.primaryBtnText}>Create my account</Text>}
                </View>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => { setPendingRegistration(null); router.replace('/auth/login'); }}>
                <Text style={styles.backText}>Cancel and go back to sign in</Text>
              </TouchableOpacity>
            </BentoTile>
          </BentoRow>
        </BentoGrid>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F1F3F9' },
  hero: { flexGrow: 1, backgroundColor: '#1B4FD8', borderRadius: 24, gap: 14, justifyContent: 'center' },
  heroChip: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.18)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999 },
  heroChipText: { color: '#FFFFFF', fontWeight: '700', fontSize: 13 },
  heroTitle: { color: '#FFFFFF', fontSize: 32, lineHeight: 38, fontWeight: '800', letterSpacing: -0.5 },
  heroBody: { color: '#DBEAFE', fontSize: 15, lineHeight: 22 },
  codeHint: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#FFFFFF', borderRadius: 14, padding: 14 },
  codeHintText: { flex: 1, color: '#1E3A8A', fontSize: 13, lineHeight: 19 },
  title: { fontSize: 24, fontWeight: '800', color: '#111827' },
  pendingCard: { maxWidth: 520, width: '100%', alignSelf: 'center', alignItems: 'center', gap: 6 },
  pendingIcon: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#FEF3C7', alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#6B7280', marginTop: 6, marginBottom: 18 },
  label: { fontSize: 13, fontWeight: '700', color: '#374151', marginBottom: 6 },
  input: { borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 14, height: 48, paddingHorizontal: 14, fontSize: 15, backgroundColor: '#F9FAFB', marginBottom: 14 },
  phoneRow: { flexDirection: 'row', alignItems: 'center' },
  prefix: { fontSize: 15, fontWeight: '700', color: '#374151', marginRight: 8 },
  hint: { fontSize: 12, color: '#6B7280', marginTop: -6, marginBottom: 18 },
  errorBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEF2F2', borderColor: '#FECACA', borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 16 },
  errorText: { color: '#B91C1C', marginLeft: 8, flex: 1, fontSize: 13, fontWeight: '600' },
  primaryBtn: { backgroundColor: '#1B4FD8', borderRadius: 14, height: 50, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  primaryBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  backText: { textAlign: 'center', color: '#6B7280', fontSize: 13, fontWeight: '500', paddingVertical: 4 },
});
