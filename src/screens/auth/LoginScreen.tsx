import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { MotiView } from 'moti';
import { GradientBackground } from '../../components/layout/GradientBackground';
import { SafeKeyboardView } from '../../components/layout/SafeKeyboardView';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Logo } from '../../components/ui/Logo';
import { useAuth } from '../../hooks/useAuth';
import { useAppTheme } from '../../hooks/useAppTheme';
import { spacing } from '../../theme/spacing';

// ── Validation schema ─────────────────────────────────────────────────────────

const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

type LoginForm = z.infer<typeof loginSchema>;

// ─────────────────────────────────────────────────────────────────────────────

export default function LoginScreen() {
  const router = useRouter();
  const { loginAndNavigate, isLoading } = useAuth();
  const { colors, fontFamily, fontSize } = useAppTheme();
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (data: LoginForm) => {
    setApiError(null);
    try {
      await loginAndNavigate(data.email, data.password);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Login failed. Try again.';
      setApiError(msg);
    }
  };

  return (
    <GradientBackground>
      <SafeKeyboardView contentContainerStyle={styles.scroll}>

        {/* Back button */}
        <MotiView
          from={{ opacity: 0, translateX: -20 }}
          animate={{ opacity: 1, translateX: 0 }}
          transition={{ type: 'timing', duration: 400 }}
        >
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backBtn}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={{ fontSize: 22, color: colors.textMuted }}>←</Text>
          </TouchableOpacity>
        </MotiView>

        {/* Card */}
        <MotiView
          from={{ opacity: 0, translateY: 40 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'spring', delay: 100 }}
          style={styles.cardWrapper}
        >
          <Card elevated style={styles.card}>
            {/* Header */}
            <View style={styles.header}>
              <Logo size="sm" />
              <Text
                style={[
                  styles.title,
                  { fontFamily: fontFamily.bold, fontSize: fontSize['2xl'], color: colors.textMain },
                ]}
              >
                Welcome back
              </Text>
              <Text
                style={[
                  styles.subtitle,
                  { fontFamily: fontFamily.regular, fontSize: fontSize.sm, color: colors.textMuted },
                ]}
              >
                Sign in to continue tracking your health
              </Text>
            </View>

            {/* API Error Banner */}
            {apiError && (
              <MotiView
                from={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                style={[
                  styles.errorBanner,
                  { backgroundColor: colors.errorBg, borderColor: colors.errorBorder },
                ]}
              >
                <Text
                  style={[
                    styles.errorBannerText,
                    { fontFamily: fontFamily.medium, fontSize: fontSize.sm, color: colors.errorText },
                  ]}
                >
                  {apiError}
                </Text>
              </MotiView>
            )}

            {/* Form Fields */}
            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Email address"
                  placeholder="you@example.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  returnKeyType="next"
                  leftIcon="mail-outline"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.email?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Password"
                  placeholder="Your password"
                  isPassword
                  autoComplete="password"
                  returnKeyType="done"
                  leftIcon="lock-closed-outline"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.password?.message}
                  onSubmitEditing={handleSubmit(onSubmit)}
                />
              )}
            />

            {/* Forgot Password */}
            <TouchableOpacity
              onPress={() => router.push('/(auth)/forgot-password')}
              style={styles.forgotBtn}
            >
              <Text
                style={[
                  styles.forgotText,
                  { fontFamily: fontFamily.medium, fontSize: fontSize.sm, color: colors.primary },
                ]}
              >
                Forgot password?
              </Text>
            </TouchableOpacity>

            {/* Submit */}
            <Button
              label="Sign In"
              onPress={handleSubmit(onSubmit)}
              loading={isLoading}
              size="lg"
              style={styles.submitBtn}
            />

            {/* Divider */}
            <View style={styles.divider}>
              <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
              <Text
                style={[
                  styles.dividerText,
                  { fontFamily: fontFamily.regular, fontSize: fontSize.xs, color: colors.textPlaceholder },
                ]}
              >
                or continue with
              </Text>
              <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
            </View>

            {/* Google Button */}
            <Button
              label="Continue with Google"
              onPress={() => Alert.alert('Coming soon', 'Google Sign-In will be available soon.')}
              variant="secondary"
              size="md"
              icon="logo-google"
              iconPosition="left"
            />

            {/* Sign Up Link */}
            <View style={styles.signupRow}>
              <Text
                style={[
                  { fontFamily: fontFamily.regular, fontSize: fontSize.sm, color: colors.textMuted },
                ]}
              >
                Don't have an account?{' '}
              </Text>
              <TouchableOpacity onPress={() => router.push('/(auth)/signup')}>
                <Text
                  style={[
                    { fontFamily: fontFamily.semiBold, fontSize: fontSize.sm, color: colors.primary },
                  ]}
                >
                  Create one
                </Text>
              </TouchableOpacity>
            </View>
          </Card>
        </MotiView>

      </SafeKeyboardView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  scroll: {
    padding: spacing[5],
    justifyContent: 'center',
    minHeight: '100%',
  },
  backBtn: {
    marginBottom: spacing[3],
    padding: spacing[1],
  },
  cardWrapper: {
    width: '100%',
  },
  card: {
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[7],
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing[6],
    gap: 8,
  },
  title: {
    textAlign: 'center',
    letterSpacing: -0.5,
    marginTop: 4,
  },
  subtitle: {
    textAlign: 'center',
    lineHeight: 20,
  },
  errorBanner: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  errorBannerText: {
    textAlign: 'center',
  },
  forgotBtn: {
    alignSelf: 'flex-end',
    marginTop: -8,
    marginBottom: spacing[5],
  },
  forgotText: {},
  submitBtn: {
    marginBottom: spacing[5],
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing[4],
    gap: 10,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    paddingHorizontal: 4,
  },
  signupRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing[5],
    flexWrap: 'wrap',
  },
});
