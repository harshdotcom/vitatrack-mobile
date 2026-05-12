import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Button } from '../../../components/ui/Button';
import { useAppTheme } from '../../../hooks/useAppTheme';
import type { DashboardEntry } from '../../../types/dashboard.types';
import { getEntrySummary, getEntryTitle } from '../dashboardUtils';

interface TimelineViewProps {
  entries: DashboardEntry[];
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  error: string | null;
  onLoadMore: () => void;
  onOpenDocument: (entryId: string) => void;
  onOpenUpload: () => void;
}

function formatTimelineDate(entry: DashboardEntry) {
  const raw = entry.document_date || entry.timestamp;
  if (!raw) {
    return 'Recently added';
  }

  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) {
    return 'Recently added';
  }

  return parsed.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function TimelineView({
  entries,
  loading,
  loadingMore,
  hasMore,
  error,
  onLoadMore,
  onOpenDocument,
  onOpenUpload,
}: TimelineViewProps) {
  const { colors, fontFamily, fontSize, borderRadius, isDark } = useAppTheme();

  if (loading) {
    return (
      <View style={styles.loaderWrap}>
        <ActivityIndicator color={colors.primary} />
        <Text
          style={[
            styles.loaderText,
            { color: colors.textMuted, fontFamily: fontFamily.medium },
          ]}
        >
          Loading timeline
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View
        style={[
          styles.banner,
          {
            backgroundColor: colors.errorBg,
            borderColor: colors.errorBorder,
            borderRadius: borderRadius.lg,
          },
        ]}
      >
        <Text
          style={[
            styles.bannerText,
            { color: colors.errorText, fontFamily: fontFamily.medium },
          ]}
        >
          {error}
        </Text>
      </View>
    );
  }

  if (entries.length === 0) {
    return (
      <View
        style={[
          styles.emptyState,
          {
            backgroundColor: colors.surfaceSubtle,
            borderColor: colors.borderSubtle,
            borderRadius: borderRadius.xl,
          },
        ]}
      >
        <View
          style={[
            styles.emptyIconWrap,
            {
              backgroundColor: isDark
                ? 'rgba(45, 212, 191, 0.10)'
                : 'rgba(13, 148, 136, 0.08)',
            },
          ]}
        >
          <Ionicons name="time-outline" size={18} color={colors.primary} />
        </View>
        <View style={styles.emptyCopy}>
          <Text
            style={[
              styles.emptyTitle,
              { color: colors.textMain, fontFamily: fontFamily.semiBold },
            ]}
          >
            No health records in the timeline yet
          </Text>
          <Text
            style={[
              styles.emptyText,
              { color: colors.textMuted, fontFamily: fontFamily.regular },
            ]}
          >
            Add reports or vitals to start building a clean chronological record.
          </Text>
        </View>
        <Button
          label="Upload Report"
          onPress={onOpenUpload}
          icon="add"
          size="sm"
          fullWidth={false}
        />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <View style={styles.list}>
        {entries.map((entry, index) => {
          const isLast = index === entries.length - 1;
          const canOpenDetails = entry.entry_type === 'document';

          return (
            <View key={entry.id} style={styles.row}>
              <View style={styles.rail}>
                {!isLast ? (
                  <View
                    style={[
                      styles.railLine,
                      {
                        backgroundColor: isDark
                          ? 'rgba(148, 163, 184, 0.22)'
                          : 'rgba(148, 163, 184, 0.28)',
                      },
                    ]}
                  />
                ) : null}
                <View
                  style={[
                    styles.markerOuter,
                    {
                      backgroundColor: isDark
                        ? 'rgba(45, 212, 191, 0.16)'
                        : 'rgba(13, 148, 136, 0.10)',
                      borderColor: colors.primary,
                    },
                  ]}
                >
                  <View
                    style={[styles.markerInner, { backgroundColor: colors.primary }]}
                  />
                </View>
              </View>

              <Pressable
                onPress={canOpenDetails ? () => onOpenDocument(entry.id) : undefined}
                style={[
                  styles.card,
                  {
                    backgroundColor: colors.surfaceSoft,
                    borderColor: colors.borderSubtle,
                    borderRadius: borderRadius.xl,
                  },
                ]}
              >
                <View style={styles.cardTop}>
                  <Text
                    style={[
                      styles.dateLabel,
                      { color: colors.textMuted, fontFamily: fontFamily.medium },
                    ]}
                  >
                    {formatTimelineDate(entry)}
                  </Text>
                  {canOpenDetails ? (
                    <Ionicons
                      name="chevron-forward"
                      size={16}
                      color={colors.textPlaceholder}
                    />
                  ) : null}
                </View>

                <Text
                  style={[
                    styles.title,
                    {
                      color: colors.textMain,
                      fontFamily: fontFamily.semiBold,
                      fontSize: fontSize.lg,
                    },
                  ]}
                >
                  {getEntryTitle(entry)}
                </Text>

                <Text
                  style={[
                    styles.meta,
                    { color: colors.textMuted, fontFamily: fontFamily.regular },
                  ]}
                >
                  {getEntrySummary(entry)}
                </Text>

                <View style={styles.footer}>
                  <View
                    style={[
                      styles.statusPill,
                      {
                        backgroundColor:
                          entry.entry_type === 'direct_entry'
                            ? isDark
                              ? 'rgba(56, 189, 248, 0.12)'
                              : 'rgba(3, 105, 161, 0.08)'
                            : isDark
                            ? 'rgba(45, 212, 191, 0.12)'
                            : 'rgba(13, 148, 136, 0.08)',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusText,
                        {
                          color:
                            entry.entry_type === 'direct_entry'
                              ? colors.secondary
                              : colors.primary,
                          fontFamily: fontFamily.semiBold,
                        },
                      ]}
                    >
                      {entry.entry_type === 'direct_entry' ? 'Vital' : entry.category}
                    </Text>
                  </View>

                  {entry.analysis_generated ? (
                    <View
                      style={[
                        styles.statusPill,
                        {
                          backgroundColor: colors.successBg,
                          borderColor: colors.successBorder,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusText,
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
                </View>
              </Pressable>
            </View>
          );
        })}
      </View>

      <View style={styles.loadMoreWrap}>
        {loadingMore ? (
          <View style={styles.loadingMore}>
            <ActivityIndicator color={colors.primary} size="small" />
            <Text
              style={[
                styles.loadingMoreText,
                { color: colors.textMuted, fontFamily: fontFamily.medium },
              ]}
            >
              Loading more
            </Text>
          </View>
        ) : hasMore ? (
          <Button
            label="Load more"
            onPress={onLoadMore}
            variant="secondary"
            size="sm"
            fullWidth={false}
          />
        ) : (
          <Text
            style={[
              styles.timelineEnd,
              { color: colors.textMuted, fontFamily: fontFamily.medium },
            ]}
          >
            All documents loaded
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: 18,
  },
  loaderWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    gap: 10,
  },
  loaderText: {
    fontSize: 13,
  },
  banner: {
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  bannerText: {
    fontSize: 13,
    lineHeight: 18,
  },
  emptyState: {
    borderWidth: 1,
    borderStyle: 'dashed',
    paddingHorizontal: 18,
    paddingVertical: 18,
    gap: 12,
  },
  emptyIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyCopy: {
    gap: 6,
  },
  emptyTitle: {
    fontSize: 15,
  },
  emptyText: {
    fontSize: 13,
    lineHeight: 19,
  },
  list: {
    gap: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 12,
  },
  rail: {
    width: 20,
    alignItems: 'center',
    position: 'relative',
  },
  railLine: {
    position: 'absolute',
    top: 22,
    bottom: -12,
    width: 1.5,
  },
  markerOuter: {
    width: 18,
    height: 18,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
  },
  markerInner: {
    width: 7,
    height: 7,
    borderRadius: 999,
  },
  card: {
    flex: 1,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 15,
    gap: 8,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  dateLabel: {
    fontSize: 12,
  },
  title: {
    lineHeight: 24,
  },
  meta: {
    fontSize: 13,
    lineHeight: 18,
  },
  footer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 2,
  },
  statusPill: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  statusText: {
    fontSize: 11,
  },
  loadMoreWrap: {
    alignItems: 'center',
    paddingTop: 2,
  },
  loadingMore: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  loadingMoreText: {
    fontSize: 13,
  },
  timelineEnd: {
    fontSize: 12,
  },
});
