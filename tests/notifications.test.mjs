import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = fs.readFileSync(path.join(repoRoot, 'js', 'notifications.js'), 'utf8');
const storage = new Map();
const calls = { fetch: [], localSchedules: [], channels: [], listeners: {} };

const localStorage = {
  getItem: (key) => storage.get(key) ?? null,
  setItem: (key, value) => storage.set(key, String(value)),
  removeItem: (key) => storage.delete(key),
};

const PushNotifications = {
  async checkPermissions() { return { receive: 'granted' }; },
  async requestPermissions() { return { receive: 'granted' }; },
  async register() {
    if (calls.listeners.registration) await calls.listeners.registration({ value: 'token-abc' });
  },
  addListener(name, listener) { calls.listeners[name] = listener; },
};

const LocalNotifications = {
  async checkPermissions() { return { display: 'granted' }; },
  async requestPermissions() { return { display: 'granted' }; },
  async checkExactNotificationSetting() { return 'granted'; },
  async createChannel(channel) { calls.channels.push(channel); },
  async schedule(payload) { calls.localSchedules.push(payload.notifications); },
  addListener() {},
};

const window = {
  __app: { State: { farmId: '42', rawFarm: { farm: {} } } },
  Capacitor: {
    isNativePlatform: () => true,
    Plugins: { PushNotifications, LocalNotifications },
  },
  atob: (value) => Buffer.from(value, 'base64').toString('binary'),
};
window.window = window;

const context = {
  window,
  localStorage,
  console,
  alert() {},
  fetch: async (url, options) => {
    calls.fetch.push({ url, options });
    return { ok: true, status: 201, text: async () => '' };
  },
  setTimeout,
  clearTimeout,
  Date,
  Math,
  Number,
  String,
  Boolean,
  JSON,
  Set,
  Uint8Array,
  btoa: (value) => Buffer.from(value, 'binary').toString('base64'),
};

vm.createContext(context);
vm.runInContext(source, context, { filename: 'notifications.js' });
const engine = window.__app.Notifications;

assert.equal(await engine.setPref('master', true), true, 'a ativação nativa deve ser bem-sucedida');
assert.equal(engine.prefs.master, true, 'a preferência principal deve permanecer ativa');
assert.equal(storage.get('sfl_fcm_token'), 'token-abc', 'o token FCM precisa ser persistido');
assert.ok(calls.channels.some((channel) => channel.id === 'sfl-farm-ready'), 'o canal Android deve ser criado');
assert.ok(calls.fetch.some((call) => call.url.includes('push_subscriptions')), 'a inscrição FCM deve ser enviada ao backend');

calls.fetch.length = 0;
calls.localSchedules.length = 0;
await engine.scheduleToSupabase({
  crops: [{ id: 'crop-1', name: 'Sunflower', msLeft: 60_000 }],
  greenhouse: [{ id: 'green-1', name: 'Greenhouse Crop', msLeft: 60_000 }],
  buildings: [{ id: 'building-1', name: 'Bakery', msLeft: 60_000 }],
  cropMachine: [{ id: 'machine-1', name: 'Crop Machine', msLeft: 60_000 }],
  crabTraps: [{ id: 'crab-1', name: 'Crab Trap', msLeft: 60_000 }],
  shrines: [{ id: 'shrine-1', name: 'Trading Shrine', msLeft: 60_000 }],
  agingShed: [{ id: 'aging-1', name: 'Aged Fish', msLeft: 60_000 }],
  saltFarm: [{ id: 'salt-1', name: 'Salt Node', msLeft: 60_000 }],
  deliveries: [{ id: 'delivery-1', name: 'New Delivery', msLeft: 60_000 }],
  oil: [{ id: 'oil-1', name: 'Oil Reserve', msLeft: 60_000 }],
});

const agendaCall = calls.fetch.find((call) => call.url.includes('farm_schedules'));
assert.ok(agendaCall, 'uma agenda deve ser enviada ao backend');
const agenda = JSON.parse(agendaCall.options.body);
assert.deepEqual(
  new Set(agenda.map((item) => item.item_category)),
  new Set(['crops', 'greenhouse', 'buildings', 'cropMachine', 'crabTraps', 'shrines', 'agingShed', 'saltFarm', 'deliveries', 'oil']),
  'todas as categorias avançadas devem ser agendadas',
);
assert.equal(calls.localSchedules.at(-1).length, 10, 'a agenda local deve conter todos os eventos futuros');

console.log('Notification engine tests passed.');
