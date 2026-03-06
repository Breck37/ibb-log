import Constants from 'expo-constants';
import { Gear, X } from 'phosphor-react-native';
import { useState } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
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
        style={[styles.trigger, { top: insets.top + 12 }]}
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
        <Pressable style={styles.backdrop} onPress={() => setVisible(false)} />

        <View style={[styles.sheet, { paddingBottom: insets.bottom + 24 }]}>
          <View style={styles.sheetHandle} />

          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>Build Info</Text>
            <TouchableOpacity onPress={() => setVisible(false)} hitSlop={8}>
              <X size={20} color="#A1A1AA" weight="regular" />
            </TouchableOpacity>
          </View>

          <View style={styles.card}>
            <Row label="Version" value={`v${version}`} />
            <View style={styles.divider} />
            <Row
              label="Environment"
              value={env}
              valueStyle={__DEV__ ? styles.devValue : styles.prodValue}
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
  valueStyle,
}: {
  label: string;
  value: string;
  valueStyle?: object;
}) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={[styles.rowValue, valueStyle]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  trigger: {
    position: 'absolute',
    right: 24,
    zIndex: 10,
    padding: 4,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sheet: {
    backgroundColor: '#0B0D12',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderTopWidth: 1,
    borderColor: '#1E2235',
    paddingHorizontal: 24,
    paddingTop: 12,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#1E2235',
    alignSelf: 'center',
    marginBottom: 20,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  card: {
    backgroundColor: '#141821',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1E2235',
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  divider: {
    height: 1,
    backgroundColor: '#1E2235',
    marginHorizontal: 16,
  },
  rowLabel: {
    fontSize: 14,
    color: '#A1A1AA',
  },
  rowValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  devValue: {
    color: '#f59e0b',
  },
  prodValue: {
    color: '#22c55e',
  },
});
