import React, { useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, ScrollView, Text } from "react-native";
import { Button, Card, Field, Screen, styles } from "../components/ui";
import { authService } from "../services/authService";
import { isSupabaseConfigured, supabaseConfigError } from "../config/supabaseClient";

export default function LoginScreen({ onLoggedIn }) {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [groupName, setGroupName] = useState("U19");
  const [loading, setLoading] = useState(false);
  async function submit() {
    try {
      if (!isSupabaseConfigured) throw new Error(supabaseConfigError);
      setLoading(true);
      if (mode === "login") await authService.signIn(email.trim(), password);
      else await authService.signUp({ email: email.trim(), password, fullName, groupName });
      onLoggedIn?.();
    } catch (e) { Alert.alert("Eroare", e.message); } finally { setLoading(false); }
  }
  return <Screen title="FC Autentic" subtitle="Autentificare pentru aplicația clubului"><KeyboardAvoidingView behavior={Platform.OS==='ios'?'padding':undefined}><ScrollView><Card><Text style={styles.h2}>{mode==='login'?'Intrare în cont':'Cont nou jucător'}</Text>{mode==='signup'?<Field label="Nume complet" value={fullName} onChangeText={setFullName}/>:null}<Field label="Email" value={email} onChangeText={setEmail} keyboardType="email-address"/><Field label="Parolă" value={password} onChangeText={setPassword} secureTextEntry/>{mode==='signup'?<Field label="Grupă" value={groupName} onChangeText={setGroupName}/>:null}<Button title={loading?'Se procesează...':mode==='login'?'Intră':'Creează cont'} onPress={submit} disabled={loading}/><Button variant="ghost" title={mode==='login'?'Nu ai cont? Înregistrare':'Ai cont? Intră'} onPress={()=>setMode(mode==='login'?'signup':'login')}/>{!isSupabaseConfigured?<Text style={[styles.p,{marginTop:12}]}>{supabaseConfigError}</Text>:null}</Card></ScrollView></KeyboardAvoidingView></Screen>;
}
