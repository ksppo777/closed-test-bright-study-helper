import { Preferences } from '@capacitor/preferences';

export const setStorage = async (key: string, value: any) => {
  await Preferences.set({
    key,
    value: JSON.stringify(value),
  });
};

export const getStorage = async (key: string): Promise<any> => {
  const { value } = await Preferences.get({ key });
  return value ? JSON.parse(value) : null;
};

export const removeStorage = async (key: string) => {
  await Preferences.remove({ key });
};

export const clearStorage = async () => {
  await Preferences.clear();
};

export const getAllKeys = async () => {
  const { keys } = await Preferences.keys();
  return keys;
};
