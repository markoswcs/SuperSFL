import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0"
import webpush from "npm:web-push@3.6.7"
import { initializeApp, cert } from "npm:firebase-admin@11.11.0/app"
import { getMessaging } from "npm:firebase-admin@11.11.0/messaging"

const VAPID_PUBLIC  = Deno.env.get('VAPID_PUBLIC_KEY')  || "BIyHzQRluCO6jIO6cifQJLbiVoZyPo9EH3Cmb-VQ78MSBkeRgPE87sc43aK4D8sIZlYwAmGY13fUt-c19GvpEpo";
const VAPID_PRIVATE = Deno.env.get('VAPID_PRIVATE_KEY') || "BEj6GsZR9yQJ7FWMEjF3OU_2QLb-L3kwSa8-jZnWgPQ";

webpush.setVapidDetails('mailto:mw64097@gmail.com', VAPID_PUBLIC, VAPID_PRIVATE);

const serviceAccountStr = Deno.env.get('FIREBASE_SERVICE_ACCOUNT') || "{}";
let messaging = null;
try {
  const serviceAccount = JSON.parse(serviceAccountStr);
  if (serviceAccount.project_id) {
    const app = initializeApp({
      credential: cert(serviceAccount)
    });
    messaging = getMessaging(app);
    console.log("Firebase Admin initialized successfully.");
  }
} catch(e) {
  console.error("Error parsing FIREBASE_SERVICE_ACCOUNT:", e.message);
}

