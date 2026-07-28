import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  Platform,
  Alert,
  ActivityIndicator,
  useWindowDimensions
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import * as DocumentPicker from 'expo-document-picker';
import * as LucideIcons from 'lucide-react-native';
import { supabaseService } from '../services/supabaseService';
import { colors as C, themedStyles } from "../constants/theme";
import { BRAND_NAME } from "../constants/brand";

const VIOLET = "#6A3CFF";
const BG_DARK = "#020617";
const CARD_BG = "rgba(15, 23, 42, 0.65)";
const BORDER_COLOR = "rgba(0, 212, 255, 0.15)";
const COUNTRY_OPTIONS = ['România', 'Moldova', 'Italia', 'Spania', 'Germania', 'Franța'];
const SEASON_OPTIONS = ['2025 / 2026', '2026 / 2027', '2027 / 2028'];
const COLOR_PRESETS = [
  { label: 'Cyan', value: '#00D4FF' },
  { label: 'Violet', value: '#6A3CFF' },
  { label: 'Portocaliu', value: '#F97316' },
  { label: 'Verde', value: '#22C55E' },
  { label: 'Roșu', value: '#EF4444' },
  { label: 'Galben', value: '#FACC15' },
];
const CLUB_TYPES = ['Amator', 'Juniori', 'Profesionist', 'Academie'];
const DESCRIPTION_MAX = 160;
const LOGO_MAX_BYTES = 2 * 1024 * 1024;
const EMAIL_RE = /^\S+@\S+\.\S+$/;
const STEP_LABELS = { 1: 'Informații club', 2: 'Administrator', 3: 'Gata de publicare' };

// Alert.alert este no-op pe react-native-web, deci pe web folosim window.alert.
function notify(title, message) {
  if (Platform.OS === 'web') {
    window.alert(`${title}\n\n${message}`);
  } else {
    Alert.alert(title, message);
  }
}

