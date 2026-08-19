const fs = require('fs');
const path = require('path');

const file = 'Fibbo_Sniper_v28.5_H2.mq5';
let code = fs.readFileSync(file, 'utf8');

console.log('=== CORRIGINDO SINCRONIA RIGOROSA: LINHA CONTÍNUA E STATUS ARMADO SÓ COM 100% DOS REQUISITOS ===\n');

// 1. DESENHAR LINHAS CHART
const oldDrawAllOk = `   bool fr_all_ok = (!glb_blocked && InpUseFR && g_CachedFrCdOk && (g_CachedFRTop > 0 && g_CachedFRFundo > 0));
   bool fb_all_ok = (!glb_blocked && IsFiboActiveForSymbol() && g_CachedFiboCdOk && (g_CachedFiboH > 0 && g_CachedFiboLow > 0 && g_CachedFiboATR > 0));`;

const newDrawAllOk = `   bool fr_all_ok = (!glb_blocked && InpUseFR && g_CachedFrCdOk && (g_CachedFRTop > 0 && g_CachedFRFundo > 0));
   
   // [SINCRONIA TOTAL] Fibo só é all_ok se ADX (Força H4) e Tendência H4 estiverem rigorosamente válidos
   bool fb_adx_ok   = p_UsePassaFiltroADXFibo ? (g_H4_ADX >= cfg_ADX_MinLevel) : true;
   int  t_h4_draw   = ComputeTrendDir(hShortEMA_H4, hEMA_H4);
   bool fb_trend_ok = (!p_UseTrendDirFibo || t_h4_draw == 1 || t_h4_draw == -1);
   bool fb_all_ok   = (!glb_blocked && IsFiboActiveForSymbol() && g_CachedFiboCdOk && 
                       (g_CachedFiboH > 0 && g_CachedFiboLow > 0 && g_CachedFiboATR > 0) &&
                       fb_adx_ok && fb_trend_ok);`;

if (code.includes(oldDrawAllOk)) {
  code = code.replace(oldDrawAllOk, newDrawAllOk);
  console.log('✔ [1/2] Desenho de Linhas sincronizado com ADX e Tendência!');
} else {
  console.log('❌ [1/2] oldDrawAllOk não encontrado');
}

// 2. ATUALIZAR PAINEL HUD (CARD FIBO)
const oldPanelAllOk = `      bool fb_all_ok = (!glb_blocked && IsFiboActiveForSymbol() && fb_cd && (g_CachedFiboH > 0 && g_CachedFiboLow > 0 && g_CachedFiboATR > 0));
      bool is_ready_fb = fb_all_ok && (g_ReadyFibo || (in_rd_fb && fb_line_solid));`;

const newPanelAllOk = `      // [SINCRONIA TOTAL] Card Fibo só fica ARMADO se 100% dos requisitos (ADX, Tendência, Confluência) estiverem válidos
      bool fb_adx_chk   = p_UsePassaFiltroADXFibo ? (g_H4_ADX >= cfg_ADX_MinLevel) : true;
      int  t_h4_card    = ComputeTrendDir(hShortEMA_H4, hEMA_H4);
      bool fb_trend_chk = (!p_UseTrendDirFibo || t_h4_card == 1 || t_h4_card == -1);
      bool fb_confl_chk = (g_ModoConfluencia > 0) ? (t_h4_card == 1 ? g_MG_BuyAllowed : (t_h4_card == -1 ? g_MG_SellAllowed : (g_MG_BuyAllowed || g_MG_SellAllowed))) : true;
      
      bool fb_all_ok = (!glb_blocked && IsFiboActiveForSymbol() && fb_cd && 
                        (g_CachedFiboH > 0 && g_CachedFiboLow > 0 && g_CachedFiboATR > 0) &&
                        fb_adx_chk && fb_trend_chk && fb_confl_chk);
      bool is_ready_fb = fb_all_ok && (g_ReadyFibo || (in_rd_fb && fb_line_solid));`;

if (code.includes(oldPanelAllOk)) {
  code = code.replace(oldPanelAllOk, newPanelAllOk);
  console.log('✔ [2/2] Card FIBO do Painel HUD sincronizado rigorosamente com ADX, Tendência e Confluência!');
} else {
  console.log('❌ [2/2] oldPanelAllOk não encontrado');
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
