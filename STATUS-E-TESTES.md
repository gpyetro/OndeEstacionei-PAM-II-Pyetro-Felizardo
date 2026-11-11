# Registro técnico e resultados — PAM II

**Projeto:** Onde Estacionei? — Estacionamento Inteligente  
**Apresentação:** individual — Pyetro Gabriel Cordeiro Felizardo  
**Data do registro:** 11/11/2026

## O que foi verificado

- `npm install`: 485 pacotes adicionados; auditoria apontou cinco vulnerabilidades moderadas na máquina do aluno (requerem análise antes de correções automáticas).
- `npx expo install --fix`: TypeScript e tipos React alinhados ao Expo SDK 58.
- `npm test`: **9 testes passaram, zero falhas** (Haversine, distância, tempo restante, vencimento, pressão/altitude e validação).
- `npx tsc --noEmit`: sem erros após correção da propriedade `backgroundColor` em `StatusBar`.
- `npx expo-doctor`: **20/20 verificações aprovadas** após instalar `expo-font`.
- `adb devices`: `emulator-5554 device` — o Android virtual conectou corretamente.
- `npx expo run:android`: **a compilação não foi concluída**. O Gradle relatou `CXX1101`, NDK incompleto em `ndk/27.1.12297006` sem `source.properties`.

## O que ainda precisa de validação no Android

Não há evidência de abertura do aplicativo, GPS real, rota, notificações, widget e sensor funcionando em dispositivo. São funcionalidades **implementadas no código**, não demonstradas em execução. A chave do Google Maps também precisa ser configurada para compilações Android com mapa nativo.

## Como continuar no computador da escola

1. Abrir o projeto no VS Code, executar `npm install` e `npx expo install --fix`.
2. Verificar SDK Android, Build-Tools, NDK exigido pelo Gradle e Java apropriado.
3. Adicionar `GOOGLE_MAPS_API_KEY` no ambiente com chave válida disponibilizada pelo professor/escola, se houver.
4. Executar `npx expo run:android` no emulador ou dispositivo Android.
5. Testar registro de vaga, mapa e rota, aviso antes de vencimento, widget, andar manual e persistência após fechar o aplicativo.

**Integridade da apresentação:** o vídeo fornecido é uma apresentação técnica com protótipos visuais, não uma gravação do APK em execução. Deve ser acompanhado de captura real do aplicativo caso o professor exija demonstração prática.
