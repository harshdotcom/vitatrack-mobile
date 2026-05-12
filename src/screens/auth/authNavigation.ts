import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/types';

export function createAuthBackHandler(
  navigation: NativeStackNavigationProp<RootStackParamList>,
  fallbackRoute: keyof RootStackParamList,
) {
  return () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }

    navigation.navigate(fallbackRoute);
  };
}
