# Guia de execução no Windows — PAM II / Projeto 4

## 1. Programas necessários

- **VS Code** para abrir os arquivos e usar o terminal integrado.
- **Node.js 22.13+ ou 24.3+** e npm (teste no PowerShell: `node -v` e `npm -v`).
- **Git** (`git --version`).
- **JDK 17** (versão recomendada pelo Android Gradle Plugin usado pelo projeto) e **Android SDK** devidamente configurados; a instalação do Android Studio não é obrigatória se o SDK e o emulador já estiverem configurados.
- **Celular Android com depuração USB ativada** ou um emulador Android com Google Play Services.
- Conexão com a internet para instalar as dependências e consultar rotas.

## 2. Extrair e abrir o projeto

1. Extraia o arquivo ZIP em uma pasta como `C:\Projetos\OndeEstacionei-PAM-II`.
2. Abra o VS Code.
3. Clique em **Arquivo > Abrir Pasta** e escolha `OndeEstacionei-PAM-II`.
4. Abra **Terminal > Novo Terminal**. Confira se o terminal já está na pasta do projeto.

## 3. Instalar as dependências

No PowerShell do VS Code:

```powershell
npm install
npx expo install --fix
npx expo-doctor
npm test
```

O `expo install --fix` alinha os pacotes à versão do Expo SDK 58. Se aparecerem erros, guarde o texto completo do terminal para corrigir a causa específica.

## 4. Preparar o Android e o Google Maps

**Importante:** o aplicativo usa `react-native-maps`. Para mostrar o mapa na versão Android criada pelo projeto, o Google Maps SDK exige uma **chave de API válida**, com a API Maps SDK for Android habilitada. Dependendo do cadastro, o Google Cloud exige uma conta de faturamento; não faça nenhum cadastro financeiro sem a orientação do professor ou responsável. Uma chave de projeto disponibilizada pela escola é uma opção.

Documentação oficial: https://docs.expo.dev/versions/v58.0.0/sdk/map-view/

O professor pode orientar a obtenção e a restrição da chave de desenvolvimento. Assim que tiver a chave, no **mesmo terminal PowerShell** onde executará o build, defina:

```powershell
$env:GOOGLE_MAPS_API_KEY="COLE_AQUI_SUA_CHAVE"
```

O arquivo `app.config.js` usa essa variável durante a compilação. **Não** cole a chave no GitHub. Configure restrições por pacote `com.pamii.ondeestacionei` e certificado SHA-1 conforme a documentação oficial.

> Sem uma chave válida, o mapa Android nativo poderá aparecer em branco, mesmo que outros recursos funcionem. O botão "Abrir navegação no Google Maps" ainda permite abrir um aplicativo de mapas externo.

## 5. Conectar o celular ou iniciar um emulador

### Celular Android

1. Ative Opções do desenvolvedor e Depuração USB nas configurações do aparelho; se necessário, peça ajuda a um responsável ou professor.
2. Conecte o celular ao PC com um cabo USB que permita transferência de dados.
3. Aceite a solicitação de depuração no celular.
4. Confirme no terminal:

```powershell
adb devices
```

O dispositivo deve aparecer com o estado `device` (não `unauthorized`).

### Emulador

1. Inicie seu emulador Android já configurado (preferencialmente com Google Play Services).
2. Confira `adb devices`.
3. Caso seu Android SDK não esteja no PATH, configure `ANDROID_HOME` e as pastas `platform-tools`/`emulator` conforme o ambiente da escola.

## 6. Compilar e executar

Com o emulador ou celular conectado, e a chave do Maps configurada:

```powershell
npx expo run:android
```

A primeira compilação nativa pode demorar e precisa baixar os componentes do Gradle. O comando deve compilar, instalar e abrir o aplicativo no dispositivo. Para execuções futuras, com a versão de desenvolvimento já instalada:

```powershell
npx expo start --dev-client
```

