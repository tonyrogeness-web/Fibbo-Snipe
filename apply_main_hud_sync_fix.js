const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, 'Fibbo_Sniper_v28.5_H2.mq5');
let content = fs.readFileSync(filePath, 'utf8').replace(/\r\n/g, '\n');

const oldBlock = `   bool u_r2=InpUseFR, c_c2=g_CachedFrCdOk, c_l2=(g_CachedFRTop>0&&g_CachedFRFundo>0);
   bool dir_s_ok2,dir_b_ok2; GetFR_DirecaoOk(g_CachedMedDir,g_CachedRSI,dir_s_ok2,dir_b_ok2);
   bool dir_algum2=(dir_s_ok2||dir_b_ok2);
   bool fr_all_ok=(!glb_blocked && u_r2 && c_c2 && c_l2 && dir_algum2);

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
      else if(!dir_algum2) s_fr_req = "Requisitos: ✖ Direção L1 Neutra/Bloq.";
      else if(d_gblk || d_blk) s_fr_req = "Requisitos: ✖ Trava Global/Moeda";
      else s_fr_req = "Requisitos: ✖ Faltam Requisitos";
   }`;

const newBlock = `   bool u_r2=InpUseFR, c_c2=g_CachedFrCdOk, c_l2=(g_CachedFRTop>0&&g_CachedFRFundo>0);
   bool dir_s_ok2,dir_b_ok2; GetFR_DirecaoOk(g_CachedMedDir,g_CachedRSI,dir_s_ok2,dir_b_ok2);
   double ask_curr_main = SymbolInfoDouble(_Symbol, SYMBOL_ASK), bid_curr_main = SymbolInfoDouble(_Symbol, SYMBOL_BID);
   bool perto_topo_main = (g_CachedFRTop > 0 && MathAbs(g_CachedFRTop - ask_curr_main) < MathAbs(bid_curr_main - g_CachedFRFundo));
   bool confl_mg_main_ok = (g_ModoConfluencia > 0) ? (perto_topo_main ? g_MG_SellAllowed : g_MG_BuyAllowed) : true;
   bool dir_lado_main_ok = perto_topo_main ? dir_s_ok2 : dir_b_ok2;

   bool fr_all_ok=(!glb_blocked && u_r2 && c_c2 && c_l2 && dir_lado_main_ok && confl_mg_main_ok);

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
      else if(!confl_mg_main_ok) s_fr_req = StringFormat("Requisitos: ✖ MktGlance Bloq. (%s)", perto_topo_main ? "Exige Venda" : "Exige Compra");
      else if(!dir_lado_main_ok) s_fr_req = StringFormat("Requisitos: ✖ Direção %s Bloq.", perto_topo_main ? "Venda" : "Compra");
      else if(d_gblk || d_blk) s_fr_req = "Requisitos: ✖ Trava Global/Moeda";
      else s_fr_req = "Requisitos: ✖ Faltam Requisitos";
   }`;

if (content.includes(oldBlock)) {
  content = content.replace(oldBlock, newBlock);
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('SUCCESS: Main HUD Strategy Status synchronized with proximity and MarketGlance!');
} else {
  console.log('FAILED TO MATCH OLD BLOCK.');
}
