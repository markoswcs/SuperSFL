/**
 * Estimated production costs for Sunflower Land items.
 * These are base SFL costs (e.g. seeds for crops, tools for resources).
 */

const BASE_COSTS = {
  // Crops
  'Sunflower': 0.0001,
  'Potato': 0.0002,
  'Pumpkin': 0.0004,
  'Carrot': 0.0008,
  'Cabbage': 0.0015,
  'Beetroot': 0.002,
  'Cauliflower': 0.003,
  'Parsnip': 0.005,
  'Eggplant': 0.008,
  'Corn': 0.01,
  'Radish': 0.015,
  'Wheat': 0.02,
  'Kale': 0.03,

  // Resources (Cost of Tool / Average Yield)
  // Axe = 0.0625 SFL (yields ~2)
  'Wood': 0.03125,
  // Pickaxe = 0.1875 SFL (yields ~2)
  'Stone': 0.09375,
  // Stone Pickaxe = 0.625 SFL (yields ~2)
  'Iron': 0.3125,
  // Iron Pickaxe = 2.5 SFL (yields ~2)
  'Gold': 1.25,
  // Gold Pickaxe
  'Crimstone': 2.5,
  'Sunstone': 3.5,
  
  // Others
  'Egg': 0.02,
  'Honey': 0.005,
};

/**
 * Get the estimated production cost of an item.
 * If the user has a manually registered purchase, we could blend it,
 * but for now we rely on base production cost.
 */
function getEstimatedCost(itemName) {
  // Return the base cost, or 0 if unknown
  return BASE_COSTS[itemName] || 0;
}

window.__app = window.__app || {};
window.__app.getEstimatedCost = getEstimatedCost;
