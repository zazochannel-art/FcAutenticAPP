import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  Platform,
  Alert
} from "react-native";
import * as LucideIcons from "lucide-react-native";
import Svg, { Circle } from "react-native-svg";
import { useQueryClient } from "@tanstack/react-query";
import { supabaseService } from "../services/supabaseService";
import { colors as C, themedStyles } from "../constants/theme";


// --- Premium Palette ---

const PLAN_DATA = {
  free: {
    id: 'free', name: 'Free', price: '0 lei', color: C.cyan,
    desc: 'Tot ce ai nevoie pentru a începe organizarea clubului tău.',
    limits: [
      { icon: 'Users', label: 'Max. jucători', val: '20', color: C.blue },
      { icon: 'UserCog', label: 'Owner / Admini', val: '1', color: C.purple },
      { icon: 'Zap', label: 'Rapoarte AI', val: 'Nu este inclus', color: C.dim },
      { icon: 'Box', label: 'Module incluse', val: 'Core', color: C.green }
    ],
    nextStep: {
      title: 'Următorul pas: Starter',
      sub: 'Descoperă ce beneficii obții în plus.',
      color: C.blue,
      icon: 'Star',
      benefits: ['Până la 100 de jucători', '3 administratori', 'Rapoarte AI de performanță', 'Planificare avansată antrenamente', 'Statistici și rapoarte detaliate', 'Suport prioritar'],
      link: 'Vezi planul Starter'
    },
    included: ['Gestionarea jucătorilor (până la 20)', 'Programarea antrenamentelor', 'Organizarea meciurilor', 'Listă sarcini și notificări', 'Utilizator Owner/Admin (1)', 'Suport prin email'],
    limitations: ['Fără rapoarte AI', 'Fără statistici avansate', 'Fără exporturi și rapoarte personalizate', 'Fără integrare calendar extern', 'Fără suport prioritar', 'Nu se pot adăuga administratori suplimentari'],
    usage: { per: 60, val: '12 / 20', bars: [{ label: 'Jucători utilizați', val: '12 / 20', per: 0.6, color: C.cyan }, { label: 'Administratori', val: '1 / 1', per: 1.0, color: C.blue }] },
    clubs: [
      { name: 'FC Autentic Junior', id: 'CLUB-1024', owner: 'Andrei Popescu', players: '15 / 20', admins: '1 / 1', status: 'Activ', date: '12 mai 2026' },
      { name: 'ACS Progresul Youth', id: 'CLUB-0587', owner: 'Mihai Ionescu', players: '8 / 20', admins: '1 / 1', status: 'Activ', date: '3 mai 2026' },
      { name: 'Sportul Autentic Kids', id: 'CLUB-0765', owner: 'Vlad Marinescu', players: '5 / 20', admins: '1 / 1', status: 'Activ', date: '28 apr. 2026' }
    ]
  },
  starter: {
    id: 'starter', name: 'Starter', price: '299 lei', color: C.blue,
    desc: 'Ideal pentru cluburile care cresc și își organizează activitatea.',
    limits: [
      { icon: 'Users', label: 'Max. jucători', val: '50', color: C.blue },
      { icon: 'UserCog', label: 'Antrenori', val: '3', color: C.purple },
      { icon: 'Zap', label: 'Rapoarte AI', val: 'De bază', color: C.blue },
      { icon: 'Box', label: 'Module incluse', val: 'Starter', color: C.amber }
    ],
    nextStep: {
      title: 'Ce deblochează Pro?',
      sub: 'Du-te la următorul nivel cu beneficii avansate.',
      color: C.amber,
      icon: 'Star',
      benefits: ['Rapoarte AI avansate și predictive', 'Statistici detaliate și grafice avansate', 'Planificare avansată a antrenamentelor', 'Scouting și observații jucători', 'Integrări și exporturi avansate', 'Suport prioritar dedicat'],
      link: 'Vezi planul Pro'
    },
    included: ['Gestionarea jucătorilor (până la 50)', 'Programarea antrenamentelor', 'Organizarea meciurilor', 'Listă sarcini și notificări', 'Rapoarte AI de bază', 'Suport prin email'],
    limitations: ['Fără rapoarte AI avansate', 'Fără statistici avansate', 'Fără exporturi și rapoarte personalizate', 'Fără integrare calendar extern', 'Fără suport prioritar', 'Nu se pot adăuga administratori suplimentari'],
    usage: { per: 63, val: '31 / 50', bars: [{ label: 'Jucători utilizați', val: '31 / 50', per: 0.63, color: C.cyan }, { label: 'Antrenori utilizați', val: '2 / 3', per: 0.67, color: C.blue }, { label: 'Module utilizate', val: '8 / 10', per: 0.8, color: C.amber }] },
    clubs: [
      { name: 'FC Autentic Youth', id: 'CLUB-1001', owner: 'Mihai Ionescu', players: '28 / 50', admins: '2 / 3', status: 'Activ', date: '8 mai 2026' },
      { name: 'Sportul Autentic Kids', id: 'CLUB-1012', owner: 'Vlad Marinescu', players: '22 / 50', admins: '2 / 3', status: 'Activ', date: '12 mai 2026' },
      { name: 'Academia FC Autentic', id: 'CLUB-1015', owner: 'Andrei Popescu', players: '35 / 50', admins: '3 / 3', status: 'Activ', date: '15 mai 2026' },
      { name: 'FC Autentic Regional', id: 'CLUB-1017', owner: 'Robert Dumitrescu', players: '18 / 50', admins: '1 / 3', status: 'Activ', date: '18 mai 2026' },
      { name: 'FC Autentic Girls', id: 'CLUB-1021', owner: 'Ioana Neagu', players: '24 / 50', admins: '2 / 3', status: 'Activ', date: '21 mai 2026' }
    ]
  },
  pro: {
    id: 'pro', name: 'Pro', price: '599 lei', color: C.purple,
    desc: 'Pachetul recomandat pentru cluburile performante și organizate.',
    limits: [
      { icon: 'Users', label: 'Max. jucători', val: '150', color: C.blue },
      { icon: 'UserCog', label: 'Conturi staff', val: '8', color: C.purple },
      { icon: 'Zap', label: 'Rapoarte AI', val: 'Incluse', color: C.purple },
      { icon: 'Box', label: 'Module incluse', val: 'Pro', color: C.purple }
    ],
    nextStep: {
      title: 'Ce deblochează Elite?',
      sub: 'Treci la Elite pentru beneficii premium suplimentare.',
      color: C.purple,
      icon: 'Crown',
      benefits: ['Max. 500 jucători și staff nelimitat', 'Rapoarte AI avansate și predictive', 'Planificare sezonieră și scenarii tactice', 'Integrare avansată cu dispozitive GPS', 'Suport prioritar 24/7 și account manager dedicat', 'Personalizări avansate și branding propriu', 'Exporturi avansate și API dedicat'],
      link: 'Vezi planul Elite'
    },
    included: ['Gestionarea jucătorilor (până la 150)', 'Programarea antrenamentelor avansată', 'Organizarea meciurilor și turneelor', 'Rapoarte AI și analiză de performanță', 'Lista sarcini și notificări', 'Suport prioritar prin email și chat', 'Stocare documente și exporturi avansate'],
    limitations: ['Fără rapoarte AI predictive avansate', 'Fără integrare cu dispozitive GPS', 'Fără scenarii tactice avansate', 'Fără personalizări avansate și branding', 'Fără suport telefonic 24/7', 'Număr maxim de jucători: 150', 'Număr maxim conturi staff: 8'],
    usage: { per: 62, val: '93 / 150', bars: [{ label: 'Jucători utilizați', val: '93 / 150', per: 0.62, color: C.purple }, { label: 'Conturi staff utilizate', val: '5 / 8', per: 0.63, color: C.purple }] },
    clubs: [
      { name: 'FC Autentic Senior', id: 'CLUB-1001', owner: 'Andrei Popescu', players: '128 / 150', admins: '6 / 8', status: 'Activ', date: '12 mai 2026' },
      { name: 'FC Victoria Elite', id: 'CLUB-1003', owner: 'Maria Ionescu', players: '112 / 150', admins: '5 / 8', status: 'Activ', date: '14 mai 2026' },
      { name: 'Sportul Reșița', id: 'CLUB-1006', owner: 'Vlad Marinescu', players: '96 / 150', admins: '4 / 8', status: 'Activ', date: '16 mai 2026' },
      { name: 'ACS Phoenix', id: 'CLUB-1007', owner: 'Radu Ștefan', players: '74 / 150', admins: '3 / 8', status: 'Activ', date: '21 mai 2026' },
      { name: 'Gloria Timișoara', id: 'CLUB-1008', owner: 'Ioana Neagu', players: '61 / 150', admins: '3 / 8', status: 'Activ', date: '23 mai 2026' }
    ]
  },
  elite: {
    id: 'elite', name: 'Elite', price: '999 lei', color: C.amber,
    desc: 'Plan premium pentru academii și organizații sportive la nivel înalt.',
    limits: [
      { icon: 'Users', label: 'Jucători', val: 'Nelimitat', color: C.amber },
      { icon: 'UserCog', label: 'Staff', val: 'Nelimitat', color: C.purple },
      { icon: 'Zap', label: 'Rapoarte AI', val: 'Avansate', color: C.blue },
      { icon: 'Box', label: 'Module incluse', val: 'Elite', color: C.green }
    ],
    included: ['Jucători și staff nelimitat', 'Rapoarte AI avansate și predictive', 'Toate modulele disponibile (Elite)', 'Stocare date nelimitată', 'Personalizare completă a platformei', 'Suport dedicat 24/7', 'Exporturi avansate și API complet', 'SLA garantat 99.9%'],
    benefits: [
      { title: 'Performanță AI', sub: 'Analiză predictivă și scouting avansat', icon: 'Brain', color: C.amber },
      { title: 'Dashboard avansat', sub: 'Vizualizări personalizate și KPI în timp real', icon: 'BarChart3', color: C.amber },
      { title: 'Automatizări Elite', sub: 'Fluxuri de lucru și reguli inteligente', icon: 'Zap', color: C.amber },
      { title: 'Securitate maximă', sub: 'Backups zilnice și criptare avansată', icon: 'ShieldCheck', color: C.amber },
      { title: 'Branding complet', sub: 'Logo, culori și domeniu personalizat', icon: 'Palette', color: C.amber },
      { title: 'Integrări avansate', sub: 'API complet și integrări externe', icon: 'Link', color: C.amber }
    ],
    usage: { per: 87, val: '87%', sub: 'utilizare curentă', bars: [{ label: 'Jucători', val: '1.248 / Nelimitat', per: 0.4, color: C.amber }, { label: 'Staff', val: '54 / Nelimitat', per: 0.3, color: C.amber }, { label: 'Stocare date', val: '1.2 TB / Nelimitat', per: 0.6, color: C.amber }, { label: 'Rapoarte AI', val: '842 / Nelimitat', per: 0.5, color: C.amber }] },
    clubs: [
      { name: 'FC Autentic Academy', id: 'ELITE-001', academy: 'Andrei Popescu Academy', players: '1.248', staff: '54', status: 'Activ', date: '10 mai 2026' },
      { name: 'ACS Progresul Elite', id: 'ELITE-002', academy: 'Progresul Academy', players: '976', staff: '48', status: 'Activ', date: '7 mai 2026' },
      { name: 'Sportul Autentic Elite', id: 'ELITE-003', academy: 'Sportul Autentic Academy', players: '1.102', staff: '52', status: 'Activ', date: '2 mai 2026' },
      { name: 'Baza Sportivă Elite', id: 'ELITE-004', academy: 'Baza Sportivă Academy', players: '1.315', staff: '60', status: 'Activ', date: '28 apr. 2026' }
    ]
  }
};

