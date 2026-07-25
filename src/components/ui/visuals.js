// Primitive vizuale reutilizabile (fără dependențe noi): sparkline, area chart,
// skeleton, buton cu scale la apăsare, badge de tendință, empty state, fade-in.
import React, { useEffect, useRef } from "react";
import { View, Text, Pressable, StyleSheet, Animated, Easing } from "react-native";
import Svg, { Polyline, Path, Defs, LinearGradient, Stop, Circle } from "react-native-svg";
import * as LucideIcons from "lucide-react-native";
import { colors as C } from "../../constants/theme";

// --- Sparkline: mini-grafic de tendință -------------------------------------
export function Sparkline({ data = [], color = C.cyan, width = 64, height = 24 }) {
  const nums = (data || []).map(Number).filter((n) => !Number.isNaN(n));
  if (nums.length < 2) return <View style={{ width, height }} />;
  const min = Math.min(...nums);
  const max = Math.max(...nums);
  const span = max - min || 1;
  const stepX = 100 / (nums.length - 1);
  const pts = nums.map((v, i) => `${(i * stepX).toFixed(2)},${(100 - ((v - min) / span) * 100).toFixed(2)}`).join(" ");
  const last = nums[nums.length - 1];
  const lx = 100;
  const ly = 100 - ((last - min) / span) * 100;
  return (
    <Svg width={width} height={height} viewBox="0 0 100 100" preserveAspectRatio="none">
      <Polyline points={pts} fill="none" stroke={color} strokeWidth="4" strokeLinejoin="round" strokeLinecap="round" />
      <Circle cx={lx} cy={ly} r="4.5" fill={color} />
    </Svg>
  );
}

// --- AreaChart: curbă cu gradient sub ea ------------------------------------
export function AreaChart({ data = [], color = C.cyan, height = 120, style }) {
  const nums = (data || []).map(Number).filter((n) => !Number.isNaN(n));
  if (nums.length < 2) {
    return <View style={[{ height }, style]} />;
  }
  const min = Math.min(...nums, 0);
  const max = Math.max(...nums);
  const span = max - min || 1;
  const stepX = 100 / (nums.length - 1);
  const coords = nums.map((v, i) => [i * stepX, 100 - ((v - min) / span) * 100]);
  const line = coords.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`).join(" ");
  const area = `${line} L100,100 L0,100 Z`;
  const gid = `grad-${color.replace(/[^a-z0-9]/gi, "")}`;
  return (
    <View style={[{ height }, style]}>
      <Svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
        <Defs>
          <LinearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={color} stopOpacity="0.35" />
            <Stop offset="1" stopColor={color} stopOpacity="0" />
          </LinearGradient>
        </Defs>
        <Path d={area} fill={`url(#${gid})`} />
        <Path d={line} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
      </Svg>
    </View>
  );
}

// --- Skeleton: placeholder animat (shimmer) ---------------------------------
export function Skeleton({ width = "100%", height = 16, radius = 8, style }) {
  const opacity = useRef(new Animated.Value(0.35)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.75, duration: 700, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.35, duration: 700, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);
  return <Animated.View style={[{ width, height, borderRadius: radius, backgroundColor: "rgba(148,163,184,0.16)", opacity }, style]} />;
}

// Un rând de skeleton tip listă (avatar + două linii).
export function SkeletonRow({ style }) {
  return (
    <View style={[styles.skelRow, style]}>
      <Skeleton width={40} height={40} radius={20} />
      <View style={{ flex: 1, marginLeft: 12, gap: 8 }}>
        <Skeleton width="60%" height={12} />
        <Skeleton width="40%" height={10} />
      </View>
    </View>
  );
}

// --- PressableScale: micro-interacțiune la apăsare --------------------------
export function PressableScale({ children, onPress, style, disabled, ...rest }) {
  const scale = useRef(new Animated.Value(1)).current;
  const to = (v) => Animated.spring(scale, { toValue: v, useNativeDriver: true, speed: 40, bounciness: 6 }).start();
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      onPressIn={() => to(0.97)}
      onPressOut={() => to(1)}
      {...rest}
    >
      <Animated.View style={[{ transform: [{ scale }] }, style]}>{children}</Animated.View>
    </Pressable>
  );
}

// --- TrendBadge: chip cu săgeată de tendință --------------------------------
export function TrendBadge({ value, up = true }) {
  if (value == null) return null;
  const color = up ? C.green : C.red;
  const Icon = up ? LucideIcons.TrendingUp : LucideIcons.TrendingDown;
  return (
    <View style={[styles.trendBadge, { backgroundColor: color + "18" }]}>
      <Icon size={11} color={color} />
      <Text style={[styles.trendBadgeText, { color }]}>{value}</Text>
    </View>
  );
}

// --- EmptyState: stare goală standardizată ----------------------------------
export function EmptyState({ icon = "Inbox", title, subtitle, actionLabel, onAction }) {
  const Icon = LucideIcons[icon] || LucideIcons.Inbox;
  return (
    <View style={styles.empty}>
      <View style={styles.emptyIcon}><Icon size={30} color={C.muted} /></View>
      {!!title && <Text style={styles.emptyTitle}>{title}</Text>}
      {!!subtitle && <Text style={styles.emptySub}>{subtitle}</Text>}
      {!!actionLabel && (
        <PressableScale onPress={onAction} style={styles.emptyBtn}>
          <LucideIcons.Plus size={15} color={C.bg} />
          <Text style={styles.emptyBtnText}>{actionLabel}</Text>
        </PressableScale>
      )}
    </View>
  );
}

// --- FadeInView: intrare cu fade + translateY -------------------------------
export function FadeInView({ children, delay = 0, style }) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(v, { toValue: 1, duration: 340, delay, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }, [v, delay]);
  const translateY = v.interpolate({ inputRange: [0, 1], outputRange: [12, 0] });
  return <Animated.View style={[{ opacity: v, transform: [{ translateY }] }, style]}>{children}</Animated.View>;
}

const styles = StyleSheet.create({
  skelRow: { flexDirection: "row", alignItems: "center", paddingVertical: 12, paddingHorizontal: 4 },
  trendBadge: { flexDirection: "row", alignItems: "center", gap: 3, paddingHorizontal: 7, height: 20, borderRadius: 7 },
  trendBadgeText: { fontSize: 10, fontWeight: "900" },
  empty: { alignItems: "center", justifyContent: "center", paddingVertical: 46, paddingHorizontal: 24, gap: 8 },
  emptyIcon: { width: 60, height: 60, borderRadius: 18, backgroundColor: "rgba(148,163,184,0.1)", alignItems: "center", justifyContent: "center", marginBottom: 4 },
  emptyTitle: { color: "white", fontSize: 14, fontWeight: "800", textAlign: "center" },
  emptySub: { color: C.muted, fontSize: 12, fontWeight: "600", textAlign: "center", lineHeight: 18 },
  emptyBtn: { flexDirection: "row", alignItems: "center", gap: 6, height: 42, paddingHorizontal: 18, borderRadius: 12, backgroundColor: C.cyan, marginTop: 8 },
  emptyBtnText: { color: C.bg, fontSize: 12.5, fontWeight: "900" },
});
