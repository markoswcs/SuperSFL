/**
 * Notifications Engine for Super Sunflower Land
 * Handles FCM (native Android) and Web Push (browser)
 */

window.__app = window.__app || {};

const DEFAULT_PREFS = {
  master: false,
  crops: true,
  animals: true,
  fruits: true,
  trees: true,
  rocks: true,
  beehives: true,
  flowers: true,
  oil: true,
  composting: true,
  greenhouse: true,
  buildings: true,
  cropMachine: true,
  crabTraps: true,
  shrines: true,
  agingShed: true,
  saltFarm: true,
  deliveries: true,
  market: true,
  dailyReset: true
};

const SUPABASE_URL = 'https://ykbpkhsrxtnnisnorwhd.supabase.co';
const SUPABASE_ANON = 'sb_publishable_Txki7crNaFMuqseK9G6JKw_aR4TsulA';
const VAPID_PUBLIC = 'BIyHzQRluCO6jIO6cifQJLbiVoZyPo9EH3Cmb-VQ78MSBkeRgPE87sc43aK4D8sIZlYwAmGY13fUt-c19GvpEpo';

class NotificationEngine {
  constructor() {
    this.prefs = { ...DEFAULT_PREFS };
    this.notifiedIds = this.loadNotifiedIds();
    this.isFirstRun = true;
    this.hasPermission = false;
    this.loadPrefs();
  }

  loadNotifiedIds() {
    try {
      const arr = JSON.parse(localStorage.getItem('sfl_notified_ids') || '[]');
      return new Set(arr);
    } catch(e) {
      return new Set();
    }
  }

  saveNotifiedIds() {
    localStorage.setItem('sfl_notified_ids', JSON.stringify([...this.notifiedIds]));
  }

  loadPrefs() {
    try {
      const saved = localStorage.getItem('sfl_notify_prefs');
      if (saved) {
        this.prefs = { ...DEFAULT_PREFS, ...JSON.parse(saved) };
      }
    } catch(e) {
      console.error('Failed to load notification prefs', e);
    }
  }

  savePrefs() {
    localStorage.setItem('sfl_notify_prefs', JSON.stringify(this.prefs));
  }

  setPref(key, value) {
    this.prefs[key] = value;
    this.savePrefs();

    if (key === 'master' && value === true) {
      this.requestPermission();
    } else if (key === 'master' && value === false) {
      this.disablePush();
    } else {
      this.syncPrefsToSupabase();
    }

    if (window.__app && window.__app.ui) {
      window.__app.ui.renderNotificationSettings();
    }
  }

