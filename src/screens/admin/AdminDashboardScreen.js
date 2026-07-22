import React, { useMemo } from "react";
import { View, Text } from "react-native";
import * as LucideIcons from "lucide-react-native";
import { useQuery } from "@tanstack/react-query";
import { supabaseService } from "../../services/supabaseService";
import { AD, PLAN_PRICES, PLAN_COLORS, AdminPage, StatCard, ActionBtn, Card, s } from "./adminUi";

export default function AdminDashboardScreen({ clubs = [], onCreateClub, goTo }) {
  const { data: overview } = useQuery({
    queryKey: ["platformOverview"],
    queryFn: () => supabaseService.getPlatformOverview(),
  });
  const { data: subscriptions = [] } = useQuery({
    queryKey: ["subscriptions"],
    queryFn: () => supabaseService.getSubscriptions(),
  });

  const memberships = overview?.memberships || [];
  const allPlayers = overview?.players || [];
  const activeSubs = subscriptions.filter((sub) => sub.status === "active");
  const mrr = activeSubs.reduce((sum, sub) => sum + (PLAN_PRICES[sub.planName] || 0), 0);

  const planDistribution = useMemo(() => {
    const counts = {};
    activeSubs.forEach((sub) => {
      const plan = sub.planName || "Free";
      counts[plan] = (counts[plan] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [activeSubs]);

  const pendingCount = memberships.filter((m) => m.status === "pending").length;

  return (
    <AdminPage title="Panou SaaS" subtitle="Starea generală a platformei — cluburi, utilizatori și venituri.">
      <View style={s.statsGrid}>
        <StatCard icon="Building2" label="Cluburi active" val={String(clubs.filter((c) => !c.blocked).length)} sub={`${clubs.length} în total`} iColor={AD.cyan} />
        <StatCard icon="Users" label="Utilizatori" val={String(overview?.usersCount ?? "—")} sub="conturi în platformă" iColor={AD.violet} />
        <StatCard icon="CreditCard" label="Abonamente active" val={String(activeSubs.length)} sub={`${subscriptions.length} în total`} iColor={AD.blue} />
        <StatCard icon="Wallet" label="MRR estimat" val={`${mrr.toLocaleString("ro-RO")} lei`} sub="din prețurile de listă" iColor={AD.green} />
      </View>

      <View style={s.actionsList}>
        <ActionBtn icon="Plus" label="Creează club" color={AD.cyan} onPress={onCreateClub} />
        <ActionBtn icon="Building2" label="Vezi cluburile" color={AD.violet} onPress={() => goTo?.("Cluburi")} />
        <ActionBtn icon="UserPlus" label="Utilizatori & cereri" color={AD.blue} onPress={() => goTo?.("Utilizatori")} />
      </View>

      <Card title="Distribuție planuri">
        {planDistribution.length === 0 && <Text style={s.emptyText}>Fără abonamente active.</Text>}
        {planDistribution.map(([plan, count]) => {
          const per = activeSubs.length ? count / activeSubs.length : 0;
          const color = PLAN_COLORS[plan] || AD.dim;
          return (
            <View key={plan} style={{ marginBottom: 12 }}>
              <View style={styles.distLabelRow}>
                <Text style={[s.rowMainText, { color }]}>{plan}</Text>
                <Text style={s.rowSubText}>{count} ({Math.round(per * 100)}%)</Text>
              </View>
              <View style={styles.distBarBg}>
                <View style={[styles.distBarFill, { width: `${Math.round(per * 100)}%`, backgroundColor: color }]} />
              </View>
            </View>
          );
        })}
      </Card>

      <Card title="Rezumat platformă">
        <SummaryLine icon="Users" label="Membri activi în cluburi" value={String(memberships.filter((m) => m.status === "active").length)} />
        <SummaryLine icon="Clock" label="Cereri de alăturare în așteptare" value={String(pendingCount)} highlight={pendingCount > 0} />
        <SummaryLine icon="Volleyball" label="Jucători înregistrați" value={String(allPlayers.length)} />
        <SummaryLine icon="ShieldOff" label="Cluburi blocate" value={String(clubs.filter((c) => c.blocked).length)} />
      </Card>
    </AdminPage>
  );
}

const SummaryLine = ({ icon, label, value, highlight }) => {
  const Icon = LucideIcons[icon] || LucideIcons.Circle;
  return (
    <View style={styles.summaryLine}>
      <Icon size={14} color={highlight ? AD.amber : AD.dim} />
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={[styles.summaryValue, highlight && { color: AD.amber }]}>{value}</Text>
    </View>
  );
};

const styles = {
  distLabelRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 5 },
  distBarBg: { height: 6, backgroundColor: "rgba(255,255,255,0.05)", borderRadius: 3, overflow: "hidden" },
  distBarFill: { height: "100%", borderRadius: 3 },
  summaryLine: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.03)" },
  summaryLabel: { flex: 1, color: AD.dim, fontSize: 10.5, fontWeight: "700" },
  summaryValue: { color: "white", fontSize: 12, fontWeight: "900" },
};
