const BUMPKIN_EXP = [0,0,2,22,205,555,1155,2155,3405,5405,7905,10905,14405,18405,22905,27905,33655,40155,47405,55405,64155,73905,84655,96405,109155,122905,137405,152905,169405,186905,205405,225405,246905,269905,294405,320405,348405,378405,410405,444405,480405,518905,559905,603405,649405,697905,749405,803905,861405,921905,985405,1053905,1127405,1205905,1289405,1377905,1476405,1584905,1703405,1831905,1970405,2128905,2287405,2485905,2704405,2942905,3221405,3539905,3898405,4296905,4735405,5233905,5743905,6263905,6793905,7333905,7883905,8443905,9013905,9593905,10183905,10783905,11393905,12013905,12643905,13283905,13933905,14593905,15263905,15943905,16633905,17333905,18043905,18763905,19493905,20233905,20983905,21743905,22513905,23293905,24083905,24893905,25723905,26573905,27443905,28333905,29243905,30173905,31123905,32093905,33083905,34093905,35123905,36173905,37243905,38333905,39443905,40573905,41723905,42893905,44083905,45293905,46523905,47773905,49043905,50333905,51653905,53003905,54383905,55793905,57233905,58708905,60218905,61763905,63343905,64958905,66613905,68308905,70043905,71818905,73633905,75493905,77398905,79348905,81343905,83383905,85473905,87613905,89803905,92043905,94333905,95662605,97031166,98440783,99892688,101388150,102928475,104515009,106149139,107832292,109565939,111351595,113190820,115085221,117036454,119046223,121116285,123248448,125444575,127706585,130036455,132436221,134907979,137453889,140076176,142777131,145559114,148424556,151375961,154415908,157547053,160772132,164093963,167515448,171039577,174669429,178408176,182259085,186225521,190310950,194518941,198853171,203317427,207915610,212651738,217529949,222554506,227729799,233060350,238550817,244206000];

/**
 * ui.js — Renderização completa da interface do Sunflower Super App
 * Todos os componentes visuais: home, farm, market, alerts, settings
 */

import Storage from './storage.js?v=141';
import { EXPANSION_REQUIREMENTS } from './data/expansions.js?v=141';
import { t } from './i18n.js?v=141';
import Farm from './farm.js?v=141';

window.openExternal = async (url) => {
  if (window.Capacitor && window.Capacitor.isNativePlatform()) {
    try {
      await window.Capacitor.Plugins.Browser.open({ url });
    } catch (e) {
      window.open(url, '_blank');
    }
  } else {
    window.open(url, '_blank');
  }
};

// =====================================================
// ASSETS & CONFIG
// =====================================================
const ASSETS = {
  SFL: 'https://raw.githubusercontent.com/sunflower-land/sunflower-land/main/src/assets/icons/flower_token.webp',
  COINS: 'https://sfl.world/img/source/coins.png',
  GEM: 'https://sfl.world/img/source/Gem.png',
  VIP: 'https://raw.githubusercontent.com/sunflower-land/sunflower-land/main/src/assets/icons/vip.webp',
  SUNFLOWER: 'https://sfl.world/img/source/Sunflower.png',
  CHICKEN: 'https://sfl.world/img/source/Chicken.png',
  ISLAND: 'https://raw.githubusercontent.com/sunflower-land/sunflower-land/main/src/assets/icons/island.png',
  MARK: 'https://sfl.world/img/source/Mark.png',
  APPLE: 'https://sfl.world/img/source/Apple.png'
};

// =====================================================
// UTILITIES
// =====================================================

function formatNumber(n, decimals = 2) {
  if (n === null || n === undefined || isNaN(n)) return '—';
  const num = Number(n);
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000)     return `${(num / 1_000).toFixed(1)}K`;
  return parseFloat(num.toFixed(decimals)).toString();
}

function formatSfl(n) {
  if (!n) return '0';
  const num = Number(n);
  if (num >= 1000) return `${(num / 1000).toFixed(2)}K`;
  return parseFloat(num.toFixed(4)).toString();
}

function formatPrice(n) {
  if (!n) return '0';
  const num = Number(n);
  if (num >= 10) return num.toFixed(2);
  if (num >= 1)  return num.toFixed(3);
  return parseFloat(num.toPrecision(3)).toString();
}

function timeAgo(ms) {
  if (!ms) return '';
  const diff = Date.now() - ms;
  const s = Math.floor(diff / 1000);
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  
  const isPt = t('nav_farm') === 'Fazenda';
  if (h > 0) return isPt ? `há ${h}h` : `${h}h ago`;
  if (m > 0) return isPt ? `há ${m}m` : `${m}m ago`;
  return isPt ? `agora` : `just now`;
}

const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

function setHtml(selector, html) {
  const el = $(selector);
  if (el) el.innerHTML = html;
}

function setText(selector, text) {
  const el = $(selector);
  if (el) el.textContent = text;
}

// Skeleton HTML
function skeletonList(count = 4) {
  return Array(count).fill(0).map(() =>
    `<div class="skeleton skeleton-card"></div>`
  ).join('');
}

function renderLoadingState() {
  setHtml('#home-farm-summary', `
    <div class="stat-grid">
      <div class="skeleton" style="height:90px"></div>
      <div class="skeleton" style="height:90px"></div>
      <div class="skeleton" style="height:90px"></div>
      <div class="skeleton" style="height:90px"></div>
    </div>
  `);
  setHtml('#home-upcoming', '');
  setHtml('#farm-content', `
    <div class="skeleton" style="height:120px;margin-bottom:16px"></div>
    <div class="stat-grid mb-4">
      <div class="skeleton" style="height:90px"></div>
      <div class="skeleton" style="height:90px"></div>
    </div>
    ${skeletonList(4)}
  `);
  setHtml('#market-grid', `
    <div class="skeleton" style="height:80px"></div>
    <div class="skeleton" style="height:80px"></div>
    <div class="skeleton" style="height:80px"></div>
    <div class="skeleton" style="height:80px"></div>
  `);
}

// =====================================================
// PRICE STRIP (global header ticker)
// =====================================================

function renderPriceStrip(exchange) {
  if (!exchange) return;

  const sfl   = exchange.sfl?.usd   ?? 0;
  const pol   = exchange.pol?.usd   ?? 0;
  const gem   = exchange.gem?.usd   ?? 0;
  const coins = exchange.coins?.usd ?? 0;

  setHtml('#price-strip', `
    <div class="price-strip-item">
      <img src="${ASSETS.SFL}" class="price-token-icon" onerror="this.style.display='none'">
      <span class="price-token-label">SFL</span>
      <span class="price-token-value">$${sfl.toFixed(4)}</span>
    </div>
    <div class="price-strip-sep"></div>
    <div class="price-strip-item">
      <span class="price-token-label">POL</span>
      <span class="price-token-value">$${pol.toFixed(4)}</span>
    </div>
    <div class="price-strip-sep"></div>
    <div class="price-strip-item">
      <span class="price-token-label">💎 GEM</span>
      <span class="price-token-value">$${gem.toFixed(3)}</span>
    </div>
    <div class="price-strip-sep"></div>
    <div class="price-strip-item">
      <span class="price-token-label">🪙 COIN</span>
      <span class="price-token-value">$${coins.toFixed(5)}</span>
    </div>
  `);
}

// =====================================================
// HOME PAGE
// =====================================================

