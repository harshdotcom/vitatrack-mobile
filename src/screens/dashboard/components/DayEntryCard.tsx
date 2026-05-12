import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useAppTheme } from '../../../hooks/useAppTheme';
import type { DashboardEntry } from '../../../types/dashboard.types';
import { getEntrySummary, getEntryTime, getEntryTitle } from '../dashboardUtils';

interface DayEntryCardProps {
  entry: DashboardEntry;
  onPress?: () => void;
}

export function DayEntryCard({ entry, onPress }: DayEntryCardProps) {
  const { colors, fontFamily, isDark } = useAppTheme();

  const accent = entry.entry_type === 'direct_entry' ? colors.secondary : colors.primary;
  const tint =
    entry.entry_type === 'direct_entry'
      ? isDark
        ? 'rgba(56, 189, 248, 0.12)'
        : 'rgba(3, 105, 161, 0.10)'
      : isDark
        ? 'rgba(45, 212, 191, 0.12)'
        : 'rgba(13, 148, 136, 0.10)';

  return (
    <Pressable
      disabled={!onPress}
      onPress={onPress}
      style={[
        styles.card,
        {
          backgroundColor: colors.surfaceSoft,
          borderColor: colors.borderSubtle,
        },
      ]}
    >
      <View style={styles.main}>
        <View style={[styles.icon, { backgroundColor: tint }]}>
          <Ionicons
            name={
              entry.entry_type === 'direct_entry'
                ? 'pulse-outline'
                : 'document-text-outline'
            }
            size={18}
            color={accent}
          />
        </View>
        <View style={styles.copy}>
          <View style={styles.titleRow}>
            <Text
              style={[
                styles.title,
                {
                  color: colors.textMain,
                  fontFamily: fontFamily.semiBold,
                },
              ]}
            >
              {getEntryTitle(entry)}
            </Text>
          </View>
          <Text
            style={[
              styles.subtitle,
              {
                color: colors.textMuted,
                fontFamily: fontFamily.regular,
              },
            ]}
          >
            {getEntrySummary(entry)}
          </Text>
          <View style={styles.footerRow}>
            {entry.analysis_generated ? (
              <View
                style={[
                  styles.aiReadyTag,
                  {
                    backgroundColor: isDark
                      ? 'rgba(34, 197, 94, 0.15)'
                      : 'rgba(22, 163, 74, 0.10)',
                  },
                ]}
              >
                <Text
                  style={[
                    styles.aiReadyTagText,
                    {
                      color: colors.successText,
                      fontFamily: fontFamily.semiBold,
                    },
                  ]}
                >
                  AI Ready
                </Text>
              </View>
            ) : null}
            <Text
              style={[
                styles.time,
                {
                  color: colors.textPlaceholder,
                  fontFamily: fontFamily.medium,
                },
              ]}
            >
              {getEntryTime(entry)}
            </Text>
          </View>
        </View>
      </View>
      <View style={styles.meta}>
        <Text
          style={[
            styles.kind,
            { color: accent, fontFamily: fontFamily.semiBold },
          ]}
        >
          {entry.entry_type === 'direct_entry' ? 'Vital' : 'Document'}
        </Text>
        {entry.entry_type === 'document' ? (
          <Ionicons
            name="chevron-forward"
            size={16}
            color={colors.textPlaceholder}
          />
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  main: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  icon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: {
    flex: 1,
    gap: 3,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  title: {
    fontSize: 14,
  },
  subtitle: {
    fontSize: 12,
    lineHeight: 16,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginTop: 2,
  },
  aiReadyTag: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  aiReadyTagText: {
    fontSize: 10,
  },
  time: {
    fontSize: 11,
  },
  meta: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  kind: {
    fontSize: 12,
  },
});
