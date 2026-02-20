export const Forge = {
  bg: '#0B0D12',
  surface: '#141821',
  elevated: '#1A1F2E',
  border: '#1E2230',
  muted: '#A1A1AA',
  primary: '#454dcc',
  primaryDim: '#373ea3',
  secondary: '#7C3AED',
  secondaryText: '#C4B5FD',
} as const;

export default {
  light: {
    text: '#FFFFFF',
    background: Forge.bg,
    tint: Forge.primary,
    tabIconDefault: Forge.muted,
    tabIconSelected: Forge.primary,
  },
  dark: {
    text: '#FFFFFF',
    background: Forge.bg,
    tint: Forge.primary,
    tabIconDefault: Forge.muted,
    tabIconSelected: Forge.primary,
  },
};
