import React, { useEffect, useRef } from "react";
import { Animated, Image, StyleSheet, Text, View } from "react-native";
import { colors as C } from "../constants/theme";

const HOLD_MS = 1400;
const FADE_MS = 450;

export default function SplashScreen({ onDone }) {
  const opacity = useRef(new Animated.Value(1)).current;
  const scale = useRef(new Animated.Value(0.92)).current;

  useEffect(() => {
    Animated.timing(scale, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();

    const timer = setTimeout(() => {
      Animated.timing(opacity, {
        toValue: 0,
        duration: FADE_MS,
        useNativeDriver: true,
      }).start(() => onDone?.());
    }, HOLD_MS);

    return () => clearTimeout(timer);
  }, [opacity, scale, onDone]);

  return (
    <Animated.View style={[styles.overlay, { opacity }]} pointerEvents="none">
      <Animated.View style={[styles.center, { transform: [{ scale }] }]}>
        <Image
          source={require("../../assets/icon-square.png")}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.title}>Footbal Manager 99</Text>
        <Text style={styles.subtitle}>Administrare club sportiv</Text>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#020617",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 999,
  },
  center: {
    alignItems: "center",
  },
  logo: {
    width: 120,
    height: 120,
    borderRadius: 28,
    marginBottom: 20,
  },
  title: {
    color: C.text,
    fontSize: 26,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  subtitle: {
    color: C.muted,
    fontSize: 14,
    marginTop: 6,
  },
});