  async syncPrefsToSupabase() {
    if (!this.prefs.master) return;
    const farmId = window.__app && window.__app.State && window.__app.State.farmId;
    if (!farmId) return;

    try {
      await fetch(SUPABASE_URL + '/rest/v1/push_subscriptions?farm_id=eq.' + farmId, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON,
          'Authorization': 'Bearer ' + SUPABASE_ANON
        },
        body: JSON.stringify({ preferences: this.prefs })
      });
    } catch(e) {
      console.error('Erro ao sincronizar prefs', e);
    }
  }

  urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  // ─────────────────────────────────────────────
  // REQUEST PERMISSION
  // ─────────────────────────────────────────────
  async requestPermission() {
    const isNative = window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform();

    if (isNative) {
      return this._requestFCMPermission();
    } else {
      return this._requestWebPushPermission();
    }
  }

  async _requestFCMPermission() {
    try {
      const PushNotifications = window.Capacitor.Plugins.PushNotifications;
      if (!PushNotifications) {
        console.error('PushNotifications plugin not available');
        return false;
      }

      let perm = await PushNotifications.checkPermissions();
      if (perm.receive !== 'granted') {
        perm = await PushNotifications.requestPermissions();
      }

      if (perm.receive !== 'granted') {
        alert('Por favor, ative as notificacoes nas configuracoes do celular para o SFL Pro.');
        this.setPref('master', false);
        return false;
      }

      await PushNotifications.register();

      return new Promise((resolve) => {
        if (!this._registrationListenerAdded) {
          this._registrationListenerAdded = true;
          PushNotifications.addListener('registration', async (token) => {
            console.log('FCM Token:', token.value);
            this.hasPermission = true;

            const farmId = window.__app && window.__app.State && window.__app.State.farmId;
            if (farmId) {
              try {
                await fetch(SUPABASE_URL + '/rest/v1/push_subscriptions?on_conflict=farm_id', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'apikey': SUPABASE_ANON,
                    'Authorization': 'Bearer ' + SUPABASE_ANON,
                    'Prefer': 'resolution=merge-duplicates'
                  },
                  body: JSON.stringify({
                    farm_id: farmId,
                    endpoint: 'fcm://' + token.value,
                    p256dh: '',
                    auth: '',
                    preferences: this.prefs
                  })
                });
                console.log('FCM subscription salva no Supabase!');
              } catch(e) {
                console.error('Erro ao salvar FCM token:', e);
              }
            }

            this.sendPush('SFL Pro Ativado!', { body: 'Voce recebera alertas mesmo com o app fechado!' });
            resolve(true);
          });
        } else {
          // If already listening, it will trigger from the register() call above.
          // We can just resolve immediately since they already have permission.
          resolve(true);
        }

        PushNotifications.addListener('registrationError', (error) => {
          console.error('Push register error:', error);
          resolve(false);
        });
      });

    } catch(e) {
      console.error('Erro ao pedir permissao nativa:', e);
      this.setPref('master', false);
      return false;
    }
  }

  async _requestWebPushPermission() {
    if (!('Notification' in window) || !('serviceWorker' in navigator)) {
      alert('Seu navegador nao suporta notificacoes push.');
      this.setPref('master', false);
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        this.setPref('master', false);
        alert('Por favor, ative as notificacoes nas configuracoes do navegador para o SFL Pro.');
        return false;
      }

      const registration = await navigator.serviceWorker.ready;
      let subscription = await registration.pushManager.getSubscription();
      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: this.urlBase64ToUint8Array(VAPID_PUBLIC)
        });
      }

      const p256dh = btoa(String.fromCharCode.apply(null, new Uint8Array(subscription.getKey('p256dh'))));
      const auth = btoa(String.fromCharCode.apply(null, new Uint8Array(subscription.getKey('auth'))));

      const farmId = window.__app && window.__app.State && window.__app.State.farmId;
      if (!farmId) {
        alert('Primeiro carregue sua fazenda antes de ativar as notificacoes!');
        this.setPref('master', false);
        return false;
      }

      await fetch(SUPABASE_URL + '/rest/v1/push_subscriptions?on_conflict=farm_id', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON,
          'Authorization': 'Bearer ' + SUPABASE_ANON,
          'Prefer': 'resolution=merge-duplicates'
        },
        body: JSON.stringify({
          farm_id: farmId,
          endpoint: subscription.endpoint,
          p256dh: p256dh,
          auth: auth,
          preferences: this.prefs
        })
      });

      this.hasPermission = true;
      this.sendPush('SFL Pro Ativado!', { body: 'Voce recebera alertas 24/7 mesmo com o navegador fechado!' });
      return true;

    } catch(e) {
      console.error('Erro ao registrar Web Push:', e);
      this.setPref('master', false);
      return false;
    }
  }

  // ─────────────────────────────────────────────
  // DISABLE PUSH
  // ─────────────────────────────────────────────
  async disablePush() {
    const farmId = window.__app && window.__app.State && window.__app.State.farmId;
    if (!farmId) return;

    try {
      await fetch(SUPABASE_URL + '/rest/v1/push_subscriptions?farm_id=eq.' + farmId, {
        method: 'DELETE',
        headers: {
          'apikey': SUPABASE_ANON,
          'Authorization': 'Bearer ' + SUPABASE_ANON
        }
      });
    } catch(e) {
      console.error('Erro ao remover inscricao:', e);
    }

    this.hasPermission = false;
  }

  // ─────────────────────────────────────────────
  // LOCAL PUSH (for foreground feedback only)
  // ─────────────────────────────────────────────
  sendPush(title, options) {
    const isNative = window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform();
    if (isNative) {
      const LocalNotifications = window.Capacitor.Plugins.LocalNotifications;
      if (LocalNotifications) {
        LocalNotifications.schedule({
          notifications: [{
            id: Math.floor(Math.random() * 100000),
            title: title,
            body: options.body || '',
            smallIcon: 'ic_stat_icon_config_sample',
            iconColor: '#FCD34D'
          }]
        }).catch(e => console.warn('LocalNotification error:', e));
      }
    } else if ('Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(title, {
          body: options.body || '',
          icon: '/icons/icon-192.png',
          ...options
        });
      } catch(e) {
        console.warn('Notification error:', e);
      }
    }
  }

  // ─────────────────────────────────────────────
  // SCHEDULE - sends data to Supabase for the 24/7 robot
  // ─────────────────────────────────────────────
  async scheduleToSupabase(parsedFarm) {
    if (!this.prefs.master) return;
    const now = Date.now();
    const farmId = parseInt(window.__app && window.__app.State && window.__app.State.farmId, 10);
    if (!farmId) return;

    // Use raw farm data (Object.entries format) for scheduling
    const rawState = window.__app && window.__app.State && window.__app.State.rawFarm;
    const f = rawState ? (rawState.farm || rawState) : null;
    if (!f) {
      console.warn('[Notif] No raw farm data for scheduling');
      return;
    }

    const schedules = [];

    const addSchedule = (itemId, itemName, category, readyAtMs) => {
      if (!this.prefs[category]) return;
      if (readyAtMs && readyAtMs > now) {
        schedules.push({
          farm_id: farmId,
          item_id: String(itemId),
          item_name: itemName,
          item_category: category,
          ready_at: new Date(readyAtMs).toISOString(),
          notification_sent: false
        });

        // Também agendar localmente no aparelho (Android/iOS)
        if (window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform()) {
          const LocalNotifications = window.Capacitor.Plugins.LocalNotifications;
          if (LocalNotifications) {
            // Criar ID numérico determinístico para evitar duplicação local
            const strId = String(itemId);
            let numId = 0;
            for(let i=0; i<strId.length; i++) numId += strId.charCodeAt(i);
            numId += Math.floor(readyAtMs / 100000);
            
            LocalNotifications.schedule({
              notifications: [{
                id: numId % 2147483647,
                title: 'SFL Pro: ' + itemName,
                body: 'Seu(ua) ' + itemName + ' está pronto(a)!',
                schedule: { at: new Date(readyAtMs) },
                smallIcon: 'ic_stat_icon_config_sample',
                iconColor: '#FCD34D'
              }]
            }).catch(() => {});
          }
        }
      }
    };

    try {
      // Crops (raw format: { id: { crop: { name, plantedAt }, ... } })
      if (f.crops) {
        for (const [id, plot] of Object.entries(f.crops)) {
          const crop = plot.crop;
          if (crop && crop.plantedAt && crop.name) {
            const growTime = this._getCropGrowTime(crop.name);
            if (growTime) addSchedule('crop_' + id, crop.name, 'crops', crop.plantedAt + growTime);
          }
        }
      }

      // Fruit patches (raw format: { id: { fruit: { name, plantedAt }, ... } })
      if (f.fruitPatches) {
        for (const [id, patch] of Object.entries(f.fruitPatches)) {
          const fruit = patch.fruit;
          if (fruit && fruit.plantedAt && fruit.name) {
            const growTime = this._getFruitGrowTime(fruit.name);
            if (growTime) addSchedule('fruit_' + id, fruit.name, 'fruits', fruit.plantedAt + growTime);
          }
        }
      }

      // Trees (raw format: { id: { wood: { choppedAt }, ... } })
      if (f.trees) {
        for (const [id, tree] of Object.entries(f.trees)) {
          if (tree && tree.wood && tree.wood.choppedAt) {
            addSchedule('tree_' + id, 'Árvore (Madeira)', 'trees', tree.wood.choppedAt + (4 * 60 * 60 * 1000));
          }
        }
      }

      // Stones (raw: { id: { rock: { minedAt } } })
      if (f.stones) {
        for (const [id, stone] of Object.entries(f.stones)) {
          if (stone && stone.rock && stone.rock.minedAt) {
            addSchedule('stone_' + id, 'Pedra', 'rocks', stone.rock.minedAt + (4 * 60 * 60 * 1000));
          }
        }
      }

      // Iron
      if (f.iron) {
        for (const [id, iron] of Object.entries(f.iron)) {
          if (iron && iron.rock && iron.rock.minedAt) {
            addSchedule('iron_' + id, 'Ferro', 'rocks', iron.rock.minedAt + (8 * 60 * 60 * 1000));
          }
        }
      }

      // Gold
      if (f.gold) {
        for (const [id, gold] of Object.entries(f.gold)) {
          if (gold && gold.rock && gold.rock.minedAt) {
            addSchedule('gold_' + id, 'Ouro', 'rocks', gold.rock.minedAt + (24 * 60 * 60 * 1000));
          }
        }
      }

      // Beehives
      if (f.beehives) {
        for (const [id, hive] of Object.entries(f.beehives)) {
          if (hive && hive.honey && hive.honey.updatedAt) {
            addSchedule('hive_' + id, 'Colmeia (Mel)', 'beehives', hive.honey.updatedAt + (24 * 60 * 60 * 1000));
          }
        }
      }

      // Flowers
      if (f.flowers && f.flowers.flowerBeds) {
        for (const [id, bed] of Object.entries(f.flowers.flowerBeds)) {
          if (bed && bed.flower && bed.flower.plantedAt && bed.flower.name) {
            addSchedule('flower_' + id, bed.flower.name, 'flowers', bed.flower.plantedAt + (24 * 60 * 60 * 1000));
          }
        }
      }

      // Animals (raw: henHouse.animals & barn.animals)
      const animalSources = [
        ...(f.henHouse?.animals ? Object.entries(f.henHouse.animals) : []),
        ...(f.barn?.animals ? Object.entries(f.barn.animals) : []),
        ...(f.animals ? Object.entries(f.animals) : []),
      ];
      for (const [id, animal] of animalSources) {
        if (animal && animal.awakeAt && animal.awakeAt > now) {
          const type = animal.type || 'Animal';
          addSchedule('animal_' + id, type, 'animals', animal.awakeAt);
        }
      }

    } catch(e) {
      console.error('[Notif] Erro ao montar schedules:', e);
    }

    if (schedules.length === 0) {
      console.log('[Notif] Nenhum agendamento futuro.');
      return;
    }

    try {
      const resp = await fetch(SUPABASE_URL + '/rest/v1/farm_schedules?on_conflict=farm_id,item_id', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON,
          'Authorization': 'Bearer ' + SUPABASE_ANON,
          'Prefer': 'resolution=merge-duplicates'
        },
        body: JSON.stringify(schedules)
      });
      console.log('[Notif] Schedules enviados ao Supabase:', schedules.length, '| Status:', resp.status);
    } catch(e) {
      console.error('[Notif] Erro ao enviar schedules:', e);
    }
  }


  _getCropGrowTime(name) {
    const times = {
      'Sunflower': 1 * 60 * 1000,
      'Potato': 5 * 60 * 1000,
      'Pumpkin': 30 * 60 * 1000,
      'Carrot': 60 * 60 * 1000,
      'Cabbage': 2 * 60 * 60 * 1000,
      'Soybean': 2 * 60 * 60 * 1000,
      'Beetroot': 8 * 60 * 60 * 1000,
      'Cauliflower': 8 * 60 * 60 * 1000,
      'Parsnip': 12 * 60 * 60 * 1000,
      'Radish': 24 * 60 * 60 * 1000,
      'Wheat': 24 * 60 * 60 * 1000,
      'Kale': 36 * 60 * 60 * 1000,
      'Blueberry': 24 * 60 * 60 * 1000,
      'Orange': 24 * 60 * 60 * 1000,
      'Apple': 24 * 60 * 60 * 1000,
      'Banana': 24 * 60 * 60 * 1000,
      'Lemon': 24 * 60 * 60 * 1000
    };
    return times[name] || null;
  }

  _getFruitGrowTime(name) {
    const times = {
      'Apple': 24 * 60 * 60 * 1000,
      'Blueberry': 24 * 60 * 60 * 1000,
      'Orange': 24 * 60 * 60 * 1000,
      'Banana': 24 * 60 * 60 * 1000,
      'Lemon': 24 * 60 * 60 * 1000,
      'Grape': 6 * 60 * 60 * 1000,
      'Tomato': 2 * 60 * 60 * 1000,
      'Strawberry': 12 * 60 * 60 * 1000
    };
    return times[name] || (24 * 60 * 60 * 1000);
  }

  // ─────────────────────────────────────────────
  // INIT
  // ─────────────────────────────────────────────
  init() {
    // Listen for incoming FCM notifications when app is in foreground
    const isNative = window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform();
    if (isNative) {
      const PushNotifications = window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.PushNotifications;
      if (PushNotifications) {
        PushNotifications.addListener('pushNotificationReceived', (notification) => {
          console.log('Push recebido em foreground:', notification);
        });
        PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
          console.log('Push clicado:', action);
        });
      }
    }

    console.log('NotificationEngine inicializado. Plataforma nativa:', isNative);
  }
}

// Instantiate globally
window.__app.Notifications = new NotificationEngine();
window.__app.Notifications.init();

console.log('notifications.js carregado com sucesso!');
