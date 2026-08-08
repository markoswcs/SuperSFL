import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0"
import webpush from "https://esm.sh/web-push@3.6.6"
import { parseFarm } from "./farm.js"

const VAPID_PUBLIC = Deno.env.get('VAPID_PUBLIC_KEY') || "BIyHzQRluCO6jIO6cifQJLbiVoZyPo9EH3Cmb-VQ78MSBkeRgPE87sc43aK4D8sIZlYwAmGY13fUt-c19GvpEpo";
const VAPID_PRIVATE = Deno.env.get('VAPID_PRIVATE_KEY') || "BEj6GsZR9yQJ7FWMEjF3OU_2QLb-L3kwSa8-jZnWgPQ";

// Config VAPID
webpush.setVapidDetails(
  'mailto:mw64097@gmail.com',
  VAPID_PUBLIC,
  VAPID_PRIVATE
);

serve(async (req) => {
  try {
    // 1. Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || "";
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || "";
    
    if (!supabaseUrl || !supabaseKey) {
       return new Response(JSON.stringify({ error: "Missing Supabase env vars" }), { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // 2. Fetch all push subscriptions
    const { data: subs, error } = await supabase
      .from('push_subscriptions')
      .select('*');

    if (error || !subs) {
      return new Response(JSON.stringify({ error: error?.message }), { status: 500 });
    }

    const results = [];

    // 3. For each subscription, check their farm
    for (const sub of subs) {
      try {
        const farmId = sub.farm_id;
        
        // Call SFL API (Note: Public visit API. No auth needed for public profile)
        const sflRes = await fetch(`https://api.sunflower-land.com/visit/${farmId}`);
        if (!sflRes.ok) continue;
        
        const farmData = await sflRes.json();
        const state = farmData?.state;
        if (!state) continue;

        // Use the exact same logic as the frontend!
        const parsedFarm = parseFarm(farmData);
        let readyMessages = [];
        let attentionNeeded = false;
        let notifIdParts = [];

        // Helper to check categories
        const checkCategory = (items, itemNameFunc, messagePrefix) => {
          let readyCount = 0;
          let firstItemName = '';
          
          if (!items) return;
          
          if (Array.isArray(items)) {
            items.forEach(item => {
              if (item.status === 'ready') {
                readyCount++;
                if (!firstItemName) firstItemName = itemNameFunc(item);
                notifIdParts.push(item.id || firstItemName);
              }
            });
          } else {
            Object.values(items).forEach(item => {
              if (item.status === 'ready') {
                readyCount++;
                if (!firstItemName) firstItemName = itemNameFunc(item);
                notifIdParts.push(item.id || firstItemName);
              }
            });
          }

          if (readyCount > 0) {
            attentionNeeded = true;
            if (readyCount === 1) {
              readyMessages.push(`${messagePrefix} ${firstItemName} está pronto(a).`);
            } else {
              readyMessages.push(`${readyCount} ${messagePrefix}s estão prontos(as).`);
            }
          }
        };

        checkCategory(parsedFarm.crops, c => c.name, 'Plantação de');
        checkCategory(parsedFarm.animals, a => a.type, 'Animal');
        checkCategory(parsedFarm.fruitPatches, f => f.name, 'Fruta');
        checkCategory(parsedFarm.trees, () => 'Madeira', 'Recurso');
        checkCategory(parsedFarm.stones, () => 'Pedra', 'Recurso');
        checkCategory(parsedFarm.iron, () => 'Ferro', 'Recurso');
        checkCategory(parsedFarm.gold, () => 'Ouro', 'Recurso');
        
        // Disable notifications for chores/mushrooms/deliveries on the backend to avoid spam, unless requested.

        if (attentionNeeded) {
            // Generate a unique ID based on what is exactly ready
            // So if new things get ready, a new notification is sent
            // Sort to ensure consistency
            notifIdParts.sort();
            // Hash the parts roughly
            const notifHash = notifIdParts.join('-').substring(0, 50);
            const notifId = `farm-${farmId}-${notifHash}`;
            
            const { data: existingLog } = await supabase
               .from('notification_logs')
               .select('id')
               .eq('farm_id', farmId)
               .eq('notification_id', notifId)
               .single();

            if (!existingLog) {
                // Send Web Push
                const pushSubscription = {
                  endpoint: sub.endpoint,
                  keys: {
                    p256dh: sub.p256dh,
                    auth: sub.auth
                  }
                };

                let bodyText = readyMessages.join('\n');
                if (bodyText.length > 100) bodyText = bodyText.substring(0, 97) + '...';

                const payload = JSON.stringify({
                  title: "SFL Pro: Coisas Prontas!",
                  body: bodyText,
                  icon: "https://sfl.world/favicon.ico",
                  tag: "general-farm"
                });

                await webpush.sendNotification(pushSubscription, payload);
                
                // Log it
                await supabase.from('notification_logs').insert({
                   farm_id: farmId,
                   notification_id: notifId
                });

                results.push({ farmId, status: "Sent", messages: readyMessages });
            }
        }
      } catch (err) {
        console.error(`Error processing farm ${sub.farm_id}:`, err);
      }
    }

    return new Response(JSON.stringify({ success: true, processed: subs.length, results }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});
