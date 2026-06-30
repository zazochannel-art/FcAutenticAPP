import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  Dimensions,
  Platform,
  Alert,
  ActivityIndicator
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Shield,
  MapPin,
  Globe,
  Calendar,
  Users,
  Trophy,
  Eye,
  Upload,
  ChevronLeft,
  ArrowRight,
  Save,
  Info,
  Plus,
  UserPlus,
  Trash2,
  CheckCircle2,
  ShieldCheck,
  Building2,
  CreditCard
} from 'lucide-react-native';
import { supabaseService } from '../../supabaseService';
import { colors as C } from '../constants/theme';

const { width } = Dimensions.get('window');
const CYAN = "#00D4FF";
const VIOLET = "#6A3CFF";
const BG_DARK = "#020617";

export default function CreateClubSaaS({ userId, onBack, onSuccess }) {
  const [step, setStep] = useState(1);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [form, setForm] = useState({
    name: '',
    description: '',
    city: '',
    country: 'România',
    season: '2025 / 2026',
    ageGroups: ['U13', 'U15', 'U17'],
    primaryColor: CYAN,
    secondaryColor: VIOLET,
    clubType: 'Amator',
    adminName: '',
    adminEmail: '',
    staff: [],
    groupDetails: [],
  });

  const [newStaff, setNewStaff] = useState({ name: '', email: '', role: 'Antrenor' });

  // Sync groupDetails with ageGroups
  useEffect(() => {
    const existingAgeGroups = form.groupDetails.map(d => d.ageGroup);
    const newAgeGroups = form.ageGroups.filter(ag => !existingAgeGroups.includes(ag));
    const removedAgeGroups = existingAgeGroups.filter(ag => !form.ageGroups.includes(ag));

    const updatedGroupDetails = form.groupDetails
      .filter(d => !removedAgeGroups.includes(d.ageGroup))
      .concat(newAgeGroups.map(ag => ({
        id: Math.random().toString(36).substr(2, 9),
        ageGroup: ag,
        customName: ag,
        coachId: '',
        sessionsPerWeek: 3
      })));

    setForm(prev => ({ ...prev, groupDetails: updatedGroupDetails }));
  }, [form.ageGroups]);

  const handleInputChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const toggleAgeGroup = (group) => {
    const active = form.ageGroups.includes(group);
    handleInputChange('ageGroups', active ? form.ageGroups.filter(g => g !== group) : [...form.ageGroups, group]);
  };

  const addStaff = () => {
    if (!newStaff.name || !newStaff.email) return;
    const member = { ...newStaff, id: Math.random().toString(36).substr(2, 9) };
    setForm(prev => ({ ...prev, staff: [...prev.staff, member] }));
    setNewStaff({ name: '', email: '', role: 'Antrenor' });
  };

  const removeStaff = (id) => {
    setForm(prev => ({ ...prev, staff: prev.staff.filter(s => s.id !== id) }));
  };

  const handleNext = () => {
    if (step === 1 && (!form.name || !form.city)) {
      Alert.alert('Informații lipsă', 'Te rugăm să completezi numele și orașul clubului.');
      return;
    }
    if (step === 3) {
      handleFinalSubmit();
      return;
    }
    setStep(prev => prev + 1);
  };

  const handlePrev = () => {
    if (step === 1) {
      onBack?.();
      return;
    }
    setStep(prev => prev - 1);
  };

  const handleFinalSubmit = async () => {
    setIsPublishing(true);
    try {
      const newClub = await supabaseService.createClub(userId, form);
      setIsPublishing(false);
      setIsSuccess(true);
      onSuccess?.(newClub);
    } catch (err) {
      setIsPublishing(false);
      Alert.alert('Eroare', err.message);
    }
  };

  if (isSuccess) {
    return (
      <View style={styles.successContainer}>
        <View style={styles.successCard}>
          <View style={styles.successIconOuter}>
            <ShieldCheck size={48} color={CYAN} />
          </View>
          <Text style={styles.successTitle}>FELICITĂRI!</Text>
          <Text style={styles.successDesc}>Clubul <Text style={{color: 'white', fontWeight: 'bold'}}>{form.name}</Text> a fost creat cu succes!</Text>
          <Pressable style={styles.primaryBtn} onPress={() => onSuccess?.()}>
            <Text style={styles.primaryBtnText}>INTRĂ ÎN PANOU</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Background Decor */}
      <View style={styles.bgDecor}>
        <View style={styles.glowTop} />
        <View style={styles.glowBottom} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
           <View style={styles.headerBrand}>
              <View style={styles.logoBadge}><Shield size={20} color={CYAN} /></View>
              <View>
                 <Text style={styles.brandTitle}>FC AUTENTIC</Text>
                 <Text style={styles.brandSub}>ADMIN</Text>
              </View>
           </View>
           <View style={styles.stepper}>
              <View style={[styles.stepCircle, step >= 1 && styles.stepActive]}>
                 {step > 1 ? <CheckCircle2 size={12} color={BG_DARK} /> : <Text style={styles.stepNum}>1</Text>}
              </View>
              <View style={[styles.stepLine, step >= 2 && styles.stepLineActive]} />
              <View style={[styles.stepCircle, step >= 2 && styles.stepActive]}>
                 {step > 2 ? <CheckCircle2 size={12} color={BG_DARK} /> : <Text style={styles.stepNum}>2</Text>}
              </View>
              <View style={[styles.stepLine, step >= 3 && styles.stepLineActive]} />
              <View style={[styles.stepCircle, step >= 3 && styles.stepActive]}>
                 <Text style={styles.stepNum}>3</Text>
              </View>
           </View>
        </View>

        <View style={styles.titleSection}>
           <View style={styles.accentLine} />
           <View>
              <Text style={styles.mainTitle}>CREEAZĂ CLUBUL TĂU</Text>
              <Text style={styles.mainSub}>Pasul {step} din 3 • {step === 1 ? 'Informații club' : step === 2 ? 'Staff și Grupe' : 'Sumar'}</Text>
           </View>
        </View>

        {step === 1 && (
          <View style={styles.formCard}>
            <View style={styles.sectionHeader}>
               <Shield size={18} color={CYAN} />
               <Text style={styles.sectionTitle}>INFORMAȚII DESPRE CLUB</Text>
            </View>

            <InputGroup label="Numele clubului *" placeholder="Ex: FC Autentic București" value={form.name} onChange={v => handleInputChange('name', v)} />
            <InputGroup label="Oraș *" placeholder="Ex: București" value={form.city} onChange={v => handleInputChange('city', v)} />

            <Text style={styles.label}>Grupe de vârstă *</Text>
            <View style={styles.pillRow}>
              {['U7', 'U9', 'U11', 'U13', 'U15', 'U17', 'U19'].map(g => (
                <Pressable key={g} onPress={() => toggleAgeGroup(g)} style={[styles.pill, form.ageGroups.includes(g) && styles.pillActive]}>
                  <Text style={[styles.pillText, form.ageGroups.includes(g) && styles.pillTextActive]}>{g}</Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.label}>Descriere viziune *</Text>
            <TextInput
              style={styles.textArea}
              multiline
              placeholder="Spune-ne despre viziunea clubului tău..."
              placeholderTextColor="#475569"
              value={form.description}
              onChangeText={v => handleInputChange('description', v)}
            />
          </View>
        )}

        {step === 2 && (
          <View style={styles.formCard}>
            <View style={styles.sectionHeader}>
               <Users size={18} color={CYAN} />
               <Text style={styles.sectionTitle}>STAFF ADMINISTRATIV</Text>
            </View>
            <View style={styles.staffInputRow}>
               <TextInput style={[styles.input, {flex: 1}]} placeholder="Nume" placeholderTextColor="#475569" value={newStaff.name} onChangeText={v => setNewStaff({...newStaff, name: v})} />
               <TextInput style={[styles.input, {flex: 1, marginHorizontal: 8}]} placeholder="Email" placeholderTextColor="#475569" value={newStaff.email} onChangeText={v => setNewStaff({...newStaff, email: v})} />
               <Pressable style={styles.addBtn} onPress={addStaff}><Plus size={20} color={BG_DARK} /></Pressable>
            </View>
            {form.staff.map(s => (
              <View key={s.id} style={styles.staffItem}>
                <View>
                   <Text style={{color: 'white', fontWeight: 'bold'}}>{s.name}</Text>
                   <Text style={{color: '#64748B', fontSize: 10}}>{s.email}</Text>
                </View>
                <Pressable onPress={() => removeStaff(s.id)}><Trash2 size={16} color="#EF4444" /></Pressable>
              </View>
            ))}
          </View>
        )}

        {step === 3 && (
          <View style={styles.formCard}>
             <View style={styles.sectionHeader}>
                <ShieldCheck size={18} color={CYAN} />
                <Text style={styles.sectionTitle}>SUMAR FINAL</Text>
             </View>
             <View style={styles.summaryItem}>
                <Building2 size={16} color="#64748B" />
                <Text style={styles.summaryText}>{form.name} • {form.city}</Text>
             </View>
             <View style={styles.summaryItem}>
                <Users size={16} color="#64748B" />
                <Text style={styles.summaryText}>{form.staff.length} Membri Staff • {form.ageGroups.length} Grupe</Text>
             </View>
             <View style={styles.infoBox}>
                <Rocket size={20} color={CYAN} />
                <Text style={styles.infoText}>Ești gata pentru lansare! Platforma va genera automat tot ecosistemul tău digital.</Text>
             </View>
          </View>
        )}

        {/* Preview Section */}
        <View style={styles.previewContainer}>
          <View style={styles.previewHeader}>
            <Eye size={14} color="#94A3B8" />
            <Text style={styles.previewTitle}>PREVIZUALIZARE CLUB</Text>
          </View>
          <BlurView intensity={20} tint="dark" style={styles.previewCard}>
             <View style={styles.previewLogo}><Shield size={32} color={CYAN} /></View>
             <Text style={styles.previewName}>{form.name || 'Nume Club'}</Text>
             <Text style={styles.previewLoc}>{form.city || 'Oraș'}, {form.country}</Text>
             <View style={styles.previewPills}>
                {form.ageGroups.map(g => (
                  <View key={g} style={styles.miniPill}><Text style={styles.miniPillText}>{g}</Text></View>
                ))}
             </View>
          </BlurView>
        </View>

      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
         <Pressable style={styles.backBtn} onPress={handlePrev}>
            <ChevronLeft size={20} color="#94A3B8" />
            <Text style={styles.backBtnText}>ÎNAPOI</Text>
         </Pressable>

         <Pressable onPress={handleNext} disabled={isPublishing}>
            <LinearGradient colors={[CYAN, VIOLET]} start={{x:0, y:0}} end={{x:1, y:0}} style={styles.nextBtn}>
               {isPublishing ? <ActivityIndicator color="white" /> : (
                 <>
                  <Text style={styles.nextBtnText}>{step === 3 ? 'LANSEAZĂ CLUBUL' : 'URMĂTORUL PAS'}</Text>
                  <ArrowRight size={18} color="white" />
                 </>
               )}
            </LinearGradient>
         </Pressable>
      </View>
    </View>
  );
}

function InputGroup({ label, placeholder, value, onChange }) {
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor="#475569"
        value={value}
        onChangeText={onChange}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG_DARK },
  bgDecor: { ...StyleSheet.absoluteFillObject, overflow: 'hidden' },
  glowTop: { position: 'absolute', top: -100, right: -100, width: 300, height: 300, borderRadius: 150, backgroundColor: CYAN + '15', blur: 100 },
  glowBottom: { position: 'absolute', bottom: -100, left: -100, width: 300, height: 300, borderRadius: 150, backgroundColor: VIOLET + '15', blur: 100 },
  scrollContent: { padding: 20, paddingBottom: 150 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 },
  headerBrand: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logoBadge: { width: 36, height: 36, backgroundColor: '#0f172a', borderRadius: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  brandTitle: { color: 'white', fontWeight: '900', fontSize: 14 },
  brandSub: { color: CYAN, fontSize: 8, fontWeight: '900', letterSpacing: 1.5, marginTop: -3 },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  stepCircle: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#1e293b', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  stepActive: { backgroundColor: CYAN, borderColor: CYAN },
  stepNum: { color: '#94A3B8', fontSize: 9, fontWeight: 'bold' },
  stepLine: { width: 20, height: 2, backgroundColor: '#1e293b' },
  stepLineActive: { backgroundColor: CYAN + '40' },
  titleSection: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  accentLine: { width: 3, backgroundColor: CYAN, borderRadius: 2, height: 40 },
  mainTitle: { color: 'white', fontSize: 22, fontWeight: '900' },
  mainSub: { color: '#94A3B8', fontSize: 11, fontWeight: 'bold', marginTop: 2, textTransform: 'uppercase' },
  formCard: { backgroundColor: 'rgba(15,23,42,0.6)', borderRadius: 20, padding: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 20 },
  sectionTitle: { color: 'white', fontSize: 13, fontWeight: '900', letterSpacing: 1 },
  inputGroup: { marginBottom: 16 },
  label: { color: '#94A3B8', fontSize: 10, fontWeight: '900', letterSpacing: 1, marginBottom: 8, textTransform: 'uppercase' },
  input: { backgroundColor: 'rgba(2,6,23,0.5)', borderWidth: 1, borderColor: '#1e293b', borderRadius: 12, paddingHorizontal: 16, height: 48, color: 'white', fontSize: 13 },
  textArea: { backgroundColor: 'rgba(2,6,23,0.5)', borderWidth: 1, borderColor: '#1e293b', borderRadius: 12, padding: 16, height: 100, color: 'white', fontSize: 13, textAlignVertical: 'top' },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  pill: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#1e293b', backgroundColor: 'rgba(2,6,23,0.3)' },
  pillActive: { borderColor: CYAN, backgroundColor: CYAN + '15' },
  pillText: { color: '#64748B', fontSize: 10, fontWeight: '900' },
  pillTextActive: { color: CYAN },
  staffInputRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  addBtn: { width: 40, height: 40, borderRadius: 10, backgroundColor: CYAN, alignItems: 'center', justifyContent: 'center' },
  staffItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(2,6,23,0.3)', padding: 12, borderRadius: 12, marginBottom: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.04)' },
  summaryItem: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 15 },
  summaryText: { color: 'white', fontWeight: 'bold', fontSize: 14 },
  infoBox: { flexDirection: 'row', gap: 12, backgroundColor: CYAN + '08', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: CYAN + '20', marginTop: 10 },
  infoText: { flex: 1, color: '#94A3B8', fontSize: 11, lineHeight: 16 },
  previewContainer: { marginTop: 30 },
  previewHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12, marginLeft: 5 },
  previewTitle: { color: '#475569', fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  previewCard: { borderRadius: 24, padding: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', backgroundColor: 'rgba(15,23,42,0.3)', alignItems: 'center', overflow: 'hidden' },
  previewLogo: { width: 60, height: 60, borderRadius: 16, backgroundColor: BG_DARK, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: CYAN, marginBottom: 15 },
  previewName: { color: 'white', fontSize: 20, fontWeight: '900' },
  previewLoc: { color: '#94A3B8', fontSize: 12, fontWeight: 'bold', marginTop: 4 },
  previewPills: { flexDirection: 'row', gap: 5, marginTop: 15 },
  miniPill: { backgroundColor: '#1e293b', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  miniPillText: { color: CYAN, fontSize: 8, fontWeight: 'black' },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: BG_DARK, padding: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)' },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  backBtnText: { color: '#94A3B8', fontSize: 11, fontWeight: '900' },
  nextBtn: { height: 56, paddingHorizontal: 30, borderRadius: 16, flexDirection: 'row', alignItems: 'center', gap: 12 },
  nextBtnText: { color: 'white', fontWeight: '900', fontSize: 13, letterSpacing: 1 },
  successContainer: { flex: 1, backgroundColor: BG_DARK, alignItems: 'center', justifyContent: 'center', padding: 30 },
  successCard: { backgroundColor: 'rgba(15,23,42,0.6)', borderRadius: 40, padding: 40, alignItems: 'center', borderWidth: 1, borderColor: CYAN + '30', width: '100%' },
  successIconOuter: { width: 100, height: 100, borderRadius: 50, backgroundColor: CYAN + '15', alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  successTitle: { color: 'white', fontSize: 24, fontWeight: '900', letterSpacing: 2 },
  successDesc: { color: '#94A3B8', textAlign: 'center', fontSize: 16, marginTop: 10, marginBottom: 30 },
  primaryBtn: { backgroundColor: CYAN, width: '100%', height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  primaryBtnText: { color: BG_DARK, fontWeight: '900', fontSize: 14 }
});
