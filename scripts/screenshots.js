// Gera as capturas de tela do app com dados de exemplo, em docs/screenshots/ (português),
// docs/screenshots/en/ e docs/screenshots/es/. Os nomes dos arquivos são os mesmos nos três idiomas.
// Uso: npm run shots (os três idiomas) ou electron scripts/screenshots.js --background --lang=en-US
// Roda o app de verdade (main.js) com uma pasta de dados temporária: não lê nem altera os seus dados.
// As janelas são desenhadas fora da tela (offscreen); a captura é feita pelo protocolo de depuração do Chromium, em 2x.
const { app, BrowserWindow, nativeTheme } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');

const ROOT = path.join(__dirname, '..');
// Idioma das capturas: --lang=pt-BR (padrão), en-US ou es
const LANG = (process.argv.find(a => a.startsWith('--lang=')) || '--lang=pt-BR').slice(7);
const SUB = { 'pt-BR': '', 'en-US': 'en', es: 'es' }[LANG];
if (SUB === undefined) { console.error('idioma desconhecido: ' + LANG); process.exit(1); }
const OUT = path.join(ROOT, 'docs', 'screenshots', SUB);

// Dados de exemplo em cada idioma
const L = {
  'pt-BR': {
    place: 'Joinville, Santa Catarina, Brasil', sound: 'sino-suave.mp4',
    notes: ['Reunião de alinhamento', 'Desenvolvimento da proposta', 'Revisão de relatórios', 'Atendimento a clientes', 'Planejamento da semana', 'Ajustes do projeto'],
    todayNote: 'Revisão do relatório mensal',
    events: ['Reunião com cliente', 'Academia', 'Dentista', 'Entrega do projeto', 'Daily da equipe'],
    eventNotes: ['Alinhamento do projeto. O link está no e-mail.', 'Levar os exames.'],
    tasks: ['Alongar por 10 minutos', 'Responder e-mails pendentes', 'Ler 20 páginas', 'Planejar o dia seguinte', 'Pagar o boleto do contador', 'Emitir a nota fiscal do mês', 'Renovar o domínio do site', 'Enviar o relatório mensal']
  },
  'en-US': {
    place: 'Joinville, Santa Catarina, Brazil', sound: 'soft-bell.mp4',
    notes: ['Alignment meeting', 'Proposal development', 'Report review', 'Client support', 'Weekly planning', 'Project adjustments'],
    todayNote: 'Monthly report review',
    events: ['Client meeting', 'Gym', 'Dentist', 'Project delivery', 'Team daily'],
    eventNotes: ['Project alignment. The link is in the email.', 'Bring the exam results.'],
    tasks: ['Stretch for 10 minutes', 'Reply to pending emails', 'Read 20 pages', 'Plan the next day', 'Pay the accountant', 'Issue this month\'s invoice', 'Renew the website domain', 'Send the monthly report']
  },
  es: {
    place: 'Joinville, Santa Catarina, Brasil', sound: 'campana-suave.mp4',
    notes: ['Reunión de alineación', 'Desarrollo de la propuesta', 'Revisión de informes', 'Atención a clientes', 'Planificación de la semana', 'Ajustes del proyecto'],
    todayNote: 'Revisión del informe mensual',
    events: ['Reunión con cliente', 'Gimnasio', 'Dentista', 'Entrega del proyecto', 'Daily del equipo'],
    eventNotes: ['Alineación del proyecto. El enlace está en el correo.', 'Llevar los exámenes.'],
    tasks: ['Estirar durante 10 minutos', 'Responder correos pendientes', 'Leer 20 páginas', 'Planificar el día siguiente', 'Pagar la factura del contador', 'Emitir la factura del mes', 'Renovar el dominio del sitio', 'Enviar el informe mensual']
  }
}[LANG];
const DATA = fs.mkdtempSync(path.join(os.tmpdir(), 'agua-shots-'));
app.setPath('userData', DATA);

// O relógio de lembretes do app (a cada 15 s) fica desligado aqui, para nenhum alerta abrir na sua tela
const realSetInterval = global.setInterval;
global.setInterval = (fn, ms, ...rest) => (ms === 15000 ? 0 : realSetInterval(fn, ms, ...rest));

const pad = n => String(n).padStart(2, '0');
const key = t => { const d = new Date(t); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };
const sleep = ms => new Promise(r => setTimeout(r, ms));

