import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator, Alert, AppState, Linking, Platform, Pressable,
  ScrollView, StatusBar, StyleSheet, Text, TextInput, View,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import MapView, { Marker, Polyline } from 'react-native-maps';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import { Barometer } from 'expo-sensors';
import { cancelReminder, scheduleReminder } from './src/services/reminders';
import { readParking, writeParking } from './src/services/parkingStorage';
import { fetchWalkingRoute, RouteResult } from './src/services/walkingRoute';
import { updateParkingWidget } from './src/services/widget';
import {
  Coordinate, ParkingSession, formatDistance, formatRemaining,
  haversineMeters, pressureToAltitudeMeters,
} from './src/utils/parking';

type Tab = 'home' | 'map' | 'save' | 'settings';
type IconName = React.ComponentProps<typeof Ionicons>['name'];

const C = {
  bg: '#08111F', surface: '#0F1D30', surface2: '#142740', border: '#243954',
  white: '#F2F7FF', muted: '#91A6C0', accent: '#66E6C4', blue: '#7CA5FF',
  danger: '#FF8F92', amber: '#FFD18A', black: '#06131B',
};
const sampleCenter = { latitude: -23.55052, longitude: -46.63331 };
const durationOptions: { value: number | null; label: string }[] = [
  { value: 30, label: '30 min' }, { value: 60, label: '1 hora' },
  { value: 120, label: '2 horas' }, { value: 180, label: '3 horas' },
  { value: null, label: 'Sem limite' },
];

function Label({ children }: { children: React.ReactNode }) {
  return <Text style={s.label}>{children}</Text>;
}
function IconCircle({ name, tone = 'accent' }: { name: IconName; tone?: 'accent' | 'blue' | 'amber' }) {
  return <View style={[s.iconCircle, { backgroundColor: tone === 'accent' ? '#174C49' : tone === 'blue' ? '#203A60' : '#473721' }]}>
    <Ionicons name={name} size={21} color={tone === 'accent' ? C.accent : tone === 'blue' ? C.blue : C.amber} />
  </View>;
}
function Button({ title, icon, onPress, secondary = false, disabled = false, busy = false, danger = false }: {
  title: string; icon?: IconName; onPress: () => void;
  secondary?: boolean; disabled?: boolean; busy?: boolean; danger?: boolean;
}) {
  const foreground = danger ? C.danger : secondary ? C.white : C.black;
  return <Pressable accessibilityRole="button" accessibilityLabel={title} disabled={disabled || busy}
    onPress={onPress} style={({ pressed }) => [s.button,
      secondary ? s.buttonSecondary : danger ? s.buttonDanger : s.buttonPrimary,
      (disabled || busy) && { opacity: 0.45 }, pressed && { opacity: 0.75 }]}>
    {busy ? <ActivityIndicator size="small" color={foreground} /> : icon ? <Ionicons name={icon} color={foreground} size={18} /> : null}
    <Text style={[s.buttonText, { color: foreground }]}>{title}</Text>
  </Pressable>;
}
function InfoRow({ icon, title, value, note }: { icon: IconName; title: string; value: string; note?: string }) {
  return <View style={s.infoRow}>
    <Ionicons name={icon} color={C.blue} size={21} style={{ width: 32 }} />
    <View style={{ flex: 1 }}><Text style={s.infoTitle}>{title}</Text>{note ? <Text style={s.infoNote}>{note}</Text> : null}</View>
    <Text style={s.infoValue}>{value}</Text>
  </View>;
}
function Input({ label, value, onChange, placeholder, multiline = false }: {
  label: string; value: string; onChange: (v: string) => void; placeholder: string; multiline?: boolean;
}) {
  return <View style={{ marginBottom: 17 }}>
    <Text style={s.inputLabel}>{label}</Text>
    <TextInput value={value} onChangeText={onChange} placeholder={placeholder}
      placeholderTextColor="#637995" style={[s.input, multiline && { height: 85, textAlignVertical: 'top' }]}
      multiline={multiline} maxLength={multiline ? 120 : 40} />
  </View>;
}

