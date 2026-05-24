import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.brightstudy.app',
  appName: 'Bright Study',
  webDir: 'dist',                // 💡 여기에 쉼표(,)를 꼭 찍어주세요!
  plugins: {
    FirebaseAuthentication: {
      skipNativeAuth: false,
      providers: ["google.com"]
    }
  }
};

export default config;