function renderHome(exchange, prices, parsedFarm) {
  renderPriceStrip(exchange);

  const sflUsd = exchange?.sfl?.usd ?? 0;
  const sflBrl = exchange?.sfl?.brl ?? 0;

  // SFL big display + Converter
  setHtml('#home-sfl-card', `
    <div class="card card--amber spring-in" style="padding:14px 16px;">
      <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:nowrap;">

        <!-- LEFT: Token Price -->
        <div style="flex-shrink:0;">
          <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;">
            <img src="${ASSETS.SFL}" style="width:20px;height:20px;object-fit:contain;image-rendering:pixelated;image-rendering:crisp-edges;filter:drop-shadow(0 0 6px rgba(245,158,11,0.5));" onerror="this.src='https://sfl.world/img/source/Flower.png'">
            <span style="font-size:10px;font-weight:700;letter-spacing:1px;color:var(--text-tertiary);text-transform:uppercase;">Flower (SFL)</span>
          </div>
          <div style="font-family:var(--font-mono);font-size:clamp(18px,5vw,24px);font-weight:800;color:var(--amber-glow);line-height:1;" data-price-usd>
            $${sflUsd.toFixed(4)}
          </div>
          <div style="font-family:var(--font-mono);font-size:clamp(11px,3vw,13px);color:var(--text-secondary);font-weight:500;margin-top:4px;" data-price-brl>
            R$ ${sflBrl.toFixed(4)}
          </div>
        </div>

        <!-- RIGHT: Converter -->
        <div style="flex:1;max-width:250px;background:rgba(0,0,0,0.15);border-radius:12px;padding:10px;border:1px solid rgba(255,255,255,0.05);">
          <div style="display:flex;align-items:center;gap:8px;">
            <!-- Input -->
            <div style="position:relative;width:95px;flex-shrink:0;">
              <input type="number" id="flw-converter-input" placeholder="0"
                oninput="window.__app.convertFlower(this.value, ${sflBrl}, ${sflUsd})"
                style="width:100%;box-sizing:border-box;background:rgba(255,255,255,0.05);border:1px solid rgba(245,158,11,0.2);border-radius:8px;padding:8px 32px 8px 8px;font-size:16px;font-weight:700;color:var(--text-primary);font-family:var(--font-mono);outline:none;-webkit-appearance:none;appearance:none;text-align:right;">
              <span style="position:absolute;right:8px;top:50%;transform:translateY(-50%);font-size:12px;font-weight:700;color:var(--amber);pointer-events:none;">SFL</span>
            </div>
            
            <!-- Result -->
            <div id="flw-converter-result" style="flex:1;min-width:0;background:rgba(245,158,11,0.08);border:1px solid rgba(245,158,11,0.15);border-radius:8px;padding:8px;font-size:clamp(13px,3.5vw,15px);font-weight:700;color:var(--amber);font-family:var(--font-mono);display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;line-height:1.2;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
              R$&nbsp;0.00
              <span style="font-size:11px;color:var(--text-tertiary);margin-top:2px;">($0.00)</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  `);

  // Quick summary cards
  if (parsedFarm) {
    const farmId = parsedFarm.farmId || Storage.getActiveFarm();
    const username = parsedFarm.username || 'Fazenda';
    const level = parsedFarm.bumpkin?.level || parsedFarm.bumpkinLevel || 1;
    const xp = parsedFarm.bumpkin?.xp || 0;
    const xpProgress = parsedFarm.bumpkin?.xpProgress || 0;
    const totalHelps = parsedFarm.socialFarming?.helpedForCompetition || 0;

    const readyCrops    = parsedFarm.crops.filter(c => c.status === 'ready').reduce((acc, c) => acc + (c.amount || 1), 0);
    const readyFruits   = parsedFarm.fruits ? parsedFarm.fruits.filter(f => f.status === 'ready').length : 0;
    const collectAnimalsArr = parsedFarm.animals.filter(a => a.status === 'ready');
    const attnAnimalsArr = parsedFarm.animals.filter(a => ['soon', 'needsLove', 'sick'].includes(a.status));
    const collectAnimals = collectAnimalsArr.length;
    const attnAnimals = attnAnimalsArr.length;
    const readyAnimals  = collectAnimals + attnAnimals;
    const readyCookingArr  = parsedFarm.buildings ? parsedFarm.buildings.filter(b => b.status === 'ready') : [];
    const readyCooking = readyCookingArr.length;
    const readyCompostArr = parsedFarm.composting ? parsedFarm.composting.filter(c => c.status === 'ready') : [];
    const readyCompost = readyCompostArr.length;
    const totalReady    = readyCrops + readyFruits + readyAnimals + readyCooking + readyCompost;

    const nextCrop = parsedFarm.crops.filter(c => c.status !== 'ready').sort((a,b) => a.msLeft - b.msLeft)[0];
    const nextFruit = parsedFarm.fruits ? parsedFarm.fruits.filter(f => f.status !== 'ready' && parseInt(f.harvestsLeft) > 0).sort((a,b) => a.msLeft - b.msLeft)[0] : null;

    let mainCropName = 'Sunflower';
    if (parsedFarm.crops.length > 0) {
      const activeCrop = parsedFarm.crops.find(c => c.status === 'ready') || nextCrop || parsedFarm.crops[0];
      mainCropName = activeCrop.name;
    }
    const cropIconUrl = `https://sfl.world/img/source/${mainCropName.replace(/\s+/g, '')}.png`;

    let mainFruitName = 'Apple';
    if (parsedFarm.fruits && parsedFarm.fruits.length > 0) {
      const activeFruit = parsedFarm.fruits.find(f => f.status === 'ready') || nextFruit || parsedFarm.fruits[0];
      mainFruitName = activeFruit.name;
    }
    const fruitIconUrl = `https://sfl.world/img/source/${mainFruitName.replace(/\s+/g, '')}.png`;

    const activeAnimalsArr = readyAnimals > 0 ? [...collectAnimalsArr, ...attnAnimalsArr] : parsedFarm.animals;
    const animalTypes = activeAnimalsArr.reduce((acc, a) => {
        acc[a.type] = (acc[a.type] || 0) + 1;
        return acc;
    }, {});
    
    let animalDetailsText = parsedFarm.isPartial ? '-' : `${parsedFarm.animals.length} ${t('home_total')}`;
    if (!parsedFarm.isPartial) {
        const details = [];
        if (animalTypes['Chicken']) details.push(`🐔 ${animalTypes['Chicken']}`);
        if (animalTypes['Cow']) details.push(`🐄 ${animalTypes['Cow']}`);
        if (animalTypes['Sheep']) details.push(`🐑 ${animalTypes['Sheep']}`);
        if (details.length > 0) {
           animalDetailsText = details.join(' • ');
        }
    }

    let expansionValue = `Ilha ${parsedFarm.level}`;
    let expansionClass = "";
    let expansionSub = parsedFarm.isPartial ? '-' : "Nenhuma obra";
    
    if (!parsedFarm.isPartial && parsedFarm.expansionConstruction && parsedFarm.expansionConstruction.readyAt) {
      const msLeft = parsedFarm.expansionConstruction.readyAt - Date.now();
      if (msLeft <= 0) {
        expansionValue = "Pronta!";
        expansionClass = "emerald";
        expansionSub = `Expansão ${parsedFarm.level + 1}`;
      } else {
        expansionValue = Farm.formatCountdown ? Farm.formatCountdown(msLeft) : "Em obra";
        expansionClass = "amber";
        expansionSub = `Expansão ${parsedFarm.level + 1}`;
      }
    }

    // Island resources stats
    const islandTrees = parsedFarm.trees || [];
    const islandRocks = parsedFarm.rocks || [];
    const islandMush  = parsedFarm.mushrooms || [];
    const islandOil   = parsedFarm.oil || [];

    const treesReady  = islandTrees.filter(t => t.status === 'ready').length;
    const treesTotal  = islandTrees.length;
    const stoneReady  = islandRocks.filter(r => r.name === 'Stone Rock' && r.status === 'ready').length;
    const ironReady   = islandRocks.filter(r => r.name === 'Iron Rock' && r.status === 'ready').length;
    const goldReady   = islandRocks.filter(r => r.name === 'Gold Rock' && r.status === 'ready').length;
    const crimsReady  = islandRocks.filter(r => r.name === 'Crimstone' && r.status === 'ready').length;
    const sunReady    = islandRocks.filter(r => r.name === 'Sunstone' && r.status === 'ready').length;
    const mushReady   = islandMush.filter(m => m.status === 'ready').length;
    const oilReady    = islandOil.filter(o => o.status === 'ready').length;
    const totalIslandReady = treesReady + stoneReady + ironReady + goldReady + crimsReady + sunReady + mushReady + oilReady;

    const nextIslandRes = [
      ...islandTrees.filter(t => t.status !== 'ready' && t.msLeft > 0),
      ...islandRocks.filter(r => r.status !== 'ready' && r.msLeft > 0),
      ...islandMush.filter(m => m.status !== 'ready' && m.msLeft > 0),
    ].sort((a, b) => a.msLeft - b.msLeft)[0];

    const islandSub = parsedFarm.isPartial ? '-' :
      (totalIslandReady > 0 ? `${totalIslandReady} pronto${totalIslandReady > 1 ? 's' : ''} para coletar` :
       (nextIslandRes ? `Próximo em ${nextIslandRes.countdown}` : 'Tudo disponível'));


    setHtml('#home-farm-summary', `
      <div class="section-header">
        <div class="section-title">🚜 ${t('home_farm_summary')}</div>
        ${totalReady > 0 ? `<div class="section-badge coral">${totalReady}</div>` : `<div class="section-badge">${t('home_up_to_date')}</div>`}
      </div>
      
      <div class="stat-grid" style="gap: 12px;">
        <!-- SFL Balance -->
        <div class="stat-card spring-in stagger-1" style="display:flex; flex-direction:row; align-items:center; gap:8px; padding: 12px;">
          <div style="width:40px;height:40px;background:var(--surface-3);border:1px solid var(--surface-border);border-radius:12px;display:flex;align-items:center;justify-content:center;box-shadow:inset 0 2px 4px rgba(255,255,255,0.05);">
            <img src="${ASSETS.SFL}" style="width:24px;height:24px;object-fit:contain;image-rendering:pixelated;" onerror="this.style.display='none'">
          </div>
          <div style="flex:1; min-width:0;">
            <div class="stat-label" style="font-size:12px; margin-bottom:2px;">${t('home_balance')}</div>
            <div class="stat-value amber" style="font-size:20px; line-height:1;">${formatSfl(parsedFarm.balance)}</div>
            <div class="stat-sub" style="margin-top:2px;">SFL</div>
          </div>
        </div>
        <!-- Coins -->
        <div class="stat-card spring-in stagger-2" style="display:flex; flex-direction:row; align-items:center; gap:8px; padding: 12px;">
          <div style="width:40px;height:40px;background:var(--surface-3);border:1px solid var(--surface-border);border-radius:12px;display:flex;align-items:center;justify-content:center;box-shadow:inset 0 2px 4px rgba(255,255,255,0.05);">
            <img src="${ASSETS.COINS}" style="width:24px;height:24px;object-fit:contain;image-rendering:pixelated;" onerror="this.style.display='none'; this.nextElementSibling.style.display='inline'">
            <span style="font-size:18px;display:none">🪙</span>
          </div>
          <div style="flex:1; min-width:0;">
            <div class="stat-label" style="font-size:12px; margin-bottom:2px;">${t('home_coins')}</div>
            <div class="stat-value sky" style="font-size:20px; line-height:1;">${formatNumber(parsedFarm.coins, 0)}</div>
            <div class="stat-sub" style="margin-top:2px;">${t('home_coins')}</div>
          </div>
        </div>
        <!-- Gems -->
        ${parsedFarm.gems !== undefined ? `
        <div class="stat-card spring-in stagger-3" style="display:flex; flex-direction:row; align-items:center; gap:8px; padding: 12px;">
          <div style="width:40px;height:40px;background:var(--surface-3);border:1px solid var(--surface-border);border-radius:12px;display:flex;align-items:center;justify-content:center;box-shadow:inset 0 2px 4px rgba(255,255,255,0.05);">
            <img src="${ASSETS.GEM}" style="width:24px;height:24px;object-fit:contain;image-rendering:pixelated;" onerror="this.style.display='none'">
          </div>
          <div style="flex:1; min-width:0;">
            <div class="stat-label" style="font-size:12px; margin-bottom:2px;">Diamantes</div>
            <div class="stat-value" style="font-size:20px; line-height:1; color: #a855f7;">${formatNumber(parsedFarm.gems, 0)}</div>
            <div class="stat-sub" style="margin-top:2px;">Gems</div>
          </div>
        </div>
        ` : ''}
        <!-- VIP -->
        <div class="stat-card spring-in stagger-4" style="display:flex; flex-direction:row; align-items:center; gap:8px; padding: 12px;">
          <div style="width:40px;height:40px;background:var(--surface-3);border:1px solid var(--surface-border);border-radius:12px;display:flex;align-items:center;justify-content:center;box-shadow:inset 0 2px 4px rgba(255,255,255,0.05);">
            <img src="${ASSETS.VIP}" style="width:24px;height:24px;object-fit:contain;image-rendering:pixelated;" onerror="this.style.display='none'">
          </div>
          <div style="flex:1; min-width:0;">
            <div class="stat-label" style="font-size:12px; margin-bottom:2px;">Status VIP</div>
            <div class="stat-value ${parsedFarm.isVip ? 'amber' : ''}" style="font-size:18px; line-height:1;">
              ${parsedFarm.isVip ? 'Ativo' : 'Inativo'}
            </div>
            <div class="stat-sub" style="margin-top:2px;">${!parsedFarm.isVip ? 'Sem passe' : (parsedFarm.vipLifetime ? 'Vitalício' : (parsedFarm.vipDaysLeft > 0 ? `Expira em ${parsedFarm.vipDaysLeft} dias` : 'Expirando...'))}</div>
          </div>
        </div>
        <!-- Crops -->
        <div class="stat-card spring-in stagger-5" onclick="window.__app && window.__app.showCropsModal && window.__app.showCropsModal()" ${parsedFarm.isPartial ? 'style="opacity:0.6; display:flex; flex-direction:row; align-items:center; gap:8px; padding: 12px; cursor:pointer;" title="Ver detalhes das plantações"' : 'style="display:flex; flex-direction:row; align-items:center; gap:8px; padding: 12px; cursor:pointer;" title="Ver detalhes das plantações"'}>
          <div style="width:40px;height:40px;background:var(--surface-3);border:1px solid var(--surface-border);border-radius:12px;display:flex;align-items:center;justify-content:center;box-shadow:inset 0 2px 4px rgba(255,255,255,0.05);">
            <img src="${cropIconUrl}" style="width:24px;height:24px;object-fit:contain;image-rendering:pixelated;" onerror="this.src=ASSETS.SUNFLOWER">
          </div>
          <div style="flex:1; min-width:0;">
            <div class="stat-label" style="font-size:12px; margin-bottom:2px;">${t('home_crops')}</div>
            <div class="stat-value ${readyCrops > 0 ? 'emerald' : ''}" style="font-size:18px; line-height:1;">
              ${parsedFarm.isPartial ? `<span style="font-size:14px;color:var(--text-tertiary)">🔒 ${t('farm_missing_key')}</span>` : 
                (readyCrops > 0 ? readyCrops + (readyCrops > 1 ? ' prontos!' : ' pronto!') : (nextCrop ? nextCrop.countdown : t('home_growing')))}
            </div>
            <div class="stat-sub" style="margin-top:2px;">${parsedFarm.isPartial ? '-' : (readyCrops === 0 && nextCrop ? `às ${new Date(nextCrop.readyAt).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})} • ${parsedFarm.crops.totalPlanted}/${parsedFarm.crops.totalPlots}` : `${parsedFarm.crops.totalPlanted}/${parsedFarm.crops.totalPlots} canteiros`)}</div>
          </div>
          
        </div>
        <!-- Fruits -->
        <div class="stat-card spring-in stagger-5" onclick="window.__app && window.__app.showFruitsModal && window.__app.showFruitsModal()" ${parsedFarm.isPartial ? 'style="opacity:0.6; display:flex; flex-direction:row; align-items:center; gap:8px; padding: 12px; cursor:pointer;" title="Ver frutas"' : 'style="display:flex; flex-direction:row; align-items:center; gap:8px; padding: 12px; cursor:pointer;" title="Ver frutas"'}>
          <div style="width:40px;height:40px;background:var(--surface-3);border:1px solid var(--surface-border);border-radius:12px;display:flex;align-items:center;justify-content:center;box-shadow:inset 0 2px 4px rgba(255,255,255,0.05);">
            <img src="${fruitIconUrl}" style="width:24px;height:24px;object-fit:contain;image-rendering:pixelated;" onerror="this.src=ASSETS.APPLE">
          </div>
          <div style="flex:1; min-width:0;">
            <div class="stat-label" style="font-size:12px; margin-bottom:2px;">FRUTAS</div>
            <div class="stat-value ${readyFruits > 0 ? 'emerald' : ''}" style="font-size:18px; line-height:1;">
              ${parsedFarm.isPartial ? `<span style="font-size:14px;color:var(--text-tertiary)">🔒 ${t('farm_missing_key')}</span>` : 
                (readyFruits > 0 ? readyFruits + (readyFruits > 1 ? ' prontas!' : ' pronta!') : (nextFruit ? nextFruit.countdown : t('home_growing')))}
            </div>
            <div class="stat-sub" style="margin-top:2px;">${parsedFarm.isPartial ? '-' : (readyFruits === 0 && nextFruit ? `às ${new Date(nextFruit.readyAt).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})} • ${parsedFarm.fruits.length} pés` : `${parsedFarm.fruits.length} pés de fruta`)}</div>
          </div>
          
        </div>
        <!-- Animals -->
        <div class="stat-card spring-in stagger-6" onclick="window.__app && window.__app.showAnimalsModal && window.__app.showAnimalsModal()" ${parsedFarm.isPartial ? 'style="opacity:0.6; display:flex; flex-direction:row; align-items:center; gap:8px; padding: 12px; cursor:pointer;" title="Ver detalhes dos animais"' : 'style="display:flex; flex-direction:row; align-items:center; gap:8px; padding: 12px; cursor:pointer;" title="Ver detalhes dos animais"'}>
          <div style="width:40px;height:40px;background:var(--surface-3);border:1px solid var(--surface-border);border-radius:12px;display:flex;align-items:center;justify-content:center;box-shadow:inset 0 2px 4px rgba(255,255,255,0.05);">
            <img src="${ASSETS.CHICKEN}" style="width:24px;height:24px;object-fit:contain;image-rendering:pixelated;" onerror="this.style.display='none'">
          </div>
          <div style="flex:1; min-width:0;">
            <div class="stat-label" style="font-size:12px; margin-bottom:2px;">${t('home_animals')}</div>
            <div class="stat-value ${!parsedFarm.animals || parsedFarm.animals.length === 0 ? '' : (collectAnimals > 0 ? 'emerald' : (attnAnimals > 0 ? 'coral' : ''))}" style="font-size:18px; line-height:1;">
              ${parsedFarm.isPartial ? `<span style="font-size:14px;color:var(--text-tertiary)">🔒 ${t('farm_missing_key')}</span>` : 
                (!parsedFarm.animals || parsedFarm.animals.length === 0 ? 'Nenhum' : (collectAnimals > 0 ? collectAnimals + ' pronto!' : (attnAnimals > 0 ? attnAnimals + ' atenção' : parsedFarm.animals.length + ' ' + t('home_ok'))))}
            </div>
            <div class="stat-sub" style="margin-top:2px;font-size:12px;color:var(--text-secondary);">${!parsedFarm.animals || parsedFarm.animals.length === 0 ? 'Sem animais na fazenda' : animalDetailsText}</div>
          </div>
          
        </div>
        <!-- Composting -->
        <div class="stat-card spring-in stagger-6" onclick="window.__app && window.__app.showCompostModal && window.__app.showCompostModal()" ${parsedFarm.isPartial ? 'style="opacity:0.6; display:flex; flex-direction:row; align-items:center; gap:8px; padding: 12px; cursor:pointer;"' : 'style="display:flex; flex-direction:row; align-items:center; gap:8px; padding: 12px; cursor:pointer;"'} title="Composteiras">
          <div style="width:40px;height:40px;background:var(--surface-3);border:1px solid var(--surface-border);border-radius:12px;display:flex;align-items:center;justify-content:center;box-shadow:inset 0 2px 4px rgba(255,255,255,0.05);">
            <img src="https://raw.githubusercontent.com/sunflower-land/sunflower-land/main/src/assets/composters/compost.png" style="width:24px;height:24px;object-fit:contain;image-rendering:pixelated;" onerror="this.src=ASSETS.APPLE">
          </div>
          <div style="flex:1; min-width:0;">
            <div class="stat-label" style="font-size:12px; margin-bottom:2px;">COMPOSTEIRAS</div>
            <div class="stat-value ${readyCompost > 0 ? 'emerald' : ''}" style="font-size:18px; line-height:1;">
              ${parsedFarm.isPartial ? `<span style="font-size:14px;color:var(--text-tertiary)">🔒 ${t('farm_missing_key')}</span>` : 
                (readyCompost > 0 ? readyCompost + (readyCompost > 1 ? ' prontas!' : ' pronta!') : (parsedFarm.composting.some(c => c.status !== 'idle') ? 'Preparando...' : (parsedFarm.composting.length > 0 ? 'Vazias' : 'Nenhuma')))}
            </div>
            <div class="stat-sub" style="margin-top:2px;font-size:12px;color:var(--text-secondary);">${parsedFarm.isPartial ? '-' : `${parsedFarm.composting.length} Composteiras`}</div>
          </div>
        </div>

        <!-- Island Resources -->
        <div class="stat-card spring-in stagger-6" onclick="window.__app && window.__app.showIslandResourcesModal && window.__app.showIslandResourcesModal()" style="grid-column: 1 / -1; display:flex; flex-direction:row; align-items:center; gap:12px; padding: 14px; cursor:pointer;" title="Recursos da Ilha">
          <div style="width:40px;height:40px;background:var(--surface-3);border:1px solid var(--surface-border);border-radius:12px;display:flex;align-items:center;justify-content:center;box-shadow:inset 0 2px 4px rgba(255,255,255,0.05);flex-shrink:0;">
            <img src="https://sfl.world/img/source/Wood.png" style="width:26px;height:26px;object-fit:contain;image-rendering:pixelated;" onerror="this.style.display='none'">
          </div>
          <div style="flex:1; min-width:0;">
            <div class="stat-label" style="font-size:12px; margin-bottom:5px;">🌿 RECURSOS DA ILHA</div>
            <div style="display:flex; gap:6px; flex-wrap:wrap; align-items:center;">
              ${[
                {img:'Wood', count: treesReady, total: treesTotal, label:'Madeira'},
                {img:'Stone', count: stoneReady, total: islandRocks.filter(r=>r.name==='Stone Rock').length, label:'Pedra'},
                {img:'Iron', count: ironReady, total: islandRocks.filter(r=>r.name==='Iron Rock').length, label:'Ferro'},
                {img:'Gold', count: goldReady, total: islandRocks.filter(r=>r.name==='Gold Rock').length, label:'Ouro'},
                {img:'Crimstone', count: crimsReady, total: islandRocks.filter(r=>r.name==='Crimstone').length, label:'Crimstone'},
                {img:'Sunstone', count: sunReady, total: islandRocks.filter(r=>r.name==='Sunstone').length, label:'Sunstone'},
                {img:'Wild Mushroom', count: mushReady, total: islandMush.length, label:'Cogumelo'},
                {img:'Oil', count: oilReady, total: islandOil.length, label:'Petróleo'},
              ].filter(r => r.total > 0).map(r => `
                <div title="${r.label}" style="display:flex;align-items:center;gap:4px;background:${r.count>0?'rgba(16,185,129,0.12)':'rgba(255,255,255,0.04)'};border:1px solid ${r.count>0?'rgba(16,185,129,0.3)':'rgba(255,255,255,0.08)'};border-radius:8px;padding:4px 8px;">
                  <img src="https://sfl.world/img/source/${encodeURIComponent(r.img)}.png" style="width:16px;height:16px;object-fit:contain;image-rendering:pixelated;" onerror="this.style.display='none'">
                  <span style="font-size:12px;font-weight:700;color:${r.count>0?'var(--emerald)':'var(--text-secondary)'}">${r.count}/${r.total}</span>
                </div>
              `).join('')}
            </div>
            <div class="stat-sub" style="margin-top:5px;font-size:11px;color:var(--text-tertiary);">${islandSub}</div>
          </div>
          <div style="color:var(--text-tertiary);font-size:20px;">›</div>
        </div>

        <!-- Expansion -->
        <div class="stat-card spring-in stagger-6" onclick="window.__app && window.__app.showExpansionModal && window.__app.showExpansionModal()" ${parsedFarm.isPartial ? 'style="grid-column: 1 / -1; opacity:0.6; display:flex; flex-direction:row; align-items:center; gap:8px; padding: 12px; cursor:pointer;" title="Ver detalhes da expansão"' : 'style="grid-column: 1 / -1; display:flex; flex-direction:row; align-items:center; gap:8px; padding: 12px; cursor:pointer;" title="Ver detalhes da expansão"'}>
          <div style="width:40px;height:40px;background:var(--surface-3);border:1px solid var(--surface-border);border-radius:12px;display:flex;align-items:center;justify-content:center;box-shadow:inset 0 2px 4px rgba(255,255,255,0.05);">
            <img src="https://raw.githubusercontent.com/sunflower-land/sunflower-land/main/src/assets/icons/islands/${parsedFarm.islandType || 'basic'}.webp" style="width:24px;height:24px;object-fit:contain;image-rendering:pixelated;" onerror="this.src='${ASSETS.ISLAND}'">
          </div>
          <div style="flex:1; min-width:0;">
            <div class="stat-label" style="font-size:12px; margin-bottom:2px;">EXPANSÃO</div>
            <div class="stat-value ${expansionClass}" style="font-size:18px; line-height:1;">
              ${parsedFarm.isPartial ? `<span style="font-size:14px;color:var(--text-tertiary)">🔒 ${t('farm_missing_key')}</span>` : expansionValue}
            </div>
            <div class="stat-sub" style="margin-top:2px;font-size:12px;color:var(--text-secondary);">${expansionSub}</div>
          </div>
          
        </div>
        <!-- Player Profile -->
          <div class="stat-card spring-in stagger-6-5" style="grid-column: 1 / -1; flex: 1 1 100%; background: rgba(30, 30, 35, 0.6); backdrop-filter: blur(16px); border: 1px solid rgba(255,255,255,0.06); border-radius: 24px; padding: 24px; box-shadow: 0 10px 40px rgba(0,0,0,0.3); position: relative; overflow: hidden;">
            <!-- Background Glow -->
            <div style="position:absolute; top:-50%; left:-10%; width:150%; height:150%; background: radial-gradient(circle at 10% 50%, rgba(245, 158, 11, 0.08) 0%, transparent 50%); pointer-events: none;"></div>
            
            <style>
              .profile-avatar-container {
                width: 90px; height: 90px; min-width: 90px;
                border-radius: 24px;
                background: linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.01));
                border: 1px solid rgba(255, 255, 255, 0.1);
                box-shadow: 0 8px 32px rgba(0,0,0,0.3), inset 0 2px 10px rgba(255,255,255,0.05);
                display: flex; align-items: center; justify-content: center;
                overflow: hidden; position: relative;
              }
              .profile-avatar-img {
                width: 140%; height: 140%;
                object-fit: contain;
                object-position: top;
                filter: drop-shadow(0 4px 6px rgba(0,0,0,0.3));
              }
              .profile-name {
                margin: 0; font-size: 24px; font-weight: 800; color: #fff;
                letter-spacing: -0.5px;
                text-shadow: 0 2px 10px rgba(0,0,0,0.5);
              }
              .profile-id-badge {
                font-size: 13px; font-family: 'SF Mono', Consolas, monospace;
                color: rgba(255,255,255,0.6);
                background: rgba(0,0,0,0.2);
                border: 1px solid rgba(255,255,255,0.05);
                padding: 4px 10px; border-radius: 8px;
                cursor: pointer; transition: all 0.2s ease;
              }
              .profile-id-badge:hover {
                color: #fff; background: rgba(255,255,255,0.1);
              }
              .profile-tag {
                font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;
                padding: 4px 10px; border-radius: 8px;
                display: inline-flex; align-items: center; gap: 4px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.2);
              }
              .tag-vip { background: linear-gradient(135deg, #f59e0b, #d97706); color: #000; border: 1px solid #fcd34d; }
              .tag-island { background: rgba(255,255,255,0.1); color: #ddd; border: 1px solid rgba(255,255,255,0.1); }
              .level-text {
                font-weight: 800; font-size: 14px; color: #fff;
              }
              .xp-bar-container {
                height: 8px; background: rgba(0,0,0,0.4); border-radius: 4px;
                overflow: hidden; width: 100%; border: 1px solid rgba(255,255,255,0.05);
                margin-top: 8px;
              }
              .xp-bar-fill {
                height: 100%; background: linear-gradient(90deg, #3b82f6, #60a5fa);
                border-radius: 4px; box-shadow: 0 0 10px rgba(96, 165, 250, 0.5);
              }
              .stats-block {
                display: flex; flex-direction: column; align-items: center; justify-content: center;
              }
              .stats-text { font-size: 11px; color: rgba(255,255,255,0.5); font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
              .stats-val { font-size: 18px; font-weight: 800; color: #fff; line-height: 1.2; }
            </style>
            
            <div style="position: relative; z-index: 2; display: flex; flex-direction: column; gap: 20px;">
              
              <!-- Top Row: Avatar & Info & Stats -->
              <div style="display: flex; gap: 20px; align-items: center; flex-wrap: wrap;">
                
                <!-- Avatar -->
                <div class="profile-avatar-container">
                  <!-- Fallback SVG -->
                  <div class="bumpkin-loader spinner" style="width:20px; height:20px; border:2px solid rgba(255,255,255,0.1); border-top-color:rgba(255,255,255,0.5); border-radius:50%; animation:spin 1s linear infinite;"></div>
                  <img src="${parsedFarm.bumpkin?.id ? `https://images.bumpkins.io/bumpkins/${parsedFarm.bumpkin.id}.png` : 'https://raw.githubusercontent.com/sunflower-land/sunflower-land/main/src/assets/npcs/snorkel_bumpkin.png'}" 
                       style="display:none; position:absolute; top:15px; width:140%; height:140%; object-fit:contain; object-position:top; filter:drop-shadow(0 4px 6px rgba(0,0,0,0.5));" 
                       onload="this.style.display='block'; this.previousElementSibling.style.display='none';" 
                       onerror="this.onerror=null; this.src='${parsedFarm.bumpkin?.id ? `https://sunflower-land.com/play/bumpkins/${parsedFarm.bumpkin.id}.png` : `https://raw.githubusercontent.com/sunflower-land/sunflower-land/main/src/assets/npcs/snorkel_bumpkin.png`}'; this.onerror=function(){this.src='https://raw.githubusercontent.com/sunflower-land/sunflower-land/main/src/assets/npcs/snorkel_bumpkin.png'; this.style.display='block'; this.previousElementSibling.style.display='none';};" />
                </div>
                
                <!-- Name and Badges -->
                <div style="flex: 1; min-width: 150px; display: flex; flex-direction: column; gap: 8px;">
                  <div style="display: flex; align-items: center; gap: 12px; flex-wrap: wrap;">
                    <h2 class="profile-name">${username === 'Fazenda' ? `Fazenda #${farmId}` : username}</h2>
                    ${username !== 'Fazenda' ? `<div style="display:flex; align-items:center; gap:6px;">
                      <div class="profile-id-badge" title="Copiar Link da Fazenda" onclick="navigator.clipboard.writeText('https://sunflower-land.com/play/#/visit/${farmId}'); alert('Link de visita copiado!'); event.stopPropagation();">
                        #${farmId} <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-2px; margin-left:2px; opacity:0.7;"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                      </div>
                      <div class="profile-id-badge" title="Visitar Fazenda" onclick="window.openExternal('https://sunflower-land.com/play/#/visit/${farmId}', '_blank'); event.stopPropagation();" style="padding: 4px 6px;">
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-2px; opacity:0.7;"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
                      </div>
                    </div>` : ''}
                  </div>
                  
                  <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                    ${parsedFarm.isVip ? `<div class="profile-tag tag-vip">
                      <i class="bi bi-star-fill" style="font-size:10px;"></i> 
                      VIP ${parsedFarm.vipLifetime ? '(Vitalício)' : (parsedFarm.vipDaysLeft > 0 ? `(${parsedFarm.vipDaysLeft}d)` : '')}
                    </div>` : ''}
                    <div class="profile-tag tag-island" style="display:flex; align-items:center; gap:6px;">
                      <img src="https://raw.githubusercontent.com/sunflower-land/sunflower-land/main/src/assets/icons/islands/${parsedFarm.islandType || 'basic'}.webp" style="height:14px; filter:drop-shadow(0 1px 2px rgba(0,0,0,0.5));" onerror="this.src='https://raw.githubusercontent.com/sunflower-land/sunflower-land/main/src/assets/icons/island.png'" />
                      ${parsedFarm.islandType === 'desert' ? 'Deserto' : (parsedFarm.islandType === 'spring' ? 'Primavera' : 'Básica')}
                    </div>
                  </div>
                </div>
                
              </div>
              
              <!-- Bottom Row: Level & Progress -->
              <div style="background: rgba(0,0,0,0.15); padding: 16px; border-radius: 16px; border: 1px solid rgba(255,255,255,0.03);">
                ${(() => {
                  const currentXpStr = Math.floor(xp).toLocaleString('pt-BR');
                  const nextLevel = level + 1;
                  const nextLevelXpRequired = typeof BUMPKIN_EXP !== 'undefined' ? (BUMPKIN_EXP[nextLevel] || BUMPKIN_EXP[BUMPKIN_EXP.length - 1]) : 0;
                  const currentLevelXpRequired = typeof BUMPKIN_EXP !== 'undefined' ? (BUMPKIN_EXP[level] || 0) : 0;
                  const missingXp = Math.max(0, nextLevelXpRequired - xp);
                  const missingXpStr = Math.floor(missingXp).toLocaleString('pt-BR');
                  const computedProgress = nextLevelXpRequired > currentLevelXpRequired ? (xp - currentLevelXpRequired) / (nextLevelXpRequired - currentLevelXpRequired) : xpProgress;
                  
                  return `
                    <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 8px;">
                      <div class="level-text">Bumpkin Nível ${level}</div>
                      <div style="font-size: 13px; font-weight: 700; color: rgba(255,255,255,0.6); font-family: 'SF Mono', Consolas, monospace;">
                        <span style="color: #fff;">${currentXpStr}</span> XP
                      </div>
                    </div>
                    <div class="xp-bar-container">
                      <div class="xp-bar-fill" style="width: ${Math.min(100, Math.max(0, computedProgress * 100))}%;"></div>
                    </div>
                    <div style="text-align: right; margin-top: 8px; font-size: 12px; color: rgba(255,255,255,0.5); font-family: 'SF Mono', Consolas, monospace;">
                      Faltam <span style="color: #60a5fa; font-weight: bold;">${missingXpStr} XP</span> para Nível ${nextLevel}
                    </div>
                  `;
                })()}
              </div>
              
            </div>
          </div>
          <!-- Charm -->
        ${parsedFarm.charm !== undefined && parsedFarm.charm > 0 ? `
        <div class="stat-card spring-in stagger-8" style="display:flex; flex-direction:row; align-items:center; gap:8px; padding: 12px;">
          <div style="width:40px;height:40px;background:var(--surface-3);border:1px solid var(--surface-border);border-radius:12px;display:flex;align-items:center;justify-content:center;box-shadow:inset 0 2px 4px rgba(255,255,255,0.05);">
            <span style="font-size:24px;line-height:1">✨</span>
          </div>
          <div style="flex:1; min-width:0;">
            <div class="stat-label" style="font-size:12px; margin-bottom:2px;">ENCANTO</div>
            <div class="stat-value sky" style="font-size:20px; line-height:1;">${formatNumber(parsedFarm.charm, 0)}</div>
            <div class="stat-sub" style="margin-top:2px;">Pontos</div>
          </div>
        </div>
        ` : ''}
        <!-- Tax Free SFL -->
        ${parsedFarm.taxFreeSFL !== undefined && parsedFarm.taxFreeSFL > 0 ? `
        <div class="stat-card spring-in stagger-9" style="display:flex; flex-direction:row; align-items:center; gap:8px; padding: 12px;">
          <div style="width:40px;height:40px;background:var(--surface-3);border:1px solid var(--surface-border);border-radius:12px;display:flex;align-items:center;justify-content:center;box-shadow:inset 0 2px 4px rgba(255,255,255,0.05);">
            <img src="${ASSETS.SFL}" style="width:24px;height:24px;object-fit:contain;image-rendering:pixelated; filter:hue-rotate(90deg);" onerror="this.style.display='none'">
          </div>
          <div style="flex:1; min-width:0;">
            <div class="stat-label" style="font-size:12px; margin-bottom:2px;">SFL LIVRE DE TAXA</div>
            <div class="stat-value emerald" style="font-size:20px; line-height:1;">${formatSfl(parsedFarm.taxFreeSFL)}</div>
            <div class="stat-sub" style="margin-top:2px;">SFL</div>
          </div>
        </div>
        ` : ''}
      </div>
    `);

    // Next events (top 5 upcoming)
    const allEvents = [
      ...parsedFarm.crops,
      ...parsedFarm.fruits,
      ...parsedFarm.animals.filter(a => a.msLeft > 0),
      ...parsedFarm.buildings,
    ].filter(e => e.msLeft > 0).sort((a, b) => a.msLeft - b.msLeft).slice(0, 5);

    setHtml('#home-upcoming', '');

  } else {
    setHtml('#home-farm-summary', `
      <div class="empty-state">
        <span class="empty-state-icon">🌻</span>
        <div class="empty-state-title">${t('home_no_farm')}</div>
        <div class="empty-state-sub">${t('home_no_farm_sub')}</div>
        <button class="btn-primary" style="margin-top:16px;padding:10px 24px;font-size:13px;" onclick="window.__app.switchTab('settings')">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-right:5px"><path d="m10 11 11 .9c.6 0 .9.5.8 1.1l-.8 5h-1"/><path d="M16 18h-5"/><path d="M18 5a1 1 0 0 0-1 1v5.573"/><path d="M3 4h9l1 7.246"/><path d="M4 11V4"/><circle cx="18" cy="18" r="2"/><circle cx="7" cy="15" r="4"/></svg>
          Conectar Fazenda
        </button>
      </div>
    `);
    setHtml('#home-upcoming', '');
  }
}

function renderFarmPage(parsedFarm, farmId, exchange) {
  // Render the Home widgets (price card, converter, farm summary grid)
  renderHome(exchange, null, parsedFarm);

  if (!parsedFarm) {
    setHtml('#farm-content', `
      <div class="empty-state">
        <span class="empty-state-icon">🏡</span>
        <div class="empty-state-title">${t('farm_enter_id')}</div>
        <div class="empty-state-sub">${t('farm_enter_id_sub')}</div>
      </div>
    `);
    return;
  }

  const { bumpkin, balance, coins, gems, crops, fruits, trees, rocks, animals,
          beehives, buildings, greenhouse, oil, composting, chores, inventory, isPartial } = parsedFarm;

  const readyCrops = crops.filter(c => c.status === 'ready').reduce((acc, c) => acc + (c.amount || 1), 0);
  const attentionAnimalsArr = animals.filter(a => ['ready', 'soon', 'needsLove', 'sick'].includes(a.status));
  const attentionAnimals = attentionAnimalsArr.length;
  
  let animalDetailsText = '-';
  if (!isPartial) {
      if (attentionAnimals > 0) {
          const attentionAnimalTypes = {};
          attentionAnimalsArr.forEach(a => { attentionAnimalTypes[a.type] = (attentionAnimalTypes[a.type] || 0) + 1; });
          
          let details = [];
          if (attentionAnimalTypes['Chicken']) details.push(`🐔 ${attentionAnimalTypes['Chicken']}`);
          if (attentionAnimalTypes['Cow']) details.push(`🐄 ${attentionAnimalTypes['Cow']}`);
          if (attentionAnimalTypes['Sheep']) details.push(`🐑 ${attentionAnimalTypes['Sheep']}`);
          if (details.length > 0) {
              animalDetailsText = details.join(' • ');
          }
      } else {
          animalDetailsText = `${animals.length} ${t('home_total')}`;
      }
  }

  // SFL USD/BRL for converter
  const sflUsd = exchange?.sfl?.usd ?? 0;
  const sflBrl = exchange?.sfl?.brl ?? 0;

  const partialNotice = '';



  // Bumpkin card
  const isVip = parsedFarm.isVip ?? false;
  const islandType = parsedFarm.islandType ?? 'basic';
  const islandLabels = {
    basic: 'Básica', petal: 'Pétala', desert: 'Deserto', volcano: 'Vulcão', spring: 'Primavera'
  };
  const islandLabel = islandLabels[islandType] || islandType;

  const bumpkinHtml = "";

  // Skills
  const skillsList = parsedFarm.skills ?? [];
  const skillsHtml = '';

  const hasKey = !!Storage.getSettings().communityApiKey;

  // Sections
  const allSections = [
    { id: 'crops', title: `🌾 ${t('farm_crops')}`, badge: crops.filter(c => c.status === 'ready').reduce((acc, c) => acc + (c.amount || 1), 0), items: crops, badgeClass: 'emerald' },
    { id: 'fruits', title: `🍇 ${t('farm_fruits')}`, badge: fruits.filter(f => f.status === 'ready').length, items: fruits, badgeClass: 'emerald' },
    { id: 'animals', title: `🐔 ${t('farm_animals')}`, badge: animals.filter(a => ['ready', 'soon', 'needsLove', 'sick'].includes(a.status)).length, items: animals, badgeClass: 'coral' },
    { id: 'trees', title: `🌲 Árvores & Madeira`, badge: trees.filter(t => t.status === 'ready').length, items: trees, badgeClass: 'emerald' },
    { id: 'rocks', title: `⛏️ Minérios & Pedras`, badge: rocks.filter(r => r.status === 'ready').length, items: rocks, badgeClass: 'sky' },
    { id: 'buildings', title: `🏠 ${t('farm_buildings')}`, badge: buildings.filter(b => b.status === 'ready').length, items: buildings, badgeClass: 'amber' },
    { id: 'beehives', title: `🍯 Colmeias & Mel`, badge: beehives.filter(h => h.status === 'ready').length, items: beehives, badgeClass: 'amber' },
    { id: 'greenhouse', title: `🏡 ${t('farm_greenhouse')}`, badge: greenhouse.filter(g => g.status === 'ready').length, items: greenhouse, badgeClass: 'emerald' },
    { id: 'oil', title: `🛢️ Poços de Óleo`, badge: oil.filter(o => o.status === 'ready').length, items: oil, badgeClass: 'sky' },
  ];

  const settings = Storage.getSettings();
  let order = settings.farmSectionOrder || [];
  let collapsed = settings.farmSectionCollapsed || {};
  
  const sectionMap = {};
  allSections.forEach(s => sectionMap[s.id] = s);
  
  const sortedSections = [];
  order.forEach(id => {
    if (sectionMap[id]) {
       sortedSections.push(sectionMap[id]);
       delete sectionMap[id];
    }
  });
  Object.values(sectionMap).forEach(s => sortedSections.push(s));

  const sectionsHtml = sortedSections.map((s, si) => {
    const isCollapsed = !!collapsed[s.id];
    return `
      <div class="mb-4 spring-in farm-section-card" data-id="${s.id}" style="animation-delay:${si * 40}ms">
        <div class="section-header mb-2 drag-handle" style="display:flex; justify-content:space-between; align-items:center; cursor: grab;">
          <div style="display:flex; align-items:center; gap:8px;">
            <i class="bi bi-grip-vertical" style="color:var(--text-tertiary); margin-right:4px;"></i>
            <div class="section-title">${s.title}</div>
            ${s.badge > 0 ? `<div class="section-badge ${s.badgeClass}">${s.badge} ${t('home_ready')}</div>` : ''}
          </div>
          <div style="display:flex; align-items:center; gap:4px;">
            <button onclick="window.__app.toggleFarmSection('${s.id}')" style="background:var(--surface-3);border:1px solid var(--surface-border);color:var(--text-primary);cursor:pointer;padding:4px 8px;border-radius:6px;" title="Minimizar/Expandir"><i class="bi bi-chevron-${isCollapsed ? 'left' : 'down'}"></i></button>
          </div>
        </div>
        
        <div style="display: ${isCollapsed ? 'none' : 'block'};">
          ${s.items.length > 0 ? `
            <div class="farm-items-list" style="display:grid;grid-template-columns:repeat(auto-fill, minmax(110px, 1fr));gap:10px;">
              ${s.items.slice(0, 12).map((item, i) => renderFarmItem(item, i)).join('')}
            </div>
            ${s.items.length > 12 ? `<div style="text-align:center;font-family:var(--font-mono);font-size:13px;color:var(--text-tertiary);padding:8px">+${s.items.length - 12} ${t('market_all')}</div>` : ''}
          ` : `
            <div class="card" style="padding:10px 14px;font-size:13px;color:var(--text-tertiary);display:flex;align-items:center;gap:8px;">
              ${isPartial ? (hasKey ? `
                <i class="bi bi-lock-fill" style="color:var(--amber);font-size:14px;"></i>
                
              ` : `
                <i class="bi bi-lock-fill" style="color:var(--amber);font-size:14px;"></i>
                <span>Insira sua <strong>API Key</strong> em Config para ver dados reais.</span>
              `) : `
                <span style="opacity:0.6;">Nenhum item em produ&ccedil;&atilde;o.</span>
              `}
            </div>
          `}
        </div>
      </div>
    `;
  }).join('');

  // Inventory
  const resItems = inventory.resources ?? [];
  const invHtml = `
    <div class="mb-4">
      <div class="section-header mb-2 mt-4">
        <div class="section-title">🪵 Inventário de Recursos</div>
        ${resItems.length > 0 ? `<div class="section-badge emerald">${resItems.length} Itens</div>` : ''}
      </div>
      ${resItems.length > 0 ? `
        <div class="inventory-grid" style="display:grid;grid-template-columns:repeat(auto-fill, minmax(90px, 1fr));gap:10px;">
          ${resItems.map(item => `
            <div style="text-align:center;position:relative;">
              <div style="width:52px;height:52px;margin:0 auto 6px;background:var(--surface-3);border:1px solid var(--surface-border);border-radius:14px;display:flex;align-items:center;justify-content:center;box-shadow:inset 0 2px 4px rgba(255,255,255,0.1), 0 2px 8px rgba(0,0,0,0.15);">
                <img src="https://sfl.world/img/source/${encodeURIComponent(item.name)}.png" style="width:32px;height:32px;object-fit:contain;image-rendering:pixelated;" onerror="this.style.display='none'; this.nextElementSibling.style.display='inline'">
                <span style="font-size:24px;line-height:1;display:none;">📦</span>
              </div>
              <div style="font-family:var(--font-mono);font-size:14px;font-weight:700;color:var(--text-primary);">${formatNumber(item.amount, 0)}</div>
            </div>
          `).join('')}
        </div>
      ` : `
        <div class="card" style="padding:10px 14px;font-size:13px;color:var(--text-tertiary);display:flex;align-items:center;gap:8px;">
          ${isPartial ? (hasKey ? `
            <i class="bi bi-lock-fill" style="color:var(--amber);font-size:14px;"></i>
            
          ` : `
            <i class="bi bi-lock-fill" style="color:var(--amber);font-size:14px;"></i>
            <span>Insira sua <strong>API Key</strong> em Config para carregar o inventário.</span>
          `) : `
            <span style="opacity:0.6;">Nenhum recurso.</span>
          `}
        </div>
      `}
    </div>
  `;

  // Chores
  const choresHtml = chores.length > 0 ? `
    <div class="mb-4">
      <div class="section-header mb-3">
        <div class="section-title">📋 ${t('farm_chores')}</div>
        <div class="section-badge">${chores.length} ${t('home_active_plots')}</div>
      </div>
      <div class="card">
        ${chores.slice(0, 10).map(c => `
          <div class="chore-item">
            <div class="chore-npc">${c.npc}</div>
            <div class="chore-desc">${c.description}</div>
            <div class="chore-reward">${c.reward?.coins ? `+${formatNumber(c.reward.coins, 0)} 🪙` : ''}</div>
          </div>
        `).join('')}
      </div>
    </div>
  ` : '';

  setHtml('#farm-content', partialNotice + bumpkinHtml + skillsHtml);

  // Inject CSS for drag states if not already present
  if (!document.getElementById('sortable-styles')) {
    const style = document.createElement('style');
    style.id = 'sortable-styles';
    style.innerHTML = `
      .sortable-chosen { opacity: 0.9; cursor: grabbing !important; }
      .sortable-ghost { opacity: 0.3; background: var(--surface-2); border: 2px dashed var(--text-tertiary); }
      .drag-handle { cursor: grab; }
      .drag-handle:active { cursor: grabbing; }
    `;
    document.head.appendChild(style);
  }

  // Initialize Sortable JS
  setTimeout(() => {
    const el = document.getElementById('farm-sections-container');
    if (el && window.Sortable) {
      console.log('Initializing SortableJS on farm-sections-container with bulletproof config');
      window.Sortable.create(el, {
        animation: 150,
        handle: '.drag-handle', // Drag instantly using the header
        ghostClass: 'sortable-ghost',
        chosenClass: 'sortable-chosen',
        onEnd: function (evt) {
          const newOrder = Array.from(el.children).map(child => child.dataset.id);
          Storage.saveSettings({ farmSectionOrder: newOrder });
          console.log('Saved new order:', newOrder);
        }
      });
    } else {
      console.error('Failed to initialize SortableJS', { el, sortable: window.Sortable });
    }
  }, 100);
}

// =====================================================
// FARM ITEM COMPONENT
// =====================================================

function renderFarmItem(item, index) {
  let iconName = item.name;
  if (item.type === 'Chicken' || item.type === 'Cow' || item.type === 'Sheep') iconName = item.type;
  if (item.type === 'building' && item.cooking && item.cooking !== 'Unknown') iconName = item.cooking;
  if (item.type === 'cropMachine' && item.name.includes('(')) iconName = item.name.split('(')[1].replace(')', '');
  
  const iconUrl = `https://sfl.world/img/source/${encodeURIComponent(iconName)}.png`;

  return `
    <div class="farm-item ${item.status}" data-readyat="${item.readyAt ?? 0}" style="animation-delay:${index * 30}ms">
      <img src="${iconUrl}" onerror="this.style.display='none'; this.nextElementSibling.style.display='inline'" style="width:28px;height:28px;object-fit:contain;image-rendering:pixelated;" class="farm-item-icon">
      <span style="font-size:24px;line-height:1;display:none" class="farm-item-emoji">${item.emoji || '🌱'}</span>
      <div class="farm-item-info">
        <div class="farm-item-name">${item.name}</div>
        <div class="farm-item-sub">${item.type ?? ''} ${item.amount ? `x ${item.amount}` : ''}</div>
      </div>
      <div class="farm-item-timer ${item.status}">${item.countdown}</div>
    </div>
  `;
}