Quando o Metro iniciar, abra o aplicativo no celular ou pressione `a` para o Android conectado.

**O Expo Go não inclui `expo-widgets`**: para testar o widget Android é necessário executar a versão própria do aplicativo gerada por `expo run:android` ou por um build de desenvolvimento do EAS.

Se alguma alteração mudar os plugins nativos (por exemplo, inserir uma chave do Maps depois da primeira compilação), execute um **novo** `npx expo run:android`.

## 7. Testar as funcionalidades

1. Abra **Registrar**. Ative o GPS. Preencha, por exemplo, `P1`, `Vaga A-07` e uma observação.
2. Escolha `30 min` ou `1 hora`, toque em **Salvar localização do carro**, autorize a localização e as notificações.
3. Na tela **Início**, verifique se aparecem os dados da vaga, o relógio e a precisão do GPS.
4. Na aba **Mapa**, toque em **Calcular rota a pé**. Com internet, o app solicita um percurso de caminhada ao serviço FOSSGIS/OpenStreetMap.
5. Na aba **Ajustes**, toque em **Testar notificação (5 segundos)**. Verifique se chega o aviso.
6. Feche e reabra o app. Confira se os dados da vaga permanecem salvos.
7. Na tela inicial do Android, pressione e segure um espaço vazio > **Widgets** > **Onde Estacionei?** e adicione o widget.
8. Volte ao app para atualizar a informação exibida no widget.
9. Na tela **Início**, finalize o estacionamento e confira se o registro desaparece.

**Lembrete:** o aviso real de vencimento só pode ser observado ao longo do tempo escolhido. Para testá-lo, use o período de 30 minutos e confira se o Android exibe o alerta por volta de 20 minutos depois. O Android pode atrasar avisos, dependendo das permissões e otimização de bateria.

## 8. Subir para o GitHub

Crie um repositório **vazio** na sua conta, por exemplo `onde-estacionei-pamii`. No terminal do VS Code, dentro desta pasta:

```powershell
git init
git add .
git commit -m "feat: aplicativo estacionamento inteligente PAM II"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/onde-estacionei-pamii.git
git push -u origin main
```

Troque `SEU_USUARIO` pelo seu login. No primeiro `git push`, o GitHub pode pedir autenticação no navegador. **Nunca publique sua chave pessoal, a pasta `node_modules`, arquivos `.env` ou senhas.**

Se o `git commit` solicitar identificação:

```powershell
git config --global user.name "Seu Nome"
git config --global user.email "seu-email-do-github"
```

## 9. Fazer o vídeo para o professor

Consulte `ROTEIRO-VIDEO.md` para um roteiro de aproximadamente 4–6 minutos, com telas e falas. Mostre o aplicativo **realmente rodando**, não apenas imagens das telas.

## 10. Erros comuns

- **`adb` não reconhecido:** configure a variável PATH para a pasta `platform-tools` do Android SDK e reabra o terminal.
- **Nenhum Android encontrado:** conecte o celular (com USB depuração) ou inicie um emulador.
- **Mapa em branco:** revise a chave de API, permissão do Maps SDK, restrições do SHA-1 e recompile o app.
- **Widget não aparece:** confira se foi instalada uma versão de desenvolvimento nativa, não Expo Go. Recompile após mudar `app.json`.
- **Notificação não aparece:** verifique permissões de notificação, canal, modo silencioso e economia de bateria.
- **GPS não atualiza:** ative a localização do celular e permita acesso durante o uso.
- **Erro de Java/Gradle:** verifique `java -version`, `JAVA_HOME`, Android SDK e a versão de JDK recomendada pelo erro. Em caso de incompatibilidade, use JDK 17 para esta compilação.
- **Rota indisponível:** confira internet, servidor público e se existem ruas caminháveis entre os pontos. O app não inventa uma rota; mostra a direção em linha reta como alternativa.
