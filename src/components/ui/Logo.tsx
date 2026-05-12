import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { BrandMark } from './BrandMark';
import { useAppTheme } from '../../hooks/useAppTheme';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  pulse?: boolean;
}

const SIZE_MAP = {
  sm: { icon: 30, font: 20, gap: 10 },
  md: { icon: 36, font: 26, gap: 12 },
  lg: { icon: 44, font: 34, gap: 14 },
} as const;

export function Logo({ size = 'md', pulse = false }: LogoProps) {
  const { colors, fontFamily } = useAppTheme();
  const { icon: iconSize, font: fontSize, gap } = SIZE_MAP[size];

  return (
    <View style={[styles.container, { gap }]}>
      <BrandMark size={iconSize} pulse={pulse} />
      <View style={styles.wordmark}>
        <Text
          style={[
            styles.brandText,
            {
              color: colors.textMain,
              fontFamily: fontFamily.extraBold,
              fontSize,
            },
          ]}
        >
          Vita
        </Text>
        <Text
          style={[
            styles.accentText,
            {
              color: colors.primary,
              fontFamily: fontFamily.bold,
              fontSize: Math.round(fontSize * 0.98),
            },
          ]}
        >
          track.ai
        </Text>
        <Text
          style={[
            styles.signalText,
            {
              color: colors.textPlaceholder,
              fontFamily: fontFamily.medium,
            },
          ]}
        >
          Health intelligence
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  wordmark: {
    justifyContent: 'center',
  },
  brandText: {
    letterSpacing: -0.8,
    lineHeight: 30,
  },
  accentText: {
    letterSpacing: -0.8,
    lineHeight: 30,
    marginTop: -2,
  },
  signalText: {
    fontSize: 10,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    marginTop: 1,
  },
});
