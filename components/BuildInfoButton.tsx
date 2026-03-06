import Constants from 'expo-constants';
import { Gear, X } from 'phosphor-react-native';
import { useState } from 'react';
import { Modal, Pressable, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const version = Constants.expoConfig?.version ?? '—';
const env = __DEV__ ? 'Development' : 'Production';

/** Floating gear icon that opens a build-info sheet. Drop anywhere as an
 *  absolute-positioned overlay on auth screens. */
export function BuildInfoButton() {
  const insets = useSafeAreaInsets();
  const [visible, setVisible] = useState(false);

  return (
    <>
      <Pressable
        className="absolute right-6 z-10 p-1"
        style={{ top: insets.top + 12 }}
        onPress={() => setVisible(true)}
        hitSlop={12}
      >
        <Gear size={20} color="#A1A1AA" weight="regular" />
      </Pressable>

      <Modal
        visible={visible}
        transparent
        animationType="slide"
        onRequestClose={() => setVisible(false)}
      >
        <Pressable
          className="flex-1 bg-black/50"
          onPress={() => setVisible(false)}
        />

        <View
          className="rounded-t-[20px] border-t border-forge-border bg-forge-bg px-6 pt-3"
          style={{ paddingBottom: insets.bottom + 24 }}
        >
          <View className="mb-5 h-1 w-9 self-center rounded-full bg-forge-border" />

          <View className="mb-5 flex-row items-center justify-between">
            <Text className="text-base font-semibold tracking-[1px] text-forge-text">
              Build Info
            </Text>
            <TouchableOpacity onPress={() => setVisible(false)} hitSlop={8}>
              <X size={20} color="#A1A1AA" weight="regular" />
            </TouchableOpacity>
          </View>

          <View className="overflow-hidden rounded-xl border border-forge-border bg-forge-surface">
            <Row label="Version" value={`v${version}`} />
            <View className="mx-4 h-px bg-forge-border" />
            <Row
              label="Environment"
              value={env}
              valueClassName={__DEV__ ? 'text-amber-500' : 'text-green-500'}
            />
          </View>
        </View>
      </Modal>
    </>
  );
}

function Row({
  label,
  value,
  valueClassName,
}: {
  label: string;
  value: string;
  valueClassName?: string;
}) {
  return (
    <View className="flex-row items-center justify-between px-4 py-[14px]">
      <Text className="text-sm text-forge-muted">{label}</Text>
      <Text
        className={`text-sm font-semibold text-forge-text ${valueClassName ?? ''}`}
      >
        {value}
      </Text>
    </View>
  );
}
