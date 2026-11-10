// Agenda (compromissos) e tarefas: funções puras, sem Electron, para dar para testar com node.
// Compromisso: { id, title, date: 'AAAA-MM-DD', time: 'HH:MM', leadMin, note }
// Tarefa diária: { id, title, kind: 'daily', doneDates: ['AAAA-MM-DD', ...] }  (desmarca sozinha no dia seguinte)
// Tarefa pontual: { id, title, kind: 'once', due: 'AAAA-MM-DD' | '', done, doneAt }

const LEADS = [0, 5, 10, 15, 30, 60];
const pad = n => String(n).padStart(2, '0');
const dayKey = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const clean = (s, max) => String(s == null ? '' : s).trim().slice(0, max);

function validDate(s) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(s));
  if (!m) return false;
  const d = new Date(+m[1], +m[2] - 1, +m[3]);
  return d.getMonth() === +m[2] - 1 && d.getDate() === +m[3]; // recusa 31/02
}
const validTime = s => /^([01]\d|2[0-3]):[0-5]\d$/.test(String(s));

// Valida o que veio da tela; devolve o compromisso limpo ou { error: chave do dicionário }
function makeEvent(e) {
  e = e || {};
  const title = clean(e.title, 120);
  if (!title) return { error: 'err.titleReq' };
  if (!validDate(e.date)) return { error: 'err.timeDate' };
  if (!validTime(e.time)) return { error: 'err.time' };
  const leadMin = Number(e.leadMin);
  if (!LEADS.includes(leadMin)) return { error: 'err.lead' };
  return { title, date: e.date, time: e.time, leadMin, note: clean(e.note, 300) };
}

function makeTask(t) {
  t = t || {};
  const title = clean(t.title, 120);
  if (!title) return { error: 'err.titleReq' };
  if (t.kind === 'daily') return { title, kind: 'daily', doneDates: [] };
  if (t.kind !== 'once') return { error: 'err.kind' };
  const due = t.due ? String(t.due) : '';
  if (due && !validDate(due)) return { error: 'err.timeDate' };
  return { title, kind: 'once', due, done: false, doneAt: null };
}

// Marca/desmarca: a diária vale só para o dia de hoje; a pontual fica concluída de vez
function toggleTask(task, todayKey, now = Date.now()) {
  if (task.kind === 'daily') {
    const i = task.doneDates.indexOf(todayKey);
    if (i >= 0) task.doneDates.splice(i, 1); else task.doneDates.push(todayKey);
    task.doneDates = task.doneDates.slice(-90); // guarda só os últimos 90 dias
  } else {
    task.done = !task.done;
    task.doneAt = task.done ? now : null;
  }
  return task;
}

// Momento do aviso (hora do compromisso menos a antecedência), em milissegundos
function alertAt(e) {
  const [y, mo, d] = e.date.split('-').map(Number);
  const [h, mi] = e.time.split(':').map(Number);
  return new Date(y, mo - 1, d, h, mi).getTime() - e.leadMin * 60000;
}
// Compromissos cujo aviso cai agora (janela de 2 min, para cobrir atraso do relógio de checagem)
function dueEvents(events, now) {
  const t = now.getTime();
  return events.filter(e => { const a = alertAt(e); return t >= a && t < a + 120000; });
}

module.exports = { LEADS, dayKey, validDate, makeEvent, makeTask, toggleTask, alertAt, dueEvents };

// Checagem rápida: node planner.js
if (require.main === module) {
  const assert = require('assert');
  const ok = makeEvent({ title: '  Dentista ', date: '2026-11-12', time: '14:30', leadMin: 30, note: 'levar exame' });
  assert.deepStrictEqual(ok, { title: 'Dentista', date: '2026-11-12', time: '14:30', leadMin: 30, note: 'levar exame' });
  assert.strictEqual(makeEvent({ title: ' ', date: '2026-11-12', time: '14:30', leadMin: 0 }).error, 'err.titleReq');
  assert.strictEqual(makeEvent({ title: 'x', date: '2026-02-31', time: '14:30', leadMin: 0 }).error, 'err.timeDate');
  assert.strictEqual(makeEvent({ title: 'x', date: '2026-11-12', time: '25:00', leadMin: 0 }).error, 'err.time');
  assert.strictEqual(makeEvent({ title: 'x', date: '2026-11-12', time: '10:00', leadMin: 7 }).error, 'err.lead');

  // aviso 30 min antes das 14:30 → dispara entre 14:00 e 14:02
  const ev = { id: 'e', ...ok };
  assert.strictEqual(dueEvents([ev], new Date(2026, 10, 12, 13, 59, 30)).length, 0);
  assert.strictEqual(dueEvents([ev], new Date(2026, 10, 12, 14, 0, 10)).length, 1);
  assert.strictEqual(dueEvents([ev], new Date(2026, 10, 12, 14, 2, 0)).length, 0);
  // compromisso 00:30 com aviso de 1 h → avisa às 23:30 do dia anterior
  const midnight = { id: 'm', title: 'Plantão', date: '2026-11-13', time: '00:30', leadMin: 60, note: '' };
  assert.strictEqual(dueEvents([midnight], new Date(2026, 10, 12, 23, 30, 20)).length, 1);

  const daily = { id: 'd', ...makeTask({ title: 'Alongar', kind: 'daily' }) };
  toggleTask(daily, '2026-11-10');
  assert.deepStrictEqual(daily.doneDates, ['2026-11-10']);
  assert.ok(!daily.doneDates.includes('2026-11-11')); // dia seguinte começa desmarcada
  toggleTask(daily, '2026-11-10');
  assert.deepStrictEqual(daily.doneDates, []);

  const once = { id: 'o', ...makeTask({ title: 'Pagar boleto', kind: 'once', due: '2026-11-15' }) };
  toggleTask(once, '2026-11-10', 123);
  assert.deepStrictEqual([once.done, once.doneAt], [true, 123]);
  assert.strictEqual(makeTask({ title: 'x', kind: 'once', due: '2026-13-01' }).error, 'err.timeDate');
  assert.strictEqual(makeTask({ title: 'x', kind: 'weekly' }).error, 'err.kind');
  console.log('planner OK');
}
