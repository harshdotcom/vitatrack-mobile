import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { MotiView } from 'moti';
import { GradientBackground } from '../../components/layout/GradientBackground';
import { SafeKeyboardView } from '../../components/layout/SafeKeyboardView';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { OtpInput } from '../../components/ui/OtpInput';
import { useAuth } from '../../hooks/useAuth';
import { useAppTheme } from '../../hooks/useAppTheme';
import { spacing } from '../../theme/spacing';
import type { RootStackParamList } from '../../navigation/types';

const resetPasswordSchema = z
  .object({
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

type ResetPasswordForm = z.infer<typeof resetPasswordSchema>;

export default function ResetPasswordScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'ResetPassword'>>();
  const email = route.params?.email ?? '';
  const { resetPasswordAndNavigate, clearError, error } = useAuth();
  const { colors, fontFamily, fontSize } = useAppTheme();

  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    clearError();
  }, [clearError]);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordForm>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: '', confirmPassword: '' },
  });

  const onSubmit = async (data: ResetPasswordForm) => {
    if (otp.length !== 6) return;
    setIsLoading(true);
    clearError();
    try {
      await resetPasswordAndNavigate({
        email,
        otp,
        new_password: data.password,
      });
    } catch (e) {
      console.log('Reset password error', e);
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
            onPress={() => navigation.goBack()}
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
              <Text
                style={[
                  styles.title,
                  { fontFamily: fontFamily.bold, fontSize: fontSize['2xl'], color: colors.textMain },
                ]}
              >
                Reset Password
              </Text>
              <Text
                style={[
                  styles.subtitle,
                  { fontFamily: fontFamily.regular, fontSize: fontSize.sm, color: colors.textMuted },
                ]}
              >
                Enter the 6-digit code sent to your email and your new password
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

            <View style={styles.otpContainer}>
               <OtpInput length={6} value={otp} onChange={setOtp} disabled={isLoading} />
            </View>

            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="New Password"
                  placeholder="Create a new password"
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
                  label="Confirm New Password"
                  placeholder="Repeat your new password"
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
              label="Reset Password"
              onPress={handleSubmit(onSubmit)}
              loading={isLoading}
              disabled={otp.length !== 6 || isLoading}
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
  otpContainer: {
    marginBottom: spacing[6],
  },
  submitBtn: {
    marginTop: spacing[4],
  },
});
