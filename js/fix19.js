const fs = require('fs');

let html = fs.readFileSync('index.html', 'utf8');

// 1. Insert script tag
if (!html.includes('market-costs.js')) {
  html = html.replace(
    '<script type="module" src="js/app.js',
    '<script src="js/market-costs.js"></script>\n  <script type="module" src="js/app.js'
  );
}

// 2. Replace chips
const OLD_CHIPS = `        <div class="filter-chips" data-target="market" id="market-filter-active" data-filter="all">
          <div class="chip active" data-filter="all" data-i18n="market_all">All</div>
          <div class="chip" data-filter="crops" data-i18n="market_crops_seeds">Crops & Seeds</div>
          <div class="chip" data-filter="resources" data-i18n="market_resources">Resources</div>
          <div class="chip" data-filter="fish" data-i18n="market_fish">Fish</div>
          <div class="chip" data-filter="history">📜 Histórico</div>
        </div>`;

const NEW_CHIPS = `        <div class="filter-chips" data-target="market" id="market-filter-active" data-filter="portfolio">
          <div class="chip active" data-filter="portfolio">💼 Portfólio</div>
          <div class="chip" data-filter="opportunities">🔥 Oportunidades</div>
          <div class="chip" data-filter="history">📜 Histórico (P&L)</div>
        </div>`;

if (html.includes(OLD_CHIPS)) {
  html = html.replace(OLD_CHIPS, NEW_CHIPS);
} else {
  console.log("Could not find OLD_CHIPS exactly in index.html");
}

fs.writeFileSync('index.html', html);
console.log('index.html updated successfully');
