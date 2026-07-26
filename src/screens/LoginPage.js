import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  ScrollView,
  ImageBackground,
  Pressable,
  SafeAreaView,
  ActivityIndicator,
  useWindowDimensions
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Shield,
  Mail,
  Lock,
  User,
  Phone,
  Eye,
  EyeOff,
  ArrowRight,
  Users,
  Dumbbell,
  Trophy,
  Globe,
  ChevronDown,
  AlertTriangle,
  KeyRound,
  Check,
  CheckCircle2
} from 'lucide-react-native';
import { colors as C } from "../constants/theme";

const CYAN = C.cyan;
const VIOLET = C.purple;
const GREEN = C.green;
const RED = C.red;
const BG_DARK = "#020617";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^\+?[\d\s\-()]+$/;
const SAVED_EMAIL_KEY = "fc_saved_email";
const REMEMBER_KEY = "fc_remember_me";

function calculatePasswordStrength(password) {
  const requirements = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /\d/.test(password),
    special: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password),
  };
  const score = Object.values(requirements).filter(Boolean).length;
  const feedback = [];
  if (!requirements.length) feedback.push('Minim 8 caractere');
  if (!requirements.uppercase) feedback.push('O literă mare');
  if (!requirements.lowercase) feedback.push('O literă mică');
  if (!requirements.number) feedback.push('O cifră');
  if (!requirements.special) feedback.push('Un caracter special');
  return { score, feedback, requirements };
}