const PLAN_MAX_PLAYERS = { free: 20, starter: 50, pro: 150, elite: null };
const NEXT_PLAN = { free: "starter", starter: "pro", pro: "elite" };

function notify(title, msg) {
  if (Platform.OS === "web") window.alert(`${title}\n\n${msg}`);
  else Alert.alert(title, msg);
}

export default function PricingScreen({ selectedClub, subscription, currentUser, players = [] }) {
  const queryClient = useQueryClient();
  // Planul activ al clubului vine din abonamentul real.
  const currentPlanId = String(subscription?.planName || selectedClub?.plan || "free").toLowerCase();
  const [selectedPlan, setSelectedPlan] = useState(PLAN_DATA[currentPlanId] ? currentPlanId : 'free');
  const [saving, setSaving] = useState(false);
  const activePlan = PLAN_DATA[selectedPlan];

  const isOwner = ["super_admin", "club_owner"].includes(currentUser?.role);
  const isCurrent = selectedPlan === currentPlanId;
  // Limita reală de jucători vine din abonament; null = nelimitat.
  const currentMaxPlayers = subscription?.maxPlayers ?? PLAN_MAX_PLAYERS[currentPlanId] ?? null;

  const activatePlan = async () => {
    if (!isOwner) {
      notify("Acces restricționat", "Doar owner-ul clubului poate schimba planul.");
      return;
    }
    if (!selectedClub?.id) return;
    setSaving(true);
    try {
      await supabaseService.updateSubscriptionPlan(selectedClub.id, activePlan.name, PLAN_MAX_PLAYERS[selectedPlan]);
      queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
      queryClient.invalidateQueries({ queryKey: ["clubs"] });
      notify("Plan activat", `Clubul ${selectedClub.name} folosește acum planul ${activePlan.name}.`);
    } catch (e) {
      notify("Eroare", e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.mainWrapper}>
        <ScrollView style={styles.mainScroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

          {/* Page Header */}
          <View style={styles.pageHeader}>
            <View style={styles.pageTitleContainer}>
              <Text style={styles.pageTitle}>Abonamente</Text>
              <Text style={styles.pageSub}>Gestionează planurile și abonamentele cluburilor.</Text>
            </View>
          </View>

          {/* Plan Selector Tabs */}
          <View style={styles.planTabsRow}>
            {Object.values(PLAN_DATA).map(plan => (
              <Pressable
                key={plan.id}
                style={[styles.planTab, selectedPlan === plan.id && { backgroundColor: plan.color + "15", borderColor: plan.color + "40" }]}
                onPress={() => setSelectedPlan(plan.id)}
              >
                <Text style={[styles.planTabText, selectedPlan === plan.id && { color: plan.color }]}>{plan.name}</Text>
                <Text style={styles.planTabPrice}>{plan.price}/lună</Text>
                {currentPlanId === plan.id && <View style={styles.activePlanIndicator}><Text style={styles.activePlanText}>Plan actual</Text></View>}
              </Pressable>
            ))}
          </View>

          {/* Top Content Grid */}
          <View style={styles.topGrid}>
             <View style={styles.colLeft}>
                <View style={styles.cardMain}>
                   <View style={styles.planTitleRow}>
                      <Text style={styles.cardPlanName}>Plan {activePlan.name}</Text>
                      {selectedPlan === 'elite' && <LucideIcons.Crown size={28} color={C.amber} />}
                   </View>
                   <Text style={styles.cardPlanDesc}>{activePlan.desc}</Text>

                   <View style={styles.priceRow}>
                      <Text style={styles.bigPrice}>{activePlan.price}</Text>
                      <Text style={styles.pricePeriod}>/ lună</Text>
                      <View style={[styles.freeBadge, { backgroundColor: activePlan.color + "15" }]}>
                         <Text style={[styles.freeBadgeText, { color: activePlan.color }]}>{activePlan.price === '0 lei' ? 'Plan gratuit' : 'Facturare lunară'}</Text>
                      </View>
                   </View>

                   <View style={styles.limitsRow}>
                      {activePlan.limits.map((l, i) => <LimitItem key={i} {...l} />)}
                   </View>

                   <View style={styles.cardActions}>
                      <Pressable
                        onPress={activatePlan}
                        disabled={saving || isCurrent || !isOwner}
                        style={[
                          styles.actionBtn,
                          { backgroundColor: activePlan.id === 'elite' ? C.amber : C.cyan },
                          (saving || isCurrent || !isOwner) && { opacity: 0.55 },
                        ]}
                      >
                        <Text style={styles.actionBtnTextDark}>
                          {saving ? "Se activează..." : isCurrent ? "Planul curent" : !isOwner ? "Doar owner-ul poate activa" : "Activează plan"}
                        </Text>
                      </Pressable>
                   </View>
                </View>
             </View>

             <View style={styles.colRight}>
                {selectedPlan === 'elite' ? (
                   <View style={styles.cardSide}>
                      <Text style={styles.sideTitle}>Comparație rapidă</Text>
                      <View style={styles.compareTable}>
                         <CompareRow label="Jucători" v1="Max. 20" v2="Max. 100" v3="Max. 500" v4="Nelimitat" active />
                         <CompareRow label="Staff" v1="1" v2="3" v3="10" v4="Nelimitat" active />
                         <CompareRow label="Rapoarte AI" v1="De bază" v2="Standard" v3="Avansate" v4="Avansate" active />
                         <CompareRow label="Stocare" v1="5 GB" v2="50 GB" v3="200 GB" v4="Nelimitat" active />
                         <CompareRow label="Suport" v1="Email" v2="Prioritar" v3="Dedicat" v4="24/7 Dedicat" active />
                      </View>
                   </View>
                ) : (
                   <View style={[styles.cardSide, { backgroundColor: activePlan.nextStep.color + "08", borderColor: activePlan.nextStep.color + "20" }]}>
                      <View style={styles.sideHeader}>
                         <View>
                            <Text style={[styles.sideTitle, { color: activePlan.nextStep.color }]}>{activePlan.nextStep.title}</Text>
                            <Text style={styles.sideSub}>{activePlan.nextStep.sub}</Text>
                         </View>
                         <View style={[styles.iconBox, { borderColor: activePlan.nextStep.color + "30" }]}>
                            {activePlan.nextStep.icon === 'Star' ? <LucideIcons.Star size={24} color={activePlan.nextStep.color} /> : <LucideIcons.Crown size={24} color={activePlan.nextStep.color} />}
                         </View>
                      </View>
                      <View style={styles.benefitList}>
                         {activePlan.nextStep.benefits.map((b, i) => <BenefitItem key={i} label={b} color={activePlan.nextStep.color} />)}
                      </View>
                      <Pressable style={styles.upgradeLink} onPress={() => NEXT_PLAN[selectedPlan] && setSelectedPlan(NEXT_PLAN[selectedPlan])}>
                         <Text style={[styles.upgradeLinkText, { color: activePlan.nextStep.color }]}>{activePlan.nextStep.link}</Text>
                         <LucideIcons.ChevronRight size={16} color={activePlan.nextStep.color} />
                      </Pressable>
                   </View>
                )}
             </View>
          </View>

          {/* Middle Section */}
          <View style={styles.middleGrid}>
             <View style={styles.colFeatures}>
                <View style={styles.cardMain}>
                   {selectedPlan === 'elite' ? (
                      <View>
                         <Text style={styles.columnTitle}>Beneficii ale Planului Elite</Text>
                         <View style={styles.eliteBenefitsGrid}>
                            {activePlan.benefits.map((b, i) => (
                               <View key={i} style={styles.eliteBenefitCard}>
                                  <View style={[styles.benefitIconWrap, { backgroundColor: b.color + "15" }]}>
                                     {LucideIcons[b.icon] && React.createElement(LucideIcons[b.icon], { size: 18, color: b.color })}
                                  </View>
                                  <View style={{ marginLeft: 14, flex: 1 }}>
                                     <Text style={styles.benefitTitle}>{b.title}</Text>
                                     <Text style={styles.benefitSub}>{b.sub}</Text>
                                  </View>
                               </View>
                            ))}
                         </View>
                      </View>
                   ) : (
                      <View style={styles.featuresColumns}>
                         <View style={{ flexBasis: 220, flexGrow: 1 }}>
                            <Text style={styles.columnTitle}>Ce este inclus în Plan {activePlan.name}</Text>
                            {activePlan.included.map((f, i) => <FeatureLine key={i} label={f} included />)}
                         </View>
                         <View style={{ flexBasis: 220, flexGrow: 1 }}>
                            <Text style={styles.columnTitle}>Limitări ale Planului {activePlan.name}</Text>
                            {activePlan.limitations.map((l, i) => <FeatureLine key={i} label={l} />)}
                         </View>
                      </View>
                   )}
                </View>
             </View>

             <View style={styles.colUsage}>
                <View style={styles.cardMain}>
                   <View style={styles.cardHeader}>
                      <Text style={styles.cardTitle}>Utilizarea clubului tău</Text>
                   </View>
                   <View style={styles.usageContent}>
                      <View style={styles.usageDonutWrap}>
                         <UsageDonut
                           per={currentMaxPlayers ? Math.min(Math.round((players.length / currentMaxPlayers) * 100), 100) : 0}
                           label={currentMaxPlayers ? `${players.length} / ${currentMaxPlayers}` : `${players.length}`}
                           sub="jucători"
                           color={PLAN_DATA[currentPlanId]?.color || C.cyan}
                         />
                      </View>
                      <View style={styles.usageBars}>
                         <UsageBar
                           label="Jucători utilizați"
                           val={currentMaxPlayers ? `${players.length} / ${currentMaxPlayers}` : `${players.length} / nelimitat`}
                           per={currentMaxPlayers ? Math.min(players.length / currentMaxPlayers, 1) : 0.05}
                           color={PLAN_DATA[currentPlanId]?.color || C.cyan}
                         />
                         <Text style={styles.usageHint}>
                           Pe planul {subscription?.planName || "Free"}{currentMaxPlayers ? `, limita este de ${currentMaxPlayers} jucători` : ", jucătorii sunt nelimitați"}.
                         </Text>
                      </View>
                   </View>
                </View>
             </View>
          </View>

          {/* Clubul tău pe planul curent */}
          <View style={styles.cardMain}>
             <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>Abonamentul clubului tău</Text>
             </View>
             <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 8 }}>
                <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: C.fill2, alignItems: 'center', justifyContent: 'center' }}>
                   <LucideIcons.Shield size={16} color={C.cyan} />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                   <Text style={{ color: C.text, fontSize: 13, fontWeight: '900' }}>{selectedClub?.name || "Clubul tău"}</Text>
                   <Text style={{ color: C.dim, fontSize: 10, fontWeight: '700', marginTop: 2 }}>
                     Plan curent: {subscription?.planName || selectedClub?.plan || "Free"}
                     {subscription?.maxPlayers ? ` • max. ${subscription.maxPlayers} jucători` : ""}
                     {subscription?.status ? ` • ${subscription.status === "active" ? "activ" : subscription.status}` : ""}
                   </Text>
                </View>
             </View>
          </View>

        </ScrollView>
      </View>
    </View>
  );
}

