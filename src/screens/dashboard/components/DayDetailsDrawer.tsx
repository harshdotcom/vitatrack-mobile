import React from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Button } from '../../../components/ui/Button';
import { useAppTheme } from '../../../hooks/useAppTheme';
import type { DashboardEntry } from '../../../types/dashboard.types';
import { DayEntryCard } from './DayEntryCard';

interface DayDetailsDrawerProps {
  visible: boolean;
  selectedDateLabel: string;
  selectedEntries: DashboardEntry[];
  onClose: () => void;
  onOpenUpload: () => void;
  onOpenDocument: (entryId: string) => void;
}

export function DayDetailsDrawer({
  visible,
  selectedDateLabel,
  selectedEntries,
  onClose,
  onOpenUpload,
  onOpenDocument,
}: DayDetailsDrawerProps) {
  const { colors, fontFamily, fontSize, borderRadius, isDark } = useAppTheme();

  return (
    <Modal animationType="slide" transparent visible={visible} onRequestClose={onClose}>
      <View style={[styles.overlay, { backgroundColor: colors.overlay }]}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View
          style={[
            styles.card,
            {
              backgroundColor: colors.surface,
              borderColor: colors.borderSubtle,
              borderTopLeftRadius: borderRadius['3xl'],
              borderTopRightRadius: borderRadius['3xl'],
            },
          ]}
        >
          <View
            style={[
              styles.handle,
              {
                backgroundColor: isDark
                  ? 'rgba(148, 163, 184, 0.28)'
                  : 'rgba(100, 116, 139, 0.22)',
              },
            ]}
          />

          <View style={styles.header}>
            <View style={styles.headerMain}>
              <View>
                <Text
                  style={[
                    styles.eyebrow,
                    { color: colors.textMuted, fontFamily: fontFamily.medium },
                  ]}
                >
                  Day details
                </Text>
                <View style={styles.titleRow}>
                  <Text
                    style={[
                      styles.title,
                      {
                        color: colors.textMain,
                        fontFamily: fontFamily.bold,
                        fontSize: fontSize.xl,
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
                      {selectedEntries.length} item{selectedEntries.length === 1 ? '' : 's'}
                    </Text>
                  </View>
                </View>
              </View>
              <Button
                label="Add"
                onPress={onOpenUpload}
                icon="add"
                size="sm"
                fullWidth={false}
              />
            </View>
            <Pressable onPress={onClose} hitSlop={10}>
              <Ionicons name="close" size={20} color={colors.textMuted} />
            </Pressable>
          </View>

          {selectedEntries.length > 0 ? (
            <Text
              style={[
                styles.supportText,
                { color: colors.textMuted, fontFamily: fontFamily.regular },
              ]}
            >
              Ordered by logged time
            </Text>
          ) : null}

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
          >
            {selectedEntries.length === 0 ? (
              <View
                style={[
                  styles.emptyState,
                  {
                    backgroundColor: colors.surfaceSubtle,
                    borderColor: colors.borderSubtle,
                  },
                ]}
              >
                <View
                  style={[
                    styles.emptyStateIconWrap,
                    {
                      backgroundColor: isDark
                        ? 'rgba(148, 163, 184, 0.08)'
                        : 'rgba(148, 163, 184, 0.10)',
                    },
                  ]}
                >
                  <Ionicons
                    name="calendar-clear-outline"
                    size={18}
                    color={colors.textMuted}
                  />
                </View>
                <View style={styles.emptyStateCopy}>
                  <Text
                    style={[
                      styles.emptyTitle,
                      { color: colors.textMain, fontFamily: fontFamily.semiBold },
                    ]}
                  >
                    No entries on this day
                  </Text>
                  <Text
                    style={[
                      styles.emptyText,
                      { color: colors.textMuted, fontFamily: fontFamily.regular },
                    ]}
                  >
                    Use Upload Report to add prescriptions, reports, and other health records.
                  </Text>
                </View>
                <Button
                  label="Upload Report"
                  onPress={onOpenUpload}
                  size="sm"
                  fullWidth={false}
                  style={styles.emptyStateButton}
                />
              </View>
            ) : (
              <View style={styles.entryList}>
                {selectedEntries.map((entry) => (
                  <DayEntryCard
                    key={entry.id}
                    entry={entry}
                    onPress={
                      entry.entry_type === 'document'
                        ? () => onOpenDocument(String(entry.id))
                        : undefined
                    }
                  />
                ))}
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    flex: 1,
  },
  card: {
    borderTopWidth: 1,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 24,
    gap: 14,
    maxHeight: '78%',
  },
  handle: {
    width: 44,
    height: 5,
    borderRadius: 999,
    alignSelf: 'center',
    marginBottom: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  headerMain: {
    flex: 1,
    gap: 12,
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
    lineHeight: 24,
  },
  badge: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  badgeText: {
    fontSize: 12,
  },
  supportText: {
    fontSize: 12,
  },
  scroll: {
    flexGrow: 0,
  },
  content: {
    paddingBottom: 8,
  },
  emptyState: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 18,
    paddingHorizontal: 18,
    paddingVertical: 18,
    alignItems: 'flex-start',
    gap: 12,
  },
  emptyStateIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateCopy: {
    gap: 6,
  },
  emptyTitle: {
    fontSize: 15,
  },
  emptyText: {
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'left',
    maxWidth: 300,
  },
  emptyStateButton: {
    marginTop: 2,
  },
  entryList: {
    gap: 10,
  },
});
