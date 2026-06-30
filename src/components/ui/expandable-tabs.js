import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import * as LucideIcons from "lucide-react-native";
import { colors as C } from "../../constants/theme";

const CYAN = "#06B6D4";
const GLASS_BG = "rgba(10, 31, 48, 0.94)";
const BORDER = "rgba(255, 255, 255, 0.12)";

function normalizeTitle(title = "") {
  return String(title)
    .replace("EchipДѓ", "Echipă")
    .replace("FinanИ›e", "Finanțe")
    .replace("NotificДѓri", "Notificări")
    .replace("SetДѓri", "Setări")
    .replace("PlДѓИ›i", "Plăți")
    .replace("Panou", "Acasă")
    .replace("Echipă", "Jucători");
}

function compactTitle(title) {
  if (title === "Antrenamente") return "Antren.";
  if (title === "Notificări") return "Notif.";
  if (title === "Statistici") return "Stat.";
  return title;
}

function resolveIcon(icon) {
  if (typeof icon === "function") return icon;
  if (typeof icon === "string") return LucideIcons[icon] || LucideIcons.Circle;
  return LucideIcons.Circle;
}

function Separator() {
  return <View style={styles.separator} accessibilityElementsHidden importantForAccessibility="no" />;
}

function ExpandableTabButton({ tab, selected, isMobile, activeColor, onPress }) {
  const progress = useRef(new Animated.Value(selected ? 1 : 0)).current;
  const Icon = resolveIcon(tab.icon);
  const displayTitle = normalizeTitle(tab.title);
  const label = isMobile ? compactTitle(displayTitle) : displayTitle;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: selected ? 1 : 0,
      duration: 220,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [progress, selected]);

  const labelWidth = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, isMobile ? 58 : 110],
  });

  const scale = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.05],
  });

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={displayTitle}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        isMobile ? styles.mobileButton : styles.desktopButton,
        selected && styles.buttonActive,
        pressed && styles.buttonPressed,
      ]}
      android_ripple={{ color: "rgba(6, 182, 212, 0.12)", borderless: false }}
    >
      <Animated.View style={[styles.iconWrap, selected && styles.iconWrapActive, { transform: [{ scale }] }]}>
        <Icon size={isMobile ? 21 : 20} color={selected ? activeColor : C.muted} strokeWidth={selected ? 2.7 : 2} />
      </Animated.View>

      <Animated.View style={[styles.labelMask, { width: selected || !isMobile ? labelWidth : 0 }]}>
        <Text numberOfLines={1} style={[styles.label, selected && { color: activeColor }]}>
          {label}
        </Text>
      </Animated.View>

      {isMobile && !selected ? (
        <Text numberOfLines={1} style={styles.mobileCollapsedLabel}>
          {label}
        </Text>
      ) : null}
    </Pressable>
  );
}

export function ExpandableTabs({
  tabs,
  className,
  activeColor = CYAN,
  activeTab,
  onChange,
}) {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const [selected, setSelected] = useState(null);

  const normalizedTabs = useMemo(() => (tabs || []).filter(Boolean), [tabs]);
  const selectedIndex = normalizedTabs.findIndex((tab) => tab.type !== "separator" && tab.title === activeTab);
  const controlledIndex = selectedIndex >= 0 ? selectedIndex : selected;

  const handleSelect = (tab, index) => {
    if (tab.type === "separator") return;
    setSelected(index);
    onChange?.(tab.title, index);
  };

  return (
    <View
      pointerEvents="box-none"
      style={isMobile ? styles.mobileWrapper : styles.desktopWrapper}
      data-class-name={className}
    >
      <View style={[styles.container, isMobile ? styles.mobileContainer : styles.desktopContainer]}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={isMobile ? styles.mobileContent : styles.desktopContent}
        >
          {normalizedTabs.map((tab, index) => {
            if (tab.type === "separator") return <Separator key={`separator-${index}`} />;

            return (
              <ExpandableTabButton
                key={`${tab.title}-${index}`}
                tab={tab}
                selected={controlledIndex === index}
                isMobile={isMobile}
                activeColor={activeColor}
                onPress={() => handleSelect(tab, index)}
              />
            );
          })}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  mobileWrapper: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    backgroundColor: "transparent",
  },
  desktopWrapper: {
    position: "absolute",
    top: 14,
    left: 18,
    right: 18,
    alignItems: "center",
    backgroundColor: "transparent",
  },
  container: {
    backgroundColor: GLASS_BG,
    borderWidth: 1,
    borderColor: BORDER,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.32,
    shadowRadius: 22,
    elevation: 12,
  },
  mobileContainer: {
    width: "100%",
    minHeight: Platform.OS === "ios" ? 92 : 80,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    paddingTop: 8,
    paddingBottom: Platform.OS === "ios" ? 22 : 10,
  },
  desktopContainer: {
    maxWidth: 980,
    minHeight: 64,
    borderRadius: 28,
    paddingHorizontal: 8,
    paddingVertical: 7,
  },
  mobileContent: {
    alignItems: "center",
    paddingHorizontal: 10,
    gap: 6,
  },
  desktopContent: {
    alignItems: "center",
    paddingHorizontal: 4,
    gap: 8,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "transparent",
  },
  mobileButton: {
    minWidth: 64,
    height: 58,
    paddingHorizontal: 10,
  },
  desktopButton: {
    minWidth: 92,
    height: 48,
    paddingHorizontal: 14,
  },
  buttonActive: {
    backgroundColor: "rgba(6, 182, 212, 0.16)",
    borderColor: "rgba(6, 182, 212, 0.26)",
  },
  buttonPressed: {
    opacity: 0.82,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  iconWrapActive: {
    backgroundColor: "rgba(6, 182, 212, 0.10)",
  },
  labelMask: {
    overflow: "hidden",
  },
  label: {
    marginLeft: 8,
    color: CYAN,
    fontSize: 12,
    fontWeight: "900",
  },
  mobileCollapsedLabel: {
    position: "absolute",
    bottom: 4,
    left: 2,
    right: 2,
    color: C.muted,
    textAlign: "center",
    fontSize: 9,
    fontWeight: "800",
  },
  separator: {
    width: 1,
    height: 26,
    marginHorizontal: 3,
    backgroundColor: "rgba(255, 255, 255, 0.12)",
  },
});
