import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { GradientBackground } from '../../components/layout/GradientBackground';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useAppTheme } from '../../hooks/useAppTheme';
import { dashboardService } from '../../services/dashboardService';
import type {
  AnalysisMetric,
  DocumentAnalysis,
  DocumentDetails,
} from '../../types/dashboard.types';

function parseTags(tags?: string | string[]) {
  if (!tags) return [];
  if (Array.isArray(tags)) return tags.filter(Boolean);

  try {
    const parsed = JSON.parse(tags);
    return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
  } catch {
    return [];
  }
}

function unwrapPayload<T>(payload: T | { data?: T }): T {
  if (
    payload &&
    typeof payload === 'object' &&
    'data' in payload &&
    payload.data
  ) {
    return payload.data;
  }

  return payload as T;
}

function isImageUrl(url?: string) {
  if (!url) return false;
  const cleanUrl = url.toLowerCase().split('?')[0];
  return (
    cleanUrl.endsWith('.png') ||
    cleanUrl.endsWith('.jpg') ||
    cleanUrl.endsWith('.jpeg') ||
    cleanUrl.endsWith('.webp')
  );
}

function isPdfUrl(url?: string) {
  if (!url) return false;
  return url.toLowerCase().split('?')[0].endsWith('.pdf');
}

function formatDisplayDate(value?: string) {
  if (!value) return 'Unknown';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function getRiskTone(
  riskLevel: string | undefined,
  isDark: boolean,
  colors: ReturnType<typeof useAppTheme>['colors'],
) {
  const normalized = riskLevel?.toLowerCase();

  if (normalized === 'low') {
    return {
      backgroundColor: isDark ? 'rgba(34, 197, 94, 0.18)' : 'rgba(22, 163, 74, 0.10)',
      textColor: colors.successText,
    };
  }

  if (normalized === 'moderate') {
    return {
      backgroundColor: isDark ? 'rgba(245, 158, 11, 0.18)' : 'rgba(217, 119, 6, 0.10)',
      textColor: colors.warningText,
    };
  }

  if (normalized === 'high' || normalized === 'critical') {
    return {
      backgroundColor: isDark ? 'rgba(248, 113, 113, 0.16)' : 'rgba(220, 38, 38, 0.10)',
      textColor: colors.errorText,
    };
  }

  return {
    backgroundColor: colors.surfaceSubtle,
    textColor: colors.textMuted,
  };
}

function groupMetrics(metrics: AnalysisMetric[] = []) {
  const liverTests = new Set([
    'Serum Bilirubin Total',
    'Serum Bilirubin Direct',
    'Serum Bilirubin Indirect',
    'ALT (SGPT)',
    'AST (SGOT)',
    'Alkaline Phosphatase',
    'Serum Protein Total',
    'Serum Albumin',
    'Serum Globulin',
    'A:G Ratio',
  ]);
  const kidneyTests = new Set([
    'Blood Urea',
    'Blood Urea Nitrogen (BUN)',
    'Serum Creatinine',
    'Serum Uric Acid',
  ]);
  const electrolytes = new Set([
    'Serum Sodium',
    'Serum Potassium',
    'Serum Chloride',
  ]);
  const cbc = new Set([
    'WBC Count',
    'Platelet Count',
    'RBC Count',
    'Hemoglobin',
    'Hematocrit (PCV)',
    'MCV',
    'MCH',
    'MCHC',
    'Neutrophils',
    'Lymphocytes',
    'Eosinophils',
    'Monocytes',
    'Basophils',
    'ESR (First Hour)',
    'Malaria Parasite',
  ]);

  const configs = [
    { label: 'Liver Function', keys: liverTests },
    { label: 'Kidney Function', keys: kidneyTests },
    { label: 'Electrolytes', keys: electrolytes },
    { label: 'CBC', keys: cbc },
  ];

  const matched = new Set<string>();
  const groups = configs
    .map((config) => {
      const items = metrics.filter((metric) => config.keys.has(metric.test_name));
      items.forEach((metric) => matched.add(metric.test_name));
      return { label: config.label, metrics: items };
    })
    .filter((group) => group.metrics.length > 0);

  const otherMetrics = metrics.filter((metric) => !matched.has(metric.test_name));
  if (otherMetrics.length > 0) {
    groups.push({ label: 'Other Tests', metrics: otherMetrics });
  }

  return groups;
}

function getMetricStatusTone(
  status: string,
  isDark: boolean,
  colors: ReturnType<typeof useAppTheme>['colors'],
) {
  const normalized = status.toLowerCase();

  if (normalized === 'normal') {
    return {
      backgroundColor: isDark ? 'rgba(34, 197, 94, 0.18)' : 'rgba(22, 163, 74, 0.10)',
      color: colors.successText,
    };
  }

  if (normalized === 'high' || normalized === 'low') {
    return {
      backgroundColor: isDark ? 'rgba(248, 113, 113, 0.16)' : 'rgba(220, 38, 38, 0.10)',
      color: colors.errorText,
    };
  }

  return {
    backgroundColor: colors.surfaceSubtle,
    color: colors.textMuted,
  };
}

function buildFileFacts(document: DocumentDetails) {
  const facts = [
    { label: 'Category', value: document.category || 'Medical Report' },
    { label: 'Logged on', value: formatDisplayDate(document.document_date) },
    {
      label: 'Status',
      value: document.analysis_generated ? 'AI ready' : document.status || 'Uploaded',
    },
    { label: 'File name', value: document.file?.original_name || 'Unavailable' },
    {
      label: 'File format',
      value: document.file_type || document.file?.mime_type || 'Unknown',
    },
  ];

  return facts.filter((fact) => fact.value);
}

export default function DocumentDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors, fontFamily, fontSize, borderRadius, shadow, isDark } = useAppTheme();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [document, setDocument] = useState<DocumentDetails | null>(null);
  const [fileUrl, setFileUrl] = useState('');
  const [isImageOpen, setIsImageOpen] = useState(false);
  const [analysis, setAnalysis] = useState<DocumentAnalysis | null>(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadDocument() {
      if (!id) {
        setError('Document id is missing.');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const rawDocument = await dashboardService.getDocumentDetails(id);
        const nextDocument = unwrapPayload(rawDocument);
        const fileId = nextDocument.file_id || nextDocument.file?.id || nextDocument.id;
        const rawFile = fileId ? await dashboardService.getFileUrl(fileId) : { url: '' };
        const nextFile = unwrapPayload(rawFile);

        if (!active) {
          return;
        }

        setDocument(nextDocument);
        setFileUrl(nextFile.url || '');
      } catch (loadError) {
        if (!active) {
          return;
        }

        setError(
          loadError instanceof Error
            ? loadError.message
            : 'Failed to load document details.',
        );
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadDocument();

    return () => {
      active = false;
    };
  }, [id]);

  const parsedTags = useMemo(() => parseTags(document?.tags), [document?.tags]);
  const previewIsImage = isImageUrl(fileUrl);
  const previewIsPdf = isPdfUrl(fileUrl);
  const metricsByGroup = useMemo(() => groupMetrics(analysis?.metrics || []), [analysis?.metrics]);
  const abnormalFindings = analysis?.abnormal_findings || [];
  const riskTone = getRiskTone(analysis?.overall_risk_level, isDark, colors);
  const fileFacts = useMemo(
    () => (document ? buildFileFacts(document) : []),
    [document],
  );

  async function handleOpenFile() {
    if (!fileUrl) {
      return;
    }

    await Linking.openURL(fileUrl);
  }

  async function handleLoadAnalysis() {
    if (!document) {
      return;
    }

    const fileId = document.file_id || document.file?.id || document.id;
    if (!fileId) {
      setAnalysisError('No file id is available for AI analysis.');
      return;
    }

    try {
      setAnalysisLoading(true);
      setAnalysisError(null);
      const nextAnalysis = await dashboardService.getAiAnalysis(fileId);
      setAnalysis(nextAnalysis);
    } catch (loadError) {
      setAnalysisError(
        loadError instanceof Error
          ? loadError.message
          : 'Failed to load AI analysis.',
      );
    } finally {
      setAnalysisLoading(false);
    }
  }

  return (
    <GradientBackground>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.topBar}>
            <Pressable
              onPress={() => router.back()}
              style={[
                styles.iconButton,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.borderSubtle,
                },
              ]}
            >
              <Ionicons name="chevron-back" size={18} color={colors.textMain} />
            </Pressable>

            <Text
              style={[
                styles.pageTitle,
                {
                  color: colors.textMain,
                  fontFamily: fontFamily.bold,
                  fontSize: fontSize.xl,
                },
              ]}
            >
              Report details
            </Text>

            <View style={styles.topBarSpacer} />
          </View>

          {loading ? (
            <Card style={{ ...styles.stateCard, ...shadow.sm }}>
              <ActivityIndicator color={colors.primary} />
              <Text style={{ color: colors.textMuted, fontFamily: fontFamily.medium }}>
                Loading report details
              </Text>
            </Card>
          ) : error || !document ? (
            <Card style={{ ...styles.stateCard, ...shadow.sm }}>
              <Ionicons name="alert-circle-outline" size={20} color={colors.error} />
              <Text
                style={{
                  color: colors.errorText,
                  fontFamily: fontFamily.medium,
                  textAlign: 'center',
                }}
              >
                {error || 'Unable to load this report.'}
              </Text>
              <Button
                label="Back to Dashboard"
                onPress={() => router.back()}
                variant="secondary"
                size="sm"
              />
            </Card>
          ) : (
            <>
              <Card style={{ ...styles.heroCard, ...shadow.md }}>
                <View
                  style={[
                    styles.heroPreview,
                    {
                      backgroundColor: colors.surfaceSubtle,
                      borderColor: colors.borderSubtle,
                      borderRadius: borderRadius.xl,
                    },
                  ]}
                >
                  {previewIsImage ? (
                    <Pressable onPress={() => setIsImageOpen(true)}>
                      <Image source={{ uri: fileUrl }} style={styles.previewImage} resizeMode="cover" />
                    </Pressable>
                  ) : (
                    <View style={styles.previewFallback}>
                      <View
                        style={[
                          styles.previewIconWrap,
                          {
                            backgroundColor: isDark
                              ? 'rgba(45, 212, 191, 0.12)'
                              : 'rgba(13, 148, 136, 0.10)',
                          },
                        ]}
                      >
                        <Ionicons
                          name={previewIsPdf ? 'document-text-outline' : 'document-outline'}
                          size={28}
                          color={colors.primary}
                        />
                      </View>
                      <Text
                        style={[
                          styles.previewFallbackTitle,
                          { color: colors.textMain, fontFamily: fontFamily.semiBold },
                        ]}
                      >
                        {previewIsPdf ? 'PDF preview opens externally' : 'Preview unavailable'}
                      </Text>
                      <Text
                        style={[
                          styles.previewFallbackText,
                          { color: colors.textMuted, fontFamily: fontFamily.regular },
                        ]}
                      >
                        Open the original file to inspect the full report.
                      </Text>
                    </View>
                  )}
                </View>
              </Card>

              <Card style={{ ...styles.summaryCard, ...shadow.sm }}>
                <View style={styles.summaryHeader}>
                  <View style={styles.summaryCopy}>
                    <View
                      style={[
                        styles.categoryPill,
                        {
                          backgroundColor: isDark
                            ? 'rgba(45, 212, 191, 0.12)'
                            : 'rgba(13, 148, 136, 0.08)',
                        },
                      ]}
                    >
                      <Text
                        style={{
                          color: colors.primary,
                          fontFamily: fontFamily.semiBold,
                          fontSize: 11,
                        }}
                      >
                        {document.category || 'Medical Report'}
                      </Text>
                    </View>

                    <Text
                      style={[
                        styles.documentName,
                        {
                          color: colors.textMain,
                          fontFamily: fontFamily.bold,
                          fontSize: fontSize['2xl'],
                        },
                      ]}
                    >
                      {document.document_name || 'Untitled report'}
                    </Text>
                    <Text
                      style={[
                        styles.documentDate,
                        { color: colors.textMuted, fontFamily: fontFamily.regular },
                      ]}
                    >
                      Logged {formatDisplayDate(document.document_date)}
                    </Text>
                  </View>

                  <Button
                    label={fileUrl ? 'Open file' : 'File unavailable'}
                    onPress={() => void handleOpenFile()}
                    icon="open-outline"
                    size="sm"
                    disabled={!fileUrl}
                    fullWidth={false}
                  />
                </View>

                <View style={styles.factGrid}>
                  {fileFacts.map((fact) => (
                    <View
                      key={fact.label}
                      style={[
                        styles.factCard,
                        {
                          backgroundColor: colors.surfaceSubtle,
                          borderColor: colors.borderSubtle,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.factLabel,
                          { color: colors.textMuted, fontFamily: fontFamily.medium },
                        ]}
                      >
                        {fact.label}
                      </Text>
                      <Text
                        style={[
                          styles.factValue,
                          { color: colors.textMain, fontFamily: fontFamily.semiBold },
                        ]}
                      >
                        {fact.value}
                      </Text>
                    </View>
                  ))}
                </View>

                {parsedTags.length > 0 ? (
                  <View style={styles.tagsSection}>
                    <Text
                      style={[
                        styles.sectionLabel,
                        { color: colors.textMuted, fontFamily: fontFamily.medium },
                      ]}
                    >
                      Tags
                    </Text>
                    <View style={styles.tagsWrap}>
                      {parsedTags.map((tag) => (
                        <View
                          key={tag}
                          style={[
                            styles.tag,
                            {
                              backgroundColor: isDark
                                ? 'rgba(56, 189, 248, 0.14)'
                                : 'rgba(3, 105, 161, 0.08)',
                            },
                          ]}
                        >
                          <Text
                            style={{
                              color: colors.secondary,
                              fontFamily: fontFamily.semiBold,
                              fontSize: 11,
                            }}
                          >
                            {tag}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>
                ) : null}
              </Card>

              <Card style={{ ...styles.analysisCard, ...shadow.sm }}>
                <View style={styles.analysisHeader}>
                  <View style={styles.analysisHeaderCopy}>
                    <Text
                      style={[
                        styles.sectionTitle,
                        { color: colors.textMain, fontFamily: fontFamily.bold, fontSize: fontSize.lg },
                      ]}
                    >
                      AI analysis
                    </Text>
                    <Text
                      style={[
                        styles.sectionSupport,
                        { color: colors.textMuted, fontFamily: fontFamily.regular },
                      ]}
                    >
                      Review the extracted medical summary inside the same report page.
                    </Text>
                  </View>
                  <Button
                    label={analysis ? 'Refresh AI analysis' : document.analysis_generated ? 'Load AI analysis' : 'Get AI analysis'}
                    onPress={() => void handleLoadAnalysis()}
                    icon="sparkles-outline"
                    size="sm"
                    loading={analysisLoading}
                    fullWidth={false}
                  />
                </View>

                {analysisError ? (
                  <View
                    style={[
                      styles.inlineBanner,
                      {
                        backgroundColor: colors.errorBg,
                        borderColor: colors.errorBorder,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.inlineBannerText,
                        { color: colors.errorText, fontFamily: fontFamily.medium },
                      ]}
                    >
                      {analysisError}
                    </Text>
                  </View>
                ) : null}

                {analysis ? (
                  <View style={styles.analysisBody}>
                    <View
                      style={[
                        styles.riskSummary,
                        {
                          backgroundColor: riskTone.backgroundColor,
                          borderColor: colors.borderSubtle,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.riskLabel,
                          { color: riskTone.textColor, fontFamily: fontFamily.medium },
                        ]}
                      >
                        Overall risk level
                      </Text>
                      <Text
                        style={[
                          styles.riskValue,
                          { color: riskTone.textColor, fontFamily: fontFamily.bold },
                        ]}
                      >
                        {analysis.overall_risk_level || 'Unknown'}
                      </Text>
                    </View>

                    {analysis.simple_explanation ? (
                      <View style={styles.analysisSection}>
                        <Text
                          style={[
                            styles.analysisSectionTitle,
                            { color: colors.textMain, fontFamily: fontFamily.semiBold },
                          ]}
                        >
                          Summary
                        </Text>
                        <Text
                          style={[
                            styles.analysisParagraph,
                            { color: colors.textMuted, fontFamily: fontFamily.regular },
                          ]}
                        >
                          {analysis.simple_explanation}
                        </Text>
                      </View>
                    ) : null}

                    {abnormalFindings.length > 0 ? (
                      <View style={styles.analysisSection}>
                        <Text
                          style={[
                            styles.analysisSectionTitle,
                            { color: colors.textMain, fontFamily: fontFamily.semiBold },
                          ]}
                        >
                          Abnormal findings
                        </Text>
                        <View style={styles.tagsWrap}>
                          {abnormalFindings.map((finding) => (
                            <View
                              key={finding}
                              style={[
                                styles.tag,
                                {
                                  backgroundColor: isDark
                                    ? 'rgba(248, 113, 113, 0.16)'
                                    : 'rgba(220, 38, 38, 0.10)',
                                },
                              ]}
                            >
                              <Text
                                style={{
                                  color: colors.errorText,
                                  fontFamily: fontFamily.semiBold,
                                  fontSize: 11,
                                }}
                              >
                                {finding}
                              </Text>
                            </View>
                          ))}
                        </View>
                      </View>
                    ) : null}

                    {metricsByGroup.map((group) => (
                      <View key={group.label} style={styles.analysisSection}>
                        <Text
                          style={[
                            styles.analysisSectionTitle,
                            { color: colors.textMain, fontFamily: fontFamily.semiBold },
                          ]}
                        >
                          {group.label}
                        </Text>
                        <View style={styles.metricsList}>
                          {group.metrics.map((metric) => {
                            const tone = getMetricStatusTone(metric.status, isDark, colors);

                            return (
                              <View
                                key={`${group.label}-${metric.test_name}`}
                                style={[
                                  styles.metricCard,
                                  {
                                    backgroundColor: colors.surfaceSubtle,
                                    borderColor: colors.borderSubtle,
                                  },
                                ]}
                              >
                                <View style={styles.metricRowTop}>
                                  <Text
                                    style={[
                                      styles.metricName,
                                      { color: colors.textMain, fontFamily: fontFamily.semiBold },
                                    ]}
                                  >
                                    {metric.test_name}
                                  </Text>
                                  <View
                                    style={[
                                      styles.metricStatusPill,
                                      { backgroundColor: tone.backgroundColor },
                                    ]}
                                  >
                                    <Text
                                      style={{
                                        color: tone.color,
                                        fontFamily: fontFamily.semiBold,
                                        fontSize: 11,
                                      }}
                                    >
                                      {metric.status}
                                    </Text>
                                  </View>
                                </View>

                                <Text
                                  style={[
                                    styles.metricValue,
                                    { color: colors.textMain, fontFamily: fontFamily.bold },
                                  ]}
                                >
                                  {metric.value}
                                  {metric.unit ? ` ${metric.unit}` : ''}
                                </Text>

                                {metric.reference_range ? (
                                  <Text
                                    style={[
                                      styles.metricRange,
                                      { color: colors.textMuted, fontFamily: fontFamily.regular },
                                    ]}
                                  >
                                    Reference: {metric.reference_range}
                                  </Text>
                                ) : null}
                              </View>
                            );
                          })}
                        </View>
                      </View>
                    ))}

                    {analysis.recommendations?.diet?.length ? (
                      <View style={styles.analysisSection}>
                        <Text
                          style={[
                            styles.analysisSectionTitle,
                            { color: colors.textMain, fontFamily: fontFamily.semiBold },
                          ]}
                        >
                          Diet recommendations
                        </Text>
                        {analysis.recommendations.diet.map((item) => (
                          <View key={item} style={styles.listRow}>
                            <Ionicons name="checkmark-circle" size={16} color={colors.primary} />
                            <Text
                              style={[
                                styles.listRowText,
                                { color: colors.textMuted, fontFamily: fontFamily.regular },
                              ]}
                            >
                              {item}
                            </Text>
                          </View>
                        ))}
                      </View>
                    ) : null}

                    {analysis.recommendations?.lifestyle?.length ? (
                      <View style={styles.analysisSection}>
                        <Text
                          style={[
                            styles.analysisSectionTitle,
                            { color: colors.textMain, fontFamily: fontFamily.semiBold },
                          ]}
                        >
                          Lifestyle recommendations
                        </Text>
                        {analysis.recommendations.lifestyle.map((item) => (
                          <View key={item} style={styles.listRow}>
                            <Ionicons name="walk-outline" size={16} color={colors.secondary} />
                            <Text
                              style={[
                                styles.listRowText,
                                { color: colors.textMuted, fontFamily: fontFamily.regular },
                              ]}
                            >
                              {item}
                            </Text>
                          </View>
                        ))}
                      </View>
                    ) : null}

                    {analysis.follow_up_suggestions?.length ? (
                      <View style={styles.analysisSection}>
                        <Text
                          style={[
                            styles.analysisSectionTitle,
                            { color: colors.textMain, fontFamily: fontFamily.semiBold },
                          ]}
                        >
                          Follow-up suggestions
                        </Text>
                        {analysis.follow_up_suggestions.map((item, index) => (
                          <View key={`${index}-${item}`} style={styles.followUpRow}>
                            <View
                              style={[
                                styles.followUpIndex,
                                {
                                  backgroundColor: isDark
                                    ? 'rgba(45, 212, 191, 0.12)'
                                    : 'rgba(13, 148, 136, 0.10)',
                                },
                              ]}
                            >
                              <Text
                                style={{
                                  color: colors.primary,
                                  fontFamily: fontFamily.semiBold,
                                  fontSize: 11,
                                }}
                              >
                                {index + 1}
                              </Text>
                            </View>
                            <Text
                              style={[
                                styles.listRowText,
                                { color: colors.textMuted, fontFamily: fontFamily.regular },
                              ]}
                            >
                              {item}
                            </Text>
                          </View>
                        ))}
                      </View>
                    ) : null}
                  </View>
                ) : (
                  <View
                    style={[
                      styles.emptyAnalysisState,
                      {
                        backgroundColor: colors.surfaceSubtle,
                        borderColor: colors.borderSubtle,
                      },
                    ]}
                  >
                    <Ionicons name="sparkles-outline" size={20} color={colors.primary} />
                    <Text
                      style={[
                        styles.emptyAnalysisTitle,
                        { color: colors.textMain, fontFamily: fontFamily.semiBold },
                      ]}
                    >
                      No AI analysis loaded yet
                    </Text>
                    <Text
                      style={[
                        styles.emptyAnalysisText,
                        { color: colors.textMuted, fontFamily: fontFamily.regular },
                      ]}
                    >
                      Use the action above to fetch or generate the report summary and medical insights.
                    </Text>
                  </View>
                )}
              </Card>
            </>
          )}
        </ScrollView>

        <Modal
          visible={isImageOpen}
          transparent
          animationType="fade"
          onRequestClose={() => setIsImageOpen(false)}
        >
          <View style={[styles.fullscreenOverlay, { backgroundColor: colors.overlay }]}>
            <Pressable
              onPress={() => setIsImageOpen(false)}
              style={[
                styles.fullscreenClose,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.borderSubtle,
                },
              ]}
            >
              <Ionicons name="close" size={18} color={colors.textMain} />
            </Pressable>

            {fileUrl ? (
              <Image source={{ uri: fileUrl }} style={styles.fullscreenImage} resizeMode="contain" />
            ) : null}
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
    padding: 16,
    gap: 14,
    paddingBottom: 32,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBarSpacer: {
    width: 42,
  },
  pageTitle: {
    textAlign: 'center',
  },
  stateCard: {
    padding: 24,
    alignItems: 'center',
    gap: 12,
  },
  heroCard: {
    padding: 10,
  },
  heroPreview: {
    borderWidth: 1,
    overflow: 'hidden',
  },
  previewImage: {
    width: '100%',
    height: 300,
    backgroundColor: '#dfe8eb',
  },
  previewFallback: {
    minHeight: 240,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 12,
  },
  previewIconWrap: {
    width: 60,
    height: 60,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewFallbackTitle: {
    fontSize: 16,
    textAlign: 'center',
  },
  previewFallbackText: {
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
  },
  summaryCard: {
    padding: 18,
    gap: 18,
  },
  summaryHeader: {
    gap: 14,
  },
  summaryCopy: {
    gap: 8,
  },
  categoryPill: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  documentName: {
    lineHeight: 30,
  },
  documentDate: {
    fontSize: 13,
  },
  factGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  factCard: {
    width: '48%',
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 6,
  },
  factLabel: {
    fontSize: 12,
  },
  factValue: {
    fontSize: 13,
    lineHeight: 18,
  },
  tagsSection: {
    gap: 8,
  },
  sectionLabel: {
    fontSize: 12,
  },
  tagsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
  },
  analysisCard: {
    padding: 18,
    gap: 16,
  },
  analysisHeader: {
    gap: 12,
  },
  analysisHeaderCopy: {
    gap: 4,
  },
  sectionTitle: {
    lineHeight: 24,
  },
  sectionSupport: {
    fontSize: 13,
    lineHeight: 18,
  },
  inlineBanner: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  inlineBannerText: {
    fontSize: 13,
    lineHeight: 18,
  },
  analysisBody: {
    gap: 18,
  },
  riskSummary: {
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 4,
  },
  riskLabel: {
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  riskValue: {
    fontSize: 22,
  },
  analysisSection: {
    gap: 10,
  },
  analysisSectionTitle: {
    fontSize: 15,
  },
  analysisParagraph: {
    fontSize: 14,
    lineHeight: 22,
  },
  metricsList: {
    gap: 10,
  },
  metricCard: {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 8,
  },
  metricRowTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  metricName: {
    flex: 1,
    fontSize: 14,
  },
  metricStatusPill: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  metricValue: {
    fontSize: 18,
  },
  metricRange: {
    fontSize: 12,
    lineHeight: 17,
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  listRowText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
  },
  followUpRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  followUpIndex: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  emptyAnalysisState: {
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 18,
    paddingVertical: 20,
    alignItems: 'flex-start',
    gap: 10,
  },
  emptyAnalysisTitle: {
    fontSize: 15,
  },
  emptyAnalysisText: {
    fontSize: 13,
    lineHeight: 19,
  },
  fullscreenOverlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  fullscreenClose: {
    position: 'absolute',
    top: 56,
    right: 20,
    width: 42,
    height: 42,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  fullscreenImage: {
    width: '100%',
    height: '75%',
  },
});
