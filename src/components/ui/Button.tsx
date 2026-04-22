import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useAppTheme } from '../../hooks/useAppTheme';
import { borderRadius, shadow } from '../../theme/spacing';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  iconPosition?: 'left' | 'right';
  style?: ViewStyle;
  textStyle?: TextStyle;
  fullWidth?: boolean;
}

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon,
  iconPosition = 'left',
  style,
  textStyle,
  fullWidth = true,
}: ButtonProps) {
  const { colors, fontFamily } = useAppTheme();
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.97, { stiffness: 400, damping: 20 });
  };
  const handlePressOut = () => {
    scale.value = withSpring(1, { stiffness: 400, damping: 20 });
  };

  const isDisabled = disabled || loading;

  // ── Variant styles ─────────────────────────────────────────────────────────

  const variantStyles: Record<ButtonVariant, { container: ViewStyle; label: TextStyle }> = {
    primary: {
      container: {
        backgroundColor: colors.primary,
        ...shadow.primary,
      },
      label: { color: '#fff' },
    },
    secondary: {
      container: {
        backgroundColor: 'transparent',
        borderWidth: 1.5,
        borderColor: colors.primary,
      },
      label: { color: colors.primary },
    },
    ghost: {
      container: {
        backgroundColor: 'transparent',
      },
      label: { color: colors.textMuted },
    },
    danger: {
      container: {
        backgroundColor: colors.error,
        ...shadow.md,
      },
      label: { color: '#fff' },
    },
  };

  // ── Size styles ────────────────────────────────────────────────────────────

  const sizeStyles: Record<ButtonSize, { container: ViewStyle; label: TextStyle; iconSize: number }> = {
    sm: {
      container: { paddingVertical: 10, paddingHorizontal: 16 },
      label: { fontSize: 13 },
      iconSize: 16,
    },
    md: {
      container: { paddingVertical: 15, paddingHorizontal: 24 },
      label: { fontSize: 15 },
      iconSize: 18,
    },
    lg: {
      container: { paddingVertical: 18, paddingHorizontal: 28 },
      label: { fontSize: 17 },
      iconSize: 20,
    },
  };

  const vs = variantStyles[variant];
  const ss = sizeStyles[size];
  const iconColor = vs.label.color as string;

  return (
    <AnimatedTouchable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={isDisabled}
      activeOpacity={1}
      style={[
        styles.base,
        vs.container,
        ss.container,
        fullWidth && styles.fullWidth,
        isDisabled && styles.disabled,
        animStyle,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={iconColor} size="small" />
      ) : (
        <>
          {icon && iconPosition === 'left' && (
            <Ionicons name={icon} size={ss.iconSize} color={iconColor} style={styles.iconLeft} />
          )}
          <Text
            style={[
              styles.label,
              { fontFamily: fontFamily.semiBold },
              vs.label,
              ss.label,
              textStyle,
            ]}
          >
            {label}
          </Text>
          {icon && iconPosition === 'right' && (
            <Ionicons name={icon} size={ss.iconSize} color={iconColor} style={styles.iconRight} />
          )}
        </>
      )}
    </AnimatedTouchable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.md,
    overflow: 'hidden',
  },
  fullWidth: {
    width: '100%',
  },
  label: {
    letterSpacing: 0.1,
  },
  disabled: {
    opacity: 0.55,
  },
  iconLeft: {
    marginRight: 8,
  },
  iconRight: {
    marginLeft: 8,
  },
});
