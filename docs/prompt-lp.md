# Briefing: landing page do WRS Tools

Este arquivo é o pedido completo para construir a landing page do WRS Tools. Ele traz o contexto do produto, o conceito da página, a direção de design, o texto de cada seção, as imagens disponíveis e os requisitos técnicos. Junto com ele você recebe uma imagem de referência de design (a landing page "Wingly") e a pasta `docs/screenshots/` com as capturas do app.

## 1. O que construir

Um site estático de divulgação e download do WRS Tools, com:

- uma **página inicial** que apresenta o app e leva ao download;
- uma **página de download** para Windows e Ubuntu;
- um bloco **"em breve no celular"**, nas duas páginas;
- tudo em **três idiomas**: português (padrão), inglês e espanhol;
- hospedagem na **Vercel**.

O objetivo da página é um só: a pessoa entender em poucos segundos o que o app faz por ela e baixar.

## 2. O produto

WRS Tools é um app gratuito e de código aberto para Windows e Ubuntu. Ele fica na bandeja do sistema e cuida da rotina de quem trabalha no computador. A pessoa configura uma vez, e o app avisa na hora certa. Cada aviso se resolve com um clique.

O que ele faz:

- **Lembretes de água:** avisos no intervalo que a pessoa escolher, dentro do horário e dos dias de trabalho dela, com meta diária. A resposta ao aviso ("Já bebi") registra um copo.
- **Relatórios de água:** calendário do mês com cada dia em verde (meta batida), amarelo (bebeu, mas não bateu) ou vermelho (sem registro).
- **Lembrete de ponto:** avisos antes de cada marcação do dia (entrada, saída para o almoço, volta e saída), para quem precisa registrar a jornada.
- **Horas:** check-in e check-out com um clique, totais do dia, da semana e do mês, e exportação do mês em planilha CSV, que abre no Excel e no Google Sheets.
- **Agenda:** compromissos com aviso na hora ou de 5 minutos a 1 hora antes.
- **Tarefas:** diárias, que desmarcam sozinhas a cada novo dia, e pontuais, com prazo e destaque das atrasadas.
- **Painel do dia:** uma tela inicial que a pessoa monta escolhendo quais blocos aparecem, em que ordem e de que tamanho.
- **Alertas configuráveis:** em tela cheia ou como um aviso que vibra no canto da tela sem tirar o foco de quem está digitando. O som pode tocar uma vez ou repetir até a pessoa responder, e pode ser um arquivo dela.
- **Clima (opcional):** temperatura da cidade no topo do painel, com aviso para beber mais água em dia quente.
- **Tema claro e escuro, e três idiomas** (português, inglês e espanhol).
- **Privacidade:** não tem conta nem cadastro, funciona sem internet e guarda tudo no computador da pessoa. Só o clima usa internet, e é opcional.

Para quem é: quem trabalha no computador, **no escritório ou em home office**.

Dados do projeto:

- Nome: **WRS Tools**
- Versão atual: 0.6.0 (a página deve ler a versão atual sozinha, veja a seção 11)
- Repositório: https://github.com/wesurex/lembrete-agua
- Licença: MIT
- Preço: totalmente gratuito

## 3. Conceito da página

A ideia central é: **mais produtividade e mais bem-estar para quem trabalha no computador.**

Quem passa o dia inteiro na frente da tela costuma abrir mão de uma das duas coisas. Ou cuida do trabalho e esquece de si (não bebe água, emenda uma reunião na outra, não percebe que o expediente acabou), ou perde o controle do trabalho (esquece o ponto, não sabe quantas horas fez, deixa uma tarefa passar). O WRS Tools cuida das duas frentes ao mesmo tempo, sem pedir atenção: ele fica quieto na bandeja e só aparece quando é hora.

A página organiza os recursos em dois pilares:

| Pilar | Promessa | Recursos |
|---|---|---|
| **Bem-estar** | "Cuide de você enquanto trabalha." | Lembretes de água, meta diária e calendário do mês; aviso de dia quente; tarefas diárias para hábitos como alongar; check-out para marcar o fim do expediente. |
| **Produtividade** | "Feche o dia sem esquecer de nada." | Lembrete de ponto; horas e planilha do mês; agenda com avisos; tarefas com prazo; painel do dia. |

**Tom:** leve, próximo e direto, como o da referência. Frases curtas. Fala com "você". Sem jargão e sem exagero.

**Cuidado com promessas de saúde:** o app ajuda a criar o hábito de beber água e a organizar o dia. A página não deve afirmar que ele melhora a saúde, previne doenças ou aumenta a produtividade em algum número.

## 4. Direção de design

