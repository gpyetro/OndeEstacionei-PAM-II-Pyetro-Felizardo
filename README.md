# Onde Estacionei? — PAM II

**Projeto 4: Estacionamento Inteligente**  
**Aluno:** Pyetro Gabriel Cordeiro Felizardo  
**Turma:** 3DS Manhã — ETEC Zona Leste  
**Disciplina:** Programação de Aplicativos Móveis II (PAM II)

O **Onde Estacionei?** é um aplicativo em React Native para guardar a localização do carro e facilitar o retorno à vaga. Ele reúne o registro por GPS, a consulta de um percurso a pé, um temporizador de estacionamento e informações úteis sobre a vaga.

## O que foi implementado

- **Registro da vaga:** salva as coordenadas obtidas pelo GPS, com identificação do andar, número da vaga e observações opcionais.
- **Mapa:** exibe os pontos do usuário e do veículo e permite solicitar uma rota de caminhada pela internet.
- **Tempo e aviso:** mostra a contagem regressiva do estacionamento e tenta agendar uma notificação local dez minutos antes do vencimento.
- **Widget Android:** exibe um resumo do último tempo e da distância calculados enquanto o aplicativo estava em uso.
- **Sensor e cadastro manual:** consulta o barômetro quando disponível e permite informar o andar manualmente.
- **Dados salvos no aparelho:** utiliza AsyncStorage, sem necessidade de criar conta ou banco de dados externo.

A interface está organizada em quatro abas: **Início, Mapa, Registrar e Ajustes**.

## Como abrir e testar

### Requisitos

- Node.js e npm;
- Android Studio com SDK e NDK configurados **ou** computador com ambiente Android equivalente;
- emulador Android ou celular Android com depuração USB;
- conexão com a internet para obter rotas;
- uma chave habilitada para **Maps SDK for Android** para visualizar o mapa nativo na compilação própria do app.

### Passos

No terminal, dentro da pasta do projeto:

```bash
npm install
npx expo install --fix
npx expo-doctor
npm test
npx tsc --noEmit
```

Para configurar a chave Google Maps **sem colocá-la no GitHub**, use uma variável de ambiente. Exemplo no PowerShell do Windows:

```powershell
$env:GOOGLE_MAPS_API_KEY="SUA_CHAVE_AQUI"
```

Com o emulador/celular Android conectado e reconhecido por `adb devices`:

```powershell
npx expo run:android
```

**Atenção:** esta aplicação utiliza `expo-widgets`; por isso, o widget **não pode ser testado no Expo Go**. É preciso instalar um build nativo. A chave do Google Maps também precisa ser configurada *antes* da compilação nativa. Se a escola fornecer uma chave para testes, prefira utilizá-la.

### O que verificar no aplicativo

1. Autorizar a localização e registrar uma vaga com andar e horário.
2. Conferir o local salvo na tela inicial.
3. Abrir o mapa e solicitar o percurso a pé.
4. Solicitar uma notificação de teste em **Ajustes**.
5. Fechar e reabrir o aplicativo para verificar o registro salvo.
6. Adicionar o widget à tela inicial do Android e conferir o resumo.
7. Encerrar o estacionamento e verificar se os dados foram limpos.

## Testes e situação do projeto

Foram executados **9 testes automatizados das funções de cálculo e validação**, todos aprovados. Na preparação realizada no notebook, o TypeScript não indicou erros e o Expo Doctor registrou **20/20 verificações aprovadas**.

**A execução completa no Android ainda precisa ser confirmada.** A tentativa de compilação foi interrompida por uma instalação incompleta do NDK (`CXX1101`: ausência de `source.properties` em `ndk/27.1.12297006`). Isso é um problema do ambiente de compilação identificado na tentativa, mas **não comprova** que todas as funções nativas estejam corretas. O projeto deve ser compilado e testado em outro computador antes de considerá-lo validado em Android.

## Arquivos principais

```text
App.tsx                     Telas e navegação do aplicativo
app.json                    Configuração do Expo e do widget
app.config.js               Leitura da chave do Google Maps
src/services/               GPS/armazenamento, notificações, rotas e widget
src/utils/parking.ts        Cálculos e validações
src/widgets/                Widget Android
tests/                       Testes automatizados
assets/                      Ícones
```

## Observações

- A distância na tela inicial é em linha reta; a rota de caminhada é calculada separadamente.
- As rotas dependem do serviço público FOSSGIS/OpenStreetMap e podem ficar indisponíveis.
- O widget mostra o último resumo atualizado pelo app, não monitora a localização em segundo plano.
- O barômetro fornece uma estimativa de altitude; o andar manual é mais confiável para estacionamentos fechados.
- A demonstração em vídeo é **uma apresentação visual do projeto**, não uma gravação do aplicativo executando.

**Referências técnicas:** [Expo](https://docs.expo.dev/), [React Native Maps](https://docs.expo.dev/versions/v58.0.0/sdk/map-view/) e [Expo Widgets](https://docs.expo.dev/versions/latest/sdk/widgets/).