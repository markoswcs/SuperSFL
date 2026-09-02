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
  'Wood': 0.03125,
  'Stone': 0.09375,
  'Iron': 0.3125,
  'Gold': 1.25,
  'Crimstone': 2.5,
  'Sunstone': 3.5,
  
  // Others
  'Egg': 0.02,
  'Honey': 0.005,
};

function getEstimatedCost(itemName) {
  return BASE_COSTS[itemName] || 0;
}

window.__app = window.__app || {};
window.__app.getEstimatedCost = getEstimatedCost;