### A referência

A imagem anexa é a landing page de um app financeiro chamado Wingly. Use-a como referência de **estilo**, não de conteúdo. O que ela tem:

- **Fundo de céu:** um degradê que começa em azul mais fechado no topo, clareia no meio e termina em verde-lima na base. Nuvens fotográficas e macias aparecem nas bordas.
- **Título gigante:** em caixa alta, numa fonte condensada e pesada, na cor lima, centralizado em duas linhas.
- **Figura central em camadas:** uma pessoa sentada numa nuvem fica na frente do título e cobre parte das letras. Isso dá profundidade.
- **Rabiscos:** pequenos desenhos à mão, brancos com contorno preto (asas, nuvenzinhas, um passarinho), espalhados pela cena.
- **Cartões flutuantes:** cartões escuros de cantos bem arredondados, com texto branco e detalhes em lima, que mostram pedaços da interface do produto. Ficam soltos sobre o céu, à esquerda embaixo e à direita em cima.
- **Navegação:** logo à esquerda, links brancos pequenos no centro e um botão em pílula com contorno à direita.
- **Botão principal:** uma pílula lima com texto escuro e um círculo escuro com uma seta.
- **Segunda dobra:** o fundo vira lima e entra um título grande, escuro e centralizado.
- **Sensação geral:** leveza, céu aberto, otimismo.

### Como adaptar ao WRS Tools

O tema do céu combina com o produto: água, nuvens, leveza, um dia que flui.

- **Mantenha** o degradê de céu para lima, o título condensado em lima, a composição em camadas, os cartões flutuantes escuros, os botões em pílula e os rabiscos.
- **Figura central:** no lugar da pessoa, use a janela do app (a captura `01-hoje.png`, recortada na parte de cima) dentro de uma moldura de cantos arredondados, levemente inclinada, apoiada numa nuvem grande. Ela deve cobrir a base do título, como a pessoa da referência.
- **Cartões flutuantes:** construa em HTML e CSS, com conteúdo real do app. Sugestão:
  - à direita em cima, **o aviso de água vibrando** (seção 7). É a peça mais importante da cena;
  - à esquerda embaixo, "Tarefas de hoje · 2 de 4 feitas", com duas tarefas marcadas;
  - logo acima ou abaixo dele, "Horas de hoje · 5h37 · Trabalhando desde 13:05".
- **Rabiscos:** gotas d'água, nuvenzinhas, um relógio e um sinal de "feito", brancos com contorno escuro, desenhados em SVG.
- **Nuvens:** em SVG ou CSS, ou imagens de uso livre. Se usar imagens, guarde os arquivos no projeto.
- **Não use foto de pessoa**, a menos que quem pediu a página forneça uma.
- **Não copie nada da Wingly:** nem o logo, nem os textos, nem a foto, nem as ilustrações. A referência é só de estilo.

### Cores

| Uso | Cor | Observação |
|---|---|---|
| Céu, topo | `#1B66B0` | Fundo da navegação e do começo do título |
| Céu, meio | `#4A9FE3` | |
| Lima | `#D8F55A` | Título do topo, botão principal, fundo da segunda dobra |
| Lima claro | `#EAFB9F` | Fundos suaves |
| Azul-marinho | `#0F2A3D` | Cartões flutuantes, texto sobre lima, seção de privacidade. É a cor escura do app |
| Água | `#38C4EA` | Detalhes, bordas do aviso, ícone de gota. É a cor da água no app |
| Azul de ação | `#167AA6` | Botões secundários e links |
| Texto suave | `#5B7283` | Texto de apoio sobre fundo claro |
| Branco | `#FFFFFF` | Texto sobre o céu e cartões claros |

As capturas do app trazem a paleta própria dele (azul-água, coral, amarelo, menta e violeta em tons pastel). Não é preciso repetir essas cores na página.

Confira o contraste de todo texto: branco só sobre a parte mais escura do céu, e azul-marinho sobre o lima e sobre o azul claro. O mínimo é 4,5:1 para texto comum.

### Tipografia

- **Título de destaque:** uma fonte condensada, pesada, em caixa alta, como a da referência. Sugestão: Anton.
- **Texto e interface:** uma sem serifa limpa. Sugestão: Inter ou Manrope.
- Hospede as fontes no próprio site, sem chamar serviços de terceiros.

### Componentes

