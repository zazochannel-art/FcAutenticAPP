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
  ActivityIndicator,
  useWindowDimensions
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import * as LucideIcons from 'lucide-react-native';
import { supabaseService } from '../services/supabaseService';
import { colors as C, spacing, radius } from '../constants/theme';

const CYAN = "#00D4FF";
const VIOLET = "#6A3CFF";
const BG_DARK = "#020617";
const CARD_BG = "rgba(15, 23, 42, 0.65)";
const BORDER_COLOR = "rgba(0, 212, 255, 0.15)";

export default function CreateClubSaaS({ userId, onBack, onSuccess }) {
  const { width } = useWindowDimensions();
  const isMobile = width < 1024;

  const [step, setStep] = useState(1);
  const [isPublishing, setIsPublishing] = useState(false);
  const [form, setForm] = useState({
    name: '',
    description: '',
    city: '',
    country: 'România',
    season: '2025 / 2026',
    ageGroups: ['U13', 'U15', 'U17'],
    primaryColor: '#00D4FF',
    secondaryColor: '#6A3CFF',
    clubType: 'Amator',
    adminName: '',
    adminEmail: '',
  });

  const handleInputChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const toggleAgeGroup = (group) => {
    const active = form.ageGroups.includes(group);
    handleInputChange('ageGroups', active ? form.ageGroups.filter(g => g !== group) : [...form.ageGroups, group]);
  };

  const handleFinalSubmit = async () => {
    if (!form.name || !form.city || !form.adminEmail) {
      Alert.alert('Informații lipsă', 'Te rugăm să completezi câmpurile obligatorii (*)');
      return;
    }
    setIsPublishing(true);
    try {
      const newClub = await supabaseService.createClub(userId, form);
      setIsPublishing(false);
      onSuccess?.(newClub);
    } catch (err) {
      setIsPublishing(false);
      Alert.alert('Eroare', err.message);
    }
  };

  return (
    <View style={styles.container}>
      {/* Background Abstract Grid / Glow */}
      <View style={styles.bgDecor}>
        <View style={styles.glowTop} />
        <View style={styles.glowBottom} />
        {/* Subtle Pitch Lines could be added here as SVG or Image */}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Header Superior with Stepper */}
        <View style={styles.header}>
           <View style={styles.headerBrand}>
              <View style={styles.logoBadge}><LucideIcons.Shield size={22} color={CYAN} /></View>
              <View>
                 <Text style={styles.brandTitle}>FC AUTENTIC</Text>
                 <Text style={styles.brandSub}>ADMIN</Text>
              </View>
           </View>

           <View style={styles.stepperContainer}>
             <View style={styles.stepper}>
                <View style={[styles.stepCircle, step >= 1 && styles.stepActive]}>
                   <Text style={[styles.stepNum, step >= 1 && { color: BG_DARK }]}>1</Text>
                </View>
                <View style={[styles.stepLine, step >= 2 && styles.stepLineActive]} />
                <View style={[styles.stepCircle, step >= 2 && styles.stepActive]}>
                   <Text style={[styles.stepNum, step >= 2 && { color: BG_DARK }]}>2</Text>
                </View>
                <View style={[styles.stepLine, step >= 3 && styles.stepLineActive]} />
                <View style={[styles.stepCircle, step >= 3 && styles.stepActive]}>
                   <Text style={[styles.stepNum, step >= 3 && { color: BG_DARK }]}>3</Text>
                </View>
             </View>
             <View style={styles.stepInfo}>
                <Text style={styles.stepCount}>Pasul {step} din 3</Text>
                <Text style={styles.stepLabel}>Informații club</Text>
             </View>
           </View>
        </View>

        {/* Title Section */}
        <View style={styles.titleSection}>
           <View style={styles.accentLine} />
           <View style={{ flex: 1 }}>
              <Text style={styles.mainTitle}>Creează clubul tău</Text>
              <Text style={styles.mainSub}>Completează informațiile de bază pentru a-ți crea clubul și a începe călătoria în FC Autentic.</Text>
           </View>
        </View>

        <View style={[styles.layoutRow, !isMobile && styles.desktopLayoutRow]}>

          {/* Column Left: Form (60%) */}
          <View style={[styles.formSide, !isMobile && { flex: 1.5 }]}>
            <BlurView intensity={30} tint="dark" style={styles.formCard}>

              <View style={styles.sectionHeader}>
                <LucideIcons.Shield size={18} color={CYAN} />
                <Text style={styles.sectionTitle}>Informații despre club</Text>
              </View>

              <View style={styles.gridRow}>
                <InputGroup
                  label="Numele clubului *"
                  placeholder="Ex: FC Autentic București"
                  icon="Shield"
                  value={form.name}
                  onChange={v => handleInputChange('name', v)}
                  style={{ flex: 1 }}
                />
                <View style={{ flex: 1, marginLeft: 16 }}>
                   <Text style={styles.label}>Scurtă descriere *</Text>
                   <View style={[styles.textAreaWrap]}>
                     <TextInput
                        style={styles.textArea}
                        multiline
                        numberOfLines={4}
                        placeholder="Viziunea clubului..."
                        placeholderTextColor="#475569"
                        value={form.description}
                        onChangeText={v => handleInputChange('description', v)}
                     />
                     <Text style={styles.charCounter}>{form.description.length}/160</Text>
                   </View>
                </View>
              </View>

              <View style={[styles.gridRow, { marginTop: 16 }]}>
                <InputGroup
                  label="Oraș *"
                  placeholder="Ex: București"
                  icon="MapPin"
                  value={form.city}
                  onChange={v => handleInputChange('city', v)}
                  style={{ flex: 1 }}
                />
                <View style={{ flex: 1, marginLeft: 16 }}>
                   <Text style={styles.label}>Țara *</Text>
                   <View style={styles.inputWrapper}>
                      <LucideIcons.Globe size={18} color="#64748B" style={{ marginRight: 10 }} />
                      <Text style={{ color: 'white', flex: 1 }}>România</Text>
                      <LucideIcons.ChevronDown size={14} color="#64748B" />
                   </View>
                </View>
              </View>

              <View style={[styles.gridRow, { marginTop: 16 }]}>
                <View style={{ flex: 1 }}>
                   <Text style={styles.label}>Sezon *</Text>
                   <View style={styles.inputWrapper}>
                      <LucideIcons.Calendar size={18} color="#64748B" style={{ marginRight: 10 }} />
                      <Text style={{ color: 'white', flex: 1 }}>2025 / 2026</Text>
                      <LucideIcons.ChevronDown size={14} color="#64748B" />
                   </View>
                </View>
                <View style={{ flex: 1, marginLeft: 16 }}>
                   <Text style={styles.label}>Grupe de vârstă *</Text>
                   <View style={styles.pillRow}>
                      {['U7', 'U9', 'U11', 'U13', 'U15', 'U17', 'U19'].map(g => (
                        <Pressable key={g} onPress={() => toggleAgeGroup(g)} style={[styles.pill, form.ageGroups.includes(g) && styles.pillActive]}>
                          <Text style={[styles.pillText, form.ageGroups.includes(g) && styles.pillTextActive]}>{g}</Text>
                        </Pressable>
                      ))}
                      <Pressable style={styles.addPill}><LucideIcons.Plus size={14} color={CYAN} /></Pressable>
                   </View>
                </View>
              </View>

              <View style={[styles.gridRow, { marginTop: 24 }]}>
                 <View style={{ flex: 1 }}>
                    <Text style={styles.label}>Culori principale *</Text>
                    <View style={styles.colorRow}>
                       <View style={styles.colorPicker}>
                          <View style={[styles.colorDot, { backgroundColor: CYAN }]} />
                          <Text style={styles.colorHex}>#00D4FF</Text>
                          <LucideIcons.ChevronDown size={12} color="#64748B" />
                       </View>
                       <View style={[styles.colorPicker, { marginLeft: 12 }]}>
                          <View style={[styles.colorDot, { backgroundColor: VIOLET }]} />
                          <Text style={styles.colorHex}>#6A3CFF</Text>
                          <LucideIcons.ChevronDown size={12} color="#64748B" />
                       </View>
                    </View>
                 </View>
                 <View style={{ flex: 1, marginLeft: 16 }}>
                    <Text style={styles.label}>Tip club *</Text>
                    <View style={styles.typeSelector}>
                       <Pressable style={[styles.typeBtn, styles.typeBtnActive]}><LucideIcons.Users size={14} color={CYAN} /><Text style={styles.typeBtnTextActive}>Amator</Text></Pressable>
                       <Pressable style={styles.typeBtn}><LucideIcons.User size={14} color="#64748B" /><Text style={styles.typeBtnText}>Juniori</Text></Pressable>
                    </View>
                 </View>
              </View>

              <View style={{ marginTop: 24 }}>
                <Text style={styles.label}>Încarcă logo</Text>
                <View style={styles.uploadContainer}>
                  <View style={styles.uploadBox}>
                    <View style={styles.uploadIconWrap}><LucideIcons.Upload size={20} color="#64748B" /></View>
                    <View style={{ marginLeft: 16, flex: 1 }}>
                      <Text style={styles.uploadTitle}>Trage și plasează fișierul aici</Text>
                      <Text style={styles.uploadMeta}>PNG, JPG sau SVG, max. 2MB</Text>
                    </View>
                    <Pressable style={styles.chooseFileBtn}><Text style={styles.chooseFileText}>Alege fișier</Text></Pressable>
                  </View>
                  <View style={styles.uploadInfo}>
                    <LucideIcons.Info size={14} color={VIOLET} />
                    <Text style={styles.infoMeta}>Recomandat: imagine pătrată min. 512x512px. Fundal transparent recomandat.</Text>
                  </View>
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.sectionHeader}>
                <LucideIcons.Users size={18} color={CYAN} />
                <Text style={styles.sectionTitle}>Administrator principal</Text>
              </View>

              <View style={styles.gridRow}>
                <InputGroup
                  label="Nume și prenume *"
                  placeholder="Ex: Andrei Popescu"
                  icon="User"
                  value={form.adminName}
                  onChange={v => handleInputChange('adminName', v)}
                  style={{ flex: 1 }}
                />
                <View style={{ flex: 1, marginLeft: 16 }}>
                  <InputGroup
                    label="Email *"
                    placeholder="Ex: andrei.popescu@email.com"
                    icon="Mail"
                    value={form.adminEmail}
                    onChange={v => handleInputChange('adminEmail', v)}
                  />
                  <Text style={styles.inputHelp}>Pe această adresă vei primi toate notificările importante.</Text>
                </View>
              </View>

            </BlurView>
          </View>

          {/* Column Right: Preview (40%) */}
          <View style={[styles.previewSide, !isMobile && { flex: 1 }]}>
             <View style={styles.previewHeader}>
                <LucideIcons.Eye size={16} color={CYAN} />
                <Text style={styles.previewHeading}>Previzualizare club</Text>
             </View>

             <View style={styles.previewCard}>
                <LinearGradient colors={["#0F172A", "#020617"]} style={styles.previewInner}>
                   <View style={styles.previewHero}>
                      <View style={styles.previewShield}>
                         <LucideIcons.Shield size={42} color={CYAN} />
                         <LucideIcons.Circle size={30} color={CYAN + "20"} style={{ position: 'absolute' }} />
                      </View>
                      <View style={{ marginLeft: 20 }}>
                         <Text style={styles.previewClubName}>{form.name || 'Nume Club'}</Text>
                         <View style={styles.previewMetaRow}>
                            <LucideIcons.MapPin size={12} color={CYAN} />
                            <Text style={styles.previewMetaText}>{form.city || 'Orașul tău'}, România</Text>
                         </View>
                         <View style={[styles.previewMetaRow, { marginTop: 4 }]}>
                            <LucideIcons.Calendar size={12} color={CYAN} />
                            <Text style={styles.previewMetaText}>Sezon {form.season}</Text>
                         </View>
                      </View>
                   </View>

                   <View style={styles.previewColors}>
                      <View style={styles.previewColorItem}><View style={[styles.colorSquare, { backgroundColor: CYAN }]} /><Text style={styles.colorLabel}>Primară</Text></View>
                      <View style={[styles.previewColorItem, { marginLeft: 20 }]}><View style={[styles.colorSquare, { backgroundColor: VIOLET }]} /><Text style={styles.colorLabel}>Secundară</Text></View>
                   </View>

                   <Text style={styles.previewSecTitle}>Grupe de vârstă</Text>
                   <View style={styles.previewPills}>
                      {form.ageGroups.map(g => (
                        <View key={g} style={styles.miniPill}><Text style={styles.miniPillText}>{g}</Text></View>
                      ))}
                   </View>

                   <Text style={styles.previewSecTitle}>Tip club</Text>
                   <View style={styles.typeBadge}><Text style={styles.typeBadgeText}>Amator</Text></View>

                   <View style={styles.prevDivider} />

                   <Text style={styles.previewSecTitle}>Rezumat club</Text>
                   <View style={styles.summaryGrid}>
                      <SummaryCard icon="Users" val="0" label="Jucători" />
                      <SummaryCard icon="Users" val="0" label="Staff" />
                      <SummaryCard icon="Trophy" val="0" label="Trofee" />
                      <SummaryCard icon="Calendar" val="0" label="Evenimente" />
                   </View>

                   <View style={styles.liveNotice}>
                      <LucideIcons.Info size={14} color={VIOLET} />
                      <Text style={styles.noticeText}>Previzualizarea este actualizată în timp real pe măsură ce completezi datele.</Text>
                   </View>
                </LinearGradient>
             </View>
          </View>

        </View>

        {/* Footer Actions */}
        <View style={styles.footer}>
           <Pressable style={styles.btnSecondary} onPress={onBack}>
              <LucideIcons.ArrowLeft size={18} color="#94A3B8" />
              <Text style={styles.btnSecondaryText}>Înapoi</Text>
           </Pressable>

           <View style={{ alignItems: 'center' }}>
              <Pressable style={styles.btnOutline}>
                 <LucideIcons.Save size={18} color="white" />
                 <Text style={styles.btnOutlineText}>Salvează draft</Text>
              </Pressable>
              <Text style={styles.footerNote}>Poți continua editarea oricând înainte de publicare.</Text>
           </View>

           <Pressable onPress={handleFinalSubmit} disabled={isPublishing}>
              <LinearGradient colors={[CYAN, VIOLET]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.btnPrimary}>
                 {isPublishing ? <ActivityIndicator color="white" size="small" /> : (
                   <>
                    <Text style={styles.btnPrimaryText}>Creează clubul</Text>
                    <LucideIcons.ArrowRight size={18} color="white" />
                   </>
                 )}
              </LinearGradient>
           </Pressable>
        </View>

      </ScrollView>
    </View>
  );
}

