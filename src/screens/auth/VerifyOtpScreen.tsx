import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MotiView } from 'moti';
import { GradientBackground } from '../../components/layout/GradientBackground';
import { SafeKeyboardView } from '../../components/layout/SafeKeyboardView';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { OtpInput } from '../../components/ui/OtpInput';
import { useAuth } from '../../hooks/useAuth';
import { useAppTheme } from '../../hooks/useAppTheme';
import { spacing } from '../../theme/spacing';

export default function VerifyOtpScreen() {
  const router = useRouter();
  const { email } = useLocalSearchParams<{ email: string }>();
  const { verifyOtp, resendOtp, clearError, error } = useAuth();
  const { colors, fontFamily, fontSize } = useAppTheme();

  const [otp, setOtp] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [ResendLoading, setResendLoading] = useState(false);
  const [countdown, setCountdown] = useState(60);

  useEffect(() => {
    clearError();
  }, [clearError]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleVerify = async () => {
    if (otp.length !== 6) return;
    setIsVerifying(true);
    try {
      await verifyOtp({ email: email || '', otp });
    } catch (e) {
      console.log('OTP Verification error', e);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    setResendLoading(true);
    try {
      await resendOtp({ email: email || '' });
      setCountdown(60);
    } catch (e) {
      console.log('OTP Resend error', e);
    } finally {
      setResendLoading(false);
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
                Check your email
              </Text>
              <Text style={[styles.subtitle, { fontFamily: fontFamily.regular, fontSize: fontSize.sm, color: colors.textMuted }]}>
                We've sent a 6-digit code to {email || 'your email'}
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
               <OtpInput length={6} value={otp} onChange={setOtp} disabled={isVerifying} />
            </View>

            <Button
              label="Verify Code"
              onPress={handleVerify}
              loading={isVerifying}
              disabled={otp.length !== 6 || isVerifying}
              size="lg"
              style={styles.submitBtn}
            />

            <View style={styles.resendRow}>
              {countdown > 0 ? (
                <Text style={[{ fontFamily: fontFamily.regular, fontSize: fontSize.sm, color: colors.textMuted }]}>
                  Resend code in <Text style={{ fontFamily: fontFamily.semiBold }}>{countdown}s</Text>
                </Text>
              ) : (
                <TouchableOpacity onPress={handleResend} disabled={ResendLoading}>
                  <Text style={[{ fontFamily: fontFamily.semiBold, fontSize: fontSize.sm, color: colors.primary }]}>
                    {ResendLoading ? 'Sending...' : 'Resend Code'}
                  </Text>
                </TouchableOpacity>
              )}
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
    marginBottom: spacing[8],
  },
  submitBtn: {
    marginBottom: spacing[5],
  },
  resendRow: {
    alignItems: 'center',
  },
});
