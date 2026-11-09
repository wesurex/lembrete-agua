const { app, BrowserWindow, Tray, Menu, nativeImage, ipcMain, screen, powerMonitor } = require('electron');
const path = require('path');
const fs = require('fs');
const { autoUpdater } = require('electron-updater');

const DEFAULTS = {
  start: '06:30', end: '16:18', iv: 60, goalMl: 2500,
  days: [false, true, true, true, true, true, false],
  autostart: false, sound: true, visual: true,
  ponto: { enabled: false, clt: true, times: ['08:00', '12:00', '13:00', '17:00'], leadMin: 5, days: [false, true, true, true, true, true, false] }
};
const SNOOZE_MS = 10 * 60 * 1000;
const PONTO_SNOOZE_MS = 5 * 60 * 1000;
const GLASS_ML = 250;
const UPDATE_EVERY_MS = 6 * 60 * 60 * 1000;

let CFG = { ...DEFAULTS };
let history = []; // eventos: { t, type: 'fired' | 'drink', ml?, fromAlert?, goalMl? }
const dataFile = name => path.join(app.getPath('userData'), name);

function loadConfig() {
  try {
    const saved = JSON.parse(fs.readFileSync(dataFile('config.json'), 'utf8'));
    // ponto é mesclado campo a campo: configs antigas não têm "days" dentro de ponto
    CFG = { ...DEFAULTS, ...saved, ponto: { ...DEFAULTS.ponto, ...(saved.ponto || {}) } };
  } catch (e) { CFG = { ...DEFAULTS }; }
}
function loadHistory() {
  try { history = JSON.parse(fs.readFileSync(dataFile('history.json'), 'utf8')); } catch (e) { history = []; }
}
function record(ev) {
  history.push({ t: Date.now(), ...ev });
  fs.mkdirSync(app.getPath('userData'), { recursive: true });
  fs.writeFileSync(dataFile('history.json'), JSON.stringify(history));
}

// Valida antes de salvar: o que vem da tela de configuração não é confiável por padrão
function validate(c) {
  const hhmm = /^([01]\d|2[0-3]):[0-5]\d$/;
  if (!hhmm.test(c.start) || !hhmm.test(c.end)) return { ok: false, error: 'Horário inválido' };
  if (toM(c.start) >= toM(c.end)) return { ok: false, error: 'O início precisa ser antes do fim' };
  const iv = Number(c.iv);
  if (!(iv >= 5 && iv <= 480)) return { ok: false, error: 'Intervalo entre 5 e 480 minutos' };
  const goalMl = Number(c.goalMl);
  if (!(goalMl >= 500 && goalMl <= 6000)) return { ok: false, error: 'Meta entre 500 e 6000 ml' };
  if (!Array.isArray(c.days) || c.days.length !== 7) return { ok: false, error: 'Dias inválidos' };
  if (!c.days.some(Boolean)) return { ok: false, error: 'Escolha pelo menos um dia' };

  // Bater ponto: CLT precisa de pelo menos 4 batidas; sem CLT, pelo menos 2
  const p = c.ponto || {};
  const pTimes = Array.isArray(p.times) ? p.times : [];
  if (pTimes.some(t => !hhmm.test(t))) return { ok: false, error: 'Horário do ponto inválido' };
  const times = [...new Set(pTimes)].sort((a, b) => toM(a) - toM(b));
  const leadMin = Number(p.leadMin);
  if (!(leadMin >= 0 && leadMin <= 30)) return { ok: false, error: 'Aviso do ponto entre 0 e 30 minutos' };
  if (!Array.isArray(p.days) || p.days.length !== 7) return { ok: false, error: 'Dias do ponto inválidos' };
  const pDays = p.days.map(Boolean);
  if (p.enabled) {
    const min = p.clt ? 4 : 2;
    if (times.length < min || times.length > 10) return { ok: false, error: `Ponto: informe de ${min} a 10 horários` };
    if (!pDays.some(Boolean)) return { ok: false, error: 'Escolha pelo menos um dia para o ponto' };
  }

  return {
    ok: true,
    cfg: {
      start: c.start, end: c.end, iv, goalMl, days: c.days.map(Boolean),
      autostart: !!c.autostart, sound: c.sound !== false, visual: c.visual !== false,
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
      '[Desktop Entry]', 'Type=Application', 'Name=Água',
      'Comment=Lembrete para beber água e bater o ponto',
      `Exec=${exec} --background`, 'Terminal=false', 'X-GNOME-Autostart-enabled=true', ''
    ].join('\n'));
    return;
  }
  app.setLoginItemSettings({ openAtLogin: on, args: ['--background'] });
}