function InputGroup({ label, placeholder, icon, value, onChange, style }) {
  const Icon = LucideIcons[icon];
  return (
    <View style={[styles.inputGroup, style]}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputWrapper}>
        <Icon size={18} color="#64748B" style={{ marginRight: 12 }} />
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor="#475569"
          value={value}
          onChangeText={onChange}
        />
      </View>
    </View>
  );
}

function SummaryCard({ icon, val, label }) {
  const Icon = LucideIcons[icon];
  return (
    <View style={styles.summaryCard}>
       <Icon size={16} color="#64748B" />
       <Text style={styles.summaryVal}>{val}</Text>
       <Text style={styles.summaryLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG_DARK },
  bgDecor: { ...StyleSheet.absoluteFillObject },
  glowTop: { position: 'absolute', top: -150, right: -150, width: 400, height: 400, borderRadius: 200, backgroundColor: CYAN + '10' },
  glowBottom: { position: 'absolute', bottom: -150, left: -150, width: 400, height: 400, borderRadius: 200, backgroundColor: VIOLET + '10' },

  scrollContent: { padding: 24, paddingBottom: 100 },

  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 40 },
  headerBrand: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  logoBadge: { width: 40, height: 40, backgroundColor: 'rgba(15,23,42,0.8)', borderRadius: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: BORDER_COLOR },
  brandTitle: { color: 'white', fontWeight: '900', fontSize: 16 },
  brandSub: { color: CYAN, fontSize: 8, fontWeight: '900', letterSpacing: 2, marginTop: -2 },

  stepperContainer: { flexDirection: 'row', alignItems: 'center', gap: 24 },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  stepCircle: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#1e293b', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  stepActive: { backgroundColor: CYAN, shadowColor: CYAN, shadowRadius: 10, shadowOpacity: 0.5 },
  stepNum: { color: '#64748B', fontSize: 11, fontWeight: '900' },
  stepLine: { width: 30, height: 1.5, backgroundColor: '#1e293b' },
  stepLineActive: { backgroundColor: CYAN + '40' },
  stepInfo: { alignItems: 'flex-end' },
  stepCount: { color: CYAN, fontSize: 10, fontWeight: '900', textTransform: 'uppercase' },
  stepLabel: { color: '#64748B', fontSize: 9, fontWeight: 'bold', marginTop: 2, textTransform: 'uppercase' },

  titleSection: { flexDirection: 'row', gap: 16, marginBottom: 32 },
  accentLine: { width: 4, backgroundColor: CYAN, borderRadius: 2, height: 60, shadowColor: CYAN, shadowRadius: 15, shadowOpacity: 0.6 },
  mainTitle: { color: 'white', fontSize: 32, fontWeight: '900', letterSpacing: -0.5 },
  mainSub: { color: '#94A3B8', fontSize: 14, fontWeight: '600', marginTop: 6, lineHeight: 22 },

  layoutRow: { gap: 32 },
  desktopLayoutRow: { flexDirection: 'row' },
  formSide: { flex: 1 },
  previewSide: { flex: 1 },

  formCard: { backgroundColor: CARD_BG, borderRadius: 24, padding: 32, borderWidth: 1, borderColor: BORDER_COLOR, shadowColor: CYAN, shadowRadius: 30, shadowOpacity: 0.05 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 24 },
  sectionTitle: { color: 'white', fontSize: 15, fontWeight: '900', letterSpacing: 1, textTransform: 'uppercase' },

  gridRow: { flexDirection: 'row' },
  inputGroup: { marginBottom: 20 },
  label: { color: '#94A3B8', fontSize: 10, fontWeight: "900", letterSpacing: 1, marginBottom: 10, textTransform: "uppercase" },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(2,6,23,0.5)', borderWidth: 1, borderColor: '#1e293b', borderRadius: 14, paddingHorizontal: 16, height: 52 },
  input: { flex: 1, color: 'white', fontSize: 14, fontWeight: '600' },

  textAreaWrap: { backgroundColor: 'rgba(2,6,23,0.5)', borderWidth: 1, borderColor: '#1e293b', borderRadius: 14, padding: 16, height: 120 },
  textArea: { flex: 1, color: 'white', fontSize: 14, fontWeight: '600', textAlignVertical: 'top' },
  charCounter: { color: '#475569', fontSize: 10, fontWeight: '900', alignSelf: 'flex-end', marginTop: 4 },

  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20, borderWidth: 1, borderColor: '#1e293b', backgroundColor: 'rgba(255,255,255,0.02)' },
  pillActive: { borderColor: CYAN, backgroundColor: CYAN + '10' },
  pillText: { color: '#475569', fontSize: 10, fontWeight: '900' },
  pillTextActive: { color: CYAN },
  addPill: { width: 38, height: 38, borderRadius: 19, borderStyle: 'dashed', borderWidth: 1, borderColor: CYAN, alignItems: 'center', justifyContent: 'center' },

  colorRow: { flexDirection: 'row' },
  colorPicker: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(2,6,23,0.5)', borderWidth: 1, borderColor: '#1e293b', borderRadius: 14, paddingHorizontal: 12, height: 52 },
  colorDot: { width: 14, height: 14, borderRadius: 7 },
  colorHex: { color: 'white', fontSize: 11, fontWeight: '900', flex: 1, marginLeft: 10 },

  typeSelector: { flexDirection: 'row', backgroundColor: 'rgba(2,6,23,0.5)', padding: 5, borderRadius: 14, borderWidth: 1, borderColor: '#1e293b' },
  typeBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 10, borderRadius: 10 },
  typeBtnActive: { backgroundColor: CYAN + '15', borderWidth: 1, borderColor: CYAN + '30' },
  typeBtnText: { color: '#64748B', fontSize: 10, fontWeight: '900', textTransform: 'uppercase' },
  typeBtnTextActive: { color: 'white', fontSize: 10, fontWeight: '900', textTransform: 'uppercase' },

  uploadContainer: { marginTop: 8 },
  uploadBox: { flexDirection: 'row', alignItems: 'center', borderStyle: 'dashed', borderWidth: 1.5, borderColor: '#1e293b', borderRadius: 16, padding: 20, backgroundColor: 'rgba(255,255,255,0.02)' },
  uploadIconWrap: { width: 44, height: 44, borderRadius: 22, backgroundColor: BG_DARK, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#1e293b' },
  uploadTitle: { color: 'white', fontSize: 12, fontWeight: '800' },
  uploadMeta: { color: '#64748B', fontSize: 9, fontWeight: '700', marginTop: 2 },
  chooseFileBtn: { backgroundColor: '#1e293b', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10 },
  chooseFileText: { color: 'white', fontSize: 10, fontWeight: '900', textTransform: 'uppercase' },
  uploadInfo: { flexDirection: 'row', gap: 10, marginTop: 12, paddingHorizontal: 8 },
  infoMeta: { color: '#64748B', fontSize: 9, fontWeight: '600', lineHeight: 14, flex: 1 },

  divider: { width: '100%', height: 1, backgroundColor: 'rgba(255,255,255,0.05)', marginVertical: 32 },
  inputHelp: { color: '#64748B', fontSize: 10, fontWeight: '600', marginTop: 8, marginLeft: 4 },

  previewHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16, marginLeft: 8 },
  previewHeading: { color: '#64748B', fontSize: 12, fontWeight: '900', letterSpacing: 1.5, textTransform: 'uppercase' },
  previewCard: { borderRadius: 32, overflow: 'hidden', borderWidth: 1, borderColor: BORDER_COLOR, shadowColor: '#000', shadowRadius: 40, shadowOpacity: 0.6 },
  previewInner: { padding: 32 },
  previewHero: { flexDirection: 'row', alignItems: 'center' },
  previewShield: { width: 100, height: 100, borderRadius: 24, backgroundColor: BG_DARK, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: CYAN, shadowColor: CYAN, shadowRadius: 30, shadowOpacity: 0.3 },
  previewClubName: { color: 'white', fontSize: 28, fontWeight: '900', letterSpacing: -0.5 },
  previewMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  previewMetaText: { color: '#94A3B8', fontSize: 13, fontWeight: '700' },

  previewColors: { flexDirection: 'row', marginTop: 24 },
  previewColorItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  colorSquare: { width: 14, height: 14, borderRadius: 4 },
  colorLabel: { color: '#64748B', fontSize: 11, fontWeight: '800' },

  previewSecTitle: { color: '#475569', fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1.5, marginTop: 32, marginBottom: 12 },
  previewPills: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  miniPill: { backgroundColor: '#1e293b', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  miniPillText: { color: CYAN, fontSize: 10, fontWeight: '900' },

  typeBadge: { backgroundColor: CYAN + '10', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, alignSelf: 'flex-start', borderWidth: 1, borderColor: CYAN + '20' },
  typeBadgeText: { color: CYAN, fontSize: 11, fontWeight: '900', textTransform: 'uppercase' },

  prevDivider: { width: '100%', height: 1, backgroundColor: 'rgba(255,255,255,0.05)', marginVertical: 32 },

  summaryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  summaryCard: { flex: 1, minWidth: '45%', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 16, padding: 20, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  summaryVal: { color: 'white', fontSize: 24, fontWeight: '900', marginTop: 12 },
  summaryLabel: { color: '#64748B', fontSize: 10, fontWeight: '800', textTransform: 'uppercase', marginTop: 4 },

  liveNotice: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: VIOLET + '08', padding: 16, borderRadius: 16, marginTop: 32, borderWidth: 1, borderColor: VIOLET + '20' },
  noticeText: { flex: 1, color: '#94A3B8', fontSize: 11, fontWeight: '600', lineHeight: 16 },

  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)', paddingTop: 32, marginTop: 40 },
  btnSecondary: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 24, paddingVertical: 14, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  btnSecondaryText: { color: '#94A3B8', fontSize: 13, fontWeight: '900', textTransform: 'uppercase' },

  btnOutline: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 24, paddingVertical: 14, borderRadius: 16, borderWidth: 1, borderColor: '#1e293b' },
  btnOutlineText: { color: 'white', fontSize: 13, fontWeight: '900', textTransform: 'uppercase' },
  footerNote: { color: '#475569', fontSize: 9, fontWeight: '800', textTransform: 'uppercase', marginTop: 10 },

  btnPrimary: { height: 56, paddingHorizontal: 32, borderRadius: 16, flexDirection: 'row', alignItems: 'center', gap: 12, shadowColor: CYAN, shadowRadius: 20, shadowOpacity: 0.4 },
  btnPrimaryText: { color: 'white', fontWeight: '900', fontSize: 14, textTransform: 'uppercase', letterSpacing: 0.5 }
});
