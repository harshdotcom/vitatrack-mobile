import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MotiView } from 'moti';
import { Ionicons } from '@expo/vector-icons';
import { GradientBackground } from '../../components/layout/GradientBackground';
import { Logo } from '../../components/ui/Logo';
import { Button } from '../../components/ui/Button';
import { useAppTheme } from '../../hooks/useAppTheme';
import { spacing } from '../../theme/spacing';

const { height } = Dimensions.get('window');

const FEATURES = [
  { icon: 'heart-outline' as const, label: 'Track Vitals' },
  { icon: 'document-text-outline' as const, label: 'Health Records' },
  { icon: 'analytics-outline' as const, label: 'AI Insights' },
  { icon: 'fitness-outline' as const, label: 'Daily Metrics' },
];

export default function WelcomeScreen() {
  const router = useRouter();
  const { colors, fontFamily, fontSize, borderRadius } = useAppTheme();

  return (
    <GradientBackground>
      <View style={styles.container}>

        {/* ── Logo ── */}
        <MotiView
          from={{ opacity: 0, translateY: -30 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 700, delay: 200 }}
          style={styles.logoSection}
        >
          <Logo size="lg" pulse />
          <Text
            style={[
              styles.tagline,
              {
                fontFamily: fontFamily.regular,
                fontSize: fontSize.md,
                color: colors.textMuted,
              },
            ]}
          >
            Track. Analyse. Thrive.
          </Text>
        </MotiView>

        {/* ── Feature Pills ── */}
        <MotiView
          from={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', delay: 500 }}
          style={styles.featuresRow}
        >
          {FEATURES.map((f, i) => (
            <MotiView
              key={f.label}
              from={{ opacity: 0, translateY: 20 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'spring', delay: 600 + i * 120 }}
            >
              <View
                style={[
                  styles.featurePill,
                  {
                    backgroundColor: colors.glassSurface,
                    borderColor: colors.glassBorder,
                    borderRadius: borderRadius.full,
                  },
                ]}
              >
                <Ionicons name={f.icon} size={16} color={colors.primary} />
                <Text
                  style={[
                    styles.featureLabel,
                    {
                      fontFamily: fontFamily.medium,
                      fontSize: fontSize.xs,
                      color: colors.textMain,
                    },
                  ]}
                >
                  {f.label}
                </Text>
              </View>
            </MotiView>
          ))}
        </MotiView>

        {/* ── Hero Illustration ── */}
        <MotiView
          from={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', delay: 400 }}
          style={styles.heroCard}
        >
          <View
            style={[
              styles.heroContent,
              {
                backgroundColor: colors.glassSurface,
                borderColor: colors.glassBorder,
              },
            ]}
          >
            {/* Heartbeat line graphic */}
            <View style={styles.ecgRow}>
              {[40, 40, 55, 90, 30, 70, 40, 40].map((h, i) => (
                <View
                  key={i}
                  style={[
                    styles.ecgBar,
                    {
                      height: h,
                      backgroundColor: colors.primary,
                      opacity: 0.3 + i * 0.09,
                    },
                  ]}
                />
              ))}
            </View>
            <Text
              style={[
                styles.heroCaption,
                {
                  fontFamily: fontFamily.semiBold,
                  fontSize: fontSize.lg,
                  color: colors.textMain,
                },
              ]}
            >
              Your Health Dashboard
            </Text>
            <Text
              style={[
                styles.heroSubCaption,
                {
                  fontFamily: fontFamily.regular,
                  fontSize: fontSize.sm,
                  color: colors.textMuted,
                },
              ]}
            >
              AI-powered insights from your daily vitals
            </Text>
          </View>
        </MotiView>

        {/* ── CTA Buttons ── */}
        <MotiView
          from={{ opacity: 0, translateY: 40 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'spring', delay: 800 }}
          style={styles.ctaSection}
        >
          <Button
            label="Get Started"
            onPress={() => router.push('/(auth)/signup')}
            variant="primary"
            size="lg"
            icon="arrow-forward"
            iconPosition="right"
          />
          <Button
            label="I already have an account"
            onPress={() => router.push('/(auth)/login')}
            variant="secondary"
            size="lg"
            style={{ marginTop: spacing[3] }}
          />

          <View style={styles.termsRow}>
            <Text
              style={[
                styles.termsText,
                { fontFamily: fontFamily.regular, fontSize: fontSize.xs, color: colors.textPlaceholder },
              ]}
            >
              By continuing you agree to our{' '}
            </Text>
            <TouchableOpacity>
              <Text
                style={[
                  styles.termsLink,
                  { fontFamily: fontFamily.medium, fontSize: fontSize.xs, color: colors.primary },
                ]}
              >
                Terms & Privacy
              </Text>
            </TouchableOpacity>
          </View>
        </MotiView>

      </View>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacing[6],
    paddingTop: height * 0.1,
    paddingBottom: spacing[8],
    justifyContent: 'space-between',
  },
  logoSection: {
    alignItems: 'center',
    gap: 10,
  },
  tagline: {
    marginTop: 6,
    letterSpacing: 0.5,
  },
  featuresRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
  },
  featurePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderWidth: 1,
  },
  featureLabel: {
    letterSpacing: 0.2,
  },
  heroCard: {
    alignItems: 'center',
  },
  heroContent: {
    width: '100%',
    borderRadius: 24,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
  },
  ecgRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 16,
  },
  ecgBar: {
    width: 8,
    borderRadius: 4,
  },
  heroCaption: {
    textAlign: 'center',
    marginBottom: 6,
  },
  heroSubCaption: {
    textAlign: 'center',
  },
  ctaSection: {
    gap: 0,
  },
  termsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing[4],
    flexWrap: 'wrap',
  },
  termsText: {},
  termsLink: {},
});
