import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useEffect } from 'react';
import { useAppTheme } from '../../hooks/useAppTheme';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  pulse?: boolean;
}

const SIZE_MAP = {
  sm: { icon: 28, font: 20 },
  md: { icon: 40, font: 26 },
  lg: { icon: 52, font: 34 },
};

export function Logo({ size = 'md', pulse = false }: LogoProps) {
  const { colors, fontFamily } = useAppTheme();
  const { icon: iconSize, font: fontsize } = SIZE_MAP[size];

  // Heartbeat pulse animation on the icon
  const scale = useSharedValue(1);
  useEffect(() => {
    if (!pulse) return;
    scale.value = withRepeat(
      withSequence(
        withTiming(1.12, { duration: 300, easing: Easing.out(Easing.quad) }),
        withTiming(1, { duration: 300, easing: Easing.in(Easing.quad) }),
        withTiming(1.06, { duration: 200, easing: Easing.out(Easing.quad) }),
        withTiming(1, { duration: 200, easing: Easing.in(Easing.quad) }),
      ),
      -1,
      false,
    );
  }, [pulse, scale]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.iconContainer,
          {
            width: iconSize,
            height: iconSize,
            borderRadius: iconSize / 4,
            backgroundColor: colors.primary,
          },
          pulse && pulseStyle,
        ]}
      >
        {/* Heart + EKG line visual using text */}
        <Text style={[styles.iconText, { fontSize: iconSize * 0.55 }]}>♥</Text>
      </Animated.View>

      <View style={styles.textRow}>
        <Text
          style={[
            styles.brandText,
            {
              fontFamily: fontFamily.extraBold,
              fontSize: fontsize,
              color: colors.textMain,
            },
          ]}
        >
          Vita
        </Text>
        <Text
          style={[
            styles.brandText,
            {
              fontFamily: fontFamily.semiBold,
              fontSize: fontsize,
              color: colors.primary,
            },
          ]}
        >
          Track
        </Text>
        <Text
          style={[
            styles.dotText,
            {
              fontFamily: fontFamily.regular,
              fontSize: fontsize * 0.65,
              color: colors.textMuted,
            },
          ]}
        >
          {' '}.AI
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    color: '#ffffff',
  },
  textRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  brandText: {
    letterSpacing: -0.5,
    lineHeight: undefined,
  },
  dotText: {
    letterSpacing: 0.5,
  },
});
