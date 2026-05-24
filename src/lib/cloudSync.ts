import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from './auth';

export const syncDataToCloud = async (data: any): Promise<void> => {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('User not logged in');
  }

  try {
    const docRef = doc(db, 'users', user.uid);
    await setDoc(docRef, { appData: data }, { merge: true });
  } catch (error) {
    console.error('Cloud sync out failed', error);
    throw error;
  }
};

export const syncDataFromCloud = async (): Promise<any | null> => {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('User not logged in');
  }

  try {
    const docRef = doc(db, 'users', user.uid);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      return data.appData || null;
    }
  } catch (error) {
    console.error('Cloud sync in failed', error);
    throw error;
  }

  return null;
};
