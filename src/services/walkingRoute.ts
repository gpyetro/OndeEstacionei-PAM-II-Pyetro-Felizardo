import { Coordinate } from '../utils/parking';

export type RouteResult = { points: Coordinate[]; meters: number; minutes: number };

/**
 * FOSSGIS / OpenStreetMap: instância pública de demonstração de rotas A PÉ.
 * Consultada apenas quando o usuário pede, para respeitar limite de utilização.
 * Requer internet; envia coordenadas ao servidor para calcular o caminho.
 */
export async function fetchWalkingRoute(from: Coordinate, to: Coordinate): Promise<RouteResult> {
  const coords = `${from.longitude},${from.latitude};${to.longitude},${to.latitude}`;
  const url = `https://routing.openstreetmap.de/routed-foot/route/v1/driving/${coords}?overview=full&geometries=geojson&steps=false`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12_000);
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) throw new Error('Servidor de rotas indisponível');
    const json: unknown = await response.json();
    const data = json as { code?: string; routes?: { distance: number; duration: number; geometry: { coordinates: number[][] } }[] };
    const first = data.routes?.[0];
    if (data.code !== 'Ok' || !first || !Array.isArray(first.geometry?.coordinates)) {
      throw new Error('Nenhuma rota a pé encontrada entre os pontos.');
    }
    return {
      points: first.geometry.coordinates.map(([lon, lat]) => ({ latitude: lat, longitude: lon })),
      meters: first.distance,
      minutes: Math.ceil(first.duration / 60),
    };
  } finally { clearTimeout(timeout); }
}
