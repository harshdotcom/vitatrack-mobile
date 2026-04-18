import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
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
import { useAuth } from '../../hooks/useAuth';
import { useAppTheme } from '../../hooks/useAppTheme';
import { spacing } from '../../theme/spacing';

const forgotPasswordSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Enter a valid email'),
});

type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { forgotPassword, clearError, error } = useAuth();
  const { colors, fontFamily, fontSize } = useAppTheme();
  const [isLoading, setIsLoading] = useState(false);

  const { control, handleSubmit, formState: { errors } } = useForm<ForgotPasswordForm>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  const onSubmit = async (data: ForgotPasswordForm) => {
    setIsLoading(true);
    clearError();
    try {
      await forgotPassword({ email: data.email }, () => {
        router.push({ pathname: '/(auth)/reset-password', params: { email: data.email } });
      });
    } catch (e) {
      console.log('Forgot password error', e);
    } finally {
      setIsLoading(false);
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
              <Text style={[styles.title, { fontFamily: fontFamily.bold, fontSize: fontSize['2xl'], color: colors.textMain }]}>
                Forgot Password
              </Text>
              <Text style={[styles.subtitle, { fontFamily: fontFamily.regular, fontSize: fontSize.sm, color: colors.textMuted }]}>
                Enter your email address and we'll send you a 6-digit code to reset your password.
              </Text>
            </View>

            {error && (
              <MotiView
                from={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                style={[styles.errorBanner, { backgroundColor: colors.errorBg, borderColor: colors.errorBorder }]}
              >
                <Text style={[styles.errorBannerText, { fontFamily: fontFamily.medium, fontSize: fontSize.sm, color: colors.errorText }]}>
                  {error}
                </Text>
              </MotiView>
            )}

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
                  returnKeyType="done"
                  leftIcon="mail-outline"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.email?.message}
                  onSubmitEditing={handleSubmit(onSubmit)}
                />
              )}
            />

            <Button
              label="Send Reset Code"
              onPress={handleSubmit(onSubmit)}
              loading={isLoading}
              size="lg"
              style={styles.submitBtn}
            />
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
    marginBottom: spacing[8],
    gap: 8,
  },
  title: {
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  subtitle: {
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 4,
  },
  errorBanner: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 20,
  },
  errorBannerText: {
    textAlign: 'center',
  },
  submitBtn: {
    marginTop: spacing[4],
  },
});
