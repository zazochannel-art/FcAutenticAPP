import React, { useRef } from "react";
import {
  Animated,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { colors as C, themedStyles } from "../../constants/theme";
import * as LucideIcons from "lucide-react-native";

const CYAN = "#06B6D4";

export function BeUIButton({
  label,
  variant = "primary",
  size = "md",
  icon,
  iconPosition = "left",
  style,
  textStyle,
  fullWidth = false,
  ...props
}) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = (event) => {
    Animated.spring(scaleAnim, {
      toValue: 0.98,
      useNativeDriver: true,
      speed: 20,
      bounciness: 0,
    }).start();
    props.onPressIn?.(event);
  };

  const handlePressOut = (event) => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 20,
      bounciness: 0,
    }).start();
    props.onPressOut?.(event);
  };

  const variantStyles = styles[variant] || styles.primary;
  const sizeStyles = styles[size] || styles.md;
  const textVariantStyles = textStyles[variant] || textStyles.primary;
  const textSizeStyles = textStyles[size] || textStyles.md;

  const IconComponent = icon ? LucideIcons[icon] : null;

  return (
    <Animated.View
      style={[
        styles.container,
        fullWidth && styles.fullWidth,
        { transform: [{ scale: scaleAnim }] },
        style,
      ]}
    >
      <Pressable
        {...props}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        android_ripple={{ color: "rgba(255, 255, 255, 0.2)", borderless: false }}
        style={({ pressed }) => [
          styles.button,
          variantStyles,
          sizeStyles,
          Platform.OS === "ios" && pressed && styles.iosPressed,
        ]}
      >
        <View style={styles.content}>
          {IconComponent && iconPosition === "left" && (
            <IconComponent
              size={size === "sm" ? 14 : size === "lg" ? 20 : 18}
              color={textVariantStyles.color}
              style={[label ? { marginRight: 8 } : null]}
            />
          )}
          {label && (
            <Text style={[styles.text, textVariantStyles, textSizeStyles, textStyle]}>
              {label}
            </Text>
          )}
          {IconComponent && iconPosition === "right" && (
            <IconComponent
              size={size === "sm" ? 14 : size === "lg" ? 20 : 18}
              color={textVariantStyles.color}
              style={[label ? { marginLeft: 8 } : null]}
            />
          )}
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = themedStyles((C) => StyleSheet.create({
  container: {
    borderRadius: 16,
    overflow: "hidden",
  },
  fullWidth: {
    width: "100%",
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  iosPressed: {
    opacity: 0.8,
  },
  text: {
    fontWeight: "900",
    textAlign: "center",
  },
  // Variants
  primary: {
    backgroundColor: CYAN,
    borderWidth: 0,
  },
  secondary: {
    backgroundColor: C.panel,
    borderWidth: 0,
  },
  outline: {
    backgroundColor: "transparent",
    borderWidth: 1.5,
    borderColor: CYAN,
  },
  ghost: {
    backgroundColor: "transparent",
    borderWidth: 0,
  },
  danger: {
    backgroundColor: C.red,
    borderWidth: 0,
  },
  success: {
    backgroundColor: C.green,
    borderWidth: 0,
  },
  // Sizes
  sm: {
    height: 36,
    paddingHorizontal: 12,
  },
  md: {
    height: 48,
    paddingHorizontal: 20,
  },
  lg: {
    height: 56,
    paddingHorizontal: 28,
  },
  icon: {
    width: 48,
    height: 48,
    paddingHorizontal: 0,
  },
}));

const textStyles = StyleSheet.create({
  primary: {
    color: C.text,
  },
  secondary: {
    color: C.text,
  },
  outline: {
    color: CYAN,
  },
  ghost: {
    color: CYAN,
  },
  danger: {
    color: C.text,
  },
  success: {
    color: C.text,
  },
  sm: {
    fontSize: 12,
  },
  md: {
    fontSize: 14,
  },
  lg: {
    fontSize: 16,
  },
  icon: {
    fontSize: 0,
  },
});