// "Hoje" das capturas: o dia útil mais recente, às 14:40 (um dia de trabalho pela metade fica mais ilustrativo)
const base = new Date(); base.setHours(0, 0, 0, 0);
while (base.getDay() === 0 || base.getDay() === 6) base.setDate(base.getDate() - 1);
const at = (dayOffset, h, m = 0) => new Date(base.getFullYear(), base.getMonth(), base.getDate() + dayOffset, h, m).getTime();
const NOW = at(0, 14, 40);
const weekday = off => { const g = new Date(at(off, 12)).getDay(); return g !== 0 && g !== 6; };

function seed() {
  const config = {
    lang: LANG, start: '06:30', end: '16:30', iv: 60, goalMl: 2500,
    days: [false, true, true, true, true, true, false],
    autostart: false, // nunca true aqui: o app ligaria a inicialização automática de verdade
    sound: true, alertStyle: 'corner', soundLoop: true, theme: 'light',
    weather: { enabled: true, name: L.place, lat: -26.30444, lon: -48.84556, unit: 'c' },
    // painel fechando em pares: o bloco de lembretes fica desligado (o clima aparece na pílula do topo)
    home: [{ id: 'kpis', on: true, wide: true }, { id: 'water', on: true, wide: false }, { id: 'progress', on: true, wide: false },
      { id: 'agenda', on: true, wide: false }, { id: 'tasks', on: true, wide: false }, { id: 'hours', on: true, wide: false },
      { id: 'next', on: true, wide: false }, { id: 'reminders', on: false, wide: false }, { id: 'weather', on: false, wide: false }],
    ponto: { enabled: true, clt: true, times: ['08:00', '12:00', '13:00', '17:00'], leadMin: 5, days: [false, true, true, true, true, true, false] }
  };

  // Água: 5 semanas de histórico com dias de meta batida, parcial e sem registro
  const history = [];
  const hours = [7, 8, 9, 10, 11, 12, 13, 14, 15, 16];
  const pattern = ['met', 'met', 'part', 'met', 'met', 'none', 'met', 'part', 'met', 'met'];
  let i = 0, selKey = null;
  for (let off = -34; off <= -1; off++) {
    if (!weekday(off)) continue;
    const kind = pattern[i++ % pattern.length];
    if (kind === 'none') continue;
    const drinks = kind === 'met' ? 10 : 5 + (i % 3);
    hours.forEach((h, n) => {
      history.push({ t: at(off, h, 30), type: 'fired', goalMl: 2500 });
      if (n < drinks) history.push({ t: at(off, h, 31), type: 'drink', ml: 250, fromAlert: true });
    });
    if (kind === 'met') selKey = key(at(off, 12));
  }
  [7, 8, 9, 10, 11, 12, 13, 14].forEach((h, n) => { // hoje até 14:40: 8 lembretes, 7 atendidos
    history.push({ t: at(0, h, 30), type: 'fired', goalMl: 2500 });
    if (n !== 3) history.push({ t: at(0, h, 31), type: 'drink', ml: 250, fromAlert: true });
  });

  // Horas: dois períodos por dia útil e um check-in aberto hoje
  const notes = L.notes;
  const sessions = [];
  let s = 0;
  for (let off = -34; off <= -1; off++) {
    if (!weekday(off)) continue;
    sessions.push({ id: 'm' + s, start: at(off, 8, s % 7), end: at(off, 12, 0), note: notes[s % notes.length] });
    sessions.push({ id: 't' + s, start: at(off, 13, 0), end: at(off, 17, 30 - (s % 4) * 5), note: notes[(s + 3) % notes.length] });
    s++;
  }
  sessions.push({ id: 'h1', start: at(0, 8, 2), end: at(0, 12, 4), note: L.todayNote });
  sessions.push({ id: 'h2', start: at(0, 13, 5), end: null, note: '' });

  const planner = {
    events: [
      { id: 'e1', title: L.events[0], date: key(at(0, 12)), time: '15:30', leadMin: 10, note: L.eventNotes[0] },
      { id: 'e2', title: L.events[1], date: key(at(0, 12)), time: '18:30', leadMin: 30, note: '' },
      { id: 'e3', title: L.events[2], date: key(at(1, 12)), time: '09:00', leadMin: 60, note: L.eventNotes[1] },
      { id: 'e4', title: L.events[3], date: key(at(3, 12)), time: '14:00', leadMin: 30, note: '' },
      { id: 'e5', title: L.events[4], date: key(at(-1, 12)), time: '09:30', leadMin: 5, note: '' }
    ],
    tasks: [
      { id: 'k1', title: L.tasks[0], kind: 'daily', doneDates: [key(NOW)] },
      { id: 'k2', title: L.tasks[1], kind: 'daily', doneDates: [key(NOW)] },
      { id: 'k3', title: L.tasks[2], kind: 'daily', doneDates: [] },
      { id: 'k4', title: L.tasks[3], kind: 'daily', doneDates: [] },
      { id: 'k5', title: L.tasks[4], kind: 'once', due: key(at(-1, 12)), done: false, doneAt: null },
      { id: 'k6', title: L.tasks[5], kind: 'once', due: key(NOW), done: false, doneAt: null },
      { id: 'k7', title: L.tasks[6], kind: 'once', due: key(at(10, 12)), done: false, doneAt: null },
      { id: 'k8', title: L.tasks[7], kind: 'once', due: '', done: true, doneAt: at(-1, 16) }
    ]
  };

  fs.writeFileSync(path.join(DATA, 'config.json'), JSON.stringify(config));
  fs.writeFileSync(path.join(DATA, 'history.json'), JSON.stringify(history));
  fs.writeFileSync(path.join(DATA, 'timesheet.json'), JSON.stringify(sessions));
  fs.writeFileSync(path.join(DATA, 'planner.json'), JSON.stringify(planner));
  return selKey;
}