// =====================================================
// MARKET PAGE
// =====================================================

const FALLBACK_PRICES = {
  "Sunflower": 0.000405, "Potato": 0.000534, "Pumpkin": 0.001179, "Carrot": 0.002168, "Cabbage": 0.001795,
  "Beetroot": 0.006218, "Cauliflower": 0.008788, "Parsnip": 0.013663, "Radish": 0.010318, "Wheat": 0.0152,
  "Kale": 0.017698, "Apple": 0.0226, "Blueberry": 0.0183, "Orange": 0.017, "Eggplant": 0.010653,
  "Corn": 0.013255, "Banana": 0.02251, "Soybean": 0.002281, "Grape": 0.236675, "Rice": 0.2931,
  "Olive": 0.38828, "Tomato": 0.004972, "Lemon": 0.0093, "Barley": 0.026099, "Rhubarb": 0.000943,
  "Zucchini": 0.000749, "Yam": 0.0031, "Broccoli": 0.004356, "Pepper": 0.006588, "Onion": 0.01279,
  "Turnip": 0.013969, "Artichoke": 0.01217, "Wood": 0.012301, "Stone": 0.02599, "Iron": 0.1004,
  "Gold": 0.34993, "Crimstone": 0.79923, "Obsidian": 20.0, "Egg": 0.02064, "Honey": 0.10267,
  "Feather": 0.00874, "Wool": 0.04197, "Milk": 0.11099, "Leather": 0.0998
};

let _allPrices = {};
let _sflUsd    = 0;

function renderMarketPage(prices, exchange) {
  _sflUsd = exchange?.sfl?.usd ?? 0.0065;
  
  let p2p = prices?.data?.p2p ?? prices?.p2p;
  if (!p2p || Object.keys(p2p).length === 0) {
    p2p = (Object.keys(_allPrices).length > 0) ? _allPrices : FALLBACK_PRICES;
  }
  _allPrices = p2p;

  renderMarketFiltered($('#market-search')?.value ?? '', $('#market-filter-active')?.dataset?.filter ?? 'inventory');

  const settingsContainer = $('#market-settings-container');
  if (settingsContainer) {
    settingsContainer.remove();
  }
}

