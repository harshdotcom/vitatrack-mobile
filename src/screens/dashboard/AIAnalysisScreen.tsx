import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { GradientBackground } from '../../components/layout/GradientBackground';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useAppTheme } from '../../hooks/useAppTheme';
import type { RootStackParamList } from '../../navigation/types';
import { dashboardService } from '../../services/dashboardService';
import type { DocumentAnalysis } from '../../types/dashboard.types';
import {
  getMetricStatusTone,
  getRiskTone,
  groupMetrics,
} from './analysisUtils';

export default function AIAnalysisScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'AIAnalysis'>>();
  const { documentId, fileId, documentName } = route.params;
  const { colors, fontFamily, fontSize, shadow, isDark } = useAppTheme();

  const [analysis, setAnalysis] = useState<DocumentAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadAnalysis() {
      try {
        setLoading(true);
        setError(null);

        const resolvedFileId = fileId || documentId;
        const nextAnalysis = await dashboardService.getAiAnalysis(resolvedFileId);

        if (!active) {
          return;
        }

        setAnalysis(nextAnalysis);
      } catch (loadError) {
        if (!active) {
          return;
        }

        setError(
          loadError instanceof Error
            ? loadError.message
            : 'Failed to load AI analysis.',
        );
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadAnalysis();

    return () => {
      active = false;
    };
  }, [documentId, fileId]);

  const metricsByGroup = useMemo(() => groupMetrics(analysis?.metrics || []), [analysis?.metrics]);
  const abnormalFindings = analysis?.abnormal_findings || [];
  const riskTone = getRiskTone(analysis?.overall_risk_level, isDark, colors);

  async function handleRefresh() {
    try {
      setLoading(true);
      setError(null);
      const resolvedFileId = fileId || documentId;
      const nextAnalysis = await dashboardService.getAiAnalysis(resolvedFileId);
      setAnalysis(nextAnalysis);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'Failed to load AI analysis.',
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <GradientBackground>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.topBar}>
            <Pressable
              onPress={() => navigation.goBack()}
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
              AI analysis
            </Text>

            <View style={styles.topBarSpacer} />
          </View>

          <Card style={{ ...styles.heroCard, ...shadow.sm }}>
            <View style={styles.heroHeader}>
              <View style={styles.heroCopy}>
                <Text
                  style={[
                    styles.heroTitle,
                    { color: colors.textMain, fontFamily: fontFamily.bold },
                  ]}
                >
                  {documentName || 'Medical report'}
                </Text>
                <Text
                  style={[
                    styles.heroText,
                    { color: colors.textMuted, fontFamily: fontFamily.regular },
                  ]}
                >
                  Review the extracted medical summary on a dedicated page instead of inline under
                  the document preview.
                </Text>
              </View>
              <Button
                label="Refresh"
                onPress={() => void handleRefresh()}
                icon="sparkles-outline"
                size="sm"
                loading={loading}
                fullWidth={false}
              />
            </View>
          </Card>

          {loading ? (
            <Card style={{ ...styles.stateCard, ...shadow.sm }}>
              <ActivityIndicator color={colors.primary} />
              <Text style={{ color: colors.textMuted, fontFamily: fontFamily.medium }}>
                Loading AI analysis
              </Text>
            </Card>
          ) : error ? (
            <Card style={{ ...styles.stateCard, ...shadow.sm }}>
              <Ionicons name="alert-circle-outline" size={20} color={colors.error} />
              <Text
                style={[
                  styles.stateText,
                  { color: colors.errorText, fontFamily: fontFamily.medium },
                ]}
              >
                {error}
              </Text>
              <Button
                label="Try again"
                onPress={() => void handleRefresh()}
                size="sm"
                fullWidth={false}
              />
            </Card>
          ) : analysis ? (
            <Card style={{ ...styles.analysisCard, ...shadow.sm }}>
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
                <View style={styles.section}>
                  <Text
                    style={[
                      styles.sectionTitle,
                      { color: colors.textMain, fontFamily: fontFamily.semiBold },
                    ]}
                  >
                    Summary
                  </Text>
                  <Text
                    style={[
                      styles.paragraph,
                      { color: colors.textMuted, fontFamily: fontFamily.regular },
                    ]}
                  >
                    {analysis.simple_explanation}
                  </Text>
                </View>
              ) : null}

              {abnormalFindings.length > 0 ? (
                <View style={styles.section}>
                  <Text
                    style={[
                      styles.sectionTitle,
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
                <View key={group.label} style={styles.section}>
                  <Text
                    style={[
                      styles.sectionTitle,
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
                <View style={styles.section}>
                  <Text
                    style={[
                      styles.sectionTitle,
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
                <View style={styles.section}>
                  <Text
                    style={[
                      styles.sectionTitle,
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
                <View style={styles.section}>
                  <Text
                    style={[
                      styles.sectionTitle,
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
            </Card>
          ) : (
            <Card style={{ ...styles.stateCard, ...shadow.sm }}>
              <Ionicons name="sparkles-outline" size={20} color={colors.primary} />
              <Text
                style={[
                  styles.stateText,
                  { color: colors.textMain, fontFamily: fontFamily.semiBold },
                ]}
              >
                No AI analysis available
              </Text>
            </Card>
          )}
        </ScrollView>
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
  heroCard: {
    padding: 18,
  },
  heroHeader: {
    gap: 14,
  },
  heroCopy: {
    gap: 6,
  },
  heroTitle: {
    fontSize: 20,
    lineHeight: 28,
  },
  heroText: {
    fontSize: 13,
    lineHeight: 19,
  },
  stateCard: {
    padding: 24,
    alignItems: 'center',
    gap: 12,
  },
  stateText: {
    textAlign: 'center',
  },
  analysisCard: {
    padding: 18,
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
  section: {
    gap: 10,
  },
  sectionTitle: {
    fontSize: 15,
  },
  paragraph: {
    fontSize: 14,
    lineHeight: 22,
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
});
