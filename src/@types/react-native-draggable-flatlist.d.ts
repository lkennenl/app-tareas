// src/@types/react-native-draggable-flatlist.d.ts
declare module 'react-native-draggable-flatlist' {
  import {
        FlatListProps,
        StyleProp,
        ViewStyle
    } from 'react-native';

  export type DragEndParams<T> = {
    data: T[]; // ✅ ¡CORREGIDO! (faltaba "data: ")
    from: number;
    to: number;
  };

  export type RenderItemParams<T> = {
    item: T;
    drag: () => void;
    isActive: boolean;
  };

  export type DraggableFlatListProps<T> = FlatListProps<T> & {
    onDragEnd?: (params: DragEndParams<T>) => void;
    renderItem: (params: RenderItemParams<T>) => React.ReactNode;
    keyExtractor: (item: T, index: number) => string;
    containerStyle?: StyleProp<ViewStyle>;
    contentContainerStyle?: StyleProp<ViewStyle>;
  };

  export default function DraggableFlatList<T>(
    props: DraggableFlatListProps<T>
  ): React.ReactElement;
}