function renderMarketFiltered(search = '', filter = 'inventory') {
  const p2p = Object.keys(_allPrices).length > 0 ? _allPrices : FALLBACK_PRICES;
  let history = {};
  let alerts = [];
  try {
    history = JSON.parse(localStorage.getItem('prices_history') || '{}');
    alerts = JSON.parse(localStorage.getItem('sfl_price_alerts') || '[]');
  } catch(e) {}

  // Auto-snapshot: record current prices if no history or if snapshot is older than 1h
  try {
    const snapshotKey = 'prices_snapshot_v2';
    const existing = JSON.parse(localStorage.getItem(snapshotKey) || 'null');
    const now = Date.now();
    if (!existing || (now - existing.ts) > 3600000) {
      // Persist previous snapshot as history before overwriting
      if (existing && existing.prices) {
        const newHistory = {};
        Object.entries(p2p).forEach(([name, cur]) => {
          const prev = existing.prices[name];
          if (prev && prev > 0) {
            const trend = cur > prev ? 'up' : (cur < prev ? 'down' : 'stable');
            newHistory[name] = { prev, trend, max: Math.max(cur, prev) };
          }
        });
        localStorage.setItem('prices_history', JSON.stringify(newHistory));
        history = newHistory;
      }
      localStorage.setItem(snapshotKey, JSON.stringify({ ts: now, prices: p2p }));
    } else if (existing && existing.prices) {
      // Build live comparison from snapshot vs current
      const liveHistory = {};
      Object.entries(p2p).forEach(([name, cur]) => {
        const prev = existing.prices[name];
        if (prev && prev > 0 && prev !== cur) {
          const trend = cur > prev ? 'up' : 'down';
          liveHistory[name] = { prev, trend, max: Math.max(cur, prev) };
        }
      });
      // Merge: live comparison overrides stored history
      history = { ...history, ...liveHistory };
    }
  } catch(e) {}

  if (filter === 'history') {
    let salesLog = [];
    try {
      salesLog = JSON.parse(localStorage.getItem('sfl_sales_log') || '[]');
    } catch(e) {}

    if (salesLog.length === 0) {
      setHtml('#market-grid', `
        <div class="empty-state" style="grid-column:1/-1">
          <span class="empty-state-icon">📜</span>
          <div class="empty-state-title">Nenhum histórico registrado</div>
          <div class="empty-state-sub" style="margin-top:8px;">
            As suas vendas começarão a aparecer aqui automaticamente.<br>
            Você também pode registrar compras manuais.
          </div>
          <button onclick="window.__app.promptManualPurchase()" style="margin-top:16px; background:var(--emerald); color:var(--surface-1); border:none; padding:8px 16px; border-radius:8px; font-weight:800; cursor:pointer;">+ Registrar Compra Manual</button>
        </div>
      `);
      return;
    }

    let totalProfit = 0;
    salesLog.forEach(entry => {
      if (entry.type === 'purchase') {
        const livePrice = p2p[entry.item] || (window.__app && window.__app.getEstimatedCost ? window.__app.getEstimatedCost(entry.item) : 0);
        const liveValue = livePrice * (entry.qty || 0);
        totalProfit += (liveValue - (entry.cost || 0));
      } else {
        totalProfit += entry.profit !== undefined ? entry.profit : (entry.sflEarned || 0);
      }
    });

    const totalSales = salesLog.filter(e => e.type !== 'purchase').length;
    const totalPurchases = salesLog.filter(e => e.type === 'purchase').length;

    const listHtml = salesLog.slice().reverse().slice(0, 100).map(entry => {
      const date = new Date(entry.timestamp || Date.now());
      const dateStr = date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
      const timeStr = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      
      const isPurchase = entry.type === 'purchase' || entry.type === 'auto_purchase';
      const isAuto = entry.type === 'auto_purchase';
      let profit = 0;
      let liveValue = 0;
      
      if (isPurchase) {
        const livePrice = p2p[entry.item] || (window.__app && window.__app.getEstimatedCost ? window.__app.getEstimatedCost(entry.item) : 0);
        liveValue = livePrice * (entry.qty || 0);
        profit = liveValue - (entry.cost || 0);
      } else {
        profit = entry.profit !== undefined ? entry.profit : (entry.sflEarned || 0);
      }
      
      const isPositive = profit >= 0;
      const valColor = isPositive ? 'var(--emerald)' : 'var(--coral)';
      const valSign = isPositive ? '+' : '';
      const rowClass = isAuto ? 'history-auto' : (isPurchase ? 'history-manual' : 'history-sale');
      
      let badgeHtml = '';
      if (isPurchase) {
        if (isAuto) badgeHtml = '<span style="font-size:10px;background:rgba(139,92,246,0.15);color:rgb(167,139,250);padding:2px 4px;border-radius:4px;margin-left:4px;">AUTO</span>';
        else badgeHtml = '<span style="font-size:10px;background:rgba(59,130,246,0.15);color:rgb(96,165,250);padding:2px 4px;border-radius:4px;margin-left:4px;">MANUAL</span>';
      }

      return `
        <div class="history-row ${rowClass}" style="display:flex;align-items:center;gap:12px;padding:12px 14px;background:var(--surface-2);border:1px solid var(--surface-border);border-radius:14px;margin-bottom:8px;position:relative;overflow:hidden;">
          ${isPurchase ? `<div style="position:absolute;left:0;top:0;bottom:0;width:4px;background:${isAuto ? 'rgb(167,139,250)' : '#3b82f6'};"></div>` : ''}
          <div style="width:40px;height:40px;background:var(--surface-3);border-radius:12px;display:flex;align-items:center;justify-content:center;flex-shrink:0;border:1px solid rgba(255,255,255,0.06);">
            <img src="https://sfl.world/img/source/${encodeURIComponent(entry.item || 'SFL')}.png" style="width:26px;height:26px;object-fit:contain;image-rendering:pixelated;" onerror="this.style.display='none'">
          </div>
          <div style="flex:1;min-width:0;">
            <div style="font-size:14px;font-weight:800;color:var(--text-primary);">${entry.item || 'Item'} ${badgeHtml}</div>
            <div style="font-size:11px;color:var(--text-tertiary);margin-top:2px;">${dateStr} às ${timeStr}</div>
          </div>
          <div style="text-align:right;flex-shrink:0;">
            <div style="font-size:15px;font-weight:900;color:${valColor};">${valSign}${profit.toFixed(3)} SFL</div>
            ${isPurchase ? `<div style="font-size:10px;color:var(--text-tertiary);">Pago: ${(entry.cost || 0).toFixed(2)} | Atual: ${liveValue.toFixed(2)}</div>` : `<div style="font-size:11px;color:var(--text-tertiary);">Qtd: ${entry.qty || '?'}</div>`}
          </div>
        </div>
      `;
    }).join('');

    setHtml('#market-grid', `
      <div style="grid-column:1/-1;margin-bottom:16px;padding:14px 16px;background:var(--surface-2);border:1px solid var(--surface-border);border-radius:14px;display:flex;justify-content:space-between;align-items:center;">
        <div>
          <div style="font-size:12px;font-weight:700;color:var(--text-tertiary);text-transform:uppercase;letter-spacing:0.5px;">Lucro Total P&L</div>
          <div style="font-size:22px;font-weight:900;color:${totalProfit >= 0 ? 'var(--emerald)' : 'var(--coral)'};">${totalProfit >= 0 ? '+' : ''}${totalProfit.toFixed(3)} SFL</div>
        </div>
        <div style="text-align:right;">
          <div style="font-size:12px;color:var(--text-tertiary);">${totalSales} vendas / ${totalPurchases} compras</div>
          <div style="display:flex; gap:6px; margin-top:6px; justify-content:flex-end;">
            <button onclick="window.__app.promptManualPurchase()" style="background:var(--emerald-subtle);border:1px solid var(--emerald);color:var(--emerald);border-radius:8px;padding:4px 10px;font-size:11px;font-weight:700;cursor:pointer;">+ Compra</button>
            <button onclick="if(confirm('Limpar todo o histórico?')){localStorage.removeItem('sfl_sales_log');window.__app.UI.renderMarketPage(window.__app.State.prices, window.__app.State.exchange);}" style="background:var(--coral-subtle);border:1px solid rgba(239,68,68,0.3);color:var(--coral);border-radius:8px;padding:4px 10px;font-size:11px;font-weight:700;cursor:pointer;">Limpar</button>
          </div>
        </div>
      </div>
      
      <div style="grid-column:1/-1; display:flex; gap:8px; margin-bottom:12px; overflow-x:auto; padding-bottom:4px;">
         <div onclick="document.querySelectorAll('.history-row').forEach(e=>e.style.display='flex');" style="cursor:pointer; font-size:11px; font-weight:800; background:var(--surface-3); padding:6px 14px; border-radius:16px; color:var(--text-primary);">Todas</div>
         <div onclick="document.querySelectorAll('.history-row').forEach(e=>e.style.display=e.classList.contains('history-sale')?'flex':'none');" style="cursor:pointer; font-size:11px; font-weight:800; background:rgba(16,185,129,0.15); color:var(--emerald); padding:6px 14px; border-radius:16px;">Vendas</div>
         <div onclick="document.querySelectorAll('.history-row').forEach(e=>e.style.display=e.classList.contains('history-auto')?'flex':'none');" style="cursor:pointer; font-size:11px; font-weight:800; background:rgba(139,92,246,0.15); color:rgb(167,139,250); padding:6px 14px; border-radius:16px;">Auto</div>
         <div onclick="document.querySelectorAll('.history-row').forEach(e=>e.style.display=e.classList.contains('history-manual')?'flex':'none');" style="cursor:pointer; font-size:11px; font-weight:800; background:rgba(59,130,246,0.15); color:rgb(96,165,250); padding:6px 14px; border-radius:16px;">Manual</div>
      </div>
      ${listHtml}
    `);
    return;
    return;
  }

  // ── INVENTORY filter: show current holdings and their market value ──
  if (filter === 'inventory') {
    const rawInv = window.__app?.State?.parsedFarm?.rawInventory || {};
    let totalSflValue = 0;
    
    const inventoryList = Object.entries(rawInv)
      .map(([name, qty]) => {
        const priceInSfl = p2p[name] || 0;
        const totalValue = priceInSfl * qty;
        totalSflValue += totalValue;
        return { name, qty, priceInSfl, totalValue };
      })
      .filter(item => item.totalValue > 0 || search.trim() !== '')
      .filter(item => search.trim() === '' || item.name.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => b.totalValue - a.totalValue); // Sort by highest value
      
    if (inventoryList.length === 0) {
      setHtml('#market-grid', `
        <div class="empty-state" style="grid-column:1/-1">
          <span class="empty-state-icon">📦</span>
          <div class="empty-state-title">Nenhum recurso de valor encontrado</div>
        </div>
      `);
      return;
    }

    const listHtml = inventoryList.map(item => {
      const usdTotal = item.totalValue * _sflUsd;
      const sflFmt = item.totalValue >= 1 ? item.totalValue.toFixed(2) : item.totalValue.toFixed(4);
      const usdFmt = usdTotal >= 1 ? usdTotal.toFixed(2) : usdTotal.toFixed(4);
      const qtyFmt = item.qty >= 1000 ? (item.qty/1000).toFixed(1) + 'k' : item.qty;
      
      return `
        <div class="market-card" style="display:flex; flex-direction:column; gap:10px; padding:12px; background:var(--surface-2); border:1px solid rgba(255,255,255,0.05); border-radius:12px;">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <div style="display:flex; align-items:center; gap:12px;">
              <div style="width:36px; height:36px; background:var(--surface-3); border-radius:10px; display:flex; align-items:center; justify-content:center; box-shadow:inset 0 2px 4px rgba(0,0,0,0.2);">
                <img src="https://sfl.world/img/source/${encodeURIComponent(item.name.replace(/\s+/g, ''))}.png" style="width:24px;height:24px;object-fit:contain;image-rendering:pixelated; filter:drop-shadow(0 2px 4px rgba(0,0,0,0.3));" onerror="this.src=ASSETS.SUNFLOWER">
              </div>
              <div>
                <div style="font-size:15px;font-weight:800;color:var(--text-primary);letter-spacing:0.3px;">${item.name}</div>
                <div style="font-size:12px;color:var(--text-tertiary); font-weight:600;">Qtd: <span style="color:var(--text-secondary);">${item.qty}</span></div>
              </div>
            </div>
          </div>
          <div style="padding-top:10px; border-top:1px dashed rgba(255,255,255,0.08); display:flex; justify-content:space-between; align-items:center;">
            <div style="font-size:11px; font-weight:700; color:var(--text-tertiary); text-transform:uppercase; letter-spacing:0.5px;">Patrimônio</div>
            <div style="text-align:right;">
              <div style="font-size:16px; font-weight:900; color:var(--amber-glow); line-height:1; filter:drop-shadow(0 0 8px rgba(245,158,11,0.2));">${sflFmt} SFL</div>
              <div style="font-size:11px; font-weight:700; color:var(--emerald); margin-top:3px;">$${usdFmt} USD</div>
            </div>
          </div>
        </div>
      `;
    }).join('');

    const totalUsdValue = totalSflValue * _sflUsd;
    const headerSfl = totalSflValue >= 1 ? totalSflValue.toFixed(2) : totalSflValue.toFixed(4);
    const headerUsd = totalUsdValue >= 1 ? totalUsdValue.toFixed(2) : totalUsdValue.toFixed(4);
    
    setHtml('#market-grid', `
      <div style="grid-column:1/-1;margin-bottom:16px;padding:16px;background:linear-gradient(145deg, var(--surface-2) 0%, rgba(30,41,59,0.8) 100%);border:1px solid rgba(245,158,11,0.2);border-radius:16px;display:flex;justify-content:space-between;align-items:center;box-shadow:0 8px 16px rgba(0,0,0,0.2);">
        <div>
          <div style="font-size:11px;font-weight:800;color:var(--text-tertiary);text-transform:uppercase;letter-spacing:1px; margin-bottom:4px;">💰 Valor do Inventário</div>
          <div style="font-size:26px;font-weight:900;color:var(--amber-glow); letter-spacing:-0.5px; filter:drop-shadow(0 0 10px rgba(245,158,11,0.3));">${headerSfl} SFL</div>
          <div style="font-size:14px;color:var(--emerald); font-weight:800; margin-top:2px;">$${headerUsd} USD</div>
        </div>
      </div>
      ${listHtml}
    `);
    return;
  }

  // ── WALLET filter: manual portfolio tracking ──
  if (filter === 'wallet') {
    let positions = [];
    if (window.__app && window.__app.getWalletPositions) {
      positions = window.__app.getWalletPositions();
    }
    
    if (search.trim() !== '') {
      positions = positions.filter(p => p.itemName.toLowerCase().includes(search.toLowerCase()));
    }

    if (positions.length === 0) {
      setHtml('#market-grid', `
        <div class="empty-state" style="grid-column:1/-1">
          <span class="empty-state-icon">💳</span>
          <div class="empty-state-title">Sua Carteira está Vazia</div>
          <div class="empty-state-sub" style="margin-top:8px;">
            Registre suas compras e investimentos para acompanhar lucros e prejuízos.
          </div>
          <button onclick="window.__app.UI.promptWalletPosition()" style="margin-top:16px; background:var(--emerald); color:var(--surface-1); border:none; padding:8px 16px; border-radius:8px; font-weight:800; cursor:pointer;">+ Registrar Investimento</button>
        </div>
      `);
      return;
    }

    let totalInvested = 0;
    let totalLiveValue = 0;

    const listHtml = positions.map(pos => {
      const livePrice = p2p[pos.itemName] || 0;
      const liveTotal = livePrice * pos.qty;
      const profit = liveTotal - pos.totalCostSfl;
      const pctChange = pos.totalCostSfl > 0 ? (profit / pos.totalCostSfl) * 100 : 0;
      
      totalInvested += pos.totalCostSfl;
      totalLiveValue += liveTotal;

      const isPositive = profit >= 0;
      const valColor = isPositive ? 'var(--emerald)' : 'var(--coral)';
      const valSign = isPositive ? '+' : '';

      return `
        <div class="market-card" style="display:flex; flex-direction:column; gap:8px;">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <div style="display:flex; align-items:center; gap:8px;">
              <img src="https://sfl.world/img/source/${encodeURIComponent(pos.itemName.replace(/\s+/g, ''))}.png" style="width:28px;height:28px;object-fit:contain;image-rendering:pixelated;" onerror="this.src=ASSETS.SUNFLOWER">
              <div>
                <div style="font-size:14px;font-weight:800;color:var(--text-primary);">${pos.itemName}</div>
                <div style="font-size:11px;color:var(--text-tertiary);">Qtd: ${pos.qty}</div>
              </div>
            </div>
            <button onclick="if(confirm('Remover ${pos.itemName} da carteira?')) window.__app.removeWalletPosition('${pos.itemName}')" style="background:none; border:none; color:var(--text-tertiary); font-size:18px; cursor:pointer; padding:0 4px;">&times;</button>
          </div>
          
          <div style="margin-top:auto; padding-top:8px; border-top:1px solid var(--surface-border); display:grid; grid-template-columns:1fr 1fr; gap:8px;">
            <div>
              <div style="font-size:10px; color:var(--text-tertiary);">Pago (Médio):</div>
              <div style="font-size:12px; font-weight:700; color:var(--text-secondary);">${pos.averagePrice.toFixed(4)} SFL</div>
            </div>
            <div style="text-align:right;">
              <div style="font-size:10px; color:var(--text-tertiary);">Preço Atual:</div>
              <div style="font-size:12px; font-weight:700; color:var(--text-primary);">${livePrice.toFixed(4)} SFL</div>
            </div>
            <div style="grid-column:1/-1; padding-top:6px; border-top:1px dashed var(--surface-border); display:flex; justify-content:space-between; align-items:baseline;">
              <div style="font-size:10px; color:var(--text-tertiary);">Lucro (P&L):</div>
              <div style="font-size:14px; font-weight:800; color:${valColor};">${valSign}${profit.toFixed(3)} SFL <span style="font-size:10px;">(${valSign}${pctChange.toFixed(1)}%)</span></div>
            </div>
          </div>
        </div>
      `;
    }).join('');

    const totalProfit = totalLiveValue - totalInvested;
    const totalPct = totalInvested > 0 ? (totalProfit / totalInvested) * 100 : 0;
    
    setHtml('#market-grid', `
      <div style="grid-column:1/-1;margin-bottom:16px;padding:14px 16px;background:var(--surface-2);border:1px solid var(--surface-border);border-radius:14px;display:flex;justify-content:space-between;align-items:center;">
        <div>
          <div style="font-size:12px;font-weight:700;color:var(--text-tertiary);text-transform:uppercase;letter-spacing:0.5px;">Carteira (P&L Aberto)</div>
          <div style="font-size:22px;font-weight:900;color:${totalProfit >= 0 ? 'var(--emerald)' : 'var(--coral)'};">${totalProfit >= 0 ? '+' : ''}${totalProfit.toFixed(3)} SFL</div>
          <div style="font-size:12px;color:var(--text-secondary); margin-top:2px;">Total Investido: ${totalInvested.toFixed(2)} SFL</div>
        </div>
        <div style="text-align:right;">
          <button onclick="window.__app.UI.promptWalletPosition()" style="background:var(--emerald-subtle);border:1px solid var(--emerald);color:var(--emerald);border-radius:8px;padding:6px 12px;font-size:12px;font-weight:700;cursor:pointer;">+ Registrar</button>
        </div>
      </div>
      ${listHtml}
    `);
    return;
  }

  let entries = [];
  // ── OPPORTUNITIES filter: show market-wide price movements (independent of inventory) ──
  if (filter === 'opportunities') {
    const p2pItems = Object.entries(p2p);
    const opsList = p2pItems.map(([name, priceInSfl]) => {
      const h = history[name] || {};
      let pctChange = 0;
      if (h.prev && h.prev > 0) {
        pctChange = ((priceInSfl - h.prev) / h.prev) * 100;
      }
      let valChange = 0;
      if (h.prev && h.prev > 0) {
        valChange = priceInSfl - h.prev;
      }
      const isPump = h.trend === 'up' && h.prev && priceInSfl > h.prev * 1.10;
      return { name, priceInSfl, pctChange, valChange, isPump, trend: h.trend, prev: h.prev, max: h.max };
    });

    // Sort by % change descending (only show items with a price movement)
    const rising = opsList
      .filter(i => i.pctChange > 0)
      .sort((a, b) => b.pctChange - a.pctChange);
    const stable = opsList
      .filter(i => i.pctChange === 0 && i.priceInSfl > 0)
      .sort((a, b) => b.priceInSfl - a.priceInSfl);
    const falling = opsList
      .filter(i => i.pctChange < 0)
      .sort((a, b) => a.pctChange - b.pctChange);

    const allOpps = [...rising, ...stable, ...falling];
    const filtered = search ? allOpps.filter(i => i.name.toLowerCase().includes(search.toLowerCase())) : allOpps;

    if (filtered.length === 0) {
      setHtml('#market-grid', `<div class="empty-state" style="grid-column:1/-1"><span class="empty-state-icon">📈</span><div class="empty-state-title">Sem movimentações ainda</div><div class="empty-state-sub" style="margin-top:8px;">Os preços serão atualizados automaticamente. Volte em breve para ver as oportunidades.</div></div>`);
      return;
    }

    setHtml('#market-grid', `<div style="grid-column:1/-1;">` + filtered.slice(0, 60).map((item, idx) => {
      const isRising = item.pctChange > 0;
      const isFalling = item.pctChange < 0;
      const pctStr = item.pctChange !== 0 ? `${isRising ? '+' : ''}${item.pctChange.toFixed(1)}%` : 'ESTÁVEL';
      const valStr = item.valChange !== undefined && item.valChange !== 0 ? `${isRising ? '+' : ''}${item.valChange.toFixed(4)} SFL` : '';
      const pctColor = isRising ? 'var(--emerald)' : (isFalling ? 'var(--coral)' : 'var(--text-tertiary)');
      const trendIcon = isRising ? '▲' : (isFalling ? '▼' : '→');
      const rank = idx + 1;
      const rankColor = rank === 1 ? '#FFD700' : (rank === 2 ? '#C0C0C0' : (rank === 3 ? '#CD7F32' : 'var(--text-tertiary)'));

      return `
        <div style="display:flex;align-items:center;gap:12px;padding:12px 14px;background:var(--surface-2);border:1px solid ${item.isPump ? 'rgba(16,185,129,0.4)' : 'var(--surface-border)'};border-radius:14px;margin-bottom:8px;${item.isPump ? 'box-shadow:0 0 12px rgba(16,185,129,0.1);' : ''}">
          <div style="min-width:24px;font-size:13px;font-weight:900;color:${rankColor};text-align:center;">${rank <= 3 ? (rank === 1 ? '🥇' : rank === 2 ? '🥈' : '🥉') : `#${rank}`}</div>
          <div style="width:42px;height:42px;background:var(--surface-3);border-radius:12px;border:1px solid rgba(255,255,255,0.06);display:flex;align-items:center;justify-content:center;flex-shrink:0;">
            <img src="https://sfl.world/img/source/${encodeURIComponent(item.name)}.png" style="width:26px;height:26px;object-fit:contain;image-rendering:pixelated;" onerror="this.style.display='none'">
          </div>
          <div style="flex:1;min-width:0;">
            <div style="font-size:14px;font-weight:800;color:var(--text-primary);">${item.name} ${item.isPump ? '🔥' : ''}</div>
            <div style="font-size:11px;color:var(--text-tertiary);margin-top:2px;">
              Atual: <b style="color:var(--text-secondary)">${item.priceInSfl.toFixed(4)} SFL</b>
              ${item.prev ? ` • Antes: ${item.prev.toFixed(4)}` : ''}
              ${item.max ? ` • Máx: ${item.max.toFixed(4)}` : ''}
            </div>
          </div>
          <div style="text-align:right;flex-shrink:0;">
            <div style="font-size:15px;font-weight:900;color:${pctColor};">${trendIcon} ${valStr || pctStr}</div>
            ${item.pctChange !== 0 ? `<div style="font-size:11px;color:${pctColor};margin-top:2px;font-weight:700;">${pctStr}</div>` : '<div style="font-size:10px;color:var(--text-tertiary)">Estável</div>'}
          </div>
        </div>
      `;
    }).join('') + `</div>`);
    return;
  }

  // ── PORTFOLIO filter: show ALL inventory items ──
  if (window.__app.State.parsedFarm && window.__app.State.parsedFarm.inventory) {
    const inv = window.__app.State.parsedFarm.inventory;
    const allOwned = [...(inv.crops || []), ...(inv.resources || []), ...(inv.food || []), ...(inv.special || [])];
    
    allOwned.forEach(item => {
      if (item.qty <= 0) return;
      const priceInSfl = p2p[item.name] || 0;
      const baseCost = window.__app && window.__app.getEstimatedCost ? window.__app.getEstimatedCost(item.name) : 0;
      const totalValue = item.qty * priceInSfl;
      const unitProfit = priceInSfl > 0 ? priceInSfl - baseCost : 0;
      const totalProfit = unitProfit * item.qty;
      const profitMargin = baseCost > 0 ? (unitProfit / baseCost) * 100 : 0;

      entries.push({
        name: item.name,
        qty: item.qty,
        priceInSfl,
        hasPrice: priceInSfl > 0,
        baseCost,
        unitProfit,
        totalProfit,
        profitMargin,
        totalValue
      });
    });
  }

  if (!window.__app.State.parsedFarm || !window.__app.State.parsedFarm.inventory) {
    setHtml('#market-grid', '<div class="empty-state" style="grid-column:1/-1; padding:30px; background:var(--surface-2); border-radius:16px; border:1px solid rgba(255,255,255,0.05); text-align:center;"><span style="font-size:32px; display:block; margin-bottom:12px;">⚠️</span><div style="font-size:16px; font-weight:800; color:var(--text-primary);">Inventário Indisponível</div><div style="font-size:13px; color:var(--text-secondary); margin-top:8px;">Configure sua API Key corretamente na aba "Ajustes" para acessar seu estoque.</div></div>');
    return;
  }

  if (search) {
    const q = search.toLowerCase();
    entries = entries.filter(e => e.name.toLowerCase().includes(q));
  }

  // Portfolio: items with price first (sorted by total value), then items without price (sorted by qty)
  const withPrice = entries.filter(e => e.hasPrice).sort((a, b) => b.totalValue - a.totalValue);
  const noPrice = entries.filter(e => !e.hasPrice).sort((a, b) => b.qty - a.qty);
  entries = [...withPrice, ...noPrice];

  // Calculate total portfolio value
  const totalPortfolioSfl = withPrice.reduce((sum, e) => sum + e.totalValue, 0);

  setHtml('#market-grid', entries.length > 0 ? `
    <div style="grid-column:1/-1; margin-bottom:12px; padding:14px 16px; background:linear-gradient(135deg, rgba(245,158,11,0.1), rgba(16,185,129,0.08)); border:1px solid rgba(245,158,11,0.2); border-radius:14px; display:flex; justify-content:space-between; align-items:center;">
      <div>
        <div style="font-size:11px;font-weight:700;color:var(--text-tertiary);text-transform:uppercase;letter-spacing:0.5px;">Valor Total do Portfólio</div>
        <div style="font-size:22px;font-weight:900;color:var(--amber);">${totalPortfolioSfl.toFixed(2)} SFL</div>
      </div>
      <div style="text-align:right;">
        <div style="font-size:11px;color:var(--text-tertiary);">${entries.length} itens no inventário</div>
        <div style="font-size:12px;color:var(--emerald);margin-top:2px;">${withPrice.length} com preço P2P</div>
      </div>
    </div>
    ${entries.map(item => {
    const safeName = item.name.replace(/'/g, "\\'");
    
    let trendHtml = '';
    let isPump = false;
    if (history[item.name]) {
      const h = history[item.name];
      if (h.trend === 'up') {
        isPump = h.prev && item.priceInSfl > h.prev * 1.10;
        trendHtml = `<span style="color:var(--emerald); font-size:11px; margin-left:4px;">▲ ${isPump ? '🔥' : ''}</span>`;
      } else if (h.trend === 'down') {
        trendHtml = '<span style="color:var(--coral); font-size:11px; margin-left:4px;">▼</span>';
      }
    }

    let savedCost = 0;
    try { savedCost = JSON.parse(localStorage.getItem('sfl_base_cost') || '{}')[item.name]; } catch(e) {}
    const hasCustomCost = savedCost > 0;
    const costToUse = hasCustomCost ? savedCost : item.priceInSfl;

    const profitTarget = (() => {
      try { return JSON.parse(localStorage.getItem('sfl_profit_pct') || '{}'); } catch(e) { return {}; }
    })();
    const itemProfitPct = profitTarget[item.name] || 0;
    const farm = window.__app.State.parsedFarm || {};
    let farmTaxPct = farm.taxRate !== undefined ? farm.taxRate : 15;
    if (farm.isVip) farmTaxPct = farmTaxPct * 0.5;
    const farmTaxRate = farmTaxPct / 100;

    const targetPriceNeeded = hasCustomCost && itemProfitPct > 0
      ? (costToUse * (1 + itemProfitPct / 100)) / (1 - farmTaxRate)
      : null;
    const unitProfit = hasCustomCost ? (item.priceInSfl * (1 - farmTaxRate)) - costToUse : 0;
    const profitMarginCalc = hasCustomCost && costToUse > 0 ? (unitProfit / costToUse) * 100 : 0;
    const isTargetHit = targetPriceNeeded !== null ? item.priceInSfl >= targetPriceNeeded : false;

    let cardBorder = item.hasPrice ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.03)';
    let targetFooterHtml = '';

    if (itemProfitPct > 0 && targetPriceNeeded) {
      if (isTargetHit) {
        cardBorder = 'rgba(16,185,129,0.4)';
        targetFooterHtml = `<div style="background:rgba(16,185,129,0.1); border-top:1px solid rgba(16,185,129,0.2); padding:10px 16px; display:flex; justify-content:space-between; align-items:center;"><div style="display:flex; align-items:center; gap:8px;"><span style="background:var(--emerald); color:#000; padding:2px 6px; border-radius:4px; font-size:10px; font-weight:900;">✅ META +${itemProfitPct}%</span><span style="font-size:11px; font-weight:700; color:var(--emerald);">Atingida!</span></div><div style="font-size:11px; font-weight:800; color:var(--emerald);">Alvo era ${targetPriceNeeded.toFixed(4)}</div></div>`;
      } else {
        targetFooterHtml = `<div style="background:rgba(0,0,0,0.2); border-top:1px solid rgba(255,255,255,0.04); padding:10px 16px; display:flex; justify-content:space-between; align-items:center;"><div style="display:flex; align-items:center; gap:8px;"><span style="background:rgba(245,158,11,0.15); border:1px solid rgba(245,158,11,0.3); color:var(--amber); padding:2px 6px; border-radius:4px; font-size:10px; font-weight:900;">🎯 META +${itemProfitPct}%</span><span style="font-size:11px; font-weight:700; color:var(--text-tertiary);">Alvo: ${targetPriceNeeded.toFixed(4)}</span></div><div style="font-size:11px; font-weight:800; color:var(--amber);">Falta ${(targetPriceNeeded - item.priceInSfl).toFixed(4)}</div></div>`;
      }
    }

    const lucroColor = hasCustomCost ? (unitProfit >= 0 ? 'var(--emerald)' : 'var(--coral)') : 'var(--text-tertiary)';
    const lucroValStr = hasCustomCost ? (unitProfit >= 0 ? '+' : '') + unitProfit.toFixed(4) : '--';

    if (!item.hasPrice) {
      // Simplified card for items with no P2P price
      return `
        <div class="market-item spring-in" style="display:flex; flex-direction:column; background:var(--surface-2); border:1px solid rgba(255,255,255,0.03); border-radius:16px; opacity:0.7;">
          <div style="padding:12px 14px; display:flex; gap:12px; align-items:center;">
            <div style="width:40px; height:40px; background:var(--surface-3); border-radius:10px; border:1px solid rgba(255,255,255,0.04); display:flex; align-items:center; justify-content:center; flex-shrink:0;">
              <img src="https://sfl.world/img/source/${encodeURIComponent(item.name)}.png" style="width:26px; height:26px; object-fit:contain; image-rendering:pixelated;" onerror="this.style.display='none';">
            </div>
            <div style="flex:1; min-width:0;">
              <div style="font-size:14px;font-weight:800;color:var(--text-primary);">${item.name}</div>
              <div style="font-size:12px;color:var(--text-tertiary);margin-top:2px;">${Number.isInteger(item.qty) ? item.qty : parseFloat(item.qty).toFixed(2)} un • Sem preço P2P</div>
            </div>
          </div>
        </div>
      `;
    }

    const totalSfl = item.qty * item.priceInSfl;
    return `
      <div class="market-item spring-in" style="display:flex; flex-direction:column; background:var(--surface-2); border:1px solid ${cardBorder}; border-radius:16px; box-shadow:0 4px 12px rgba(0,0,0,0.2); position:relative; overflow:hidden; cursor:pointer; transition:all 0.2s ease;" onclick="window.__app.openP2pCalc('${safeName}', ${item.priceInSfl})">
        
        ${isPump ? `<div style="position:absolute; top:12px; left:60px; background:rgba(239,68,68,0.15); color:var(--coral); font-size:9px; font-weight:900; padding:2px 6px; border-radius:4px; border:1px solid rgba(239,68,68,0.3); z-index:2; animation:pulse 2s infinite;">PUMP 🔥</div>` : ''}

        <div style="padding:16px; display:flex; gap:14px; position:relative;">
          
          <!-- Icon -->
          <div style="width:48px; height:48px; background:var(--surface-3); border-radius:12px; border:1px solid rgba(255,255,255,0.06); display:flex; align-items:center; justify-content:center; flex-shrink:0;">
            <img src="https://sfl.world/img/source/${encodeURIComponent(item.name)}.png" style="width:28px; height:28px; object-fit:contain; image-rendering:pixelated;" onerror="this.style.display='none';">
          </div>
          
          <!-- Stats -->
          <div style="flex:1; min-width:0;">
            <!-- Title Row -->
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
              <div style="display:flex; align-items:baseline; gap:6px; min-width:0;">
                <span style="font-size:16px; font-weight:800; color:var(--text-primary); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${item.name}</span>
                <span style="font-size:11px; font-weight:700; color:var(--text-tertiary); background:rgba(255,255,255,0.05); padding:2px 6px; border-radius:4px;">${Number.isInteger(item.qty) ? item.qty : parseFloat(item.qty).toFixed(2)} un</span>
              </div>
              <div style="font-size:14px; font-weight:800; color:var(--emerald); white-space:nowrap;">= ${totalSfl.toFixed(2)}</div>
            </div>
            
            <!-- Data Grid -->
            <div style="display:grid; grid-template-columns: 1fr 1fr; row-gap:10px; column-gap:8px;">
              <!-- Preço -->
              <div>
                <div style="font-size:9px; font-weight:700; color:var(--text-tertiary); text-transform:uppercase; margin-bottom:2px; letter-spacing:0.5px;">Preço Mercado</div>
                <div style="font-size:13px; font-weight:800; color:var(--text-secondary); display:flex; align-items:center;">
                  ${item.priceInSfl.toFixed(4)} SFL ${trendHtml}
                </div>
              </div>
              <!-- Lucro -->
              <div style="text-align:right;">
                <div style="font-size:9px; font-weight:700; color:var(--text-tertiary); text-transform:uppercase; margin-bottom:2px; letter-spacing:0.5px;">Seu Lucro</div>
                <div style="font-size:13px; font-weight:800; color:${lucroColor};">
                  ${lucroValStr}
                </div>
              </div>
              <!-- Custo -->
              <div>
                <div style="font-size:9px; font-weight:700; color:var(--text-tertiary); text-transform:uppercase; margin-bottom:2px; letter-spacing:0.5px;">Custo Compra</div>
                <div style="font-size:12px; font-weight:700; color:var(--text-tertiary);">${hasCustomCost ? costToUse.toFixed(4) : '--'} SFL</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer (if target exists) -->
        ${targetFooterHtml}
      </div>
    `;
  }).join('')}` : `<div class="empty-state" style="grid-column:1/-1"><span class="empty-state-icon">🤷</span><div class="empty-state-title">Inventário Vazio</div><div class="empty-state-sub" style="margin-top:8px;">Você não tem itens no inventário ou configure sua API Key para ver o estoque completo.</div></div>`);
}

// =====================================================
// P2P CALCULATOR & MODAL
// =====================================================

function showModal(title, html) {
  const modal = $('#app-modal');
  $('#modal-title').textContent = title;
  $('#modal-body').innerHTML = html;
  modal.style.display = 'flex';
}

function hideModal() {
  $('#app-modal').style.display = 'none';
}

function openP2pCalc(itemName, priceInSfl) {
  const farm = window.__app.getFarmData ? window.__app.getFarmData() : {};

  // Inventory
  const rawInv = farm.rawInventory || {};
  const inventoryQty = Math.floor(rawInv[itemName] || 0);

  // Island + Tax
  const islandName = farm.islandType || 'unknown';
  const ISLAND_LABELS = { 'basic':'Básica','spring':'Spring','desert':'Deserto','volcano':'Volcano' };
  const ISLAND_EMOJI  = { 'basic':'🌱','spring':'🌸','desert':'🏜️','volcano':'🌋' };
  const islandLabel = ISLAND_LABELS[islandName] || islandName;
  const islandEmoji = ISLAND_EMOJI[islandName] || '🏝️';

  let taxPct = farm.taxRate !== undefined ? farm.taxRate : 15;
  const isVip = farm.isVip || false;
  if (isVip) taxPct = taxPct * 0.5;
  const taxRate = taxPct / 100;
  const taxColour = taxPct <= 15 ? 'var(--emerald)' : taxPct <= 20 ? 'var(--amber)' : 'var(--coral)';

  // Load saved cost or use current market price (SFL)
  let savedCost = 0;
  try { savedCost = JSON.parse(localStorage.getItem('sfl_base_cost') || '{}')[itemName]; } catch(e) {}
  const cost = savedCost > 0 ? savedCost : priceInSfl;

  // Derived per-unit metrics AT CURRENT PRICE
  const netPerUnit    = priceInSfl * (1 - taxRate);
  const profitPerUnit = netPerUnit - cost;
  const marginPct     = (profitPerUnit / cost) * 100;
  const col = (v) => v > 0 ? 'var(--emerald)' : v < 0 ? 'var(--coral)' : 'var(--text-secondary)';

  const defaultQty = inventoryQty > 0 ? inventoryQty : 10;

  // Load saved profit target for this item
  let savedPct = 0;
  try { savedPct = JSON.parse(localStorage.getItem('sfl_profit_pct') || '{}')[itemName] || 0; } catch(e) {}

  // Pre-compute target prices for the 3 buttons
  const tp = (pct) => (cost * (1 + pct / 100)) / (1 - taxRate);

  showModal(`📊 ${itemName}`, `

    <!-- ── STATS ROW (top 4 cards — cost & profit update when % selected) ── -->
    <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-bottom:10px;">
      <div style="background:rgba(0,0,0,0.2);border:1px solid rgba(255,255,255,0.06);border-radius:12px;padding:11px;">
        <div style="font-size:9px;font-weight:700;color:var(--text-tertiary);text-transform:uppercase;letter-spacing:.05em;margin-bottom:3px;">📦 Estoque</div>
        <div style="font-family:var(--font-mono);font-size:20px;font-weight:800;color:var(--text-primary);line-height:1;">${inventoryQty}</div>
        <div style="font-size:9px;color:var(--text-tertiary);margin-top:2px;">${itemName}</div>
      </div>
      <div style="background:rgba(0,0,0,0.2);border:1px solid rgba(255,255,255,0.06);border-radius:12px;padding:11px;">
        <div style="font-size:9px;font-weight:700;color:var(--text-tertiary);text-transform:uppercase;letter-spacing:.05em;margin-bottom:3px;">💰 Preço Mercado</div>
        <div style="font-family:var(--font-mono);font-size:20px;font-weight:800;color:var(--amber);line-height:1;">${priceInSfl.toFixed(4)}</div>
        <div style="font-size:9px;color:var(--text-tertiary);margin-top:2px;">SFL / unidade</div>
      </div>
      
      <!-- EDITABLE COST -->
      <div style="background:rgba(0,0,0,0.2);border:1px solid rgba(255,255,255,0.06);border-radius:12px;padding:11px;" id="stat-card-cost">
        <div style="font-size:9px;font-weight:700;color:var(--emerald);text-transform:uppercase;letter-spacing:.05em;margin-bottom:3px;">🌱 Seu Preço de Compra</div>
        <input type="number" id="calc-base-cost" value="${cost.toFixed(4)}" step="0.0001" min="0.00001"
          style="width:100%; background:transparent; border:none; border-bottom:1px solid rgba(255,255,255,0.1); color:var(--text-secondary); font-family:var(--font-mono); font-size:20px; font-weight:800; padding:2px 0; outline:none;"
          oninput="window.__app.updateP2pCalc(${priceInSfl}, ${taxRate}, this.value, window.__calc_selected_pct||0, '${itemName}')">
        <div style="font-size:9px;color:var(--text-tertiary);margin-top:2px;">toque para editar (SFL)</div>
      </div>
      
      <div style="background:rgba(0,0,0,0.2);border:1px solid rgba(255,255,255,0.06);border-radius:12px;padding:11px;" id="stat-card-profit">
        <div style="font-size:9px;font-weight:700;color:var(--text-tertiary);text-transform:uppercase;letter-spacing:.05em;margin-bottom:3px;">📈 Lucro/Unid. Atual</div>
        <div id="stat-profit-val" style="font-family:var(--font-mono);font-size:20px;font-weight:800;color:${col(profitPerUnit)};line-height:1;">${(profitPerUnit >= 0 ? '+' : '') + profitPerUnit.toFixed(4)}</div>
        <div id="stat-profit-sub" style="font-size:9px;color:${col(marginPct)};margin-top:2px;font-weight:700;">${(marginPct >= 0 ? '+' : '') + marginPct.toFixed(1)}% margem</div>
      </div>
    </div>

    <!-- ── ISLAND BADGE ── -->
    <div style="display:flex;align-items:center;justify-content:center;gap:10px;background:rgba(0,0,0,0.15);border-radius:9px;padding:7px 12px;margin-bottom:12px;font-size:12px;flex-wrap:wrap;">
      <span>${islandEmoji} Ilha <strong style="color:var(--text-primary);">${islandLabel}</strong></span>
      <span style="color:var(--text-tertiary);">|</span>
      <span>Taxa: <strong style="color:${taxColour};">${taxPct.toFixed(1)}%</strong></span>
      ${isVip ? '<span style="color:var(--text-tertiary);">|</span><span style="color:var(--emerald);font-weight:700;">⭐ VIP</span>' : ''}
    </div>

    <!-- ── SIMULATOR ── -->
    <div style="border-top:1px solid rgba(255,255,255,0.07);padding-top:12px;">
      <div style="font-size:10px;font-weight:700;color:var(--text-tertiary);text-transform:uppercase;letter-spacing:.06em;margin-bottom:8px;">🧮 Simular Venda</div>

      <div style="display:flex;gap:8px;margin-bottom:10px;align-items:stretch;">
        <input type="number" id="calc-qty" class="calc-input" value="${defaultQty}" min="1"
          style="flex:1;min-width:0;"
          oninput="window.__app.updateP2pCalc(${priceInSfl}, ${taxRate}, ${cost}, window.__calc_selected_pct||0, '${itemName}')">
        ${inventoryQty > 0 ? `
        <button onclick="document.getElementById('calc-qty').value=${inventoryQty}; window.__app.updateP2pCalc(${priceInSfl}, ${taxRate}, ${cost}, window.__calc_selected_pct||0, '${itemName}')"
          style="background:rgba(245,158,11,0.12);border:1px solid var(--amber);color:var(--amber);
            border-radius:10px;padding:0 12px;cursor:pointer;font-size:12px;font-weight:800;white-space:nowrap;flex-shrink:0;">
          📦 Todo
        </button>` : ''}
      </div>

      <div style="display:flex;flex-direction:column;gap:5px;font-size:13px;">
        <div style="display:flex;justify-content:space-between;color:var(--text-secondary);">
          <span>Receita bruta</span>
          <span id="calc-gross" style="font-family:var(--font-mono);">0 SFL</span>
        </div>
        <div style="display:flex;justify-content:space-between;color:var(--coral);">
          <span>Taxa (${taxPct.toFixed(1)}%)</span>
          <span id="calc-tax" style="font-family:var(--font-mono);">- 0 SFL</span>
        </div>
        <div style="display:flex;justify-content:space-between;color:var(--text-secondary);">
          <span>Custo total</span>
          <span id="calc-cost-total" style="font-family:var(--font-mono);">- 0 SFL</span>
        </div>
        <div style="display:flex;justify-content:space-between;font-weight:800;font-size:15px;
          border-top:2px solid rgba(255,255,255,0.1);padding-top:8px;margin-top:2px;">
          <span id="calc-net-label" style="color:var(--text-primary);">💰 Lucro líquido</span>
          <span id="calc-net" style="font-family:var(--font-mono);color:var(--emerald);">0 SFL</span>
        </div>
      </div>
    </div>

    <!-- ── META DE LUCRO ── -->
    <div style="border-top:1px solid rgba(255,255,255,0.07);padding-top:12px;margin-top:10px;">
      <div style="font-size:10px;font-weight:700;color:var(--text-tertiary);text-transform:uppercase;letter-spacing:.06em;margin-bottom:6px;">🎯 Meta de Lucro</div>
      <div style="font-size:11px;color:var(--text-secondary);margin-bottom:10px;">Toque para selecionar. O resultado e as infos acima atualizam na hora.</div>

      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:12px;">
        ${[2, 5, 10].map(pct => {
          const tpVal = tp(pct);
          const reachable = tpVal <= priceInSfl;
          const isActive = savedPct === pct;
          const btnBg = isActive ? (reachable ? 'rgba(16,185,129,0.3)' : 'rgba(245,158,11,0.3)') : 'rgba(0,0,0,0.2)';
          const btnBorder = reachable ? 'var(--emerald)' : 'var(--amber)';
          const btnColor = reachable ? 'var(--emerald)' : 'var(--amber)';
          return `<button id="pct-btn-${pct}"
            onclick="window.__app.updateP2pCalc(${priceInSfl}, ${taxRate}, ${cost}, ${pct}, '${itemName}')"
            style="background:${btnBg};border:2px solid ${btnBorder};color:${btnColor};
              border-radius:12px;padding:12px 4px;cursor:pointer;font-size:14px;font-weight:900;
              display:flex;flex-direction:column;align-items:center;gap:2px;width:100%;box-sizing:border-box;
              transition:all 0.2s ease;${isActive ? 'box-shadow:0 0 12px rgba(245,158,11,0.4);transform:scale(1.04);' : ''}">
            <span>+${pct}%</span>
            <span style="font-family:var(--font-mono);font-size:10px;opacity:0.8;">${tpVal.toFixed(4)} SFL</span>
            ${reachable ? '<span style="font-size:9px;opacity:0.8;">✅ atingível</span>' : '<span style="font-size:9px;opacity:0.7;">⏳ aguardar</span>'}
          </button>`;
        }).join('')}
      </div>

      <div id="calc-target-msg" style="padding:10px;background:rgba(0,0,0,0.2);
        border:1px solid rgba(255,255,255,0.06);border-radius:10px;display:none;font-size:12px;">
      </div>
    </div>

  `);

  // Store the global selected pct for qty input updates
  window.__calc_selected_pct = savedPct;
  setTimeout(() => window.__app.updateP2pCalc(priceInSfl, taxRate, cost, savedPct, itemName), 50);
}


function updateP2pCalc(price, taxRate, passedCost, profitPct, itemName) {
  const qtyInput = $('#calc-qty');
  const costInput = $('#calc-base-cost');
  if (!qtyInput) return;

  profitPct = parseFloat(profitPct) || 0;
  
  let cost = passedCost !== undefined ? parseFloat(passedCost) : 0;
  // If the user typed into the input, save it to local storage
  if (costInput && cost > 0 && itemName) {
    try {
      const store = JSON.parse(localStorage.getItem('sfl_base_cost') || '{}');
      store[itemName] = cost;
      localStorage.setItem('sfl_base_cost', JSON.stringify(store));
    } catch(e) {}
  } else if (!costInput) {
    // modal wasn't fully rendered yet or fallback
    cost = parseFloat(passedCost) || 0;
  }

  const qty = parseFloat(qtyInput.value) || 0;
  const gross = qty * price;
  const tax = gross * taxRate;
  const net = gross - tax;
  const totalCost = qty * cost;
  const rawProfit = net - totalCost;

  // Always update raw rows
  setText('#calc-gross', gross.toFixed(4) + ' SFL');
  setText('#calc-tax', '- ' + tax.toFixed(4) + ' SFL');
  const costEl = $('#calc-cost-total');
  if (costEl) costEl.innerText = '- ' + totalCost.toFixed(4) + ' SFL';

  const netEl = $('#calc-net');
  const msgEl = $('#calc-target-msg');

  // Persist selected % to localStorage so the portfolio card can use it
  if (itemName && profitPct > 0) {
    window.__calc_selected_pct = profitPct;
    try {
      const store = JSON.parse(localStorage.getItem('sfl_profit_pct') || '{}');
      store[itemName] = profitPct;
      localStorage.setItem('sfl_profit_pct', JSON.stringify(store));
    } catch(e) {}
  } else if (profitPct === 0) {
    window.__calc_selected_pct = 0;
  }

  // Highlight the selected % button, reset others
  [2, 5, 10].forEach(p => {
    const btn = document.getElementById(`pct-btn-${p}`);
    if (!btn) return;
    const isSelected = p === profitPct;
    btn.style.transform = isSelected ? 'scale(1.06)' : 'scale(1)';
    btn.style.boxShadow = isSelected ? '0 0 16px rgba(245,158,11,0.5)' : 'none';
    // thicken border to show selected
    btn.style.borderWidth = isSelected ? '3px' : '2px';
    btn.style.fontWeight = '900';
  });

  if (profitPct > 0 && cost > 0) {
    // Target price per unit for chosen profit %
    const tup = (cost * (1 + profitPct / 100)) / (1 - taxRate);
    const targetGross  = qty * tup;
    const targetTax    = targetGross * taxRate;
    const targetNet    = targetGross - targetTax;
    const targetProfit = targetNet - totalCost;
    const diff = tup - price;
    const isReached = diff <= 0;

    // Update main result
    if (netEl) {
      netEl.innerText = (targetProfit >= 0 ? '+' : '') + targetProfit.toFixed(4) + ' SFL';
      netEl.style.color = targetProfit > 0 ? 'var(--emerald)' : 'var(--coral)';
    }

    // Since they want to see target profit, update the label
    const netLabel = $('#calc-net-label');
    if (netLabel) netLabel.innerHTML = `💰 Lucro alvo (+${profitPct}%)`;

    // Update "Lucro/Unid." stat card (4th card)
    const statProfitVal = $('#stat-profit-val');
    const statProfitSub = $('#stat-profit-sub');
    const profitUnitAtTarget = tup * (1 - taxRate) - cost;
    if (statProfitVal) { statProfitVal.innerText = (profitUnitAtTarget >= 0 ? '+' : '') + profitUnitAtTarget.toFixed(4); statProfitVal.style.color = profitUnitAtTarget > 0 ? 'var(--emerald)' : 'var(--coral)'; }
    if (statProfitSub) { statProfitSub.innerText = '+' + profitPct.toFixed(1) + '% meta'; statProfitSub.style.color = 'var(--emerald)'; }

    // Show info box
    if (msgEl) {
      msgEl.style.display = 'block';
      msgEl.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <span style="color:var(--text-secondary);">Venda por</span>
          <span style="font-family:var(--font-mono);font-weight:800;color:${isReached ? 'var(--emerald)' : 'var(--amber)'};">${tup.toFixed(4)} SFL/un.</span>
        </div>
        <div style="margin-top:6px;font-size:11px;color:${isReached ? 'var(--emerald)' : 'var(--text-secondary)'};">
          ${isReached ? '✅ O mercado atual já paga esse preço!' : `Precisa subir <strong style="color:var(--amber);">+${diff.toFixed(4)} SFL</strong> por unidade`}
        </div>
      `;
    }
    
    // Also update the buttons dynamically to show new target values when cost changes
    [2, 5, 10].forEach(p => {
      const btn = document.getElementById(`pct-btn-${p}`);
      if (btn) {
        const spanTp = btn.querySelectorAll('span')[1];
        if (spanTp) spanTp.innerText = ((cost * (1 + p / 100)) / (1 - taxRate)).toFixed(4) + ' SFL';
      }
    });

  } else {
    // No % selected: show actual current profit
    if (netEl) {
      netEl.innerText = (rawProfit >= 0 ? '+' : '') + rawProfit.toFixed(4) + ' SFL';
      netEl.style.color = rawProfit > 0 ? 'var(--emerald)' : rawProfit < 0 ? 'var(--coral)' : 'var(--text-primary)';
    }
    const netLabel = $('#calc-net-label');
    if (netLabel) netLabel.innerHTML = `💰 Lucro líquido`;
    
    if (msgEl) msgEl.style.display = 'none';
  }
}


// Called when user clicks a profit% button or the Calcular button
function showTargetProfit(profitPct, currentPrice, taxRate, cost) {
  if (isNaN(profitPct) || profitPct < 0) return;

  const el = $('#calc-target-result');
  if (!el) return;

  // Target sale price formula: cost * (1 + profitPct/100) / (1 - taxRate)
  const targetSalePrice = cost * (1 + profitPct / 100) / (1 - taxRate);
  const diff = targetSalePrice - currentPrice;
  const isReached = diff <= 0;
  const diffLabel = isReached
    ? '✅ Mercado já atingiu esse preço!'
    : `Falta subir <strong style="color:var(--amber);">+${diff.toFixed(4)} SFL</strong> do mercado atual`;

  el.style.display = 'block';
  el.innerHTML = `
    <div style="font-size:11px; font-weight:700; color:var(--text-tertiary); text-transform:uppercase; letter-spacing:.05em; margin-bottom:8px;">
      Para +${profitPct}% de lucro:
    </div>
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
      <span style="font-size:13px; color:var(--text-secondary);">Venda por</span>
      <span style="font-family:var(--font-mono); font-size:18px; font-weight:800; color:${isReached ? 'var(--emerald)' : 'var(--amber)'};">
        ${targetSalePrice.toFixed(4)} SFL
      </span>
    </div>
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
      <span style="font-size:13px; color:var(--text-secondary);">Mercado atual</span>
      <span style="font-family:var(--font-mono); font-size:14px; font-weight:700; color:var(--text-primary);">${currentPrice.toFixed(4)} SFL</span>
    </div>
    <div style="font-size:12px; color:var(--text-secondary); padding-top:8px; border-top:1px solid rgba(255,255,255,0.07);">
      ${diffLabel}
    </div>
  `;
}


// =====================================================
// DELIVERIES PAGE
// =====================================================



// =====================================================
// TOOLS PAGE
// =====================================================

function renderToolsPage() {
  setHtml('#tools-content', `
    <div class="section-header mb-3">
      <div class="section-title">🛠️ External Tools</div>
    </div>
    <div class="tools-grid">
      <div class="tool-card" onclick="window.openExternal('https://sfl.world/util/p2p-calc', '_blank')">
        <div class="tool-card-icon">🧮</div>
        <div class="tool-card-title">P2P Calc (Full)</div>
      </div>
      <div class="tool-card" onclick="window.openExternal('https://sfl.world/util/factions', '_blank')">
        <div class="tool-card-icon">⚔️</div>
        <div class="tool-card-title">Factions</div>
      </div>
      <div class="tool-card" onclick="window.openExternal('https://sfl.world/tools/skills/', '_blank')">
        <div class="tool-card-icon">🧠</div>
        <div class="tool-card-title">Skill Trainer</div>
      </div>
      <div class="tool-card" onclick="window.openExternal('https://sfl.world/tools/pet-feed-calc/', '_blank')">
        <div class="tool-card-icon">🐶</div>
        <div class="tool-card-title">Pet Feed Calc</div>
      </div>
      <div class="tool-card" onclick="window.openExternal('https://sfl.world/tools/trade/', '_blank')">
        <div class="tool-card-icon">📈</div>
        <div class="tool-card-title">Price History</div>
      </div>
    </div>
  `);
}

// =====================================================
// ALERTS PAGE
// =====================================================

function renderAlertsPage() {
  const prefs = window.__app.Notifications ? window.__app.Notifications.prefs : {};
  
  const html = `
    <div class="section-header mb-3">
      <div class="section-title">Central de Notificações</div>
    </div>
    
    <div class="card mb-4" style="background:rgba(245,158,11,0.1); border:1px solid rgba(245,158,11,0.2);">
      <div style="font-size:13px; font-weight:800; color:var(--amber); display:flex; align-items:center; gap:8px; margin-bottom:8px;">
        🤖 Inteligência 24/7
      </div>
      <div style="font-size:11.5px; color:var(--text-secondary); line-height:1.6;">
        O SFL Pro agora possui um <b>robô inteligente na nuvem</b> que monitora a sua fazenda 24 horas por dia.<br><br>
        Você <b>não precisa</b> manter o aplicativo aberto! Pode fechar tudo, e nós te avisaremos no exato minuto em que suas coisas ficarem prontas.
      </div>
    </div>

    <div class="card" style="padding:0; overflow:hidden;">
      <div class="notif-row master" style="padding:16px; background:var(--surface-3); display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid rgba(255,255,255,0.05);">
        <div style="display:flex; flex-direction:column; gap:2px;">
          <span style="font-size:15px; font-weight:800; color:var(--text-primary);">Permitir Notificações</span>
          <span style="font-size:11px; font-weight:600; color:var(--text-tertiary);">Ative para receber avisos nativos do celular</span>
        </div>
        <label class="switch">
          <input type="checkbox" onchange="window.__app.Notifications.setPref('master', this.checked)" ${prefs.master ? 'checked' : ''}>
          <span class="slider round"></span>
        </label>
      </div>
      
      <div style="padding:8px 0; max-height: 50vh; overflow-y: auto;">
        <div style="padding:12px 16px; display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid rgba(255,255,255,0.02);">
          <span style="font-size:13px; font-weight:700;">🌽 Plantações (Colheitas)</span>
          <label class="switch"><input type="checkbox" onchange="window.__app.Notifications.setPref('crops', this.checked)" ${prefs.crops !== false ? 'checked' : ''}><span class="slider round"></span></label>
        </div>
        <div style="padding:12px 16px; display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid rgba(255,255,255,0.02);">
          <span style="font-size:13px; font-weight:700;">🐔 Animais (Fome / Coleta)</span>
          <label class="switch"><input type="checkbox" onchange="window.__app.Notifications.setPref('animals', this.checked)" ${prefs.animals !== false ? 'checked' : ''}><span class="slider round"></span></label>
        </div>
        <div style="padding:12px 16px; display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid rgba(255,255,255,0.02);">
          <span style="font-size:13px; font-weight:700;">🍎 Árvores Frutíferas</span>
          <label class="switch"><input type="checkbox" onchange="window.__app.Notifications.setPref('fruits', this.checked)" ${prefs.fruits !== false ? 'checked' : ''}><span class="slider round"></span></label>
        </div>
        <div style="padding:12px 16px; display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid rgba(255,255,255,0.02);">
          <span style="font-size:13px; font-weight:700;">🌳 Árvores (Madeira)</span>
          <label class="switch"><input type="checkbox" onchange="window.__app.Notifications.setPref('trees', this.checked)" ${prefs.trees !== false ? 'checked' : ''}><span class="slider round"></span></label>
        </div>
        <div style="padding:12px 16px; display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid rgba(255,255,255,0.02);">
          <span style="font-size:13px; font-weight:700;">🪨 Rochas (Pedra/Ferro/Ouro)</span>
          <label class="switch"><input type="checkbox" onchange="window.__app.Notifications.setPref('rocks', this.checked)" ${prefs.rocks !== false ? 'checked' : ''}><span class="slider round"></span></label>
        </div>
        <div style="padding:12px 16px; display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid rgba(255,255,255,0.02);">
          <span style="font-size:13px; font-weight:700;">🍯 Colmeias (Mel)</span>
          <label class="switch"><input type="checkbox" onchange="window.__app.Notifications.setPref('beehives', this.checked)" ${prefs.beehives !== false ? 'checked' : ''}><span class="slider round"></span></label>
        </div>
        <div style="padding:12px 16px; display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid rgba(255,255,255,0.02);">
          <span style="font-size:13px; font-weight:700;">🌸 Flores</span>
          <label class="switch"><input type="checkbox" onchange="window.__app.Notifications.setPref('flowers', this.checked)" ${prefs.flowers !== false ? 'checked' : ''}><span class="slider round"></span></label>
        </div>
        <div style="padding:12px 16px; display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid rgba(255,255,255,0.02);">
          <span style="font-size:13px; font-weight:700;">🛢️ Poços de Óleo</span>
          <label class="switch"><input type="checkbox" onchange="window.__app.Notifications.setPref('oil', this.checked)" ${prefs.oil !== false ? 'checked' : ''}><span class="slider round"></span></label>
        </div>
        <div style="padding:12px 16px; display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid rgba(255,255,255,0.02);">
          <span style="font-size:13px; font-weight:700;">♻️ Composteiras</span>
          <label class="switch"><input type="checkbox" onchange="window.__app.Notifications.setPref('composting', this.checked)" ${prefs.composting !== false ? 'checked' : ''}><span class="slider round"></span></label>
        </div>
        <div style="padding:12px 16px; display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid rgba(255,255,255,0.02);">
          <span style="font-size:13px; font-weight:700;">🪴 Estufa (Greenhouse)</span>
          <label class="switch"><input type="checkbox" onchange="window.__app.Notifications.setPref('greenhouse', this.checked)" ${prefs.greenhouse !== false ? 'checked' : ''}><span class="slider round"></span></label>
        </div>
        <div style="padding:12px 16px; display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid rgba(255,255,255,0.02);">
          <span style="font-size:13px; font-weight:700;">🍳 Construções (Forno, etc)</span>
          <label class="switch"><input type="checkbox" onchange="window.__app.Notifications.setPref('buildings', this.checked)" ${prefs.buildings !== false ? 'checked' : ''}><span class="slider round"></span></label>
        </div>
        <div style="padding:12px 16px; display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid rgba(255,255,255,0.02);">
          <span style="font-size:13px; font-weight:700;">🚜 Máquina de Plantação</span>
          <label class="switch"><input type="checkbox" onchange="window.__app.Notifications.setPref('cropMachine', this.checked)" ${prefs.cropMachine !== false ? 'checked' : ''}><span class="slider round"></span></label>
        </div>
        <div style="padding:12px 16px; display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid rgba(255,255,255,0.02);">
          <span style="font-size:13px; font-weight:700;">🦀 Armadilhas (Crab Traps)</span>
          <label class="switch"><input type="checkbox" onchange="window.__app.Notifications.setPref('crabTraps', this.checked)" ${prefs.crabTraps !== false ? 'checked' : ''}><span class="slider round"></span></label>
        </div>
        <div style="padding:12px 16px; display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid rgba(255,255,255,0.02);">
          <span style="font-size:13px; font-weight:700;">⛩️ Santuários</span>
          <label class="switch"><input type="checkbox" onchange="window.__app.Notifications.setPref('shrines', this.checked)" ${prefs.shrines !== false ? 'checked' : ''}><span class="slider round"></span></label>
        </div>
        <div style="padding:12px 16px; display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid rgba(255,255,255,0.02);">
          <span style="font-size:13px; font-weight:700;">🍷 Galpão de Envelhecimento</span>
          <label class="switch"><input type="checkbox" onchange="window.__app.Notifications.setPref('agingShed', this.checked)" ${prefs.agingShed !== false ? 'checked' : ''}><span class="slider round"></span></label>
        </div>
        <div style="padding:12px 16px; display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid rgba(255,255,255,0.02);">
          <span style="font-size:13px; font-weight:700;">🧂 Fazenda de Sal</span>
          <label class="switch"><input type="checkbox" onchange="window.__app.Notifications.setPref('saltFarm', this.checked)" ${prefs.saltFarm !== false ? 'checked' : ''}><span class="slider round"></span></label>
        </div>
        <div style="padding:12px 16px; display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid rgba(255,255,255,0.02);">
          <span style="font-size:13px; font-weight:700;">📈 Mercado (Metas / Pump)</span>
          <label class="switch"><input type="checkbox" onchange="window.__app.Notifications.setPref('market', this.checked)" ${prefs.market !== false ? 'checked' : ''}><span class="slider round"></span></label>
        </div>
        <div style="padding:12px 16px; display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid rgba(255,255,255,0.02);">
          <span style="font-size:13px; font-weight:700;">📦 Entregas Prontas</span>
          <label class="switch"><input type="checkbox" onchange="window.__app.Notifications.setPref('deliveries', this.checked)" ${prefs.deliveries !== false ? 'checked' : ''}><span class="slider round"></span></label>
        </div>
        <div style="padding:12px 16px; display:flex; justify-content:space-between; align-items:center;">
          <span style="font-size:13px; font-weight:700;">⏰ Daily Reset (00:00 UTC)</span>
          <label class="switch"><input type="checkbox" onchange="window.__app.Notifications.setPref('dailyReset', this.checked)" ${prefs.dailyReset !== false ? 'checked' : ''}><span class="slider round"></span></label>
        </div>
      </div>
    </div>
  `;
  
  const container = document.getElementById('tab-alerts');
  if (container) {
    container.innerHTML = html;
  }
}

function updateAlertBadge() {
  const log = Storage.getAlertLog();
  const badge = $('#alert-nav-badge');
  if (!badge) return;
  if (log.length > 0) {
    badge.style.display = 'flex';
    badge.textContent   = log.length > 99 ? '99+' : log.length;
  } else {
    badge.style.display = 'none';
  }
}

// =====================================================
// NOTIFICATIONS SETTINGS PAGE
// =====================================================

function renderNotifSettings(notifPermission) {
  const engine = window.__app && window.__app.Notifications;
  const prefs = engine ? engine.prefs : Storage.getNotifPrefs();

  const permHtml = notifPermission !== 'granted' ? `
    <div class="notif-permission-banner mb-4">
      <span style="font-size:24px">🔕</span>
      <div>
        <p><strong style="color:var(--amber)">${t('notif_enable')}</strong><br>
        ${t('notif_enable_desc')}</p>
        <button id="btn-request-notif" class="btn-primary" style="margin-top:8px;font-size:12px;padding:6px 12px">
          ${t('notif_enable')}
        </button>
      </div>
    </div>
  ` : `
    <div class="notif-permission-banner mb-4" style="border-color:rgba(34,197,94,0.3)">
      <span style="font-size:24px">🔔</span>
      <p><strong style="color:var(--emerald)">${t('notif_status_granted')}</strong><br>${t('notif_status_granted_desc')}</p>
    </div>
  `;

  const masterToggleHtml = `
    <div class="settings-group">
      <div class="settings-group-title">${t('alert_master')}</div>
      <div class="settings-row">
        <div>
          <div class="settings-row-label">${t('alert_master_sub')}</div>
          <div class="settings-row-sub">${t('alert_master_desc')}</div>
        </div>
        <label class="toggle">
          <input type="checkbox" id="toggle-notif-master" ${prefs.master ? 'checked' : ''}>
          <span class="toggle-slider"></span>
        </label>
      </div>
    </div>
  `;

  setHtml('#notif-settings-content', permHtml + masterToggleHtml);

  bindNotifToggles();
}

function bindNotifToggles() {
  const master = $('#toggle-notif-master');
  if (master) {
    master.addEventListener('change', async () => {
      if (window.__app?.Notifications) {
        const enabled = await window.__app.Notifications.setPref('master', master.checked);
        master.checked = enabled && window.__app.Notifications.prefs.master;
        const permission = await window.__app.Notifications.getPermissionState();
        renderNotifSettings(permission);
      } else {
        Storage.saveNotifPrefs({ enabled: master.checked });
      }
    });
  }



  const requestBtn = $('#btn-request-notif');
  if (requestBtn) {
    requestBtn.addEventListener('click', async () => {
      if (window.__app?.Notifications) {
        const enabled = await window.__app.Notifications.setPref('master', true);
        const perm = await window.__app.Notifications.getPermissionState();
        if (!enabled) showToast('Não foi possível ativar as notificações. Verifique as permissões do aparelho.', 'error');
        renderNotifSettings(perm);
      }
    });
  }

}

// =====================================================
// SETTINGS PAGE
// =====================================================

function renderSettingsPage() {
  const settings = Storage.getSettings();
  const currentFarmId = Storage.getActiveFarm();

  setHtml('#settings-content', `

    <!-- ① FARM ID CARD -->
    <div class="sett-card sett-card--hero">
      <div class="sett-card-label">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m10 11 11 .9c.6 0 .9.5.8 1.1l-.8 5h-1"/><path d="M16 18h-5"/><path d="M18 5a1 1 0 0 0-1 1v5.573"/><path d="M3 4h9l1 7.246"/><path d="M4 11V4"/><circle cx="18" cy="18" r="2"/><circle cx="7" cy="15" r="4"/></svg>
        Farm ID
      </div>
      <div class="sett-card-desc">Sua fazenda no Sunflower Land. Os dados serão carregados automaticamente.</div>
      <div class="sett-farm-row">
        <input
          type="text"
          id="settings-farm-input"
          class="sett-farm-input"
          placeholder="Ex: 123456"
          value="${currentFarmId}"
          inputmode="numeric"
          pattern="[0-9]*"
        >
        <button class="sett-btn-enter" onclick="window.__app.saveAndGoToFarm()">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
          Entrar
        </button>
      </div>
    </div>

    <!-- ② COMMUNITY API KEY -->
    <div class="sett-section-title">Community API Key</div>

    <div class="sett-card">
      <div class="sett-card-desc" style="margin-bottom:10px">
        Habilita dados completos (plantações, animais, inventário). Digite apenas uma vez e ela ficará salva automaticamente.<br>
        Pegue no jogo: <strong style="color:var(--amber)">Settings → Developer Options → API Key</strong>
      </div>
      <div style="display:flex;gap:8px;align-items:center;">
        <input
          type="password"
          id="input-api-key"
          placeholder="Cole sua API Key aqui (sfl.Mj...)"
          spellcheck="false"
          value="${settings.communityApiKey ?? ''}"
          style="flex:1;padding:10px;background:var(--surface-2);border:1px solid var(--surface-border);border-radius:var(--r2);color:var(--text-primary);font-family:var(--font-mono);font-size:12px;outline:none;box-sizing:border-box"
        >
        ${settings.communityApiKey ? '<span style="color:var(--emerald);font-size:18px;" title="Chave Salva">✅</span>' : ''}
      </div>
      ${settings.communityApiKey ? (window.__app.State.hasKeyError ? `
        <div class="card error-box" style="margin-top: 15px; border-color: var(--error-color);">
          <div style="display:flex;align-items:flex-start;gap:10px;">
            <span style="font-size:16px;line-height:1">❌</span>
            <div>
              <strong>Chave de API Inválida:</strong><br>
              <span style="color: #ffaa99;">A chave configurada expirou ou está incorreta.</span><br><br>
              Gere uma nova no jogo e cole acima para restaurar o acesso.
            </div>
          </div>
        </div>
      ` : '') : ''}
    </div>

    <div class="sett-section-title" style="margin-top:24px;">Apoiar Desenvolvedor</div>
    <div class="sett-card" style="border-color: rgba(34, 197, 94, 0.3);">
      <div class="sett-card-desc" style="margin-bottom:12px; text-align: center;">
        Gostou do aplicativo? Visite a ilha do desenvolvedor e deixe seu apoio!
      </div>
      <button class="btn-primary" style="width:100%; padding: 12px; display:flex; align-items:center; justify-content:center; gap:8px; font-weight:bold; background: var(--emerald);" onclick="window.openExternal('https://sunflower-land.com/play/#/visit/2601876753363557')">
        <span style="font-size:18px">🏝️</span> Visitar Ilha do Criador
      </button>
    </div>

    <div class="sett-footer" style="margin-top:24px;">
      🌻 Sunflower Super App v1.0 &nbsp;·&nbsp; Unofficial community tool
    </div>
    
    <div id="notif-settings-content" style="margin-top: 24px;"></div>
    
    <hr style="border:0;border-top:1px solid rgba(255,255,255,0.05);margin:24px 0;">
    
    <button id="btn-reset-app" style="width:100%;padding:14px;background:var(--coral);color:#fff;border:none;border-radius:12px;font-weight:bold;font-size:14px;display:flex;align-items:center;justify-content:center;gap:8px;cursor:pointer;margin-bottom:20px;">
      ⚠️ Resetar Aplicativo (Sair)
    </button>
  `);

  bindSettingsEvents();

  if (window.__app && window.__app.Notifications) {
    window.__app.Notifications.getPermissionState().then(renderNotifSettings);
  } else {
    renderNotifSettings('default');
  }
}

function bindSettingsEvents() {
  const saveApiKey = async () => {
    const keyInput = $('#input-api-key');
    if (!keyInput) return;
    const newKey = keyInput.value.trim();
    const oldKey = Storage.getSettings().communityApiKey || '';
    if (newKey !== oldKey) {
      Storage.saveSettings({ communityApiKey: newKey });
      if (newKey) {
        showToast('Chave da API atualizada! Sincronizando...', 'success');
        if (window.__app.State.farmId) {
          await window.__app.refreshData(true);
        }
      }
      renderSettingsPage(); // refresh to show checkmark
    }
  };

  const apiKeyInput = $('#input-api-key');
  if (apiKeyInput) {
    apiKeyInput.addEventListener('blur', saveApiKey);
    apiKeyInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') apiKeyInput.blur();
    });
  }

  const farmInput = $('#settings-farm-input');
  if (farmInput) {
    farmInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') window.__app.saveAndGoToFarm();
    });
  }

  const btnReset = document.getElementById('btn-reset-app');
  if (btnReset) {
    btnReset.addEventListener('click', async () => {
      if (!confirm('ATENÇÃO: Isso vai apagar completamente todos os dados salvos do aplicativo. Tem certeza?')) return;
      btnReset.innerHTML = 'Apagando...';
      try {
        if (window.__app?.Notifications) {
          await window.__app.Notifications.disablePush();
        }
        localStorage.clear();
        sessionStorage.clear();
        if ('serviceWorker' in navigator) {
          const regs = await navigator.serviceWorker.getRegistrations();
          for (let r of regs) await r.unregister();
        }
        window.location.reload(true);
      } catch (e) {
        localStorage.clear();
        window.location.reload(true);
      }
    });
  }
}

