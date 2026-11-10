// Registro de horas (check-in/check-out): funções puras, sem Electron, para dar para testar com node.
// Uma sessão é { id, start, end, note }, com start/end em milissegundos e end = null enquanto está aberta.

const pad = n => String(n).padStart(2, '0');

function inMonth(s, year, month) {
  const d = new Date(s.start);
  return d.getFullYear() === year && d.getMonth() === month;
}

// 125 min → "02:05"; passa de 24h sem virar o dia ("160:30" no total do mês)
function hhmm(ms) {
  const min = Math.round(ms / 60000);
  return `${pad(Math.floor(min / 60))}:${pad(min % 60)}`;
}

// Monta o lançamento manual a partir de data (AAAA-MM-DD) e horários (HH:MM) no fuso local
function manualSession(date, start, end, note) {
  const dm = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(date));
  const tm = t => /^([01]\d|2[0-3]):([0-5]\d)$/.exec(String(t));
  if (!dm) return { error: 'err.timeDate' };
  const a = tm(start), b = tm(end);
  if (!a || !b) return { error: 'err.time' };
  const [y, mo, d] = [+dm[1], +dm[2] - 1, +dm[3]];
  const s = new Date(y, mo, d, +a[1], +a[2]).getTime();
  const e = new Date(y, mo, d, +b[1], +b[2]).getTime();
  if (new Date(s).getDate() !== d) return { error: 'err.timeDate' }; // ex.: 31/02
  if (e <= s) return { error: 'err.timeOrder' };
  return { start: s, end: e, note: String(note || '').slice(0, 300) };
}

// CSV do mês: separador e decimal no jeito do idioma (Excel em pt/es usa ";" e ","),
// com BOM para os acentos abrirem certos no Excel. Sessões abertas ficam de fora.
function buildCsv(sessions, year, month, lang, labels) {
  const sep = lang === 'en-US' ? ',' : ';';
  const dec = lang === 'en-US' ? '.' : ',';
  // aspas só quando o campo tem o separador em uso, aspas ou quebra de linha ("4,00" continua número no Excel pt)
  const q = v => { const s = String(v); return (s.includes(sep) || /["\r\n]/.test(s)) ? '"' + s.replace(/"/g, '""') + '"' : s; };
  const time = t => { const d = new Date(t); return `${pad(d.getHours())}:${pad(d.getMinutes())}`; };
  const date = t => new Date(t).toLocaleDateString(lang, { day: '2-digit', month: '2-digit', year: 'numeric' });
  const hours = ms => (ms / 3600000).toFixed(2).replace('.', dec);

  const rows = sessions.filter(s => s.end !== null && inMonth(s, year, month)).sort((a, b) => a.start - b.start);
  const lines = [[labels.date, labels.in, labels.out, labels.dur, labels.hours, labels.note].map(q).join(sep)];
  let total = 0;
  for (const s of rows) {
    const ms = s.end - s.start;
    total += ms;
    lines.push([date(s.start), time(s.start), time(s.end), hhmm(ms), hours(ms), s.note || ''].map(q).join(sep));
  }
  lines.push([labels.total, '', '', hhmm(total), hours(total), ''].map(q).join(sep));
  return '﻿' + lines.join('\r\n') + '\r\n';
}

module.exports = { inMonth, hhmm, manualSession, buildCsv };

// Checagem rápida: node timesheet.js
if (require.main === module) {
  const assert = require('assert');
  const at = (d, h, m) => new Date(2026, 10, d, h, m).getTime();
  const S = [
    { id: 'a', start: at(3, 8, 0), end: at(3, 12, 0), note: 'Reunião; planejamento' },
    { id: 'b', start: at(3, 13, 0), end: at(3, 17, 30), note: 'Diz "ok"' },
    { id: 'c', start: at(4, 9, 0), end: null, note: '' },                                // aberta: fora do CSV
    { id: 'd', start: new Date(2026, 9, 31, 9, 0).getTime(), end: new Date(2026, 9, 31, 10, 0).getTime(), note: '' } // outubro
  ];
  const L = { date: 'Data', in: 'Entrada', out: 'Saída', dur: 'Duração', hours: 'Horas (decimal)', note: 'Anotação', total: 'Total' };
  const pt = buildCsv(S, 2026, 10, 'pt-BR', L).replace('﻿', '').trim().split('\r\n');
  assert.strictEqual(pt.length, 4);                                  // cabeçalho + 2 sessões + total
  assert.strictEqual(pt[1], '03/11/2026;08:00;12:00;04:00;4,00;"Reunião; planejamento"');
  assert.strictEqual(pt[2], '03/11/2026;13:00;17:30;04:30;4,50;"Diz ""ok"""');
  assert.strictEqual(pt[3], 'Total;;;08:30;8,50;');
  const en = buildCsv(S, 2026, 10, 'en-US', L).trim().split('\r\n');
  assert.strictEqual(en[1], '11/03/2026,08:00,12:00,04:00,4.00,Reunião; planejamento'); // ";" não é o separador aqui
  assert.strictEqual(buildCsv([{ start: at(5, 8, 0), end: at(5, 9, 0), note: 'a, b' }], 2026, 10, 'en-US', L).split('\r\n')[1].endsWith(',"a, b"'), true);
  assert.strictEqual(hhmm(160.5 * 3600000), '160:30');
  assert.deepStrictEqual(manualSession('2026-11-05', '18:00', '09:00').error, 'err.timeOrder');
  assert.deepStrictEqual(manualSession('2026-02-31', '08:00', '09:00').error, 'err.timeDate');
  assert.strictEqual(manualSession('2026-11-05', '08:00', '09:15', 'x').end - manualSession('2026-11-05', '08:00', '09:15').start, 75 * 60000);
  console.log('timesheet OK');
}
