import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { Redirect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../services/api';
import { useAuthStore } from '../../stores/authStore';
import { getAuthorizedHomeForRole } from '../../utils/rbac';
import { userFromApi } from '../../utils/session';
import { getPendingRegistration, setPendingRegistration } from '../../services/pendingRegistration';

/** Last step of Google / phone OTP sign-up: collects what the provider did not give us. */
export default function CompleteProfileScreen() {
  const router = useRouter();
  const { setUser, setTokens } = useAuthStore();
  const pending = getPendingRegistration();

  const [name, setName] = useState(pending?.name ?? '');
  const [phone, setPhone] = useState('');
  const [societyCode, setSocietyCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Opened directly or after a refresh: the in-memory sign-up session is gone.
  if (!pending) return <Redirect href="/auth/login" />;
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
        ...(needsPhone ? { phone: `+91${phone.trim()}` } : {}),
      });
      setPendingRegistration(null);
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
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.card}>
          <Text style={styles.title}>Complete your profile</Text>
          <Text style={styles.subtitle}>
            Signed in as {pending.email ?? `+91 ${pending.phone?.slice(-10)}`}. A few details to set up your resident account.
          </Text>

          {error && (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle-outline" size={18} color="#B91C1C" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

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
          <TextInput style={styles.input} value={societyCode} onChangeText={setSocietyCode} placeholder="From your committee, e.g. AMA Grand Estate" autoCapitalize="words" />
          <Text style={styles.hint}>Your account is created as a resident. The committee can change your role or link your flat later.</Text>

          <TouchableOpacity style={[styles.primaryBtn, loading && { opacity: 0.7 }]} onPress={submit} disabled={loading} activeOpacity={0.85}>
            {loading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.primaryBtnText}>Create my account</Text>}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => { setPendingRegistration(null); router.replace('/auth/login'); }}>
            <Text style={styles.backText}>Cancel and go back to sign in</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1B4FD8' },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 20 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 24, padding: 24, maxWidth: 520, width: '100%', alignSelf: 'center' },
  title: { fontSize: 24, fontWeight: '800', color: '#111827' },
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
