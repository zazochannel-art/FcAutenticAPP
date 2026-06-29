import React from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { colors, spacing } from "../constants/theme";

export function Screen({ children, title, subtitle, right }) {
  return <View style={styles.screen}><View style={styles.header}><View style={{flex:1}}><Text style={styles.title}>{title}</Text>{subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}</View>{right}</View>{children}</View>;
}
export function Card({ children, style }) { return <View style={[styles.card, style]}>{children}</View>; }
export function Button({ title, onPress, variant="primary", disabled }) { return <Pressable onPress={onPress} disabled={disabled} style={[styles.button, variant==='ghost'&&styles.ghost, disabled&&styles.disabled]}><Text style={styles.buttonText}>{title}</Text></Pressable>; }
export function Field({ label, value, onChangeText, placeholder, secureTextEntry, keyboardType }) { return <View style={styles.field}><Text style={styles.label}>{label}</Text><TextInput value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor={colors.muted} secureTextEntry={secureTextEntry} keyboardType={keyboardType} style={styles.input}/></View>; }
export function EmptyState({ text }) { return <Card><Text style={styles.subtitle}>{text}</Text></Card>; }
export function Loader() { return <View style={{padding:24}}><ActivityIndicator /></View>; }
export const styles = StyleSheet.create({
  screen:{flex:1, backgroundColor:colors.bg, padding:spacing.md},
  header:{flexDirection:'row', alignItems:'center', marginBottom:spacing.md, gap:12},
  title:{color:colors.text, fontSize:24, fontWeight:'800'}, subtitle:{color:colors.muted, marginTop:4},
  card:{backgroundColor:colors.card, borderColor:colors.line, borderWidth:1, borderRadius:18, padding:16, marginBottom:12},
  button:{backgroundColor:colors.red, borderRadius:14, paddingVertical:12, paddingHorizontal:16, alignItems:'center', marginTop:8}, ghost:{backgroundColor:colors.panel}, disabled:{opacity:.55}, buttonText:{color:colors.text, fontWeight:'800'},
  field:{marginBottom:12}, label:{color:colors.muted, marginBottom:6}, input:{backgroundColor:colors.panel, color:colors.text, borderWidth:1, borderColor:colors.line, borderRadius:14, padding:12},
  row:{flexDirection:'row', justifyContent:'space-between', gap:12}, h2:{color:colors.text, fontSize:18, fontWeight:'800'}, p:{color:colors.muted}, badge:{color:colors.text, backgroundColor:colors.panel, paddingHorizontal:10, paddingVertical:4, borderRadius:999, overflow:'hidden'}
});
