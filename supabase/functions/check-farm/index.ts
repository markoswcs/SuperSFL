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

    // 1. Cleanup: delete sent notifications older than 24h
    await supabase
      .from('farm_schedules')
      .delete()
      .eq('notification_sent', true)
      .lt('ready_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    // 2. Find all items that are NOW due (ready_at <= now AND not sent)
    const { data: dueItems, error: dueErr } = await supabase
      .from('farm_schedules')
      .select('*')
      .lte('ready_at', now)
      .eq('notification_sent', false);

    if (dueErr) {
      return new Response(JSON.stringify({ error: dueErr.message }), { status: 500 });
    }

    if (!dueItems || dueItems.length === 0) {
      return new Response(JSON.stringify({ success: true, sent: 0, message: "Nothing due" }));
    }

    // 3. Get all unique farm_ids that have due items
    const farmIds = [...new Set(dueItems.map(i => i.farm_id))];

    // 4. Fetch push subscriptions for those farms
    const { data: subs, error: subErr } = await supabase
      .from('push_subscriptions')
      .select('*')
      .in('farm_id', farmIds);

    if (subErr || !subs || subs.length === 0) {
      return new Response(JSON.stringify({ success: true, sent: 0, message: "No subscriptions found" }));
    }

    // Index subs by farm_id for quick lookup
    const subByFarm = new Map(subs.map(s => [s.farm_id, s]));

    // 5. Group due items by farm_id
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

      // Check user preferences
      const prefs = sub.preferences || {};

      // Filter items by user preferences
      const allowedItems = items.filter(item => prefs[item.item_category] !== false);
      if (allowedItems.length === 0) continue;

      try {
        // Build message â€” group by category
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
        // Use a safe fallback PNG icon to prevent Android Chrome from dropping the push if the image 404s or is an ICO
        let iconUrl = "https://markoswcs.github.io/SuperSFL/icons/icon-192.png";

        const payload = JSON.stringify({
          title: `ðŸŒ» SFL Pro: ${allowedItems.length === 1 ? firstName + ' pronto!' : allowedItems.length + ' itens prontos!'}`,
          body: bodyText,
          icon: iconUrl,
          badge: 'https://markoswcs.github.io/SuperSFL/icons/icon-192.png',
          tag: "farm-ready-" + Date.now()
        });

                let sendResult;
        if (sub.endpoint.startsWith('fcm://')) {
          if (!messaging) throw new Error("FCM requested but Firebase Admin not initialized");
          const fcmToken = sub.endpoint.substring(6);
          await messaging.send({
            token: fcmToken,
            notification: {
              title: 🌻 SFL Pro: ,
              body: bodyText,
            },
            android: {
              priority: 'high'
            }
          });
          console.log(FCM Push sent for );
        } else {
          sendResult =             if (sub.endpoint.startsWith('fcm://')) {
               if (messaging) {
                 await messaging.send({
                   token: sub.endpoint.substring(6),
                   notification: { title: "🌅 Daily Reset!", body: "A fazenda foi resetada. Bom dia!" },
                   android: { priority: 'high' }
                 });
               }
            } else {
               await webpush.sendNotification(
                 { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
                 JSON.stringify({ title: "🌅 Daily Reset!", body: "A fazenda foi resetada. Bom dia!", icon: "https://sfl.world/favicon.ico", tag: "daily-reset" })
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
