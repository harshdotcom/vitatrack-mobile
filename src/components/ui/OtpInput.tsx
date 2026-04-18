import React, { useRef, useCallback } from 'react';
import { View, TextInput, StyleSheet, ViewStyle } from 'react-native';
import { useAppTheme } from '../../hooks/useAppTheme';
import { borderRadius } from '../../theme/spacing';

interface OtpInputProps {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  style?: ViewStyle;
  disabled?: boolean;
}

/**
 * 6-box OTP input — auto-advances focus to the next box on each keystroke,
 * and auto-regresses on backspace.
 */
export function OtpInput({ length = 6, value, onChange, style, disabled }: OtpInputProps) {
  const { colors, fontFamily, fontSize } = useAppTheme();
  const inputs = useRef<Array<TextInput | null>>([]);

  const chars = value.split('');
  // Pad to length
  while (chars.length < length) chars.push('');

  const handleChange = useCallback(
    (text: string, index: number) => {
      // Only accept single digit
      const digit = text.replace(/[^0-9]/g, '').slice(-1);
      const newChars = [...chars];
      newChars[index] = digit;
      const newValue = newChars.join('');
      onChange(newValue);

      // Advance if digit entered
      if (digit && index < length - 1) {
        inputs.current[index + 1]?.focus();
      }
    },
    [chars, length, onChange],
  );

  const handleKeyPress = useCallback(
    (e: { nativeEvent: { key: string } }, index: number) => {
      if (e.nativeEvent.key === 'Backspace') {
        if (!chars[index] && index > 0) {
          // Clear previous and move back
          const newChars = [...chars];
          newChars[index - 1] = '';
          onChange(newChars.join(''));
          inputs.current[index - 1]?.focus();
        }
      }
    },
    [chars, onChange],
  );

  return (
    <View style={[styles.container, style]}>
      {Array.from({ length }).map((_, i) => {
        const isFilled = !!chars[i];
        return (
          <TextInput
            key={i}
            ref={(el) => {
              inputs.current[i] = el;
            }}
            style={[
              styles.box,
              {
                fontFamily: fontFamily.bold,
                fontSize: fontSize.xl,
                color: colors.textMain,
                borderColor: isFilled ? colors.primary : colors.border,
                backgroundColor: isFilled ? colors.inputFocusBg : colors.inputBg,
              },
            ]}
            value={chars[i]}
            onChangeText={(t) => handleChange(t, i)}
            onKeyPress={(e) => handleKeyPress(e, i)}
            keyboardType="number-pad"
            maxLength={1}
            textAlign="center"
            selectTextOnFocus
            editable={!disabled}
            caretHidden
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
  },
  box: {
    width: 48,
    height: 58,
    borderWidth: 1.5,
    borderRadius: borderRadius.md,
    textAlign: 'center',
  },
});
