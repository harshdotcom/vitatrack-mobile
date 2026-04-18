import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
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

const signupSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().min(1, 'Email is required').email('Enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type SignupForm = z.infer<typeof signupSchema>;

export default function SignupScreen() {
  const router = useRouter();
  const { signupAndNavigate, isLoading, clearError } = useAuth();
  const { colors, fontFamily, fontSize } = useAppTheme();
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupForm>({
    resolver: zodResolver(signupSchema),
    defaultValues: { name: '', email: '', password: '', confirmPassword: '' },
  });

  const onSubmit = async (data: SignupForm) => {
    setApiError(null);
    clearError();
    try {
      await signupAndNavigate({
        name: data.name,
        email: data.email,
        password: data.password,
      }, data.email);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Signup failed. Try again.';
      setApiError(msg);
    }
  };

  return (
    <GradientBackground>
      <SafeKeyboardView contentContainerStyle={styles.scroll}>
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

        <MotiView
          from={{ opacity: 0, translateY: 40 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'spring', delay: 100 }}
          style={styles.cardWrapper}
        >
          <Card elevated style={styles.card}>
            <View style={styles.header}>
              <Logo size="sm" />
              <Text
                style={[
                  styles.title,
                  { fontFamily: fontFamily.bold, fontSize: fontSize['2xl'], color: colors.textMain },
                ]}
              >
                Create Account
              </Text>
              <Text
                style={[
                  styles.subtitle,
                  { fontFamily: fontFamily.regular, fontSize: fontSize.sm, color: colors.textMuted },
                ]}
              >
                Join vitatrack.ai to monitor your health intuitively
              </Text>
            </View>

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

            <Controller
              control={control}
              name="name"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Full Name"
                  placeholder="John Doe"
                  autoCapitalize="words"
                  autoComplete="name"
                  returnKeyType="next"
                  leftIcon="person-outline"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.name?.message}
                />
              )}
            />

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
                  placeholder="Create a password"
                  isPassword
                  autoComplete="password-new"
                  returnKeyType="next"
                  leftIcon="lock-closed-outline"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.password?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="confirmPassword"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Confirm Password"
                  placeholder="Repeat your password"
                  isPassword
                  autoComplete="password-new"
                  returnKeyType="done"
                  leftIcon="lock-closed-outline"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.confirmPassword?.message}
                  onSubmitEditing={handleSubmit(onSubmit)}
                />
              )}
            />

            <Button
              label="Create Account"
              onPress={handleSubmit(onSubmit)}
              loading={isLoading}
              size="lg"
              style={styles.submitBtn}
            />

            <View style={styles.loginRow}>
              <Text style={[{ fontFamily: fontFamily.regular, fontSize: fontSize.sm, color: colors.textMuted }]}>
                Already have an account?{' '}
              </Text>
              <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
                <Text style={[{ fontFamily: fontFamily.semiBold, fontSize: fontSize.sm, color: colors.primary }]}>
                  Sign in
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
  submitBtn: {
    marginTop: spacing[2],
    marginBottom: spacing[5],
  },
  loginRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
});
