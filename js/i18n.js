/**
 * i18n.js — Sistema de tradução Vanilla JS
 */

import Storage from './storage.js?v=28';

const translations = {
  pt: {
    // Navigation
    nav_home: 'Início',
    nav_farm: 'Fazenda',
    nav_market: 'Mercado',
    nav_tools: 'Ferramentas',
    nav_alerts: 'Alertas',
    nav_settings: 'Ajustes',

    // Missing
    farm_enter_id: 'Insira o ID da sua Fazenda',
    farm_enter_id_sub: 'Digite o ID acima e clique na lupa<br>para ver os dados.',
    api_warning: 'Dados Parciais Exibidos',
    api_warning_sub: 'Você precisa rodar o proxy local (janela start.bat) E inserir a Chave de API nos Ajustes para ver plantações, animais e inventário.',
    farm_magic_gems: 'Gemas Mágicas',
    farm_season_marks: 'Marcas da Temporada',
    farm_tax_free_sfl: 'SFL Livre de Taxa',
    farm_charm: 'Encanto da Facção',
    farm_cheer: 'Pontos de Facção',
    farm_land_level: 'Nível da Ilha',
    farm_skills_title: 'Habilidades Ativas do Fazendeiro',
    farm_missing_key: 'Chave da API Ausente',

    // Home
    home_farm_summary: 'Resumo da Fazenda',
    home_up_to_date: 'Atualizado',
    home_ready: 'pronto!',
    home_balance: 'Saldo',
    home_coins: 'Moedas',
    home_in_game: 'no jogo',
    home_crops: 'Plantações',
    home_growing: 'crescendo',
    home_active_plots: 'lotes ativos',
    home_animals: 'Animais',
    home_need_attn: 'atenção',
    home_ok: 'ok',
    home_total: 'total',
    home_upcoming: 'Próximos Eventos',
    home_no_farm: 'Nenhuma Fazenda Carregada',
    home_no_farm_sub: 'Insira sua Farm ID na aba Fazenda<br>para ver seu painel.',
    home_gems: 'Gemas',
    home_marks: 'Marcas',

    // Farm
    farm_id_placeholder: 'Digite a Farm ID (ex: 165039)',
    farm_load: 'Carregar',
    farm_partial_title: 'Modo de Dados Parciais',
    farm_partial_desc: 'Adicione sua Community API Key nos <strong>Ajustes</strong> para ver plantações, animais e dados detalhados.',
    farm_level: 'Nível',
    farm_crops: 'Plantações',
    farm_fruits: 'Frutas',
    farm_animals: 'Animais',
    farm_trees_rocks: 'Árvores & Pedras',
    farm_buildings: 'Construções',
    farm_greenhouse: 'Estufa',
    farm_inventory: 'Inventário',
    farm_chores: 'Tarefas Diárias',
    farm_qty: 'Qtd',
    farm_timer_ready: 'PRONTO',
    farm_timer_collect: 'COLETAR',
    farm_timer_hungry: 'FOME!',
    farm_timer_available: 'Disponível',

    // Market
    market_search: 'Buscar recursos...',
    market_all: 'Todos',
    market_crops_seeds: 'Plantações & Sementes',
    market_resources: 'Recursos',
    market_fish: 'Peixes',
    market_floor_price: 'Preço Mínimo',
    market_island: 'Ilha',
    market_tax: 'Taxa',
    market_qty_sell: 'Quantidade para vender',
    market_gross: 'Receita Bruta',
    market_net: 'Lucro Líquido',

    // Alerts
    alerts_history: 'Histórico de Alertas',
    alerts_no_history: 'Nenhum alerta disparado ainda.',

    // Settings
    settings_saved_farms: 'Fazendas Salvas',
    settings_no_farms: 'Nenhuma fazenda salva ainda.',
    settings_remove: 'Remover',
    settings_market: 'Configurações do Mercado',
    settings_island: 'Tipo de Ilha',
    settings_island_sub: 'Afeta a taxa do mercado',
    settings_island_basic: 'Básica (Sem Mercado)',
    settings_island_petal: 'Petal (50%)',
    settings_island_desert: 'Desert (20%)',
    settings_island_volcano: 'Volcano (15%)',
    settings_vip: '👑 Status VIP',
    settings_vip_sub: 'Reduz a taxa em 50%',
    settings_shrine: '⛩ Trading Shrine',
    settings_shrine_sub: 'Reduz adicionais de 2.5%',
    settings_price_alerts: 'Alertas de Preço SFL',
    settings_alert_high: 'Alerta de Alta (USD)',
    settings_alert_high_sub: 'Notificar quando SFL subir acima disso',
    settings_alert_low: 'Alerta de Baixa (USD)',
    settings_alert_low_sub: 'Notificar quando SFL cair abaixo disso',
    settings_refresh: 'Atualização Automática',
    settings_refresh_interval: 'Intervalo de Atualização',
    settings_refresh_sub: 'Com que frequência sincronizar dados',
    settings_api_key: '🔑 Community API Key',
    settings_api_key_sub: 'Habilita dados completos (plantações, animais).<br>Pegue a sua no jogo: <strong>Settings › Developer Options › API Key</strong>',
    settings_save: 'Salvar Configurações',
    settings_language: 'Language / Idioma',

    // Notifications configuration
    notif_title: 'Notificações Web Push',
    notif_desc: 'Receba alertas quando as plantações estiverem prontas, animais com fome ou preços mudarem.',
    notif_enable: 'Ativar Notificações',
    notif_enable_desc: 'Permita notificações no navegador para receber alertas mesmo quando o app estiver em segundo plano.',
    notif_status_granted: 'Notificações Ativas',
    notif_status_granted_desc: 'Você receberá os alertas da fazenda.',
    notif_status_denied: 'Notificações Bloqueadas',
    notif_status_default: 'Notificações Desativadas',
    notif_types: 'Tipos de Alerta',
      
    // Alerts
    alerts_empty_title: 'Nenhum Alerta Ainda',
    alerts_empty_sub: 'Ative as notificações e carregue uma fazenda<br>para receber os alertas.',
    alert_master: 'Controle Principal',
    alert_master_sub: 'Todas Notificações',
    alert_master_desc: 'Ativar/desativar todos os alertas de uma vez',
      
    crops_ready: 'Plantações Prontas',
    fruits_ready: 'Frutas Prontas',
    animals_hungry: 'Animais com Fome',
    animals_produce: 'Coletar Produtos',
    trees_ready: 'Árvores Prontas',
    rocks_ready: 'Pedras Prontas',
    cooking_ready: 'Cozinha Pronta',
    composting_ready: 'Compostagem Pronta',
    beehive_ready: 'Mel Pronto',
    oil_ready: 'Óleo Pronto',
    flower_ready: 'Flores Prontas',
    greenhouse_ready: 'Estufa Pronta',
    crop_machine_ready: 'Máquina de Plantio',
    sfl_price_alert: 'Alerta de Preço SFL',
  }
};

let currentLang = 'pt';

export function initI18n() {
  currentLang = 'pt';
  updateDOM();
}

export function setLanguage(lang) {
  if (translations[lang]) {
    currentLang = lang;
    Storage.saveSettings({ language: lang });
    updateDOM();
    // Dispatch event so UI re-renders JS-generated parts
    document.dispatchEvent(new Event('language-changed'));
  }
}

export function t(key) {
  return translations[currentLang]?.[key] || key || key;
}

export function updateDOM() {
  document.documentElement.lang = currentLang;
  const elements = document.querySelectorAll('[data-i18n]');
  elements.forEach(el => {
    const key = el.getAttribute('data-i18n');
    const text = t(key);
    if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
      el.placeholder = text;
    } else {
      // Keep any internal HTML (like icons) if needed, but for simple elements just textContent
      // If we need to preserve SVG icons, we shouldn't use data-i18n on the container, but on a span inside.
      el.innerHTML = text; 
    }
  });
}

export default {
  initI18n,
  setLanguage,
  t,
  updateDOM,
  getCurrentLang: () => currentLang
};
