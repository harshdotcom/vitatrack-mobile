import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useAppTheme } from '../../hooks/useAppTheme';
import { borderRadius, shadow } from '../../theme/spacing';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  glass?: boolean;
  elevated?: boolean;
}

/**
 * Glassmorphism card surface — matches the web app's glass-surface style.
 */
export function Card({ children, style, glass = true, elevated = false }: CardProps) {
  const { colors, isDark } = useAppTheme();

  const surfaceColor = glass
    ? colors.glassSurface
    : elevated
    ? colors.surfaceElevated
    : colors.surface;

  const borderColor = glass ? colors.glassBorder : colors.border;

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: surfaceColor,
          borderColor,
        },
        elevated && shadow.lg,
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    padding: 24,
    overflow: 'hidden',
  },
});