- **Botão principal:** pílula lima, texto azul-marinho em negrito, com um círculo azul-marinho e uma seta dentro, à direita.
- **Botão secundário:** pílula com contorno branco (sobre o céu) ou azul-marinho (sobre fundo claro).
- **Cartão flutuante:** fundo azul-marinho, cantos de 24 px, texto branco, detalhes em lima, sombra suave.
- **Cartão de conteúdo:** fundo branco, cantos de 24 px, borda fina.
- **Marca:** uma gota d'água ao lado do nome "WRS Tools". A gota do app é este desenho, num quadro de 24 por 24: `M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z`. O ícone do app está em `build/icon.png`.

### Movimento

- Cartões flutuantes e nuvens sobem e descem devagar, em ritmos diferentes.
- O aviso de água vibra em rajadas, como no app (seção 7).
- As seções aparecem com uma transição curta quando entram na tela.
- Com a preferência de movimento reduzido do sistema ligada, nada se mexe.

## 5. Mapa do site e idiomas

| Página | Português | Inglês | Espanhol |
|---|---|---|---|
| Inicial | `/` | `/en/` | `/es/` |
| Download | `/download/` | `/en/download/` | `/es/download/` |

Regras:

- Cada idioma é uma página própria, não uma troca de texto feita só no navegador. Isso é necessário para os buscadores.
- O topo tem um seletor de idioma (PT, EN, ES) que leva à mesma página no outro idioma.
- Na primeira visita à página inicial em português, se o navegador da pessoa estiver em inglês ou espanhol, ofereça a troca num aviso discreto. Não redirecione sem ela pedir.
- Cada página declara o próprio idioma e aponta para as versões nos outros dois (`hreflang`).
- Em cada idioma, use as capturas daquele idioma (seção 10).

### Vocabulário

Use os mesmos termos que o app usa:

| Português | Inglês | Espanhol |
|---|---|---|
| Hoje | Today | Hoy |
| Horas | Hours | Horas |
| Agenda | Calendar | Agenda |
| Tarefas | Tasks | Tareas |
| Relatórios | Reports | Informes |
| Configurações | Settings | Ajustes |
| bandeja do sistema | system tray | bandeja del sistema |
| lembrete | reminder | recordatorio |
| bater o ponto | clock in / clock out | fichar |
| check-in e check-out | check in and check out | entrada y salida |
| Já bebi | I drank it | Ya bebí |
| Adiar 10 min | Snooze 10 min | Posponer 10 min |

O lembrete de ponto nasceu de uma regra brasileira (a CLT). Em português, a página pode citar "quem é CLT". Em inglês e espanhol, fale só em lembretes para registrar a jornada.

### Textos principais nos três idiomas

Os textos das seções 6, 8 e 9 estão em português. Traduza o restante seguindo o vocabulário acima e o mesmo tom. Estes já estão definidos:

| Texto | Português | Inglês | Espanhol |
|---|---|---|---|
| Título do topo | SEU DIA EM ORDEM | YOUR DAY IN ORDER | TU DÍA EN ORDEN |
| Apoio do topo | Produtividade e bem-estar para quem trabalha no computador. O WRS Tools lembra você de beber água, bater o ponto e não perder a reunião. | Productivity and well-being for people who work at a computer. WRS Tools reminds you to drink water, clock in and never miss the meeting. | Productividad y bienestar para quien trabaja en la computadora. WRS Tools te recuerda beber agua, fichar y no perder la reunión. |
| Botão principal | Baixar grátis | Download free | Descargar gratis |
| Linha abaixo do botão | Windows e Ubuntu · open source · sem conta | Windows and Ubuntu · open source · no account | Windows y Ubuntu · código abierto · sin cuenta |
| Título da segunda dobra | Mais foco no trabalho. Mais cuidado com você. | More focus at work. More care for yourself. | Más foco en el trabajo. Más cuidado contigo. |
| Pilar 1 | Bem-estar | Well-being | Bienestar |
| Pilar 2 | Produtividade | Productivity | Productividad |
| Navegação | Como funciona · Recursos · Privacidade · Baixar | How it works · Features · Privacy · Download | Cómo funciona · Funciones · Privacidad · Descargar |
| Botões de download | Baixar para Windows · Baixar para Ubuntu | Download for Windows · Download for Ubuntu | Descargar para Windows · Descargar para Ubuntu |
| Em breve | Em breve no celular | Coming soon to mobile | Próximamente en el móvil |

## 6. Página inicial, seção por seção

### 6.1 Navegação

Logo à esquerda (gota e "WRS Tools"). No centro: Como funciona, Recursos, Privacidade. À direita: seletor de idioma e botão em pílula com contorno "Baixar", que leva à página de download. No celular, os links viram um menu.

### 6.2 Topo

