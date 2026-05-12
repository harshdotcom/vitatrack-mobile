import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MotiView } from 'moti';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { GradientBackground } from '../../../components/layout/GradientBackground';
import { SafeKeyboardView } from '../../../components/layout/SafeKeyboardView';
import { Logo } from '../../../components/ui/Logo';
import { useAppTheme } from '../../../hooks/useAppTheme';
import { spacing } from '../../../theme/spacing';

interface AuthScreenShellProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  onBack: () => void;
}

export function AuthScreenShell({
  title,
  subtitle,
  children,
  footer,
  onBack,
}: AuthScreenShellProps) {
  const { colors, fontFamily, fontSize } = useAppTheme();

  return (
    <GradientBackground>
      <SafeKeyboardView contentContainerStyle={styles.scroll}>
        <MotiView
          from={{ opacity: 0, translateX: -18 }}
          animate={{ opacity: 1, translateX: 0 }}
          transition={{ type: 'timing', duration: 320 }}
        >
          <Pressable
            onPress={onBack}
            style={[
              styles.backButton,
              {
                backgroundColor: colors.surfaceElevated,
                borderColor: colors.borderSubtle,
              },
            ]}
          >
            <Ionicons name="arrow-back" size={18} color={colors.textMain} />
          </Pressable>
        </MotiView>

        <MotiView
          from={{ opacity: 0, translateY: 28 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'spring', damping: 18, stiffness: 150, delay: 80 }}
          style={styles.panel}
        >
          <View style={styles.brandRow}>
            <Logo size="md" />
          </View>

          <View style={styles.header}>
            <Text
              style={[
                styles.title,
                {
                  color: colors.textMain,
                  fontFamily: fontFamily.bold,
                  fontSize: fontSize['3xl'],
                },
              ]}
            >
              {title}
            </Text>
            <Text
              style={[
                styles.subtitle,
                {
                  color: colors.textMuted,
                  fontFamily: fontFamily.regular,
                  fontSize: fontSize.sm,
                },
              ]}
            >
              {subtitle}
            </Text>
          </View>

          <View style={styles.content}>{children}</View>
          {footer ? <View style={styles.footer}>{footer}</View> : null}
        </MotiView>
      </SafeKeyboardView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 1,
    paddingHorizontal: spacing[5],
    paddingTop: spacing[4],
    paddingBottom: spacing[8],
    justifyContent: 'flex-start',
  },
  backButton: {
    width: 52,
    height: 52,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[6],
    alignSelf: 'flex-start',
  },
  panel: {
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
  },
  brandRow: {
    alignItems: 'flex-start',
    marginBottom: spacing[6],
  },
  header: {
    gap: 8,
    marginBottom: spacing[7],
  },
  title: {
    letterSpacing: -1,
    lineHeight: 36,
  },
  subtitle: {
    lineHeight: 22,
    maxWidth: 340,
  },
  content: {
    gap: 0,
  },
  footer: {
    marginTop: spacing[6],
  },
});
