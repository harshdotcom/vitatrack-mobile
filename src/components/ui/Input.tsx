import React, { forwardRef, useState } from 'react';
import {
  View,
  TextInput,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInputProps,
  ViewStyle,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useAppTheme } from '../../hooks/useAppTheme';
import { borderRadius } from '../../theme/spacing';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onRightIconPress?: () => void;
  containerStyle?: ViewStyle;
  isPassword?: boolean;
}

export const Input = forwardRef<TextInput, InputProps>(function Input(
  {
    label,
    error,
    hint,
    leftIcon,
    rightIcon,
    onRightIconPress,
    containerStyle,
    isPassword = false,
    ...props
  },
  ref,
) {
  const { colors, fontFamily, fontSize } = useAppTheme();
  const [isFocused, setIsFocused] = useState(false);
  const [secureEntry, setSecureEntry] = useState(isPassword);

  const borderColor = useSharedValue<string>(colors.border);

  const animBorder = useAnimatedStyle(() => ({
    borderColor: borderColor.value,
  }));

  const handleFocus = () => {
    setIsFocused(true);
    borderColor.value = withTiming(colors.primary, { duration: 150 });
    props.onFocus?.({} as any);
  };

  const handleBlur = () => {
    setIsFocused(false);
    borderColor.value = withTiming(error ? colors.error : colors.border, { duration: 150 });
    props.onBlur?.({} as any);
  };

  const iconColor = error
    ? colors.error
    : isFocused
    ? colors.primary
    : colors.textPlaceholder;

  return (
    <View style={[styles.wrapper, containerStyle]}>
      {label && (
        <Text
          style={[
            styles.label,
            {
              fontFamily: fontFamily.medium,
              fontSize: fontSize.sm,
              color: error ? colors.error : colors.textMuted,
            },
          ]}
        >
          {label}
        </Text>
      )}

      <Animated.View
        style={[
          styles.inputContainer,
          {
            backgroundColor: isFocused ? colors.inputFocusBg : colors.inputBg,
            borderColor: error ? colors.error : colors.border,
          },
          isFocused && styles.inputFocused,
          animBorder,
        ]}
      >
        {leftIcon && (
          <Ionicons name={leftIcon} size={18} color={iconColor} style={styles.leftIcon} />
        )}

        <TextInput
          ref={ref}
          style={[
            styles.input,
            {
              fontFamily: fontFamily.regular,
              fontSize: fontSize.base,
              color: colors.textMain,
              paddingLeft: leftIcon ? 4 : 0,
              paddingRight: (rightIcon || isPassword) ? 4 : 0,
            },
          ]}
          placeholderTextColor={colors.textPlaceholder}
          secureTextEntry={secureEntry}
          onFocus={handleFocus}
          onBlur={handleBlur}
          {...props}
        />

        {/* Password toggle */}
        {isPassword && (
          <TouchableOpacity
            onPress={() => setSecureEntry((v) => !v)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={styles.rightIcon}
          >
            <Ionicons
              name={secureEntry ? 'eye-outline' : 'eye-off-outline'}
              size={20}
              color={colors.textPlaceholder}
            />
          </TouchableOpacity>
        )}

        {/* Custom right icon */}
        {!isPassword && rightIcon && (
          <TouchableOpacity
            onPress={onRightIconPress}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={styles.rightIcon}
          >
            <Ionicons name={rightIcon} size={18} color={iconColor} />
          </TouchableOpacity>
        )}
      </Animated.View>

      {/* Error message */}
      {error && (
        <Text
          style={[
            styles.errorText,
            { fontFamily: fontFamily.medium, fontSize: fontSize.xs, color: colors.error },
          ]}
        >
          {error}
        </Text>
      )}

      {/* Hint (only shown when no error) */}
      {!error && hint && (
        <Text
          style={[
            styles.hintText,
            { fontFamily: fontFamily.regular, fontSize: fontSize.xs, color: colors.textPlaceholder },
          ]}
        >
          {hint}
        </Text>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 16,
  },
  label: {
    marginBottom: 6,
    letterSpacing: 0.1,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: borderRadius.md,
    paddingHorizontal: 14,
    paddingVertical: 0,
    minHeight: 52,
  },
  inputFocused: {
    shadowColor: '#0d9488',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 2,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
  },
  leftIcon: {
    marginRight: 8,
  },
  rightIcon: {
    marginLeft: 8,
    padding: 2,
  },
  errorText: {
    marginTop: 5,
  },
  hintText: {
    marginTop: 5,
  },
});