- **Título:** "SEU DIA EM ORDEM", em duas linhas, na fonte condensada, em lima.
- **Apoio:** "Produtividade e bem-estar para quem trabalha no computador. O WRS Tools lembra você de beber água, bater o ponto e não perder a reunião."
- **Botão principal:** "Baixar grátis", que leva à página de download.
- **Linha abaixo do botão:** "Windows e Ubuntu · open source · sem conta"
- **Cena:** a janela do app sobre a nuvem, os cartões flutuantes e os rabiscos, como descrito na seção 4.

### 6.3 Segunda dobra: os dois pilares

Fundo lima.

- **Título:** "Mais foco no trabalho. Mais cuidado com você."
- **Texto:** "Quem trabalha o dia inteiro no computador acaba escolhendo: ou cuida do trabalho, ou cuida de si. O WRS Tools cuida das duas coisas, sem pedir a sua atenção."
- **Dois cartões lado a lado:**
  - **Bem-estar.** "Beba água na hora certa, acompanhe a sua meta e saiba quando o expediente acabou."
  - **Produtividade.** "Ponto, horas, compromissos e tarefas num lugar só. Você fecha o dia sem esquecer de nada."

### 6.4 Como funciona

- **Título:** "Configure uma vez. Depois ele lembra por você."
- **Três passos:**
  1. **Defina a sua rotina.** "Horário de trabalho, intervalo dos lembretes, meta de água e dias da semana."
  2. **Continue trabalhando.** "O WRS Tools fica na bandeja do sistema, sem janela aberta e sem atrapalhar."
  3. **Responda com um clique.** "O aviso aparece na hora certa. Você clica e volta ao que estava fazendo."
- **Imagem:** um recorte de `06-configuracoes.png` na parte de horário e intervalo, ao lado do aviso vibrando (seção 7).

### 6.5 Bem-estar

Fundo claro. Um subtítulo pequeno "Bem-estar" acima do título.

- **Título:** "Cuide de você enquanto trabalha."
- **Blocos, com imagem de um lado e texto do outro, alternando:**
  - **Água na hora certa.** "Você escolhe o intervalo e a meta do dia. O aviso aparece, você bebe e clica em 'Já bebi'." Imagem: o aviso vibrando (seção 7), não uma captura.
  - **Veja o seu mês.** "Um calendário mostra os dias em que você bateu a meta, os dias em que bebeu menos e os dias sem registro." Imagem: `05-relatorios.png`.
  - **Dia quente? Ele avisa.** "Com o clima ligado, o app mostra a temperatura da sua cidade e lembra de beber mais água quando o dia esquenta." Imagem: `09-recorte-topo-clima.png`.
  - **Hábitos que recomeçam todo dia.** "Crie tarefas diárias para o que você quer manter, como alongar ou fazer uma pausa. Elas desmarcam sozinhas no dia seguinte." Imagem: `04-tarefas.png`.
  - **Saiba a hora de parar.** "Faça o check-out no fim do expediente e veja quantas horas trabalhou. Em home office, isso ajuda a separar o trabalho da casa." Imagem: `10-recorte-check-in.png`.

### 6.6 Produtividade

Mesmo formato, com o subtítulo "Produtividade".

- **Título:** "Feche o dia sem esquecer de nada."
- **Blocos:**
  - **Nunca mais esqueça o ponto.** "Avisos antes de cada marcação: entrada, saída para o almoço, volta e saída." Imagem: `32-alerta-ponto-canto.png`.
  - **Suas horas, prontas para a planilha.** "Check-in e check-out com um clique. No fim do mês, exporte tudo para o Excel ou o Google Sheets." Imagem: `02-horas.png`.
  - **Compromissos com aviso.** "Cadastre a reunião e escolha quanto tempo antes quer ser avisado." Imagens: `03-agenda.png` e `33-alerta-compromisso-canto.png`.
  - **Tarefas com prazo.** "As pendências ficam em ordem de prazo, e as atrasadas aparecem em destaque." Imagem: `04-tarefas.png`.
  - **Um painel montado por você.** "Escolha o que aparece na tela inicial, em que ordem e de que tamanho." Imagens: `01-hoje.png` e `07-recorte-tela-inicial.png`.

### 6.7 Alertas do seu jeito

- **Título:** "Um aviso que você não ignora, ou um que não atrapalha."
- **Texto:** "Escolha entre o alerta em tela cheia e um aviso discreto que vibra no canto da tela. O som pode tocar uma vez ou repetir até você responder, e pode ser um som seu."
- **Imagens:** `30-alerta-agua-tela-cheia.png` e `31-alerta-agua-canto.png`, lado a lado.

### 6.8 Privacidade

Fundo azul-marinho, texto branco.

