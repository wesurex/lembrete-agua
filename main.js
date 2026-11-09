const { app, BrowserWindow, Tray, Menu, nativeImage, ipcMain, screen } = require('electron');
const path = require('path');
const fs = require('fs');

const DEFAULTS = {
  start: '06:30', end: '16:18', iv: 60, goalMl: 2500,
  days: [false, true, true, true, true, true, false],
  ponto: { enabled: false, clt: true, times: ['08:00', '12:00', '13:00', '17:00'], leadMin: 5, days: [false, true, true, true, true, true, false] }
};
const SNOOZE_MS = 10 * 60 * 1000;
const PONTO_SNOOZE_MS = 5 * 60 * 1000;
const GLASS_ML = 250;

let CFG = { ...DEFAULTS };
let history = []; // eventos: { t, type: 'fired' | 'drink', ml?, fromAlert? }
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
      ponto: { enabled: !!p.enabled, clt: !!p.clt, times, leadMin, days: pDays }
    }
  };
}

// Resumo por dia para o calendário: ml bebido, copos, lembretes disparados, atendidos e perdidos
function daySummary() {
  const out = {};
  for (const e of history) {
    const d = new Date(e.t);
    const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    if (!out[k]) out[k] = { ml: 0, drinks: 0, fired: 0, atendidos: 0, missed: 0 };
    if (e.type === 'fired') out[k].fired++;
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

let tray = null;
let alertWin = null;
let alertCtx = { real: false, ponto: null }; // o que o alerta aberto representa
let mainWin = null;
let lastFire = -1;
let lastPonto = -1;
let snoozeTimer = null;

// real = lembrete de água de verdade (conta no histórico); teste não entra nas métricas.
// ponto = horário da marcação (quando é alerta de bater ponto); não entra no histórico de água.
function openAlert(real = false, ponto = null) {
  if (alertWin) return;
  alertCtx = { real, ponto };
  const { bounds } = screen.getDisplayNearestPoint(screen.getCursorScreenPoint());
  alertWin = new BrowserWindow({
    x: bounds.x, y: bounds.y, width: bounds.width, height: bounds.height,
    frame: false, alwaysOnTop: true, skipTaskbar: true, resizable: false, movable: false,
    show: false, backgroundColor: '#ffffff',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });
  alertWin.setAlwaysOnTop(true, 'screen-saver');
  alertWin.loadFile(path.join(__dirname, 'alert.html'), { query: ponto ? { ponto } : {} });
  alertWin.once('ready-to-show', () => { alertWin.show(); alertWin.focus(); });
  alertWin.on('closed', () => { alertWin = null; });
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

// Checa a cada 15 s. lastFire / lastPonto evitam repetir no mesmo minuto.
// Limitação do protótipo: se um alerta já está aberto, o outro é descartado.
function tick() {
  const d = new Date();
  const m = d.getHours() * 60 + d.getMinutes();
  if (CFG.days[d.getDay()] && todayTimes().includes(m) && lastFire !== m) {
    lastFire = m;
    record({ type: 'fired' });
    openAlert(true);
  }
  if (CFG.ponto.enabled && CFG.ponto.days[d.getDay()]) {
    const hit = CFG.ponto.times.find(t => toM(t) - CFG.ponto.leadMin === m);
    if (hit && lastPonto !== m) {
      lastPonto = m;
      openAlert(false, hit);
    }
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

ipcMain.handle('config:get', () => CFG);
ipcMain.handle('config:save', (_e, c) => {
  const r = validate(c);
  if (!r.ok) return r;
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

// Abrir o app de novo (ícone no menu de apps ou npm start) mostra a janela; no Ubuntu é o "duplo clique" possível
app.on('second-instance', openMain);

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.whenReady().then(() => {
    loadConfig();
    loadHistory();
    createTray();
    setInterval(tick, 15000);
    if (process.argv.includes('--test')) setTimeout(() => openAlert(false), 1500);
    // Abre a janela ao iniciar; --background só deixa na bandeja (uso futuro, com inicialização automática)
    if (!process.argv.includes('--background')) openMain();
  });
  // Fica em segundo plano: fechar a janela não encerra o app (só o "Sair" da bandeja)
  app.on('window-all-closed', () => {});
}