export default function CreateClubSaaS({ userId, currentUser, onBack, onSuccess }) {
  const { width } = useWindowDimensions();
  const isMobile = width < 1024;

  const [isPublishing, setIsPublishing] = useState(false);
  const [formError, setFormError] = useState('');
  const [activePicker, setActivePicker] = useState(null);
  const [customGroup, setCustomGroup] = useState('');
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
    logo: '',
    logoName: '',
    adminName: '',
    adminEmail: '',
  });

  useEffect(() => {
    if (!currentUser) return;
    setForm((prev) => ({
      ...prev,
      adminName: prev.adminName || currentUser.full_name || currentUser.name || '',
      adminEmail: prev.adminEmail || currentUser.email || '',
    }));
  }, [currentUser]);

  const clubInfoComplete =
    form.name.trim().length > 0 && form.description.trim().length > 0 && form.city.trim().length > 0;
  const adminComplete = form.adminName.trim().length > 0 && EMAIL_RE.test(form.adminEmail.trim());
  const step = !clubInfoComplete ? 1 : !adminComplete ? 2 : 3;

  const handleInputChange = (field, value) => {
    setFormError('');
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const toggleAgeGroup = (group) => {
    const active = form.ageGroups.includes(group);
    handleInputChange('ageGroups', active ? form.ageGroups.filter(g => g !== group) : [...form.ageGroups, group]);
  };

  const addCustomGroup = () => {
    const g = customGroup.trim();
    if (!g) return;
    if (!form.ageGroups.includes(g)) {
      handleInputChange('ageGroups', [...form.ageGroups, g]);
    }
    setCustomGroup('');
  };

  const selectOption = (field, value) => {
    handleInputChange(field, value);
    setActivePicker(null);
  };

  const pickLogo = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/png', 'image/jpeg', 'image/svg+xml'],
        copyToCacheDirectory: true,
        multiple: false,
      });
      if (result.canceled) return;
      const asset = result.assets?.[0];
      if (!asset) return;
      if (asset.size && asset.size > LOGO_MAX_BYTES) {
        notify('Logo prea mare', 'Alege un fișier de maximum 2MB.');
        return;
      }
      handleInputChange('logo', asset.uri || '');
      handleInputChange('logoName', asset.name || 'Logo selectat');
    } catch (error) {
      notify('Logo club', error.message || 'Nu am putut selecta logo-ul.');
    }
  };

  const validateForm = () => {
    if (!form.name.trim()) return 'Completează numele clubului.';
    if (!form.description.trim()) return 'Adaugă o scurtă descriere a clubului.';
    if (!form.city.trim()) return 'Completează orașul clubului.';
    if (form.ageGroups.length === 0) return 'Selectează cel puțin o grupă de vârstă.';
    if (!form.adminName.trim()) return 'Completează numele administratorului.';
    if (!EMAIL_RE.test(form.adminEmail.trim())) return 'Introdu o adresă de email validă.';
    return null;
  };

  const handleFinalSubmit = async () => {
    const validationError = validateForm();
    if (validationError) {
      setFormError(validationError);
      return;
    }
    if (!userId) {
      setFormError('Nu am găsit utilizatorul conectat. Te rugăm să te autentifici din nou.');
      return;
    }
    setFormError('');
    setIsPublishing(true);
    try {
      const newClub = await supabaseService.createClub(userId, form);
      onSuccess?.(newClub);
    } catch (err) {
      setIsPublishing(false);
      setFormError(err.message || 'Nu am putut crea clubul. Încearcă din nou.');
    }
  };

  return (
    <View style={styles.container}>
      {/* Background Abstract Grid / Glow */}
      <View style={styles.bgDecor}>
        <View style={styles.glowTop} />
        <View style={styles.glowBottom} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, isMobile && styles.scrollContentMobile]}
        showsVerticalScrollIndicator={false}
      >

        {/* Header Superior with Stepper */}
        <View style={styles.header}>
           <View style={styles.headerBrand}>
              <View style={styles.logoBadge}><LucideIcons.Shield size={22} color={C.cyan} /></View>
              <View>
                 <Text style={styles.brandTitle}>FOOTBAL MANAGER 99</Text>
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
                <Text style={styles.stepLabel}>{STEP_LABELS[step]}</Text>
             </View>
           </View>
        </View>

        {/* Title Section */}
        <View style={styles.titleSection}>
           <View style={styles.accentLine} />
           <View style={{ flex: 1 }}>
              <Text style={styles.mainTitle}>Creează clubul tău</Text>
              <Text style={styles.mainSub}>Completează informațiile de bază pentru a-ți crea clubul și a începe călătoria în {BRAND_NAME}.</Text>
           </View>
        </View>

        <View style={[styles.layoutRow, !isMobile && styles.desktopLayoutRow]}>

          {/* Column Left: Form (60%) */}
          <View style={[styles.formSide, !isMobile && { flex: 1.5 }]}>
            <BlurView intensity={30} tint="dark" style={styles.formCard}>

              <View style={styles.sectionHeader}>
                <LucideIcons.Shield size={18} color={C.cyan} />
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
                        maxLength={DESCRIPTION_MAX}
                        placeholder="Viziunea clubului..."
                        placeholderTextColor={C.dim}
                        value={form.description}
                        onChangeText={v => handleInputChange('description', v)}
                     />
                     <Text style={styles.charCounter}>{form.description.length}/{DESCRIPTION_MAX}</Text>
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
                   <Pressable style={styles.inputWrapper} onPress={() => setActivePicker(activePicker === 'country' ? null : 'country')}>
                      <LucideIcons.Globe size={18} color="#64748B" style={{ marginRight: 10 }} />
                      <Text style={{ color: C.text, flex: 1 }}>{form.country}</Text>
                      <LucideIcons.ChevronDown size={14} color="#64748B" />
                   </Pressable>
                   {activePicker === 'country' && (
                     <OptionPanel options={COUNTRY_OPTIONS} value={form.country} onSelect={(value) => selectOption('country', value)} />
                   )}
                </View>
              </View>

              <View style={[styles.gridRow, { marginTop: 16 }]}
              >
                <View style={{ flex: 1 }}>
                   <Text style={styles.label}>Sezon *</Text>
                   <Pressable style={styles.inputWrapper} onPress={() => setActivePicker(activePicker === 'season' ? null : 'season')}>
                      <LucideIcons.Calendar size={18} color="#64748B" style={{ marginRight: 10 }} />
                      <Text style={{ color: C.text, flex: 1 }}>{form.season}</Text>
                      <LucideIcons.ChevronDown size={14} color="#64748B" />
                   </Pressable>
                   {activePicker === 'season' && (
                     <OptionPanel options={SEASON_OPTIONS} value={form.season} onSelect={(value) => selectOption('season', value)} />
                   )}
                </View>
                <View style={{ flex: 1, marginLeft: 16 }}>
                   <Text style={styles.label}>Grupe de vârstă *</Text>
                   <View style={styles.pillRow}>
                      {['U7', 'U9', 'U11', 'U13', 'U15', 'U17', 'U19'].map(g => (
                        <Pressable key={g} onPress={() => toggleAgeGroup(g)} style={[styles.pill, form.ageGroups.includes(g) && styles.pillActive]}>
                          <Text style={[styles.pillText, form.ageGroups.includes(g) && styles.pillTextActive]}>{g}</Text>
                        </Pressable>
                      ))}
                      {form.ageGroups.filter(g => !['U7','U9','U11','U13','U15','U17','U19'].includes(g)).map(g => (
                        <Pressable key={g} onPress={() => toggleAgeGroup(g)} style={[styles.pill, styles.pillActive]}>
                          <Text style={[styles.pillText, styles.pillTextActive]}>{g}  ✕</Text>
                        </Pressable>
                      ))}
                   </View>
                   <View style={styles.customGroupRow}>
                      <TextInput
                        style={styles.customGroupInput}
                        value={customGroup}
                        onChangeText={setCustomGroup}
                        onSubmitEditing={addCustomGroup}
                        placeholder="Adaugă grupă (ex: Seniori)"
                        placeholderTextColor={C.dim}
                      />
                      <Pressable style={styles.addPill} onPress={addCustomGroup}><LucideIcons.Plus size={14} color={C.cyan} /></Pressable>
                   </View>
                </View>
              </View>

              <View style={[styles.gridRow, { marginTop: 24 }]}>
                 <View style={{ flex: 1 }}>
                    <Text style={styles.label}>Culori principale *</Text>
                    <View style={styles.colorRow}>
                       <Pressable style={styles.colorPicker} onPress={() => setActivePicker(activePicker === "primaryColor" ? null : "primaryColor")}>
                          <View style={[styles.colorDot, { backgroundColor: form.primaryColor }]} />
                          <Text style={styles.colorHex}>{form.primaryColor}</Text>
                          <LucideIcons.ChevronDown size={12} color="#64748B" />
                       </Pressable>
                       <Pressable style={[styles.colorPicker, { marginLeft: 12 }]} onPress={() => setActivePicker(activePicker === "secondaryColor" ? null : "secondaryColor")}>
                          <View style={[styles.colorDot, { backgroundColor: form.secondaryColor }]} />
                          <Text style={styles.colorHex}>{form.secondaryColor}</Text>
                          <LucideIcons.ChevronDown size={12} color="#64748B" />
                       </Pressable>
                    </View>
                    {activePicker === "primaryColor" && <ColorPanel value={form.primaryColor} onSelect={(value) => selectOption("primaryColor", value)} />}
                    {activePicker === "secondaryColor" && <ColorPanel value={form.secondaryColor} onSelect={(value) => selectOption("secondaryColor", value)} />}
                 </View>
                 <View style={{ flex: 1, marginLeft: 16 }}>
                    <Text style={styles.label}>Tip club *</Text>
                    <View style={styles.typeSelector}>
                       {CLUB_TYPES.map((type) => (
                         <Pressable key={type} onPress={() => handleInputChange("clubType", type)} style={[styles.typeBtn, form.clubType === type && styles.typeBtnActive]}>
                           <LucideIcons.Users size={14} color={form.clubType === type ? C.cyan : "#64748B"} />
                           <Text style={form.clubType === type ? styles.typeBtnTextActive : styles.typeBtnText}>{type}</Text>
                         </Pressable>
                       ))}
                    </View>
                 </View>
              </View>

              <View style={{ marginTop: 24 }}>
                <Text style={styles.label}>Încarcă logo</Text>
                <View style={styles.uploadContainer}>
                  <Pressable style={styles.uploadBox} onPress={pickLogo}>
                    <View style={styles.uploadIconWrap}><LucideIcons.Upload size={20} color={form.logo ? C.cyan : "#64748B"} /></View>
                    <View style={{ marginLeft: 16, flex: 1 }}>
                      <Text style={styles.uploadTitle}>{form.logoName || "Alege logo-ul clubului"}</Text>
                      <Text style={styles.uploadMeta}>{form.logo ? "Logo selectat pentru club" : "PNG, JPG sau SVG, max. 2MB"}</Text>
                    </View>
                    <View style={styles.chooseFileBtn}><Text style={styles.chooseFileText}>Alege fișier</Text></View>
                  </Pressable>
                  <View style={styles.uploadInfo}>
                    <LucideIcons.Info size={14} color={VIOLET} />
                    <Text style={styles.infoMeta}>Logo-ul se salvează în formular și se trimite împreună cu datele clubului.</Text>
                  </View>
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.sectionHeader}>
                <LucideIcons.Users size={18} color={C.cyan} />
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
                <LucideIcons.Eye size={16} color={C.cyan} />
                <Text style={styles.previewHeading}>Previzualizare club</Text>
             </View>

             <View style={styles.previewCard}>
                <LinearGradient colors={["#0F172A", "#020617"]} style={styles.previewInner}>
                   <View style={styles.previewHero}>
                      <View style={styles.previewShield}>
                         <LucideIcons.Shield size={42} color={C.cyan} />
                         <LucideIcons.Circle size={30} color={C.cyan + "20"} style={{ position: 'absolute' }} />
                      </View>
                      <View style={{ marginLeft: 20 }}>
                         <Text style={styles.previewClubName}>{form.name || 'Nume Club'}</Text>
                         <View style={styles.previewMetaRow}>
                            <LucideIcons.MapPin size={12} color={C.cyan} />
                            <Text style={styles.previewMetaText}>{form.city || 'Orașul tău'}, {form.country}</Text>
                         </View>
                         <View style={[styles.previewMetaRow, { marginTop: 4 }]}>
                            <LucideIcons.Calendar size={12} color={C.cyan} />
                            <Text style={styles.previewMetaText}>Sezon {form.season}</Text>
                         </View>
                      </View>
                   </View>

                   <View style={styles.previewColors}>
                      <View style={styles.previewColorItem}><View style={[styles.colorSquare, { backgroundColor: form.primaryColor }]} /><Text style={styles.colorLabel}>Primară</Text></View>
                      <View style={[styles.previewColorItem, { marginLeft: 20 }]}><View style={[styles.colorSquare, { backgroundColor: form.secondaryColor }]} /><Text style={styles.colorLabel}>Secundară</Text></View>
                   </View>

                   <Text style={styles.previewSecTitle}>Grupe de vârstă</Text>
                   <View style={styles.previewPills}>
                      {form.ageGroups.map(g => (
                        <View key={g} style={styles.miniPill}><Text style={styles.miniPillText}>{g}</Text></View>
                      ))}
                   </View>

                   <Text style={styles.previewSecTitle}>Tip club</Text>
                   <View style={styles.typeBadge}><Text style={styles.typeBadgeText}>{form.clubType}</Text></View>

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

      </ScrollView>

      <View style={styles.stickyFooter}>
         {formError ? (
           <View style={styles.errorBanner}>
              <LucideIcons.AlertTriangle size={14} color="#F87171" />
              <Text style={styles.errorText}>{formError}</Text>
           </View>
         ) : null}

         <View style={[styles.footerButtons, isMobile && styles.footerButtonsMobile]}>
            <Pressable style={[styles.btnSecondary, isMobile && styles.mobileFooterButton]} onPress={onBack}>
               <LucideIcons.ArrowLeft size={18} color={C.muted} />
               <Text style={styles.btnSecondaryText}>Înapoi</Text>
            </Pressable>

            <Pressable
              onPress={handleFinalSubmit}
              disabled={isPublishing}
              style={[styles.primaryPressable, isMobile && styles.mobileFooterButton, isPublishing && styles.disabledButton]}
            >
               <LinearGradient colors={[C.cyan, VIOLET]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.btnPrimary}>
                  {isPublishing ? <ActivityIndicator color="white" size="small" /> : (
                    <>
                     <Text style={styles.btnPrimaryText}>Finalizează clubul</Text>
                     <LucideIcons.CheckCircle2 size={18} color="white" />
                    </>
                  )}
               </LinearGradient>
            </Pressable>
         </View>
      </View>
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
          placeholderTextColor={C.dim}
          value={value}
          onChangeText={onChange}
        />
      </View>
    </View>
  );
}