- **Título:** "Seus dados não saem do seu computador."
- **Três itens:**
  - **Sem conta.** "Você instala e usa. Não há cadastro."
  - **Sem internet.** "Tudo funciona offline. Só o clima usa a rede, e ele é opcional."
  - **Código aberto.** "O projeto é público, e qualquer pessoa pode conferir como ele funciona."
- **Link:** "Ver o código no GitHub", para o repositório.

### 6.9 Claro, escuro e no seu idioma

- **Título:** "Claro ou escuro. Em português, inglês ou espanhol."
- **Imagens:** `01-hoje.png` e `11-hoje-escuro.png`, lado a lado ou com um controle deslizante que revela um sobre o outro.

### 6.10 Para quem é

- **Título:** "Feito para quem trabalha no computador."
- **Três cartões:**
  - **No escritório.** "Lembrete de ponto, avisos de reunião e água entre uma tarefa e outra."
  - **Em home office.** "Check-in e check-out para separar o trabalho da casa, hábitos diários e os lembretes de água que ninguém ao lado vai dar."
  - **Por conta própria.** "Para PJ e freelancer: o registro das horas e a planilha do mês para enviar ao cliente."

### 6.11 Em breve no celular

Veja a seção 9.

### 6.12 Perguntas frequentes

Em formato de lista que abre e fecha.

- **É gratuito?** "Sim. O WRS Tools é um projeto open source e totalmente gratuito."
- **Precisa de internet ou de conta?** "Não. Só o clima usa internet, e ele é opcional."
- **O Windows mostrou um aviso ao instalar. É seguro?** "O aviso aparece porque o instalador ainda não tem assinatura digital. Clique em 'Mais informações' e depois em 'Executar mesmo assim'. O código é aberto e pode ser conferido no GitHub."
- **Funciona no Mac?** "Ainda não. Hoje há versões para Windows e Ubuntu."
- **E no celular?** "Os apps para celular estão a caminho."
- **Onde ficam os meus dados?** "Em arquivos no seu próprio computador."
- **O lembrete de ponto registra o ponto na empresa?** "Não. Ele só lembra você de bater o ponto no sistema da sua empresa."
- **Como atualizo?** "No Windows, o app se atualiza sozinho. No Ubuntu, baixe e instale a versão nova."

### 6.13 Chamada final e rodapé

- **Título:** "Comece hoje. Leva um minuto para configurar."
- **Botão principal:** "Baixar grátis".
- **Rodapé:** marca, links para o GitHub e para a página de download, "Código aberto sob licença MIT", o número da versão atual e o seletor de idioma.

## 7. O aviso vibrando

Esta é a peça que mais mostra o que o app faz: o aviso que aparece no canto da tela e vibra até a pessoa responder. Use-o como ilustração animada, feito em HTML e CSS, no topo e no bloco "Água na hora certa". O código abaixo saiu do próprio app e tem a mesma vibração dele. Há uma página de demonstração em `docs/alerta-vibrando.html`.

Os "botões" são `<span>` de propósito. O aviso é uma ilustração, e botões de verdade sem função atrapalhariam quem navega pelo teclado.

```html
<div class="wrs-alert" role="img" aria-label="Exemplo do aviso do WRS Tools: Hora de beber água, com os botões Já bebi e Adiar 10 min">
  <svg viewBox="0 0 120 170" aria-hidden="true">
    <defs><clipPath id="wrs-bottle"><path d="M46 10h28v18l14 22v98a8 8 0 0 1-8 8H40a8 8 0 0 1-8-8V50l14-22z"/></clipPath></defs>
    <g clip-path="url(#wrs-bottle)"><rect x="0" y="72" width="120" height="110" fill="#bfeaf8"/>
      <path d="M-30 72q15-8 30 0t30 0t30 0t30 0t30 0t30 0V170H-30z" fill="#38c4ea"/></g>
    <path d="M46 10h28v18l14 22v98a8 8 0 0 1-8 8H40a8 8 0 0 1-8-8V50l14-22z" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linejoin="round"/>
    <path d="M52 4h16" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
  </svg>
  <strong>Hora de beber água</strong>
  <p>Um copo agora ajuda a manter a meta do dia.</p>
  <div class="wrs-row" aria-hidden="true">
    <span class="wrs-btn primary">Já bebi</span>
    <span class="wrs-btn">Adiar 10 min</span>
  </div>
</div>
```