let tray = null;
let alertWin = null;
let alertCtx = { real: false, ponto: null }; // o que o alerta aberto representa
const pendingAlerts = []; // alertas que chegaram enquanto outro estava aberto
let mainWin = null;
let snoozeTimer = null;
const firedKeys = new Set(); // lembretes já disparados hoje
let firedDay = '';

// real = lembrete de água de verdade (conta no histórico); teste não entra nas métricas.
// ponto = horário da marcação (quando é alerta de bater ponto); não entra no histórico de água.
// Se já há um alerta aberto, este entra na fila e abre quando o atual fechar.
function openAlert(real = false, ponto = null) {
  if (alertWin) {
    if (!pendingAlerts.some(p => p.real === real && p.ponto === ponto)) pendingAlerts.push({ real, ponto });
    return;
  }
  alertCtx = { real, ponto };
  const b = screen.getDisplayNearestPoint(screen.getCursorScreenPoint()).bounds;
  // "tela cheia" desligado: janela pequena centralizada, ainda por cima das outras
  const size = CFG.visual
    ? { x: b.x, y: b.y, width: b.width, height: b.height }
    : { x: b.x + Math.round((b.width - 480) / 2), y: b.y + Math.round((b.height - 600) / 2), width: 480, height: 600 };
  alertWin = new BrowserWindow({
    ...size, frame: false, alwaysOnTop: true, skipTaskbar: true, resizable: false, movable: false,
    show: false, backgroundColor: '#ffffff',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });
  alertWin.setAlwaysOnTop(true, 'screen-saver');
  const query = { sound: CFG.sound ? '1' : '0' };
  if (ponto) query.ponto = ponto;
  alertWin.loadFile(path.join(__dirname, 'alert.html'), { query });
  alertWin.once('ready-to-show', () => { alertWin.show(); alertWin.focus(); });
  alertWin.on('closed', () => {
    alertWin = null;
    const next = pendingAlerts.shift();
    if (next) openAlert(next.real, next.ponto);
  });
}

function closeAlert() {
  if (alertWin) alertWin.close();
}

// Janela única: Hoje, Relatórios e Configurações ficam juntas, com menu lateral
function openMain() {
  if (mainWin) { mainWin.show(); mainWin.focus(); return; }
  mainWin = new BrowserWindow({
    width: 1120, height: 760, minWidth: 880, minHeight: 600, title: 'Água', autoHideMenuBar: true,
    backgroundColor: '#f5f5f5',
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
}

function createTray() {
  tray = new Tray(nativeImage.createFromPath(path.join(__dirname, 'tray.png')));
  tray.setToolTip('Água');
  tray.setContextMenu(Menu.buildFromTemplate([
    { label: 'Abrir', click: openMain },
    { label: 'Testar alerta', click: () => openAlert(false) },
    { type: 'separator' },
    { label: 'Sair', click: () => app.quit() }
  ]));
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
  try { applyAutostart(r.cfg.autostart); } catch (e) { return { ok: false, error: 'Não consegui ajustar a inicialização automática' }; }
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

// Abrir o app de novo (ícone no menu de apps ou npm start) mostra a janela
app.on('second-instance', openMain);

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.whenReady().then(() => {
    loadConfig();
    loadHistory();
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
