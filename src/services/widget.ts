import { Platform } from 'react-native';
import ParkingWidget from '../widgets/ParkingWidget';
import { Coordinate, ParkingSession, formatDistance, formatRemaining, haversineMeters } from '../utils/parking';

/** Android: snapshot atualizado ao salvar, limpar, voltar ao app ou atualizar GPS com app aberto. */
export function updateParkingWidget(session: ParkingSession | null, userLocation: Coordinate | null) {
  if (Platform.OS !== 'android') return;
  const distance = session && userLocation ? haversineMeters(userLocation, session) : null;
  try {
    ParkingWidget.updateSnapshot({
      remaining: session ? formatRemaining(session.expiryAt) : 'Sem registro',
      distance: formatDistance(distance),
      spot: session?.spot || session?.floor || '—',
    });
  } catch { /* widget indisponível durante pré-visualização */ }
}