// --- Specific Components ---

const LimitItem = ({ icon, label, val, color }) => {
  const Icon = LucideIcons[icon];
  return (
    <View style={styles.limitBox}>
       <View style={[styles.limitIconWrap, { backgroundColor: color + "10" }]}><Icon size={18} color={color} /></View>
       <View style={{ marginLeft: 14 }}>
          <Text style={styles.limitLabel}>{label}</Text>
          <Text style={styles.limitVal}>{val}</Text>
       </View>
    </View>
  );
};

const CompareRow = ({ label, v1, v2, v3, v4, active }) => (
  <View style={styles.compareRow}>
     <Text style={styles.compareLabel}>{label}</Text>
     <Text style={styles.compareVal}>{v1}</Text>
     <Text style={styles.compareVal}>{v2}</Text>
     <Text style={styles.compareVal}>{v3}</Text>
     <Text style={[styles.compareVal, active && { color: C.amber, fontWeight: '900' }]}>{v4}</Text>
  </View>
);

const BenefitItem = ({ label, color }) => (
  <View style={styles.benefitLine}>
     <LucideIcons.CheckCircle2 size={14} color={color} />
     <Text style={styles.benefitText}>{label}</Text>
  </View>
);

const FeatureLine = ({ label, included }) => (
  <View style={styles.featureLine}>
     {included ? <LucideIcons.CheckCircle2 size={16} color={C.green} /> : <LucideIcons.AlertCircle size={16} color={C.amber} />}
     <Text style={[styles.featureText, !included && { color: C.muted }]}>{label}</Text>
  </View>
);

