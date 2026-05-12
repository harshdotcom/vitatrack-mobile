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
import { googleSignInService } from '../../services/googleSignInService';
import { spacing } from '../../theme/spacing';
import type { RootStackParamList } from '../../navigation/types';
import { createAuthBackHandler } from './authNavigation';
import { AuthScreenShell } from './components/AuthScreenShell';

const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const handleBack = createAuthBackHandler(navigation, 'Welcome');
  const { loginAndNavigate, googleLoginAndNavigate, isLoading } = useAuth();
  const { colors, fontFamily, fontSize } = useAppTheme();
  const [apiError, setApiError] = useState<string | null>(null);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

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

  const handleGoogleLogin = async () => {
    setApiError(null);
    setIsGoogleLoading(true);

    try {
      const idToken = await googleSignInService.signIn();
      if (!idToken) {
        return;
      }

      await googleLoginAndNavigate(idToken);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Google login failed. Try again.';
      setApiError(msg);
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleGooglePress = () => {
    handleGoogleLogin().catch(() => undefined);
  };

  return (
    <AuthScreenShell
      title="Welcome back"
      subtitle="Sign in to continue tracking your health records, vitals, and AI insights."
      onBack={handleBack}
      footer={
        <View style={styles.footerRow}>
          <Text
            style={[
              styles.footerText,
              { color: colors.textMuted, fontFamily: fontFamily.regular, fontSize: fontSize.sm },
            ]}
          >
            Don&apos;t have an account?{' '}
          </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
            <Text
              style={[
                styles.footerLink,
                { color: colors.primary, fontFamily: fontFamily.semiBold, fontSize: fontSize.sm },
              ]}
            >
              Create one
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
            placeholder="Enter your password"
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

      <TouchableOpacity
        onPress={() => navigation.navigate('ForgotPassword')}
        style={styles.forgotButton}
      >
        <Text
          style={[
            styles.forgotText,
            { color: colors.primary, fontFamily: fontFamily.medium, fontSize: fontSize.sm },
          ]}
        >
          Forgot password?
        </Text>
      </TouchableOpacity>

      <Button
        label="Sign In"
        onPress={handleSubmit(onSubmit)}
        loading={isLoading}
        size="lg"
        style={styles.primaryButton}
      />

      <View style={styles.divider}>
        <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
        <Text
          style={[
            styles.dividerText,
            {
              color: colors.textPlaceholder,
              fontFamily: fontFamily.regular,
              fontSize: fontSize.xs,
            },
          ]}
        >
          or continue with
        </Text>
        <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
      </View>

      <Button
        label="Continue with Google"
        onPress={handleGooglePress}
        variant="secondary"
        size="md"
        icon="logo-google"
        iconPosition="left"
        loading={isGoogleLoading}
        disabled={isLoading}
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
  forgotButton: {
    alignSelf: 'flex-end',
    marginTop: -2,
    marginBottom: spacing[5],
  },
  forgotText: {},
  primaryButton: {
    marginBottom: spacing[5],
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: spacing[4],
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    paddingHorizontal: 4,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  footerText: {},
  footerLink: {},
});
