const fs = require('fs');
const path = require('path');

console.log('=== APLICANDO CORREÇÃO DEFINITIVA DO ROTEAMENTO E DIAGNÓSTICO ===\n');

const mq5Path = path.join(__dirname, 'Fibbo_Sniper_v28.5_H2.mq5');
let code = fs.readFileSync(mq5Path, 'utf8');

// 1. Atualizar IsSymbolInList para suportar sufixos de corretora (.raw, +, m, etc)
const oldIsSymbolInList = `bool IsSymbolInList(string symbol_to_check, string list) {
   if(list == "") return false;
   string sym = symbol_to_check;
   StringToUpper(sym);
   string l = list;
   StringToUpper(l);
   return (StringFind(l, sym) >= 0);
}`;

const newIsSymbolInList = `bool IsSymbolInList(string symbol_to_check, string list) {
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

code = code.replace(oldIsSymbolInList, newIsSymbolInList);
console.log('✔ IsSymbolInList atualizado com detecção avançada de sufixos de corretora!');

// 2. Corrigir aba do FR no DesenharPainelDiag
const oldFRDiagExact = `   } else {
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

const newFRDiagExact = `   } else {
      bool is_fr_rot_ok = IsFRAllowedForCurrentSymbol();
      bool u_r = InpUseFR && is_fr_rot_ok; // No XAUUSD, GBPJPY, GBPUSD, Uso da Estratégia FR é NÃO
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

code = code.replace(oldFRDiagExact, newFRDiagExact);
console.log('✔ Diagnóstico F.ROMP corrigido!');

fs.writeFileSync(mq5Path, code, 'utf8');
console.log('✔ Fibbo_Sniper_v28.5_H2.mq5 atualizado!');
