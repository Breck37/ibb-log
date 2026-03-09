import { vars } from 'nativewind';

export const Forge = {
  primary: '#454dcc',
  primaryDim: '#373ea3',
  secondary: '#7C3AED',
} as const;

// CSS variable themes — applied at the root via vars() so every
// child resolves the right value without needing dark: prefixes.
export const darkTheme = vars({
  '--forge-bg': '11 13 18', // #0B0D12
  '--forge-surface': '20 24 33', // #141821
  '--forge-elevated': '26 31 46', // #1A1F2E
  '--forge-border': '30 34 48', // #1E2230
  '--forge-muted': '161 161 170', // #A1A1AA
  '--forge-text': '255 255 255', // #FFFFFF
  '--forge-secondary-text': '196 181 253', // #C4B5FD
});

export const lightTheme = vars({
  '--forge-bg': '249 250 251', // #F9FAFB
  '--forge-surface': '255 255 255', // #FFFFFF
  '--forge-elevated': '240 241 246', // #F0F1F6
  '--forge-border': '229 231 235', // #E5E7EB
  '--forge-muted': '107 114 128', // #6B7280
  '--forge-text': '17 24 39', // #111827
  '--forge-secondary-text': '109 40 217', // #6D28D9
});

// Raw hex values for use in JS-driven contexts (Reanimated animations,
// native props like placeholderTextColor) that cannot consume CSS variables.
// Must stay in sync with darkTheme / lightTheme above.
export const forgePalette = {
  dark: {
    border: '#1E2230',
    placeholder: '#4B5563',
  },
  light: {
    border: '#E5E7EB',
    placeholder: '#9CA3AF',
  },
} as const;

export default {
  light: {
    text: '#111827',
    background: '#F9FAFB',
    tint: Forge.primary,
    tabIconDefault: '#6B7280',
    tabIconSelected: Forge.primary,
    tabBar: '#FFFFFF',
    tabBarBorder: '#E5E7EB',
  },
  dark: {
    text: '#FFFFFF',
    background: '#0B0D12',
    tint: Forge.primary,
    tabIconDefault: '#A1A1AA',
    tabIconSelected: Forge.primary,
    tabBar: '#0B0D12',
    tabBarBorder: '#1E2230',
  },
};