function PasswordStrengthIndicator({ password }) {
  if (!password) return null;
  const { score, feedback } = calculatePasswordStrength(password);
  const color = score <= 1 ? RED : score <= 2 ? '#F97316' : score <= 3 ? '#EAB308' : score <= 4 ? '#3B82F6' : GREEN;
  const label = score <= 1 ? 'Foarte slabă' : score <= 2 ? 'Slabă' : score <= 3 ? 'Acceptabilă' : score <= 4 ? 'Bună' : 'Puternică';
  return (
    <View style={styles.strengthWrap}>
      <View style={styles.strengthRow}>
        <View style={styles.strengthTrack}>
          <View style={[styles.strengthFill, { width: `${(score / 5) * 100}%`, backgroundColor: color }]} />
        </View>
        <Text style={[styles.strengthLabel, { color }]}>{label}</Text>
      </View>
      {feedback.length > 0 && (
        <View style={styles.strengthHints}>
          {feedback.map((item) => (
            <View key={item} style={styles.strengthHint}>
              <AlertTriangle size={10} color="#F59E0B" />
              <Text style={styles.strengthHintText}>{item}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

function FieldError({ message, center }) {
  if (!message) return null;
  return (
    <View style={[styles.fieldErrorRow, center && { justifyContent: 'center' }]}>
      <AlertTriangle size={11} color={RED} />
      <Text style={styles.fieldErrorText}>{message}</Text>
    </View>
  );
}

function InputField({ icon, placeholder, value, onChange, onBlur, error, secure, showPassword, onToggleShow, keyboardType, autoCapitalize }) {
  const Icon = { Mail, Lock, User, Phone, Shield }[icon];
  return (
    <View>
      <View style={[styles.inputWrapper, error && styles.inputWrapperError]}>
        {Icon && <Icon size={18} color="#64748B" style={{ marginRight: 10 }} />}
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor={C.dim}
          secureTextEntry={secure && !showPassword}
          value={value}
          onChangeText={onChange}
          onBlur={onBlur}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize ?? 'none'}
        />
        {secure && (
          <Pressable onPress={onToggleShow} accessibilityLabel={showPassword ? 'Ascunde parola' : 'Arată parola'}>
            {showPassword ? <EyeOff size={18} color="#64748B" /> : <Eye size={18} color="#64748B" />}
          </Pressable>
        )}
      </View>
      <FieldError message={error} />
    </View>
  );
}

function CheckBox({ checked, onToggle }) {
  return (
    <Pressable onPress={onToggle} style={[styles.checkbox, checked && styles.checkboxChecked]} accessibilityRole="checkbox" accessibilityState={{ checked }}>
      {checked && <Check size={12} color={BG_DARK} strokeWidth={3.5} />}
    </Pressable>
  );
}

function BenefitItem({ icon, color, title }) {
  const Icon = { Users, Dumbbell, Trophy }[icon];
  return (
    <View style={styles.benefitItem}>
      <View style={[styles.benefitIcon, { backgroundColor: color + '20' }]}>
        <Icon size={18} color={color} />
      </View>
      <Text style={styles.benefitText}>{title}</Text>
    </View>
  );
}

export default function LoginPage({ onLogin, onRegister, onSignup, onGoogle, onForgot, loading, error }) {
  const { width } = useWindowDimensions();
  const isDesktop = width > 768;

  const [mode, setMode] = useState('login'); // 'login' | 'signup' | 'reset'
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [generalError, setGeneralError] = useState('');
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    agreeToTerms: false,
    rememberMe: false,
  });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  useEffect(() => {
    (async () => {
      try {
        const [savedEmail, remember] = await Promise.all([
          AsyncStorage.getItem(SAVED_EMAIL_KEY),
          AsyncStorage.getItem(REMEMBER_KEY),
        ]);
        if (savedEmail && remember === 'true') {
          setForm((prev) => ({ ...prev, email: prev.email || savedEmail, rememberMe: true }));
        }
      } catch {
        // AsyncStorage indisponibil — continuăm fără email salvat
      }
    })();
  }, []);

  const validateField = useCallback((field, value) => {
    switch (field) {
      case 'name':
        if (mode === 'signup' && !String(value).trim()) return 'Numele este obligatoriu';
        return '';
      case 'email':
        if (!String(value).trim()) return 'Emailul este obligatoriu';
        if (!EMAIL_RE.test(String(value).trim())) return 'Introdu o adresă de email validă';
        return '';
      case 'password':
        if (!value) return 'Parola este obligatorie';
        if (mode === 'signup') {
          if (String(value).length < 8) return 'Parola trebuie să aibă minim 8 caractere';
          if (calculatePasswordStrength(String(value)).score < 3) return 'Parola este prea slabă';
        }
        return '';
      case 'confirmPassword':
        if (mode === 'signup' && value !== form.password) return 'Parolele nu coincid';
        return '';
      case 'phone':
        if (String(value) && !PHONE_RE.test(String(value))) return 'Introdu un număr de telefon valid';
        return '';
      case 'agreeToTerms':
        if (mode === 'signup' && !value) return 'Trebuie să accepți termenii și condițiile';
        return '';
      default:
        return '';
    }
  }, [mode, form.password]);

  const handleChange = useCallback((field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setGeneralError('');
    if (touched[field]) {
      setErrors((prev) => ({ ...prev, [field]: validateField(field, value) || undefined }));
    }
  }, [touched, validateField]);

  const handleBlur = useCallback((field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    setErrors((prev) => ({ ...prev, [field]: validateField(field, form[field]) || undefined }));
  }, [form, validateField]);

  const validateAll = (fields) => {
    const newErrors = {};
    fields.forEach((field) => {
      const err = validateField(field, form[field]);
      if (err) newErrors[field] = err;
    });
    setErrors(newErrors);
    setTouched((prev) => ({ ...prev, ...Object.fromEntries(fields.map((f) => [f, true])) }));
    return Object.keys(newErrors).length === 0;
  };

  const switchMode = (nextMode) => {
    setMode(nextMode);
    setErrors({});
    setGeneralError('');
    setSuccessMessage('');
  };

  const persistRememberMe = async () => {
    try {
      if (form.rememberMe) {
        await AsyncStorage.multiSet([[SAVED_EMAIL_KEY, form.email.trim()], [REMEMBER_KEY, 'true']]);
      } else {
        await AsyncStorage.multiRemove([SAVED_EMAIL_KEY, REMEMBER_KEY]);
      }
    } catch {
      // ignorăm erorile de storage — nu blochează autentificarea
    }
  };

  const submitLogin = async () => {
    if (!validateAll(['email', 'password'])) return;
    setSuccessMessage('');
    await persistRememberMe();
    onLogin(form.email.trim(), form.password);
  };

  const submitSignup = async () => {
    if (!validateAll(['name', 'email', 'password', 'confirmPassword', 'phone', 'agreeToTerms'])) return;
    setSubmitting(true);
    setGeneralError('');
    try {
      await onSignup?.({ name: form.name.trim(), email: form.email.trim(), password: form.password, phone: form.phone.trim() });
      setSuccessMessage('Cont creat! Verifică emailul pentru confirmare, apoi autentifică-te.');
      setMode('login');
      setForm((prev) => ({ ...prev, password: '', confirmPassword: '' }));
      setErrors({});
    } catch (e) {
      setGeneralError(e.message || 'Crearea contului a eșuat. Încearcă din nou.');
    } finally {
      setSubmitting(false);
    }
  };

  const submitReset = async () => {
    if (!validateAll(['email'])) return;
    setSubmitting(true);
    setGeneralError('');
    try {
      await onForgot?.(form.email.trim());
      setSuccessMessage('Ți-am trimis un link de resetare pe email.');
      setMode('login');
    } catch (e) {
      setGeneralError(e.message || 'Nu am putut trimite emailul de resetare.');
    } finally {
      setSubmitting(false);
    }
  };

  const busy = loading || submitting;
  const displayError = generalError || (mode === 'login' ? error : '');

  return (
    <View style={styles.container}>
      <ImageBackground
        source={{ uri: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=2000' }}
        style={styles.bgImage}
        imageStyle={{ opacity: 0.2 }}
      >
        <LinearGradient
          colors={[BG_DARK, 'transparent', BG_DARK]}
          style={StyleSheet.absoluteFill}
        />

        <SafeAreaView style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={styles.scrollContent}>

            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerLogo}>
                <View style={styles.logoBadge}>
                   <Shield size={20} color={CYAN} />
                </View>
                <View>
                  <Text style={styles.logoText}>FOOTBAL MANAGER 99</Text>
                  <Text style={styles.adminBadge}>ADMIN</Text>
                </View>
              </View>
              <View style={styles.langSelector}>
                <Globe size={14} color={C.muted} />
                <Text style={styles.langText}>Română</Text>
                <ChevronDown size={12} color={C.muted} />
              </View>
            </View>

            <View style={[styles.mainLayout, isDesktop && styles.desktopLayout]}>

              {/* Left Column: Branding */}
              <View style={styles.leftCol}>
                <View style={styles.bigShield}>
                   <Shield size={60} color="white" strokeWidth={1.5} />
                </View>
                <Text style={styles.mainTitle}>
                  Administrează clubul{"\n"}
                  tău <Text style={{ color: CYAN }}>inteligent</Text>
                </Text>
                <Text style={styles.subtitle}>
                  Gestionează jucători, antrenamente, meciuri și finanțe într-o platformă de performanță.
                </Text>

                <View style={styles.benefitList}>
                  <BenefitItem icon="Users" color={CYAN} title="Gestionează jucătorii" />
                  <BenefitItem icon="Dumbbell" color={VIOLET} title="Planifică antrenamente" />
                  <BenefitItem icon="Trophy" color={GREEN} title="Controlează clubul" />
                </View>
              </View>

              {/* Right Column: Auth Card */}
              <View style={styles.rightCol}>
                <BlurView intensity={20} tint="dark" style={styles.loginCard}>

                  {/* Success Message */}
                  {!!successMessage && (
                    <View style={styles.successBanner}>
                      <CheckCircle2 size={16} color={GREEN} />
                      <Text style={styles.successText}>{successMessage}</Text>
                    </View>
                  )}

                  {/* General Error */}
                  {!!displayError && (
                    <View style={styles.errorBanner}>
                      <AlertTriangle size={16} color={RED} />
                      <Text style={styles.errorBannerText}>{displayError}</Text>
                    </View>
                  )}

                  {/* Header */}
                  <Text style={styles.loginTitle}>
                    {mode === 'login' ? 'Bine ai revenit' : mode === 'reset' ? 'Resetare parolă' : 'Creează cont'}
                  </Text>
                  <Text style={styles.loginSubtitle}>
                    {mode === 'login' ? 'Autentifică-te în contul tău' : mode === 'reset' ? 'Recuperează accesul la cont' : 'Creează un cont nou'}
                  </Text>

                  {/* Mode Toggle Tabs */}
                  {mode !== 'reset' && (
                    <View style={styles.tabs}>
                      <Pressable
                        onPress={() => switchMode('login')}
                        style={[styles.tab, mode === 'login' && styles.tabActive]}
                      >
                        <Text style={[styles.tabText, mode === 'login' && styles.tabTextActive]}>Autentificare</Text>
                      </Pressable>
                      <Pressable
                        onPress={() => switchMode('signup')}
                        style={[styles.tab, mode === 'signup' && styles.tabActive]}
                      >
                        <Text style={[styles.tabText, mode === 'signup' && styles.tabTextActive]}>Cont nou</Text>
                      </Pressable>
                    </View>
                  )}

                  {/* Reset mode */}
                  {mode === 'reset' && (
                    <View style={styles.form}>
                      <View style={styles.resetHeader}>
                        <KeyRound size={44} color={CYAN} />
                        <Text style={styles.resetText}>
                          Introdu adresa de email și îți trimitem un link pentru resetarea parolei.
                        </Text>
                      </View>

                      <InputField
                        icon="Mail"
                        placeholder="Adresă de email"
                        value={form.email}
                        onChange={(v) => handleChange('email', v)}
                        onBlur={() => handleBlur('email')}
                        error={errors.email}
                        keyboardType="email-address"
                      />

                      <Pressable onPress={submitReset} disabled={busy || !form.email}>
                        <LinearGradient colors={[CYAN, VIOLET]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[styles.loginBtn, (busy || !form.email) && styles.btnDisabled]}>
                          {submitting ? <ActivityIndicator color="white" size="small" /> : (
                            <>
                              <KeyRound size={18} color="white" />
                              <Text style={styles.loginBtnText}>Trimite link de resetare</Text>
                            </>
                          )}
                        </LinearGradient>
                      </Pressable>

                      <Pressable onPress={() => switchMode('login')}>
                        <Text style={styles.linkCenter}>Înapoi la autentificare</Text>
                      </Pressable>
                    </View>
                  )}

                  {/* Login / Signup form */}
                  {mode !== 'reset' && (
                    <View style={styles.form}>
                      {mode === 'signup' && (
                        <InputField
                          icon="User"
                          placeholder="Nume complet"
                          value={form.name}
                          onChange={(v) => handleChange('name', v)}
                          onBlur={() => handleBlur('name')}
                          error={errors.name}
                          autoCapitalize="words"
                        />
                      )}

                      <InputField
                        icon="Mail"
                        placeholder="Adresă de email"
                        value={form.email}
                        onChange={(v) => handleChange('email', v)}
                        onBlur={() => handleBlur('email')}
                        error={errors.email}
                        keyboardType="email-address"
                      />

                      <View>
                        <InputField
                          icon="Lock"
                          placeholder="Parolă"
                          value={form.password}
                          onChange={(v) => handleChange('password', v)}
                          onBlur={() => handleBlur('password')}
                          error={errors.password}
                          secure
                          showPassword={showPassword}
                          onToggleShow={() => setShowPassword(!showPassword)}
                        />
                        {mode === 'signup' && <PasswordStrengthIndicator password={form.password} />}
                      </View>

                      {mode === 'signup' && (
                        <>
                          <InputField
                            icon="Shield"
                            placeholder="Confirmă parola"
                            value={form.confirmPassword}
                            onChange={(v) => handleChange('confirmPassword', v)}
                            onBlur={() => handleBlur('confirmPassword')}
                            error={errors.confirmPassword}
                            secure
                            showPassword={showConfirmPassword}
                            onToggleShow={() => setShowConfirmPassword(!showConfirmPassword)}
                          />

                          <InputField
                            icon="Phone"
                            placeholder="Telefon (opțional)"
                            value={form.phone}
                            onChange={(v) => handleChange('phone', v)}
                            onBlur={() => handleBlur('phone')}
                            error={errors.phone}
                            keyboardType="phone-pad"
                          />
                        </>
                      )}

                      {/* Options row */}
                      {mode === 'login' ? (
                        <View style={styles.formOptions}>
                          <Pressable style={styles.rememberRow} onPress={() => handleChange('rememberMe', !form.rememberMe)}>
                            <CheckBox checked={form.rememberMe} onToggle={() => handleChange('rememberMe', !form.rememberMe)} />
                            <Text style={styles.optionText}>Ține-mă minte</Text>
                          </Pressable>
                          <Pressable onPress={() => switchMode('reset')}>
                            <Text style={[styles.optionText, { color: CYAN }]}>Ai uitat parola?</Text>
                          </Pressable>
                        </View>
                      ) : (
                        <View>
                          <Pressable style={styles.termsRow} onPress={() => handleChange('agreeToTerms', !form.agreeToTerms)}>
                            <CheckBox checked={form.agreeToTerms} onToggle={() => handleChange('agreeToTerms', !form.agreeToTerms)} />
                            <Text style={[styles.optionText, { flex: 1 }]}>
                              Sunt de acord cu <Text style={{ color: CYAN }}>Termenii și condițiile</Text> și <Text style={{ color: CYAN }}>Politica de confidențialitate</Text>
                            </Text>
                          </Pressable>
                          <FieldError message={errors.agreeToTerms} />
                        </View>
                      )}

                      {/* Submit */}
                      <Pressable onPress={mode === 'login' ? submitLogin : submitSignup} disabled={busy}>
                        <LinearGradient
                          colors={[CYAN, VIOLET]}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                          style={[styles.loginBtn, busy && styles.btnDisabled]}
                        >
                          {busy ? <ActivityIndicator color="white" size="small" /> : (
                            <>
                              <Text style={styles.loginBtnText}>{mode === 'login' ? 'Conectează-te' : 'Creează cont'}</Text>
                              <ArrowRight size={20} color="white" />
                            </>
                          )}
                        </LinearGradient>
                      </Pressable>

                      {mode === 'login' && (
                        <>
                          <View style={styles.separator}>
                            <View style={styles.line} />
                            <Text style={styles.sepText}>SAU</Text>
                            <View style={styles.line} />
                          </View>

                          <Pressable style={styles.googleBtn} onPress={onGoogle}>
                            <Text style={styles.googleBtnText}>Continuă cu Google</Text>
                          </Pressable>
                        </>
                      )}

                      {/* Bottom toggle */}
                      <View style={styles.footerLinks}>
                        <Text style={styles.footerText}>
                          {mode === 'login' ? 'Nu ai cont? ' : 'Ai deja cont? '}
                        </Text>
                        <Pressable onPress={() => switchMode(mode === 'login' ? 'signup' : 'login')}>
                          <Text style={[styles.footerText, { color: CYAN, fontWeight: 'bold' }]}>
                            {mode === 'login' ? 'Creează cont' : 'Autentifică-te'}
                          </Text>
                        </Pressable>
                      </View>

                      {mode === 'signup' && !!onRegister && (
                        <Pressable onPress={onRegister}>
                          <Text style={styles.linkCenter}>Înregistrare jucător cu detalii complete</Text>
                        </Pressable>
                      )}
                    </View>
                  )}
                </BlurView>
              </View>

            </View>
          </ScrollView>
        </SafeAreaView>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG_DARK },
  bgImage: { flex: 1, width: '100%', height: '100%' },
  scrollContent: { paddingBottom: 40 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    height: 80,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  headerLogo: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logoBadge: { width: 36, height: 36, backgroundColor: '#0f172a', borderRadius: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  logoText: { color: 'white', fontWeight: '900', fontSize: 16, fontStyle: 'italic' },
  adminBadge: { color: CYAN, fontSize: 8, fontWeight: '900', letterSpacing: 1.5, marginTop: -3 },
  langSelector: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(15,23,42,0.5)', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  langText: { color: '#94A3B8', fontSize: 12, fontWeight: '600' },
  mainLayout: { padding: 24, alignItems: 'center' },
  desktopLayout: { flexDirection: 'row', justifyContent: 'center', gap: 60, paddingTop: 60 },
  leftCol: { alignItems: 'center', marginBottom: 40, width: '100%', maxWidth: 500 },
  bigShield: { padding: 20, backgroundColor: 'rgba(15,23,42,0.4)', borderRadius: 24, borderWidth: 1, borderColor: CYAN + '30', marginBottom: 20 },
  mainTitle: { color: 'white', fontSize: 32, fontWeight: '900', textAlign: 'center', lineHeight: 40 },
  subtitle: { color: '#94A3B8', fontSize: 14, textAlign: 'center', marginTop: 15, lineHeight: 22, maxWidth: 300 },
  benefitList: { marginTop: 30, gap: 12, width: '100%' },
  benefitItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(15,23,42,0.3)', padding: 12, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  benefitIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  benefitText: { color: '#E2E8F0', fontSize: 13, fontWeight: '700', marginLeft: 12 },
  rightCol: { width: '100%', maxWidth: 420 },
  loginCard: { padding: 30, borderRadius: 32, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', overflow: 'hidden', backgroundColor: 'rgba(15,23,42,0.4)' },
  loginTitle: { color: 'white', fontSize: 24, fontWeight: '900', textAlign: 'center' },
  loginSubtitle: { color: '#94A3B8', fontSize: 12, textAlign: 'center', marginTop: 5, textTransform: 'uppercase', letterSpacing: 1 },

  successBanner: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: 'rgba(34,197,94,0.12)', borderWidth: 1, borderColor: 'rgba(34,197,94,0.3)', borderRadius: 14, padding: 12, marginBottom: 18 },
  successText: { flex: 1, color: '#86EFAC', fontSize: 12, fontWeight: '700' },
  errorBanner: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: 'rgba(239,68,68,0.12)', borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)', borderRadius: 14, padding: 12, marginBottom: 18 },
  errorBannerText: { flex: 1, color: '#FCA5A5', fontSize: 12, fontWeight: '700' },

  tabs: { flexDirection: 'row', backgroundColor: 'rgba(2,6,23,0.6)', borderRadius: 14, padding: 4, marginTop: 24 },
  tab: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  tabActive: { backgroundColor: '#0f172a', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  tabText: { color: '#64748B', fontSize: 13, fontWeight: '800' },
  tabTextActive: { color: 'white' },

  form: { marginTop: 24, gap: 18 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(2,6,23,0.5)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 16, paddingHorizontal: 16, height: 56 },
  inputWrapperError: { borderColor: 'rgba(239,68,68,0.6)' },
  input: { flex: 1, color: 'white', fontSize: 14, fontWeight: '600' },
  fieldErrorRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 6, marginLeft: 4 },
  fieldErrorText: { color: RED, fontSize: 11, fontWeight: '700' },

  strengthWrap: { marginTop: 10, gap: 8 },
  strengthRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  strengthTrack: { flex: 1, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.08)', overflow: 'hidden' },
  strengthFill: { height: '100%', borderRadius: 3 },
  strengthLabel: { fontSize: 11, fontWeight: '800', minWidth: 70, textAlign: 'right' },
  strengthHints: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  strengthHint: { flexDirection: 'row', alignItems: 'center', gap: 4, width: '47%' },
  strengthHintText: { color: '#F59E0B', fontSize: 10, fontWeight: '600' },

  checkbox: { width: 18, height: 18, borderRadius: 5, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.25)', backgroundColor: 'rgba(2,6,23,0.5)', alignItems: 'center', justifyContent: 'center' },
  checkboxChecked: { backgroundColor: CYAN, borderColor: CYAN },
  rememberRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  termsRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },

  formOptions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 4 },
  optionText: { color: '#94A3B8', fontSize: 12, fontWeight: '700' },
  loginBtn: { height: 56, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, shadowColor: CYAN, shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.2, shadowRadius: 20 },
  btnDisabled: { opacity: 0.6 },
  loginBtnText: { color: 'white', fontWeight: '900', fontSize: 16 },
  separator: { flexDirection: 'row', alignItems: 'center', marginVertical: 4 },
  line: { flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.05)' },
  sepText: { color: '#475569', fontSize: 10, fontWeight: '900', marginHorizontal: 15 },
  googleBtn: { height: 56, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
  googleBtnText: { color: 'white', fontWeight: '700', fontSize: 14 },
  footerLinks: { flexDirection: 'row', justifyContent: 'center', marginTop: 4 },
  footerText: { color: '#94A3B8', fontSize: 13, fontWeight: '600' },
  linkCenter: { color: CYAN, fontSize: 12, fontWeight: '700', textAlign: 'center', marginTop: 4 },

  resetHeader: { alignItems: 'center', gap: 12, marginBottom: 4 },
  resetText: { color: '#94A3B8', fontSize: 13, textAlign: 'center', lineHeight: 20 },
});
