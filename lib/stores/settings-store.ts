import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type FloatingActionPosition =
  | 'top-right'
  | 'top-left'
  | 'bottom-right'
  | 'bottom-left';

type SettingsState = {
  floatingActionPosition: FloatingActionPosition;
  setFloatingActionPosition: (pos: FloatingActionPosition) => void;
  biometricEnabled: boolean;
  setBiometricEnabled: (val: boolean) => void;
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      floatingActionPosition: 'bottom-right',
      setFloatingActionPosition: (pos) => set({ floatingActionPosition: pos }),
      biometricEnabled: false,
      setBiometricEnabled: (val) => set({ biometricEnabled: val }),
    }),
    {
      name: 'ibb-settings',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
