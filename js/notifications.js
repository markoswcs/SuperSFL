/**
 * Notifications Engine for SFL Pro.
 * Mantém uma inscrição remota para alertas 24/7 e uma agenda local como
 * redundância no Android/iOS quando o aplicativo está fechado.
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
  dailyReset: true,
  floatingIsland: true,
};

const SUPABASE_URL = 'https://ykbpkhsrxtnnisnorwhd.supabase.co';
const SUPABASE_ANON = 'sb_publishable_Txki7crNaFMuqseK9G6JKw_aR4TsulA';
const VAPID_PUBLIC = 'BIyHzQRluCO6jIO6cifQJLbiVoZyPo9EH3Cmb-VQ78MSBkeRgPE87sc43aK4D8sIZlYwAmGY13fUt-c19GvpEpo';
const LOCAL_CHANNEL_ID = 'sfl-farm-ready';

class NotificationEngine {
  constructor() {
    this.prefs = { ...DEFAULT_PREFS };
    this.notifiedIds = this.loadNotifiedIds();
    this.hasPermission = false;
    this.fcmToken = localStorage.getItem('sfl_fcm_token') || '';
    this._subscriptionFarmId = localStorage.getItem('sfl_notification_farm_id') || '';
    this.localExactAllowed = true;
    this._registrationListenerAdded = false;
    this._registrationErrorListenerAdded = false;
    this._localChannelReady = false;
    this.loadPrefs();
  }

  isNative() {
    return Boolean(
      window.Capacitor &&
      window.Capacitor.isNativePlatform &&
      window.Capacitor.isNativePlatform(),
    );
  }

  getFarmId() {
    const farmId = window.__app && window.__app.State && window.__app.State.farmId;
    return farmId ? String(farmId) : '';
  }

  getPushPlugin() {
    return window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.PushNotifications;
  }

  getLocalPlugin() {
    return window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.LocalNotifications;
  }

  loadNotifiedIds() {
    try {
      return new Set(JSON.parse(localStorage.getItem('sfl_notified_ids') || '[]'));
    } catch (error) {
      return new Set();
    }
  }

  saveNotifiedIds() {
    localStorage.setItem('sfl_notified_ids', JSON.stringify([...this.notifiedIds]));
  }

  loadPrefs() {
    try {
      const saved = localStorage.getItem('sfl_notify_prefs');
      if (saved) this.prefs = { ...DEFAULT_PREFS, ...JSON.parse(saved) };
    } catch (error) {
      console.error('[Notif] Não foi possível carregar preferências:', error);
    }
  }

  savePrefs() {
    localStorage.setItem('sfl_notify_prefs', JSON.stringify(this.prefs));
  }

  async setPref(key, value) {
    this.prefs[key] = value;
    this.savePrefs();

    let success = true;
    try {
      if (key === 'master' && value) {
        success = await this.requestPermission();
        if (!success) {
          this.prefs.master = false;
          this.savePrefs();
        }
      } else if (key === 'master' && !value) {
        await this.disablePush();
      } else {
        await this.syncPrefsToSupabase();
      }
    } catch (error) {
      console.error('[Notif] Falha ao alterar preferência:', error);
      success = false;
    }

    if (window.__app && window.__app.UI && window.__app.UI.renderNotifSettings) {
      this.getPermissionState().then((permission) => window.__app.UI.renderNotifSettings(permission));
    }
    return success;
  }

  async fetchOrThrow(url, options, label) {
    const response = await fetch(url, options);
    if (response.ok) return response;

    let detail = '';
    try {
      detail = await response.text();
    } catch (error) {
      detail = '';
    }
    throw new Error(`${label} (${response.status})${detail ? `: ${detail.slice(0, 180)}` : ''}`);
  }

  async upsertSubscription(subscription) {
    const farmId = this.getFarmId();
    if (!farmId) throw new Error('Carregue uma fazenda antes de ativar notificações.');

    await this.fetchOrThrow(
      `${SUPABASE_URL}/rest/v1/push_subscriptions?on_conflict=farm_id`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: SUPABASE_ANON,
          Authorization: `Bearer ${SUPABASE_ANON}`,
          Prefer: 'resolution=merge-duplicates',
        },
        body: JSON.stringify({ farm_id: Number(farmId), preferences: this.prefs, ...subscription }),
      },
      'Não foi possível salvar a inscrição de notificações',
    );
  }

  async syncPrefsToSupabase() {
    if (!this.prefs.master) return false;
    const farmId = this.getFarmId();
    if (!farmId) return false;

    try {
      await this.fetchOrThrow(
        `${SUPABASE_URL}/rest/v1/push_subscriptions?farm_id=eq.${encodeURIComponent(farmId)}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            apikey: SUPABASE_ANON,
            Authorization: `Bearer ${SUPABASE_ANON}`,
          },
          body: JSON.stringify({ preferences: this.prefs }),
        },
        'Não foi possível sincronizar as preferências',
      );
      return true;
    } catch (error) {
      console.error('[Notif] Erro ao sincronizar preferências:', error);
      return false;
    }
  }

  urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let index = 0; index < rawData.length; index += 1) outputArray[index] = rawData.charCodeAt(index);
    return outputArray;
  }

  async getPermissionState() {
    if (!this.isNative()) return typeof Notification === 'undefined' ? 'denied' : Notification.permission;

    const push = this.getPushPlugin();
    const local = this.getLocalPlugin();
    try {
      const pushStatus = push ? await push.checkPermissions() : { receive: 'denied' };
      const localStatus = local ? await local.checkPermissions() : { display: 'granted' };
      return pushStatus.receive === 'granted' && localStatus.display === 'granted' ? 'granted' : (pushStatus.receive || localStatus.display || 'denied');
    } catch (error) {
      console.warn('[Notif] Não foi possível consultar permissões:', error);
      return 'denied';
    }
  }

  async prepareLocalNotifications(requestPermission = false) {
    const local = this.getLocalPlugin();
    if (!local) return true;

    try {
      let permission = await local.checkPermissions();
      if (permission.display !== 'granted' && requestPermission) permission = await local.requestPermissions();
      if (permission.display !== 'granted') {
        console.warn('[Notif] Permissão de notificações locais não concedida:', permission.display);
        return false;
      }

      this.localExactAllowed = true;
      if (local.checkExactNotificationSetting) {
        try {
          const exact = await local.checkExactNotificationSetting();
          this.localExactAllowed = exact === 'granted';
          if (!this.localExactAllowed) {
            console.warn('[Notif] Alarmes exatos estão desativados; usando agendamento aproximado.');
          }
        } catch (error) {
          console.warn('[Notif] Não foi possível verificar alarmes exatos:', error);
        }
      }

      if (!this._localChannelReady && local.createChannel) {
        await local.createChannel({
          id: LOCAL_CHANNEL_ID,
          name: 'SFL Pro — Fazenda',
          description: 'Avisos de colheitas, produções e atividades prontas',
          importance: 5,
          visibility: 1,
          sound: 'default',
          vibration: true,
          lights: true,
          lightColor: '#F59E0B',
        });
        this._localChannelReady = true;
      }
      return true;
    } catch (error) {
      console.error('[Notif] Não foi possível preparar notificações locais:', error);
      return false;
    }
  }

  attachNativeListeners() {
    const push = this.getPushPlugin();
    if (!push) return false;

    if (!this._registrationListenerAdded) {
      this._registrationListenerAdded = true;
      push.addListener('registration', async (token) => {
        this.fcmToken = token && token.value ? token.value : '';
        if (!this.fcmToken) return;

        localStorage.setItem('sfl_fcm_token', this.fcmToken);
        this.hasPermission = true;
        try {
          await this.saveNativeSubscription();
          console.log('[Notif] Token FCM salvo no backend.');
        } catch (error) {
          console.error('[Notif] Token FCM recebido, mas não foi salvo:', error);
        }
      });
    }

    if (!this._registrationErrorListenerAdded) {
      this._registrationErrorListenerAdded = true;
      push.addListener('registrationError', (error) => {
        console.error('[Notif] Falha ao registrar FCM:', error);
      });
    }
    return true;
  }

  async saveNativeSubscription() {
    if (!this.fcmToken) return false;
    await this.upsertSubscription({ endpoint: `fcm://${this.fcmToken}`, p256dh: '', auth: '' });
    this._subscriptionFarmId = this.getFarmId();
    localStorage.setItem('sfl_notification_farm_id', this._subscriptionFarmId);
    return true;
  }

  async requestPermission() {
    return this.isNative() ? this.requestNativePermission() : this.requestWebPushPermission();
  }

  async requestNativePermission() {
    try {
      const push = this.getPushPlugin();
      if (!push) throw new Error('Plugin de notificações push não está disponível neste aplicativo.');

      let permission = await push.checkPermissions();
      if (permission.receive !== 'granted') permission = await push.requestPermissions();
      if (permission.receive !== 'granted') {
        alert('Ative as notificações nas configurações do celular para receber os avisos do SFL Pro.');
        return false;
      }

      const localReady = await this.prepareLocalNotifications(true);
      if (!localReady) {
        alert('O Android bloqueou as notificações locais. Ative a permissão de notificações para o SFL Pro nas configurações do aparelho.');
        return false;
      }

      this.attachNativeListeners();
      try {
        await push.register();
      } catch (e) {
        console.warn('[Notif] push.register falhou, mas permissão foi concedida:', e);
      }
      
      this.hasPermission = true;
      if (this.fcmToken) {
        try {
          await this.saveNativeSubscription();
        } catch (e) {
          console.warn('[Notif] saveNativeSubscription falhou, tentaremos depois:', e);
        }
      }
      return true;
    } catch (error) {
      console.error('[Notif] Erro crítico ao registrar Push Nativo:', error);
      return false;
    }
  }

  async requestWebPushPermission() {
    if (!('Notification' in window) || !('serviceWorker' in navigator)) {
      alert('Este navegador não suporta notificações push.');
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        alert('Ative as notificações nas configurações do navegador para o SFL Pro.');
        return false;
      }

      const saved = await this.saveWebSubscription();
      if (!saved) return false;
      this.hasPermission = true;
      await this.sendPush('SFL Pro ativado', { body: 'Você receberá avisos quando a fazenda estiver pronta.' });
      return true;
    } catch (error) {
      console.error('[Notif] Erro ao registrar Web Push:', error);
      return false;
    }
  }

  async saveWebSubscription() {
    const farmId = this.getFarmId();
    if (!farmId) {
      alert('Primeiro carregue a sua fazenda antes de ativar as notificações.');
      return false;
    }

    const registration = await navigator.serviceWorker.ready;
    let subscription = await registration.pushManager.getSubscription();
    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(VAPID_PUBLIC),
      });
    }

    const p256dhKey = subscription.getKey('p256dh');
    const authKey = subscription.getKey('auth');
    if (!p256dhKey || !authKey) throw new Error('O navegador não retornou as chaves da inscrição push.');

    await this.upsertSubscription({
      endpoint: subscription.endpoint,
      p256dh: btoa(String.fromCharCode(...new Uint8Array(p256dhKey))),
      auth: btoa(String.fromCharCode(...new Uint8Array(authKey))),
    });
    this._subscriptionFarmId = farmId;
    localStorage.setItem('sfl_notification_farm_id', farmId);
    return true;
  }

  async syncAfterFarmLoad() {
    const farmId = this.getFarmId();
    if (!this.prefs.master || !farmId) return false;
    if (this._subscriptionFarmId === farmId) return true;

    try {
      if (this.isNative()) {
        const push = this.getPushPlugin();
        if (!push) return false;
        const permission = await push.checkPermissions();
        if (permission.receive !== 'granted') return false;
        await this.prepareLocalNotifications(false);
        this.attachNativeListeners();
        await push.register();
        if (this.fcmToken) return this.saveNativeSubscription();
        return true;
      }

      if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
        return this.saveWebSubscription();
      }
    } catch (error) {
      console.error('[Notif] Não foi possível restaurar a inscrição:', error);
    }
    return false;
  }

  async disablePush() {
    const farmId = this.getFarmId();
    if (!farmId) {
      this.hasPermission = false;
      return;
    }

    try {
      await this.fetchOrThrow(
        `${SUPABASE_URL}/rest/v1/push_subscriptions?farm_id=eq.${encodeURIComponent(farmId)}`,
        { method: 'DELETE', headers: { apikey: SUPABASE_ANON, Authorization: `Bearer ${SUPABASE_ANON}` } },
        'Não foi possível remover a inscrição de notificações',
      );
    } catch (error) {
      console.error('[Notif] Erro ao remover inscrição:', error);
    }
    this.hasPermission = false;
    this._subscriptionFarmId = '';
    localStorage.removeItem('sfl_notification_farm_id');
  }

  localSchedule(readyAtMs) {
    const schedule = { at: new Date(readyAtMs) };
    if (this.localExactAllowed) schedule.allowWhileIdle = true;
    return schedule;
  }

  async sendPush(title, options = {}) {
    if (this.isNative()) {
      const local = this.getLocalPlugin();
      if (!local || !(await this.prepareLocalNotifications(false))) return false;
      try {
        await local.schedule({
          notifications: [{
            id: this.localId(`preview:${title}:${Date.now()}`),
            title,
            body: options.body || '',
            channelId: LOCAL_CHANNEL_ID,
            largeIcon: options.largeIcon || 'ic_launcher',
            schedule: this.localSchedule(Date.now() + 250),
          }],
        });
        return true;
      } catch (error) {
        console.warn('[Notif] Não foi possível exibir notificação de teste:', error);
        return false;
      }
    }

    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      const payload = { body: options.body || '', icon: './icons/icon-192.png', ...options };
      try {
        if ('serviceWorker' in navigator) {
          const registration = await navigator.serviceWorker.ready;
          await registration.showNotification(title, payload);
        } else {
          new Notification(title, payload);
        }
        return true;
      } catch (error) {
        console.warn('[Notif] Não foi possível exibir notificação web:', error);
      }
    }
    return false;
  }

  localId(value) {
    let hash = 2166136261;
    for (let index = 0; index < value.length; index += 1) {
      hash ^= value.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
    return (hash >>> 0) % 2147483646 + 1;
  }

  async scheduleToSupabase(parsedFarm) {
    if (!this.prefs.master || !parsedFarm || parsedFarm.isPartial) return;
    const farmId = Number(this.getFarmId());
    if (!farmId) return;

    const rawState = window.__app && window.__app.State && window.__app.State.rawFarm;
    if (!rawState) {
      console.warn('[Notif] Dados completos da fazenda não estão disponíveis para agendar avisos.');
      return;
    }

    const now = Date.now();
    const schedules = [];
    const localSchedules = [];
    const localReady = this.isNative() && await this.prepareLocalNotifications(false);

    const itemsToSchedule = [];

    const addSchedule = (itemId, itemName, imageItemName, category, readyAt, msLeft) => {
      if (this.prefs[category] === false) return;
      
      let readyAtMs = 0;
      if (readyAt && Number.isFinite(Number(readyAt)) && Number(readyAt) > 0) {
        readyAtMs = Number(readyAt);
      } else {
        const remaining = Number(msLeft);
        if (Number.isFinite(remaining) && remaining > 0) {
          readyAtMs = now + remaining;
        }
      }

      // Do NOT schedule past events or items already ready
      if (!readyAtMs || readyAtMs <= now + 5000) return;

      itemsToSchedule.push({
        itemId: String(itemId),
        itemName,
        imageItemName: imageItemName || itemName,
        category,
        readyAtMs
      });
    };

    try {
      (parsedFarm.crops || []).forEach((item) => addSchedule(`crop_${item.id}`, item.name, item.name, 'crops', item.readyAt, item.msLeft));
      (parsedFarm.fruits || []).forEach((item) => addSchedule(`fruit_${item.id}`, item.name, item.name, 'fruits', item.readyAt, item.msLeft));
      (parsedFarm.trees || []).forEach((item) => addSchedule(`tree_${item.id}`, 'Madeira', 'Wood', 'trees', item.readyAt, item.msLeft));
      (parsedFarm.rocks || []).forEach((item) => addSchedule(`rock_${item.id}`, item.name, item.name, 'rocks', item.readyAt, item.msLeft));
      (parsedFarm.mushrooms || []).forEach((item) => addSchedule(`mushroom_${item.id}`, item.name, 'Wild Mushroom', 'rocks', item.readyAt, item.msLeft));
      (parsedFarm.animals || []).forEach((item) => addSchedule(`animal_${item.id}`, item.type || item.name, item.type || item.name, 'animals', item.readyAt, item.msLeft));
      (parsedFarm.beehives || []).forEach((item) => addSchedule(`hive_${item.id}`, 'Mel', 'Honey', 'beehives', item.readyAt, item.msLeft));
      (parsedFarm.flowers || []).forEach((item) => addSchedule(`flower_${item.id}`, item.name, item.name, 'flowers', item.readyAt, item.msLeft));
      (parsedFarm.composting || []).forEach((item) => addSchedule(`compost_${item.id}`, item.name, item.name, 'composting', item.readyAt, item.msLeft));
      (parsedFarm.cropMachine || []).forEach((item) => addSchedule(`crop-machine_${item.id}`, item.name, item.name, 'cropMachine', item.readyAt, item.msLeft));
      (parsedFarm.oil || []).forEach((item) => addSchedule(`oil_${item.id}`, item.name, 'Oil Reserve', 'oil', item.readyAt, item.msLeft));
      (parsedFarm.greenhouse || []).forEach((item) => addSchedule(`greenhouse_${item.id}`, item.name, item.name, 'greenhouse', item.readyAt, item.msLeft));
      (parsedFarm.buildings || []).forEach((item) => addSchedule(`building_${item.id}`, item.cooking || item.name, item.cooking || item.name, 'buildings', item.readyAt, item.msLeft));
      (parsedFarm.crabTraps || []).forEach((item) => addSchedule(`crab-trap_${item.id}`, item.name, item.name, 'crabTraps', item.readyAt, item.msLeft));
      (parsedFarm.shrines || []).forEach((item) => addSchedule(`shrine_${item.id}`, item.name, item.name, 'shrines', item.readyAt, item.msLeft));
      (parsedFarm.agingShed || []).forEach((item) => addSchedule(`aging_${item.id}`, item.name, item.name, 'agingShed', item.readyAt, item.msLeft));
      (parsedFarm.saltFarm || []).forEach((item) => addSchedule(`salt_${item.id}`, item.name, 'Salt', 'saltFarm', item.readyAt, item.msLeft));
      (parsedFarm.deliveries || []).forEach((item) => addSchedule(`delivery_${item.id}`, item.name, item.name, 'deliveries', item.readyAt, item.msLeft));

      // Floating Island (Mystery Island / Love Island) openings from API
      if (parsedFarm.floatingIsland && Array.isArray(parsedFarm.floatingIsland.schedule)) {
        parsedFarm.floatingIsland.schedule.forEach((slot) => {
          if (slot.startAt > now) {
            addSchedule(
              `floating_island_${slot.index}_${slot.startAt}`,
              'Ilha do Coração Aberta',
              'Heart Air Balloon',
              'floatingIsland',
              slot.startAt,
              slot.startAt - now
            );
          }
        });
      }
    } catch (error) {
      console.error('[Notif] Erro ao montar agendas:', error);
      return;
    }

    const grouped = {};
    itemsToSchedule.forEach(item => {
       // Group items maturing within 2 minutes of each other
       const bucket = Math.round(item.readyAtMs / 120000);
       const key = `${item.itemName}_${bucket}`;
       if (!grouped[key]) {
           grouped[key] = {
               itemName: item.itemName,
               imageItemName: item.imageItemName,
               category: item.category,
               readyAtMs: item.readyAtMs,
               count: 0,
               itemIds: []
           };
       }
       grouped[key].count++;
       grouped[key].itemIds.push(item.itemId);
       if (item.readyAtMs > grouped[key].readyAtMs) {
           grouped[key].readyAtMs = item.readyAtMs;
       }
    });

    const catLabels = {
      crops: 'Plantação', fruits: 'Fruta', trees: 'Árvore', rocks: 'Mineração',
      animals: 'Animal', beehives: 'Colmeia', flowers: 'Flor', composting: 'Compostagem',
      cropMachine: 'Máquina de Cultivo', oil: 'Poço de Óleo', greenhouse: 'Estufa',
      buildings: 'Construção', crabTraps: 'Armadilha', shrines: 'Santuário',
      agingShed: 'Celeiro', saltFarm: 'Salina', deliveries: 'Entrega',
      floatingIsland: 'Ilha do Coração',
    };

    Object.values(grouped).forEach(group => {
      const { itemName, imageItemName, category, readyAtMs, count, itemIds } = group;
      
      const strId = `${farmId}:${itemName}:${Math.round(readyAtMs/120000)}`;
      let hash = 0;
      for (let i = 0; i < strId.length; i++) {
        hash = (hash << 5) - hash + strId.charCodeAt(i);
        hash |= 0;
      }
      const numId = (Math.abs(hash) >>> 0) % 2147483646 + 1;
      
      const imageUrl = window.getImgUrl ? window.getImgUrl(imageItemName) : `https://sfl.world/img/source/${encodeURIComponent(imageItemName)}.png`;

      let title, body;
      if (count === 1) {
        title = `${itemName} pronto!`;
        body = `Sua produção está pronta para coletar no jogo.`;
      } else {
        title = `${count}x ${itemName} prontos!`;
        body = `${count} itens de ${catLabels[category] || category} prontos para colheita!`;
      }

      schedules.push({
        farm_id: farmId,
        item_id: itemIds[0],
        item_name: itemName,
        item_category: category,
        ready_at: new Date(readyAtMs).toISOString(),
        notification_sent: false,
      });

      if (localReady) {
        localSchedules.push({
          id: numId,
          title,
          body,
          channelId: LOCAL_CHANNEL_ID,
          schedule: this.localSchedule(readyAtMs),
          largeIcon: imageUrl,
          extra: { farmId, category, itemName, imageItemName, count, imageUrl }
        });
      }
    });

    const local = this.getLocalPlugin();
    if (localSchedules.length && local) {
      try {
        await local.schedule({ notifications: localSchedules });
      } catch (error) {
        console.error('[Notif] Falha ao agendar notificações locais:', error);
      }
    }

    if (!schedules.length) {
      console.log('[Notif] Nenhum evento futuro para agendar.');
      return;
    }

    try {
      const response = await this.fetchOrThrow(
        `${SUPABASE_URL}/rest/v1/farm_schedules?on_conflict=farm_id,item_id`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: SUPABASE_ANON,
            Authorization: `Bearer ${SUPABASE_ANON}`,
            Prefer: 'resolution=merge-duplicates',
          },
          body: JSON.stringify(schedules),
        },
        'Não foi possível salvar as agendas de notificação',
      );
      console.log('[Notif] Agendas sincronizadas:', schedules.length, '| Status:', response.status);
    } catch (error) {
      console.error('[Notif] Erro ao enviar agendas ao backend:', error);
    }
  }

  /**
   * Detect marketplace activity (sales and purchases) by comparing
   * the saved previous farm state against the current one.
   */
  async checkMarketplaceActivity(parsedFarm) {
    if (!this.prefs.master || !this.prefs.market) return;
    if (!parsedFarm || parsedFarm.isPartial) return;

    const rawFarm = window.__app && window.__app.State && window.__app.State.rawFarm;
    if (!rawFarm) return;

    const farm = rawFarm.farm || rawFarm;
    try {
      const prevListingsRaw = localStorage.getItem('sfl_prev_listings_notif');
      const prevListings = prevListingsRaw ? JSON.parse(prevListingsRaw) : null;
      const currentListings = Object.entries(farm.tradeListings || {}).map(([id, l]) => ({ id, ...l }));

      if (prevListings && prevListings.length > 0) {
        for (const prev of prevListings) {
          const stillExists = currentListings.find(c => c.id === prev.id);
          if (!stillExists) {
            const itemName = Object.keys(prev.items || {})[0];
            const qty = itemName ? (prev.items[itemName] || 0) : 0;
            const sfl = parseFloat(prev.sfl || 0);
            if (itemName && sfl > 0) {
              const emoji = '💰';
              await this.sendPush(`${emoji} ${itemName} vendido!`, {
                body: `${qty}x ${itemName} → +${sfl.toFixed(2)} SFL`,
                icon: window.getImgUrl ? window.getImgUrl(itemName) : './icons/icon-192.png',
              });
            }
          }
        }
      }

      localStorage.setItem('sfl_prev_listings_notif', JSON.stringify(currentListings));
    } catch (e) {
      console.warn('[Notif] checkMarketplaceActivity error:', e);
    }
  }

  /**
   * Schedule a daily reset notification (00:00 UTC).
   */
  scheduleDailyReset() {
    if (!this.prefs.master || !this.prefs.dailyReset) return;
    const local = this.getLocalPlugin();
    if (!local) return;

    const now = new Date();
    const nextReset = new Date();
    nextReset.setUTCHours(0, 0, 0, 0);
    if (nextReset <= now) nextReset.setUTCDate(nextReset.getUTCDate() + 1);

    const msLeft = nextReset.getTime() - now.getTime();
    if (msLeft <= 0 || msLeft > 86400000) return;

    const notifId = this.localId(`daily-reset-${nextReset.toISOString().split('T')[0]}`);
    const alreadyScheduledKey = `sfl_daily_reset_scheduled_${nextReset.toISOString().split('T')[0]}`;
    if (localStorage.getItem(alreadyScheduledKey)) return;

    local.schedule({
      notifications: [{
        id: notifId,
        title: '🌅 Reset Diário!',
        body: 'O jogo reiniciou. Colete seus bônus e deliveries do dia!',
        channelId: LOCAL_CHANNEL_ID,
        schedule: this.localSchedule(nextReset.getTime()),
      }]
    }).then(() => {
      localStorage.setItem(alreadyScheduledKey, '1');
    }).catch(e => console.warn('[Notif] scheduleDailyReset error:', e));
  }

  init() {
    if (this.isNative()) {
      const push = this.getPushPlugin();
      this.attachNativeListeners();
      if (push) {
        push.addListener('pushNotificationReceived', (notification) => console.log('[Notif] Push recebido:', notification));
        push.addListener('pushNotificationActionPerformed', (action) => console.log('[Notif] Push acionado:', action));
      }

      const local = this.getLocalPlugin();
      if (local) {
        local.addListener('localNotificationReceived', (notification) => console.log('[Notif] Aviso local entregue:', notification));
        local.addListener('localNotificationActionPerformed', (action) => console.log('[Notif] Aviso local aberto:', action));
      }
    }
    console.log('[Notif] Motor inicializado. Plataforma nativa:', this.isNative());
  }

  checkFloatingIsland(parsedFarm) {
    if (!this.prefs.master || this.prefs.floatingIsland === false) return;
    const fi = parsedFarm?.floatingIsland;
    if (!fi || !fi.currentSlot) return;

    const startAt = fi.currentSlot.startAt;
    const key = `sfl_notif_floating_island_${startAt}`;
    if (!localStorage.getItem(key)) {
      localStorage.setItem(key, '1');

      const imageUrl = window.getImgUrl ? window.getImgUrl('Heart Air Balloon') : 'https://raw.githubusercontent.com/sunflower-land/sunflower-land/main/src/assets/sfts/heart_air_balloon.webp';

      // Show in-app Toast with real item image
      if (window.__app?.UI?.showToast) {
        window.__app.UI.showToast('🎈 A Ilha do Coração (Mystery Island) abriu agora!', 'info', imageUrl);
      }

      // Audio chime
      try {
        const audio = new Audio('https://sfl.world/sounds/alert.mp3');
        audio.volume = 0.5;
        audio.play().catch(() => {});
      } catch(e) {}

      // Native push if on mobile
      const local = this.getLocalPlugin();
      if (local) {
        local.schedule({
          notifications: [{
            id: this.localId(`floating-island-${startAt}`),
            title: 'Ilha do Coração Aberta!',
            body: 'A Mystery Island está disponível agora por 30 minutos. Complete o puzzle das pétalas e colete Love Charms!',
            channelId: LOCAL_CHANNEL_ID,
            schedule: this.localSchedule(Date.now() + 100),
            largeIcon: imageUrl,
            extra: { type: 'floatingIsland', startAt, imageUrl }
          }]
        }).catch(() => {});
      }
    }
  }
}

window.__app.Notifications = new NotificationEngine();
window.__app.Notifications.init();
console.log('notifications.js carregado com sucesso!');