const UsageDonut = ({ per, label, sub, color }) => (
  <View style={styles.donutContainer}>
    <Svg width="120" height="120" viewBox="0 0 100 100">
      <Circle cx="50" cy="50" r="40" stroke={C.line} strokeWidth="10" fill="none" />
      <Circle
        cx="50" cy="50" r="40"
        stroke={color} strokeWidth="10" fill="none"
        strokeDasharray="251.2" strokeDashoffset={251.2 * (1 - per / 100)}
        strokeLinecap="round"
        transform="rotate(-90 50 50)"
      />
    </Svg>
    <View style={styles.donutOverlay}>
       <Text style={styles.donutMainText}>{label}</Text>
       <Text style={styles.donutSubText}>{sub}</Text>
    </View>
  </View>
);

const UsageBar = ({ label, val, per, color }) => (
  <View style={styles.usageBarItem}>
     <View style={styles.usageBarHeader}>
        <Text style={styles.usageBarLabel}>{label}</Text>
        <Text style={styles.usageBarVal}>{val}</Text>
        <Text style={styles.usageBarPer}>{Math.round(per * 100)}%</Text>
     </View>
     <View style={styles.usageBarBg}>
        <View style={[styles.usageBarFill, { width: `${per * 100}%`, backgroundColor: color }]} />
     </View>
  </View>
);

