import React, { useEffect, useState } from "react";
import { Alert, ScrollView, Text } from "react-native";
import { Button, Card, Loader, Screen, styles } from "../components/ui";
import { authService } from "../services/authService";
import { supabaseService } from "../services/supabaseService";
import { notificationService } from "../services/notificationService";

export default function DashboardScreen({ onLogout }) {
  const [profile,setProfile]=useState(null); const [stats,setStats]=useState(null); const [loading,setLoading]=useState(true);
  useEffect(()=>{(async()=>{try{const [p,players,trainings,matches]=await Promise.all([authService.getMyProfile(),supabaseService.getPlayers(),supabaseService.getTrainings(),supabaseService.getMatches()]); setProfile(p); setStats({players:players.length,trainings:trainings.length,matches:matches.length});}catch(e){Alert.alert('Eroare',e.message)}finally{setLoading(false)}})()},[]);
  async function logout(){ await authService.signOut(); onLogout?.(); }
  if(loading) return <Screen title="Dashboard"><Loader/></Screen>;
  return <Screen title="Dashboard" subtitle={`Rol: ${profile?.role || 'necunoscut'}`}><ScrollView><Card><Text style={styles.h2}>Bine ai venit, {profile?.full_name || 'FC Autentic'}</Text><Text style={styles.p}>Aici vezi rapid activitatea clubului.</Text></Card><Card><Text style={styles.h2}>Statistici</Text><Text style={styles.p}>Jucători: {stats?.players || 0}</Text><Text style={styles.p}>Antrenamente: {stats?.trainings || 0}</Text><Text style={styles.p}>Meciuri: {stats?.matches || 0}</Text></Card><Button title="Testează notificare locală" onPress={()=>notificationService.scheduleLocal('FC Autentic','Notificările sunt pregătite.',3).catch(e=>Alert.alert('Eroare',e.message))}/><Button variant="ghost" title="Ieșire din cont" onPress={logout}/></ScrollView></Screen>;
}