async function measureBarometer(): Promise<{ pressureHpa: number | null; altitudeApprox: number | null }> {
  try {
    if (!(await Barometer.isAvailableAsync())) return { pressureHpa: null, altitudeApprox: null };
    return await new Promise((resolve) => {
      let settled = false;
      let sub: ReturnType<typeof Barometer.addListener> | undefined;
      let timer: ReturnType<typeof setTimeout> | undefined;
      const finish = (pressureHpa: number | null) => {
        if (settled) return;
        settled = true;
        if (timer) clearTimeout(timer);
        sub?.remove();
        resolve({ pressureHpa, altitudeApprox: pressureHpa !== null ? pressureToAltitudeMeters(pressureHpa) : null });
      };
      try { sub = Barometer.addListener(({ pressure }) => finish(pressure)); }
      catch { finish(null); }
      timer = setTimeout(() => finish(null), 2200);
    });
  } catch { return { pressureHpa: null, altitudeApprox: null }; }
}

function ParkingApp() {
  const [tab, setTab] = useState<Tab>('home');
  const [parking, setParking] = useState<ParkingSession | null>(null);
  const [userPos, setUserPos] = useState<Coordinate | null>(null);
  const [gpsAllowed, setGpsAllowed] = useState(false);
  const [ready, setReady] = useState(false);
  const [working, setWorking] = useState(false);
  const [routeLoading, setRouteLoading] = useState(false);
  const [route, setRoute] = useState<RouteResult | null>(null);
  const [routeError, setRouteError] = useState('');
  const [now, setNow] = useState(Date.now());
  const [floor, setFloor] = useState('');
  const [spot, setSpot] = useState('');
  const [notes, setNotes] = useState('');
  const [duration, setDuration] = useState<number | null>(60);
  const [lastMessage, setLastMessage] = useState('');
  const mapRef = useRef<MapView>(null);

  useEffect(() => {
    let mounted = true;
    readParking().then((value) => { if (mounted) setParking(value); })
      .catch(() => { if (mounted) Alert.alert('Atenção', 'Não foi possível ler a vaga salva.'); })
      .finally(() => { if (mounted) setReady(true); });
    Location.getForegroundPermissionsAsync().then(({ granted }) => {
      if (mounted) setGpsAllowed(granted);
    }).catch(() => {});
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (!gpsAllowed) return;
    let alive = true;
    let subscription: Location.LocationSubscription | undefined;
    Location.getLastKnownPositionAsync().then((p) => {
      if (alive && p) setUserPos({ latitude: p.coords.latitude, longitude: p.coords.longitude });
    }).catch(() => {});
    Location.watchPositionAsync({ accuracy: Location.Accuracy.Balanced, timeInterval: 12_000, distanceInterval: 8 }, p => {
      if (alive) setUserPos({ latitude: p.coords.latitude, longitude: p.coords.longitude });
    }).then(s => { if (alive) subscription = s; else s.remove(); })
      .catch(() => {});
    return () => { alive = false; subscription?.remove(); };
  }, [gpsAllowed]);

  useEffect(() => {
    const clock = setInterval(() => setNow(Date.now()), 30_000);
    const listener = AppState.addEventListener('change', v => {
      if (v === 'active') setNow(Date.now());
    });
    return () => { clearInterval(clock); listener.remove(); };
  }, []);

  useEffect(() => { updateParkingWidget(parking, userPos); }, [parking, userPos, now]);
  useEffect(() => { setRoute(null); setRouteError(''); }, [parking?.id]);

  const distance = parking && userPos ? haversineMeters(userPos, parking) : null;
  const hasExpired = !!parking?.expiryAt && parking.expiryAt <= now;

  async function askGPS(): Promise<boolean> {
    try {
      const p = await Location.requestForegroundPermissionsAsync();
      setGpsAllowed(p.granted);
      if (!p.granted) Alert.alert('GPS não autorizado', 'Permita localização durante o uso nas configurações do aparelho para registrar sua vaga.');
      return p.granted;
    } catch { Alert.alert('GPS indisponível', 'Não foi possível solicitar a permissão de localização.'); return false; }
  }

  async function doSave() {
    if (working) return;
    setWorking(true);
    try {
      if (!(await askGPS())) return;
      const p = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Highest });
      if (!Number.isFinite(p.coords.latitude) || !Number.isFinite(p.coords.longitude)) {
        throw new Error('O GPS não retornou coordenadas válidas.');
      }
      const barometer = await measureBarometer();
      const parkedAt = Date.now();
      const expiryAt = duration === null ? null : parkedAt + duration * 60_000;
      const reminder = await scheduleReminder(expiryAt);
      const item: ParkingSession = {
        id: `${parkedAt}`, latitude: p.coords.latitude, longitude: p.coords.longitude,
        parkedAt, expiryAt, floor: floor.trim(), spot: spot.trim(), notes: notes.trim(),
        gpsAccuracy: p.coords.accuracy ?? null,
        pressureHpa: barometer.pressureHpa, altitudeApprox: barometer.altitudeApprox,
        notificationId: reminder.id,
      };
      try { await writeParking(item); }
      catch (error) { await cancelReminder(reminder.id); throw error; }
      await cancelReminder(parking?.notificationId);
      setParking(item);
      setUserPos({ latitude: p.coords.latitude, longitude: p.coords.longitude });
      setLastMessage(reminder.message || 'Vaga salva com sucesso.');
      setTab('home');
      Alert.alert('Vaga registrada!', `Seu carro foi salvo no GPS.\n\n${reminder.message || ''}`);
    } catch (error) {
      const detail = error instanceof Error ? error.message : 'Erro desconhecido';
      Alert.alert('Não foi possível salvar', `${detail}\n\nVerifique se o GPS do aparelho está ativo.`);
    } finally { setWorking(false); }
  }

  function confirmSave() {
    if (!parking) { void doSave(); return; }
    Alert.alert('Substituir vaga?', 'O registro anterior será substituído pelo novo local.', [
      { text: 'Cancelar', style: 'cancel' }, { text: 'Substituir', onPress: () => { void doSave(); } },
    ]);
  }

  function confirmClear() {
    if (!parking) return;
    Alert.alert('Finalizar estacionamento?', 'A vaga salva será apagada deste aparelho.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Finalizar', style: 'destructive', onPress: () => {
        void (async () => {
          try {
            await writeParking(null);
            await cancelReminder(parking.notificationId);
            setParking(null); setLastMessage('Vaga removida.');
            setTab('home');
          } catch { Alert.alert('Erro', 'Não foi possível remover os dados armazenados.'); }
        })();
      } },
    ]);
  }

  async function calculateRoute() {
    if (!parking) return;
    if (!userPos) {
      if (!gpsAllowed) await askGPS();
      Alert.alert('Localização necessária', 'Aguarde seu GPS localizar você e tente calcular a rota novamente.');
      return;
    }
    setRouteLoading(true); setRouteError('');
    try {
      const result = await fetchWalkingRoute(userPos, parking);
      setRoute(result);
    } catch {
      setRoute(null);
      setRouteError('Não foi possível obter o trajeto para pedestres. A linha tracejada indica apenas a direção do veículo.');
    } finally { setRouteLoading(false); }
  }

  function openExternalRoute() {
    if (!parking) return;
    const dest = `${parking.latitude},${parking.longitude}`;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${dest}&travelmode=walking`;
    Linking.openURL(url).catch(() => Alert.alert('Erro', 'Não foi possível abrir o aplicativo de mapas.'));
  }

  const initialRegion = {
    latitude: parking?.latitude ?? userPos?.latitude ?? sampleCenter.latitude,
    longitude: parking?.longitude ?? userPos?.longitude ?? sampleCenter.longitude,
    latitudeDelta: 0.012,
    longitudeDelta: 0.012,
  };

  const renderHome = () => (
    <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
      <View style={s.header}><View><Text style={s.eyebrow}>PAM II  /  PROJETO 04</Text>
        <Text style={s.h1}>Onde Estacionei<Text style={{ color: C.accent }}>?</Text></Text>
        <Text style={s.subtitle}>Seu carro, a um toque de distância.</Text></View>
        <IconCircle name="car-sport" /></View>

      <View style={s.hero}>
        <View style={s.heroTop}><View style={s.chip}><View style={[s.dot, { backgroundColor: parking ? (hasExpired ? C.amber : C.accent) : C.muted }]} />
          <Text style={s.chipText}>{parking ? (hasExpired ? 'TEMPO VENCIDO' : 'VEÍCULO REGISTRADO') : 'NENHUMA VAGA SALVA'}</Text></View>
          <Ionicons name="car-outline" size={27} color={C.blue} /></View>
        <Text style={s.heroCaption}>{parking ? 'Tempo restante do estacionamento' : 'Pronto para seu próximo trajeto'}</Text>
        <Text style={s.heroTime}>{parking ? formatRemaining(parking.expiryAt, now) : '— —'}</Text>
        <View style={s.heroDivider} />
        <View style={s.metrics}>
          <View style={{ flex: 1 }}><Text style={s.metricLabel}>ATÉ O CARRO</Text><Text style={s.metricValue}>{formatDistance(distance)}</Text></View>
          <View style={{ flex: 1 }}><Text style={s.metricLabel}>VAGA / ANDAR</Text><Text style={s.metricValue} numberOfLines={1}>{parking?.spot || parking?.floor || '—'}</Text></View>
        </View>
        <Text style={s.tiny}>Distância aproximada em linha reta • GPS enquanto o app está aberto</Text>
      </View>

      <Label>AÇÕES RÁPIDAS</Label>
      <View style={s.actions}>
        <Pressable style={s.actionCard} onPress={() => setTab('save')}>
          <IconCircle name="add-circle-outline" /><Text style={s.actionTitle}>Registrar vaga</Text>
          <Text style={s.actionNote}>Salvar o local do carro</Text>
        </Pressable>
        <Pressable style={s.actionCard} onPress={() => setTab('map')}>
          <IconCircle name="navigate-outline" tone="blue" /><Text style={s.actionTitle}>Encontrar carro</Text>
          <Text style={s.actionNote}>Ver mapa e rota a pé</Text>
        </Pressable>
      </View>

      {parking ? <>
        <Label>ESTACIONAMENTO ATUAL</Label>
        <View style={s.card}>
          <InfoRow icon="calendar-outline" title="Registrado em" value={new Date(parking.parkedAt).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })} />
          <InfoRow icon="time-outline" title="Vencimento" value={parking.expiryAt ? new Date(parking.expiryAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : 'Sem limite'} />
          <InfoRow icon="layers-outline" title="Andar do estacionamento" value={parking.floor || 'Não informado'} />
          <InfoRow icon="locate-outline" title="Precisão informada pelo GPS" value={parking.gpsAccuracy !== null ? `± ${Math.round(parking.gpsAccuracy)} m` : 'Indisponível'} />
          {parking.notes ? <View style={s.noteCard}><Ionicons name="document-text-outline" color={C.blue} size={19}/><Text style={s.noteText}>{parking.notes}</Text></View> : null}
        </View>
        <Button title="Ver meu carro no mapa" icon="map-outline" onPress={() => setTab('map')} />
        <Button title="Finalizar estacionamento" icon="checkmark-circle-outline" onPress={confirmClear} secondary />
      </> : <View style={s.card}><Text style={s.emptyTitle}>Nenhum estacionamento ativo</Text>
        <Text style={s.emptyNote}>Quando parar o carro, toque em “Registrar vaga” para salvar as coordenadas, o horário e o andar.</Text>
        <Button title="Começar agora" icon="add" onPress={() => setTab('save')} /></View>}
      {lastMessage ? <Text style={s.tiny}>{lastMessage}</Text> : null}
    </ScrollView>
  );

  const renderMap = () => (
    <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
      <Text style={s.eyebrow}>LOCALIZAÇÃO E ROTAS</Text><Text style={s.h2}>Encontre seu veículo</Text>
      <Text style={s.subtitle}>Veja o ponto salvo e calcule um percurso para pedestres.</Text>
      <View style={s.mapHolder}>
        <MapView ref={mapRef} style={StyleSheet.absoluteFill} initialRegion={initialRegion}
          showsUserLocation={gpsAllowed} showsMyLocationButton={false}>
          {parking ? <Marker coordinate={parking} title="Meu veículo" description={parking.spot || 'Local estacionado'} pinColor={C.accent} /> : null}
          {userPos ? <Marker coordinate={userPos} title="Estou aqui" pinColor={C.blue} /> : null}
          {route && route.points.length > 1 ?
            <Polyline coordinates={route.points} strokeWidth={5} strokeColor="#3B7CF5" /> :
            parking && userPos ? <Polyline coordinates={[userPos, parking]} strokeWidth={3} strokeColor="#5A77A8" lineDashPattern={[9, 8]} /> : null}
        </MapView>
        <View style={s.mapBadge}><Ionicons name="navigate" color={C.accent} size={15}/>
          <Text style={s.mapBadgeText}>{route ? 'ROTA A PÉ' : 'MAPA INTERATIVO'}</Text></View>
      </View>
      {!gpsAllowed ? <Button title="Permitir acesso ao GPS" icon="locate-outline" onPress={() => { void askGPS(); }} /> : null}
      {!parking ? <View style={s.card}><Text style={s.emptyTitle}>Registre primeiro uma vaga</Text>
        <Text style={s.emptyNote}>O mapa exibirá o marcador do veículo após você salvar a localização.</Text>
        <Button title="Registrar vaga" icon="add" onPress={() => setTab('save')} /></View> : <>
        <View style={s.card}>
          <InfoRow icon="location-outline" title="Distância direta" value={formatDistance(distance)} note="Não é a distância percorrida na rua" />
          <InfoRow icon="footsteps-outline" title="Percurso a pé" value={route ? formatDistance(route.meters) : 'Não calculado'} note={route ? `Aproximadamente ${route.minutes} min de caminhada` : 'Requer conexão com a internet'} />
          <InfoRow icon="pin-outline" title="Coordenadas salvas" value={`${parking.latitude.toFixed(5)}, ${parking.longitude.toFixed(5)}`} />
        </View>
        <Button title="Calcular rota a pé" icon="footsteps-outline" busy={routeLoading} onPress={() => { void calculateRoute(); }} />
        <Button title="Abrir navegação no Google Maps" icon="open-outline" onPress={openExternalRoute} secondary />
        {routeError ? <Text style={s.warning}>{routeError}</Text> : null}
        <Text style={s.tiny}>A rota a pé é consultada sob demanda em um serviço comunitário OpenStreetMap/FOSSGIS. O traçado pode variar e depende da cobertura do mapa.</Text>
      </>}
    </ScrollView>
  );

  const renderSave = () => (
    <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
      <Text style={s.eyebrow}>REGISTRO DE VAGA</Text><Text style={s.h2}>Estacionou? Salve aqui.</Text>
      <Text style={s.subtitle}>O aplicativo capturará seu GPS ao tocar em salvar.</Text>
      <View style={[s.card, { flexDirection: 'row', alignItems: 'center', gap: 12 }]}>
        <IconCircle name="locate-outline" />
        <View style={{ flex: 1 }}><Text style={s.infoTitle}>Captura por localização</Text>
          <Text style={s.infoNote}>Ative o GPS e permita acesso durante o uso.</Text></View>
        <Ionicons name={gpsAllowed ? 'checkmark-circle' : 'alert-circle-outline'} color={gpsAllowed ? C.accent : C.amber} size={24} />
      </View>
      <Label>IDENTIFICAÇÃO DA VAGA</Label>
      <Input label="Andar ou setor (opcional)" placeholder="Ex.: Subsolo 2, Piso G1" value={floor} onChange={setFloor} />
      <Input label="Número ou identificação da vaga (opcional)" placeholder="Ex.: A-24" value={spot} onChange={setSpot} />
      <Input label="Observações (opcional)" placeholder="Ex.: Próximo ao elevador, coluna azul..." value={notes} onChange={setNotes} multiline />
      <Label>TEMPO DE ESTACIONAMENTO</Label>
      <View style={s.durationList}>{durationOptions.map(option => (
        <Pressable key={String(option.value)} onPress={() => setDuration(option.value)} style={[s.durationChip, duration === option.value && s.durationChipActive]}>
          <Text style={[s.durationText, duration === option.value && { color: C.black, fontWeight: '800' }]}>{option.label}</Text>
        </Pressable>
      ))}</View>
      <View style={s.tip}><Ionicons name="notifications-outline" size={18} color={C.amber} />
        <Text style={s.tipText}>Se houver horário de vencimento, o app tentará avisar 10 minutos antes. O aviso depende das permissões do Android.</Text></View>
      <Button title={parking ? 'Salvar nova vaga' : 'Salvar localização do carro'} icon="save-outline" onPress={confirmSave} busy={working} />
      <Text style={s.tiny}>O local do carro ficará salvo somente neste dispositivo, mesmo após fechar o app. Não substitui o pagamento da Zona Azul.</Text>
    </ScrollView>
  );

  const testReminder = async () => {
    try {
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('estacionamento', { name: 'Avisos do estacionamento', importance: Notifications.AndroidImportance.HIGH });
      }
      let p = await Notifications.getPermissionsAsync();
      if (!p.granted) p = await Notifications.requestPermissionsAsync();
      if (!p.granted) { Alert.alert('Sem permissão', 'Autorize as notificações nas configurações do aparelho.'); return; }
      await Notifications.scheduleNotificationAsync({
        content: { title: 'Teste concluído!', body: 'As notificações locais do Onde Estacionei? estão configuradas.' },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 5, channelId: 'estacionamento' },
      });
      Alert.alert('Teste agendado', 'A notificação de teste deverá aparecer em cerca de 5 segundos.');
    } catch { Alert.alert('Erro', 'Não foi possível agendar o alerta de teste.'); }
  };

  const renderSettings = () => (
    <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
      <Text style={s.eyebrow}>AJUDA E CONFIGURAÇÕES</Text><Text style={s.h2}>Sobre o aplicativo</Text>
      <Text style={s.subtitle}>Projeto prático React Native • PAM II</Text>
      <Label>PERMISSÕES E TESTES</Label>
      <View style={s.card}>
        <InfoRow icon="location-outline" title="Localização" value={gpsAllowed ? 'Autorizada' : 'Não autorizada'} />
        <InfoRow icon="save-outline" title="Armazenamento" value="Local" />
        <InfoRow icon="speedometer-outline" title="Altímetro" value={parking?.altitudeApprox !== null && parking?.altitudeApprox !== undefined ? `~ ${parking.altitudeApprox} m` : 'Indisponível'} note="Estimativa por pressão; pode ser imprecisa" />
        <Button title="Solicitar acesso ao GPS" icon="locate-outline" onPress={() => { void askGPS(); }} secondary />
        <Button title="Testar notificação (5 segundos)" icon="notifications-outline" onPress={() => { void testReminder(); }} secondary />
      </View>
      <Label>WIDGET NA TELA INICIAL</Label>
      <View style={s.card}><Text style={s.infoTitle}>Widget Android</Text>
        <Text style={[s.infoNote, { marginTop: 8, lineHeight: 20 }]}>Após instalar a versão de desenvolvimento, pressione e segure a tela inicial do Android, escolha Widgets e adicione “Onde Estacionei?”. Ele mostra o último tempo e distância calculados ao abrir ou usar o app.</Text>
        <Text style={[s.infoNote, { marginTop: 8, lineHeight: 20 }]}>O widget não atualiza o GPS em segundo plano. Para dados novos, abra o aplicativo.</Text>
      </View>
      <Label>COMO FUNCIONA</Label>
      <View style={s.card}><Text style={s.infoNote}>1. Pare o veículo e registre a vaga com o GPS ativo.\n\n2. Informe andar, identificação e tempo de estacionamento.\n\n3. Volte à tela do mapa e calcule a rota a pé.\n\n4. Quando retirar o carro, finalize o registro.</Text></View>
      <Text style={s.tiny}>Onde Estacionei? • v1.0 • Projeto acadêmico • React Native + Expo SDK 58.</Text>
      <Text style={s.tiny}>Privacidade: coordenadas são armazenadas localmente. Ao calcular a rota, os pontos inicial e final são enviados ao servidor público de roteamento FOSSGIS.</Text>
    </ScrollView>
  );

  if (!ready) return <View style={[s.page, { justifyContent: 'center', alignItems: 'center' }]}><ActivityIndicator color={C.accent} size="large" /><Text style={s.subtitle}>Carregando estacionamento...</Text></View>;
  const tabs: { id: Tab; label: string; icon: IconName }[] = [
    { id: 'home', label: 'Início', icon: 'home-outline' }, { id: 'map', label: 'Mapa', icon: 'map-outline' },
    { id: 'save', label: 'Registrar', icon: 'add-circle-outline' }, { id: 'settings', label: 'Ajustes', icon: 'settings-outline' },
  ];
  return <View style={s.page}>
    <StatusBar barStyle="light-content" />
    <SafeAreaView style={{ flex: 1 }} edges={['top']}>
      <View style={{ flex: 1 }}>
        {tab === 'home' ? renderHome() : tab === 'map' ? renderMap() : tab === 'save' ? renderSave() : renderSettings()}
      </View>
      <View style={s.bottomNav}>{tabs.map(t => (
        <Pressable accessibilityRole="tab" accessibilityState={{ selected: tab === t.id }} key={t.id} onPress={() => setTab(t.id)} style={s.navItem}>
          <Ionicons name={t.icon} size={23} color={tab === t.id ? C.accent : C.muted} />
          <Text style={[s.navText, { color: tab === t.id ? C.accent : C.muted }]}>{t.label}</Text>
        </Pressable>
      ))}</View>
    </SafeAreaView>
  </View>;
}
export default function App() { return <SafeAreaProvider><ParkingApp /></SafeAreaProvider>; }

const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: C.bg },
  scroll: { paddingHorizontal: 21, paddingTop: 22, paddingBottom: 36, gap: 13 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 9 },
  eyebrow: { color: C.accent, fontWeight: '800', fontSize: 10, letterSpacing: 2.4, marginBottom: 9 },
  h1: { color: C.white, fontSize: 30, fontWeight: '900', letterSpacing: -1.1 },
  h2: { color: C.white, fontSize: 29, fontWeight: '800', letterSpacing: -1, marginBottom: 1 },
  subtitle: { color: C.muted, fontSize: 13, lineHeight: 20 },
  label: { color: C.muted, fontSize: 11, fontWeight: '800', letterSpacing: 1.7, marginTop: 12, marginBottom: 1 },
  iconCircle: { width: 47, height: 47, alignItems: 'center', justifyContent: 'center', borderRadius: 15 },
  hero: { backgroundColor: C.surface2, borderWidth: 1, borderColor: '#285064', borderRadius: 25, padding: 22, marginBottom: 5 },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  chip: { backgroundColor: '#203B48', borderRadius: 20, flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 11, paddingVertical: 8 },
  chipText: { color: C.white, fontSize: 9, letterSpacing: 1, fontWeight: '800' },
  dot: { width: 7, height: 7, borderRadius: 4 },
  heroCaption: { color: C.muted, fontSize: 13, marginTop: 26 },
  heroTime: { color: C.white, fontSize: 41, fontWeight: '900', letterSpacing: -1.3, marginTop: 3 },
  heroDivider: { height: 1, backgroundColor: '#32526B', marginTop: 23, marginBottom: 20 },
  metrics: { flexDirection: 'row', gap: 12 },
  metricLabel: { color: C.muted, fontSize: 10, fontWeight: '700', letterSpacing: 1.4 },
  metricValue: { color: C.white, fontSize: 19, fontWeight: '800', marginTop: 7 },
  tiny: { color: C.muted, fontSize: 11, lineHeight: 17, marginTop: 8 },
  actions: { flexDirection: 'row', gap: 12, marginBottom: 6 },
  actionCard: { flex: 1, backgroundColor: C.surface, borderColor: C.border, borderWidth: 1, borderRadius: 19, padding: 15, gap: 9, minHeight: 148 },
  actionTitle: { color: C.white, fontWeight: '800', fontSize: 14 },
  actionNote: { color: C.muted, fontSize: 11, lineHeight: 16 },
  card: { backgroundColor: C.surface, borderColor: C.border, borderWidth: 1, borderRadius: 20, padding: 18, gap: 14 },
  emptyTitle: { color: C.white, fontSize: 17, fontWeight: '800' },
  emptyNote: { color: C.muted, fontSize: 13, lineHeight: 20, marginBottom: 4 },
  button: { paddingVertical: 15, paddingHorizontal: 15, minHeight: 51, borderRadius: 15, justifyContent: 'center', alignItems: 'center', flexDirection: 'row', gap: 9, marginTop: 3 },
  buttonPrimary: { backgroundColor: C.accent },
  buttonSecondary: { backgroundColor: '#1C3049', borderWidth: 1, borderColor: C.border },
  buttonDanger: { backgroundColor: '#492735' },
  buttonText: { fontSize: 14, fontWeight: '800' },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 33 },
  infoTitle: { color: C.white, fontSize: 13, fontWeight: '700' },
  infoNote: { color: C.muted, fontSize: 11, lineHeight: 17, marginTop: 2 },
  infoValue: { color: C.white, fontSize: 12, fontWeight: '700', maxWidth: '52%', textAlign: 'right' },
  noteCard: { flexDirection: 'row', gap: 8, backgroundColor: '#162840', borderRadius: 11, padding: 12 },
  noteText: { color: C.white, fontSize: 12, flex: 1, lineHeight: 19 },
  mapHolder: { height: 350, borderRadius: 22, borderWidth: 1, borderColor: C.border, overflow: 'hidden', marginTop: 8 },
  mapBadge: { position: 'absolute', left: 14, top: 14, backgroundColor: C.bg, borderRadius: 40, paddingHorizontal: 12, paddingVertical: 9, flexDirection: 'row', alignItems: 'center', gap: 6 },
  mapBadgeText: { color: C.white, fontWeight: '800', fontSize: 10, letterSpacing: 1 },
  warning: { color: C.amber, lineHeight: 20, fontSize: 12 },
  inputLabel: { color: C.white, fontSize: 13, fontWeight: '700', marginBottom: 8 },
  input: { backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, borderRadius: 13, color: C.white, paddingHorizontal: 15, paddingVertical: 13, fontSize: 14 },
  durationList: { flexDirection: 'row', flexWrap: 'wrap', gap: 9, marginTop: 1, marginBottom: 6 },
  durationChip: { borderWidth: 1, borderColor: C.border, borderRadius: 30, paddingHorizontal: 15, paddingVertical: 12, backgroundColor: C.surface },
  durationChipActive: { backgroundColor: C.accent, borderColor: C.accent },
  durationText: { color: C.white, fontSize: 12, fontWeight: '700' },
  tip: { flexDirection: 'row', gap: 9, backgroundColor: '#292A36', padding: 15, borderRadius: 13, marginBottom: 4 },
  tipText: { color: '#D6C4A7', fontSize: 12, flex: 1, lineHeight: 18 },
  bottomNav: { flexDirection: 'row', paddingTop: 11, paddingBottom: Platform.OS === 'android' ? 16 : 10, borderTopWidth: 1, borderTopColor: C.border, backgroundColor: '#0E1B2D' },
  navItem: { flex: 1, alignItems: 'center', gap: 5 },
  navText: { fontSize: 10, fontWeight: '700' },
});