// Handle search via input
$('#search-input')?.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    const val = e.target.value.trim();
    if (val && window.__app) window.__app.loadFarm(val);
  }
});

// Global functions for inline event handlers
window.__app = window.__app || {};

window.__app.showExpansionModal = () => {
  const parsed = window.__app?.State?.parsedFarm;
  if (!parsed) return;

  const level = parsed.level || 1;
  const nextLevel = level + 1;
  
  const ISLAND_MAX_EXPANSION = {
    basic: 9, spring: 16, desert: 25, volcano: 30, swamp: 42, spooky: 42, crystal: 42, galaxy: 42, marble: 42
  };
  const islandType = parsed.islandType || 'basic';
  const maxExpansions = ISLAND_MAX_EXPANSION[islandType] || 9;
  const expansoesFaltantes = Math.max(0, maxExpansions - level);
  
  // Base resources image URLs
  const resourceIcons = {
    'Wood': 'https://sfl.world/img/source/Wood.png',
    'Stone': 'https://sfl.world/img/source/Stone.png',
    'Iron': 'https://sfl.world/img/source/Iron.png',
    'Gold': 'https://sfl.world/img/source/Gold.png',
    'Crimstone': 'https://sfl.world/img/source/Crimstone.png',
    'Oil': 'https://sfl.world/img/source/Oil.png',
    'Gem': 'https://sfl.world/img/source/Gem.png',
    'Block Buck': 'https://sfl.world/img/source/Block%20Buck.png',
    'Coins': 'https://sfl.world/img/source/Coins.png',
    'SFL': ASSETS.SFL
  };
  
  // Estimated expansion requirements based on SFL progression logic
  const getRequirements = (lvl) => {
    const reqs = {};
    if (lvl <= 2) { reqs['Wood'] = 10; }
    else if (lvl <= 3) { reqs['Wood'] = 20; reqs['Stone'] = 5; }
    else if (lvl <= 4) { reqs['Wood'] = 50; reqs['Stone'] = 10; reqs['Block Buck'] = 1; }
    else if (lvl <= 5) { reqs['Wood'] = 100; reqs['Stone'] = 20; reqs['Iron'] = 5; reqs['Block Buck'] = 2; }
    else if (lvl <= 6) { reqs['Wood'] = 200; reqs['Stone'] = 50; reqs['Iron'] = 10; reqs['Block Buck'] = 3; }
    else if (lvl <= 7) { reqs['Wood'] = 300; reqs['Stone'] = 100; reqs['Iron'] = 25; reqs['Gold'] = 5; reqs['Block Buck'] = 5; }
    else if (lvl <= 8) { reqs['Wood'] = 500; reqs['Stone'] = 200; reqs['Iron'] = 50; reqs['Gold'] = 10; reqs['Block Buck'] = 7; }
    else if (lvl <= 9) { reqs['Wood'] = 800; reqs['Stone'] = 300; reqs['Iron'] = 100; reqs['Gold'] = 25; reqs['Block Buck'] = 10; }
    else {
      // Scaling for high levels
      const scale = lvl - 9;
      reqs['Wood'] = 800 + (scale * 200);
      reqs['Stone'] = 300 + (scale * 100);
      reqs['Iron'] = 100 + (scale * 50);
      reqs['Gold'] = 25 + (scale * 15);
      reqs['Block Buck'] = 10 + (scale * 2);
    }
    return reqs;
  };

  let reqs = {};
  let reqCoins = 0;
  const hardcodedReqs = EXPANSION_REQUIREMENTS[islandType]?.[nextLevel];
  if (hardcodedReqs) {
    reqs = { ...hardcodedReqs.resources };
    reqCoins = hardcodedReqs.coins || 0;
    
    // Apply VIP discount to coins if applicable (20%)
    if (parsed.isVip) {
      reqCoins = Math.floor(reqCoins * 0.8);
    }
  } else {
    // Fallback if missing
    reqs = getRequirements(nextLevel);
  }

  const inventory = parsed.inventory.resources || {};
  // Combine all items in inventory into a flat map for easy lookup
  const invMap = {};
  if (parsed.inventory.resources) parsed.inventory.resources.forEach(r => invMap[r.name] = r.qty);
  if (parsed.inventory.crops) parsed.inventory.crops.forEach(c => invMap[c.name] = c.qty);
  if (parsed.inventory.tools) parsed.inventory.tools.forEach(t => invMap[t.name] = t.qty);
  if (parsed.inventory.food) parsed.inventory.food.forEach(f => invMap[f.name] = f.qty);
  if (parsed.inventory.special) parsed.inventory.special.forEach(s => invMap[s.name] = s.qty);
  invMap['SFL'] = parsed.balance;
  invMap['Coins'] = parsed.coins || 0;
  
  if (reqCoins > 0) reqs['Coins'] = reqCoins;

  let reqHtml = '';
  for (const [resName, amountReq] of Object.entries(reqs)) {
    const amountHas = invMap[resName] || 0;
    const isMet = amountHas >= amountReq;
    const icon = resourceIcons[resName] || '';
    const progressPct = Math.min(100, Math.max(0, (amountHas / amountReq) * 100));

    reqHtml += `
      <div style="background:var(--surface-2); border:1px solid var(--surface-border); border-radius:12px; padding:12px; margin-bottom:12px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
          <div style="display:flex; align-items:center; gap:8px;">
            <div style="width:32px; height:32px; background:var(--surface-3); border-radius:8px; display:flex; align-items:center; justify-content:center;">
              ${icon ? `<img src="${icon}" style="width:20px;height:20px;image-rendering:pixelated">` : '📦'}
            </div>
            <div>
              <div style="font-size:13px; font-weight:600; color:var(--text-primary)">${resName}</div>
              <div style="font-size:11px; color:var(--text-tertiary)">Falta: ${Math.max(0, amountReq - amountHas).toFixed(0)}</div>
            </div>
          </div>
          <div style="text-align:right">
            <div style="font-size:14px; font-weight:700; color: ${isMet ? 'var(--emerald)' : 'var(--text-secondary)'}">
              ${formatNumber(amountHas, 0)} / ${formatNumber(amountReq, 0)}
            </div>
            ${isMet ? `<div style="font-size:11px; color:var(--emerald)">Pronto! ✅</div>` : ''}
          </div>
        </div>
        <!-- Progress Bar -->
        <div style="height:6px; background:var(--surface-3); border-radius:4px; overflow:hidden;">
          <div style="height:100%; width:${progressPct}%; background: ${isMet ? 'var(--emerald)' : 'var(--amber)'}; transition: width 0.3s ease;"></div>
        </div>
      </div>
    `;
  }

  const modalHtml = `
    <div style="text-align:center; margin-bottom:16px;">
      <div style="width:64px;height:64px;margin:0 auto 12px;background:var(--surface-3);border:1px solid var(--surface-border);border-radius:16px;display:flex;align-items:center;justify-content:center;box-shadow:inset 0 2px 8px rgba(0,0,0,0.2);">
        <img src="https://raw.githubusercontent.com/sunflower-land/sunflower-land/main/src/assets/icons/islands/${islandType}.webp" style="width:40px;height:40px;image-rendering:pixelated" onerror="this.src='${ASSETS.ISLAND}'">
      </div>
      <h3 style="margin:0; font-size:18px; color:var(--text-primary)">Expansão ${level}/${maxExpansions}</h3>
      <div style="font-size:12px; color:var(--text-secondary); margin-top:4px;">Progresso atual para a Expansão ${nextLevel}</div>
      <div style="font-size:13px; font-weight:bold; color:var(--emerald); margin-top:8px;">${expansoesFaltantes > 0 ? 'Faltam ' + expansoesFaltantes + ' expansões para concluir essa ilha.' : 'Ilha totalmente expandida!'}</div>
    </div>
    <div style="max-height: 400px; overflow-y:auto; padding-right:4px;">
      ${reqHtml}
    </div>
  `;

  showModal('Expansão de Terreno', modalHtml);
};

