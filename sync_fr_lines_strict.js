const fs = require('fs');

const file = 'Fibbo_Sniper_v28.5_H2.mq5';
let code = fs.readFileSync(file, 'utf8');

console.log('=== SINCRONIZANDO LINHAS E STATUS DO FALSO ROMPIMENTO COM CONFLUÊNCIA E REQUISITOS ===\n');

// 1. DESENHAR LINHAS CHART FR
const oldFrDraw = `   // --- FR (Falso Rompimento) ---
   bool fr_dir_sell = true, fr_dir_buy = true;
   GetFR_DirecaoOk(g_CachedMedDir, g_CachedRSI, fr_dir_sell, fr_dir_buy);
   if(g_ModoConfluencia > 0) {
      if(!g_MG_SellAllowed) fr_dir_sell = false;
      if(!g_MG_BuyAllowed) fr_dir_buy = false;
   }

   // Linha só vira CONTÍNUA (SOLID) se TODOS os requisitos estiverem OK (fr_all_ok == true)
   bool fr_top_hl = fr_all_ok && (fr_dir_sell && (g_ReadyFR_Sell || (MathAbs(g_CachedFRTop-ask)/_Point <= zone_pts && g_MG_SellAllowed)));
   bool fr_bot_hl = fr_all_ok && (fr_dir_buy  && (g_ReadyFR_Buy  || (MathAbs(bid-g_CachedFRFundo)/_Point <= zone_pts && g_MG_BuyAllowed)));`;

const newFrDraw = `   // --- FR (Falso Rompimento) ---
   bool fr_dir_sell = true, fr_dir_buy = true;
   GetFR_DirecaoOk(g_CachedMedDir, g_CachedRSI, fr_dir_sell, fr_dir_buy);
   bool fr_sell_confl_ok = (g_ModoConfluencia > 0) ? g_MG_SellAllowed : true;
   bool fr_buy_confl_ok  = (g_ModoConfluencia > 0) ? g_MG_BuyAllowed : true;
   if(!fr_sell_confl_ok) fr_dir_sell = false;
   if(!fr_buy_confl_ok)  fr_dir_buy  = false;

   // Linha só vira CONTÍNUA (SOLID) se TODOS os requisitos estiverem rigorosamente válidos (Confluência, Direção, Filtros Globais)
   bool fr_top_hl = fr_all_ok && fr_dir_sell && fr_sell_confl_ok && 
                    (g_ReadyFR_Sell || (MathAbs(g_CachedFRTop-ask)/_Point <= zone_pts));
   bool fr_bot_hl = fr_all_ok && fr_dir_buy && fr_buy_confl_ok && 
                    (g_ReadyFR_Buy  || (MathAbs(bid-g_CachedFRFundo)/_Point <= zone_pts));`;

if (code.includes(oldFrDraw)) {
  code = code.replace(oldFrDraw, newFrDraw);
  console.log('✔ [1/2] Desenho de linhas do FR sincronizado com Confluência!');
} else {
  console.log('❌ [1/2] oldFrDraw não encontrado');
}

// 2. ATUALIZAR PAINEL HUD (CARD FR)
const oldFrPanel = `   // --- VALIDAÇÃO DE LINHA CONTÍNUA E ARMADO REAL DO FR ---
   bool fr_dir_sell_chk = true, fr_dir_buy_chk = true;
   GetFR_DirecaoOk(g_CachedMedDir, g_CachedRSI, fr_dir_sell_chk, fr_dir_buy_chk);
   if(g_ModoConfluencia > 0) {
      if(!g_MG_SellAllowed) fr_dir_sell_chk = false;
      if(!g_MG_BuyAllowed)  fr_dir_buy_chk  = false;
   }
   bool fr_line_solid = (fr_dir_sell_chk && (g_ReadyFR_Sell || (MathAbs(g_CachedFRTop-ask_p)/_Point <= zone_p && g_MG_SellAllowed))) ||
                        (fr_dir_buy_chk  && (g_ReadyFR_Buy  || (MathAbs(bid_p-g_CachedFRFundo)/_Point <= zone_p && g_MG_BuyAllowed)));
   bool is_ready_fr = InpUseFR && fr_all_ok && (g_ReadyFR || (in_rd_fr && fr_line_solid));`;

const newFrPanel = `   // --- VALIDAÇÃO DE LINHA CONTÍNUA E ARMADO REAL DO FR ---
   bool fr_dir_sell_chk = true, fr_dir_buy_chk = true;
   GetFR_DirecaoOk(g_CachedMedDir, g_CachedRSI, fr_dir_sell_chk, fr_dir_buy_chk);
   bool fr_sell_confl_chk = (g_ModoConfluencia > 0) ? g_MG_SellAllowed : true;
   bool fr_buy_confl_chk  = (g_ModoConfluencia > 0) ? g_MG_BuyAllowed : true;
   if(!fr_sell_confl_chk) fr_dir_sell_chk = false;
   if(!fr_buy_confl_chk)  fr_dir_buy_chk  = false;

   bool fr_line_solid = (fr_dir_sell_chk && fr_sell_confl_chk && (g_ReadyFR_Sell || (MathAbs(g_CachedFRTop-ask_p)/_Point <= zone_p))) ||
                        (fr_dir_buy_chk  && fr_buy_confl_chk  && (g_ReadyFR_Buy  || (MathAbs(bid_p-g_CachedFRFundo)/_Point <= zone_p)));
   bool is_ready_fr = InpUseFR && fr_all_ok && (fr_dir_sell_chk || fr_dir_buy_chk) && (g_ReadyFR || (in_rd_fr && fr_line_solid));`;

if (code.includes(oldFrPanel)) {
  code = code.replace(oldFrPanel, newFrPanel);
  console.log('✔ [2/2] Card FR do Painel HUD sincronizado rigorosamente com Confluência e Direção!');
} else {
  console.log('❌ [2/2] oldFrPanel não encontrado');
}

fs.writeFileSync(file, code);

// Sincroniza com as pastas de Experts do MT5
const expertPaths = [
  'C:\\Users\\tony\\AppData\\Roaming\\MetaQuotes\\Terminal\\59C07D676775FCCF79E223EC24AB0D86\\MQL5\\Experts\\Fibbo_Sniper_v28.5_H2.mq5',
  'C:\\Users\\tony\\AppData\\Roaming\\MetaQuotes\\Terminal\\10CE948A1DFC9A8C27E56E827008EBD4\\MQL5\\Experts\\Fibbo_Sniper_v28.5_H2.mq5'
];
expertPaths.forEach(p => {
  try {
    fs.writeFileSync(p, fs.readFileSync(file));
    console.log('✔ .MQ5 sincronizado em:', p);
  } catch (err) {
    console.log('Erro ao salvar em:', p, err.message);
  }
});

console.log('\n✔ ' + file + ' salvo e sincronizado com sucesso!');
