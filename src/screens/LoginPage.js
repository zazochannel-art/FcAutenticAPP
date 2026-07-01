import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  ScrollView,
  ImageBackground,
  Dimensions,
  Platform,
  Pressable,
  SafeAreaView
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Shield,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Users,
  Dumbbell,
  Trophy,
  Globe,
  ChevronDown
} from 'lucide-react-native';

const { width, height } = Dimensions.get('window');
const isDesktop = width > 768;

const CYAN = "#06B6D4";
const VIOLET = "#7C3AED";
const GREEN = "#22C55E";
const BG_DARK = "#020617";

export default function LoginPage({ onLogin, onBack, onRegister, onGoogle, onForgot, loading, error }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  return (
    <View style={styles.container}>
      <ImageBackground
        source={{ uri: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=2000' }}
        style={styles.bgImage}
        imageStyle={{ opacity: 0.2, grayscale: 1 }}
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
                  <Text style={styles.logoText}>FC AUTENTIC</Text>
                  <Text style={styles.adminBadge}>ADMIN</Text>
                </View>
              </View>
              <View style={styles.langSelector}>
                <Globe size={14} color="#94A3B8" />
                <Text style={styles.langText}>Română</Text>
                <ChevronDown size={12} color="#94A3B8" />
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

              {/* Right Column: Login Card */}
              <View style={styles.rightCol}>
                <BlurView intensity={20} tint="dark" style={styles.loginCard}>
                  <Text style={styles.loginTitle}>Bine ai revenit</Text>
                  <Text style={styles.loginSubtitle}>Autentifică-te pentru a continua</Text>

                  <View style={styles.form}>
                    <InputGroup
                      label="Email"
                      icon="Mail"
                      placeholder="exemplu@fcautentic.ro"
                      value={email}
                      onChange={setEmail}
                    />

                    <InputGroup
                      label="Parolă"
                      icon="Lock"
                      placeholder="Introdu parola ta"
                      secure={!showPassword}
                      value={password}
                      onChange={setPassword}
                      onToggleShow={() => setShowPassword(!showPassword)}
                      showPassword={showPassword}
                    />

                    <View style={styles.formOptions}>
                      <Text style={styles.optionText}>Ține-mă minte</Text>
                      <Pressable onPress={() => onForgot?.(email)}>
                        <Text style={[styles.optionText, { color: CYAN }]}>Ai uitat parola?</Text>
                      </Pressable>
                    </View>

                    <Pressable onPress={() => onLogin(email, password)}>
                      <LinearGradient
                        colors={[CYAN, VIOLET]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.loginBtn}
                      >
                        <Text style={styles.loginBtnText}>{loading ? "Se verifică..." : "Conectează-te"}</Text>
                        <ArrowRight size={20} color="white" />
                      </LinearGradient>
                    </Pressable>

                    {!!error && <Text style={{ color: 'red', fontSize: 12, textAlign: 'center', marginTop: 10 }}>{error}</Text>}

                    <View style={styles.separator}>
                      <View style={styles.line} />
                      <Text style={styles.sepText}>SAU</Text>
                      <View style={styles.line} />
                    </View>

                    <Pressable style={styles.googleBtn} onPress={onGoogle}>
                      <Text style={styles.googleBtnText}>Continuă cu Google</Text>
                    </Pressable>

                    <View style={styles.footerLinks}>
                      <Text style={styles.footerText}>Nu ai cont? </Text>
                      <Pressable onPress={onRegister}>
                        <Text style={[styles.footerText, { color: CYAN, fontWeight: 'bold' }]}>Creează cont</Text>
                      </Pressable>
                    </View>
                  </View>
                </BlurView>
              </View>

            </View>
          </ScrollView>
        </SafeAreaView>
      </ImageBackground>
    </View>
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

function InputGroup({ label, icon, placeholder, secure, value, onChange, onToggleShow, showPassword }) {
  const Icon = { Mail, Lock }[icon];
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>{label}</Text>
      <View style={styles.inputWrapper}>
        <Icon size={18} color="#64748B" style={{ marginRight: 10 }} />
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor="#475569"
          secureTextEntry={secure}
          value={value}
          onChangeText={onChange}
        />
        {onToggleShow && (
          <Pressable onPress={onToggleShow}>
            {showPassword ? <EyeOff size={18} color="#64748B" /> : <Eye size={18} color="#64748B" />}
          </Pressable>
        )}
      </View>
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
  form: { marginTop: 30, gap: 20 },
  inputGroup: { gap: 8 },
  inputLabel: { color: '#94A3B8', fontSize: 10, fontWeight: '900', letterSpacing: 1, textTransform: 'uppercase', marginLeft: 4 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(2,6,23,0.5)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 16, paddingHorizontal: 16, height: 56 },
  input: { flex: 1, color: 'white', fontSize: 14, fontWeight: '600' },
  formOptions: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 4 },
  optionText: { color: '#94A3B8', fontSize: 12, fontWeight: '700' },
  loginBtn: { height: 56, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, shadowColor: CYAN, shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.2, shadowRadius: 20 },
  loginBtnText: { color: 'white', fontWeight: '900', fontSize: 16 },
  separator: { flexDirection: 'row', alignItems: 'center', marginVertical: 10 },
  line: { flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.05)' },
  sepText: { color: '#475569', fontSize: 10, fontWeight: '900', marginHorizontal: 15 },
  googleBtn: { height: 56, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
  googleBtnText: { color: 'white', fontWeight: '700', fontSize: 14 },
  footerLinks: { flexDirection: 'row', justifyContent: 'center', marginTop: 10 },
  footerText: { color: '#94A3B8', fontSize: 13, fontWeight: '600' }
});
