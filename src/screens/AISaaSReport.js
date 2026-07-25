import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  TextInput,
  ActivityIndicator,
  Platform,
  Alert
} from "react-native";
import * as LucideIcons from "lucide-react-native";
import { supabaseService } from "../services/supabaseService";

// --- Premium Palette ---
const BG_DARK = "#020812";
const CARD_BG = "rgba(4, 18, 32, 0.78)";
const BORDER_COLOR = "rgba(0, 212, 255, 0.12)";
const CYAN = "#00D4FF";
const AMBER = "#FACC15";
const RED = "#EF4444";
const BLUE_ACCENT = "#0D8BFF";
const TEXT_DIM = "#94A3B8";
const TEXT_TH = "#475569";

const QUICK_ANALYSES = [
  { type: "attendance", icon: "Users", label: "Analiză prezență", question: "Analizează prezența la antrenamente pe grupe. Ce jucători au prezență scăzută și ce recomanzi?" },
  { type: "payments", icon: "Wallet", label: "Analiză plăți", question: "Analizează situația plăților (per antrenament și lunare). Cine are restanțe și ce sume lipsesc?" },
  { type: "squad", icon: "LayoutGrid", label: "Analiză lot", question: "Analizează structura lotului: grupe, poziții, statusuri medicale. Ce puncte slabe are lotul?" },
  { type: "planning", icon: "CalendarDays", label: "Planificare", question: "Pe baza antrenamentelor și meciurilor existente, ce recomandări de planificare ai pentru perioada următoare?" },
];

function notify(title, msg) {
  if (Platform.OS === "web") window.alert(`${title}\n\n${msg}`);
  else Alert.alert(title, msg);
}

