import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  launchCamera,
  launchImageLibrary,
  type Asset,
} from 'react-native-image-picker';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { GradientBackground } from '../../components/layout/GradientBackground';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Logo } from '../../components/ui/Logo';
import { useAuth } from '../../hooks/useAuth';
import { useAppTheme } from '../../hooks/useAppTheme';
import { authService } from '../../services/authService';
import { dashboardService } from '../../services/dashboardService';
import type { DashboardEntry } from '../../types/dashboard.types';
import type { RootStackParamList } from '../../navigation/types';
import { DayDetailsDrawer } from './components/DayDetailsDrawer';
import {
  DashboardViewToggle,
  type DashboardViewMode,
} from './components/DashboardViewToggle';
import { SelectedDaySummaryCard } from './components/SelectedDaySummaryCard';
import { TimelineView } from './components/TimelineView';
import {
  flattenCalendarResponse,
  getCalendarGrid,
  getEntrySummary,
  getEntryTitle,
  normalizeEntry,
  safeIsoDate,
  toDateKey,
} from './dashboardUtils';

const WEEK_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MAX_STORAGE_BYTES = 100 * 1024 * 1024;
const CATEGORY_OPTIONS = ['Medical Report', 'Prescription', 'Other'] as const;
const TIMELINE_MONTHS_PER_PAGE = 3;
const TIMELINE_MAX_LOOKBACK_MONTHS = 24;

type SelectedAsset = {
  uri: string;
  name: string;
  type: string;
};

function formatBytes(bytes: number) {
  const mb = bytes / (1024 * 1024);
  return `${mb.toFixed(1)} MB`;
}

function inferFileExtension(uri: string, mimeType?: string) {
  const uriPath = uri.split('?')[0];
  const match = uriPath.match(/\.([a-zA-Z0-9]+)$/);
  if (match?.[1]) {
    return `.${match[1].toLowerCase()}`;
  }

  switch (mimeType) {
    case 'image/png':
      return '.png';
    case 'image/jpeg':
    case 'image/jpg':
      return '.jpg';
    case 'application/pdf':
      return '.pdf';
    default:
      return '.jpg';
  }
}

function normalizeUploadAsset(asset: Asset): SelectedAsset {
  const uri = asset.uri || '';
  const extension = inferFileExtension(uri, asset.type);
  const rawName = asset.fileName || `report-${Date.now()}${extension}`;
  const finalName = /\.[a-zA-Z0-9]+$/.test(rawName) ? rawName : `${rawName}${extension}`;

  return {
    uri,
    name: finalName,
    type: asset.type || 'image/jpeg',
  };
}

