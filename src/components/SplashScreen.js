import React, { useEffect, useRef } from "react";
import { Animated, Easing, Image, Platform, StyleSheet, Text, View } from "react-native";
import { SoccerBall } from "./ui/soccer-ball";
import { BRAND_NAME, BRAND_TAGLINE } from "../constants/brand";

// Ecranul de pornire e mereu întunecat, indiferent de temă — la fel ca splash-ul
// nativ din app.json. Wordmark-ul are litere deschise; pe fundal luminos ar fi
// fost invizibil.
const BG = "#09090B";

const SPIN_MS = 850;   // mingea intră rotindu-se
const BADGE_MS = 380;  // apare personajul (logoul complet)
const TEXT_MS = 400;   // urcă textul
const HOLD_MS = 420;
const FADE_MS = 420;

const LOGO_SIZE = 128;

// react-native-web nu are driverul nativ; acolo animăm pe firul JS.
const NATIVE = Platform.OS !== "web";

export default function SplashScreen({ onDone }) {
  const overlay = useRef(new Animated.Value(1)).current;
  const ballSpin = useRef(new Animated.Value(0)).current;
  const ballScale = useRef(new Animated.Value(0.35)).current;
  const ballOpacity = useRef(new Animated.Value(0)).current;
  const badgeScale = useRef(new Animated.Value(0.82)).current;
  const badgeOpacity = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const textShift = useRef(new Animated.Value(18)).current;

  useEffect(() => {
    const animation = Animated.sequence([
      // 1. Mingea vine rotindu-se și se așază.
      Animated.parallel([
        Animated.timing(ballOpacity, { toValue: 1, duration: 200, useNativeDriver: NATIVE }),
        Animated.timing(ballSpin, {
          toValue: 1,
          duration: SPIN_MS,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: NATIVE,
        }),
        Animated.timing(ballScale, {
          toValue: 1,
          duration: SPIN_MS,
          easing: Easing.out(Easing.back(1.4)),
          useNativeDriver: NATIVE,
        }),
      ]),
      // 2. Logoul complet — personajul — apare peste minge.
      Animated.parallel([
        Animated.timing(ballOpacity, { toValue: 0, duration: BADGE_MS, useNativeDriver: NATIVE }),
        Animated.timing(badgeOpacity, { toValue: 1, duration: BADGE_MS, useNativeDriver: NATIVE }),
        Animated.timing(badgeScale, {
          toValue: 1,
          duration: BADGE_MS,
          easing: Easing.out(Easing.back(1.2)),
          useNativeDriver: NATIVE,
        }),
      ]),
      // 3. Textul urcă de dedesubt.
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
  }, [overlay, ballSpin, ballScale, ballOpacity, badgeScale, badgeOpacity, textOpacity, textShift, onDone]);

  const rotate = ballSpin.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "1080deg"] });

  return (
    <Animated.View style={[styles.overlay, { opacity: overlay }]} pointerEvents="none">
      <View style={styles.stage}>
        <Animated.View
          style={[styles.layer, { opacity: ballOpacity, transform: [{ scale: ballScale }, { rotate }] }]}
        >
          <SoccerBall size={LOGO_SIZE} />
        </Animated.View>

        <Animated.View style={[styles.layer, { opacity: badgeOpacity, transform: [{ scale: badgeScale }] }]}>
          <Image source={require("../../assets/icon-square.png")} style={styles.logo} />
        </Animated.View>
      </View>

      <Animated.View style={{ opacity: textOpacity, transform: [{ translateY: textShift }], alignItems: "center" }}>
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
    marginBottom: 26,
  },
  layer: { ...StyleSheet.absoluteFillObject, alignItems: "center", justifyContent: "center" },
  logo: { width: LOGO_SIZE, height: LOGO_SIZE, borderRadius: 30 },
  // Raportul wordmark-ului e 663×83.
  wordmark: { width: 208, height: 26 },
  tagline: {
    color: "rgba(255,255,255,0.45)",
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 1.4,
    marginTop: 10,
  },
});
