import React from 'react';
import {
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface SafeKeyboardViewProps {
  children: React.ReactNode;
  style?: ViewStyle;
  contentContainerStyle?: ViewStyle;
}

/**
 * Combines SafeAreaView + KeyboardAvoidingView + ScrollView so forms never
 * get occluded by the keyboard on either platform.
 */
export function SafeKeyboardView({
  children,
  style,
  contentContainerStyle,
}: SafeKeyboardViewProps) {
  return (
    <SafeAreaView style={[styles.safe, style]}>
      <KeyboardAvoidingView
        style={styles.kavoid}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          contentContainerStyle={[styles.scroll, contentContainerStyle]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  kavoid: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
  },
});
