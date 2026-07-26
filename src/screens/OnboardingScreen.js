import React from "react";
import { Image, ImageBackground, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { ArrowRight, ChevronRight, Globe, Info, QrCode, ShieldPlus, UsersRound } from "lucide-react-native";
import { colors as C } from "../constants/theme";

const stadium = { uri: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=2200" };

export default function OnboardingScreen({ onCreateClub, onJoinClub, onLogout }) {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 900;

  return (
    <View style={styles.container}>
      <ImageBackground source={stadium} style={styles.bg} imageStyle={{ opacity: 0.22 }}>
        <LinearGradient colors={["#020617", "rgba(2,6,23,0.84)", "#020617"]} style={StyleSheet.absoluteFill} />
        <SafeAreaView style={{ flex: 1 }}>
          <View style={styles.header}>
            <View style={styles.brand}>
              <View style={styles.logoTile}>
                <Image source={require("../../assets/icon-square.png")} style={styles.logo} />
              </View>
              <Text style={styles.brandText}>Footbal Manager <Text style={styles.brandAdmin}>99</Text></Text>
            </View>
            <View style={styles.headerRight}>
              <Pressable onPress={onLogout} style={styles.ghostSmall}><Text style={styles.ghostText}>Ieșire</Text></Pressable>
              <View style={styles.lang}><Globe size={15} color={C.muted} /><Text style={styles.langText}>Română</Text></View>
            </View>
          </View>

          <ScrollView contentContainerStyle={[styles.content, isDesktop && styles.contentDesktop]} showsVerticalScrollIndicator={false}>
            <View style={[styles.left, isDesktop && styles.leftDesktop]}>
              <Image source={require("../../assets/icon-square.png")} style={styles.heroLogo} />
              <Text style={styles.heroTitle}>Alege cum vrei să{"\n"}<Text style={styles.cyan}>continui</Text></Text>
              <Text style={styles.heroSubtitle}>
                Creează propriul tău club sau alătură-te unui club existent din platforma Footbal Manager 99.
              </Text>
              <View style={styles.featureStack}>
                <Feature icon={ShieldPlus} color={C.cyan} title="Creează și administrează" text="Construiește clubul tău și gestionează jucători, staff și evenimente." />
                <Feature icon={UsersRound} color={C.purple} title="Colaborează ușor" text="Invită membri, antrenori și părinți într-un singur spațiu digital." />
                <Feature icon={QrCode} color={C.green} title="Acces rapid" text="Intră într-un club existent folosind un cod sau o invitație." />
              </View>
            </View>

            <BlurView intensity={26} tint="dark" style={[styles.choiceCard, isDesktop && styles.choiceDesktop]}>
              <Text style={styles.choiceTitle}>Începe acum</Text>
              <Text style={styles.choiceSubtitle}>Selectează opțiunea potrivită pentru tine</Text>

              <OptionCard
                color={C.cyan}
                icon={ShieldPlus}
                title="Creează clubul"
                text="Pornește un club nou și configurează-l pas cu pas."
                cta="Creează club"
                onPress={onCreateClub}
                primary
              />

              <View style={styles.divider}><View style={styles.line} /><Text style={styles.dividerText}>SAU</Text><View style={styles.line} /></View>

              <OptionCard
                color={C.purple}
                icon={UsersRound}
                title="Alătură-te unui club"
                text="Intră într-un club existent cu un cod de invitație sau aprobarea administratorului."
                cta="Alătură-te"
                onPress={onJoinClub}
              />

              <View style={styles.infoRow}>
                <Info size={15} color={C.dim} />
                <Text style={styles.infoText}>Poți schimba opțiunea și mai târziu din contul tău.</Text>
              </View>
            </BlurView>
          </ScrollView>
        </SafeAreaView>
      </ImageBackground>
    </View>
  );
}

function Feature({ icon: Icon, color, title, text }) {
  return (
    <View style={styles.feature}>
      <View style={[styles.featureIcon, { borderColor: `${color}66`, backgroundColor: `${color}18` }]}><Icon size={24} color={color} /></View>
      <View style={{ flex: 1 }}>
        <Text style={styles.featureTitle}>{title}</Text>
        <Text style={styles.featureText}>{text}</Text>
      </View>
    </View>
  );
}

function OptionCard({ icon: Icon, color, title, text, cta, onPress, primary }) {
  return (
    <Pressable onPress={onPress} style={[styles.option, { borderColor: `${color}88` }]}>
      <View style={styles.optionTop}>
        <View style={[styles.optionIcon, { backgroundColor: `${color}18`, borderColor: `${color}44` }]}><Icon size={36} color={color} /></View>
        <View style={{ flex: 1 }}>
          <Text style={styles.optionTitle}>{title}</Text>
          <Text style={styles.optionText}>{text}</Text>
        </View>
        <ChevronRight size={26} color="white" />
      </View>
      {primary ? (
        <LinearGradient colors={[C.cyan, C.purple]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.optionButton}>
          <Text style={styles.optionButtonText}>{cta}</Text><ArrowRight size={21} color="white" />
        </LinearGradient>
      ) : (
        <View style={[styles.outlineButton, { borderColor: color }]}>
          <Text style={styles.optionButtonText}>{cta}</Text><ArrowRight size={21} color={color} />
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#020617" },
  bg: { flex: 1 },
  header: { minHeight: 86, paddingHorizontal: 28, flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderBottomWidth: 1, borderBottomColor: "rgba(148,163,184,0.1)" },
  brand: { flexDirection: "row", alignItems: "center", gap: 12 },
  logoTile: { width: 46, height: 46, borderRadius: 13, backgroundColor: "#F1F5F9", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "rgba(0,212,255,0.3)", overflow: "hidden" },
  logo: { width: 44, height: 44, borderRadius: 11, resizeMode: "cover" },
  brandText: { color: "white", fontSize: 22, fontWeight: "900", letterSpacing: -0.4 },
  brandAdmin: { color: C.cyan, fontSize: 17 },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 10 },
  lang: { height: 44, paddingHorizontal: 16, borderRadius: 14, flexDirection: "row", alignItems: "center", gap: 8, borderWidth: 1, borderColor: "rgba(148,163,184,0.18)", backgroundColor: "rgba(15,23,42,0.58)" },
  langText: { color: "white", fontSize: 13, fontWeight: "800" },
  ghostSmall: { height: 44, paddingHorizontal: 14, borderRadius: 14, borderWidth: 1, borderColor: "rgba(148,163,184,0.14)", alignItems: "center", justifyContent: "center" },
  ghostText: { color: C.muted, fontSize: 12, fontWeight: "900" },
  content: { flexGrow: 1, padding: 22, gap: 22 },
  contentDesktop: { flexDirection: "row", alignItems: "center", justifyContent: "center", padding: 48, gap: 80 },
  left: { alignItems: "center" },
  leftDesktop: { width: "42%", maxWidth: 620 },
  heroLogo: { width: 150, height: 150, resizeMode: "contain", marginBottom: 18 },
  heroTitle: { color: "white", fontSize: 48, lineHeight: 56, fontWeight: "900", textAlign: "center", letterSpacing: -1.2 },
  cyan: { color: C.cyan },
  heroSubtitle: { color: "#CBD5E1", fontSize: 18, lineHeight: 28, textAlign: "center", maxWidth: 520, marginTop: 18 },
  featureStack: { width: "100%", gap: 12, marginTop: 30 },
  feature: { flexDirection: "row", alignItems: "center", gap: 18, borderRadius: 18, padding: 16, borderWidth: 1, borderColor: "rgba(148,163,184,0.14)", backgroundColor: "rgba(15,23,42,0.55)" },
  featureIcon: { width: 58, height: 58, borderRadius: 18, alignItems: "center", justifyContent: "center", borderWidth: 1 },
  featureTitle: { color: "white", fontSize: 17, fontWeight: "900" },
  featureText: { color: C.muted, fontSize: 13, lineHeight: 19, marginTop: 3, fontWeight: "700" },
  choiceCard: { width: "100%", borderRadius: 30, overflow: "hidden", padding: 24, borderWidth: 1, borderColor: "rgba(148,163,184,0.22)", backgroundColor: "rgba(15,23,42,0.56)" },
  choiceDesktop: { width: "44%", maxWidth: 720, padding: 44 },
  choiceTitle: { color: "white", fontSize: 36, fontWeight: "900", textAlign: "center" },
  choiceSubtitle: { color: C.muted, fontSize: 16, textAlign: "center", marginTop: 8, marginBottom: 28 },
  option: { borderRadius: 22, borderWidth: 1.2, backgroundColor: C.bgSecondary, padding: 20, gap: 18 },
  optionTop: { flexDirection: "row", alignItems: "center", gap: 18 },
  optionIcon: { width: 82, height: 82, borderRadius: 41, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  optionTitle: { color: "white", fontSize: 24, fontWeight: "900" },
  optionText: { color: "#CBD5E1", fontSize: 15, lineHeight: 22, marginTop: 6 },
  optionButton: { height: 58, borderRadius: 16, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 12 },
  outlineButton: { height: 58, borderRadius: 16, borderWidth: 1.5, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 12, backgroundColor: "rgba(124,58,237,0.08)" },
  optionButtonText: { color: "white", fontSize: 16, fontWeight: "900" },
  divider: { flexDirection: "row", alignItems: "center", gap: 16, marginVertical: 22 },
  line: { flex: 1, height: 1, backgroundColor: "rgba(148,163,184,0.15)" },
  dividerText: { color: C.dim, fontWeight: "900" },
  infoRow: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 20, justifyContent: "center" },
  infoText: { color: C.dim, fontSize: 13, fontWeight: "700" },
});
