# Roteiro de demonstração para PAM II — Estacionamento Inteligente

**Duração sugerida:** 4 a 6 minutos. Use gravação de tela do emulador/celular, com áudio ou narração. Substitua exemplos por situações realmente demonstradas, sem afirmar que testes falharam ou passaram se isso não ocorreu.

## 0:00–0:30 — Abertura

"Bom dia! Este é o projeto Estacionamento Inteligente, também chamado Onde Estacionei?, desenvolvido na disciplina de Programação de Aplicativos Móveis II, em React Native com Expo. A proposta é registrar a localização do carro e ajudar o usuário a retornar à vaga, acompanhando o prazo do estacionamento."

**Mostrar:** início do app e nome do projeto.

## 0:30–1:35 — Cadastro da vaga e GPS

"No cadastro, o usuário informa o andar, o número da vaga e uma observação. O aplicativo usa o GPS para capturar as coordenadas na hora do registro. Também é possível selecionar o período de estacionamento."

**Mostrar:** preenchimento de andar/vaga/observação e salvar. Mostrar a solicitação de permissão, se aparecer.

## 1:35–2:25 — Tela principal e armazenamento

"Depois de salvar, o aplicativo apresenta o tempo restante, uma estimativa da distância em linha reta até o veículo e as informações registradas. Os dados ficam armazenados no aparelho com AsyncStorage, mesmo após fechar o app."

**Mostrar:** home, fechar e reabrir, verificar permanência da vaga.

## 2:25–3:25 — Mapa e rota a pé

"No mapa, podemos visualizar o carro e a localização atual. O botão de cálculo consulta um serviço de rota para pedestres. Também há a opção de abrir uma navegação externa."

**Mostrar:** mapa com marcadores, rota traçada se o serviço estiver disponível, botão do Google Maps. Se não houver rota por limitação do GPS ou servidor, informe isso claramente.

## 3:25–4:25 — Lembretes, widget e sensor

"O aplicativo tenta agendar um lembrete para dez minutos antes do vencimento. Possui um widget Android com o último tempo e distância atualizados e usa o barômetro, quando disponível, para estimar a altitude. O andar também pode ser informado manualmente."

**Mostrar:** teste de notificação de 5 segundos; widget adicionado à tela inicial; tela de ajustes com altitude disponível ou indisponível. Não apresente estimativa de barômetro como medida exata.

## 4:25–5:00 — Encerramento e GitHub

"O projeto utiliza React Native, Expo, TypeScript, mapas, GPS, notificações, sensores e armazenamento local. O código-fonte está disponível no GitHub e sua execução demonstra os conceitos estudados na disciplina. Obrigado!"

**Mostrar:** pasta do projeto no VS Code e página do repositório GitHub, desde que já esteja publicado.

## Antes de gravar

- [ ] Aplicativo instalado e funcionando no Android
- [ ] Registro de vaga e reabertura do app testados
- [ ] Mapas com chave válida e permissões autorizadas
- [ ] Notificação de teste exibida
- [ ] Widget testado na home do Android
- [ ] Código publicado e link do GitHub disponível
- [ ] Gravação sem cortes no meio de uma explicação
