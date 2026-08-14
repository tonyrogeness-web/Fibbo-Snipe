const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, 'Fibbo_Sniper_v28.5_H2.mq5');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Adicionar declaração de g_ReadyFR_Sell e g_ReadyFR_Buy
if (!content.includes('bool g_ReadyFR_Sell = false, g_ReadyFR_Buy = false;')) {
  content = content.replace(
    'bool g_ReadyFluxo = false, g_ReadyFR = false, g_ReadyFibo = false',
    'bool g_ReadyFluxo = false, g_ReadyFR = false, g_ReadyFR_Sell = false, g_ReadyFR_Buy = false, g_ReadyFibo = false'
  );
  console.log('✔ Globais g_ReadyFR_Sell e g_ReadyFR_Buy adicionadas!');
}

// 2. Atualizar cálculo de g_ReadyFR no Motor FR L1
const oldFRReadyCalc = `g_ReadyFR = (confl_s_ok && tc_sell && (m_sell || (is_lat && d_s_ok && r_s_ok))) || (confl_b_ok && tc_buy && (m_buy || (is_lat && d_b_ok && r_b_ok)));`;
const newFRReadyCalc = `g_ReadyFR_Sell = (confl_s_ok && tc_sell && (m_sell || (is_lat && d_s_ok && r_s_ok)));\n          g_ReadyFR_Buy  = (confl_b_ok && tc_buy  && (m_buy  || (is_lat && d_b_ok && r_b_ok)));\n          g_ReadyFR = (g_ReadyFR_Sell || g_ReadyFR_Buy);`;

if (content.includes(oldFRReadyCalc)) {
  content = content.replace(oldFRReadyCalc, newFRReadyCalc);
  console.log('✔ Cálculo separado g_ReadyFR_Sell / g_ReadyFR_Buy aplicado!');
}

// 3. Atualizar DesenharLinhasChart() para usar g_ReadyFR_Sell e g_ReadyFR_Buy especificamente
const oldHLCalc = `bool fr_top_hl = (fr_dir_sell && (g_ReadyFR || (MathAbs(g_CachedFRTop-ask)/_Point <= zone_pts)));
   bool fr_bot_hl = (fr_dir_buy  && (g_ReadyFR || (MathAbs(bid-g_CachedFRFundo)/_Point <= zone_pts)));`;

const newHLCalc = `bool fr_top_hl = (fr_dir_sell && (g_ReadyFR_Sell || (MathAbs(g_CachedFRTop-ask)/_Point <= zone_pts)));
   bool fr_bot_hl = (fr_dir_buy  && (g_ReadyFR_Buy  || (MathAbs(bid-g_CachedFRFundo)/_Point <= zone_pts)));`;

if (content.includes(oldHLCalc)) {
  content = content.replace(oldHLCalc, newHLCalc);
  console.log('✔ Destaque das Linhas (fr_top_hl / fr_bot_hl) sincronizado por lado!');
}

// 4. Atualizar o Card de Diagnóstico para avaliar os requisitos do nível mais próximo (Topo vs Fundo)
const oldDiagFRCheck = `       bool u_r=InpUseFR, c_c=g_CachedFrCdOk, c_l=(g_CachedFRTop>0&&g_CachedFRFundo>0);
       bool dir_s_ok,dir_b_ok; GetFR_DirecaoOk(g_CachedMedDir,g_CachedRSI,dir_s_ok,dir_b_ok);
       bool dir_algum=(dir_s_ok||dir_b_ok); bool c_dr=InpFR_Direct_Entries;
       DROW_DYN("Uso Estratégia",u_r?"sim":"OFF",!u_r)DROW_DYN("Cooldown L1",c_c?"livre":"AGUARDAR",!c_c)DROW_DYN("Mapeamento L1",c_l?"sim":"NÃO",!c_l)DROW_DYN("Dir. L1 OK",dir_algum?"sim":"NEUTRO BLOQ.",!dir_algum)DROW_DYN("FR Direct",c_dr?"ativo":"off",false)`;

const newDiagFRCheck = `       bool u_r=InpUseFR, c_c=g_CachedFrCdOk, c_l=(g_CachedFRTop>0&&g_CachedFRFundo>0);
       bool dir_s_ok,dir_b_ok; GetFR_DirecaoOk(g_CachedMedDir,g_CachedRSI,dir_s_ok,dir_b_ok);
       double ask_curr = SymbolInfoDouble(_Symbol, SYMBOL_ASK), bid_curr = SymbolInfoDouble(_Symbol, SYMBOL_BID);
       bool perto_topo = (g_CachedFRTop > 0 && MathAbs(g_CachedFRTop - ask_curr) < MathAbs(bid_curr - g_CachedFRFundo));
       bool dir_correta = perto_topo ? (dir_s_ok && g_MG_SellAllowed) : (dir_b_ok && g_MG_BuyAllowed);
       bool c_dr=InpFR_Direct_Entries;
       DROW_DYN("Uso Estratégia",u_r?"sim":"OFF",!u_r)DROW_DYN("Cooldown L1",c_c?"livre":"AGUARDAR",!c_c)DROW_DYN("Mapeamento L1",c_l?"sim":"NÃO",!c_l)DROW_DYN("Dir. L1 OK",dir_correta?"sim":"BLOQ. DIREÇÃO",!dir_correta)DROW_DYN("FR Direct",c_dr?"ativo":"off",false)`;

if (content.includes(oldDiagFRCheck)) {
  content = content.replace(oldDiagFRCheck, newDiagFRCheck);
  console.log('✔ Card de Diagnóstico sincronizado com a posição do preço (Topo vs Fundo)!');
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('\n🎉 SINCRONIA VISUAL DE LINHAS E PAINEL CONCLUÍDA COM SUCESSO!');
