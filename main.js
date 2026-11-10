const { app, BrowserWindow, Tray, Menu, nativeImage, ipcMain, screen, powerMonitor, dialog, nativeTheme, net } = require('electron');
const path = require('path');
const fs = require('fs');
const { pathToFileURL } = require('url');
const { autoUpdater } = require('electron-updater');
const I18N = require('./i18n.js');
const Timesheet = require('./timesheet.js');
const Planner = require('./planner.js');
const T = (key, vars) => I18N.t(CFG.lang, key, vars); // texto no idioma escolhido (padrão: pt-BR)

// Blocos da tela inicial (ordem = prioridade; wide = largura inteira)
const HOME_WIDGETS = ['kpis', 'weather', 'water', 'progress', 'agenda', 'tasks', 'hours', 'next', 'reminders'];
const HOME_DEFAULT = [
  { id: 'kpis', on: true, wide: true }, { id: 'weather', on: false, wide: false }, { id: 'water', on: true, wide: false }, { id: 'progress', on: true, wide: false },
  { id: 'agenda', on: true, wide: false }, { id: 'tasks', on: true, wide: false }, { id: 'hours', on: true, wide: false },
  { id: 'next', on: true, wide: false }, { id: 'reminders', on: true, wide: false }
];
// Aceita só blocos conhecidos, sem repetir; bloco novo que ainda não estava na lista entra no fim com o padrão
function normalizeHome(list) {
  const out = [], seen = new Set();
  for (const w of Array.isArray(list) ? list : []) {
    if (w && HOME_WIDGETS.includes(w.id) && !seen.has(w.id)) { seen.add(w.id); out.push({ id: w.id, on: !!w.on, wide: !!w.wide }); }
  }
  for (const w of HOME_DEFAULT) if (!seen.has(w.id)) out.push({ ...w });
  return out;
}

const DEFAULTS = {
  start: '06:30', end: '16:18', iv: 60, goalMl: 2500,
  days: [false, true, true, true, true, true, false],
  autostart: false, sound: true,
  alertStyle: 'full', // 'full' = tela cheia; 'corner' = aviso vibrando no canto da tela
  soundLoop: false,   // true = o som repete até a pessoa responder
  home: normalizeHome([]),
  theme: 'system', // 'system' segue o tema do computador; 'light' ou 'dark' fixa
  weather: { enabled: false, name: '', lat: null, lon: null, unit: 'c' }, // clima: opcional, único recurso que usa internet
  lang: I18N.DEFAULT_LANG, // 'pt-BR', 'en-US' ou 'es'
  alertSound: null, // { name } quando o usuário escolheu um .mp4; o arquivo fica em userData/alert-sound.mp4
  ponto: { enabled: false, clt: true, times: ['08:00', '12:00', '13:00', '17:00'], leadMin: 5, days: [false, true, true, true, true, true, false] }
};
const APP_TITLE = 'WRS Tools'; // nome que a pessoa vê; o nome interno (pasta de dados, executável) continua o antigo
const SNOOZE_MS = 10 * 60 * 1000;
const THEMES = ['system', 'light', 'dark'];
// O tema vale para todas as janelas: o Chromium passa a responder prefers-color-scheme conforme a escolha
function applyTheme() { nativeTheme.themeSource = CFG.theme; }
// Clima: local escolhido pela pessoa; só liga se tiver latitude/longitude válidas
function cleanWeather(w) {
  const lat = Number(w.lat), lon = Number(w.lon);
  const ok = w.lat !== null && w.lon !== null && Number.isFinite(lat) && Number.isFinite(lon) && Math.abs(lat) <= 90 && Math.abs(lon) <= 180;
  return { enabled: !!w.enabled && ok, name: String(w.name || '').slice(0, 120), lat: ok ? lat : null, lon: ok ? lon : null, unit: w.unit === 'f' ? 'f' : 'c' };
}
const windowBg = (light, dark) => (nativeTheme.shouldUseDarkColors ? dark : light); // evita piscar branco no escuro
const PONTO_SNOOZE_MS = 5 * 60 * 1000;
const GLASS_ML = 250;
const UPDATE_EVERY_MS = 6 * 60 * 60 * 1000;