export default function DashboardScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user, logout } = useAuth();
  const { colors, fontFamily, fontSize, spacing, borderRadius, shadow, isDark } =
    useAppTheme();
  const { width } = useWindowDimensions();

  const compact = width < 420;
  const today = new Date();

  const [visibleMonth, setVisibleMonth] = useState(
    new Date(today.getFullYear(), today.getMonth(), 1),
  );
  const [viewMode, setViewMode] = useState<DashboardViewMode>('calendar');
  const [selectedDateKey, setSelectedDateKey] = useState(toDateKey(today));
  const [reportsMap, setReportsMap] = useState<Record<string, DashboardEntry[]>>({});
  const [timelineEntries, setTimelineEntries] = useState<DashboardEntry[]>([]);
  const [timelineCursorMonth, setTimelineCursorMonth] = useState<Date | null>(null);
  const [timelineLoadedMonthCount, setTimelineLoadedMonthCount] = useState(0);
  const [timelineLoading, setTimelineLoading] = useState(false);
  const [timelineLoadingMore, setTimelineLoadingMore] = useState(false);
  const [hasMoreTimelineEntries, setHasMoreTimelineEntries] = useState(true);
  const [timelineError, setTimelineError] = useState<string | null>(null);
  const [storageUsedBytes, setStorageUsedBytes] = useState(0);
  const [aiUsedCredit, setAiUsedCredit] = useState(0);
  const [aiLeftCredit, setAiLeftCredit] = useState(0);
  const [aiTotalCredit, setAiTotalCredit] = useState(0);
  const [aiRenewDate, setAiRenewDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [screenError, setScreenError] = useState<string | null>(null);
  const [isDayDetailsOpen, setIsDayDetailsOpen] = useState(false);

  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<SelectedAsset | null>(null);
  const [documentName, setDocumentName] = useState('');
  const [category, setCategory] =
    useState<(typeof CATEGORY_OPTIONS)[number]>('Medical Report');
  const [documentDate, setDocumentDate] = useState(safeIsoDate());
  const [tags, setTags] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const calendarDays = useMemo(() => getCalendarGrid(visibleMonth), [visibleMonth]);
  const selectedEntries = reportsMap[selectedDateKey] ?? [];
  const monthTitle = visibleMonth.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });
  const selectedDateLabel = new Date(selectedDateKey).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });

  const storagePercent = Math.min((storageUsedBytes / MAX_STORAGE_BYTES) * 100, 100);
  const aiCreditPercent = aiTotalCredit
    ? Math.min((aiUsedCredit / aiTotalCredit) * 100, 100)
    : 0;

  const firstName = user?.name?.trim()?.split(' ')[0] || 'User';

  useEffect(() => {
    void loadDashboard(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visibleMonth]);

  useEffect(() => {
    if (viewMode === 'timeline') {
      void loadTimelinePage(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewMode, visibleMonth]);

  async function loadDashboard(showPullToRefresh: boolean) {
    if (showPullToRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      setScreenError(null);

      const [calendarRes, usageRes, aiRes] = await Promise.all([
        dashboardService.getMonthlyReports(
          visibleMonth.getMonth() + 1,
          visibleMonth.getFullYear(),
        ),
        authService.getUserUsage(),
        authService.getAICredits(),
      ]);

      const normalizedMap = Object.fromEntries(
        Object.entries(calendarRes.days ?? {}).map(([date, payload]) => [
          date,
          (payload.documents ?? []).map(normalizeEntry),
        ]),
      );

      setReportsMap(normalizedMap);

      const monthSelectedDate = new Date(selectedDateKey);
      if (
        monthSelectedDate.getFullYear() !== visibleMonth.getFullYear() ||
        monthSelectedDate.getMonth() !== visibleMonth.getMonth()
      ) {
        setSelectedDateKey(toDateKey(new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), 1)));
      }

      const totalStorageUsed =
        usageRes.usage?.TotalStorageUsed ?? usageRes.usage?.total_storage_used ?? 0;
      setStorageUsedBytes(Number(totalStorageUsed) || 0);

      setAiUsedCredit(aiRes.usage?.usedCredit ?? 0);
      setAiLeftCredit(aiRes.usage?.leftCredit ?? 0);
      setAiTotalCredit(aiRes.usage?.totalCredit ?? 0);
      setAiRenewDate(aiRes.usage?.renewDate ?? '');
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to load dashboard data.';
      setScreenError(message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  async function loadTimelinePage(reset = false) {
    const baseMonth = reset
      ? new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), 1)
      : timelineCursorMonth;
    const initialLoadedMonthCount = reset ? 0 : timelineLoadedMonthCount;

    if (!baseMonth) {
      setHasMoreTimelineEntries(false);
      return;
    }

    if (reset) {
      setTimelineLoading(true);
      setTimelineError(null);
      setHasMoreTimelineEntries(true);
      setTimelineCursorMonth(baseMonth);
      setTimelineLoadedMonthCount(0);
    } else {
      if (timelineLoadingMore || !hasMoreTimelineEntries) {
        return;
      }
      setTimelineLoadingMore(true);
    }

    try {
      const batchEntries: DashboardEntry[] = [];
      let monthPointer = new Date(baseMonth);
      let monthsLoaded = initialLoadedMonthCount;
      let monthsFetched = 0;

      while (
        monthsFetched < TIMELINE_MONTHS_PER_PAGE &&
        monthsLoaded < TIMELINE_MAX_LOOKBACK_MONTHS
      ) {
        const response = await dashboardService.getMonthlyReports(
          monthPointer.getMonth() + 1,
          monthPointer.getFullYear(),
        );

        batchEntries.push(...flattenCalendarResponse(response));
        monthPointer = new Date(monthPointer.getFullYear(), monthPointer.getMonth() - 1, 1);
        monthsFetched += 1;
        monthsLoaded += 1;
      }

      batchEntries.sort((left, right) => {
        const leftTime = new Date(left.timestamp || left.document_date || 0).getTime();
        const rightTime = new Date(right.timestamp || right.document_date || 0).getTime();
        return rightTime - leftTime;
      });

      setTimelineEntries((currentEntries) =>
        reset ? batchEntries : [...currentEntries, ...batchEntries],
      );
      setTimelineCursorMonth(
        monthsLoaded < TIMELINE_MAX_LOOKBACK_MONTHS ? monthPointer : null,
      );
      setTimelineLoadedMonthCount(monthsLoaded);
      setHasMoreTimelineEntries(monthsLoaded < TIMELINE_MAX_LOOKBACK_MONTHS);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to load timeline.';
      setTimelineError(message);
    } finally {
      setTimelineLoading(false);
      setTimelineLoadingMore(false);
    }
  }

  async function refreshDashboard() {
    await Promise.all([
      loadDashboard(true),
      viewMode === 'timeline' || timelineEntries.length > 0
        ? loadTimelinePage(true)
        : Promise.resolve(),
    ]);
  }

  function handleChangeViewMode(mode: DashboardViewMode) {
    setViewMode(mode);
  }

  function openDayDetails(dateKey: string) {
    setSelectedDateKey(dateKey);
    setIsDayDetailsOpen(true);
  }

  function closeDayDetails() {
    setIsDayDetailsOpen(false);
  }

  function handleOpenUploadFromDrawer() {
    closeDayDetails();
    openUploadModal();
  }

  function handleOpenDocumentFromDrawer(entryId: string) {
    closeDayDetails();
    navigation.navigate('DocumentDetails', { id: entryId });
  }

  function handleOpenTimelineDocument(entryId: string) {
    navigation.navigate('DocumentDetails', { id: entryId });
  }

  function openUploadModal() {
    setUploadError(null);
    setSelectedAsset(null);
    setDocumentName('');
    setCategory('Medical Report');
    setDocumentDate(safeIsoDate());
    setTags('');
    setIsUploadModalOpen(true);
  }

  function closeUploadModal() {
    if (!uploading) {
      setIsUploadModalOpen(false);
    }
  }

  async function pickFromLibrary() {
    const result = await launchImageLibrary({
      mediaType: 'photo',
      quality: 0.8,
    });

    if (result.errorMessage) {
      Alert.alert('Image picker error', result.errorMessage);
      return;
    }

    if (!result.didCancel && result.assets?.[0]?.uri) {
      const asset = result.assets[0];
      setSelectedAsset(normalizeUploadAsset(asset));
    }
  }

  async function captureFromCamera() {
    const result = await launchCamera({
      mediaType: 'photo',
      quality: 0.8,
    });

    if (result.errorMessage) {
      Alert.alert('Camera error', result.errorMessage);
      return;
    }

    if (!result.didCancel && result.assets?.[0]?.uri) {
      const asset = result.assets[0];
      setSelectedAsset(normalizeUploadAsset(asset));
    }
  }

  async function submitUpload() {
    if (!selectedAsset) {
      setUploadError('Select a report image before uploading.');
      return;
    }

    if (!documentName.trim()) {
      setUploadError('Document name is required.');
      return;
    }

    if (!documentDate.trim()) {
      setUploadError('Document date is required.');
      return;
    }

    setUploading(true);
    setUploadError(null);

    try {
      const uploadRes = await dashboardService.uploadFile(selectedAsset, 'lab_report');
      const fileId = uploadRes.files?.[0]?.file_id;

      if (!fileId) {
        throw new Error('Upload succeeded but no file id was returned.');
      }

      await dashboardService.submitDocument({
        file_id: fileId,
        category,
        document_name: documentName.trim(),
        document_date: documentDate.trim(),
        tags: tags
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean),
      });

      setIsUploadModalOpen(false);
      await Promise.all([
        loadDashboard(false),
        viewMode === 'timeline' || timelineEntries.length > 0
          ? loadTimelinePage(true)
          : Promise.resolve(),
      ]);
      Alert.alert('Uploaded', 'Your report has been added to the dashboard.');
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unable to upload the report.';
      setUploadError(message);
    } finally {
      setUploading(false);
    }
  }

  const usageCards = [
    {
      label: 'Storage',
      value: formatBytes(storageUsedBytes),
      detail: `${storagePercent.toFixed(0)}% of plan used`,
      icon: 'server-outline' as const,
      tone: colors.primary,
      tint: isDark ? 'rgba(45, 212, 191, 0.12)' : 'rgba(13, 148, 136, 0.10)',
    },
    {
      label: 'AI Credits',
      value: `${aiLeftCredit} left`,
      detail: aiRenewDate
        ? `Renews ${new Date(aiRenewDate).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
          })}`
        : `${aiCreditPercent.toFixed(0)}% used`,
      icon: 'sparkles-outline' as const,
      tone: colors.secondary,
      tint: isDark ? 'rgba(56, 189, 248, 0.12)' : 'rgba(3, 105, 161, 0.10)',
    },
  ];

  return (
    <GradientBackground>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={[
            styles.content,
            { paddingHorizontal: compact ? spacing[4] : spacing[5], paddingBottom: spacing[12] },
          ]}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => void refreshDashboard()} />
          }
          showsVerticalScrollIndicator={false}
        >
          <View
            style={[
              styles.headerCard,
              {
                backgroundColor: colors.surfaceSoft,
                borderColor: colors.glassBorder,
                borderRadius: borderRadius['2xl'],
              },
            ]}
          >
            <View style={styles.headerTopRow}>
              <View style={styles.brandRow}>
                <View style={styles.headerIdentity}>
                  <Logo size={compact ? 'sm' : 'md'} />
                  <Text
                    style={[
                      styles.headerMiniCopy,
                      { color: colors.textMuted, fontFamily: fontFamily.regular },
                    ]}
                  >
                    {monthTitle}
                  </Text>
                </View>
              </View>

              <View style={styles.quickActions}>
                <Pressable
                  onPress={openUploadModal}
                  style={[
                    styles.quickIconButton,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.borderSubtle,
                    },
                  ]}
                >
                  <Ionicons name="cloud-upload-outline" size={18} color={colors.primary} />
                </Pressable>
                <Pressable
                  onPress={() => void logout()}
                  style={[
                    styles.quickIconButton,
                    {
                      backgroundColor: colors.errorBg,
                      borderColor: colors.errorBorder,
                    },
                  ]}
                >
                  <Ionicons name="log-out-outline" size={18} color={colors.errorText} />
                </Pressable>
              </View>
            </View>

            <View style={styles.headerBottomRow}>
              <View style={styles.headerCopyCompact}>
                <Text
                  style={[
                    styles.headerTitleCompact,
                    {
                      color: colors.textMain,
                      fontFamily: fontFamily.bold,
                      fontSize: compact ? fontSize.xl : fontSize['2xl'],
                    },
                  ]}
                >
                  Good morning, {firstName}
                </Text>
                <Text
                  style={[
                    styles.headerSubtitleCompact,
                    {
                      color: colors.textMuted,
                      fontFamily: fontFamily.regular,
                    },
                  ]}
                >
                  Reports, vitals, credits.
                </Text>
              </View>

              {!compact ? (
                <Button
                  label="Upload"
                  onPress={openUploadModal}
                  icon="add"
                  size="sm"
                  fullWidth={false}
                  style={styles.uploadInlineButton}
                />
              ) : null}
            </View>
          </View>

          <View style={styles.slimStatsRow}>
            {usageCards.map((card) => (
              <Card
                key={card.label}
                style={{
                  ...styles.slimStatCard,
                  ...(compact ? styles.slimStatCardCompact : {}),
                }}
              >
                <View style={styles.slimStatTop}>
                  <View style={[styles.metricIconWrap, { backgroundColor: card.tint }]}>
                    <Ionicons name={card.icon} size={16} color={card.tone} />
                  </View>
                  <Text
                    style={[
                      styles.slimStatLabel,
                      { color: colors.textMuted, fontFamily: fontFamily.medium },
                    ]}
                  >
                    {card.label}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.slimStatValue,
                    {
                      color: colors.textMain,
                      fontFamily: fontFamily.bold,
                      fontSize: compact ? fontSize.lg : fontSize.xl,
                    },
                  ]}
                >
                  {card.value}
                </Text>
                <Text
                  style={[
                    styles.slimStatDetail,
                    { color: colors.textMuted, fontFamily: fontFamily.regular },
                  ]}
                >
                  {card.detail}
                </Text>
              </Card>
            ))}
          </View>

          <Card style={{ ...styles.calendarCard, ...shadow.md }}>
            <View
              style={[
                styles.calendarToolbar,
                compact && { alignItems: 'flex-start', flexDirection: 'column' },
              ]}
            >
              <View style={styles.calendarHeaderCopy}>
                <Text
                  style={[
                    styles.sectionEyebrow,
                    { color: colors.textMuted, fontFamily: fontFamily.medium },
                  ]}
                >
                  {viewMode === 'calendar' ? 'Calendar' : 'Timeline'}
                </Text>
                <View style={styles.calendarHeaderTitleRow}>
                  <Text
                    style={[
                      styles.sectionTitle,
                      {
                        color: colors.textMain,
                        fontFamily: fontFamily.bold,
                        fontSize: fontSize['2xl'],
                      },
                    ]}
                  >
                    {viewMode === 'calendar' ? monthTitle : 'Document Timeline'}
                  </Text>
                </View>
              </View>

              <View
                style={[
                  styles.toolbarActions,
                  compact && styles.toolbarActionsCompact,
                ]}
              >
                <DashboardViewToggle value={viewMode} onChange={handleChangeViewMode} />

                {viewMode === 'calendar' ? (
                  <View style={styles.navRow}>
                    <Pressable
                      onPress={() =>
                        setVisibleMonth(
                          new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() - 1, 1),
                        )
                      }
                      style={[
                        styles.navButton,
                        { backgroundColor: colors.surface, borderColor: colors.border },
                      ]}
                    >
                      <Ionicons name="chevron-back" size={18} color={colors.textMain} />
                    </Pressable>
                    <Pressable
                      onPress={() =>
                        setVisibleMonth(
                          new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 1),
                        )
                      }
                      style={[
                        styles.navButton,
                        { backgroundColor: colors.surface, borderColor: colors.border },
                      ]}
                    >
                      <Ionicons name="chevron-forward" size={18} color={colors.textMain} />
                    </Pressable>
                  </View>
                ) : null}
              </View>
            </View>

            {screenError && viewMode === 'calendar' ? (
              <View
                style={[
                  styles.banner,
                  {
                    backgroundColor: colors.errorBg,
                    borderColor: colors.errorBorder,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.bannerText,
                    { color: colors.errorText, fontFamily: fontFamily.medium },
                  ]}
                >
                  {screenError}
                </Text>
              </View>
            ) : null}

            {viewMode === 'calendar' ? (
              <>
                <View style={styles.weekRow}>
                  {WEEK_DAYS.map((day) => (
                    <Text
                      key={day}
                      style={[
                        styles.weekDay,
                        {
                          color: colors.textMuted,
                          fontFamily: fontFamily.medium,
                          fontSize: compact ? fontSize.xs : fontSize.sm,
                        },
                      ]}
                    >
                      {compact ? day.slice(0, 1) : day}
                    </Text>
                  ))}
                </View>

                {loading ? (
                  <View style={styles.loaderWrap}>
                    <ActivityIndicator color={colors.primary} />
                    <Text
                      style={[
                        styles.loaderText,
                        { color: colors.textMuted, fontFamily: fontFamily.medium },
                      ]}
                    >
                      Loading dashboard
                    </Text>
                  </View>
                ) : (
                  <View style={styles.calendarGrid}>
                    {calendarDays.map((date) => {
                      const dateKey = toDateKey(date);
                      const entries = reportsMap[dateKey] ?? [];
                      const isCurrentMonth = date.getMonth() === visibleMonth.getMonth();
                      const isSelected = dateKey === selectedDateKey;
                      const isToday = dateKey === toDateKey(today);

                      return (
                        <Pressable
                          key={dateKey}
                          onPress={() => openDayDetails(dateKey)}
                          style={[
                            styles.dayCell,
                            {
                              backgroundColor: isSelected
                                ? isDark
                                  ? 'rgba(45, 212, 191, 0.16)'
                                  : 'rgba(13, 148, 136, 0.10)'
                                : colors.surfaceSoft,
                              borderColor: isSelected ? colors.primary : colors.borderSubtle,
                              opacity: isCurrentMonth ? 1 : 0.42,
                              minHeight: compact ? 84 : 96,
                            },
                          ]}
                        >
                          <View style={styles.dayCellHeader}>
                            <Text
                              style={[
                                styles.dayNumber,
                                {
                                  color:
                                    isToday || isSelected ? colors.primary : colors.textMain,
                                  fontFamily: isSelected
                                    ? fontFamily.bold
                                    : fontFamily.medium,
                                },
                              ]}
                            >
                              {date.getDate()}
                            </Text>

                            {entries.length > 0 ? (
                              <View
                                style={[
                                  styles.dayCountPill,
                                  {
                                    backgroundColor: isDark
                                      ? 'rgba(45, 212, 191, 0.14)'
                                      : 'rgba(13, 148, 136, 0.08)',
                                  },
                                ]}
                              >
                                <Text
                                  style={[
                                    styles.dayCountText,
                                    {
                                      color: colors.primary,
                                      fontFamily: fontFamily.semiBold,
                                    },
                                  ]}
                                >
                                  {entries.length}
                                </Text>
                              </View>
                            ) : null}
                          </View>

                          {entries.length > 0 ? (
                            <View style={styles.dayPreview}>
                              <View style={styles.dayPreviewTop}>
                                <View
                                  style={[
                                    styles.entryStripe,
                                    {
                                      backgroundColor:
                                        entries[0].entry_type === 'direct_entry'
                                          ? colors.secondary
                                          : colors.primary,
                                    },
                                  ]}
                                />
                                {entries[0].analysis_generated ? (
                                  <View
                                    style={[
                                      styles.dayAiDot,
                                      { backgroundColor: colors.successText },
                                    ]}
                                  />
                                ) : null}
                              </View>
                              <Text
                                numberOfLines={1}
                                style={[
                                  styles.dayPreviewText,
                                  {
                                    color: colors.textMain,
                                    fontFamily: fontFamily.medium,
                                  },
                                ]}
                              >
                                {getEntryTitle(entries[0])}
                              </Text>
                              {!compact ? (
                                <Text
                                  numberOfLines={1}
                                  style={[
                                    styles.dayPreviewMeta,
                                    {
                                      color: colors.textPlaceholder,
                                      fontFamily: fontFamily.regular,
                                    },
                                  ]}
                                >
                                  {getEntrySummary(entries[0])}
                                </Text>
                              ) : null}
                            </View>
                          ) : (
                            <View style={styles.emptyDaySpacer} />
                          )}
                        </Pressable>
                      );
                    })}
                  </View>
                )}
              </>
            ) : (
              <TimelineView
                entries={timelineEntries}
                loading={timelineLoading}
                loadingMore={timelineLoadingMore}
                hasMore={hasMoreTimelineEntries}
                error={timelineError}
                onLoadMore={() => void loadTimelinePage(false)}
                onOpenDocument={handleOpenTimelineDocument}
                onOpenUpload={openUploadModal}
              />
            )}
          </Card>

          {viewMode === 'calendar' ? (
            <SelectedDaySummaryCard
              compact={compact}
              selectedDateLabel={selectedDateLabel}
              selectedEntries={selectedEntries}
              onOpenDetails={() => openDayDetails(selectedDateKey)}
            />
          ) : null}
        </ScrollView>

        <DayDetailsDrawer
          visible={isDayDetailsOpen}
          selectedDateLabel={selectedDateLabel}
          selectedEntries={selectedEntries}
          onClose={closeDayDetails}
          onOpenUpload={handleOpenUploadFromDrawer}
          onOpenDocument={handleOpenDocumentFromDrawer}
        />

        <Modal
          animationType="slide"
          transparent
          visible={isUploadModalOpen}
          onRequestClose={closeUploadModal}
        >
          <View style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}>
            <View
              style={[
                styles.modalCard,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.borderSubtle,
                  borderRadius: borderRadius['2xl'],
                },
              ]}
            >
              <View style={styles.modalHeader}>
                <View>
                  <Text
                    style={[
                      styles.sectionEyebrow,
                      { color: colors.textMuted, fontFamily: fontFamily.medium },
                    ]}
                  >
                    Upload
                  </Text>
                  <Text
                    style={[
                      styles.modalTitle,
                      {
                        color: colors.textMain,
                        fontFamily: fontFamily.bold,
                        fontSize: fontSize.xl,
                      },
                    ]}
                  >
                    Add a new report
                  </Text>
                </View>
                <Pressable onPress={closeUploadModal} hitSlop={10}>
                  <Ionicons name="close" size={20} color={colors.textMuted} />
                </Pressable>
              </View>

              <View style={styles.uploadChoiceRow}>
                <Pressable
                  onPress={() => void pickFromLibrary()}
                  style={[
                    styles.uploadChoice,
                    {
                      backgroundColor: colors.surfaceSubtle,
                      borderColor: colors.borderSubtle,
                    },
                  ]}
                >
                  <Ionicons name="images-outline" size={18} color={colors.primary} />
                  <Text
                    style={[
                      styles.uploadChoiceText,
                      { color: colors.textMain, fontFamily: fontFamily.medium },
                    ]}
                  >
                    Library
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => void captureFromCamera()}
                  style={[
                    styles.uploadChoice,
                    {
                      backgroundColor: colors.surfaceSubtle,
                      borderColor: colors.borderSubtle,
                    },
                  ]}
                >
                  <Ionicons name="camera-outline" size={18} color={colors.primary} />
                  <Text
                    style={[
                      styles.uploadChoiceText,
                      { color: colors.textMain, fontFamily: fontFamily.medium },
                    ]}
                  >
                    Camera
                  </Text>
                </Pressable>
              </View>

              {selectedAsset ? (
                <View
                  style={[
                    styles.assetPreviewCard,
                    {
                      backgroundColor: colors.surfaceSubtle,
                      borderColor: colors.borderSubtle,
                    },
                  ]}
                >
                  <Image source={{ uri: selectedAsset.uri }} style={styles.assetImage} />
                  <View style={styles.assetMeta}>
                    <Text
                      numberOfLines={1}
                      style={[
                        styles.assetName,
                        { color: colors.textMain, fontFamily: fontFamily.semiBold },
                      ]}
                    >
                      {selectedAsset.name}
                    </Text>
                    <Text
                      style={[
                        styles.assetType,
                        { color: colors.textMuted, fontFamily: fontFamily.regular },
                      ]}
                    >
                      {selectedAsset.type}
                    </Text>
                  </View>
                </View>
              ) : null}

              <Input
                label="Document name"
                placeholder="e.g. CBC Report"
                value={documentName}
                onChangeText={setDocumentName}
              />

              <View style={styles.categoryRow}>
                {CATEGORY_OPTIONS.map((option) => {
                  const active = option === category;
                  return (
                    <Pressable
                      key={option}
                      onPress={() => setCategory(option)}
                      style={[
                        styles.categoryChip,
                        {
                          backgroundColor: active
                            ? isDark
                              ? 'rgba(45, 212, 191, 0.14)'
                              : 'rgba(13, 148, 136, 0.10)'
                            : colors.surfaceSubtle,
                          borderColor: active ? colors.primary : colors.borderSubtle,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.categoryChipText,
                          {
                            color: active ? colors.primary : colors.textMuted,
                            fontFamily: active ? fontFamily.semiBold : fontFamily.medium,
                          },
                        ]}
                      >
                        {option}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <Input
                label="Document date"
                placeholder="YYYY-MM-DD"
                value={documentDate}
                onChangeText={setDocumentDate}
              />
              <Input
                label="Tags"
                placeholder="cbc, fasting, follow-up"
                value={tags}
                onChangeText={setTags}
                hint="Comma separated tags"
              />

              {uploadError ? (
                <View
                  style={[
                    styles.banner,
                    {
                      backgroundColor: colors.errorBg,
                      borderColor: colors.errorBorder,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.bannerText,
                      { color: colors.errorText, fontFamily: fontFamily.medium },
                    ]}
                  >
                    {uploadError}
                  </Text>
                </View>
              ) : null}

              <View style={[styles.modalActions, compact && styles.modalActionsCompact]}>
                <Button
                  label="Cancel"
                  onPress={closeUploadModal}
                  variant="secondary"
                  size="sm"
                  fullWidth={compact}
                />
                <Button
                  label="Upload"
                  onPress={() => void submitUpload()}
                  size="sm"
                  loading={uploading}
                  fullWidth={compact}
                />
              </View>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  content: {
    paddingTop: 12,
    gap: 12,
  },
  headerCard: {
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerIdentity: {
    gap: 4,
  },
  headerMiniCopy: {
    fontSize: 12,
    marginLeft: 2,
  },
  quickActions: {
    flexDirection: 'row',
    gap: 8,
  },
  quickIconButton: {
    width: 40,
    height: 40,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  headerCopyCompact: {
    flex: 1,
    gap: 2,
  },
  headerTitleCompact: {
    lineHeight: 28,
  },
  headerSubtitleCompact: {
    fontSize: 13,
    lineHeight: 18,
  },
  uploadInlineButton: {
    minWidth: 104,
  },
  slimStatsRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  slimStatCard: {
    flex: 1,
    minWidth: '48%',
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 8,
  },
  slimStatCardCompact: {
    minWidth: '48%',
  },
  slimStatTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metricIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  slimStatLabel: {
    fontSize: 12,
  },
  slimStatValue: {
    lineHeight: 24,
  },
  slimStatDetail: {
    fontSize: 12,
    lineHeight: 16,
  },
  calendarCard: {
    padding: 16,
    gap: 18,
  },
  calendarToolbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  toolbarActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 10,
    flexWrap: 'wrap',
  },
  toolbarActionsCompact: {
    width: '100%',
    justifyContent: 'space-between',
  },
  calendarHeaderCopy: {
    gap: 4,
  },
  calendarHeaderTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
  },
  sectionEyebrow: {
    fontSize: 12,
    marginBottom: 2,
  },
  sectionTitle: {
    lineHeight: 32,
  },
  navRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 2,
  },
  navButton: {
    width: 44,
    height: 44,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  banner: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  bannerText: {
    fontSize: 13,
    lineHeight: 18,
  },
  weekRow: {
    flexDirection: 'row',
    marginTop: 10,
    marginBottom: 10,
  },
  weekDay: {
    width: '14.285714%',
    textAlign: 'center',
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
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.285714%',
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 6,
    paddingTop: 10,
    paddingBottom: 8,
  },
  dayCellHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 4,
  },
  dayNumber: {
    fontSize: 14,
  },
  dayCountPill: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  dayCountText: {
    fontSize: 10,
  },
  dayPreview: {
    marginTop: 8,
    gap: 5,
  },
  dayPreviewTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  entryStripe: {
    width: 20,
    height: 3,
    borderRadius: 999,
  },
  dayAiDot: {
    width: 6,
    height: 6,
    borderRadius: 999,
  },
  dayPreviewText: {
    fontSize: 10,
    lineHeight: 12,
  },
  dayPreviewMeta: {
    fontSize: 9,
    lineHeight: 12,
  },
  emptyDaySpacer: {
    height: 18,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalCard: {
    borderTopWidth: 1,
    padding: 20,
    gap: 14,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  modalTitle: {
    lineHeight: 24,
  },
  uploadChoiceRow: {
    flexDirection: 'row',
    gap: 10,
  },
  uploadChoice: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  uploadChoiceText: {
    fontSize: 14,
  },
  assetPreviewCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  assetImage: {
    width: 58,
    height: 58,
    borderRadius: 12,
    backgroundColor: '#dbe5ea',
  },
  assetMeta: {
    flex: 1,
    gap: 4,
  },
  assetName: {
    fontSize: 14,
  },
  assetType: {
    fontSize: 12,
  },
  categoryRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  categoryChip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  categoryChipText: {
    fontSize: 12,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  modalActionsCompact: {
    flexDirection: 'column',
  },
});
