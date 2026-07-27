// Primitive vizuale reutilizabile (fără dependențe noi): sparkline, area chart,
// skeleton, buton cu scale la apăsare, badge de tendință, empty state, fade-in.
import React, { useEffect, useRef } from "react";
import { View, Text, Pressable, StyleSheet, Animated, Easing } from "react-native";
import Svg, { Polyline, Path, Defs, LinearGradient, RadialGradient, Stop, Circle, Rect, Ellipse } from "react-native-svg";
import { LinearGradient as ExpoGradient } from "expo-linear-gradient";
import * as LucideIcons from "lucide-react-native";
import { colors as C, radius as R, elevation, themedStyles } from "../../constants/theme";

// --- AmbientBackground: lumini difuze foarte fine peste fundal --------------
// Trei pete radiale (verde / mov / albastru) la opacitate mică, care rup
// monotonia fundalului plat fără să afecteze lizibilitatea. Se pune ca strat
// de fundal, sub conținut, cu pointerEvents="none".
export function AmbientBackground({ style }) {
  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, style]}>
      <Svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
        <Defs>
          <RadialGradient id="ambA" cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor={C.accent} stopOpacity={C.isDark ? "0.16" : "0.13"} />
            <Stop offset="1" stopColor={C.accent} stopOpacity="0" />
          </RadialGradient>
          <RadialGradient id="ambB" cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor={C.purple} stopOpacity={C.isDark ? "0.14" : "0.10"} />
            <Stop offset="1" stopColor={C.purple} stopOpacity="0" />
          </RadialGradient>
          <RadialGradient id="ambC" cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor={C.blue} stopOpacity={C.isDark ? "0.10" : "0.08"} />
            <Stop offset="1" stopColor={C.blue} stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Rect x="0" y="0" width="100" height="100" fill={C.bg} />
        <Ellipse cx="12" cy="6" rx="52" ry="42" fill="url(#ambA)" />
        <Ellipse cx="92" cy="20" rx="46" ry="40" fill="url(#ambB)" />
        <Ellipse cx="60" cy="98" rx="58" ry="38" fill="url(#ambC)" />
      </Svg>
    </View>
  );
}

// --- Surface: suprafață cu muchie luminoasă sus + gradient subtil ----------
// Muchia luminoasă simulează lumina venită de sus și dă senzația de material
// fizic — detaliul care separă un card „plat" de unul care pare ridicat.
export function Surface({ children, style, contentStyle, accent, radius = R.xl }) {
  return (
    <View style={[{ borderRadius: radius, overflow: "hidden", borderWidth: 1, borderColor: C.line, ...elevation.low }, style]}>
      <ExpoGradient
        colors={[C.cardHover, C.card]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      {/* muchia luminoasă de sus (1px) */}
      <ExpoGradient
        colors={C.isDark ? ["rgba(134,239,172,0.28)", "rgba(134,239,172,0.06)", "transparent"] : ["rgba(255,255,255,0.95)", "rgba(220,252,231,0.5)", "transparent"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.topEdge}
      />
      {/* bandă de accent opțională */}
      {accent ? (
        <ExpoGradient
          colors={[accent, accent + "00"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.accentBar}
        />
      ) : null}
      <View style={contentStyle}>{children}</View>
    </View>
  );
}

// --- Sparkline: mini-grafic de tendință -------------------------------------
export function Sparkline({ data = [], color = C.cyan, width = 64, height = 24 }) {
  const nums = (data || []).map(Number).filter((n) => !Number.isNaN(n));
  // Fără date: linie punctată plată, ca să se vadă că graficul există și încă
  // așteaptă date (în loc să dispară complet).
  if (nums.length < 2) {
    return (
      <Svg width={width} height={height} viewBox="0 0 100 100" preserveAspectRatio="none">
        <Polyline
          points="0,50 100,50"
          fill="none"
          stroke={color}
          strokeOpacity="0.28"
          strokeWidth="4"
          strokeDasharray="8,10"
          strokeLinecap="round"
        />
      </Svg>
    );
  }
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
export function AreaChart({ data = [], color = C.cyan, height = 120, style, emptyLabel = "Fără date încă" }) {
  const nums = (data || []).map(Number).filter((n) => !Number.isNaN(n));
  // Fără date: linie de bază punctată + mesaj, ca graficul să rămână vizibil.
  if (nums.length < 2) {
    return (
      <View style={[{ height, justifyContent: "center" }, style]}>
        <Svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none" style={StyleSheet.absoluteFill}>
          <Path d="M0,70 L100,70" fill="none" stroke={color} strokeOpacity="0.25" strokeWidth="1.5" strokeDasharray="4,4" vectorEffect="non-scaling-stroke" />
        </Svg>
        <Text style={styles.chartEmptyText}>{emptyLabel}</Text>
      </View>
    );
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
  return <Animated.View style={[{ width, height, borderRadius: radius, backgroundColor: C.lineStrong, opacity }, style]} />;
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

const styles = themedStyles((C) => StyleSheet.create({
  topEdge: { position: "absolute", top: 0, left: 0, right: 0, height: 1 },
  accentBar: { position: "absolute", top: 0, left: 0, right: 0, height: 2.5 },
  chartEmptyText: { color: C.dim, fontSize: 11, fontWeight: "700", textAlign: "center" },
  skelRow: { flexDirection: "row", alignItems: "center", paddingVertical: 12, paddingHorizontal: 4 },
  trendBadge: { flexDirection: "row", alignItems: "center", gap: 3, paddingHorizontal: 7, height: 20, borderRadius: 7 },
  trendBadgeText: { fontSize: 10, fontWeight: "900" },
  empty: { alignItems: "center", justifyContent: "center", paddingVertical: 46, paddingHorizontal: 24, gap: 8 },
  emptyIcon: { width: 60, height: 60, borderRadius: 18, backgroundColor: "rgba(148,163,184,0.1)", alignItems: "center", justifyContent: "center", marginBottom: 4 },
  emptyTitle: { color: C.text, fontSize: 14, fontWeight: "800", textAlign: "center" },
  emptySub: { color: C.muted, fontSize: 12, fontWeight: "600", textAlign: "center", lineHeight: 18 },
  emptyBtn: { flexDirection: "row", alignItems: "center", gap: 6, height: 42, paddingHorizontal: 18, borderRadius: 12, backgroundColor: C.cyan, marginTop: 8 },
  emptyBtnText: { color: C.bg, fontSize: 12.5, fontWeight: "900" },
}));
