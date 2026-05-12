import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useAppTheme } from '../../../hooks/useAppTheme';

export type DashboardViewMode = 'calendar' | 'timeline';

interface DashboardViewToggleProps {
  value: DashboardViewMode;
  onChange: (mode: DashboardViewMode) => void;
}

const OPTIONS: Array<{ label: string; value: DashboardViewMode }> = [
  { label: 'Calendar', value: 'calendar' },
  { label: 'Timeline', value: 'timeline' },
];

export function DashboardViewToggle({
  value,
  onChange,
}: DashboardViewToggleProps) {
  const { colors, fontFamily, isDark } = useAppTheme();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.surfaceSubtle,
          borderColor: colors.borderSubtle,
        },
      ]}
    >
      {OPTIONS.map((option) => {
        const active = option.value === value;

        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            style={[
              styles.button,
              active && {
                backgroundColor: isDark
                  ? 'rgba(45, 212, 191, 0.16)'
                  : 'rgba(13, 148, 136, 0.10)',
                borderColor: colors.primary,
              },
            ]}
          >
            <Text
              style={[
                styles.label,
                {
                  color: active ? colors.primary : colors.textMuted,
                  fontFamily: active ? fontFamily.semiBold : fontFamily.medium,
                },
              ]}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: 999,
    padding: 4,
  },
  button: {
    minWidth: 86,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'transparent',
    paddingHorizontal: 14,
    paddingVertical: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 13,
  },
});
