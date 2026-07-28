import React, { useEffect, useRef } from "react";
import { Animated, Easing, Image, Platform, StyleSheet, Text, View } from "react-native";
import { BRAND_NAME, BRAND_TAGLINE } from "../constants/brand";

// Ecranul de pornire e mereu întunecat, indiferent de temă — la fel ca splash-ul
// nativ din app.json. Wordmark-ul are litere deschise; pe fundal luminos ar fi
// fost invizibil.
const BG = "#09090B";

const ENTER_MS = 780;   // mingea intră și se așază
const MANAGER_MS = 340; // apare personajul în fața mingii
const FRONT_MS = 320;   // personajul vine în față
const TEXT_MS = 380;    // urcă numele
const HOLD_MS = 380;
const FADE_MS = 400;

const LOGO_SIZE = 150;

// react-native-web nu are driverul nativ; acolo animăm pe firul JS.
const NATIVE = Platform.OS !== "web";

export default function SplashScreen({ onDone }) {
  const overlay = useRef(new Animated.Value(1)).current;
  // Un singur parametru pentru intrare, ca deplasarea, rotația și scalarea să
  // rămână sincronizate și să împartă aceeași depășire la final.
  const enter = useRef(new Animated.Value(0)).current;
  const ballOpacity = useRef(new Animated.Value(0)).current;
  const managerOpacity = useRef(new Animated.Value(0)).current;
  const finalOpacity = useRef(new Animated.Value(0)).current;
  const finalScale = useRef(new Animated.Value(0.93)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const textShift = useRef(new Animated.Value(18)).current;

  useEffect(() => {
    const animation = Animated.sequence([
      // 1. Mingea vine din stânga-jos, înclinată, și se așază în cadru.
      //    Dârele de mișcare sunt deja în imagine — de aceea înclinăm doar
      //    câteva grade, în loc s-o rotim de tot: insigna are ramă, iar o ramă
      //    care se învârte ar arăta greșit.
      Animated.parallel([
        Animated.timing(ballOpacity, { toValue: 1, duration: 200, useNativeDriver: NATIVE }),
        Animated.timing(enter, {
          toValue: 1,
          duration: ENTER_MS,
          easing: Easing.out(Easing.back(1.5)),
          useNativeDriver: NATIVE,
        }),
      ]),
      // 2. Personajul apare în fața mingii.
      Animated.parallel([
        Animated.timing(ballOpacity, { toValue: 0, duration: MANAGER_MS, useNativeDriver: NATIVE }),
        Animated.timing(managerOpacity, { toValue: 1, duration: MANAGER_MS, useNativeDriver: NATIVE }),
      ]),
      // 3. Personajul vine în față, mingea rămâne în spate.
      Animated.parallel([
        Animated.timing(managerOpacity, { toValue: 0, duration: FRONT_MS, useNativeDriver: NATIVE }),
        Animated.timing(finalOpacity, { toValue: 1, duration: FRONT_MS, useNativeDriver: NATIVE }),
        Animated.timing(finalScale, {
          toValue: 1,
          duration: FRONT_MS,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: NATIVE,
        }),
      ]),
      // 4. Numele și sloganul urcă de dedesubt.
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
  }, [overlay, enter, ballOpacity, managerOpacity, finalOpacity, finalScale, textOpacity, textShift, onDone]);

  const enterTransform = [
    { translateX: enter.interpolate({ inputRange: [0, 1], outputRange: [-36, 0] }) },
    { translateY: enter.interpolate({ inputRange: [0, 1], outputRange: [40, 0] }) },
    { rotate: enter.interpolate({ inputRange: [0, 1], outputRange: ["-14deg", "0deg"] }) },
    { scale: enter.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] }) },
  ];

  return (
    <Animated.View style={[styles.overlay, { opacity: overlay }]} pointerEvents="none">
      <View style={styles.stage}>
        <Animated.View style={[styles.layer, { opacity: ballOpacity, transform: enterTransform }]}>
          <Image source={require("../../assets/splash-ball.png")} style={styles.logo} />
        </Animated.View>

        <Animated.View style={[styles.layer, { opacity: managerOpacity }]}>
          <Image source={require("../../assets/splash-manager.png")} style={styles.logo} />
        </Animated.View>

        <Animated.View style={[styles.layer, { opacity: finalOpacity, transform: [{ scale: finalScale }] }]}>
          <Image source={require("../../assets/icon-square.png")} style={styles.logo} />
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
  logo: { width: LOGO_SIZE, height: LOGO_SIZE, borderRadius: 34 },
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
