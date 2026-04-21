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
import * as ImagePicker from 'expo-image-picker';
import { type Href, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { GradientBackground } from '../../components/layout/GradientBackground';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useAuth } from '../../hooks/useAuth';
import { useAppTheme } from '../../hooks/useAppTheme';
import { authService } from '../../services/authService';
import { dashboardService } from '../../services/dashboardService';
import type { DashboardEntry } from '../../types/dashboard.types';

const WEEK_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MAX_STORAGE_BYTES = 100 * 1024 * 1024;
const CATEGORY_OPTIONS = ['Medical Report', 'Prescription', 'Other'] as const;

type SelectedAsset = {
  uri: string;
  name: string;
  type: string;
};

function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getCalendarGrid(baseDate: Date) {
  const startOfMonth = new Date(baseDate.getFullYear(), baseDate.getMonth(), 1);
  const gridStart = new Date(startOfMonth);
  gridStart.setDate(startOfMonth.getDate() - startOfMonth.getDay());

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(gridStart);
    date.setDate(gridStart.getDate() + index);
    return date;
  });
}

function normalizeEntry(entry: DashboardEntry): DashboardEntry {
  return {
    id: entry.id,
    entry_type: entry.entry_type === 'direct_entry' ? 'direct_entry' : 'document',
    category: entry.category || 'Document',
    document_name: entry.document_name || entry.metric_label || 'Untitled',
    status: entry.status || 'uploaded',
    document_date: entry.document_date || entry.timestamp || '',
    analysis_generated: Boolean(entry.analysis_generated),
    metric_type: entry.metric_type,
    metric_label: entry.metric_label,
    metric_summary: entry.metric_summary,
    timestamp: entry.timestamp,
    tags: entry.tags,
  };
}

function getEntryTitle(entry: DashboardEntry) {
  return entry.entry_type === 'direct_entry'
    ? entry.metric_label || entry.document_name || 'Direct Entry'
    : entry.document_name || 'Document';
}

function getEntrySummary(entry: DashboardEntry) {
  return entry.entry_type === 'direct_entry'
    ? entry.metric_summary || 'Logged directly in VitaTrack'
    : entry.category || 'Document';
}

