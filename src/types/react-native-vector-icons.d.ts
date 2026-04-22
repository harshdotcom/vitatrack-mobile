declare module 'react-native-vector-icons/Ionicons' {
  import type React from 'react';
  import type { TextProps } from 'react-native';

  type IoniconName = string;

  export interface IconProps extends TextProps {
    name: IoniconName;
    size?: number;
    color?: string;
  }

  const Ionicons: React.ComponentType<IconProps> & {
    glyphMap: Record<IoniconName, number>;
  };
  export default Ionicons;
}
