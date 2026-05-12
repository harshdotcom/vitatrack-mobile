import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { MotiView } from 'moti';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { OtpInput } from '../../components/ui/OtpInput';
import { useAuth } from '../../hooks/useAuth';
import { useAppTheme } from '../../hooks/useAppTheme';
import { spacing } from '../../theme/spacing';
import type { RootStackParamList } from '../../navigation/types';
import { createAuthBackHandler } from './authNavigation';
import { AuthScreenShell } from './components/AuthScreenShell';

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
  const handleBack = createAuthBackHandler(navigation, 'ForgotPassword');
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
    if (otp.length !== 6) {
      return;
    }
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
    <AuthScreenShell
      title="Reset password"
      subtitle="Enter the 6-digit code sent to your email and create a new password."
      onBack={handleBack}
    >
      {error ? (
        <MotiView
          from={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          style={[styles.errorBanner, { backgroundColor: colors.errorBg, borderColor: colors.errorBorder }]}
        >
          <Text
            style={[
              styles.errorBannerText,
              { fontFamily: fontFamily.medium, fontSize: fontSize.sm, color: colors.errorText },
            ]}
          >
            {error}
          </Text>
        </MotiView>
      ) : null}

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
    </AuthScreenShell>
  );
}

const styles = StyleSheet.create({
  errorBanner: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
  },
  errorBannerText: {
    lineHeight: 18,
  },
  otpContainer: {
    marginBottom: spacing[5],
  },
  submitBtn: {
    marginTop: spacing[2],
  },
});