function getEntryTime(entry: DashboardEntry) {
  const raw = entry.timestamp || entry.document_date;
  if (!raw) {
    return '';
  }

  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatBytes(bytes: number) {
  const mb = bytes / (1024 * 1024);
  return `${mb.toFixed(1)} MB`;
}

function safeIsoDate(value: Date = new Date()) {
  return value.toISOString().split('T')[0];
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

function normalizeUploadAsset(asset: ImagePicker.ImagePickerAsset): SelectedAsset {
  const extension = inferFileExtension(asset.uri, asset.mimeType);
  const rawName = asset.fileName || `report-${Date.now()}${extension}`;
  const finalName = /\.[a-zA-Z0-9]+$/.test(rawName) ? rawName : `${rawName}${extension}`;

  return {
    uri: asset.uri,
    name: finalName,
    type: asset.mimeType || 'image/jpeg',
  };
}

export default function DashboardScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { colors, fontFamily, fontSize, spacing, borderRadius, shadow, isDark } =
    useAppTheme();
  const { width } = useWindowDimensions();

  const compact = width < 420;
  const today = new Date();

  const [visibleMonth, setVisibleMonth] = useState(
    new Date(today.getFullYear(), today.getMonth(), 1),
  );
  const [selectedDateKey, setSelectedDateKey] = useState(toDateKey(today));
  const [reportsMap, setReportsMap] = useState<Record<string, DashboardEntry[]>>({});
  const [storageUsedBytes, setStorageUsedBytes] = useState(0);
  const [aiUsedCredit, setAiUsedCredit] = useState(0);
  const [aiLeftCredit, setAiLeftCredit] = useState(0);
  const [aiTotalCredit, setAiTotalCredit] = useState(0);
  const [aiRenewDate, setAiRenewDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [screenError, setScreenError] = useState<string | null>(null);

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

  const monthlyEntries = useMemo(
    () =>
      Object.entries(reportsMap).reduce((count, [, entries]) => count + entries.length, 0),
    [reportsMap],
  );
  const activeDays = useMemo(
    () => Object.values(reportsMap).filter((entries) => entries.length > 0).length,
    [reportsMap],
  );

  const storagePercent = Math.min((storageUsedBytes / MAX_STORAGE_BYTES) * 100, 100);
  const aiCreditPercent = aiTotalCredit
    ? Math.min((aiUsedCredit / aiTotalCredit) * 100, 100)
    : 0;

  const firstName = user?.name?.trim()?.split(' ')[0] || 'User';

  useEffect(() => {
    void loadDashboard(false);
  }, [visibleMonth]);

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
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Allow photo library access to upload reports.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 0.85,
    });

    if (!result.canceled) {
      const asset = result.assets[0];
      setSelectedAsset(normalizeUploadAsset(asset));
    }
  }

  async function captureFromCamera() {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Allow camera access to capture report photos.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 0.85,
    });

    if (!result.canceled) {
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
      await loadDashboard(false);
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
            <RefreshControl refreshing={refreshing} onRefresh={() => void loadDashboard(true)} />
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
                <View
                  style={[
                    styles.brandMark,
                    {
                      backgroundColor: isDark
                        ? 'rgba(45, 212, 191, 0.14)'
                        : 'rgba(13, 148, 136, 0.12)',
                    },
                  ]}
                >
                  <Ionicons name="pulse-outline" size={16} color={colors.primary} />
                </View>
                <View style={styles.headerIdentity}>
                  <Text
                    style={[
                      styles.brandText,
                      { color: colors.textMain, fontFamily: fontFamily.bold },
                    ]}
                  >
                    Vita<Text style={{ color: colors.primary }}>track.ai</Text>
                  </Text>
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
                      backgroundColor: colors.surface,
                      borderColor: colors.borderSubtle,
                    },
                  ]}
                >
                  <Ionicons name="log-out-outline" size={18} color={colors.textMuted} />
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

          <View style={styles.summaryStrip}>
            <Card style={{ ...styles.summaryStripCard, ...(compact ? styles.summaryStripCardCompact : {}) }}>
              <Text
                style={[
                  styles.summaryStripLabel,
                  { color: colors.textMuted, fontFamily: fontFamily.medium },
                ]}
              >
                Entries this month
              </Text>
              <Text
                style={[
                  styles.summaryStripValue,
                  {
                    color: colors.textMain,
                    fontFamily: fontFamily.bold,
                    fontSize: compact ? fontSize.xl : fontSize['2xl'],
                  },
                ]}
              >
                {monthlyEntries}
              </Text>
            </Card>
            <Card style={{ ...styles.summaryStripCard, ...(compact ? styles.summaryStripCardCompact : {}) }}>
              <Text
                style={[
                  styles.summaryStripLabel,
                  { color: colors.textMuted, fontFamily: fontFamily.medium },
                ]}
              >
                Active days
              </Text>
              <Text
                style={[
                  styles.summaryStripValue,
                  {
                    color: colors.textMain,
                    fontFamily: fontFamily.bold,
                    fontSize: compact ? fontSize.xl : fontSize['2xl'],
                  },
                ]}
              >
                {activeDays}
              </Text>
            </Card>
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
                  Calendar
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
                    {monthTitle}
                  </Text>
                  <View
                    style={[
                      styles.monthStatusPill,
                      {
                        backgroundColor: isDark
                          ? 'rgba(45, 212, 191, 0.12)'
                          : 'rgba(13, 148, 136, 0.08)',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.monthStatusPillText,
                        { color: colors.primary, fontFamily: fontFamily.semiBold },
                      ]}
                    >
                      {monthlyEntries} entries
                    </Text>
                  </View>
                </View>
              </View>

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
            </View>

            {screenError ? (
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
                      onPress={() => setSelectedDateKey(dateKey)}
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
                              color: isToday || isSelected ? colors.primary : colors.textMain,
                              fontFamily: isSelected ? fontFamily.bold : fontFamily.medium,
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
                                { color: colors.primary, fontFamily: fontFamily.semiBold },
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
          </Card>

          <Card style={{ ...styles.timelineCard, ...shadow.sm }}>
            <View
              style={[
                styles.timelineHeader,
                compact && { alignItems: 'flex-start', flexDirection: 'column' },
              ]}
            >
              <View style={styles.timelineHeadingWrap}>
                <Text
                  style={[
                    styles.sectionEyebrow,
                    { color: colors.textMuted, fontFamily: fontFamily.medium },
                  ]}
                >
                  Selected day
                </Text>
                <View style={styles.timelineTitleRow}>
                  <Text
                    style={[
                      styles.timelineTitle,
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
                      styles.selectedBadge,
                      {
                        backgroundColor: isDark
                          ? 'rgba(56, 189, 248, 0.12)'
                          : 'rgba(3, 105, 161, 0.08)',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.selectedBadgeText,
                        { color: colors.secondary, fontFamily: fontFamily.semiBold },
                      ]}
                    >
                      {selectedEntries.length} record{selectedEntries.length === 1 ? '' : 's'}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            <View style={styles.timelineMetaRow}>
              {selectedEntries.length > 0 ? (
                <Text
                  style={[
                    styles.timelineSupportText,
                    { color: colors.textMuted, fontFamily: fontFamily.regular },
                  ]}
                >
                  Ordered by logged time
                </Text>
              ) : null}
            </View>

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
                  onPress={openUploadModal}
                  size="sm"
                  fullWidth={false}
                  style={styles.emptyStateButton}
                />
              </View>
            ) : (
              <View style={styles.entryList}>
                {selectedEntries.map((entry) => {
                  const accent =
                    entry.entry_type === 'direct_entry' ? colors.secondary : colors.primary;
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
                      key={entry.id}
                      onPress={() => {
                        if (entry.entry_type === 'document') {
                          router.push(`/document/${entry.id}` as Href);
                        }
                      }}
                      style={[
                        styles.entryCard,
                        {
                          backgroundColor: colors.surfaceSoft,
                          borderColor: colors.borderSubtle,
                        },
                      ]}
                    >
                      <View style={styles.entryMain}>
                        <View style={[styles.entryIcon, { backgroundColor: tint }]}>
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
                        <View style={styles.entryCopy}>
                          <View style={styles.entryTitleRow}>
                            <Text
                              style={[
                                styles.entryTitle,
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
                              styles.entrySubtitle,
                              {
                                color: colors.textMuted,
                                fontFamily: fontFamily.regular,
                              },
                            ]}
                          >
                            {getEntrySummary(entry)}
                          </Text>
                          <View style={styles.entryFooterRow}>
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
                                styles.entryTimeInline,
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
                      <View style={styles.entryMeta}>
                        <Text
                          style={[
                            styles.entryKind,
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
                })}
              </View>
            )}
          </Card>
        </ScrollView>

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
    gap: 10,
  },
  brandMark: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandText: {
    fontSize: 16,
    letterSpacing: -0.2,
  },
  headerIdentity: {
    gap: 1,
  },
  headerMiniCopy: {
    fontSize: 12,
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
  summaryStrip: {
    flexDirection: 'row',
    gap: 8,
  },
  summaryStripCard: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 4,
  },
  summaryStripCardCompact: {
    paddingVertical: 10,
  },
  summaryStripLabel: {
    fontSize: 12,
  },
  summaryStripValue: {
    lineHeight: 28,
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
  monthStatusPill: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  monthStatusPillText: {
    fontSize: 11,
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
  timelineCard: {
    padding: 16,
    gap: 18,
  },
  timelineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  timelineTitle: {
    lineHeight: 30,
  },
  timelineHeadingWrap: {
    gap: 6,
  },
  timelineTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
  },
  timelineMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 10,
    flexWrap: 'wrap',
    minHeight: 4,
  },
  selectedBadge: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  selectedBadgeText: {
    fontSize: 12,
  },
  timelineSupportText: {
    fontSize: 12,
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
  entryCard: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  entryMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  entryIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  entryCopy: {
    flex: 1,
    gap: 3,
  },
  entryTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  entryTitle: {
    fontSize: 14,
  },
  aiReadyTag: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  aiReadyTagText: {
    fontSize: 10,
  },
  entrySubtitle: {
    fontSize: 12,
    lineHeight: 16,
  },
  entryFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginTop: 2,
  },
  entryTimeInline: {
    fontSize: 11,
  },
  entryMeta: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  entryKind: {
    fontSize: 12,
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
