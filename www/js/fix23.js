const fs = require('fs');
let ui = fs.readFileSync('js/ui.js', 'utf8');

const MANUAL_PURCHASE_FUNC = `
window.__app = window.__app || {};
window.__app.promptManualPurchase = () => {
  const item = prompt('Nome do Item comprado (em inglês, ex: Wood):');
  if (!item) return;
  const qty = parseFloat(prompt('Quantidade:'));
  if (isNaN(qty) || qty <= 0) return;
  const cost = parseFloat(prompt('Preço Total Pago (em SFL):'));
  if (isNaN(cost) || cost <= 0) return;

  const salesLog = JSON.parse(localStorage.getItem('sfl_sales_log') || '[]');
  salesLog.push({ type: 'purchase', item, qty, cost, profit: -cost, timestamp: Date.now() });
  localStorage.setItem('sfl_sales_log', JSON.stringify(salesLog));
  
  if (window.__app.UI && window.__app.State) {
    window.__app.UI.renderMarketPage(window.__app.State.prices, window.__app.State.exchange);
  } else {
    window.location.reload();
  }
};
`;

if (!ui.includes('promptManualPurchase')) {
  fs.appendFileSync('js/ui.js', '\n' + MANUAL_PURCHASE_FUNC);
  console.log('Added promptManualPurchase');
}