let CFG = { ...DEFAULTS };
let history = []; // eventos: { t, type: 'fired' | 'drink', ml?, fromAlert?, goalMl? }
const dataFile = name => path.join(app.getPath('userData'), name);
const SOUND_FILE = () => dataFile('alert-sound.mp4');
const SOUND_MAX_BYTES = 10 * 1024 * 1024;

function saveConfigFile() {
  fs.mkdirSync(app.getPath('userData'), { recursive: true });
  fs.writeFileSync(dataFile('config.json'), JSON.stringify(CFG, null, 2));
}

function loadConfig() {
  try {
    const saved = JSON.parse(fs.readFileSync(dataFile('config.json'), 'utf8'));
    // ponto é mesclado campo a campo: configs antigas não têm "days" dentro de ponto
    CFG = { ...DEFAULTS, ...saved, ponto: { ...DEFAULTS.ponto, ...(saved.ponto || {}) } };
    // versões antigas tinham "visual" (tela cheia sim/não): desligado vira o aviso no canto
    if (!saved.alertStyle && saved.visual === false) CFG.alertStyle = 'corner';
    delete CFG.visual;
    CFG.home = normalizeHome(saved.home);
  } catch (e) { CFG = { ...DEFAULTS }; }
  if (!I18N.LANGS.includes(CFG.lang)) CFG.lang = I18N.DEFAULT_LANG;
  if (!THEMES.includes(CFG.theme)) CFG.theme = 'system';
  CFG.weather = cleanWeather(CFG.weather || {});
}
function loadHistory() {
  try { history = JSON.parse(fs.readFileSync(dataFile('history.json'), 'utf8')); } catch (e) { history = []; }
}
// Check-in/check-out: { id, start, end, note }; end = null enquanto a sessão está aberta
let sessions = [];
function loadSessions() {
  try { sessions = JSON.parse(fs.readFileSync(dataFile('timesheet.json'), 'utf8')); } catch (e) { sessions = []; }
}
function saveSessions() {
  fs.mkdirSync(app.getPath('userData'), { recursive: true });
  fs.writeFileSync(dataFile('timesheet.json'), JSON.stringify(sessions));
}
const openSession = () => sessions.find(s => s.end === null);
const newId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
// Avisa a janela e refaz o menu da bandeja (o item vira "check-in" ou "check-out")
function timeChanged() {
  if (tray) buildTrayMenu();
  if (mainWin) mainWin.webContents.send('time:changed');
}
function checkIn() {
  if (openSession()) return { ok: false, error: T('err.timeOpen') };
  sessions.push({ id: newId(), start: Date.now(), end: null, note: '' });
  saveSessions(); timeChanged();
  return { ok: true };
}
// Agenda e tarefas: { events: [...], tasks: [...] } em planner.json
let plan = { events: [], tasks: [] };
function loadPlan() {
  try { const p = JSON.parse(fs.readFileSync(dataFile('planner.json'), 'utf8')); plan = { events: p.events || [], tasks: p.tasks || [] }; }
  catch (e) { plan = { events: [], tasks: [] }; }
}
function savePlan() {
  fs.mkdirSync(app.getPath('userData'), { recursive: true });
  fs.writeFileSync(dataFile('planner.json'), JSON.stringify(plan));
}

function checkOut(note) {
  const s = openSession();
  if (!s) return { ok: false, error: T('err.timeNone') };
  s.end = Date.now();
  s.note = String(note || '').slice(0, 300);
  saveSessions(); timeChanged();
  return { ok: true };
}

function record(ev) {
  history.push({ t: Date.now(), ...ev });
  fs.mkdirSync(app.getPath('userData'), { recursive: true });
  fs.writeFileSync(dataFile('history.json'), JSON.stringify(history));
}

