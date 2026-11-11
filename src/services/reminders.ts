import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

const CHANNEL_ID = 'estacionamento';
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function cancelReminder(id: string | null | undefined) {
  if (!id) return;
  try { await Notifications.cancelScheduledNotificationAsync(id); } catch { /* já cancelada */ }
}

/** Falhas ou recusas de permissão não devem impedir o salvamento da vaga. */
export async function scheduleReminder(expiryAt: number | null): Promise<{
  id: string | null; message: string | null;
}> {
  if (!expiryAt) return { id: null, message: 'Sem prazo: nenhum alerta foi agendado.' };
  const notifyAt = expiryAt - 10 * 60_000;
  if (notifyAt <= Date.now()) {
    return { id: null, message: 'Para avisar 10 min antes, escolha um período superior a 10 minutos.' };
  }
  try {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
        name: 'Avisos do estacionamento',
        importance: Notifications.AndroidImportance.HIGH,
      });
    }
    let permission = await Notifications.getPermissionsAsync();
    if (!permission.granted) permission = await Notifications.requestPermissionsAsync();
    if (!permission.granted) {
      return { id: null, message: 'Notificações desativadas. Ative nas configurações do Android.' };
    }
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Seu estacionamento está quase vencendo!',
        body: 'Faltam 10 minutos. Verifique o parquímetro ou a Zona Azul.',
        sound: 'default',
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: new Date(notifyAt),
        channelId: CHANNEL_ID,
      },
    });
    return { id, message: 'Alerta agendado para 10 minutos antes do vencimento.' };
  } catch {
    return { id: null, message: 'Não foi possível agendar a notificação neste dispositivo.' };
  }
}
