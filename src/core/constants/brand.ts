export const BRAND = {
  name: 'NANNAI',
  subtitle: 'Confeitaria e Padaria',
  systemName: 'Food Operations Management System',
  description: 'Sistema de Gestão Operacional para Alimentos & Bebidas',
  motto: 'Organizar • Padronizar • Encantar',
  location: 'Muro Alto',
  colors: {
    cream: '#FDF8F3',
    brown: '#401E13',
    gold: '#B58B4D',
    brownMuted: '#6B4A3A',
  },
} as const

export const BRAND_ASSETS = {
  logoFullWebp: '/brand/nannai-brand-full.webp',
  logoFullPng: '/brand/nannai-brand-full.png',
  logoIconWebp: '/brand/nannai-icon.webp',
  icon16: '/icons/icon-16.png',
  icon32: '/icons/icon-32.png',
  icon64: '/icons/icon-64.png',
  icon180: '/icons/icon-180.png',
  icon192: '/icons/icon-192.png',
  icon256: '/icons/icon-256.png',
  icon512: '/icons/icon-512.png',
  appleTouchIcon: '/apple-touch-icon.png',
  favicon32: '/favicon-32x32.png',
  favicon16: '/favicon-16x16.png',
} as const

export const BRAND_PWA = {
  themeColor: BRAND.colors.brown,
  backgroundColor: BRAND.colors.cream,
} as const
