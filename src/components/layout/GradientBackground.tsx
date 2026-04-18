import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useColorScheme } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  Easing,
  withSequence,
} from 'react-native-reanimated';
import { useEffect } from 'react';
import { lightColors, darkColors } from '../../theme/colors';

interface GradientBackgroundProps {
  children: React.ReactNode;
}

export function GradientBackground({ children }: GradientBackgroundProps) {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const colors = isDark ? darkColors : lightColors;

  const gradientColors = isDark
    ? (['#071516', '#0d2024', '#0b1617', '#113135'] as const)
    : (['#e0efe5', '#bce4db', '#e0efe5', '#9ce0d3'] as const);

  // Orb 1 — top-left floating animation
  const orb1Y = useSharedValue(0);
  const orb1Scale = useSharedValue(1);
  useEffect(() => {
    orb1Y.value = withRepeat(
      withSequence(
        withTiming(-18, { duration: 5000, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 5000, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
    );
    orb1Scale.value = withRepeat(
      withSequence(
        withTiming(1.08, { duration: 5000, easing: Easing.inOut(Easing.sin) }),
        withTiming(1, { duration: 5000, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
    );
  }, [orb1Y, orb1Scale]);

  // Orb 2 — bottom-right, offset phase
  const orb2Y = useSharedValue(0);
  useEffect(() => {
    orb2Y.value = withRepeat(
      withSequence(
        withTiming(14, { duration: 6000, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 6000, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
    );
  }, [orb2Y]);

  const orb1Style = useAnimatedStyle(() => ({
    transform: [{ translateY: orb1Y.value }, { scale: orb1Scale.value }],
  }));
  const orb2Style = useAnimatedStyle(() => ({
    transform: [{ translateY: orb2Y.value }],
  }));

  return (
    <LinearGradient
      colors={gradientColors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={StyleSheet.absoluteFill}
    >
      {/* Orb 1 */}
      <Animated.View
        style={[
          styles.orb,
          styles.orb1,
          { backgroundColor: colors.orbPrimary },
          orb1Style,
        ]}
      />
      {/* Orb 2 */}
      <Animated.View
        style={[
          styles.orb,
          styles.orb2,
          { backgroundColor: colors.orbSecondary },
          orb2Style,
        ]}
      />

      <View style={styles.content}>{children}</View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
  },
  orb: {
    position: 'absolute',
    borderRadius: 9999,
  },
  orb1: {
    width: 320,
    height: 320,
    top: -100,
    left: -100,
  },
  orb2: {
    width: 260,
    height: 260,
    bottom: -80,
    right: -80,
  },
});
