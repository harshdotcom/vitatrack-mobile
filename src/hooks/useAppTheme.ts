import { useColorScheme } from 'react-native';
import { lightColors, darkColors, type ColorScheme } from '../theme/colors';
import { fontFamily, fontSize, textPresets } from '../theme/typography';
import { spacing, borderRadius, shadow } from '../theme/spacing';

export interface AppTheme {
  colors: ColorScheme;
  fontFamily: typeof fontFamily;
  fontSize: typeof fontSize;
  textPresets: typeof textPresets;
  spacing: typeof spacing;
  borderRadius: typeof borderRadius;
  shadow: typeof shadow;
  isDark: boolean;
}

export function useAppTheme(): AppTheme {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';

  return {
    colors: isDark ? darkColors : lightColors,
    fontFamily,
    fontSize,
    textPresets,
    spacing,
    borderRadius,
    shadow,
    isDark,
  };
}
