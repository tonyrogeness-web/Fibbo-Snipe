const fs = require('fs');
const path = require('path');

console.log('=== SINCRONIZANDO ROTEAMENTO E ABAS DO DIAGNÓSTICO ===\n');

const mq5Path = path.join(__dirname, 'Fibbo_Sniper_v28.5_H2.mq5');
let code = fs.readFileSync(mq5Path, 'utf8');

// 1. Auto-detecção dinâmica da aba no DesenharPainelDiag
const oldTabInit = `   if(g_DiagTab == 0) { g_DiagTab = IsFluxoAllowedForCurrentSymbol() && !IsFRAllowedForCurrentSymbol() ? 2 : 1; }`;
const newTabInit = `   bool _is_flx_pair = IsFluxoAllowedForCurrentSymbol() && !IsFRAllowedForCurrentSymbol();
   bool _is_fr_pair  = IsFRAllowedForCurrentSymbol() && !IsFluxoAllowedForCurrentSymbol();
   if(_is_flx_pair && g_DiagTab != 2) g_DiagTab = 2; // Em pares de Fluxo (GBPJPY, GBPUSD, XAUUSD), abre direto na aba FLUXO!
   else if(_is_fr_pair && g_DiagTab != 1) g_DiagTab = 1; // Em pares de FR (EURUSD, EURCAD, NZDUSD etc), abre direto na aba F.ROMP!`;

code = code.replace(oldTabInit, newTabInit);

// 2. Adicionar linha de Roteamento Ativo na aba de FR
const oldFRDiag = `   } else {
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

const newFRDiag = `   } else {
      bool u_r = InpUseFR;
      bool is_fr_rot_ok = IsFRAllowedForCurrentSymbol();
      bool c_c = g_CachedFrCdOk, c_l = (g_CachedFRTop > 0 && g_CachedFRFundo > 0);
      bool dir_s_ok, dir_b_ok; GetFR_DirecaoOk(g_CachedMedDir, g_CachedRSI, dir_s_ok, dir_b_ok);
      double ask_c = SymbolInfoDouble(_Symbol, SYMBOL_ASK), bid_c = SymbolInfoDouble(_Symbol, SYMBOL_BID);
      bool perto_topo = (g_CachedFRTop > 0 && MathAbs(g_CachedFRTop - ask_c) < MathAbs(bid_c - g_CachedFRFundo));
      bool confl_mg_ok = perto_topo ? g_MG_SellAllowed : g_MG_BuyAllowed;
      bool dir_lado_ok = perto_topo ? dir_s_ok : dir_b_ok;
      bool c_dr = InpFR_Direct_Entries;

      DROW_DYN("Uso Estratégia", u_r ? "sim" : "OFF", !u_r);
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

if (code.includes('bool u_r=InpUseFR, c_c=g_CachedFrCdOk')) {
  code = code.replace(oldFRDiag, newFRDiag);
  console.log('✔ Aba de diagnóstico F.ROMP sincronizada com o Roteamento Inteligente!');
}

fs.writeFileSync(mq5Path, code, 'utf8');
console.log('✔ Fibbo_Sniper_v28.5_H2.mq5 atualizado!');