```css
.wrs-alert{width:380px;max-width:100%;box-sizing:border-box;background:#fff;color:#0f2a3d;border:2px solid #38c4ea;border-radius:18px;
           box-shadow:0 10px 28px rgba(15,42,61,.18);padding:18px 20px;display:flex;flex-direction:column;align-items:center;gap:4px;
           text-align:center;animation:wrs-shake 1.6s ease-in-out infinite}
.wrs-alert svg{width:44px;height:62px}
.wrs-alert strong{font-size:22px;font-weight:800;letter-spacing:-.03em;margin-top:2px}
.wrs-alert p{margin:0;font-size:14px;color:#5b7283}
.wrs-alert .wrs-row{display:flex;gap:8px;margin-top:10px}
.wrs-alert .wrs-btn{font-size:14px;font-weight:600;padding:9px 16px;border-radius:99px;border:1px solid #cfe3ea;background:#fff;color:#0f2a3d}
.wrs-alert .wrs-btn.primary{background:#167aa6;border-color:#167aa6;color:#fff}

/* uma rajada de vibração no começo de cada ciclo, depois uma pausa */
@keyframes wrs-shake{
  0%,42%,100%{transform:translateX(0) rotate(0)}
  6%{transform:translateX(-7px) rotate(-1.5deg)}
  12%{transform:translateX(7px) rotate(1.5deg)}
  18%{transform:translateX(-6px) rotate(-1deg)}
  24%{transform:translateX(6px) rotate(1deg)}
  30%{transform:translateX(-3px)}
  36%{transform:translateX(3px)}
}
@media (prefers-reduced-motion:reduce){ .wrs-alert{animation:none} }
```

Textos do aviso nos outros idiomas:

| | Inglês | Espanhol |
|---|---|---|
| Título | Time to drink water | Hora de beber agua |
| Apoio | A glass now keeps you on track for today's goal. | Un vaso ahora te ayuda a cumplir la meta del día. |
| Botões | I drank it · Snooze 10 min | Ya bebí · Posponer 10 min |

Se o aviso ficar sobre outro elemento que também flutua, aplique a flutuação num elemento de fora e deixe a vibração neste, para as duas animações não disputarem o mesmo `transform`.

## 8. Página de download

Mesmo visual da página inicial, com o céu no topo e um título menor.

- **Título:** "Baixe o WRS Tools"
- **Apoio:** "Gratuito, de código aberto e sem cadastro. Versão {versão atual}."
- **Detecção do sistema:** a página descobre o sistema da pessoa e destaca o cartão certo. Os dois cartões aparecem sempre. Se a pessoa estiver num Mac ou num celular, mostre os dois cartões sem destaque e um aviso: "Ainda não há versão para o seu sistema. Hoje o WRS Tools funciona no Windows e no Ubuntu."

**Cartão do Windows**

- Botão: "Baixar para Windows"
- Abaixo do botão: nome do arquivo, tamanho e "Windows 10 ou 11, 64 bits".
- Como instalar:
  1. "Abra o arquivo baixado."
  2. "Se o Windows mostrar um aviso azul, clique em 'Mais informações' e depois em 'Executar mesmo assim'. O aviso aparece porque o instalador ainda não tem assinatura digital."
  3. "Pronto. O WRS Tools abre e fica na bandeja do sistema, perto do relógio."
- Nota: "As próximas versões chegam sozinhas."

**Cartão do Ubuntu**

- Botão: "Baixar para Ubuntu"
- Abaixo do botão: nome do arquivo, tamanho e "Ubuntu de 64 bits, testado no 24.04".
- Como instalar:
  1. "Abra o terminal na pasta onde o arquivo foi baixado."
  2. "Rode o comando abaixo." Mostre o comando com o nome do arquivo atual e um botão de copiar: `sudo apt install ./agua-lembrete_{versão}_amd64.deb`
  3. "Procure WRS Tools no menu de aplicativos."
- Nota: "Para atualizar, baixe a versão nova e instale por cima."

**Depois dos cartões**

- O bloco "Em breve no celular" (seção 9).
- Um link "Ver todas as versões", para https://github.com/wesurex/lembrete-agua/releases
- Um link "Ver o código no GitHub".

Os arquivos de instalação têm "agua" no nome (`agua-setup-0.6.0.exe` e `agua-lembrete_0.6.0_amd64.deb`). Isso é esperado: é o nome interno do projeto.

## 9. Em breve no celular

Um bloco na página inicial e outro na página de download.

- **Selo:** "Em breve"
- **Título:** "WRS Tools no celular"
- **Texto:** "Os apps para Android e iOS estão a caminho. Por enquanto, o WRS Tools funciona no Windows e no Ubuntu."
- **Visual:** a silhueta de um celular com uma tela do app dentro (pode ser o aviso de água), e dois selos, "Android" e "iOS", com aparência de desativados e a marca "Em breve".

Regras deste bloco:

