/** Lógica pura, reutilizável e testável, sem acesso à localização real. */
export type Coordinate = { latitude: number; longitude: number };

export type ParkingSession = Coordinate & {
  id: string;
  parkedAt: number;
  expiryAt: number | null;
  floor: string;
  spot: string;
  notes: string;
  gpsAccuracy: number | null;
  pressureHpa: number | null;
  altitudeApprox: number | null;
  notificationId: string | null;
};

export const STORAGE_KEY = '@onde-estacionei/v1';

export function haversineMeters(a: Coordinate, b: Coordinate): number {
  const R = 6371000;
  const rad = Math.PI / 180;
  const dLat = (b.latitude - a.latitude) * rad;
  const dLon = (b.longitude - a.longitude) * rad;
  const v = Math.sin(dLat / 2) ** 2 +
    Math.cos(a.latitude * rad) * Math.cos(b.latitude * rad) *
    Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(v)));
}

export function formatDistance(meters: number | null): string {
  if (meters === null || !Number.isFinite(meters)) return '—';
  if (meters < 1000) return `${Math.round(Math.max(meters, 0))} m`;
  return `${(meters / 1000).toFixed(1).replace('.', ',')} km`;
}

export function remainingSeconds(expiryAt: number | null, now = Date.now()): number | null {
  return expiryAt === null ? null : Math.max(0, Math.ceil((expiryAt - now) / 1000));
}

export function formatRemaining(expiryAt: number | null, now = Date.now()): string {
  const secs = remainingSeconds(expiryAt, now);
  if (secs === null) return 'Sem limite';
  if (secs === 0) return 'Vencido';
  const minutes = Math.ceil(secs / 60);
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h ? `${h}h ${String(m).padStart(2, '0')}min` : `${m} min`;
}

/** Estimativa padrão: depende do clima, não indica com precisão o andar. */
export function pressureToAltitudeMeters(pressureHpa: number): number | null {
  if (!Number.isFinite(pressureHpa) || pressureHpa <= 0) return null;
  return Math.round(44330 * (1 - (pressureHpa / 1013.25) ** 0.1903));
}

export function validateParking(value: unknown): value is ParkingSession {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  return typeof v.id === 'string' &&
    typeof v.latitude === 'number' && Number.isFinite(v.latitude) && Math.abs(v.latitude) <= 90 &&
    typeof v.longitude === 'number' && Number.isFinite(v.longitude) && Math.abs(v.longitude) <= 180 &&
    typeof v.parkedAt === 'number' && Number.isFinite(v.parkedAt) &&
    (v.expiryAt === null || (typeof v.expiryAt === 'number' && Number.isFinite(v.expiryAt))) &&
    typeof v.floor === 'string' && typeof v.spot === 'string' && typeof v.notes === 'string';
}
