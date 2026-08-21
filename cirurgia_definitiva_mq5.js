const fs = require('fs');
const path = require('path');

console.log('=== REALIZANDO CIRURGIA DEFINITIVA NO CÓDIGO FONTE ===\n');

const mq5Path = path.join(__dirname, 'Fibbo_Sniper_v28.5_H2.mq5');
let content = fs.readFileSync(mq5Path, 'utf8');

// 1. Linhas do FR em DesenharLinhasChart: NUNCA desenhar FR em pares de Fluxo (XAUUSD, GBPUSD, GBPJPY)
const oldDrawFR = `   if(InpUseFR && g_CachedFRTop > 0) {
      DrawVisualLine("FR_Topo",  g_CachedFRTop,   clr_fr_muted, clr_fr_active, "▼", "[FR " + tf_fr_str + "] Topo",  fr_show_top, fr_top_hl);
      DrawVisualLine("FR_Fundo", g_CachedFRFundo, clr_fr_muted, clr_fr_active, "▲", "[FR " + tf_fr_str + "] Fundo", fr_show_bot, fr_bot_hl);

      // [GATILHO LASER DINÂMICO]: Linha pontilhada verde discreto indicando o ponto de disparo quando armado
      double fr_trig_offset = (g_CachedATR > 0) ? (g_CachedATR * 0.15) : (_Point * 20.0);
      double trig_sell_p = g_CachedFRTop - fr_trig_offset;
      double trig_buy_p  = g_CachedFRFundo + fr_trig_offset;

      bool show_trig_sell = (fr_top_hl && !is_zen && draw_lines && g_FastNPosSymbol == 0);
      bool show_trig_buy  = (fr_bot_hl && !is_zen && draw_lines && g_FastNPosSymbol == 0);

      datetime c_t_l1 = iTime(_Symbol, g_TF_L1, 0);
      int sec_l1_gat = (int)((c_t_l1 + PeriodSeconds(g_TF_L1)) - TimeCurrent());
      if(sec_l1_gat < 0) sec_l1_gat = 0;
      int m_l1_gat = sec_l1_gat / 60, s_l1_gat = sec_l1_gat % 60;
      string s_gat_time = StringFormat("(Fecha em %02dm %02ds)", m_l1_gat, s_l1_gat);

      string lbl_gat_v = "⚡ GATILHO VENDA " + s_gat_time;
      string lbl_gat_c = "⚡ GATILHO COMPRA " + s_gat_time;

      color clr_trig_discreto = C'38,165,115'; // Verde suave / discreto institucional

      // VENDA: Âncora ANCHOR_LEFT_UPPER para o texto ficar ABAIXO da linha verde (longe da linha vermelha superior)
      // COMPRA: Âncora ANCHOR_LEFT_LOWER para o texto ficar ACIMA da linha verde (longe da linha vermelha inferior)
      DrawVisualLine("FR_Gat_V", trig_sell_p, clr_trig_discreto, clr_trig_discreto, lbl_gat_v, lbl_gat_v, show_trig_sell, false, ANCHOR_LEFT_UPPER);
      DrawVisualLine("FR_Gat_C", trig_buy_p,  clr_trig_discreto, clr_trig_discreto, lbl_gat_c, lbl_gat_c, show_trig_buy,  false, ANCHOR_LEFT_LOWER);
   } else {
      DrawVisualLine("FR_Topo",  0, clrNONE, clrNONE, "", "", false, false);
      DrawVisualLine("FR_Fundo", 0, clrNONE, clrNONE, "", "", false, false);
      DrawVisualLine("FR_Gat_V", 0, clrNONE, clrNONE, "", "", false, false);
      DrawVisualLine("FR_Gat_C", 0, clrNONE, clrNONE, "", "", false, false);
   }`;

const newDrawFR = `   bool show_fr_lines = IsFRAllowedForCurrentSymbol() && InpUseFR && (g_CachedFRTop > 0 && g_CachedFRFundo > 0);
   if(show_fr_lines) {
      DrawVisualLine("FR_Topo",  g_CachedFRTop,   clr_fr_muted, clr_fr_active, "▼", "[FR " + tf_fr_str + "] Topo",  fr_show_top, fr_top_hl);
      DrawVisualLine("FR_Fundo", g_CachedFRFundo, clr_fr_muted, clr_fr_active, "▲", "[FR " + tf_fr_str + "] Fundo", fr_show_bot, fr_bot_hl);

      double fr_trig_offset = (g_CachedATR > 0) ? (g_CachedATR * 0.15) : (_Point * 20.0);
      double trig_sell_p = g_CachedFRTop - fr_trig_offset;
      double trig_buy_p  = g_CachedFRFundo + fr_trig_offset;

      bool show_trig_sell = (fr_top_hl && !is_zen && draw_lines && g_FastNPosSymbol == 0);
      bool show_trig_buy  = (fr_bot_hl && !is_zen && draw_lines && g_FastNPosSymbol == 0);

      datetime c_t_l1 = iTime(_Symbol, g_TF_L1, 0);
      int sec_l1_gat = (int)((c_t_l1 + PeriodSeconds(g_TF_L1)) - TimeCurrent());
      if(sec_l1_gat < 0) sec_l1_gat = 0;
      int m_l1_gat = sec_l1_gat / 60, s_l1_gat = sec_l1_gat % 60;
      string s_gat_time = StringFormat("(Fecha em %02dm %02ds)", m_l1_gat, s_l1_gat);

      string lbl_gat_v = "⚡ GATILHO VENDA " + s_gat_time;
      string lbl_gat_c = "⚡ GATILHO COMPRA " + s_gat_time;

      color clr_trig_discreto = C'38,165,115';

      DrawVisualLine("FR_Gat_V", trig_sell_p, clr_trig_discreto, clr_trig_discreto, lbl_gat_v, lbl_gat_v, show_trig_sell, false, ANCHOR_LEFT_UPPER);
      DrawVisualLine("FR_Gat_C", trig_buy_p,  clr_trig_discreto, clr_trig_discreto, lbl_gat_c, lbl_gat_c, show_trig_buy,  false, ANCHOR_LEFT_LOWER);
   } else {
      DrawVisualLine("FR_Topo",  0, clrNONE, clrNONE, "", "", false, false);
      DrawVisualLine("FR_Fundo", 0, clrNONE, clrNONE, "", "", false, false);
      DrawVisualLine("FR_Gat_V", 0, clrNONE, clrNONE, "", "", false, false);
      DrawVisualLine("FR_Gat_C", 0, clrNONE, clrNONE, "", "", false, false);
   }`;