const selKey = seed();
require(path.join(ROOT, 'main.js')); // registra os mesmos dados e respostas que o app usa

const prefs = { preload: path.join(ROOT, 'preload.js'), contextIsolation: true, nodeIntegration: false, offscreen: true };
// Cada etapa tem limite de tempo: se o Chromium parar de responder, o script falha dizendo onde
const limit = (p, what, ms = 20000) => Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error('tempo esgotado em: ' + what)), ms))]);
const js = (win, code) => win.webContents.executeJavaScript(code, true);
async function waitFor(win, expr, timeout) {
  const end = Date.now() + timeout;
  while (Date.now() < end) { if (await js(win, `Boolean(${expr})`)) return true; await sleep(200); }
  return false;
}

// Captura em 2x. Sem "selector", pega a página inteira (a altura acompanha o conteúdo); com ele, só o elemento.
async function shot(win, file, { width = 1280, height = 800, grow = true, selector = null, margin = 0 } = {}) {
  const dbg = win.webContents.debugger;
  const metrics = h => limit(dbg.sendCommand('Emulation.setDeviceMetricsOverride', { width, height: h, deviceScaleFactor: 2, mobile: false }), file + ' (tamanho)');
  await metrics(height);
  if (grow) {
    // mede duas vezes: sem a barra de rolagem a página alarga e a altura do conteúdo pode mudar
    for (let pass = 0; pass < 2; pass++) {
      const h = await js(win, `Math.max(${height}, Math.ceil((document.querySelector('main') || document.documentElement).scrollHeight))`);
      await metrics(h);
      await sleep(120);
    }
  }
  await sleep(350);
  let clip;
  if (selector) {
    const r = await js(win, `(() => { const b = document.querySelector(${JSON.stringify(selector)}).getBoundingClientRect(); return { x: b.x, y: b.y + scrollY, w: b.width, h: b.height }; })()`);
    clip = { x: Math.max(0, r.x - margin), y: Math.max(0, r.y - margin), width: r.w + margin * 2, height: r.h + margin * 2, scale: 1 };
  }
  const { data } = await limit(dbg.sendCommand('Page.captureScreenshot', { format: 'png', ...(clip ? { clip } : {}) }), file + ' (captura)');
  fs.writeFileSync(path.join(OUT, file), Buffer.from(data, 'base64'));
  console.log('  ' + file);
}

async function alertShot(query, file, width, height) {
  const a = new BrowserWindow({ width, height, show: false, frame: false, webPreferences: prefs });
  await a.loadFile(path.join(ROOT, 'alert.html'), { query: { sound: '0', loop: '0', lang: LANG, ...query } });
  a.webContents.debugger.attach('1.3');
  await js(a, "document.body.classList.remove('ringing')"); // sem a vibração, para a imagem não sair torta
  await shot(a, file, { width, height, grow: false });
  a.destroy();
}

