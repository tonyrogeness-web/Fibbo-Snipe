const fs = require('fs');
const path = require('path');

console.log('=== CORRIGINDO DESENHO DE LINHAS E DIAGNÓSTICO POR MOEDA ===\n');

const mq5Path = path.join(__dirname, 'Fibbo_Sniper_v28.5_H2.mq5');
let code = fs.readFileSync(mq5Path, 'utf8');

// 1. Corrigir desenho das linhas FR em DesenharLinhasChart()
const oldFRDrawSection = `   if(InpUseFR && g_CachedFRTop > 0) {
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

const newFRDrawSection = `   bool show_fr_lines = IsFRAllowedForCurrentSymbol() && InpUseFR && (g_CachedFRTop > 0 && g_CachedFRFundo > 0);
   if(show_fr_lines) {
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

      DrawVisualLine("FR_Gat_V", trig_sell_p, clr_trig_discreto, clr_trig_discreto, lbl_gat_v, lbl_gat_v, show_trig_sell, false, ANCHOR_LEFT_UPPER);
      DrawVisualLine("FR_Gat_C", trig_buy_p,  clr_trig_discreto, clr_trig_discreto, lbl_gat_c, lbl_gat_c, show_trig_buy,  false, ANCHOR_LEFT_LOWER);
   } else {
      DrawVisualLine("FR_Topo",  0, clrNONE, clrNONE, "", "", false, false);
      DrawVisualLine("FR_Fundo", 0, clrNONE, clrNONE, "", "", false, false);
      DrawVisualLine("FR_Gat_V", 0, clrNONE, clrNONE, "", "", false, false);
      DrawVisualLine("FR_Gat_C", 0, clrNONE, clrNONE, "", "", false, false);
   }`;

code = code.replace(oldFRDrawSection, newFRDrawSection);
console.log('✔ Linhas do FR agora NUNCA serão desenhadas em pares de Fluxo (XAUUSD, GBPUSD, GBPJPY)!');

// 2. Corrigir Diagnóstico FR
const oldFRDiagBlock = `   } else {
      bool u_r=InpUseFR, c_c=g_CachedFrCdOk, c_l=(g_CachedFRTop>0&&g_CachedFRFundo>0);
       bool dir_s_ok,dir_b_ok; GetFR_DirecaoOk(g_CachedMedDir,g_CachedRSI,dir_s_ok,dir_b_ok);
       double ask_c=SymbolInfoDouble(_Symbol,SYMBOL_ASK), bid_c=SymbolInfoDouble(_Symbol,SYMBOL_BID);
       bool perto_topo=(g_CachedFRTop>0 && MathAbs(g_CachedFRTop-ask_c) < MathAbs(bid_c-g_CachedFRFundo));
       bool confl_mg_ok = perto_topo ? g_MG_SellAllowed : g_MG_BuyAllowed;
       bool dir_lado_ok = perto_topo ? dir_s_ok : dir_b_ok;
       bool c_dr=InpFR_Direct_Entries;

       DROW_DYN("Uso Estratégia",u_r?"sim":"OFF",!u_r)
       DROW_DYN("Cooldown L1",c_c?"livre":"AGUARDAR",!c_c)
       DROW_DYN("Mapeamento L1",c_l?"sim":"NÃO",!c_l)
       DROW_DYN("Dir. L1 OK",dir_lado_ok?"sim":(perto_topo?"NEUTRO (TOPO)":"NEUTRO (FUNDO)"),!dir_lado_ok)
       DROW_DYN("FR Direct",c_dr?"ativo":"off",false)
       string confl_val="OFF"; 
       if(g_ModoConfluencia>0){ 
          if(g_MG_BuyAllowed&&!g_MG_SellAllowed) confl_val=perto_topo?"BLOQ (SÓ COMPRA)":"SÓ COMPRA (OK)"; 
          else if(!g_MG_BuyAllowed&&g_MG_SellAllowed) confl_val=perto_topo?"SÓ VENDA (OK)":"BLOQ (SÓ VENDA)"; 
          else confl_val="LIVRE"; 
       } 
       DROW_DYN("Filtro MktGlance",confl_val,!confl_mg_ok)

       // [BLINDAGEM 1] Diagnóstico de Super-Tendência ADX H4
       bool super_bloq = false; string super_txt = "LIVRE";
       if(InpFR_BlockAgainstSuperTrend) {
          if(g_H4_ADX >= InpFR_SuperTrend_ADX && g_MG_EMA200 > 0) {
             if(perto_topo && ask_c > g_MG_EMA200) { super_bloq = true; super_txt = "BLOQ (ALTA ADX>30)"; }
             else if(!perto_topo && bid_c < g_MG_EMA200) { super_bloq = true; super_txt = "BLOQ (BAIXA ADX>30)"; }
             else { super_txt = "LIVRE (ADX " + DoubleToString(g_H4_ADX, 1) + ")"; }
          } else {
             super_txt = "LIVRE (ADX " + DoubleToString(g_H4_ADX, 1) + ")";
          }
       } else super_txt = "DESATIVADO";
       DROW_DYN("Anti-SuperTrend", super_txt, super_bloq);

       // [BLINDAGEM 2 & 3] Pavio 40% e Mid-Channel Lock
       bool wick40_active = (InpFR_RequireMinWick40 && InpFR_RequireWickRejection);
       DROW_DYN("Pavio Mínimo 40%", wick40_active ? "ATIVO" : "OFF", !wick40_active);
       DROW_DYN("Mid-Channel Lock", InpFR_UseMidChannelLock ? "ATIVO" : "OFF", false);

       string not_val=d_not?"BLOQUEADO":"LIVRE"; if(g_ProximaNoticiaName!=""&&g_ProximaNoticiaTime>TimeCurrent()){int m_l=(int)((g_ProximaNoticiaTime-TimeCurrent())/60); not_val=(d_not?"BLOQ ":"")+g_ProximaNoticiaName+" ("+IntegerToString(m_l)+"m)";} DROW_DYN("Filtro Notícia",not_val,d_not)
       s_rdy=(!any_glb&&u_r&&c_c&&c_l&&dir_lado_ok&&confl_mg_ok&&!super_bloq);
   }`;

const newFRDiagBlock = `   } else {
      bool is_fr_rot_ok = IsFRAllowedForCurrentSymbol();
      bool u_r = InpUseFR && is_fr_rot_ok; // Nas moedas de Fluxo, Uso da Estratégia FR é NÃO
      bool c_c = g_CachedFrCdOk, c_l = (g_CachedFRTop > 0 && g_CachedFRFundo > 0);
      bool dir_s_ok, dir_b_ok; GetFR_DirecaoOk(g_CachedMedDir, g_CachedRSI, dir_s_ok, dir_b_ok);
      double ask_c = SymbolInfoDouble(_Symbol, SYMBOL_ASK), bid_c = SymbolInfoDouble(_Symbol, SYMBOL_BID);
      bool perto_topo = (g_CachedFRTop > 0 && MathAbs(g_CachedFRTop - ask_c) < MathAbs(bid_c - g_CachedFRFundo));
      bool confl_mg_ok = perto_topo ? g_MG_SellAllowed : g_MG_BuyAllowed;
      bool dir_lado_ok = perto_topo ? dir_s_ok : dir_b_ok;
      bool c_dr = InpFR_Direct_Entries;

      DROW_DYN("Uso Estratégia", u_r ? "sim" : "não", !u_r);
      DROW_DYN("Roteamento Ativo", is_fr_rot_ok ? "PERMITIDO" : "BLOQUEADO (PAR TENDÊNCIA)", !is_fr_rot_ok);
      DROW_DYN("Cooldown L1", c_c ? "livre" : "AGUARDAR", !c_c);
      DROW_DYN("Mapeamento L1", c_l ? "sim" : "NÃO", !c_l);
      DROW_DYN("Dir. L1 OK", dir_lado_ok ? "sim" : (perto_topo ? "NEUTRO (TOPO)" : "NEUTRO (FUNDO)"), !dir_lado_ok);
      DROW_DYN("FR Direct", c_dr ? "ativo" : "off", false);
      string confl_val = "OFF"; 
      if(g_ModoConfluencia > 0){ 
         if(g_MG_BuyAllowed && !g_MG_SellAllowed) confl_val = perto_topo ? "BLOQ (SÓ COMPRA)" : "SÓ COMPRA (OK)"; 
         else if(!g_MG_BuyAllowed && g_MG_SellAllowed) confl_val = perto_topo ? "SÓ VENDA (OK)" : "BLOQ (SÓ VENDA)"; 
         else confl_val = "LIVRE"; 
      } 
      DROW_DYN("Filtro MktGlance", confl_val, !confl_mg_ok);

      // [BLINDAGEM 1] Diagnóstico de Super-Tendência ADX H4
      bool super_bloq = false; string super_txt = "LIVRE";
      if(InpFR_BlockAgainstSuperTrend) {
         if(g_H4_ADX >= InpFR_SuperTrend_ADX && g_MG_EMA200 > 0) {
            if(perto_topo && ask_c > g_MG_EMA200) { super_bloq = true; super_txt = "BLOQ (ALTA ADX>30)"; }
            else if(!perto_topo && bid_c < g_MG_EMA200) { super_bloq = true; super_txt = "BLOQ (BAIXA ADX>30)"; }
            else { super_txt = "LIVRE (ADX " + DoubleToString(g_H4_ADX, 1) + ")"; }
         } else {
            super_txt = "LIVRE (ADX " + DoubleToString(g_H4_ADX, 1) + ")";
         }
      } else super_txt = "DESATIVADO";
      DROW_DYN("Anti-SuperTrend", super_txt, super_bloq);

      // [BLINDAGEM 2 & 3] Pavio 40% e Mid-Channel Lock
      bool wick40_active = (InpFR_RequireMinWick40 && InpFR_RequireWickRejection);
      DROW_DYN("Pavio Mínimo 40%", wick40_active ? "ATIVO" : "OFF", !wick40_active);
      DROW_DYN("Mid-Channel Lock", InpFR_UseMidChannelLock ? "ATIVO" : "OFF", false);

      string not_val = d_not ? "BLOQUEADO" : "LIVRE"; 
      if(g_ProximaNoticiaName != "" && g_ProximaNoticiaTime > TimeCurrent()){
         int m_l = (int)((g_ProximaNoticiaTime - TimeCurrent()) / 60); 
         not_val = (d_not ? "BLOQ " : "") + g_ProximaNoticiaName + " (" + IntegerToString(m_l) + "m)";
      } 
      DROW_DYN("Filtro Notícia", not_val, d_not);
      s_rdy = (!any_glb && u_r && is_fr_rot_ok && c_c && c_l && dir_lado_ok && confl_mg_ok && !super_bloq);
   }`;

code = code.replace(oldFRDiagBlock, newFRDiagBlock);

fs.writeFileSync(mq5Path, code, 'utf8');
console.log('✔ Fibbo_Sniper_v28.5_H2.mq5 atualizado!');
