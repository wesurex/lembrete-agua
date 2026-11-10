# WRS Tools · lembretes para o seu dia

WRS Tools (antes chamado Água) é um app pequeno que fica na bandeja do computador e organiza o seu dia: lembra de beber água e de bater o ponto, registra suas horas, guarda seus compromissos e tarefas. Sem conta e sem depender de internet.

Para quem tem rotina corrida: você configura uma vez e esquece. Quando chega a hora, aparece um aviso com som. Você responde e segue o dia. Nada de cadastro nem sincronização com ninguém.

## O que ele faz

- **Painel do dia (tela Hoje):** você escolhe quais blocos aparecem, em que ordem e com que largura: resumo de água, meta de água, progresso, próximos compromissos, tarefas de hoje, horas de hoje, lembretes e clima.
- **Lembretes de água recorrentes:** horário de início e de fim, intervalo (30, 45, 60, 90 ou 120 min, ou um valor livre) e os dias da semana.
- **Alertas do seu jeito:** em tela cheia ou como um aviso que vibra no canto da tela sem roubar o foco. O som pode tocar uma vez ou repetir até você responder, e pode ser o bipe padrão ou um arquivo `.mp4` seu.
- **Bater o ponto:** lembretes para as marcações da empresa, com a pergunta "Você é CLT?" (CLT: mínimo de 4 batidas; sem CLT: mínimo de 2), dias próprios e aviso com antecedência.
- **Horas (check-in e check-out):** cronômetro do dia, totais do dia, da semana e do mês, lançamento manual para quando esquecer de marcar e exportação do mês em CSV, que abre no Excel e no Google Sheets. Útil para contratos PJ por hora.
- **Agenda:** compromissos com aviso na hora ou de 5 min a 1 h antes.
- **Tarefas:** diárias, que desmarcam sozinhas a cada dia, ou pontuais, com prazo e destaque das atrasadas.
- **Relatórios:** calendário do mês em tons pastel. Verde é meta batida, amarelo é bebeu mas não bateu, vermelho é sem registro.
- **Clima (opcional):** temperatura e previsão da sua cidade no topo da tela Hoje, com aviso de dia quente para beber mais água.
- **Tema claro e escuro:** ou automático, seguindo o sistema.
- **Três idiomas:** português (padrão), inglês e espanhol.
- **Configurações salvas na hora:** sem botão de salvar.
- **Fica na bandeja do sistema:** fechar a janela não para os lembretes. Para encerrar, use **Sair** no menu do ícone. O check-in e o check-out também ficam nesse menu.

### Privacidade

Tudo fica salvo no seu computador. A única parte que usa internet é o clima, e só se você ligar: a previsão vem da [Open-Meteo](https://open-meteo.com). O botão "Detectar pela internet" estima a cidade pelo seu IP, usando o ipapi.co, e só funciona quando você clica. O app também verifica se há versão nova no GitHub.

## Baixar

Os instaladores ficam na página de releases:

- **Ubuntu (.deb):** [agua-lembrete_0.6.0_amd64.deb](https://github.com/wesurex/lembrete-agua/releases/download/v0.6.0/agua-lembrete_0.6.0_amd64.deb)
- **Windows (.exe):** [agua-setup-0.6.0.exe](https://github.com/wesurex/lembrete-agua/releases/download/v0.6.0/agua-setup-0.6.0.exe)

Todas as versões: [releases](https://github.com/wesurex/lembrete-agua/releases).

### Instalar no Ubuntu

```bash
sudo apt install ./agua-lembrete_0.6.0_amd64.deb
```

Depois, procure **WRS Tools** no menu de aplicativos.

### Instalar no Windows

Rode `agua-setup-0.6.0.exe`. Como o instalador não é assinado, o Windows pode mostrar um aviso do SmartScreen: clique em **Mais informações** e depois em **Executar mesmo assim**.

Ao instalar uma versão nova, a anterior é atualizada no lugar. Antes, feche o app pelo **Sair** na bandeja. A partir da 0.3.0, o Windows atualiza sozinho.

## Rodar a partir do código

Você precisa de Node.js e npm.

```bash
npm install
npm start
```

Para gerar os instaladores (`.deb` e `.exe`), rode:

```bash
npm run dist
```

Os arquivos saem em `dist/`. Gerar o `.exe` no Ubuntu precisa do wine (`sudo apt install wine64`).

Para rodar as checagens da lógica:

```bash
node timesheet.js
node planner.js
```

## Estrutura

- `main.js`: processo principal (bandeja, agenda dos lembretes, alertas, dados, clima e atualização).
- `main.html`: janela principal (Hoje, Horas, Agenda, Tarefas, Relatórios e Configurações).
- `alert.html`: tela de alerta (água, ponto ou compromisso), em tela cheia ou no canto.
- `preload.js`: ponte segura entre as telas e o processo principal.
- `i18n.js`: textos em português, inglês e espanhol.
- `timesheet.js`: registro de horas e exportação CSV.
- `planner.js`: agenda e tarefas.
- `mockup/`: protótipo visual em HTML, sem o Electron.

## Licença e assinatura

Código sob a [licença MIT](LICENSE).

Free code signing provided by SignPath.io, certificate by SignPath Foundation

A política de assinatura está em [CODE_SIGNING_POLICY.md](CODE_SIGNING_POLICY.md).

## Status

Versão 0.6.0.

Novidade desta versão: o app passa a se chamar WRS Tools na janela, na bandeja, nos atalhos e na lista de programas instalados. Os arquivos de instalação e o nome interno continuam com "agua", para a atualização funcionar por cima da versão anterior sem perder dados.

Incluído na 0.5.0:
- painel do dia configurável;
- horas com check-in e check-out e exportação CSV;
- agenda de compromissos;
- tarefas diárias e pontuais;
- alerta vibrando no canto e som contínuo;
- configurações salvas na hora;
- tema claro e escuro;
- clima pela localização;
- layout centralizado.

Ainda não tem:

- assinatura digital dos instaladores (por isso o aviso do SmartScreen no Windows);
- atualização automática no Ubuntu: lá é preciso instalar o novo `.deb` manualmente.