async function run() {
  await app.whenReady();
  await sleep(300);
  fs.mkdirSync(OUT, { recursive: true });

  const win = new BrowserWindow({ width: 1280, height: 800, show: false, webPreferences: prefs });
  await win.loadFile(path.join(ROOT, 'main.html'));
  win.webContents.debugger.attach('1.3');
  await win.webContents.insertCSS('::-webkit-scrollbar{display:none}'); // sem barra de rolagem nas imagens
  if (!await waitFor(win, "typeof C === 'object' && C !== null && wxAt > 0", 30000)) throw new Error('a janela principal não terminou de carregar');

  // Relógio fixo em 14:40, clima de exemplo e detalhes só de exibição (nada disso é salvo)
  await js(win, `(() => {
    const R0 = Date, off = ${NOW} - R0.now();
    class D extends R0 { constructor(...a) { a.length ? super(...a) : super(R0.now() + off); } static now() { return R0.now() + off; } }
    window.Date = D;
    refreshWeather = async () => {};
    WX = { ok: true, place: ${JSON.stringify(L.place)}, unit: 'c', temp: 27.4, feels: 29.1, humidity: 62, code: 2, isDay: true, max: 31, min: 19, rain: 20, at: Date.now() - 4 * 60000 };
    wxAt = Date.now();
    C.autostart = true;
    C.alertSound = { name: ${JSON.stringify(L.sound)} };
    sel = ${JSON.stringify(selKey)};
  })()`);

  const view = async (v, file, opts) => { await js(win, `go('${v}'); window.scrollTo(0, 0)`); await sleep(500); await shot(win, file, opts); };

  console.log('Tema claro');
  await view('hoje', '01-hoje.png');
  await view('horas', '02-horas.png');
  await view('agenda', '03-agenda.png');
  await view('tarefas', '04-tarefas.png');
  await view('rel', '05-relatorios.png');
  await view('cfg', '06-configuracoes.png');

  console.log('Recortes');
  await view('cfg', '07-recorte-tela-inicial.png', { selector: '#card-home', margin: 16 });
  await view('cfg', '08-recorte-clima-config.png', { selector: '#card-weather', margin: 16 });
  await view('hoje', '09-recorte-topo-clima.png', { selector: 'header.top', margin: 16 });
  await view('horas', '10-recorte-check-in.png', { selector: '.clock-card', margin: 16 });

  console.log('Tema escuro');
  nativeTheme.themeSource = 'dark';
  await sleep(500);
  await view('hoje', '11-hoje-escuro.png');
  await view('horas', '12-horas-escuro.png');
  await view('tarefas', '13-tarefas-escuro.png');
  await view('rel', '14-relatorios-escuro.png');
  await alertShot({ mode: 'corner' }, '15-alerta-agua-canto-escuro.png', 400, 270);
  nativeTheme.themeSource = 'light';
  await sleep(500);

  if (LANG === 'pt-BR') { // amostra dos outros idiomas dentro do conjunto em português
    console.log('Idiomas');
    await js(win, "C.lang = 'en-US'");
    await view('hoje', '20-hoje-ingles.png');
    await js(win, "C.lang = 'es'");
    await view('hoje', '21-hoje-espanhol.png');
    await js(win, "C.lang = 'pt-BR'");
  }

  console.log('Alertas');
  await alertShot({ mode: 'full' }, '30-alerta-agua-tela-cheia.png', 1280, 720);
  await alertShot({ mode: 'corner' }, '31-alerta-agua-canto.png', 400, 270);
  await alertShot({ mode: 'corner', ponto: '12:00' }, '32-alerta-ponto-canto.png', 400, 270);
  await alertShot({ mode: 'corner', event: L.events[0], at: '15:30' }, '33-alerta-compromisso-canto.png', 400, 270);
  await alertShot({ mode: 'full', event: L.events[0], at: '15:30' }, '34-alerta-compromisso-tela-cheia.png', 1280, 720);
}

run()
  .then(() => { console.log('Capturas salvas em ' + OUT); })
  .catch(e => { console.error('Falhou:', e.message); process.exitCode = 1; })
  .finally(() => { fs.rmSync(DATA, { recursive: true, force: true }); app.exit(process.exitCode || 0); });
