# Onde Estacionei? 🚗

**Projeto 4 — Estacionamento Inteligente**  
**Disciplina:** Programação de Aplicativos Móveis II (PAM II)  
**Curso:** Técnico em Desenvolvimento de Sistemas  
**Autor e apresentação:** Pyetro Gabriel Cordeiro Felizardo (individual)

Aplicativo para registrar onde o veículo foi estacionado, exibir sua localização no mapa, calcular rota para pedestres, acompanhar o prazo da vaga e receber lembretes locais.

## Recursos

- GPS com permissão durante o uso e gravação das coordenadas da vaga.
- Mapa com marcadores do carro e do usuário e rota a pé consultada sob demanda.
- Tempo restante e estimativa de distância calculada por Haversine.
- Notificação local agendada para 10 minutos antes do vencimento.
- Widget Android com tempo e distância conforme a última atualização realizada com o app aberto.
- Leitura opcional do barômetro para estimativa de altitude ou informação manual do andar.
- Persistência de dados no AsyncStorage.
- Interface com quatro abas: Início, Mapa, Registrar e Ajustes.

## Tecnologia

React Native, Expo SDK 58, TypeScript, `expo-location`, `react-native-maps`, `expo-notifications`, `expo-sensors`, `expo-widgets`, `@expo/ui` e `@react-native-async-storage/async-storage`.

## Comece por aqui

**Leia o arquivo [`GUIA-WINDOWS.md`](GUIA-WINDOWS.md).** Ele explica instalação, chave Google Maps, dispositivo Android, compilação, testes, GitHub e solução de erros.

### Comandos principais

```bash
npm install
npx expo install --fix
npm test
npx expo run:android
```

Antes do `run:android`, configurar variável de ambiente `GOOGLE_MAPS_API_KEY` como descrito no guia. Para testar widgets Android é necessário um **development build**, não Expo Go.

## Organização

```
OndeEstacionei-PAM-II/
├── App.tsx                   # Telas, fluxos e interface
├── index.ts                  # Entrada do aplicativo
├── app.json                  # Permissões e widget Android
├── app.config.js            # Configuração nativa da chave do Maps
├── src/
│   ├── services/
│   │   ├── parkingStorage.ts # AsyncStorage
│   │   ├── reminders.ts      # Notificações locais
│   │   ├── walkingRoute.ts   # Consulta de rota a pé
│   │   └── widget.ts         # Atualização do widget
│   ├── utils/parking.ts      # Cálculos, formatos e validações
│   └── widgets/ParkingWidget.tsx
├── assets/                   # Ícones do aplicativo
├── tests/                    # Testes automáticos das funções puras
├── GUIA-WINDOWS.md           # Instalação e GitHub
└── ROTEIRO-VIDEO.md          # Roteiro de demonstração
```

## Status de validação (11/11/2026)

**Testes de lógica: 9/9 aprovados; TypeScript: aprovado; Expo Doctor: 20/20.** A compilação Android foi interrompida por um NDK incompleto (`CXX1101`), portanto não há validação de execução em emulador. Veja [STATUS-E-TESTES.md](STATUS-E-TESTES.md). A apresentação entregue é uma **prévia visual/técnica**, não captura de uso real.

## Limitações importantes

- O cálculo de rota depende de internet e do servidor público FOSSGIS/OpenStreetMap. A linha direta tracejada não é uma rota caminhável; não serve como orientação para atravessar ruas.
- Em uma versão Android própria, o Google Maps SDK exige chave de API válida e configuração do projeto no Google Cloud; é necessário envolver o professor ou responsável se houver exigência de cadastro de faturamento.
- A distância da home e do widget é a distância geográfica em linha reta, **não** o percurso real a pé.
- A atualização do GPS e do widget ocorre enquanto o app está em uso; não há rastreamento contínuo em segundo plano.
- O Android pode restringir ou atrasar avisos conforme bateria, notificações e permissões.
- O barômetro estima altitude pela pressão padrão, não permite identificar um andar com precisão; existe campo manual para andar.
- Os dados são locais; não há backend, conta de usuário ou pagamento de Zona Azul.
- O servidor de rota recebe coordenadas quando o usuário pede o cálculo. Consulte a [política do serviço](https://routing.openstreetmap.de/about.html).

## Testes

`npm test` executa testes automatizados da distância (Haversine), formatação de tempo e distância, conversão de pressão e validação. Isso **não** substitui a execução e verificação no Android. Para checklist manual, veja [`GUIA-WINDOWS.md`](GUIA-WINDOWS.md).

## Fontes técnicas

- [React Native Maps — Expo SDK 58](https://docs.expo.dev/versions/v58.0.0/sdk/map-view/)
- [Expo Location](https://docs.expo.dev/versions/v58.0.0/sdk/location/)
- [Expo Notifications](https://docs.expo.dev/versions/v58.0.0/sdk/notifications/)
- [Expo Widgets](https://docs.expo.dev/versions/v58.0.0/sdk/widgets/)
- [Expo Barometer](https://docs.expo.dev/versions/latest/sdk/barometer/)
- [FOSSGIS Routing](https://routing.openstreetmap.de/about.html)

## Entrega

Repositório GitHub com os arquivos do código-fonte + vídeo com o aplicativo em execução, conforme instruções do professor.