window.__app.showCropsModal = () => {
  const parsed = window.__app.State.parsedFarm;
  if (!parsed || !parsed.crops) return;

  const crops = parsed.crops;
  if (crops.length === 0 && crops.totalPlots === 0) {
    showModal('Minhas Plantações', '<div style="padding: 16px; text-align: center; color: var(--text-secondary);">Você não possui plantações.</div>');
    return;
  }

  const itemsHtml = crops.map((crop, i) => {
    const iconUrl = `https://sfl.world/img/source/${encodeURIComponent(crop.name)}.png`;
    let statusColor = 'var(--text-secondary)';
    let statusBg = 'rgba(255,255,255,0.1)';
    let statusText = 'Crescendo';
    
    if (crop.status === 'ready') {
      statusColor = 'var(--emerald)';
      statusBg = 'rgba(16, 185, 129, 0.1)';
      statusText = 'Pronto para Colher!';
    } else {
      statusColor = 'var(--amber)';
      statusBg = 'rgba(245, 158, 11, 0.1)';
      statusText = crop.countdown;
    }

    return `
      <div class="spring-in" style="background:var(--surface-3); border:1px solid var(--surface-border); border-radius:16px; margin-bottom:12px; animation-delay: ${i * 30}ms; padding:16px; display:flex; align-items:center; gap:16px;">
        <div style="width:64px;height:64px;background:var(--surface-2);border-radius:12px;display:flex;align-items:center;justify-content:center;border:1px solid var(--surface-border); box-shadow: inset 0 2px 4px rgba(0,0,0,0.2);">
          <img src="${iconUrl}" style="width:36px;height:36px;object-fit:contain;image-rendering:pixelated;" onerror="this.style.display='none'; this.nextElementSibling.style.display='inline'">
          <span style="font-size:32px;display:none">${crop.emoji || '🌱'}</span>
        </div>
        <div style="flex:1; min-width:0;">
          <div style="font-size:18px; font-weight:800; color:var(--text-primary); margin-bottom:4px;">${crop.name}</div>
          <div style="font-size:13px; color:var(--text-secondary); font-weight:600;">
            Quantidade: <strong style="color:var(--text-primary); font-size:14px;">${crop.amount}x</strong>
          </div>
          ${crop.fertiliser ? `<div style="display:flex; align-items:center; gap:6px; font-size:13px; color:var(--emerald); margin-top:6px; font-weight:600;"><img src="https://sfl.world/img/source/${encodeURIComponent(crop.fertiliser)}.png" style="width:18px;height:18px;image-rendering:pixelated;" onerror="this.style.display='none'"> <span style="color:var(--text-primary);">${crop.fertiliser}</span></div>` : ''}
        </div>
        <div style="text-align:right;">
          <div style="font-size:14px; font-weight:700; color:${statusColor}; background:${statusBg}; padding:6px 12px; border-radius:8px; border: 1px solid ${statusColor.replace('var(', 'rgba(').replace(')', ', 0.2)')}; white-space:nowrap;">
            ${statusText}
          </div>
          ${crop.status !== 'ready' ? `<div style="font-size:11px; color:var(--text-tertiary); margin-top:6px; font-weight:600;">Termina às ${new Date(crop.readyAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>` : ''}
        </div>
      </div>
    `;
  }).join('');

  const emptySlots = Math.max(0, crops.totalPlots - crops.totalPlanted);

  const modalHtml = `
    <div style="text-align:center; margin-bottom:16px;">
      <div style="font-size:14px; color:var(--text-secondary); margin-bottom:8px;">Capacidade de Plantio:</div>
      <div style="display:flex; justify-content:center; gap:16px;">
        <div style="background:var(--surface-3); border:1px solid var(--surface-border); padding:8px 16px; border-radius:12px;">
          <div style="font-size:24px; font-weight:800; color:var(--emerald); line-height:1;">${crops.totalPlanted}</div>
          <div style="font-size:11px; color:var(--text-tertiary); margin-top:4px; text-transform:uppercase; letter-spacing:0.5px;">Plantados</div>
        </div>
        <div style="background:var(--surface-3); border:1px solid var(--surface-border); padding:8px 16px; border-radius:12px;">
          <div style="font-size:24px; font-weight:800; color:var(--text-primary); line-height:1;">${crops.totalPlots}</div>
          <div style="font-size:11px; color:var(--text-tertiary); margin-top:4px; text-transform:uppercase; letter-spacing:0.5px;">Slots Totais</div>
        </div>
        <div style="background:var(--surface-3); border:1px solid var(--surface-border); padding:8px 16px; border-radius:12px; ${emptySlots > 0 ? 'border-color:var(--amber);' : ''}">
          <div style="font-size:24px; font-weight:800; color:${emptySlots > 0 ? 'var(--amber)' : 'var(--text-secondary)'}; line-height:1;">${emptySlots}</div>
          <div style="font-size:11px; color:var(--text-tertiary); margin-top:4px; text-transform:uppercase; letter-spacing:0.5px;">Vazios</div>
        </div>
      </div>
    </div>
    <div style="max-height: 400px; overflow-y:auto; padding-right:4px;">
      ${crops.length > 0 ? itemsHtml : '<div style="padding: 24px; text-align: center; color: var(--text-tertiary);">Nenhuma semente plantada no momento.</div>'}
    </div>
  `;

  showModal('Minhas Plantações', modalHtml);
};

  window.__app.showFruitsModal = () => {
    const parsed = window.__app.State.parsedFarm;
    if (!parsed || !parsed.fruits) return;
  
    const fruits = parsed.fruits;
    if (fruits.length === 0) {
      showModal('🍇 Minhas Frutas', '<div style="padding:32px; text-align:center; color:var(--text-secondary); font-size:15px;">Você não possui frutas plantadas.</div>');
      return;
    }

    const readyCount  = fruits.filter(f => f.status === 'ready').length;
    const totalLeft   = fruits.reduce((sum, f) => sum + (parseInt(f.harvestsLeft) || 0), 0);

    // Group by fruit name for summary
    const byType = {};
    fruits.forEach(f => { byType[f.name] = (byType[f.name] || 0) + 1; });
    const typeChips = Object.entries(byType).map(([name, count]) => {
      const icon = `https://sfl.world/img/source/${name.replace(/\s+/g, '')}.png`;
      return `<div style="display:flex;align-items:center;gap:6px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:20px;padding:4px 12px;">
        <img src="${icon}" style="width:18px;height:18px;object-fit:contain;image-rendering:pixelated;" onerror="this.style.display='none'">
        <span style="font-size:13px;font-weight:700;color:var(--text-primary);">${count}x ${name}</span>
      </div>`;
    }).join('');

    const itemsHtml = fruits.map((fruit, i) => {
      const iconUrl = `https://sfl.world/img/source/${encodeURIComponent(fruit.name)}.png`;
      const isReady = fruit.status === 'ready';
      const isEmpty = parseInt(fruit.harvestsLeft) === 0;

      const statusBadge = isReady
        ? `<span style="background:rgba(16,185,129,0.15);border:1px solid rgba(16,185,129,0.35);color:#4ade80;font-size:12px;font-weight:800;padding:4px 10px;border-radius:20px;white-space:nowrap;">✅ Pronto!</span>`
        : isEmpty
          ? `<span style="background:rgba(239,68,68,0.12);border:1px solid rgba(239,68,68,0.25);color:#f87171;font-size:12px;font-weight:700;padding:4px 10px;border-radius:20px;">Esgotado</span>`
          : `<span style="background:rgba(245,158,11,0.12);border:1px solid rgba(245,158,11,0.25);color:var(--amber-glow);font-size:12px;font-weight:700;padding:4px 10px;border-radius:20px;">${fruit.countdown}</span>`;

      const timeInfo = !isReady && !isEmpty
        ? `<div style="font-size:11px;color:var(--text-tertiary);margin-top:3px;">Pronto às ${new Date(fruit.readyAt).toLocaleTimeString('pt-BR', {hour:'2-digit',minute:'2-digit'})}</div>`
        : '';

      const harvestBar = parseInt(fruit.harvestsLeft) > 0
        ? `<div style="display:flex;align-items:center;gap:4px;margin-top:5px;">
            ${Array.from({length: Math.min(parseInt(fruit.harvestsLeft), 8)}).map(() =>
              `<div style="width:6px;height:6px;border-radius:50%;background:var(--emerald);"></div>`
            ).join('')}
            ${parseInt(fruit.harvestsLeft) > 8 ? `<span style="font-size:10px;color:var(--text-tertiary);">+${parseInt(fruit.harvestsLeft)-8}</span>` : ''}
          </div>`
        : '';

      return `
        <div class="spring-in" style="background:rgba(255,255,255,0.025);border:1px solid rgba(255,255,255,${isReady ? '0.12' : '0.05'});border-radius:14px;margin-bottom:8px;animation-delay:${i*20}ms;padding:12px 14px;display:flex;align-items:center;gap:12px;transition:border-color 0.2s;${isReady ? 'box-shadow:0 0 0 1px rgba(74,222,128,0.15);' : ''}">
          <div style="width:44px;height:44px;flex-shrink:0;background:rgba(0,0,0,0.3);border-radius:10px;display:flex;align-items:center;justify-content:center;border:1px solid rgba(255,255,255,0.08);">
            <img src="${iconUrl}" style="width:28px;height:28px;object-fit:contain;image-rendering:pixelated;" onerror="this.style.display='none';this.nextElementSibling.style.display='inline'">
            <span style="font-size:24px;display:none;">${fruit.emoji || '🍓'}</span>
          </div>
          <div style="flex:1;min-width:0;">
            <div style="font-size:14px;font-weight:800;color:var(--text-primary);line-height:1;margin-bottom:4px;">${fruit.name}</div>
            <div style="font-size:12px;color:var(--text-tertiary);">Colheitas: <strong style="color:${parseInt(fruit.harvestsLeft)>0?'var(--emerald)':'var(--text-tertiary)'}">${fruit.harvestsLeft}x restantes</strong></div>
            ${harvestBar}
            ${timeInfo}
          </div>
          <div style="flex-shrink:0;">
            ${statusBadge}
          </div>
        </div>
      `;
    }).join('');
  
    const modalHtml = `
      <!-- Stats Header -->
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:20px;">
        <div style="background:rgba(74,222,128,0.08);border:1px solid rgba(74,222,128,0.2);border-radius:12px;padding:12px;text-align:center;">
          <div style="font-size:26px;font-weight:800;color:#4ade80;line-height:1;">${readyCount}</div>
          <div style="font-size:10px;color:var(--text-tertiary);margin-top:4px;text-transform:uppercase;letter-spacing:0.5px;">Prontas</div>
        </div>
        <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:12px;text-align:center;">
          <div style="font-size:26px;font-weight:800;color:var(--text-primary);line-height:1;">${fruits.length}</div>
          <div style="font-size:10px;color:var(--text-tertiary);margin-top:4px;text-transform:uppercase;letter-spacing:0.5px;">Pés</div>
        </div>
        <div style="background:rgba(245,158,11,0.08);border:1px solid rgba(245,158,11,0.2);border-radius:12px;padding:12px;text-align:center;">
          <div style="font-size:26px;font-weight:800;color:var(--amber-glow);line-height:1;">${totalLeft}</div>
          <div style="font-size:10px;color:var(--text-tertiary);margin-top:4px;text-transform:uppercase;letter-spacing:0.5px;">Colheitas</div>
        </div>
      </div>
      <!-- Fruit types chip row -->
      <div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:16px;">${typeChips}</div>
      <!-- Divider -->
      <div style="height:1px;background:rgba(255,255,255,0.06);margin-bottom:14px;"></div>
      <!-- List -->
      <div class="hide-scrollbar" style="max-height:52vh;overflow-y:auto;">
        ${itemsHtml}
      </div>
    `;
  
    showModal('🍇 Minhas Frutas', modalHtml);
  };

window.__app.moveFarmSectionUp = (id) => {
  const settings = Storage.getSettings();
  let order = settings.farmSectionOrder || ['crops', 'fruits', 'animals', 'trees', 'rocks', 'buildings', 'beehives', 'greenhouse', 'oil'];
  const index = order.indexOf(id);
  if (index > 0) {
    const temp = order[index - 1];
    order[index - 1] = id;
    order[index] = temp;
    Storage.saveSettings({ farmSectionOrder: order });
    if (window.__app && window.__app.State) {
      renderFarmPage(window.__app.State.parsedFarm, window.__app.State.farmId);
    }
  }
};

window.__app.moveFarmSectionDown = (id) => {
  const settings = Storage.getSettings();
  let order = settings.farmSectionOrder || ['crops', 'fruits', 'animals', 'trees', 'rocks', 'buildings', 'beehives', 'greenhouse', 'oil'];
  const index = order.indexOf(id);
  if (index >= 0 && index < order.length - 1) {
    const temp = order[index + 1];
    order[index + 1] = id;
    order[index] = temp;
    Storage.saveSettings({ farmSectionOrder: order });
    if (window.__app && window.__app.State) {
      renderFarmPage(window.__app.State.parsedFarm, window.__app.State.farmId);
    }
  }
};

window.__app.toggleFarmSection = (id) => {
  const settings = Storage.getSettings();
  let collapsed = settings.farmSectionCollapsed || {};
  collapsed[id] = !collapsed[id];
  Storage.saveSettings({ farmSectionCollapsed: collapsed });
  if (window.__app && window.__app.State) {
    renderFarmPage(window.__app.State.parsedFarm, window.__app.State.farmId);
  }
};

window.__app.showAnimalsModal = () => {
  const parsed = window.__app.State.parsedFarm;
  if (!parsed || !parsed.animals) return;

  const animals = parsed.animals;
  if (animals.length === 0) {
    showModal('Meus Animais', '<div style="padding: 16px; text-align: center; color: var(--text-secondary);">Você não possui animais.</div>');
    return;
  }

  const groups = {};
  animals.forEach(animal => {
    if (!groups[animal.type]) {
      groups[animal.type] = {
        total: 0,
        hungry: 0,
        ready: 0,
        sleeping: 0,
        needsLove: 0,
        sick: 0,
        type: animal.type,
        emoji: animal.emoji,
        instances: []
      };
    }
    groups[animal.type].total++;
    groups[animal.type].instances.push(animal);

    if (animal.status === 'ready') groups[animal.type].ready++;
    else if (animal.status === 'needsLove') groups[animal.type].needsLove++;
    else if (animal.status === 'sick') groups[animal.type].sick++;
    else if (animal.status === 'soon') groups[animal.type].hungry++;
    else groups[animal.type].sleeping++;
  });

  const itemsHtml = Object.values(groups).map((group, i) => {
    let iconContent = '';
    if (group.type === 'Chicken') {
      iconContent = `<img src="${ASSETS.CHICKEN}" style="width:36px;height:36px;object-fit:contain;image-rendering:pixelated;">`;
    } else if (group.type === 'Cow') {
      iconContent = `<img src="https://raw.githubusercontent.com/sunflower-land/sunflower-land/main/src/assets/sfts/baby_cow.webp" style="width:36px;height:36px;object-fit:contain;image-rendering:pixelated;">`;
    } else if (group.type === 'Sheep') {
      iconContent = `<img src="https://raw.githubusercontent.com/sunflower-land/sunflower-land/main/src/assets/sfts/baby_sheep.webp" style="width:36px;height:36px;object-fit:contain;image-rendering:pixelated;">`;
    } else {
      iconContent = `<span style="font-size:32px;">${group.emoji}</span>`;
    }
    
    const typeName = group.type === 'Chicken' ? 'Galinhas' : (group.type === 'Cow' ? 'Vacas' : (group.type === 'Sheep' ? 'Ovelhas' : group.type));

    return `
      <div class="spring-in" style="background:var(--surface-3); border:1px solid var(--surface-border); border-radius:16px; margin-bottom:12px; animation-delay: ${i * 30}ms; overflow:hidden;">
        <div onclick="const dt = this.nextElementSibling; dt.style.display = dt.style.display === 'none' ? 'block' : 'none';" style="cursor:pointer; padding:16px; display:flex; align-items:center; gap:16px;">
          <div style="width:64px;height:64px;background:var(--surface-2);border-radius:12px;display:flex;align-items:center;justify-content:center;border:1px solid var(--surface-border); box-shadow: inset 0 2px 4px rgba(0,0,0,0.2);">
            ${iconContent}
          </div>
          <div style="flex:1; min-width:0;">
            <div style="font-size:18px; font-weight:800; color:var(--text-primary); margin-bottom:4px;">${typeName}</div>
            <div style="font-size:13px; color:var(--text-secondary); font-weight:600;">
              Total na fazenda: <strong style="color:var(--text-primary); font-size:14px;">${group.total}</strong>
            </div>
            <div style="font-size:11px; color:var(--text-tertiary); margin-top:2px;">Clique para ver detalhes</div>
          </div>
          <div style="text-align:right; display:flex; flex-direction:column; gap:6px;">
            ${group.ready > 0 ? `<div style="font-size:12px; font-weight:700; color:var(--emerald); background:rgba(16, 185, 129, 0.1); padding:4px 8px; border-radius:6px; border: 1px solid rgba(16, 185, 129, 0.2);">+ ${group.ready} p/ Coleta</div>` : ''}
            ${group.sick > 0 ? `<div style="font-size:12px; font-weight:700; color:#ef4444; background:rgba(239, 68, 68, 0.1); padding:4px 8px; border-radius:6px; border: 1px solid rgba(239, 68, 68, 0.2);">${group.sick} Doentes</div>` : ''}
            ${group.needsLove > 0 ? `<div style="font-size:12px; font-weight:700; color:#d946ef; background:rgba(217, 70, 239, 0.1); padding:4px 8px; border-radius:6px; border: 1px solid rgba(217, 70, 239, 0.2);">${group.needsLove} Querem Carinho</div>` : ''}
            ${group.hungry > 0 ? `<div style="font-size:12px; font-weight:700; color:var(--coral); background:rgba(251, 146, 60, 0.1); padding:4px 8px; border-radius:6px; border: 1px solid rgba(251, 146, 60, 0.2);">${group.hungry} c/ Fome!</div>` : ''}
            ${group.sleeping > 0 ? `<div style="font-size:12px; font-weight:700; color:var(--sky); background:rgba(14, 165, 233, 0.1); padding:4px 8px; border-radius:6px; border: 1px solid rgba(14, 165, 233, 0.2);">${group.sleeping} Dormindo</div>` : ''}
          </div>
        </div>
        
        <div style="display:none; background:var(--surface-2); border-top:1px solid var(--surface-border); padding: 8px 16px;">
          ${group.instances.map((inst, idx) => {
            let statusColor = 'var(--text-secondary)';
            let statusText = 'Dormindo';
            
            if (inst.status === 'ready') {
              statusColor = 'var(--emerald)';
              statusText = 'Pronto para Coleta';
            } else if (inst.status === 'needsLove') {
              statusColor = '#d946ef'; // Magenta/Pink for love
              statusText = 'Precisando de Carinho';
            } else if (inst.status === 'sick') {
              statusColor = '#ef4444'; // Red for sick
              statusText = 'Doente (Precisa de Remédio)';
            } else if (inst.status === 'soon') {
              statusColor = 'var(--coral)'; // Orange for hungry
              statusText = 'Com Fome';
            } else {
              statusColor = 'var(--text-secondary)';
              statusText = 'Dormindo/Produzindo';
            }

            return `
              <div style="display:flex; justify-content:space-between; align-items:center; padding:10px 0; border-bottom:1px solid rgba(255,255,255,0.05);">
                <div style="display:flex; align-items:center; gap: 10px;">
                  <span style="font-weight:bold; color:var(--text-primary); font-size:14px;">#${idx + 1}</span>
                  <span style="font-size:12px; font-weight:700; background:rgba(255,255,255,0.08); color:var(--text-primary); padding:3px 8px; border-radius:6px; border:1px solid rgba(255,255,255,0.1);">Nível ${inst.level ?? 0}</span>
                </div>
                <div style="text-align:right;">
                  <div style="font-size:13px; font-weight:700; color:${statusColor};">${statusText}</div>
                  <div style="font-size:11px; color:var(--text-secondary); font-family:var(--font-mono); margin-top:2px;">${inst.countdown}</div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }).join('');

  const modalHtml = `
    <div style="padding-bottom: 12px; margin-bottom: 16px; border-bottom: 1px solid var(--surface-border); display: flex; justify-content: space-between; align-items: center;">
      <div style="font-size: 14px; color: var(--text-secondary);">
        Total de Animais: <strong style="color:white;">${animals.length}</strong>
      </div>
      <div style="font-size: 13px; color: var(--coral); font-weight: bold; background: rgba(251, 146, 60, 0.1); padding: 4px 8px; border-radius: 6px;">
        ${animals.filter(a => ['ready', 'soon', 'needsLove', 'sick'].includes(a.status)).length} precisando de atenção
      </div>
    </div>
    <div style="max-height: 500px; overflow-y: auto; padding-right: 4px;">
      ${itemsHtml}
    </div>
  `;

  showModal('Resumo dos Animais', modalHtml);
};

// =====================================================
// TOAST
// =====================================================

function showToast(message, type = 'success') {
  const existing = $('#toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.id = 'toast';
  toast.style.cssText = `
    position:fixed;bottom:calc(var(--nav-h) + 16px);left:50%;transform:translateX(-50%);
    background:${type === 'error' ? 'var(--coral)' : 'var(--emerald)'};
    color:var(--obsidian-base);padding:10px 20px;border-radius:24px;
    font-family:var(--font-display);font-size:13px;font-weight:700;
    z-index:9999;animation:springIn 300ms cubic-bezier(0.34,1.56,0.64,1);
    box-shadow:0 4px 20px rgba(0,0,0,0.3);white-space:nowrap;max-width:90vw;
  `;
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast?.remove(), 3000);
}

export default {
  renderPriceStrip,
  renderHome,
  renderFarmPage,
  renderFarmItem,
  renderMarketPage,
  renderMarketFiltered,
  renderAlertsPage,
  renderNotifSettings,
  renderSettingsPage,
  renderToolsPage,
  renderLoadingState,
  showModal,
  hideModal,
  openP2pCalc,
  updateP2pCalc,
  showTargetProfit,
  getEstimatedCost,
  updateAlertBadge,
  showToast,
  formatNumber,
  formatSfl,
  formatPrice,
};

window.__app.showCompostModal = () => {
  const farm = window.__app.State.parsedFarm;
  if (!farm || farm.isPartial) {
    showModal('♻️ Composteiras', '<div style="padding:32px; text-align:center; color:var(--text-secondary); font-size:15px;">🔒 Fazenda Bloqueada. Não é possível ver detalhes.</div>');
    return;
  }

  const items = farm.composting || [];
  if (items.length === 0) {
    showModal('♻️ Composteiras', '<div style="padding:32px; text-align:center; color:var(--text-secondary); font-size:15px;">Você não possui composteiras na sua fazenda.</div>');
    return;
  }

  const listHtml = items.map((c, i) => {
    const isReady = c.status === 'ready';
    const isProducing = c.msLeft > 0;
    let composterImg = 'compost.png';
    if (c.name === 'Turbo Composter') composterImg = 'fruitful_blend.png';
    else if (c.name === 'Premium Composter') composterImg = 'rapid_root.png';
    else if (c.name === 'Compost Bin') composterImg = 'sprout_mix.png';
    
    const imgUrl = `https://raw.githubusercontent.com/sunflower-land/sunflower-land/main/src/assets/composters/${composterImg}`;
    const produceImg = isProducing || isReady ? `<img src="https://sfl.world/img/source/${c.type.replace(/\s+/g, '')}.png" style="width:16px;height:16px;image-rendering:pixelated;vertical-align:middle;margin-right:4px;">` : '';

    return `
      <div style="background:var(--surface-2);border:1px solid var(--surface-border);border-radius:16px;padding:12px;margin-bottom:12px;display:flex;align-items:center;gap:12px;">
        <div style="width:40px;height:40px;background:var(--surface-3);border:1px solid rgba(255,255,255,0.05);border-radius:12px;display:flex;align-items:center;justify-content:center;box-shadow:inset 0 2px 4px rgba(0,0,0,0.3);flex-shrink:0;">
          <img src="${imgUrl}" style="width:24px;height:24px;image-rendering:pixelated;" onerror="this.style.display='none'">
        </div>
        <div style="flex:1;min-width:0;">
          <div style="font-size:15px;font-weight:800;color:var(--text-primary);">${c.name}</div>
          <div style="font-size:12px;font-weight:600;color:var(--text-tertiary);margin-top:2px;">${isProducing || isReady ? c.amount + 'x ' + c.type : 'Vazia'}</div>
        </div>
        <div style="text-align:right;">
          ${isReady 
            ? `<div style="background:rgba(16,185,129,0.15);color:var(--emerald);border:1px solid rgba(16,185,129,0.3);padding:6px 10px;border-radius:10px;font-size:11px;font-weight:800;">${produceImg} Pronta!</div>`
            : (isProducing 
                ? `<div style="background:rgba(251,191,36,0.15);color:var(--amber);border:1px solid rgba(251,191,36,0.3);padding:6px 10px;border-radius:10px;font-size:11px;font-weight:800;" class="${c.status}">${produceImg} ${c.countdown}</div>`
                : `<div style="background:rgba(255,255,255,0.05);color:var(--text-tertiary);border:1px solid rgba(255,255,255,0.1);padding:6px 10px;border-radius:10px;font-size:11px;font-weight:700;">Inativa</div>`)
          }
        </div>
      </div>
    `;
  }).join('');

  const modalHtml = `
    <div style="max-height:60vh;overflow-y:auto;padding-right:4px;">
      ${listHtml}
    </div>
  `;
  
  showModal('♻️ Detalhes das Composteiras', modalHtml);
};
window.__app.showIslandResourcesModal = () => {
  const farm = window.__app.State.parsedFarm;
  if (!farm || farm.isPartial) {
    window.__app.UI.showModal('🌿 Recursos da Ilha', '<div style="padding:32px; text-align:center; color:var(--text-secondary); font-size:15px;">🔒 Conecte sua API Key para ver os recursos detalhados.</div>');
    return;
  }

  const IMG = (name) => `https://sfl.world/img/source/${encodeURIComponent(name)}.png`;

  const resourceGroups = [
    {
      label: 'Madeira',
      img: 'Wood',
      items: (farm.trees || []),
      regrow: '2h',
    },
    {
      label: 'Pedra',
      img: 'Stone',
      items: (farm.rocks || []).filter(r => r.name === 'Stone Rock'),
      regrow: '4h',
    },
    {
      label: 'Ferro',
      img: 'Iron',
      items: (farm.rocks || []).filter(r => r.name === 'Iron Rock'),
      regrow: '8h',
    },
    {
      label: 'Ouro',
      img: 'Gold',
      items: (farm.rocks || []).filter(r => r.name === 'Gold Rock'),
      regrow: '24h',
    },
    {
      label: 'Crimstone',
      img: 'Crimstone',
      items: (farm.rocks || []).filter(r => r.name === 'Crimstone'),
      regrow: '24h',
    },
    {
      label: 'Sunstone',
      img: 'Sunstone',
      items: (farm.rocks || []).filter(r => r.name === 'Sunstone'),
      regrow: '24h',
    },
    {
      label: 'Cogumelos',
      img: 'Wild Mushroom',
      items: (farm.mushrooms || []),
      regrow: '16h',
    },
    {
      label: 'Petróleo',
      img: 'Oil',
      items: (farm.oil || []),
      regrow: '24h',
    },
  ];

  const listHtml = resourceGroups.map(g => {
    const total = g.items.length;
    const ready = g.items.filter(i => i.status === 'ready').length;
    
    if (total === 0) {
      return `
        <div style="display:flex;align-items:center;gap:12px;padding:12px 14px;background:rgba(255,255,255,0.02);border:1px dashed rgba(255,255,255,0.05);border-radius:14px;margin-bottom:10px;opacity:0.6;">
          <div style="width:44px;height:44px;background:var(--surface-3);border-radius:12px;display:flex;align-items:center;justify-content:center;flex-shrink:0;border:1px solid rgba(255,255,255,0.04);">
            <img src="${IMG(g.img)}" style="width:28px;height:28px;object-fit:contain;image-rendering:pixelated;filter:grayscale(100%);" onerror="this.style.display='none'">
          </div>
          <div style="flex:1;min-width:0;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:2px;">
              <span style="font-size:13px;font-weight:700;color:var(--text-secondary);">${g.label}</span>
              <span style="font-size:13px;font-weight:800;color:var(--text-tertiary);">0/0</span>
            </div>
            <div style="font-size:11px;color:var(--text-tertiary);">Ainda não desbloqueado na sua ilha.</div>
          </div>
        </div>
      `;
    }

    const pct = Math.round((ready / total) * 100);
    const barColor = ready === total ? 'var(--emerald)' : (ready > 0 ? 'var(--amber)' : 'var(--text-tertiary)');
    
    // Sort items so recovering ones are at the end, and ready ones at the front
    const sortedItems = [...g.items].sort((a,b) => {
      if(a.status === 'ready' && b.status !== 'ready') return -1;
      if(b.status === 'ready' && a.status !== 'ready') return 1;
      return a.msLeft - b.msLeft;
    });


    const readyItems = g.items.filter(i => i.status === 'ready');
    const recoveringItems = g.items.filter(i => i.status !== 'ready').sort((a,b) => a.msLeft - b.msLeft);
    
    let itemsGrid = '';
    
    // 1. Render a single summary tag for all READY items
    if (readyItems.length > 0) {
      const totalYield = readyItems.reduce((acc, i) => acc + (i.amount || 1), 0);
      itemsGrid += `<div style="background:rgba(16,185,129,0.15); color:var(--emerald); border:1px solid rgba(16,185,129,0.3); font-size:11px; padding:4px 8px; border-radius:6px; font-weight:800; display:flex; align-items:center; gap:4px;"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg> Rende +${totalYield}</div>`;
    }
    
    // 2. Render individual tags ONLY for recovering items
    itemsGrid += recoveringItems.map(item => {
      return `<div style="background:rgba(255,255,255,0.05); color:var(--text-secondary); border:1px solid rgba(255,255,255,0.1); font-size:10px; padding:4px 6px; border-radius:6px; font-family:monospace; display:flex; align-items:center;">${item.countdown}</div>`;
    }).join('');


    return `
      <div style="padding:14px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:14px;margin-bottom:10px;">
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;">
          <div style="width:44px;height:44px;background:var(--surface-3);border-radius:12px;display:flex;align-items:center;justify-content:center;flex-shrink:0;border:1px solid rgba(255,255,255,0.1);">
            <img src="${IMG(g.img)}" style="width:28px;height:28px;object-fit:contain;image-rendering:pixelated;" onerror="this.style.display='none'">
          </div>
          <div style="flex:1;min-width:0;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
              <span style="font-size:14px;font-weight:800;color:var(--text-primary);">${g.label}</span>
              <span style="font-size:14px;font-weight:800;color:${ready > 0 ? 'var(--emerald)' : 'var(--text-secondary)'};">${ready}/${total}</span>
            </div>
            <div style="height:6px;background:rgba(255,255,255,0.06);border-radius:3px;overflow:hidden;margin-bottom:5px;">
              <div style="height:100%;width:${pct}%;background:${barColor};border-radius:3px;transition:width 0.3s ease;"></div>
            </div>
            <div style="font-size:11px;color:var(--text-tertiary);text-align:right;">Regenera: ${g.regrow}</div>
          </div>
        </div>
        <div style="display:flex; gap:6px; flex-wrap:wrap; padding-top:10px; border-top:1px dashed rgba(255,255,255,0.08);">
          ${itemsGrid}
        </div>
      </div>
    `;
  }).join('');

  const totalReady = resourceGroups.reduce((s, g) => s + g.items.filter(i=>i.status==='ready').length, 0);
  const totalItems = resourceGroups.reduce((s, g) => s + g.items.length, 0);

  const modalHtml = `
    <div style="margin-bottom:16px;padding:12px 14px;background:rgba(16,185,129,0.08);border:1px solid rgba(16,185,129,0.2);border-radius:12px;display:flex;justify-content:space-between;align-items:center;">
      <span style="font-size:13px;font-weight:600;color:var(--text-secondary);">Total disponível na ilha</span>
      <span style="font-size:18px;font-weight:800;color:var(--emerald);">${totalReady} / ${totalItems}</span>
    </div>
    <div style="max-height:55vh;overflow-y:auto;padding-right:4px;">
      ${listHtml}
    </div>
  `;

  window.__app.UI.showModal('🏝️ Recursos da Ilha', modalHtml);
};

window.__app = window.__app || {};
window.__app.promptManualPurchase = () => {
  let item = prompt('Nome do Item comprado (em inglês, ex: Wood, Basic Land):');
  if (!item) return;
  
  // Smart Title Casing: "wood" -> "Wood", "basic land" -> "Basic Land"
  item = item.trim().split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
  
  const qty = parseFloat(prompt('Quantidade (ex: 500):'));
  if (isNaN(qty) || qty <= 0) return;
  const cost = parseFloat(prompt('Preço Total Pago em SFL (ex: 20.5):'));
  if (isNaN(cost) || cost <= 0) return;

  const salesLog = JSON.parse(localStorage.getItem('sfl_sales_log') || '[]');
  salesLog.push({ type: 'purchase', item, qty, cost, profit: -cost, timestamp: Date.now() });
  localStorage.setItem('sfl_sales_log', JSON.stringify(salesLog));
  
  if (window.__app.UI && window.__app.State) {
    const searchVal = document.querySelector('#market-search')?.value || '';
    window.__app.UI.renderMarketFiltered(searchVal, 'history');
  } else {
    window.location.reload();
  }
};

window.__app.UI = window.__app.UI || {};
window.__app.UI.promptWalletPosition = () => {
  const p2p = Object.keys(_allPrices).length > 0 ? _allPrices : FALLBACK_PRICES;
  const items = Object.keys(p2p).sort();
  
  const step1Html = `
    <div id="wallet-step-1" style="padding:16px; font-family:var(--font-sans);">
      <h3 style="margin-top:0; color:var(--text-primary); font-weight:900;">1. Selecione o Item</h3>
      <div style="margin-bottom:12px; position:relative;">
        <input type="text" id="wallet-search-input" placeholder="Pesquisar..." style="width:100%; padding:12px 12px 12px 36px; border-radius:12px; border:1px solid var(--surface-border); background:var(--surface-1); color:var(--text-primary); font-size:14px;">
        <span style="position:absolute; left:12px; top:12px; opacity:0.5;">🔍</span>
      </div>
      <div id="wallet-search-results" style="max-height:40vh; overflow-y:auto; display:flex; flex-direction:column; gap:8px;">
      </div>
    </div>
  `;

  const step2Html = `
    <div id="wallet-step-2" style="padding:16px; font-family:var(--font-sans); display:none;">
      <button id="wallet-back-btn" style="background:none; border:none; color:var(--text-tertiary); margin-bottom:12px; cursor:pointer; font-weight:700;">← Voltar</button>
      
      <div style="display:flex; align-items:center; gap:12px; margin-bottom:16px; padding:12px; background:var(--surface-2); border-radius:12px; border:1px solid rgba(255,255,255,0.05);">
         <img id="wallet-selected-img" src="" style="width:32px; height:32px; object-fit:contain; image-rendering:pixelated; filter:drop-shadow(0 2px 4px rgba(0,0,0,0.3));" onerror="this.src='https://sfl.world/img/source/Sunflower.png'">
         <div id="wallet-selected-name" style="font-size:16px; font-weight:900; color:var(--text-primary);"></div>
      </div>

      <div style="margin-bottom:12px;">
        <label style="display:block; font-size:12px; color:var(--text-tertiary); margin-bottom:4px; font-weight:700;">Quantidade Comprada</label>
        <input type="number" id="wallet-item-qty" placeholder="Ex: 5000" style="width:100%; padding:12px; border-radius:12px; border:1px solid var(--surface-border); background:var(--surface-1); color:var(--text-primary); font-size:16px; font-weight:800;">
      </div>
      
      <div style="margin-bottom:20px;">
        <label style="display:block; font-size:12px; color:var(--text-tertiary); margin-bottom:4px; font-weight:700;">Custo Total (em SFL)</label>
        <input type="number" step="0.0001" id="wallet-item-cost" placeholder="Ex: 25.50" style="width:100%; padding:12px; border-radius:12px; border:1px solid var(--surface-border); background:var(--surface-1); color:var(--text-primary); font-size:16px; font-weight:800;">
      </div>
      
      <button id="wallet-save-btn" style="width:100%; padding:14px; border-radius:12px; background:var(--emerald); color:white; font-weight:900; font-size:16px; border:none; cursor:pointer;">Confirmar Investimento</button>
    </div>
  `;
  
  // Use the local showModal directly (exported on __app.UI but also accessible as local fn)
  const _showModal = (typeof showModal === 'function') ? showModal : window.__app.UI.showModal;
  const _hideModal = (typeof hideModal === 'function') ? hideModal : window.__app.UI.hideModal;
  if (_showModal) {
    _showModal('💳 Registrar Investimento', step1Html + step2Html);
    
    const searchInput = document.getElementById('wallet-search-input');
    const resultsContainer = document.getElementById('wallet-search-results');
    const step1 = document.getElementById('wallet-step-1');
    const step2 = document.getElementById('wallet-step-2');
    
    let selectedItemName = '';
    
    const renderResults = (query) => {
      const q = query.toLowerCase().trim();
      const filtered = items.filter(i => i.toLowerCase().includes(q)).slice(0, 50);
      
      if (filtered.length === 0) {
        resultsContainer.innerHTML = '<div style="padding:16px; text-align:center; color:var(--text-tertiary); font-size:14px;">Nenhum item encontrado</div>';
        return;
      }
      
      resultsContainer.innerHTML = filtered.map(item => `
        <div class="wallet-search-item" data-name="${item}" style="display:flex; align-items:center; gap:12px; padding:10px 12px; background:var(--surface-2); border:1px solid rgba(255,255,255,0.05); border-radius:12px; cursor:pointer;">
          <img src="https://sfl.world/img/source/${encodeURIComponent(item.replace(/\s+/g, ''))}.png" style="width:24px; height:24px; object-fit:contain; image-rendering:pixelated;" onerror="this.src='https://sfl.world/img/source/Sunflower.png'">
          <div style="font-size:14px; font-weight:700; color:var(--text-primary);">${item}</div>
        </div>
      `).join('');
      
      document.querySelectorAll('.wallet-search-item').forEach(el => {
        el.addEventListener('click', () => {
          selectedItemName = el.dataset.name;
          document.getElementById('wallet-selected-name').textContent = selectedItemName;
          document.getElementById('wallet-selected-img').src = `https://sfl.world/img/source/${encodeURIComponent(selectedItemName.replace(/\s+/g, ''))}.png`;
          step1.style.display = 'none';
          step2.style.display = 'block';
        });
      });
    };
    
    renderResults('');
    
    searchInput.addEventListener('input', (e) => renderResults(e.target.value));
    
    document.getElementById('wallet-back-btn').addEventListener('click', () => {
      step2.style.display = 'none';
      step1.style.display = 'block';
    });
    
    document.getElementById('wallet-save-btn').addEventListener('click', () => {
      const qty = parseFloat(document.getElementById('wallet-item-qty').value);
      const cost = parseFloat(document.getElementById('wallet-item-cost').value);
      
      if (!selectedItemName || isNaN(qty) || qty <= 0 || isNaN(cost) || cost <= 0) {
        alert("Preencha todos os campos corretamente.");
        return;
      }
      
      if (window.__app.addWalletPosition) {
        window.__app.addWalletPosition(selectedItemName, qty, cost);
        _hideModal();
        // Refresh wallet view
        renderMarketFiltered('', 'wallet');
      }
    });
  }
};

// ── Creator Island Shortcut ──
window.__app.UI.goToCreatorIsland = () => {
  const CREATOR_FARM_ID = 2; // SFL game creator farm
  if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.Browser) {
    window.Capacitor.Plugins.Browser.open({ url: `https://www.sunflower-land.com/visit/${CREATOR_FARM_ID}` });
  } else {
    // Fallback: navigate to settings tab that has visit island option
    const settingsTab = document.querySelector('[data-tab="settings"]');
    if (settingsTab) settingsTab.click();
    // Show a quick modal with the link
    setTimeout(() => {
      showModal('🌻 Visitar Ilha', `
        <div style="padding:20px; text-align:center; font-family:var(--font-sans);">
          <div style="font-size:48px; margin-bottom:12px;">🌻</div>
          <div style="font-size:16px; font-weight:800; color:var(--text-primary); margin-bottom:8px;">Ilha do Criador</div>
          <div style="font-size:13px; color:var(--text-tertiary); margin-bottom:20px;">Acesse a fazenda do criador do SFL PRO!</div>
          <a href="https://www.sunflower-land.com/visit/2" target="_blank" style="display:block; background:var(--amber-subtle); border:1px solid var(--amber); color:var(--amber); border-radius:12px; padding:12px; font-weight:800; font-size:14px; text-decoration:none;">
            Abrir no Navegador 🔗
          </a>
        </div>
      `);
    }, 100);
  }
};
