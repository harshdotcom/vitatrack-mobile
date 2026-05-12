import React, { useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { MotiView } from 'moti';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../hooks/useAuth';
import { useAppTheme } from '../../hooks/useAppTheme';
import { spacing } from '../../theme/spacing';
import type { RootStackParamList } from '../../navigation/types';
import { createAuthBackHandler } from './authNavigation';
import { AuthScreenShell } from './components/AuthScreenShell';

const forgotPasswordSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Enter a valid email'),
});

type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const handleBack = createAuthBackHandler(navigation, 'Login');
  const { forgotPassword, clearError, error } = useAuth();
  const { colors, fontFamily, fontSize } = useAppTheme();
  const [isLoading, setIsLoading] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordForm>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  const onSubmit = async (data: ForgotPasswordForm) => {
    setIsLoading(true);
    clearError();
    try {
      await forgotPassword({ email: data.email }, () => {
        navigation.navigate('ResetPassword', { email: data.email });
      });
    } catch (e) {
      console.log('Forgot password error', e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthScreenShell
      title="Forgot password"
      subtitle="Enter your email address and we'll send you a 6-digit code to reset your password."
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
  submitBtn: {
    marginTop: spacing[2],
  },
});
