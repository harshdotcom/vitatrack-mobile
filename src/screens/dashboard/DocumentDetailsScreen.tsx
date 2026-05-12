import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated as RNAnimated,
  Image,
  Linking,
  Modal,
  PanResponder,
  Pressable,
  Share,
  ScrollView,
  StyleSheet,
  Text,
  View,
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
import { dashboardService } from '../../services/dashboardService';
import type { DocumentDetails } from '../../types/dashboard.types';
import type { RootStackParamList } from '../../navigation/types';

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
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'DocumentDetails'>>();
  const id = route.params?.id;
  const { colors, fontFamily, fontSize, borderRadius, shadow, isDark } = useAppTheme();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [document, setDocument] = useState<DocumentDetails | null>(null);
  const [fileUrl, setFileUrl] = useState('');
  const [isImageOpen, setIsImageOpen] = useState(false);
  const [imageRotation, setImageRotation] = useState(0);
  const [imageScale, setImageScale] = useState(1);
  const imagePan = useMemo(() => new RNAnimated.ValueXY({ x: 0, y: 0 }), []);
  const imageScaleRef = React.useRef(1);

  useEffect(() => {
    imageScaleRef.current = imageScale;
    if (imageScale <= 1) {
      imagePan.setValue({ x: 0, y: 0 });
      imagePan.setOffset({ x: 0, y: 0 });
    }
  }, [imagePan, imageScale]);

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

  async function handleDownloadFile() {
    if (!fileUrl) {
      return;
    }

    try {
      await Linking.openURL(fileUrl);
      Alert.alert(
        'Download started',
        'The report has been opened in your device viewer or browser, where you can download or save it.',
      );
    } catch (downloadError) {
      Alert.alert(
        'Download unavailable',
        downloadError instanceof Error
          ? downloadError.message
          : 'Unable to open the report for download.',
      );
    }
  }

  async function handleShareFile() {
    if (!fileUrl) {
      return;
    }

    try {
      await Share.share({
        title: document?.document_name || 'Medical report',
        message: fileUrl,
        url: fileUrl,
      });
    } catch (shareError) {
      Alert.alert(
        'Share unavailable',
        shareError instanceof Error
          ? shareError.message
          : 'Unable to share this report right now.',
      );
    }
  }

  function handleRotateImage() {
    setImageRotation((current) => (current + 90) % 360);
  }

  function handleZoomIn() {
    setImageScale((current) => Math.min(Number((current + 0.25).toFixed(2)), 3));
  }

  function handleZoomOut() {
    setImageScale((current) => Math.max(Number((current - 0.25).toFixed(2)), 1));
  }

  function handleResetImageView() {
    setImageRotation(0);
    setImageScale(1);
    imagePan.setValue({ x: 0, y: 0 });
    imagePan.setOffset({ x: 0, y: 0 });
  }

  const imagePanResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gestureState) =>
          imageScaleRef.current > 1 &&
          (Math.abs(gestureState.dx) > 3 || Math.abs(gestureState.dy) > 3),
        onPanResponderGrant: () => {
          imagePan.extractOffset();
        },
        onPanResponderMove: RNAnimated.event(
          [null, { dx: imagePan.x, dy: imagePan.y }],
          { useNativeDriver: false },
        ),
        onPanResponderRelease: () => {
          imagePan.flattenOffset();
        },
        onPanResponderTerminate: () => {
          imagePan.flattenOffset();
        },
      }),
    [imagePan],
  );

  function handleOpenAnalysis() {
    if (!document) {
      return;
    }

    navigation.navigate('AIAnalysis', {
      documentId: document.id,
      fileId: document.file_id || document.file?.id || document.id,
      documentName: document.document_name || 'Medical report',
    });
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
                onPress={() => navigation.goBack()}
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
                    <Pressable
                      onPress={() => {
                        handleResetImageView();
                        setIsImageOpen(true);
                      }}
                    >
                      <Image
                        source={{ uri: fileUrl }}
                        style={[
                          styles.previewImage,
                          { transform: [{ rotate: `${imageRotation}deg` }] },
                        ]}
                        resizeMode="cover"
                      />
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

                <View style={styles.fileActionsRow}>
                  <Button
                    label={fileUrl ? 'Open file' : 'File unavailable'}
                    onPress={() => void handleOpenFile()}
                    icon="open-outline"
                    size="sm"
                    disabled={!fileUrl}
                    fullWidth={false}
                  />
                  <Button
                    label={fileUrl ? 'Download report' : 'Download unavailable'}
                    onPress={() => void handleDownloadFile()}
                    icon="download-outline"
                    size="sm"
                    variant="secondary"
                    disabled={!fileUrl}
                    fullWidth={false}
                  />
                  <Button
                    label={fileUrl ? 'Share' : 'Share unavailable'}
                    onPress={() => void handleShareFile()}
                    icon="share-social-outline"
                    size="sm"
                    variant="secondary"
                    disabled={!fileUrl}
                    fullWidth={false}
                  />
                  {previewIsImage ? (
                    <Button
                      label="Rotate image"
                      onPress={handleRotateImage}
                      icon="refresh-outline"
                      size="sm"
                      variant="secondary"
                      fullWidth={false}
                    />
                  ) : null}
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
                      Open the AI summary on a dedicated page for a cleaner reading experience.
                    </Text>
                  </View>
                  <Button
                    label={document.analysis_generated ? 'View AI analysis' : 'Get AI analysis'}
                    onPress={handleOpenAnalysis}
                    icon="sparkles-outline"
                    size="sm"
                    fullWidth={false}
                  />
                </View>
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
                    {document.analysis_generated
                      ? 'AI analysis is ready to view'
                      : 'AI analysis opens on the next page'}
                  </Text>
                  <Text
                    style={[
                      styles.emptyAnalysisText,
                      { color: colors.textMuted, fontFamily: fontFamily.regular },
                    ]}
                  >
                    {document.analysis_generated
                      ? 'Tap View AI analysis to open the dedicated analysis screen with the full medical summary, metrics, and recommendations.'
                      : 'Tap Get AI analysis to open the dedicated analysis screen with the full medical summary, metrics, and recommendations.'}
                  </Text>
                </View>
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
            <View style={styles.fullscreenActions}>
              <Pressable
                onPress={handleZoomOut}
                style={[
                  styles.fullscreenActionButton,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.borderSubtle,
                  },
                ]}
              >
                <Ionicons name="remove-outline" size={18} color={colors.textMain} />
              </Pressable>
              <Pressable
                onPress={handleZoomIn}
                style={[
                  styles.fullscreenActionButton,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.borderSubtle,
                  },
                ]}
              >
                <Ionicons name="add-outline" size={18} color={colors.textMain} />
              </Pressable>
              <Pressable
                onPress={handleRotateImage}
                style={[
                  styles.fullscreenActionButton,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.borderSubtle,
                  },
                ]}
              >
                <Ionicons name="refresh-outline" size={18} color={colors.textMain} />
              </Pressable>
              <Pressable
                onPress={() => void handleShareFile()}
                style={[
                  styles.fullscreenActionButton,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.borderSubtle,
                  },
                ]}
              >
                <Ionicons name="share-social-outline" size={18} color={colors.textMain} />
              </Pressable>
              <Pressable
                onPress={handleResetImageView}
                style={[
                  styles.fullscreenActionButton,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.borderSubtle,
                  },
                ]}
              >
                <Ionicons name="scan-outline" size={18} color={colors.textMain} />
              </Pressable>
              <Pressable
                onPress={() => setIsImageOpen(false)}
                style={[
                  styles.fullscreenActionButton,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.borderSubtle,
                  },
                ]}
              >
                <Ionicons name="close" size={18} color={colors.textMain} />
              </Pressable>
            </View>

            {fileUrl ? (
              <RNAnimated.View
                {...imagePanResponder.panHandlers}
                style={[
                  styles.fullscreenImageWrap,
                  {
                    transform: [
                      { translateX: imagePan.x },
                      { translateY: imagePan.y },
                      { scale: imageScale },
                      { rotate: `${imageRotation}deg` },
                    ],
                  },
                ]}
              >
                <Image
                  source={{ uri: fileUrl }}
                  style={styles.fullscreenImage}
                  resizeMode="contain"
                />
              </RNAnimated.View>
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
  fileActionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
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
  fullscreenImageWrap: {
    width: '100%',
    height: '75%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullscreenActions: {
    position: 'absolute',
    top: 56,
    right: 20,
    flexDirection: 'row',
    gap: 10,
    zIndex: 2,
  },
  fullscreenActionButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullscreenImage: {
    width: '100%',
    height: '100%',
  },
});
