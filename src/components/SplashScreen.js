import React, { useEffect, useRef } from "react";
import { Animated, Easing, Image, Platform, StyleSheet, Text, View } from "react-native";
import { BRAND_NAME, BRAND_TAGLINE } from "../constants/brand";

// Ecranul de pornire e mereu întunecat, indiferent de temă — la fel ca splash-ul
// nativ din app.json. Wordmark-ul are litere deschise; pe fundal luminos ar fi
// fost invizibil.
const BG = "#09090B";

const SPIN_MS = 900;   // mingea zboară în cadru rotindu-se
const BUILD_MS = 430;  // se construiește restul insignei în jurul ei
const TEXT_MS = 380;   // urcă numele
const HOLD_MS = 380;
const FADE_MS = 400;

const LOGO_SIZE = 150;

// Mingea decupată separat se așază exact peste mingea din insignă, ca sfera să
// nu se clintească la tranziție. Numerele vin din măsurarea cercului din
// `splash-manager.png`: centru (256, 198), rază 176, la o insignă de 512px.
const BALL_SIZE = 136;
const BALL_REST_Y = -17;

// react-native-web nu are driverul nativ; acolo animăm pe firul JS.
const NATIVE = Platform.OS !== "web";

export default function SplashScreen({ onDone }) {
  const overlay = useRef(new Animated.Value(1)).current;
  // Un singur parametru pentru zbor, ca rotația, deplasarea și scalarea să
  // rămână legate — altfel se desincronizează și se vede că sunt trei animații.
  const flight = useRef(new Animated.Value(0)).current;
  const ballOpacity = useRef(new Animated.Value(0)).current;
  const badgeOpacity = useRef(new Animated.Value(0)).current;
  const badgeScale = useRef(new Animated.Value(1.06)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const textShift = useRef(new Animated.Value(18)).current;

  useEffect(() => {
    const animation = Animated.sequence([
      // 1. Mingea intră din stânga-jos, se rotește de două ture și jumătate și
      //    frânează până se oprește. E decupată fără ramă, deci se poate roti
      //    cu adevărat.
      Animated.parallel([
        Animated.timing(ballOpacity, { toValue: 1, duration: 220, useNativeDriver: NATIVE }),
        Animated.timing(flight, {
          toValue: 1,
          duration: SPIN_MS,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: NATIVE,
        }),
      ]),
      // 2. Insigna se construiește în jurul mingii: stadionul, personajul și
      //    rama apar, iar mingea liberă se stinge peste cea din insignă. Fiind
      //    aliniate, sfera rămâne pe loc și nu se vede nicio schimbare de poză.
      Animated.parallel([
        Animated.timing(badgeOpacity, { toValue: 1, duration: BUILD_MS, useNativeDriver: NATIVE }),
        Animated.timing(badgeScale, {
          toValue: 1,
          duration: BUILD_MS,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: NATIVE,
        }),
        Animated.timing(ballOpacity, { toValue: 0, duration: BUILD_MS, useNativeDriver: NATIVE }),
      ]),
      // 3. Numele și sloganul urcă de dedesubt.
      Animated.parallel([
        Animated.timing(textOpacity, { toValue: 1, duration: TEXT_MS, useNativeDriver: NATIVE }),
        Animated.timing(textShift, {
          toValue: 0,
          duration: TEXT_MS,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: NATIVE,
        }),
      ]),
      Animated.delay(HOLD_MS),
      Animated.timing(overlay, { toValue: 0, duration: FADE_MS, useNativeDriver: NATIVE }),
    ]);

    animation.start(({ finished }) => { if (finished) onDone?.(); });
    return () => animation.stop();
  }, [overlay, flight, ballOpacity, badgeOpacity, badgeScale, textOpacity, textShift, onDone]);

  const ballTransform = [
    { translateX: flight.interpolate({ inputRange: [0, 1], outputRange: [-54, 0] }) },
    { translateY: flight.interpolate({ inputRange: [0, 1], outputRange: [58, BALL_REST_Y] }) },
    { rotate: flight.interpolate({ inputRange: [0, 1], outputRange: ["-900deg", "0deg"] }) },
    { scale: flight.interpolate({ inputRange: [0, 1], outputRange: [0.42, 1] }) },
  ];

  return (
    <Animated.View style={[styles.overlay, { opacity: overlay }]} pointerEvents="none">
      <View style={styles.stage}>
        <Animated.View style={[styles.layer, { opacity: badgeOpacity, transform: [{ scale: badgeScale }] }]}>
          <Image source={require("../../assets/splash-manager.png")} style={styles.badge} />
        </Animated.View>

        <Animated.View style={[styles.layer, { opacity: ballOpacity, transform: ballTransform }]}>
          <Image source={require("../../assets/splash-ball-loose.png")} style={styles.ball} />
        </Animated.View>
      </View>

      <Animated.View style={[styles.textWrap, { opacity: textOpacity, transform: [{ translateY: textShift }] }]}>
        <Image
          source={require("../../assets/wordmark.png")}
          style={styles.wordmark}
          resizeMode="contain"
          accessibilityLabel={BRAND_NAME}
        />
        <Text style={styles.tagline}>{BRAND_TAGLINE}</Text>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: BG,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 999,
  },
  stage: {
    width: LOGO_SIZE,
    height: LOGO_SIZE,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 28,
  },
  layer: { ...StyleSheet.absoluteFillObject, alignItems: "center", justifyContent: "center" },
  badge: { width: LOGO_SIZE, height: LOGO_SIZE, borderRadius: 34 },
  ball: { width: BALL_SIZE, height: BALL_SIZE },
  textWrap: { alignItems: "center" },
  // Raportul wordmark-ului e 663×83.
  wordmark: { width: 224, height: 28 },
  tagline: {
    color: "rgba(255,255,255,0.45)",
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 1.4,
    marginTop: 10,
  },
});
