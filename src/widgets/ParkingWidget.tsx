import { Column, Text } from '@expo/ui/jetpack-compose';
import { createWidget } from 'expo-widgets';

type ParkingWidgetProps = { remaining: string; distance: string; spot: string };

const ParkingWidget = (props: ParkingWidgetProps) => {
  'widget';
  return (
    <Column>
      <Text>ONDE ESTACIONEI?</Text>
      <Text>Tempo: {props.remaining}</Text>
      <Text>Distância: {props.distance}</Text>
      <Text>Vaga: {props.spot}</Text>
    </Column>
  );
};

export default createWidget('ParkingWidget', ParkingWidget, {
  remaining: 'Sem registro', distance: '—', spot: '—',
});