- Os selos não são links e não levam a loja nenhuma.
- Não use os logotipos oficiais das lojas de aplicativos.
- Não informe data nem prazo.
- Não peça e-mail nem ofereça lista de espera.

## 10. Imagens disponíveis

As capturas estão na pasta `docs/screenshots/` do repositório. Há um conjunto por idioma, com os mesmos nomes de arquivo:

- português: `docs/screenshots/`
- inglês: `docs/screenshots/en/`
- espanhol: `docs/screenshots/es/`

Se você não tiver acesso a esses arquivos, peça para a pessoa enviá-los. Não substitua por imagens inventadas.

| Arquivo | O que mostra |
|---|---|
| `01-hoje.png` | Painel do dia completo, tema claro |
| `02-horas.png` | Horas: check-in em andamento, totais, tabela do mês e lançamento manual |
| `03-agenda.png` | Agenda: novo compromisso, próximos e anteriores |
| `04-tarefas.png` | Tarefas diárias e pontuais, com uma atrasada |
| `05-relatorios.png` | Calendário do mês com um dia selecionado |
| `06-configuracoes.png` | Todas as configurações |
| `07-recorte-tela-inicial.png` | Recorte: escolha e ordem dos blocos do painel |
| `08-recorte-clima-config.png` | Recorte: configuração do clima |
| `09-recorte-topo-clima.png` | Recorte: topo do painel com o clima |
| `10-recorte-check-in.png` | Recorte: cartão de check-in em andamento |
| `11-hoje-escuro.png` | Painel do dia, tema escuro |
| `12-horas-escuro.png` | Horas, tema escuro |
| `13-tarefas-escuro.png` | Tarefas, tema escuro |
| `14-relatorios-escuro.png` | Relatórios, tema escuro |
| `15-alerta-agua-canto-escuro.png` | Aviso de água no canto, tema escuro |
| `30-alerta-agua-tela-cheia.png` | Alerta de água em tela cheia |
| `31-alerta-agua-canto.png` | Aviso de água no canto |
| `32-alerta-ponto-canto.png` | Aviso de ponto no canto |
| `33-alerta-compromisso-canto.png` | Aviso de compromisso no canto |
| `34-alerta-compromisso-tela-cheia.png` | Alerta de compromisso em tela cheia |

Só o conjunto em português tem também `20-hoje-ingles.png` e `21-hoje-espanhol.png`, que mostram o painel nos outros idiomas.

Como usar:

- As telas cheias têm 2560 px de largura e algumas são bem altas. Recorte o trecho que interessa em cada seção, em vez de mostrar a página inteira reduzida.
- Converta para WebP ou AVIF e gere tamanhos menores para o celular. Os PNG originais têm de 0,1 a 1,1 MB cada.
- Carregue sob demanda as imagens que ficam abaixo da primeira tela.
- Mostre as capturas dentro de uma moldura de cantos arredondados com sombra suave.
- Escreva um texto alternativo para cada imagem, dizendo o que ela mostra.

## 11. Links de download sempre atuais

O nome dos instaladores muda a cada versão. Para os botões nunca apontarem para um arquivo antigo, a página busca a versão mais recente no GitHub quando carrega:

```js
// Preenche os botões de download com a versão mais recente publicada no GitHub.
// Sem JavaScript ou sem resposta, os botões continuam levando à página de versões.
const FALLBACK = 'https://github.com/wesurex/lembrete-agua/releases/latest';

async function loadLatestRelease() {
  const res = await fetch('https://api.github.com/repos/wesurex/lembrete-agua/releases/latest');
  if (!res.ok) throw new Error('GitHub respondeu ' + res.status);
  const release = await res.json();
  const find = ext => release.assets.find(a => a.name.endsWith(ext));
  const exe = find('.exe');   // agua-setup-<versão>.exe (o arquivo .exe.blockmap não termina em .exe)
  const deb = find('.deb');   // agua-lembrete_<versão>_amd64.deb
  return {
    version: release.tag_name.replace(/^v/, ''),
    windows: exe && { url: exe.browser_download_url, name: exe.name, bytes: exe.size },
    ubuntu: deb && { url: deb.browser_download_url, name: deb.name, bytes: deb.size }
  };
}
```

Regras:

- No HTML, todo botão de download já sai apontando para o endereço de reserva (`FALLBACK`). O script só troca o endereço quando a busca dá certo.
- A versão, o nome do arquivo, o tamanho e o comando do Ubuntu são preenchidos com os dados da busca. Enquanto ela não responde, mostre o texto sem esses dados, e não um número fixo que pode estar velho.
- Mostre o tamanho em MB, com uma casa decimal.
- Para detectar o sistema, use `navigator.userAgentData?.platform` quando existir e `navigator.userAgent` como reserva. "Linux" com "Android" no texto é celular, não Ubuntu.

