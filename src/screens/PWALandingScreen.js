import React from "react";
import { View, Text, ScrollView, StyleSheet, Pressable, useWindowDimensions } from "react-native";
import * as LucideIcons from "lucide-react-native";
import { colors as C, spacing, radius } from "../constants/theme";
import { GlassCard } from "../components/DesignSystem";

export default function PWALandingScreen() {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={[styles.heroLayout, isMobile && styles.mobileHeroLayout]}>
         {/* Info Column */}
         <View style={[styles.infoCol, isMobile && { width: "100%" }]}>
            <View style={styles.brandRow}>
               <LucideIcons.Shield size={isMobile ? 24 : 32} color={C.cyan} />
               <Text style={[styles.brandTitle, isMobile && { fontSize: 18 }]}>FC AUTENTIC <Text style={{color: C.cyan}}>PWA</Text></Text>
            </View>
            <Text style={[styles.heroTitle, isMobile && { fontSize: 32, lineHeight: 38 }]}>Aplicația ta sportivă, mereu la îndemână.</Text>
            <Text style={[styles.heroSub, isMobile && { fontSize: 15, lineHeight: 22 }]}>Experiență nativă pe orice dispozitiv, fără instalare din magazin.</Text>

            <View style={[styles.featureRow, isMobile && styles.mobileFeatureRow]}>
               <FeatureBox icon="Download" title="Instalează" desc="Desktop/Mobil" color={C.blue} isMobile={isMobile} />
               <FeatureBox icon="Zap" title="Offline" desc="Gata oricând" color={C.green} isMobile={isMobile} />
            </View>

            <GlassCard style={styles.benefitsCard}>
               <Text style={styles.cardTitle}>Beneficii PWA</Text>
               <Benefit icon="MousePointer2" text="Instalare rapidă" />
               <Benefit icon="BellRing" text="Notificări push live" />
               <Benefit icon="WifiOff" text="Acces total offline" />
            </GlassCard>
         </View>

         {/* Mockup Column (Reduced/Hidden on Mobile) */}
         {!isMobile && (
           <View style={styles.mockupCol}>
              <View style={styles.mockupContainer}>
                 <GlassCard style={styles.laptopMock}>
                    <View style={styles.laptopScreen} />
                 </GlassCard>
              </View>
           </View>
         )}
      </View>
    </ScrollView>
  );
}

const FeatureBox = ({ icon, title, desc, color, isMobile }) => {
  const Icon = LucideIcons[icon];
  return (
    <View style={[styles.featureBox, isMobile && { flex: 1, padding: 12 }]}>
       <View style={[styles.featIcon, { backgroundColor: color + "10" }]}><Icon size={isMobile ? 14 : 18} color={color} /></View>
       <View style={{ marginLeft: 10 }}>
          <Text style={[styles.featTitle, isMobile && { fontSize: 12 }]}>{title}</Text>
          <Text style={[styles.featDesc, isMobile && { fontSize: 9 }]}>{desc}</Text>
       </View>
    </View>
  );
};

const Benefit = ({ icon, text }) => {
  const Icon = LucideIcons[icon];
  return (
    <View style={styles.benefitRow}>
       <Icon size={14} color={C.cyan} />
       <Text style={styles.benefitText}>{text}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#020617" },
  content: { padding: spacing.xl },
  heroLayout: { flexDirection: "row", gap: 60, alignItems: "center" },
  mobileHeroLayout: { flexDirection: "column", gap: 32 },
  infoCol: { flex: 1 },
  mockupCol: { flex: 1.2 },
  brandRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: spacing.lg },
  brandTitle: { color: "white", fontSize: 22, fontWeight: "900", letterSpacing: 0.5 },
  heroTitle: { color: "white", fontSize: 42, fontWeight: "900", lineHeight: 50, marginBottom: spacing.md },
  heroSub: { color: C.muted, fontSize: 16, lineHeight: 24, marginBottom: spacing.xl, fontWeight: "600" },
  featureRow: { flexDirection: "row", gap: 16, marginBottom: spacing.xl },
  mobileFeatureRow: { gap: 10 },
  featureBox: { flexDirection: "row", alignItems: "center", backgroundColor: "rgba(255,255,255,0.03)", padding: 14, borderRadius: 12, borderWidth: 1, borderColor: C.line },
  featIcon: { width: 32, height: 32, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  featTitle: { color: "white", fontSize: 13, fontWeight: "800" },
  featDesc: { color: C.dim, fontSize: 10, fontWeight: "600", marginTop: 2 },
  benefitsCard: { padding: spacing.lg },
  cardTitle: { color: "white", fontSize: 13, fontWeight: "900", textTransform: "uppercase", marginBottom: spacing.md },
  benefitRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 12 },
  benefitText: { color: "#E2E8F0", fontSize: 12, fontWeight: "600" },
  mockupContainer: { width: "100%", height: 300, justifyContent: "center", alignItems: "center" },
  laptopMock: { width: "100%", height: 200, borderRadius: 10, backgroundColor: "#0F172A" },
  laptopScreen: { flex: 1, backgroundColor: "#020617", borderRadius: 4 }
});
