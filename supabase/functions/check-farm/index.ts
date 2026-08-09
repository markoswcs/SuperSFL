import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0"
import webpush from "https://esm.sh/web-push@3.6.6"

const VAPID_PUBLIC  = Deno.env.get('VAPID_PUBLIC_KEY')  || "BIyHzQRluCO6jIO6cifQJLbiVoZyPo9EH3Cmb-VQ78MSBkeRgPE87sc43aK4D8sIZlYwAmGY13fUt-c19GvpEpo";
const VAPID_PRIVATE = Deno.env.get('VAPID_PRIVATE_KEY') || "BEj6GsZR9yQJ7FWMEjF3OU_2QLb-L3kwSa8-jZnWgPQ";

webpush.setVapidDetails('mailto:mw64097@gmail.com', VAPID_PUBLIC, VAPID_PRIVATE);

serve(async () => {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || "";
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || "";
    if (!supabaseUrl || !supabaseKey) {
      return new Response(JSON.stringify({ error: "Missing Supabase env vars" }), { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const now = new Date().toISOString();

    // 1. Cleanup: remove sent notifications older than 24h to keep table clean
    await supabase
      .from('farm_schedules')
      .delete()
      .eq('notification_sent', true)
      .lt('ready_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    // 2. Find all items that are NOW ready and not yet notified
    //    (ready_at <= now AND notification_sent = false)
    const { data: dueItems, error } = await supabase
      .from('farm_schedules')
      .select('*, push_subscriptions!inner(endpoint, p256dh, auth, preferences)')
      .lte('ready_at', now)
      .eq('notification_sent', false);

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }

    if (!dueItems || dueItems.length === 0) {
      return new Response(JSON.stringify({ success: true, sent: 0, message: "Nothing due" }));
    }

    // 3. Group by farm_id so we send one push per farm (with all ready items listed)
    const byFarm = new Map<number, typeof dueItems>();
    for (const item of dueItems) {
      const list = byFarm.get(item.farm_id) || [];
      list.push(item);
      byFarm.set(item.farm_id, list);
    }

    const results = [];
    const sentIds: string[] = [];

    for (const [farmId, items] of byFarm) {
      try {
        const sub = items[0].push_subscriptions;

        // Build message grouping by category
        const byCat = new Map<string, string[]>();
        for (const item of items) {
          const cat = item.item_category;
          const list = byCat.get(cat) || [];
          list.push(item.item_name);
          byCat.set(cat, list);
        }

        const lines: string[] = [];
        for (const [cat, names] of byCat) {
          if (names.length === 1) {
            lines.push(`${names[0]} (${cat}) pronto!`);
          } else {
            lines.push(`${names.length}x ${cat} prontos!`);
          }
        }

        let bodyText = lines.join('\n');
        if (bodyText.length > 120) bodyText = bodyText.substring(0, 117) + '...';

        // Icon from first item
        const firstName = items[0].item_name;
        const iconUrl = `https://sfl.world/img/source/${encodeURIComponent(firstName)}.png`;

        const payload = JSON.stringify({
          title: `🌻 SFL Pro: ${items.length} item${items.length > 1 ? 's' : ''} pronto${items.length > 1 ? 's' : ''}!`,
          body: bodyText,
          icon: iconUrl,
          tag: "farm-ready"
        });

        const pushSub = {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth }
        };

        await webpush.sendNotification(pushSub, payload);

        // Mark all sent items
        sentIds.push(...items.map(i => i.id));
        results.push({ farmId, sent: items.length, items: items.map(i => i.item_name) });

      } catch (err) {
        console.error(`Error sending push for farm ${farmId}:`, err);
      }
    }

    // 4. Mark as sent in bulk
    if (sentIds.length > 0) {
      await supabase
        .from('farm_schedules')
        .update({ notification_sent: true })
        .in('id', sentIds);
    }

    // 5. Handle Daily Reset (00:00 UTC)
    const nowUtc = new Date();
    if (nowUtc.getUTCHours() === 0 && nowUtc.getUTCMinutes() < 2) {
      const resetDateStr = nowUtc.toISOString().split('T')[0];
      const resetId = `dailyreset-${resetDateStr}`;

      // Check if already sent today
      const { data: alreadySent } = await supabase
        .from('farm_schedules')
        .select('id')
        .eq('item_id', resetId)
        .eq('notification_sent', true)
        .maybeSingle();

      if (!alreadySent) {
        // Send to all subscriptions
        const { data: allSubs } = await supabase.from('push_subscriptions').select('*');
        for (const sub of allSubs || []) {
          const prefs = sub.preferences || {};
          if (prefs.dailyReset === false) continue;
          try {
            await webpush.sendNotification(
              { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
              JSON.stringify({ title: "🌅 Daily Reset!", body: "A fazenda foi resetada. Bom dia!", icon: "https://sfl.world/favicon.ico", tag: "daily-reset" })
            );
          } catch (e) { console.error(e); }
        }
        // Mark daily reset as sent
        await supabase.from('farm_schedules').upsert({
          farm_id: 0,
          item_id: resetId,
          item_name: 'Daily Reset',
          item_category: 'daily',
          ready_at: new Date(Date.now()).toISOString(),
          notification_sent: true
        }, { onConflict: 'farm_id,item_id' });
      }
    }

    return new Response(JSON.stringify({ success: true, sent: sentIds.length, results }), {
      headers: { "Content-Type": "application/json" }
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});