const styles = themedStyles((C) => StyleSheet.create({
  container: { flex: 1, backgroundColor: "transparent" },
  mainWrapper: { flex: 1 },
  mainScroll: { flex: 1 },
  scrollContent: { padding: 18, paddingBottom: 60 },

  pageHeader: { marginBottom: 30 },
  pageTitle: { color: C.text, fontSize: 26, fontWeight: '900', letterSpacing: -0.5 },
  pageSub: { color: C.muted, fontSize: 13, fontWeight: '600', marginTop: 3 },

  planTabsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 30, alignItems: 'stretch' },
  planTab: { flexBasis: 150, flexGrow: 1, minHeight: 68, backgroundColor: C.card, borderRadius: 14, borderWidth: 1, borderColor: C.line, padding: 12, justifyContent: 'center' },
  planTabText: { color: C.muted, fontSize: 12, fontWeight: '800' },
  planTabPrice: { color: C.dim, fontSize: 9.5, fontWeight: '700', marginTop: 1 },
  activePlanIndicator: { position: 'absolute', top: 10, right: 10, backgroundColor: C.fill3, paddingHorizontal: 5, paddingVertical: 1.5, borderRadius: 3 },
  activePlanText: { color: C.muted, fontSize: 7.5, fontWeight: '900' },
  compareBtn: { flexBasis: 150, flexGrow: 1, minHeight: 68, backgroundColor: C.cyan + "0D", borderRadius: 14, borderWidth: 1, borderColor: C.cyan + "33", flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  compareBtnText: { color: C.cyan, fontSize: 11, fontWeight: '900' },

  topGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14, marginBottom: 18 },
  colLeft: { flexBasis: 340, flexGrow: 1.8 },
  colRight: { flexBasis: 280, flexGrow: 1 },

  cardMain: { backgroundColor: C.card, borderRadius: 20, padding: 20, borderWidth: 1, borderColor: C.line, marginBottom: 16 },
  planTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardPlanName: { color: C.text, fontSize: 18, fontWeight: '900' },
  cardPlanDesc: { color: C.muted, fontSize: 11.5, fontWeight: '600', marginTop: 5, maxWidth: '85%' },

  priceRow: { flexDirection: 'row', alignItems: 'flex-end', marginTop: 18, marginBottom: 20 },
  bigPrice: { color: C.text, fontSize: 36, fontWeight: '900', lineHeight: 40 },
  pricePeriod: { color: C.dim, fontSize: 13, fontWeight: '800', marginLeft: 6, marginBottom: 5 },
  freeBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 5, marginLeft: 16, marginBottom: 6 },
  freeBadgeText: { fontSize: 9, fontWeight: '900' },

  limitsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 25 },
  limitBox: { flexBasis: 150, flexGrow: 1, minHeight: 74, backgroundColor: C.fill1, borderRadius: 14, borderWidth: 1, borderColor: C.line, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14 },
  limitIconWrap: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  limitLabel: { color: C.dim, fontSize: 9.5, fontWeight: '800' },
  limitVal: { color: C.text, fontSize: 13, fontWeight: '900', marginTop: 1 },

  cardActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  actionBtn: { flex: 1.2, height: 44, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  actionBtnOutline: { flex: 1, height: 44, backgroundColor: C.fill1, borderRadius: 10, borderWidth: 1, borderColor: C.line, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  actionBtnText: { color: C.text, fontSize: 12, fontWeight: '800' },
  actionBtnTextDark: { color: C.bg, fontSize: 12, fontWeight: '900' },

  cardSide: { backgroundColor: C.card, borderRadius: 20, padding: 20, borderWidth: 1, borderColor: C.line },
  sideHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  sideTitle: { fontSize: 15, fontWeight: '900', color: C.text },
  sideSub: { color: C.muted, fontSize: 11.5, fontWeight: '600', marginTop: 3 },
  iconBox: { width: 46, height: 46, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: C.fill1 },
  benefitList: { gap: 12, marginBottom: 25 },
  benefitLine: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  benefitText: { color: C.text, fontSize: 12.5, fontWeight: '600' },
  upgradeLink: { height: 44, backgroundColor: C.fill1, borderRadius: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14 },
  upgradeLinkText: { fontSize: 11, fontWeight: '900' },

  compareTable: { marginTop: 12 },
  compareRow: { flexDirection: 'row', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: C.line, alignItems: 'center' },
  compareLabel: { flex: 1.2, color: C.muted, fontSize: 10.5, fontWeight: '700' },
  compareVal: { flex: 1, color: C.dim, fontSize: 9.5, fontWeight: '700', textAlign: 'center' },

  middleGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14, marginBottom: 18 },
  colFeatures: { flexBasis: 340, flexGrow: 1.8 },
  colUsage: { flexBasis: 280, flexGrow: 1 },

  featuresColumns: { flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
  columnTitle: { color: C.text, fontSize: 13, fontWeight: '900', marginBottom: 16 },
  featureLine: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  featureText: { color: C.text, fontSize: 11.5, fontWeight: '600' },

  eliteBenefitsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
  eliteBenefitCard: { width: '47%', flexDirection: 'row', alignItems: 'center', backgroundColor: C.fill1, padding: 14, borderRadius: 14, borderWidth: 1, borderColor: C.line },
  benefitIconWrap: { width: 32, height: 32, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  benefitTitle: { color: C.text, fontSize: 11.5, fontWeight: '800' },
  benefitSub: { color: C.dim, fontSize: 8.5, fontWeight: '600', marginTop: 1 },

  cardTitle: { color: C.text, fontSize: 14, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.8 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  updateTime: { color: C.dim, fontSize: 9.5, fontWeight: '700' },
  usageHint: { color: '#475569', fontSize: 9.5, fontWeight: '600', marginTop: 10, lineHeight: 14 },
  usageContent: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 20 },
  usageDonutWrap: { width: 100, alignItems: 'center', justifyContent: 'center' },
  donutContainer: { width: 100, height: 100, alignItems: 'center', justifyContent: 'center' },
  donutOverlay: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  donutMainText: { color: C.text, fontSize: 16, fontWeight: '900' },
  donutSubText: { color: C.dim, fontSize: 8.5, fontWeight: '700', marginTop: -2 },
  usageBars: { flex: 1, gap: 16 },
  usageBarItem: {},
  usageBarHeader: { flexDirection: 'row', marginBottom: 6, alignItems: 'center' },
  usageBarLabel: { flex: 1, color: C.muted, fontSize: 10.5, fontWeight: '800' },
  usageBarVal: { color: C.text, fontSize: 10.5, fontWeight: '900', marginRight: 8 },
  usageBarPer: { color: C.dim, fontSize: 9.5, fontWeight: '700', width: 32, textAlign: 'right' },
  usageBarBg: { height: 5, backgroundColor: C.fill3, borderRadius: 2.5, overflow: 'hidden' },
  usageBarFill: { height: '100%', borderRadius: 2.5 },
  viewDetailsBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  viewDetailsText: { color: C.dim, fontSize: 10.5, fontWeight: '800' },

  seeAllBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  seeAllText: { fontSize: 11, fontWeight: '900' },
  tableHeader: { flexDirection: 'row', paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: C.line, marginBottom: 4 },
  th: { color: C.dim, fontSize: 9.5, fontWeight: "900", textTransform: "uppercase", letterSpacing: 1 },
  tableRow: { flexDirection: 'row', alignItems: 'center', height: 58, borderBottomWidth: 1, borderBottomColor: C.line },
  miniClubCrest: { width: 28, height: 28, borderRadius: 6, backgroundColor: C.fill1, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.line },
  rowMainText: { color: C.text, fontSize: 12, fontWeight: '800' },
  rowSubText: { color: C.dim, fontSize: 9.5, fontWeight: '600', marginTop: 1 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4, minWidth: 60, alignItems: 'center' },
  statusBadgeText: { fontSize: 8.5, fontWeight: '900', textTransform: 'uppercase' }
}));
