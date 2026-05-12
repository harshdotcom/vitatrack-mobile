import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Controller, useForm } from 'react-hook-form';
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

const signupSchema = z
  .object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().min(1, 'Email is required').email('Enter a valid email'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

type SignupForm = z.infer<typeof signupSchema>;

export default function SignupScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const handleBack = createAuthBackHandler(navigation, 'Welcome');
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
      await signupAndNavigate(
        {
          name: data.name,
          email: data.email,
          password: data.password,
        },
        data.email,
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Signup failed. Try again.';
      setApiError(msg);
    }
  };

  return (
    <AuthScreenShell
      title="Create account"
      subtitle="Set up your VitaTrack profile to organize records, monitor vitals, and unlock AI analysis."
      onBack={handleBack}
      footer={
        <View style={styles.footerRow}>
          <Text
            style={[
              styles.footerText,
              { color: colors.textMuted, fontFamily: fontFamily.regular, fontSize: fontSize.sm },
            ]}
          >
            Already have an account?{' '}
          </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text
              style={[
                styles.footerLink,
                { color: colors.primary, fontFamily: fontFamily.semiBold, fontSize: fontSize.sm },
              ]}
            >
              Sign in
            </Text>
          </TouchableOpacity>
        </View>
      }
    >
      {apiError ? (
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
              { color: colors.errorText, fontFamily: fontFamily.medium, fontSize: fontSize.sm },
            ]}
          >
            {apiError}
          </Text>
        </MotiView>
      ) : null}

      <Controller
        control={control}
        name="name"
        render={({ field: { onChange, onBlur, value } }) => (
          <Input
            label="Full name"
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
            label="Confirm password"
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
        style={styles.primaryButton}
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
  primaryButton: {
    marginTop: spacing[2],
    marginBottom: spacing[5],
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  footerText: {},
  footerLink: {},
});
