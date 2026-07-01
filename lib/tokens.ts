export const colors = {
  background: '#050505',
  foreground: '#f0f0f0',
  muted: '#6b7280',
  mutedLight: '#9ca3af',
  accent: '#3b82f6',
  accentDim: 'rgba(59, 130, 246, 0.15)',
  accentGlow: 'rgba(59, 130, 246, 0.06)',
  border: 'rgba(255, 255, 255, 0.06)',
  borderHover: 'rgba(255, 255, 255, 0.1)',
} as const;

export const transitions = {
  smooth: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  fast: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
  slow: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
} as const;