function OptionPanel({ options, value, onSelect }) {
  return (
    <View style={styles.optionPanel}>
      {options.map((option) => (
        <Pressable
          key={option}
          onPress={() => onSelect(option)}
          style={[styles.optionItem, value === option && styles.optionItemActive]}
        >
          <Text style={[styles.optionText, value === option && styles.optionTextActive]}>{option}</Text>
          {value === option && <LucideIcons.Check size={14} color={C.cyan} />}
        </Pressable>
      ))}
    </View>
  );
}

function ColorPanel({ value, onSelect }) {
  return (
    <View style={styles.colorPanel}>
      {COLOR_PRESETS.map((color) => (
        <Pressable
          key={color.value}
          onPress={() => onSelect(color.value)}
          style={[styles.colorOption, value === color.value && styles.colorOptionActive]}
        >
          <View style={[styles.colorOptionDot, { backgroundColor: color.value }]} />
          <Text style={styles.colorOptionText}>{color.label}</Text>
        </Pressable>
      ))}
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

const styles = themedStyles((C) => StyleSheet.create({
  container: { flex: 1, backgroundColor: "transparent" },
  bgDecor: { ...StyleSheet.absoluteFillObject },
  glowTop: { position: 'absolute', top: -150, right: -150, width: 400, height: 400, borderRadius: 200, backgroundColor: C.cyan + '10' },
  glowBottom: { position: 'absolute', bottom: -150, left: -150, width: 400, height: 400, borderRadius: 200, backgroundColor: VIOLET + '10' },

  scrollView: { flex: 1 },
  scrollContent: { padding: 24, paddingBottom: 190 },
  scrollContentMobile: { paddingBottom: 300 },

  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 40 },
  headerBrand: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  logoBadge: { width: 40, height: 40, backgroundColor: 'rgba(15,23,42,0.8)', borderRadius: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: BORDER_COLOR },
  brandTitle: { color: C.text, fontWeight: '900', fontSize: 16 },
  brandSub: { color: C.cyan, fontSize: 8, fontWeight: '900', letterSpacing: 2, marginTop: -2 },

  stepperContainer: { flexDirection: 'row', alignItems: 'center', gap: 24 },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  stepCircle: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#1e293b', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  stepActive: { backgroundColor: C.cyan, shadowColor: C.cyan, shadowRadius: 10, shadowOpacity: 0.5 },
  stepNum: { color: '#64748B', fontSize: 11, fontWeight: '900' },
  stepLine: { width: 30, height: 1.5, backgroundColor: '#1e293b' },
  stepLineActive: { backgroundColor: C.cyan + '40' },
  stepInfo: { alignItems: 'flex-end' },
  stepCount: { color: C.cyan, fontSize: 10, fontWeight: '900', textTransform: 'uppercase' },
  stepLabel: { color: '#64748B', fontSize: 9, fontWeight: 'bold', marginTop: 2, textTransform: 'uppercase' },

  titleSection: { flexDirection: 'row', gap: 16, marginBottom: 32 },
  accentLine: { width: 4, backgroundColor: C.cyan, borderRadius: 2, height: 60, shadowColor: C.cyan, shadowRadius: 15, shadowOpacity: 0.6 },
  mainTitle: { color: C.text, fontSize: 32, fontWeight: '900', letterSpacing: -0.5 },
  mainSub: { color: '#94A3B8', fontSize: 14, fontWeight: '600', marginTop: 6, lineHeight: 22 },

  layoutRow: { gap: 32 },
  desktopLayoutRow: { flexDirection: 'row' },
  formSide: { flex: 1 },
  previewSide: { flex: 1 },

  formCard: { backgroundColor: CARD_BG, borderRadius: 24, padding: 32, borderWidth: 1, borderColor: BORDER_COLOR, shadowColor: C.cyan, shadowRadius: 30, shadowOpacity: 0.05 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 24 },
  sectionTitle: { color: C.text, fontSize: 15, fontWeight: '900', letterSpacing: 1, textTransform: 'uppercase' },

  gridRow: { flexDirection: 'row' },
  inputGroup: { marginBottom: 20 },
  label: { color: '#94A3B8', fontSize: 10, fontWeight: "900", letterSpacing: 1, marginBottom: 10, textTransform: "uppercase" },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(2,6,23,0.5)', borderWidth: 1, borderColor: '#1e293b', borderRadius: 14, paddingHorizontal: 16, height: 52 },
  input: { flex: 1, color: C.text, fontSize: 14, fontWeight: '600' },
  optionPanel: { marginTop: 8, backgroundColor: 'rgba(2,6,23,0.92)', borderWidth: 1, borderColor: BORDER_COLOR, borderRadius: 14, overflow: 'hidden' },
  optionItem: { minHeight: 42, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.04)' },
  optionItemActive: { backgroundColor: C.cyan + '12' },
  optionText: { color: '#94A3B8', fontSize: 12, fontWeight: '800' },
  optionTextActive: { color: C.text },

  textAreaWrap: { backgroundColor: 'rgba(2,6,23,0.5)', borderWidth: 1, borderColor: '#1e293b', borderRadius: 14, padding: 16, height: 120 },
  textArea: { flex: 1, color: C.text, fontSize: 14, fontWeight: '600', textAlignVertical: 'top' },
  charCounter: { color: '#475569', fontSize: 10, fontWeight: '900', alignSelf: 'flex-end', marginTop: 4 },

  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20, borderWidth: 1, borderColor: '#1e293b', backgroundColor: 'rgba(255,255,255,0.02)' },
  pillActive: { borderColor: C.cyan, backgroundColor: C.cyan + '10' },
  pillText: { color: '#475569', fontSize: 10, fontWeight: '900' },
  pillTextActive: { color: C.cyan },
  addPill: { width: 38, height: 38, borderRadius: 19, borderStyle: 'dashed', borderWidth: 1, borderColor: C.cyan, alignItems: 'center', justifyContent: 'center' },
  customGroupRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10 },
  customGroupInput: { flex: 1, height: 40, backgroundColor: 'rgba(2,6,23,0.5)', borderWidth: 1, borderColor: '#1e293b', borderRadius: 12, paddingHorizontal: 12, color: C.text, fontSize: 12, fontWeight: '600' },

  colorRow: { flexDirection: 'row' },
  colorPicker: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(2,6,23,0.5)', borderWidth: 1, borderColor: '#1e293b', borderRadius: 14, paddingHorizontal: 12, height: 52 },
  colorDot: { width: 14, height: 14, borderRadius: 7 },
  colorHex: { color: C.text, fontSize: 11, fontWeight: '900', flex: 1, marginLeft: 10 },
  colorPanel: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10, padding: 10, backgroundColor: 'rgba(2,6,23,0.7)', borderWidth: 1, borderColor: BORDER_COLOR, borderRadius: 14 },
  colorOption: { width: '31%', minHeight: 38, borderRadius: 12, borderWidth: 1, borderColor: '#1e293b', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, gap: 6 },
  colorOptionActive: { borderColor: C.cyan, backgroundColor: C.cyan + '10' },
  colorOptionDot: { width: 14, height: 14, borderRadius: 7 },
  colorOptionText: { color: '#94A3B8', fontSize: 9, fontWeight: '800' },

  typeSelector: { flexDirection: 'row', backgroundColor: 'rgba(2,6,23,0.5)', padding: 5, borderRadius: 14, borderWidth: 1, borderColor: '#1e293b' },
  typeBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 10, borderRadius: 10 },
  typeBtnActive: { backgroundColor: C.cyan + '15', borderWidth: 1, borderColor: C.cyan + '30' },
  typeBtnText: { color: '#64748B', fontSize: 10, fontWeight: '900', textTransform: 'uppercase' },
  typeBtnTextActive: { color: C.text, fontSize: 10, fontWeight: '900', textTransform: 'uppercase' },

  uploadContainer: { marginTop: 8 },
  uploadBox: { flexDirection: 'row', alignItems: 'center', borderStyle: 'dashed', borderWidth: 1.5, borderColor: '#1e293b', borderRadius: 16, padding: 20, backgroundColor: 'rgba(255,255,255,0.02)' },
  uploadIconWrap: { width: 44, height: 44, borderRadius: 22, backgroundColor: BG_DARK, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#1e293b' },
  uploadTitle: { color: C.text, fontSize: 12, fontWeight: '800' },
  uploadMeta: { color: '#64748B', fontSize: 9, fontWeight: '700', marginTop: 2 },
  chooseFileBtn: { backgroundColor: '#1e293b', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10 },
  chooseFileText: { color: C.text, fontSize: 10, fontWeight: '900', textTransform: 'uppercase' },
  uploadInfo: { flexDirection: 'row', gap: 10, marginTop: 12, paddingHorizontal: 8 },
  infoMeta: { color: '#64748B', fontSize: 9, fontWeight: '600', lineHeight: 14, flex: 1 },

  divider: { width: '100%', height: 1, backgroundColor: 'rgba(255,255,255,0.05)', marginVertical: 32 },
  inputHelp: { color: '#64748B', fontSize: 10, fontWeight: '600', marginTop: 8, marginLeft: 4 },

  previewHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16, marginLeft: 8 },
  previewHeading: { color: '#64748B', fontSize: 12, fontWeight: '900', letterSpacing: 1.5, textTransform: 'uppercase' },
  previewCard: { borderRadius: 32, overflow: 'hidden', borderWidth: 1, borderColor: BORDER_COLOR, shadowColor: '#000', shadowRadius: 40, shadowOpacity: 0.6 },
  previewInner: { padding: 32 },
  previewHero: { flexDirection: 'row', alignItems: 'center' },
  previewShield: { width: 100, height: 100, borderRadius: 24, backgroundColor: BG_DARK, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: C.cyan, shadowColor: C.cyan, shadowRadius: 30, shadowOpacity: 0.3 },
  previewClubName: { color: C.text, fontSize: 28, fontWeight: '900', letterSpacing: -0.5 },
  previewMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  previewMetaText: { color: '#94A3B8', fontSize: 13, fontWeight: '700' },

  previewColors: { flexDirection: 'row', marginTop: 24 },
  previewColorItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  colorSquare: { width: 14, height: 14, borderRadius: 4 },
  colorLabel: { color: '#64748B', fontSize: 11, fontWeight: '800' },

  previewSecTitle: { color: '#475569', fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1.5, marginTop: 32, marginBottom: 12 },
  previewPills: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  miniPill: { backgroundColor: '#1e293b', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  miniPillText: { color: C.cyan, fontSize: 10, fontWeight: '900' },

  typeBadge: { backgroundColor: C.cyan + '10', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, alignSelf: 'flex-start', borderWidth: 1, borderColor: C.cyan + '20' },
  typeBadgeText: { color: C.cyan, fontSize: 11, fontWeight: '900', textTransform: 'uppercase' },

  prevDivider: { width: '100%', height: 1, backgroundColor: 'rgba(255,255,255,0.05)', marginVertical: 32 },

  summaryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  summaryCard: { flex: 1, minWidth: '45%', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 16, padding: 20, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  summaryVal: { color: C.text, fontSize: 24, fontWeight: '900', marginTop: 12 },
  summaryLabel: { color: '#64748B', fontSize: 10, fontWeight: '800', textTransform: 'uppercase', marginTop: 4 },

  liveNotice: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: VIOLET + '08', padding: 16, borderRadius: 16, marginTop: 32, borderWidth: 1, borderColor: VIOLET + '20' },
  noticeText: { flex: 1, color: '#94A3B8', fontSize: 11, fontWeight: '600', lineHeight: 16 },

  stickyFooter: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(2,6,23,0.96)',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: Platform.OS === 'ios' ? 28 : 18,
    shadowColor: '#000',
    shadowRadius: 24,
    shadowOpacity: 0.35,
  },
  errorBanner: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: 'rgba(248,113,113,0.08)', borderWidth: 1, borderColor: 'rgba(248,113,113,0.3)', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, marginBottom: 14 },
  errorText: { flex: 1, color: '#F87171', fontSize: 12, fontWeight: '700' },
  footerButtons: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 16 },
  footerButtonsMobile: { flexDirection: 'column', alignItems: 'stretch' },
  btnSecondary: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 24, paddingVertical: 14, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  btnSecondaryText: { color: '#94A3B8', fontSize: 13, fontWeight: '900', textTransform: 'uppercase' },

  btnOutline: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 24, paddingVertical: 14, borderRadius: 16, borderWidth: 1, borderColor: '#1e293b' },
  btnOutlineText: { color: C.text, fontSize: 13, fontWeight: '900', textTransform: 'uppercase' },

  primaryPressable: { borderRadius: 16, overflow: 'hidden' },
  mobileFooterButton: { width: '100%', justifyContent: 'center' },
  disabledButton: { opacity: 0.7 },
  btnPrimary: { height: 56, paddingHorizontal: 32, borderRadius: 16, flexDirection: 'row', alignItems: 'center', gap: 12, shadowColor: C.cyan, shadowRadius: 20, shadowOpacity: 0.4 },
  btnPrimaryText: { color: C.text, fontWeight: '900', fontSize: 14, textTransform: 'uppercase', letterSpacing: 0.5 }
}));