export default function AISaaSReport({ currentUser, selectedClub }) {
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [history, setHistory] = useState([]);

  const canUse = ["super_admin", "club_owner", "admin", "coach"].includes(currentUser?.role);

  const run = async (analysisType, text) => {
    const q = (text || question).trim();
    if (!q) {
      notify("Întrebare lipsă", "Scrie o întrebare sau alege o analiză rapidă.");
      return;
    }
    if (!selectedClub?.id) {
      notify("Club lipsă", "Selectează mai întâi un club.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const result = await supabaseService.runAiAnalysis({
        clubId: selectedClub.id,
        analysisType: analysisType || "custom",
        question: q,
      });
      setHistory((prev) => [
        { id: Date.now(), question: q, answer: result.answer, missingData: result.missingData || [] },
        ...prev,
      ]);
      setQuestion("");
    } catch (e) {
      setError(e.message || "AI-ul nu a putut genera analiza.");
    } finally {
      setLoading(false);
    }
  };

  if (!canUse) {
    return (
      <View style={[styles.container, { alignItems: "center", justifyContent: "center", padding: 30 }]}>
        <LucideIcons.Lock size={34} color={TEXT_TH} />
        <Text style={[styles.emptyText, { marginTop: 12 }]}>Analiza AI este disponibilă pentru staff-ul clubului (owner, admin, antrenor).</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        <View style={styles.pageHeader}>
          <Text style={styles.pageTitle}>Rapoarte AI</Text>
          <Text style={styles.pageSub}>
            Analize pe datele reale ale clubului {selectedClub?.name || ""}: prezență, plăți, lot, planificare.
          </Text>
        </View>

        {/* Quick analyses */}
        <View style={styles.quickGrid}>
          {QUICK_ANALYSES.map((qa) => {
            const Icon = LucideIcons[qa.icon] || LucideIcons.Sparkles;
            return (
              <Pressable key={qa.type} disabled={loading} onPress={() => run(qa.type, qa.question)} style={styles.quickCard}>
                <View style={styles.quickIconWrap}><Icon size={18} color={CYAN} /></View>
                <Text style={styles.quickLabel}>{qa.label}</Text>
                <LucideIcons.ArrowRight size={13} color={TEXT_TH} />
              </Pressable>
            );
          })}
        </View>

        {/* Question input */}
        <View style={styles.askCard}>
          <Text style={styles.cardTitle}>ÎNTREABĂ AI-UL DESPRE CLUBUL TĂU</Text>
          <View style={styles.askRow}>
            <TextInput
              style={styles.askInput}
              value={question}
              onChangeText={setQuestion}
              placeholder="Ex: Care jucători riscă să piardă meciul de sâmbătă din cauza prezenței?"
              placeholderTextColor={TEXT_TH}
              multiline
              editable={!loading}
            />
            <Pressable onPress={() => run("custom")} disabled={loading} style={[styles.sendBtn, loading && { opacity: 0.6 }]}>
              {loading ? <ActivityIndicator size="small" color="white" /> : <LucideIcons.Send size={16} color="white" />}
            </Pressable>
          </View>
          {loading && <Text style={styles.loadingText}>AI-ul analizează datele clubului...</Text>}
          {!!error && (
            <View style={styles.errorBox}>
              <LucideIcons.AlertTriangle size={14} color={RED} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}
        </View>

        {/* Results */}
        {history.length === 0 && !loading && (
          <View style={styles.emptyBox}>
            <LucideIcons.Sparkles size={30} color={TEXT_TH} />
            <Text style={styles.emptyText}>
              Alege o analiză rapidă sau pune o întrebare. AI-ul răspunde folosind exclusiv datele clubului tău (jucători, prezențe, plăți, antrenamente).
            </Text>
          </View>
        )}

        {history.map((item) => (
          <View key={item.id} style={styles.resultCard}>
            <View style={styles.resultHeader}>
              <View style={styles.resultIcon}><LucideIcons.MessageCircleQuestion size={13} color={AMBER} /></View>
              <Text style={styles.resultQuestion}>{item.question}</Text>
            </View>
            <View style={styles.resultDivider} />
            <View style={styles.resultHeader}>
              <View style={[styles.resultIcon, { backgroundColor: CYAN + "12" }]}><LucideIcons.Sparkles size={13} color={CYAN} /></View>
              <Text style={styles.resultAnswer}>{item.answer}</Text>
            </View>
            {item.missingData.length > 0 && (
              <View style={styles.missingBox}>
                <Text style={styles.missingTitle}>DATE LIPSĂ SAU INCOMPLETE</Text>
                {item.missingData.map((m, i) => (
                  <Text key={i} style={styles.missingItem}>• {m}</Text>
                ))}
              </View>
            )}
          </View>
        ))}

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG_DARK },
  scrollContent: { padding: 18, paddingBottom: 60 },

  pageHeader: { marginBottom: 24 },
  pageTitle: { color: 'white', fontSize: 26, fontWeight: '900', letterSpacing: -0.5 },
  pageSub: { color: TEXT_DIM, fontSize: 13, fontWeight: '600', marginTop: 3, lineHeight: 19 },

  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  quickCard: { flexBasis: 200, flexGrow: 1, backgroundColor: CARD_BG, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: BORDER_COLOR, flexDirection: 'row', alignItems: 'center', gap: 10 },
  quickIconWrap: { width: 34, height: 34, borderRadius: 10, backgroundColor: CYAN + "10", borderWidth: 1, borderColor: CYAN + "25", alignItems: 'center', justifyContent: 'center' },
  quickLabel: { flex: 1, color: 'white', fontSize: 11.5, fontWeight: '800' },

  askCard: { backgroundColor: CARD_BG, borderRadius: 18, padding: 16, borderWidth: 1, borderColor: BORDER_COLOR, marginBottom: 16 },
  cardTitle: { color: 'white', fontSize: 12, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12 },
  askRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-end' },
  askInput: { flex: 1, minHeight: 60, maxHeight: 120, backgroundColor: "rgba(2,6,23,0.6)", borderWidth: 1, borderColor: "#1e293b", color: 'white', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, fontSize: 12, fontWeight: '600', textAlignVertical: 'top' },
  sendBtn: { width: 46, height: 46, borderRadius: 12, backgroundColor: BLUE_ACCENT, alignItems: 'center', justifyContent: 'center' },
  loadingText: { color: CYAN, fontSize: 10.5, fontWeight: '700', marginTop: 10 },
  errorBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: RED + "10", borderWidth: 1, borderColor: RED + "30", borderRadius: 10, padding: 10, marginTop: 12 },
  errorText: { flex: 1, color: RED, fontSize: 11, fontWeight: '700', lineHeight: 15 },

  emptyBox: { alignItems: 'center', gap: 12, paddingVertical: 40, paddingHorizontal: 24 },
  emptyText: { color: TEXT_DIM, fontSize: 11.5, fontWeight: '600', textAlign: 'center', lineHeight: 17 },

  resultCard: { backgroundColor: CARD_BG, borderRadius: 18, padding: 16, borderWidth: 1, borderColor: BORDER_COLOR, marginBottom: 12 },
  resultHeader: { flexDirection: 'row', gap: 10 },
  resultIcon: { width: 26, height: 26, borderRadius: 8, backgroundColor: AMBER + "12", alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  resultQuestion: { flex: 1, color: TEXT_DIM, fontSize: 11.5, fontWeight: '800', lineHeight: 17 },
  resultDivider: { height: 1, backgroundColor: "rgba(255,255,255,0.05)", marginVertical: 12 },
  resultAnswer: { flex: 1, color: 'white', fontSize: 12, fontWeight: '600', lineHeight: 19 },
  missingBox: { marginTop: 12, backgroundColor: AMBER + "08", borderWidth: 1, borderColor: AMBER + "20", borderRadius: 10, padding: 10 },
  missingTitle: { color: AMBER, fontSize: 8.5, fontWeight: '900', letterSpacing: 0.8, marginBottom: 6 },
  missingItem: { color: TEXT_DIM, fontSize: 10, fontWeight: '600', lineHeight: 15 },
});