// Valida antes de salvar: o que vem da tela de configuração não é confiável por padrão
function validate(c) {
  const hhmm = /^([01]\d|2[0-3]):[0-5]\d$/;
  const fail = (key, vars) => ({ ok: false, error: T(key, vars) });
  if (!hhmm.test(c.start) || !hhmm.test(c.end)) return fail('err.time');
  if (toM(c.start) >= toM(c.end)) return fail('err.order');
  const iv = Number(c.iv);
  if (!(iv >= 5 && iv <= 480)) return fail('err.iv');
  const goalMl = Number(c.goalMl);
  if (!(goalMl >= 500 && goalMl <= 6000)) return fail('err.goal');
  if (!Array.isArray(c.days) || c.days.length !== 7) return fail('err.days');
  if (!c.days.some(Boolean)) return fail('err.oneDay');

  // Bater ponto: CLT precisa de pelo menos 4 batidas; sem CLT, pelo menos 2
  const p = c.ponto || {};
  const pTimes = Array.isArray(p.times) ? p.times : [];
  if (pTimes.some(t => !hhmm.test(t))) return fail('err.pTime');
  const times = [...new Set(pTimes)].sort((a, b) => toM(a) - toM(b));
  const leadMin = Number(p.leadMin);
  if (!(leadMin >= 0 && leadMin <= 30)) return fail('err.pLead');
  if (!Array.isArray(p.days) || p.days.length !== 7) return fail('err.pDays');
  const pDays = p.days.map(Boolean);
  if (p.enabled) {
    const min = p.clt ? 4 : 2;
    if (times.length < min || times.length > 10) return fail('err.pCount', { min });
    if (!pDays.some(Boolean)) return fail('err.pOneDay');
  }

  return {
    ok: true,
    cfg: {
      start: c.start, end: c.end, iv, goalMl, days: c.days.map(Boolean),
      autostart: !!c.autostart, sound: c.sound !== false,
      alertStyle: c.alertStyle === 'corner' ? 'corner' : 'full', soundLoop: !!c.soundLoop,
      home: normalizeHome(c.home),
      lang: CFG.lang, // o idioma é salvo à parte, ao clicar no seletor
      theme: CFG.theme, // o tema também
      weather: CFG.weather, // o clima é salvo pela seção própria
      alertSound: CFG.alertSound || null,
      ponto: { enabled: !!p.enabled, clt: !!p.clt, times, leadMin, days: pDays }
    }
  };
}

// Resumo por dia para o calendário. A meta vai junto de cada lembrete disparado,
// então mudar a meta hoje não reescreve os dias anteriores.
function daySummary() {
  const out = {};
  for (const e of history) {
    const d = new Date(e.t);
    const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    if (!out[k]) out[k] = { ml: 0, drinks: 0, fired: 0, atendidos: 0, missed: 0, goal: null };
    if (e.type === 'fired') { out[k].fired++; if (e.goalMl) out[k].goal = e.goalMl; }
    if (e.type === 'drink') { out[k].ml += e.ml; out[k].drinks++; if (e.fromAlert) out[k].atendidos++; }
  }
  for (const k in out) out[k].missed = Math.max(0, out[k].fired - out[k].atendidos);
  return out;
}

const toM = h => { const [a, b] = h.split(':').map(Number); return a * 60 + b; };
const todayTimes = () => {
  const r = [];
  for (let t = toM(CFG.start) + CFG.iv; t <= toM(CFG.end); t += CFG.iv) r.push(t);
  return r;
};

// Abrir com o computador: Windows e macOS usam a API do Electron; no Ubuntu é um arquivo em ~/.config/autostart
function applyAutostart(on) {
  if (process.platform === 'linux') {
    const file = path.join(app.getPath('home'), '.config', 'autostart', 'agua-lembrete.desktop');
    if (!on) { fs.rmSync(file, { force: true }); return; }
    const exec = app.isPackaged ? `"${process.execPath}"` : `"${process.execPath}" "${app.getAppPath()}"`;
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, [
      '[Desktop Entry]', 'Type=Application', 'Name=' + APP_TITLE,
      'Comment=Lembrete para beber água e bater o ponto',
      `Exec=${exec} --background`, 'Terminal=false', 'X-GNOME-Autostart-enabled=true', ''
    ].join('\n'));
    return;
  }
  app.setLoginItemSettings({ openAtLogin: on, args: ['--background'] });
}

let tray = null;
let alertWin = null;
let alertCtx = { real: false, ponto: null, event: null }; // o que o alerta aberto representa
const pendingAlerts = []; // alertas que chegaram enquanto outro estava aberto
let mainWin = null;
let snoozeTimer = null;
const firedKeys = new Set(); // lembretes já disparados hoje
let firedDay = '';

