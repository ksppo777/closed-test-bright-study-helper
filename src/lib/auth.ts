import { initializeApp } from 'firebase/app';
import { getAuth, signInWithPopup, signInWithCredential, GoogleAuthProvider, onAuthStateChanged, User } from 'firebase/auth';
import { FirebaseAuthentication } from '@capacitor-firebase/authentication';
import { Capacitor } from '@capacitor/core';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

const provider = new GoogleAuthProvider();
// 웹 브라우저용 스코프 요청
provider.addScope('https://www.googleapis.com/auth/drive.file');

let isSigningIn = false;
let cachedAccessToken: string | null = null;

export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        cachedAccessToken = null;
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;

    // 📱 기기 환경이 안드로이드/iOS 네이티브 앱일 때
    if (Capacitor.isNativePlatform()) {
      // 💡 해결 방법 1: 네이티브 로그인 시 구글 드라이브 권한을 명시적으로 요구해야 합니다!
      const nativeResult = await FirebaseAuthentication.signInWithGoogle({
        scopes: ['https://www.googleapis.com/auth/drive.file']
      });

      if (!nativeResult.credential?.idToken) {
        throw new Error('Failed to get ID token from native Google Sign-In');
      }

      // 파이어베이스에 로그인 처리
      const credential = GoogleAuthProvider.credential(
        nativeResult.credential.idToken,
        nativeResult.credential.accessToken
      );
      const result = await signInWithCredential(auth, credential);

      // 💡 해결 방법 2: 구글 드라이브 접근용 토큰은 Firebase 토큰이 아닌 'Google Auth Access Token' 이어야 합니다!
      // result.user.getIdToken() 가 아니라 nativeResult.credential.accessToken 을 저장해야 합니다.
      cachedAccessToken = nativeResult.credential?.accessToken || null;

      if (!cachedAccessToken) {
        throw new Error('구글 드라이브 접근용 토큰을 가져오지 못했습니다.');
      }

      return { user: result.user, accessToken: cachedAccessToken };

    } 
    // 💻 기기 환경이 웹 브라우저(PC 등)일 때
    else {
      const result = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      
      // 웹에서도 확실하게 구글 엑세스 토큰을 최우선으로 저장해야 합니다.
      cachedAccessToken = credential?.accessToken || null;
      
      if (!cachedAccessToken) {
          throw new Error('웹 환경에서 드라이브 토큰을 가져오지 못했습니다.');
      }

      return { user: result.user, accessToken: cachedAccessToken };
    }
  } catch (error: any) {
    if (error.code !== 'auth/cancelled-popup-request' && error.code !== 'auth/popup-closed-by-user') {
      console.error('Sign in error:', error);
    }
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

export const logout = async () => {
  if (Capacitor.isNativePlatform()) {
    await FirebaseAuthentication.signOut();
  }
  await auth.signOut();
  cachedAccessToken = null;
};