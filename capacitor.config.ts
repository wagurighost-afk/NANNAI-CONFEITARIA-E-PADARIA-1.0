import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'br.com.nannai.foodops',
  appName: 'NANNAI',
  webDir: 'dist',
  bundledWebRuntime: false,
  server: {
    androidScheme: 'https',
    cleartext: true,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#FDF8F3',
      showSpinner: true,
      spinnerColor: '#401E13',
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#401E13',
    },
  },
}

export default config
