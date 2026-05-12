import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Card } from '../../../components/ui/Card';
import { useAppTheme } from '../../../hooks/useAppTheme';
import type { DashboardEntry } from '../../../types/dashboard.types';
import { getEntrySummary, getEntryTitle } from '../dashboardUtils';

interface SelectedDaySummaryCardProps {
  compact: boolean;
  selectedDateLabel: string;
  selectedEntries: DashboardEntry[];
  onOpenDetails: () => void;
}

export function SelectedDaySummaryCard({
  compact,
  selectedDateLabel,
  selectedEntries,
  onOpenDetails,
}: SelectedDaySummaryCardProps) {
  const { colors, fontFamily, fontSize, shadow, isDark } = useAppTheme();

  return (
    <Card style={{ ...styles.card, ...shadow.sm }}>
      <View
        style={[
          styles.header,
          compact && styles.headerCompact,
        ]}
      >
        <View style={styles.headingWrap}>
          <Text
            style={[
              styles.eyebrow,
              { color: colors.textMuted, fontFamily: fontFamily.medium },
            ]}
          >
            Selected day
          </Text>
          <View style={styles.titleRow}>
            <Text
              style={[
                styles.title,
                {
                  color: colors.textMain,
                  fontFamily: fontFamily.bold,
                  fontSize: compact ? fontSize.xl : fontSize['2xl'],
                },
              ]}
            >
              {selectedDateLabel}
            </Text>
            <View
              style={[
                styles.badge,
                {
                  backgroundColor: isDark
                    ? 'rgba(56, 189, 248, 0.12)'
                    : 'rgba(3, 105, 161, 0.08)',
                },
              ]}
            >
              <Text
                style={[
                  styles.badgeText,
                  { color: colors.secondary, fontFamily: fontFamily.semiBold },
                ]}
              >
                {selectedEntries.length} record{selectedEntries.length === 1 ? '' : 's'}
              </Text>
            </View>
          </View>
        </View>

        <Pressable
          onPress={onOpenDetails}
          style={[
            styles.button,
            {
              backgroundColor: colors.surfaceSoft,
              borderColor: colors.borderSubtle,
            },
          ]}
        >
          <Text
            style={[
              styles.buttonText,
              { color: colors.textMain, fontFamily: fontFamily.semiBold },
            ]}
          >
            View details
          </Text>
          <Ionicons name="arrow-forward" size={16} color={colors.textPlaceholder} />
        </Pressable>
      </View>

      <View
        style={[
          styles.preview,
          {
            backgroundColor: colors.surfaceSubtle,
            borderColor: colors.borderSubtle,
          },
        ]}
      >
        <View style={styles.previewCopy}>
          <Text
            style={[
              styles.previewTitle,
              { color: colors.textMain, fontFamily: fontFamily.semiBold },
            ]}
          >
            {selectedEntries.length > 0
              ? getEntryTitle(selectedEntries[0])
              : 'No records on this day'}
          </Text>
          <Text
            style={[
              styles.previewText,
              { color: colors.textMuted, fontFamily: fontFamily.regular },
            ]}
          >
            {selectedEntries.length > 0
              ? `${getEntrySummary(selectedEntries[0])}${
                  selectedEntries.length > 1
                    ? ` +${selectedEntries.length - 1} more`
                    : ''
                }`
              : 'Tap View details to open a clean day summary drawer.'}
          </Text>
        </View>
        <View
          style={[
            styles.previewIcon,
            {
              backgroundColor: isDark
                ? 'rgba(45, 212, 191, 0.12)'
                : 'rgba(13, 148, 136, 0.10)',
            },
          ]}
        >
          <Ionicons
            name={selectedEntries.length > 0 ? 'albums-outline' : 'calendar-outline'}
            size={18}
            color={colors.primary}
          />
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    gap: 18,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  headerCompact: {
    alignItems: 'flex-start',
    flexDirection: 'column',
  },
  headingWrap: {
    gap: 6,
  },
  eyebrow: {
    fontSize: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
  },
  title: {
    lineHeight: 30,
  },
  badge: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  badgeText: {
    fontSize: 12,
  },
  button: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  buttonText: {
    fontSize: 13,
  },
  preview: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  previewCopy: {
    flex: 1,
    gap: 4,
  },
  previewTitle: {
    fontSize: 14,
  },
  previewText: {
    fontSize: 12,
    lineHeight: 18,
  },
  previewIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
