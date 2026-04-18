import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useAuth } from '../../hooks/useAuth';
import { useAppTheme } from '../../hooks/useAppTheme';
import { spacing } from '../../theme/spacing';
import { Button } from '../../components/ui/Button';

export default function DashboardScreen() {
  const { user, logout } = useAuth();
  const { colors, fontFamily, fontSize } = useAppTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { fontFamily: fontFamily.bold, fontSize: fontSize['3xl'], color: colors.textMain }]}>
        Dashboard
      </Text>
      
      <Text style={[styles.subtitle, { fontFamily: fontFamily.regular, fontSize: fontSize.md, color: colors.textMuted }]}>
        Welcome, {user?.name || 'User'}!
      </Text>
      <Text style={[styles.subtitle, { fontFamily: fontFamily.regular, fontSize: fontSize.sm, color: colors.textMuted }]}>
        This is a placeholder for the Phase 2 Dashboard.
      </Text>

      <Button
        label="Log Out"
        onPress={logout}
        variant="secondary"
        style={styles.logoutBtn}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing[6],
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    marginBottom: spacing[4],
  },
  subtitle: {
    marginBottom: spacing[2],
    textAlign: 'center',
  },
  logoutBtn: {
    marginTop: spacing[8],
  },
});
