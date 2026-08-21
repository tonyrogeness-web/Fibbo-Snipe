const fs = require('fs');
const path = require('path');

console.log('=== SINCRONIZANDO PAINEL E DESENHO COM ROTEAMENTO E EXCLUSÃO MÚTUA ===\n');

const mq5Path = path.join(__dirname, 'Fibbo_Sniper_v28.5_H2.mq5');
let code = fs.readFileSync(mq5Path, 'utf8');

// 1. Linha 1981 em DesenharLinhasChart
const oldDraw = 'bool fr_all_ok = (!glb_blocked && InpUseFR && g_CachedFrCdOk && (g_CachedFRTop > 0 && g_CachedFRFundo > 0));';
const newDraw = 'bool fr_all_ok = (!glb_blocked && IsFRAllowedForCurrentSymbol() && !TemPosicaoAbertaNoAtivoComPrefixo("Fluxo_") && g_CachedFrCdOk && (g_CachedFRTop > 0 && g_CachedFRFundo > 0));';

if (code.includes(oldDraw)) {
  code = code.replace(oldDraw, newDraw);
  console.log('✔ DesenharLinhasChart atualizado com IsFRAllowedForCurrentSymbol() e trava anti-Fluxo.');
}

// 2. Linhas 2403 a 2436 em AtualizarPainel
const oldPanelBlock = `   bool u_r2=InpUseFR, c_c2=g_CachedFrCdOk, c_l2=(g_CachedFRTop>0&&g_CachedFRFundo>0);
   bool dir_s_ok2,dir_b_ok2; GetFR_DirecaoOk(g_CachedMedDir,g_CachedRSI,dir_s_ok2,dir_b_ok2);
   double ask_curr_main = SymbolInfoDouble(_Symbol, SYMBOL_ASK), bid_curr_main = SymbolInfoDouble(_Symbol, SYMBOL_BID);
   bool perto_topo_main = (g_CachedFRTop > 0 && MathAbs(g_CachedFRTop - ask_curr_main) < MathAbs(bid_curr_main - g_CachedFRFundo));
   bool confl_mg_main_ok = (g_ModoConfluencia > 0) ? (perto_topo_main ? g_MG_SellAllowed : g_MG_BuyAllowed) : true;
   bool dir_lado_main_ok = perto_topo_main ? dir_s_ok2 : dir_b_ok2;

   bool super_bloq_main = (InpFR_BlockAgainstSuperTrend && g_H4_ADX >= InpFR_SuperTrend_ADX && ((perto_topo_main && ask_curr_main > g_MG_EMA200 && g_MG_EMA200 > 0) || (!perto_topo_main && bid_curr_main < g_MG_EMA200 && g_MG_EMA200 > 0)));

   bool fr_all_ok=(!glb_blocked && !super_bloq_main && u_r2 && c_c2 && c_l2 && dir_lado_main_ok && confl_mg_main_ok);

   string s_fr_req = ""; color c_fr_req_clr = C'0,230,118';
   if(fr_all_ok) {
      s_fr_req = "Requisitos: ✔ 100% OK (PRONTO)"; c_fr_req_clr = C'0,230,118'; // Verde Neon
   } else {
      c_fr_req_clr = C'255,107,107'; // [OPÇÃO 1: SALMÃO CLARO] Alto contraste e leitura perfeita no fundo dark
      if(!u_r2) s_fr_req = "Requisitos: ✖ Estratégia Desativada";
      else if(d_pau) s_fr_req = "Requisitos: ✖ Robô Pausado";
      else if(d_sess) s_fr_req = "Requisitos: ✖ Fora da Sessão (10-22h)";
      else if(d_spr2) s_fr_req = StringFormat("Requisitos: ✖ Spread Alto (%d/%d pts)", cur_spread, max_spread);
      else if(d_not2) s_fr_req = "Requisitos: ✖ Bloqueio por Notícia";
      else if(d_osc2) s_fr_req = "Requisitos: ✖ Mercado Parado";
      else if(d_liq2) s_fr_req = "Requisitos: ✖ Baixa Liquidez";
      else if(d_cax2) s_fr_req = "Requisitos: ✖ Caixote / Consolidação";
      else if(d_mpos) s_fr_req = "Requisitos: ✖ Limite Vagas Cheio";
      else if(!c_c2)  s_fr_req = "Requisitos: ✖ Cooldown L1 Ativo";
      else if(!c_l2)  s_fr_req = "Requisitos: ✖ Aguardando Mapeamento";
      else if(super_bloq_main)
         s_fr_req = StringFormat("Requisitos: ✖ Super-Tendência (%s)", perto_topo_main ? "Alta ADX>30" : "Baixa ADX>30");
      else if(!confl_mg_main_ok) s_fr_req = StringFormat("Requisitos: ✖ MktGlance Bloq. (%s)", perto_topo_main ? "Exige Venda" : "Exige Compra");
      else if(!dir_lado_main_ok) s_fr_req = StringFormat("Requisitos: ✖ Direção %s Bloq.", perto_topo_main ? "Venda" : "Compra");
      else if(d_gblk || d_blk) s_fr_req = "Requisitos: ✖ Trava Global/Moeda";
      else s_fr_req = "Requisitos: ✖ Faltam Requisitos";
   }`;