// real = lembrete de água de verdade (conta no histórico); teste não entra nas métricas.
// ponto = horário da marcação (quando é alerta de bater ponto); não entra no histórico de água.
// Se já há um alerta aberto, este entra na fila e abre quando o atual fechar.
// event = compromisso da agenda ({ id, title, time }); também não entra no histórico de água
function openAlert(real = false, ponto = null, event = null) {
  if (alertWin) {
    const same = p => p.real === real && p.ponto === ponto && (p.event && p.event.id) === (event && event.id);
    if (!pendingAlerts.some(same)) pendingAlerts.push({ real, ponto, event });
    return;
  }
  alertCtx = { real, ponto, event };
  const display = screen.getDisplayNearestPoint(screen.getCursorScreenPoint());
  const corner = CFG.alertStyle === 'corner';
  // Tela cheia cobre o monitor; o aviso fica no canto inferior direito, acima da barra de tarefas
  const W = 400, H = 270, M = 16, wa = display.workArea, b = display.bounds;
  const size = corner
    ? { x: wa.x + wa.width - W - M, y: wa.y + wa.height - H - M, width: W, height: H }
    : { x: b.x, y: b.y, width: b.width, height: b.height };
  alertWin = new BrowserWindow({
    ...size, frame: false, alwaysOnTop: true, skipTaskbar: true, resizable: false, movable: false,
    show: false, backgroundColor: corner ? windowBg('#eef7fb', '#0b1620') : windowBg('#ffffff', '#0b1620'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });
  alertWin.setAlwaysOnTop(true, 'screen-saver');
  const query = { sound: CFG.sound ? '1' : '0', loop: CFG.soundLoop ? '1' : '0', mode: corner ? 'corner' : 'full', lang: CFG.lang };
  if (ponto) query.ponto = ponto;
  if (event) { query.event = event.title; query.at = event.time; }
  // Som escolhido pelo usuário (.mp4); se o arquivo sumiu, a tela toca o bipe padrão
  if (CFG.alertSound && fs.existsSync(SOUND_FILE())) query.src = pathToFileURL(SOUND_FILE()).href;
  alertWin.loadFile(path.join(__dirname, 'alert.html'), { query });
  // o aviso no canto aparece sem roubar o foco de quem está digitando
  alertWin.once('ready-to-show', () => { if (corner) alertWin.showInactive(); else { alertWin.show(); alertWin.focus(); } });
  alertWin.on('closed', () => {
    alertWin = null;
    const next = pendingAlerts.shift();
    if (next) openAlert(next.real, next.ponto, next.event);
  });
}

function closeAlert() {
  if (alertWin) alertWin.close();
}

// Janela única: Hoje, Relatórios e Configurações ficam juntas, com menu lateral
function openMain() {
  if (mainWin) { mainWin.show(); mainWin.focus(); return; }
  mainWin = new BrowserWindow({
    width: 1120, height: 760, minWidth: 880, minHeight: 600, title: APP_TITLE, autoHideMenuBar: true,
    backgroundColor: windowBg('#eef7fb', '#0b1620'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });
  mainWin.loadFile(path.join(__dirname, 'main.html'));
  mainWin.on('closed', () => { mainWin = null; });
}

// Checa a cada 15 s. Cada lembrete dispara uma vez por dia, na janela de 1 minuto
// a partir do horário (cobre atraso de alguns segundos ao acordar o computador).
function tick() {
  const d = new Date();
  const day = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
  if (day !== firedDay) { firedDay = day; firedKeys.clear(); }
  const m = d.getHours() * 60 + d.getMinutes();
  const once = (key, fn) => { if (!firedKeys.has(key)) { firedKeys.add(key); fn(); } };

  if (CFG.days[d.getDay()]) {
    const t = todayTimes().find(x => m >= x && m <= x + 1);
    if (t !== undefined) once(`agua-${t}`, () => {
      record({ type: 'fired', goalMl: CFG.goalMl });
      openAlert(true);
    });
  }
  if (CFG.ponto.enabled && CFG.ponto.days[d.getDay()]) {
    const hit = CFG.ponto.times.find(p => { const a = toM(p) - CFG.ponto.leadMin; return m >= a && m <= a + 1; });
    if (hit !== undefined) once(`ponto-${hit}`, () => openAlert(false, hit));
  }
  for (const e of Planner.dueEvents(plan.events, d)) {
    once(`ev-${e.id}`, () => openAlert(false, null, { id: e.id, title: e.title, time: e.time }));
  }
}

// Menu da bandeja no idioma atual; é refeito quando o idioma muda
function buildTrayMenu() {
  tray.setContextMenu(Menu.buildFromTemplate([
    { label: T('tray.open'), click: openMain },
    { label: openSession() ? T('time.checkout') : T('time.checkin'), click: () => (openSession() ? checkOut('') : checkIn()) },
    { label: T('testAlert'), click: () => openAlert(false) },
    { type: 'separator' },
    { label: T('tray.quit'), click: () => app.quit() }
  ]));
}

function createTray() {
  tray = new Tray(nativeImage.createFromPath(path.join(__dirname, 'tray.png')));
  tray.setToolTip(APP_TITLE);
  buildTrayMenu();
  // Duplo clique só existe no Windows; no Ubuntu a entrada é o item "Abrir" do menu
  tray.on('double-click', openMain);
}

// Atualização automática: só no app instalado. Sem internet ou no .deb, o erro é ignorado.
function setupUpdates() {
  if (!app.isPackaged) return;
  autoUpdater.on('error', () => {});
  const check = () => autoUpdater.checkForUpdatesAndNotify().catch(() => {});
  check();
  setInterval(check, UPDATE_EVERY_MS);
}

ipcMain.handle('config:get', () => CFG);
ipcMain.handle('config:save', (_e, c) => {
  const r = validate(c);
  if (!r.ok) return r;
  try { applyAutostart(r.cfg.autostart); } catch (e) { return { ok: false, error: T('err.autostart') }; }
  CFG = r.cfg;
  fs.mkdirSync(app.getPath('userData'), { recursive: true });
  fs.writeFileSync(dataFile('config.json'), JSON.stringify(CFG, null, 2));
  return { ok: true };
});
ipcMain.handle('report:get', () => ({ days: daySummary(), goalMl: CFG.goalMl, glassMl: GLASS_ML }));
ipcMain.on('drink', () => {
  if (alertCtx.real) record({ type: 'drink', ml: GLASS_ML, fromAlert: true });
  closeAlert();
});
ipcMain.on('snooze', () => {
  closeAlert();
  clearTimeout(snoozeTimer);
  snoozeTimer = setTimeout(() => openAlert(true), SNOOZE_MS);
});
ipcMain.on('ponto:done', () => closeAlert());
ipcMain.on('ponto:snooze', () => {
  const horario = alertCtx.ponto;
  closeAlert();
  setTimeout(() => openAlert(false, horario), PONTO_SNOOZE_MS);
});
ipcMain.on('alert:test', () => openAlert(false));
ipcMain.on('alert:close', () => closeAlert());
ipcMain.on('event:snooze', () => {
  const ev = alertCtx.event;
  closeAlert();
  if (ev) setTimeout(() => openAlert(false, null, ev), PONTO_SNOOZE_MS);
});

ipcMain.handle('plan:get', () => plan);
ipcMain.handle('plan:addEvent', (_e, data) => {
  const r = Planner.makeEvent(data);
  if (r.error) return { ok: false, error: T(r.error) };
  plan.events.push({ id: newId(), ...r });
  savePlan();
  return { ok: true };
});
ipcMain.handle('plan:delEvent', (_e, id) => {
  plan.events = plan.events.filter(x => x.id !== id);
  savePlan();
  return { ok: true };
});
ipcMain.handle('plan:addTask', (_e, data) => {
  const r = Planner.makeTask(data);
  if (r.error) return { ok: false, error: T(r.error) };
  plan.tasks.push({ id: newId(), ...r });
  savePlan();
  return { ok: true };
});
ipcMain.handle('plan:toggleTask', (_e, id) => {
  const t = plan.tasks.find(x => x.id === id);
  if (!t) return { ok: false };
  Planner.toggleTask(t, Planner.dayKey(new Date())); // "hoje" vem do processo principal, não da tela
  savePlan();
  return { ok: true };
});
ipcMain.handle('plan:delTask', (_e, id) => {
  plan.tasks = plan.tasks.filter(x => x.id !== id);
  savePlan();
  return { ok: true };
});

ipcMain.handle('sound:pick', async () => {
  const opts = { title: T('dlg.sound'), properties: ['openFile'], filters: [{ name: T('dlg.filter'), extensions: ['mp4'] }] };
  const r = mainWin ? await dialog.showOpenDialog(mainWin, opts) : await dialog.showOpenDialog(opts);
  if (r.canceled || !r.filePaths.length) return { ok: false, canceled: true };
  const src = r.filePaths[0];
  if (fs.statSync(src).size > SOUND_MAX_BYTES) return { ok: false, error: T('err.soundSize') };
  fs.mkdirSync(app.getPath('userData'), { recursive: true });
  fs.copyFileSync(src, SOUND_FILE());
  CFG.alertSound = { name: path.basename(src) };
  saveConfigFile();
  return { ok: true, name: CFG.alertSound.name };
});
// Idioma: aplica na hora (janela, bandeja e próximos alertas) e fica salvo
ipcMain.handle('time:get', () => ({ sessions }));
ipcMain.handle('time:checkin', () => checkIn());
ipcMain.handle('time:checkout', (_e, note) => checkOut(note));
ipcMain.handle('time:add', (_e, d) => {
  const r = Timesheet.manualSession(d && d.date, d && d.start, d && d.end, d && d.note);
  if (r.error) return { ok: false, error: T(r.error) };
  sessions.push({ id: newId(), ...r });
  saveSessions(); timeChanged();
  return { ok: true };
});
ipcMain.handle('time:delete', (_e, id) => {
  sessions = sessions.filter(s => s.id !== id);
  saveSessions(); timeChanged();
  return { ok: true };
});
// Exporta o mês escolhido em CSV (abre no Excel e no Google Sheets)
ipcMain.handle('time:export', async (_e, p) => {
  const year = Number(p && p.year), month = Number(p && p.month);
  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 0 || month > 11) return { ok: false, error: T('err.timeDate') };
  const name = `${T('csv.file')}-${year}-${String(month + 1).padStart(2, '0')}.csv`;
  const opts = { title: T('dlg.export'), defaultPath: path.join(app.getPath('documents'), name), filters: [{ name: T('dlg.csv'), extensions: ['csv'] }] };
  const r = mainWin ? await dialog.showSaveDialog(mainWin, opts) : await dialog.showSaveDialog(opts);
  if (r.canceled || !r.filePath) return { ok: false, canceled: true };
  const labels = {
    date: T('time.col.date'), in: T('time.col.in'), out: T('time.col.out'), dur: T('time.col.dur'),
    hours: T('time.col.hours'), note: T('time.col.note'), total: T('time.total')
  };
  fs.writeFileSync(r.filePath, Timesheet.buildCsv(sessions, year, month, CFG.lang, labels));
  return { ok: true, path: r.filePath };
});

// ---- Clima (Open-Meteo, sem chave). Só roda se a pessoa ligar o clima. ----
const WX_TTL = 15 * 60 * 1000;
let wxCache = { key: '', at: 0, data: null };
// net.fetch usa a rede do Chromium (respeita o proxy do sistema); tenta 2 vezes antes de desistir
const httpFetch = net && net.fetch ? (...a) => net.fetch(...a) : (...a) => fetch(...a);
async function getJson(url) {
  for (let attempt = 1; ; attempt++) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 8000);
    try {
      const r = await httpFetch(url, { signal: ctrl.signal, headers: { 'User-Agent': 'agua-lembrete' } });
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return await r.json();
    } catch (e) {
      if (attempt >= 2) throw e;
    } finally { clearTimeout(timer); }
  }
}
ipcMain.handle('weather:search', async (_e, name) => {
  const q = String(name || '').trim().slice(0, 80);
  if (q.length < 2) return { ok: true, results: [] };
  try {
    const j = await getJson(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=6&language=${CFG.lang.slice(0, 2)}&format=json`);
    const results = (j.results || []).map(r => ({ name: [r.name, r.admin1, r.country].filter(Boolean).join(', '), lat: r.latitude, lon: r.longitude }));
    return { ok: true, results };
  } catch (e) { return { ok: false, error: T('err.weather') }; }
});
// Detecção aproximada pelo IP: só acontece quando a pessoa clica no botão
ipcMain.handle('weather:detect', async () => {
  try {
    const j = await getJson('https://ipapi.co/json/');
    if (typeof j.latitude !== 'number' || typeof j.longitude !== 'number') throw new Error('sem local');
    return { ok: true, place: { name: [j.city, j.region, j.country_name].filter(Boolean).join(', '), lat: j.latitude, lon: j.longitude } };
  } catch (e) { return { ok: false, error: T('err.weather') }; }
});
ipcMain.handle('weather:set', (_e, w) => {
  CFG.weather = cleanWeather(w || {});
  wxCache = { key: '', at: 0, data: null };
  saveConfigFile();
  return { ok: true, weather: CFG.weather };
});
// Previsão de agora + mínima/máxima/chance de chuva do dia; guarda 15 min e reaproveita se a internet cair
ipcMain.handle('weather:get', async () => {
  const w = CFG.weather;
  if (!w.enabled) return { ok: false, setup: true };
  const key = `${w.lat},${w.lon},${w.unit}`;
  if (wxCache.key === key && Date.now() - wxCache.at < WX_TTL) return { ok: true, ...wxCache.data };
  try {
    const unit = w.unit === 'f' ? '&temperature_unit=fahrenheit' : '';
    const j = await getJson(`https://api.open-meteo.com/v1/forecast?latitude=${w.lat}&longitude=${w.lon}` +
      '&current=temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,is_day' +
      `&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max&forecast_days=1&timezone=auto${unit}`);
    const c = j.current, d = j.daily;
    const data = {
      place: w.name, unit: w.unit, temp: c.temperature_2m, feels: c.apparent_temperature, humidity: c.relative_humidity_2m,
      code: c.weather_code, isDay: c.is_day === 1, max: d.temperature_2m_max[0], min: d.temperature_2m_min[0],
      rain: d.precipitation_probability_max[0], at: Date.now()
    };
    wxCache = { key, at: Date.now(), data };
    return { ok: true, ...data };
  } catch (e) {
    return wxCache.key === key && wxCache.data ? { ok: true, stale: true, ...wxCache.data } : { ok: false, offline: true };
  }
});

