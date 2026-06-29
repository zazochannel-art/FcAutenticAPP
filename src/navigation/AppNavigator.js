import React, { useEffect, useState } from "react";
import { NavigationContainer, DarkTheme } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { Loader, Screen } from "../components/ui";
import { authService } from "../services/authService";
import { colors } from "../constants/theme";
import LoginScreen from "../screens/LoginScreen";
import DashboardScreen from "../screens/DashboardScreen";
import { PlayersScreen, TrainingsScreen, MatchesScreen } from "../screens/ListScreens";
import AdminRolesScreen from "../screens/AdminRolesScreen";
import StorageScreen from "../screens/StorageScreen";

const Tab = createBottomTabNavigator();
const navTheme = { ...DarkTheme, colors: { ...DarkTheme.colors, background: colors.bg, card: colors.card, border: colors.line, primary: colors.red, text: colors.text } };
function icon(name){ return ({color,size}) => <Ionicons name={name} color={color} size={size}/>; }

function MainTabs({ onLogout }){
  return <Tab.Navigator screenOptions={{ headerShown:false, tabBarStyle:{backgroundColor:colors.card,borderTopColor:colors.line}, tabBarActiveTintColor:colors.red, tabBarInactiveTintColor:colors.muted }}>
    <Tab.Screen name="Dashboard" options={{tabBarIcon:icon('grid')}}>{()=> <DashboardScreen onLogout={onLogout}/>}</Tab.Screen>
    <Tab.Screen name="Jucători" component={PlayersScreen} options={{tabBarIcon:icon('people')}} />
    <Tab.Screen name="Antrenamente" component={TrainingsScreen} options={{tabBarIcon:icon('fitness')}} />
    <Tab.Screen name="Meciuri" component={MatchesScreen} options={{tabBarIcon:icon('football')}} />
    <Tab.Screen name="Documente" component={StorageScreen} options={{tabBarIcon:icon('folder')}} />
    <Tab.Screen name="Admin" component={AdminRolesScreen} options={{tabBarIcon:icon('shield-checkmark')}} />
  </Tab.Navigator>;
}

export default function AppNavigator(){
  const [loading,setLoading]=useState(true); const [session,setSession]=useState(null); const [refresh,setRefresh]=useState(0);
  useEffect(()=>{ authService.getSession().then(setSession).catch(()=>setSession(null)).finally(()=>setLoading(false)); },[refresh]);
  if(loading) return <Screen title="FC Autentic"><Loader/></Screen>;
  return <NavigationContainer theme={navTheme}>{session ? <MainTabs onLogout={()=>{setSession(null); setRefresh(x=>x+1)}}/> : <LoginScreen onLoggedIn={()=>setRefresh(x=>x+1)}/>}</NavigationContainer>;
}