if (content.includes('if(InpUseFR && g_CachedFRTop > 0) {')) {
  content = content.replace(oldDrawFR, newDrawFR);
  console.log('✔ Desenho das linhas de FR corrigido!');
} else {
  console.log('⚠ oldDrawFR não encontrado idêntico.');
}

// 2. Corrigir Diagnóstico FR (Tab 1): Uso Estratégia = não quando par é de Fluxo!
const oldFRDiagLines = `   } else {
      bool u_r=InpUseFR, c_c=g_CachedFrCdOk, c_l=(g_CachedFRTop>0&&g_CachedFRFundo>0);
       bool dir_s_ok,dir_b_ok; GetFR_DirecaoOk(g_CachedMedDir,g_CachedRSI,dir_s_ok,dir_b_ok);
       double ask_c=SymbolInfoDouble(_Symbol,SYMBOL_ASK), bid_c=SymbolInfoDouble(_Symbol,SYMBOL_BID);
       bool perto_topo=(g_CachedFRTop>0 && MathAbs(g_CachedFRTop-ask_c) < MathAbs(bid_c-g_CachedFRFundo));
       bool confl_mg_ok = perto_topo ? g_MG_SellAllowed : g_MG_BuyAllowed;
       bool dir_lado_ok = perto_topo ? dir_s_ok : dir_b_ok;
       bool c_dr=InpFR_Direct_Entries;

       DROW_DYN("Uso Estratégia",u_r?"sim":"OFF",!u_r)`;

const newFRDiagLines = `   } else {
      bool is_fr_rot_ok = IsFRAllowedForCurrentSymbol();
      bool u_r = InpUseFR && is_fr_rot_ok; // No XAUUSD, GBPJPY, GBPUSD, Uso da Estratégia FR é NÃO
      bool c_c = g_CachedFrCdOk, c_l = (g_CachedFRTop > 0 && g_CachedFRFundo > 0);
      bool dir_s_ok, dir_b_ok; GetFR_DirecaoOk(g_CachedMedDir, g_CachedRSI, dir_s_ok, dir_b_ok);
      double ask_c = SymbolInfoDouble(_Symbol, SYMBOL_ASK), bid_c = SymbolInfoDouble(_Symbol, SYMBOL_BID);
      bool perto_topo = (g_CachedFRTop > 0 && MathAbs(g_CachedFRTop - ask_c) < MathAbs(bid_c - g_CachedFRFundo));
      bool confl_mg_ok = perto_topo ? g_MG_SellAllowed : g_MG_BuyAllowed;
      bool dir_lado_ok = perto_topo ? dir_s_ok : dir_b_ok;
      bool c_dr = InpFR_Direct_Entries;

      DROW_DYN("Uso Estratégia", u_r ? "sim" : "não", !u_r)
      DROW_DYN("Roteamento Ativo", is_fr_rot_ok ? "PERMITIDO" : "BLOQUEADO (PAR TENDÊNCIA)", !is_fr_rot_ok)`;

if (content.includes('bool u_r=InpUseFR, c_c=g_CachedFrCdOk')) {
  content = content.replace(oldFRDiagLines, newFRDiagLines);
  console.log('✔ Diagnóstico da F.ROMP corrigido para exibir "Uso Estratégia: não" no XAUUSD/GBPJPY/GBPUSD!');
} else {
  console.log('⚠ oldFRDiagLines não encontrado idêntico.');
}

// 3. Atualizar IsSymbolInList
const oldFunc = `bool IsSymbolInList(string symbol_to_check, string list) {
   if(list == "") return false;
   string sym = symbol_to_check;
   StringToUpper(sym);
   string l = list;
   StringToUpper(l);
   return (StringFind(l, sym) >= 0);
}`;

const newFunc = `bool IsSymbolInList(string symbol_to_check, string list) {
   if(list == "") return false;
   string sym = symbol_to_check;
   StringToUpper(sym);
   string l = list;
   StringToUpper(l);
   
   string items[];
   int count = StringSplit(l, ',', items);
   for(int i = 0; i < count; i++) {
      string itm = items[i];
      StringTrimLeft(itm);
      StringTrimRight(itm);
      if(itm != "" && (StringFind(sym, itm) >= 0 || StringFind(itm, sym) >= 0)) return true;
   }
   return false;
}`;

if (content.includes('bool IsSymbolInList(string symbol_to_check, string list) {')) {
  content = content.replace(oldFunc, newFunc);
  console.log('✔ IsSymbolInList atualizado com sucesso!');
}

fs.writeFileSync(mq5Path, content, 'utf8');
console.log('✔ Arquivo Fibbo_Sniper_v28.5_H2.mq5 salvo com sucesso!');
