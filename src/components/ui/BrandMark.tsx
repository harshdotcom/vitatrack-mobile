import React, { useEffect } from 'react';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Defs, G, LinearGradient, Path, Rect, Stop } from 'react-native-svg';
import { useAppTheme } from '../../hooks/useAppTheme';

interface BrandMarkProps {
  size?: number;
  pulse?: boolean;
}

export function BrandMark({ size = 28, pulse = false }: BrandMarkProps) {
  const { colors } = useAppTheme();
  const scale = useSharedValue(1);

  useEffect(() => {
    if (!pulse) {
      scale.value = 1;
      return;
    }

    scale.value = withRepeat(
      withSequence(
        withTiming(1.08, { duration: 260, easing: Easing.out(Easing.quad) }),
        withTiming(1, { duration: 260, easing: Easing.in(Easing.quad) }),
      ),
      -1,
      false,
    );
  }, [pulse, scale]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={pulseStyle}>
      <Svg width={size} height={size} viewBox="0 0 64 64" fill="none">
        <Defs>
          <LinearGradient id="brandShell" x1="10" y1="8" x2="56" y2="58" gradientUnits="userSpaceOnUse">
            <Stop offset="0" stopColor={colors.primary} stopOpacity="0.22" />
            <Stop offset="1" stopColor={colors.secondary} stopOpacity="0.14" />
          </LinearGradient>
          <LinearGradient id="brandPulse" x1="14" y1="20" x2="50" y2="40" gradientUnits="userSpaceOnUse">
            <Stop offset="0" stopColor={colors.primary} />
            <Stop offset="1" stopColor={colors.secondary} />
          </LinearGradient>
        </Defs>

        <Rect
          x="5"
          y="5"
          width="54"
          height="54"
          rx="18"
          fill="url(#brandShell)"
          stroke={colors.glassBorder}
          strokeWidth="1.4"
        />

        <G>
          <Path
            d="M13 34H20L24 22L30 43L35 29L39 34H51"
            stroke="url(#brandPulse)"
            strokeWidth="4.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path
            d="M45 22C45 19.2386 42.7614 17 40 17C37.7908 17 35.9168 18.4322 35.2482 20.4203C34.5797 18.4322 32.7057 17 30.4965 17C27.7351 17 25.4965 19.2386 25.4965 22C25.4965 29.5028 35.2482 34.3995 35.2482 34.3995C35.2482 34.3995 45 29.5028 45 22Z"
            fill={colors.primary}
            fillOpacity="0.16"
          />
        </G>
      </Svg>
    </Animated.View>
  );
}
