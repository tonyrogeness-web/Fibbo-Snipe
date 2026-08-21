const fs = require('fs');
const path = require('path');

console.log('=== CALIBRANDO DIAGNÓSTICO E NAVEGAÇÃO LIVRE DE ABAS ===\n');

const mq5Path = path.join(__dirname, 'Fibbo_Sniper_v28.5_H2.mq5');
let code = fs.readFileSync(mq5Path, 'utf8');

// 1. Inicialização de aba apenas na troca de símbolo (não bloqueia navegação do usuário!)
const oldTabSwitch = `   bool _is_flx_pair = IsFluxoAllowedForCurrentSymbol() && !IsFRAllowedForCurrentSymbol();
   bool _is_fr_pair  = IsFRAllowedForCurrentSymbol() && !IsFluxoAllowedForCurrentSymbol();
   if(_is_flx_pair && g_DiagTab != 2) g_DiagTab = 2; // Em pares de Fluxo (GBPJPY, GBPUSD, XAUUSD), abre direto na aba FLUXO!
   else if(_is_fr_pair && g_DiagTab != 1) g_DiagTab = 1; // Em pares de FR (EURUSD, EURCAD, NZDUSD etc), abre direto na aba F.ROMP!`;

const newTabSwitch = `   static string s_last_diag_sym = "";
   if(_Symbol != s_last_diag_sym) {
      if(IsFluxoAllowedForCurrentSymbol() && !IsFRAllowedForCurrentSymbol()) g_DiagTab = 2; // GBPJPY, GBPUSD, XAUUSD iniciam no Fluxo
      else g_DiagTab = 1; // EURUSD, EURCAD etc iniciam no FR
      s_last_diag_sym = _Symbol;
   }`;

code = code.replace(oldTabSwitch, newTabSwitch);

// 2. Aba FLUXO (Tab 2): Uso Estratégia = não quando par é de FR
const oldFluxoTab = `   if(g_DiagTab==2){
      bool u_flx = InpUseFluxo;
      bool is_rot_ok = IsFluxoAllowedForCurrentSymbol();
      bool c_canal = (g_CachedCanalHigh > 0 && g_CachedCanalLow > 0);
      bool c_vol = (InpUseVolumeFilter && g_CachedVolMed > 0);
      bool c_parede = !g_FluxoParedeAtiva;
      bool t_ok = (g_CachedTrendDir != 0);
      string t_txt = (g_CachedTrendDir == 1) ? "ALTA (COMPRA)" : ((g_CachedTrendDir == -1) ? "BAIXA (VENDA)" : "NEUTRO");
      
      DROW_DYN("Uso Estratégia", u_flx ? "sim" : "OFF", !u_flx);
      DROW_DYN("Roteamento Ativo", is_rot_ok ? "PERMITIDO" : "BLOQUEADO (PAR RANGE)", !is_rot_ok);`;

const newFluxoTab = `   if(g_DiagTab==2){
      bool is_rot_ok = IsFluxoAllowedForCurrentSymbol();
      bool u_flx = InpUseFluxo && is_rot_ok; // Se bloqueado para a moeda, uso da estratégia é NÃO
      bool c_canal = (g_CachedCanalHigh > 0 && g_CachedCanalLow > 0);
      bool c_vol = (InpUseVolumeFilter && g_CachedVolMed > 0);
      bool c_parede = !g_FluxoParedeAtiva;
      bool t_ok = (g_CachedTrendDir != 0);
      string t_txt = (g_CachedTrendDir == 1) ? "ALTA (COMPRA)" : ((g_CachedTrendDir == -1) ? "BAIXA (VENDA)" : "NEUTRO");
      
      DROW_DYN("Uso Estratégia", u_flx ? "sim" : "não", !u_flx);
      DROW_DYN("Roteamento Ativo", is_rot_ok ? "PERMITIDO" : "BLOQUEADO (PAR RANGE)", !is_rot_ok);`;

code = code.replace(oldFluxoTab, newFluxoTab);

// 3. Aba F.ROMP (Tab 1): Uso Estratégia = não quando par é de FLUXO
const oldFRTab = `   } else {
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
      DROW_DYN("Roteamento Ativo", is_fr_rot_ok ? "PERMITIDO" : "BLOQUEADO (PAR TENDÊNCIA)", !is_fr_rot_ok);`;

const newFRTab = `   } else {
      bool is_fr_rot_ok = IsFRAllowedForCurrentSymbol();
      bool u_r = InpUseFR && is_fr_rot_ok; // Se bloqueado para a moeda, uso da estratégia é NÃO
      bool c_c = g_CachedFrCdOk, c_l = (g_CachedFRTop > 0 && g_CachedFRFundo > 0);
      bool dir_s_ok, dir_b_ok; GetFR_DirecaoOk(g_CachedMedDir, g_CachedRSI, dir_s_ok, dir_b_ok);
      double ask_c = SymbolInfoDouble(_Symbol, SYMBOL_ASK), bid_c = SymbolInfoDouble(_Symbol, SYMBOL_BID);
      bool perto_topo = (g_CachedFRTop > 0 && MathAbs(g_CachedFRTop - ask_c) < MathAbs(bid_c - g_CachedFRFundo));
      bool confl_mg_ok = perto_topo ? g_MG_SellAllowed : g_MG_BuyAllowed;
      bool dir_lado_ok = perto_topo ? dir_s_ok : dir_b_ok;
      bool c_dr = InpFR_Direct_Entries;

      DROW_DYN("Uso Estratégia", u_r ? "sim" : "não", !u_r);
      DROW_DYN("Roteamento Ativo", is_fr_rot_ok ? "PERMITIDO" : "BLOQUEADO (PAR TENDÊNCIA)", !is_fr_rot_ok);`;

code = code.replace(oldFRTab, newFRTab);

fs.writeFileSync(mq5Path, code, 'utf8');
console.log('✔ Fibbo_Sniper_v28.5_H2.mq5 atualizado!');