serve(async () => {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || "";
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || "";
    if (!supabaseUrl || !supabaseKey) {
      return new Response(JSON.stringify({ error: "Missing Supabase env vars" }), { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const now = new Date().toISOString();

    await supabase
      .from('farm_schedules')
      .delete()
      .eq('notification_sent', true)
      .lt('ready_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    const { data: dueItems, error: dueErr } = await supabase
      .from('farm_schedules')
      .select('*')
      .lte('ready_at', now)
      .eq('notification_sent', false);

    if (dueErr) return new Response(JSON.stringify({ error: dueErr.message }), { status: 500 });
    if (!dueItems || dueItems.length === 0) return new Response(JSON.stringify({ success: true, sent: 0, message: "Nothing due" }));

    const farmIds = [...new Set(dueItems.map(i => i.farm_id))];

    const { data: subs, error: subErr } = await supabase
      .from('push_subscriptions')
      .select('*')
      .in('farm_id', farmIds);

    if (subErr || !subs || subs.length === 0) return new Response(JSON.stringify({ success: true, sent: 0, message: "No subscriptions found" }));

    const subByFarm = new Map(subs.map(s => [s.farm_id, s]));
    const byFarm = new Map<number, typeof dueItems>();
    
    for (const item of dueItems) {
      const list = byFarm.get(item.farm_id) || [];
      list.push(item);
      byFarm.set(item.farm_id, list);
    }

    const results = [];
    const sentIds: string[] = [];

    for (const [farmId, items] of byFarm) {
      const sub = subByFarm.get(farmId);
      if (!sub) continue;

      const prefs = sub.preferences || {};
      const allowedItems = items.filter(item => prefs[item.item_category] !== false);
      if (allowedItems.length === 0) continue;

      try {
        const byCat = new Map<string, string[]>();
        for (const item of allowedItems) {
          const list = byCat.get(item.item_category) || [];
          list.push(item.item_name);
          byCat.set(item.item_category, list);
        }

        const lines: string[] = [];
        for (const [cat, names] of byCat) {
          if (names.length === 1) {
            lines.push(`${names[0]} pronto!`);
          } else {
            lines.push(`${names.length}x ${cat} prontos!`);
          }
        }

        let bodyText = lines.join('\n');
        if (bodyText.length > 120) bodyText = bodyText.substring(0, 117) + '...';

        const firstName = allowedItems[0].item_name;
        const canonicalImages: Record<string, string> = {
          'Madeira': 'Wood',
          'Mel': 'Honey',
          'Stone Rock': 'Stone',
          'Iron Rock': 'Iron',
          'Gold Rock': 'Gold',
          'Crimstone Rock': 'Crimstone',
          'Sunstone Rock': 'Sunstone',
          'Poço de Óleo': 'Oil',
          'Oil Reserve': 'Oil',
          'Petróleo': 'Oil',
          'Petroleo': 'Oil',
          'Ilha do Coração Aberta': 'Heart Air Balloon',
          'Ilha do Coração': 'Heart Air Balloon',
          'Ilha do Coracao': 'Heart Air Balloon',
          'Reset Diário': 'Sundial',
          'Reset Diario': 'Sundial',
          'Sun': 'Sundial',
          'Cogumelo': 'Wild Mushroom',
          'Cogumelos': 'Wild Mushroom',
          'Sal': 'Salt',
        };
        const cleanFirst = firstName.replace(/\s*#\d+.*$/i, '').trim();
        const canonicalImg = canonicalImages[cleanFirst] || canonicalImages[firstName] || cleanFirst;
        // Accurate image URL for the specific mature item
        const iconUrl = `https://sfl.world/img/source/${encodeURIComponent(canonicalImg)}.png`;
        
        const titleStr = allowedItems.length === 1 ? `${firstName} pronto!` : `${allowedItems.length} itens prontos!`;

        if (sub.endpoint.startsWith('fcm://')) {
          if (!messaging) throw new Error("FCM requested but Firebase Admin not initialized");
          const fcmToken = sub.endpoint.substring(6);
          await messaging.send({
            token: fcmToken,
            notification: {
              title: titleStr,
              body: bodyText,
              imageUrl: iconUrl,
            },
            android: {
              priority: 'high',
              notification: {
                imageUrl: iconUrl,
              }
            }
          });
        } else {
          const payload = JSON.stringify({
            title: titleStr,
            body: bodyText,
            icon: iconUrl,
            image: iconUrl,
            imageUrl: iconUrl,
            badge: 'https://markoswcs.github.io/SuperSFL/icons/icon-192.png',
            tag: "farm-ready-" + Date.now()
          });
          await webpush.sendNotification(
            { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
            payload,
            { TTL: 86400, headers: { 'Urgency': 'high' } }
          );
        }

        sentIds.push(...allowedItems.map(i => i.id));
        results.push({ farmId, sent: allowedItems.length, items: allowedItems.map(i => i.item_name) });

      } catch (err) {
        results.push({ farmId, error: err.message, code: err.code });
        console.error(`Error sending push for farm ${farmId}:`, err);
        if (err.statusCode === 410 || err.statusCode === 404 || err.code === 'messaging/registration-token-not-registered') {
          await supabase.from('push_subscriptions').delete().eq('farm_id', farmId);
        }
      }
    }

    if (sentIds.length > 0) {
      await supabase.from('farm_schedules').update({ notification_sent: true }).in('id', sentIds);
    }

    const nowUtc = new Date();
    if (nowUtc.getUTCHours() === 0 && nowUtc.getUTCMinutes() < 2) {
      const resetDateStr = nowUtc.toISOString().split('T')[0];
      const resetId = `dailyreset-${resetDateStr}`;

      const { data: alreadySent } = await supabase.from('farm_schedules').select('id').eq('item_id', resetId).eq('notification_sent', true).maybeSingle();

      if (!alreadySent) {
        const { data: allSubs } = await supabase.from('push_subscriptions').select('*');
        for (const s of allSubs || []) {
          if ((s.preferences || {}).dailyReset === false) continue;
          try {
            if (s.endpoint.startsWith('fcm://')) {
              if (messaging) {
                await messaging.send({
                  token: s.endpoint.substring(6),
                  notification: { title: "Daily Reset!", body: "A fazenda foi resetada. Bom dia!" },
                  android: { priority: 'high' }
                });
              }
            } else {
              await webpush.sendNotification(
                { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
                JSON.stringify({ title: "Daily Reset!", body: "A fazenda foi resetada. Bom dia!", icon: "https://sfl.world/favicon.ico", tag: "daily-reset" })
              );
            }
          } catch (e) { console.error(e); }
        }
        await supabase.from('farm_schedules').upsert({
          farm_id: 0, item_id: resetId,
          item_name: 'Daily Reset', item_category: 'daily',
          ready_at: now, notification_sent: true
        }, { onConflict: 'farm_id,item_id' });
      }
    }

    return new Response(JSON.stringify({ success: true, sent: sentIds.length, results }), {
      headers: { "Content-Type": "application/json" }
    });

  } catch (error) {
    console.error('Fatal error:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});