## 12. Requisitos técnicos

- **Site estático.** Não há servidor, banco de dados nem formulário. A tecnologia é livre (HTML puro, Astro ou Next.js com exportação estática), desde que o resultado seja estático e as páginas de cada idioma sejam geradas de um modelo só, sem copiar e colar o HTML seis vezes.
- **Onde fica.** Numa pasta `site/` na raiz do repositório. A Vercel é configurada com essa pasta como raiz do projeto. Inclua um `README.md` curto na pasta, dizendo como rodar e como publicar.
- **Responsivo.** Deve funcionar bem de 360 px de largura até telas grandes. No celular, a cena do topo se simplifica: a janela do app e um ou dois cartões flutuantes, sem cortar texto.
- **Acessibilidade.** Um `h1` por página e títulos em ordem; contraste mínimo de 4,5:1; foco visível em tudo que é clicável; navegação completa pelo teclado; texto alternativo nas imagens; respeito à preferência de movimento reduzido.
- **Desempenho.** A primeira tela deve carregar rápido numa conexão de celular. Imagens otimizadas, fontes hospedadas no próprio site e pouco JavaScript.
- **Privacidade.** A página promete privacidade, então ela mesma não pode rastrear ninguém. Não inclua ferramentas de métricas, pixels, cookies nem fontes e scripts de terceiros. A única chamada externa é a busca da versão no GitHub.
- **Buscadores e compartilhamento.** Título e descrição próprios em cada idioma, `hreflang` entre as versões, imagem de compartilhamento feita a partir de `01-hoje.png` e ícone do site feito a partir de `build/icon.png`.

Sugestão de título e descrição da página inicial em português:

- Título: "WRS Tools: produtividade e bem-estar para quem trabalha no computador"
- Descrição: "App gratuito e de código aberto para Windows e Ubuntu. Lembretes de água e de ponto, controle de horas, agenda e tarefas. Sem conta e sem internet."

## 13. O que a página não pode dizer

- **Não prometa versão para Mac.** Ela não existe.
- **Celular é só "em breve".** Sem data, sem link de loja e sem lista de espera.
- **Não prometa efeitos de saúde nem números de produtividade.** O app ajuda a criar hábitos e a organizar o dia.
- **Não invente depoimentos, notas, número de usuários ou de downloads.** Eles não existem.
- **Não chame o app de "leve".** O instalador tem cerca de 120 MB.
- **Não diga que o Windows instala sem aviso.** O aviso do SmartScreen aparece, e a página explica como passar por ele.
- **Não diga que o Ubuntu se atualiza sozinho.** Só o Windows faz isso.
- **Não diga que o app registra o ponto na empresa** nem que garante o cumprimento de regra trabalhista. Ele só lembra.
- **Não prometa registrar água a qualquer momento.** Hoje o copo é registrado pela resposta ao aviso, e cada resposta vale um copo de 250 ml.
- **Não prometa sincronização entre computadores nem cópia na nuvem.**

## 14. Entrega

A página está pronta quando:

- [ ] a página inicial e a de download existem nos três idiomas, nos endereços da seção 5;
- [ ] o seletor de idioma leva à mesma página no outro idioma;
- [ ] o visual segue a referência: céu em degradê até o lima, título condensado em lima, cena em camadas, cartões flutuantes escuros, botões em pílula e rabiscos;
- [ ] nada da marca, dos textos ou das imagens da Wingly foi usado;
- [ ] o aviso de água vibra no topo e para com a preferência de movimento reduzido;
- [ ] a página inicial apresenta os dois pilares, bem-estar e produtividade;
- [ ] os botões de download funcionam sem JavaScript e mostram a versão atual com ele;
- [ ] a página de download destaca o sistema da pessoa e explica a instalação no Windows e no Ubuntu, incluindo o aviso do SmartScreen;
- [ ] o bloco "Em breve no celular" aparece nas duas páginas, sem data e sem link;
- [ ] cada idioma usa as capturas do próprio idioma;
- [ ] nenhuma das afirmações da seção 13 aparece em nenhum idioma;
- [ ] não há rastreadores nem chamadas a terceiros além da busca no GitHub;
- [ ] o site funciona em 360 px de largura e pelo teclado;
- [ ] a pasta `site/` tem as instruções para rodar e publicar na Vercel.

Ao terminar, diga o que foi construído, o que ficou diferente deste pedido e por quê, e o que você não conseguiu verificar.