ipcMain.handle('theme:set', (_e, theme) => {
  if (!THEMES.includes(theme)) return { ok: false };
  CFG.theme = theme;
  applyTheme();
  saveConfigFile();
  return { ok: true };
});
ipcMain.handle('lang:set', (_e, lang) => {
  if (!I18N.LANGS.includes(lang)) return { ok: false };
  CFG.lang = lang;
  saveConfigFile();
  if (tray) buildTrayMenu();
  return { ok: true };
});
ipcMain.handle('sound:clear', () => {
  fs.rmSync(SOUND_FILE(), { force: true });
  CFG.alertSound = null;
  saveConfigFile();
  return { ok: true };
});

// Abrir o app de novo (ícone no menu de apps ou npm start) mostra a janela
app.on('second-instance', openMain);

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.whenReady().then(() => {
    loadConfig();
    applyTheme();
    loadHistory();
    loadSessions();
    loadPlan();
    if (CFG.autostart) { try { applyAutostart(true); } catch (e) { /* segue sem inicialização automática */ } }
    createTray();
    setInterval(tick, 15000);
    // Ao acordar do suspenso, confere os lembretes na hora
    powerMonitor.on('resume', tick);
    setupUpdates();
    if (process.argv.includes('--test')) setTimeout(() => openAlert(false), 1500);
    // Abre a janela ao iniciar; --background (usado na inicialização automática) só deixa na bandeja
    if (!process.argv.includes('--background')) openMain();
  });
  // Fica em segundo plano: fechar a janela não encerra o app (só o "Sair" da bandeja)
  app.on('window-all-closed', () => {});
}
