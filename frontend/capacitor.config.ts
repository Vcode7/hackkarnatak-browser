import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.aichat.browser',
  appName: 'AiChat Browser',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    iosScheme: 'capacitor',
    // For development, point to your dev server
    // url: 'http://192.168.1.100:5173',
    // cleartext: true
  allowNavigation: ['*'],
  },
  android: {
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: true,
    backgroundColor: '#ffffff'
  },
  ios: {
    contentInset: 'automatic',
    scrollEnabled: true
    // Native webview will be used via the CapacitorWebView component
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#3b82f6",
      showSpinner: true,
      spinnerColor: "#ffffff",
      androidSpinnerStyle: "large",
      iosSpinnerStyle: "large"
    },
    Keyboard: {
      resize: 'body',
      style: 'dark',
      resizeOnFullScreen: true
    },
    EmbeddedWebView: {
      // Custom native WebView plugin
    }
  }
};

export default config;