const newPanelBlock = `   bool u_r2=IsFRAllowedForCurrentSymbol(), c_c2=g_CachedFrCdOk, c_l2=(g_CachedFRTop>0&&g_CachedFRFundo>0);
   bool tem_flx_pos = TemPosicaoAbertaNoAtivoComPrefixo("Fluxo_");
   bool dir_s_ok2,dir_b_ok2; GetFR_DirecaoOk(g_CachedMedDir,g_CachedRSI,dir_s_ok2,dir_b_ok2);
   double ask_curr_main = SymbolInfoDouble(_Symbol, SYMBOL_ASK), bid_curr_main = SymbolInfoDouble(_Symbol, SYMBOL_BID);
   bool perto_topo_main = (g_CachedFRTop > 0 && MathAbs(g_CachedFRTop - ask_curr_main) < MathAbs(bid_curr_main - g_CachedFRFundo));
   bool confl_mg_main_ok = (g_ModoConfluencia > 0) ? (perto_topo_main ? g_MG_SellAllowed : g_MG_BuyAllowed) : true;
   bool dir_lado_main_ok = perto_topo_main ? dir_s_ok2 : dir_b_ok2;

   bool super_bloq_main = (InpFR_BlockAgainstSuperTrend && g_H4_ADX >= InpFR_SuperTrend_ADX && ((perto_topo_main && ask_curr_main > g_MG_EMA200 && g_MG_EMA200 > 0) || (!perto_topo_main && bid_curr_main < g_MG_EMA200 && g_MG_EMA200 > 0)));

   bool fr_all_ok=(!glb_blocked && !super_bloq_main && !tem_flx_pos && u_r2 && c_c2 && c_l2 && dir_lado_main_ok && confl_mg_main_ok);

   string s_fr_req = ""; color c_fr_req_clr = C'0,230,118';
   if(fr_all_ok) {
      s_fr_req = "Requisitos: ✔ 100% OK (PRONTO)"; c_fr_req_clr = C'0,230,118'; // Verde Neon
   } else {
      c_fr_req_clr = C'255,107,107'; // [OPÇÃO 1: SALMÃO CLARO] Alto contraste e leitura perfeita no fundo dark
      if(!InpUseFR) s_fr_req = "Requisitos: ✖ Estratégia Desativada";
      else if(!u_r2) s_fr_req = "Requisitos: ✖ Bloqueado por Roteamento";
      else if(tem_flx_pos) s_fr_req = "Requisitos: ✖ Posição Fluxo Ativa";
      else if(d_pau) s_fr_req = "Requisitos: ✖ Robô Pausado";
      else if(d_sess) s_fr_req = "Requisitos: ✖ Fora da Sessão (10-22h)";
      else if(d_spr2) s_fr_req = StringFormat("Requisitos: ✖ Spread Alto (%d/%d pts)", cur_spread, max_spread);
      else if(d_not2) s_fr_req = "Requisitos: ✖ Bloqueio por Notícia";
      else if(d_osc2) s_fr_req = "Requisitos: ✖ Mercado Parado";
      else if(d_liq2) s_fr_req = "Requisitos: ✖ Baixa Liquidez";
      else if(d_cax2) s_fr_req = "Requisitos: ✖ Caixote / Consolidação";
      else if(d_mpos) s_fr_req = "Requisitos: ✖ Limite Vagas Cheio";
      else if(!c_c2)  s_fr_req = "Requisitos: ✖ Cooldown L1 Ativo";
      else if(!c_l2)  s_fr_req = "Requisitos: ✖ Aguardando Mapeamento";
      else if(super_bloq_main)
         s_fr_req = StringFormat("Requisitos: ✖ Super-Tendência (%s)", perto_topo_main ? "Alta ADX>30" : "Baixa ADX>30");
      else if(!confl_mg_main_ok) s_fr_req = StringFormat("Requisitos: ✖ MktGlance Bloq. (%s)", perto_topo_main ? "Exige Venda" : "Exige Compra");
      else if(!dir_lado_main_ok) s_fr_req = StringFormat("Requisitos: ✖ Direção %s Bloq.", perto_topo_main ? "Venda" : "Compra");
      else if(d_gblk || d_blk) s_fr_req = "Requisitos: ✖ Trava Global/Moeda";
      else s_fr_req = "Requisitos: ✖ Faltam Requisitos";
   }`;

if (code.includes(oldPanelBlock)) {
  code = code.replace(oldPanelBlock, newPanelBlock);
  console.log('✔ AtualizarPainel atualizado com IsFRAllowedForCurrentSymbol() e mensagens de status precisas.');
}

// 3. Atualizar s_fr2 no Card FR
const oldFrStatus = `string s_fr2   = !InpUseFR ? "OFF" : (is_ready_fr ? (g_ReadyFR ? "⚡ DISPARO IMEDIATO!" : ("ARMADO! (Fecha em " + s_next + ")")) : "Prox.Vela");`;
const newFrStatus = `string s_fr2   = !InpUseFR ? "OFF" : (!u_r2 ? "OFF (Roteamento)" : (tem_flx_pos ? "BLOQ (Fluxo)" : (is_ready_fr ? (g_ReadyFR ? "⚡ DISPARO IMEDIATO!" : ("ARMADO! (Fecha em " + s_next + ")")) : "Prox.Vela")));`;

if (code.includes(oldFrStatus)) {
  code = code.replace(oldFrStatus, newFrStatus);
  console.log('✔ s_fr2 atualizado com estados "OFF (Roteamento)" e "BLOQ (Fluxo)".');
}

fs.writeFileSync(mq5Path, code, 'utf8');
console.log('✔ Sincronização concluída no arquivo .mq5!');
