# Água · lembretes para o seu dia

Um app pequeno que fica na bandeja do computador e lembra você de beber água e de bater o ponto, sem depender de internet nem de conta.

Para quem tem rotina corrida: você configura os horários uma vez e esquece. Quando chega a hora, aparece um aviso em tela cheia com som. Você marca "Já bebi" ou "Já bati" e segue o dia. Nada de abrir aplicativo, criar cadastro ou sincronizar com ninguém.

## O que ele faz

- **Lembretes de água recorrentes:** você escolhe o horário de início e de fim, o intervalo (30, 45, 60, 90 ou 120 min, ou um valor livre) e os dias da semana em que quer ser lembrado.
- **Alerta em tela cheia com som:** para você não perder o aviso no meio do trabalho. Dá para marcar "Já bebi" ou adiar 10 minutos.
- **Bater o ponto:** lembretes para as marcações da empresa, com a pergunta "Você é CLT?". CLT tem mínimo de 4 batidas; sem CLT, o mínimo é 2. Você escolhe os horários, os dias e quantos minutos antes quer ser avisado.
- **Relatórios:** um calendário do mês em que cada dia fica verde (meta batida), amarelo (bebeu, mas não bateu) ou vermelho (sem registro). Dá para ver quanto bebeu, quantos copos, quantos lembretes foram atendidos e quantos passaram.
- **Funciona offline:** tudo fica salvo no seu computador.
- **Fica na bandeja do sistema:** fechar a janela não para os lembretes. Para encerrar, use **Sair** no menu do ícone.

## Baixar

Os instaladores ficam na página de releases:

- **Ubuntu (.deb):** [agua-lembrete_0.2.0_amd64.deb](https://github.com/wesurex/lembrete-agua/releases/download/v0.2.0/agua-lembrete_0.2.0_amd64.deb)
- **Windows (.exe):** [agua-setup-0.2.0.exe](https://github.com/wesurex/lembrete-agua/releases/download/v0.2.0/agua-setup-0.2.0.exe)

Todas as versões: [releases](https://github.com/wesurex/lembrete-agua/releases).

### Instalar no Ubuntu

```bash
sudo apt install ./agua-lembrete_0.2.0_amd64.deb
```

Depois, procure **Água** no menu de aplicativos.

### Instalar no Windows

Rode `agua-setup-0.2.0.exe`. Como o instalador não é assinado, o Windows pode mostrar um aviso do SmartScreen: clique em **Mais informações** e depois em **Executar mesmo assim**.

Ao instalar uma versão nova, a anterior é atualizada no lugar. Antes, feche o app pelo **Sair** na bandeja.

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

## Estrutura

- `main.js`: processo principal (bandeja, agenda, alertas e dados).
- `main.html`: janela principal, com Hoje, Relatórios e Configurações.
- `alert.html`: tela de alerta, de água ou de ponto.
- `preload.js`: ponte segura entre as telas e o processo principal.
- `mockup/`: protótipo visual em HTML, sem o Electron.

## Status

Versão 0.2.0. Ainda não tem:

- abrir automaticamente com o computador;
- som e alerta visual configuráveis na tela de Configurações;
- assinatura digital dos instaladores.
