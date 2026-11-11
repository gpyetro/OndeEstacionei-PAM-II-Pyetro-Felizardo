import test from 'node:test';
import assert from 'node:assert/strict';
import { haversineMeters, formatDistance, formatRemaining, pressureToAltitudeMeters, validateParking } from '../src/utils/parking.ts';

test('Haversine retorna zero para o mesmo ponto', () => {
  assert.equal(haversineMeters({latitude:-23.55,longitude:-46.63},{latitude:-23.55,longitude:-46.63}),0);
});
test('Haversine mede ~111 km entre 1 grau de latitude', () => {
  const meters = haversineMeters({latitude:0,longitude:0},{latitude:1,longitude:0});
  assert.ok(meters > 110000 && meters < 112000);
});
test('distância menor que 1 km aparece em metros',()=>assert.equal(formatDistance(505.8),'506 m'));
test('distância maior que 1 km aparece em km',()=>assert.equal(formatDistance(1500),'1,5 km'));
test('contagem regressiva indica tempo restante',()=>assert.equal(formatRemaining(3600000,0),'1h 00min'));
test('tempo expirado sinaliza vencimento',()=>assert.equal(formatRemaining(100,200),'Vencido'));
test('parquímetro sem prazo possui rótulo próprio',()=>assert.equal(formatRemaining(null,0),'Sem limite'));
test('pressão ao nível do mar estima zero metros',()=>assert.equal(pressureToAltitudeMeters(1013.25),0));
test('dados inválidos não são aceitos',()=>assert.equal(validateParking({latitude:200}),false));
