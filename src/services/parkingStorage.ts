import AsyncStorage from '@react-native-async-storage/async-storage';
import { ParkingSession, STORAGE_KEY, validateParking } from '../utils/parking';

export async function readParking(): Promise<ParkingSession | null> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    return validateParking(parsed) ? parsed : null;
  } catch { return null; }
}

export async function writeParking(value: ParkingSession | null): Promise<void> {
  if (value) await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  else await AsyncStorage.removeItem(STORAGE_KEY);
}
