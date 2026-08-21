const fs = require('fs');
const path = require('path');

console.log('=== CORRIGINDO NAVEGAÇÃO E REQUISITOS DO FLUXO NO DIAGNÓSTICO E PAINEL ===\n');

const mq5Path = path.join(__dirname, 'Fibbo_Sniper_v28.5_H2.mq5');
let code = fs.readFileSync(mq5Path, 'utf8');

// 1. InpUseFluxo = true por padrão
code = code.replace(
  'input bool InpUseFluxo = false, InpFluxo_GatilhoPrecoce = true',
  'input bool InpUseFluxo = true, InpFluxo_GatilhoPrecoce = false'
);

// 2. Remover deleção errônea do btn_tab_fl na linha 2601
code = code.replace('ObjectDelete(0, DP+"btn_tab_fl");\n', '');

// 3. Corrigir título do box de diagnóstico para FLUXO na linha 2619
code = code.replace(
  'string s_name=(g_DiagTab==2)?"FIBO"+m_dir:"F.ROMP"+m_dir;',
  'string s_name=(g_DiagTab==2)?"FLUXO"+m_dir:"F.ROMP"+m_dir;'
);

// 4. Corrigir OnChartEvent() para os cliques de abas do diagnóstico
const oldClicks = `      else if(btn==PANEL_PREFIX+"D_btn_tab_fl"){ ObjectDelete(0,btn); }
      else if(btn==PANEL_PREFIX+"D_btn_tab_fr"){ g_DiagTab=1; ObjectSetInteger(0,btn,OBJPROP_STATE,false); g_PanelHash=""; DesenharPainelDiag(); }
      else if(btn==PANEL_PREFIX+"D_btn_tab_fb"){ g_DiagTab=2; ObjectSetInteger(0,btn,OBJPROP_STATE,false); g_PanelHash=""; DesenharPainelDiag(); }`;

const newClicks = `      else if(btn==PANEL_PREFIX+"D_btn_tab_fr"){ g_DiagTab=1; ObjectSetInteger(0,btn,OBJPROP_STATE,false); g_PanelHash=""; DesenharPainelDiag(); }
      else if(btn==PANEL_PREFIX+"D_btn_tab_fl" || btn==PANEL_PREFIX+"D_btn_tab_fb"){ g_DiagTab=2; ObjectSetInteger(0,btn,OBJPROP_STATE,false); g_PanelHash=""; DesenharPainelDiag(); }`;

if (code.includes('D_btn_tab_fl')) {
  code = code.replace(oldClicks, newClicks);
  console.log('✔ OnChartEvent atualizado: clique na aba FLUXO agora navega perfeitamente!');
}

// 5. Expandir os Requisitos do Diagnóstico do FLUXO (Tab 2) para ficar completo igual ao FR
const oldDiagTab2 = `   if(g_DiagTab==2){
      bool u_flx = IsFluxoAllowedForCurrentSymbol() && InpUseFluxo;
      bool c_canal = (g_CachedCanalHigh > 0 && g_CachedCanalLow > 0);
      bool c_vol = (InpUseVolumeFilter && g_CachedVolMed > 0);
      bool c_parede = !g_FluxoParedeAtiva;
      
      DROW_DYN("Uso Estratégia", u_flx ? "sim" : "OFF", !u_flx);
      DROW_DYN("Canal L1 (H2)", c_canal ? "MAPEADO" : "AGUARDANDO", !c_canal);
      DROW_DYN("Tendência / EMA", (g_CachedTrendDir != 0) ? (g_CachedTrendDir == 1 ? "ALTA (COMPRA)" : "BAIXA (VENDA)") : "NEUTRO", (g_CachedTrendDir == 0));
      DROW_DYN("Volume Médio L1", c_vol ? "LIVRE (OK)" : "PADRÃO", false);
      DROW_DYN("Anti-Parede FR", c_parede ? "LIVRE" : "PAREDE ATIVA", !c_parede);
      DROW_DYN("Anti-Exaustão ATR", "ATIVO", false);
      
      bool confl_mg_ok = true; string confl_val = "OFF";
      if(g_ModoConfluencia > 0) {
         if(g_MG_BuyAllowed && !g_MG_SellAllowed) confl_val = "SÓ COMPRA";
         else if(!g_MG_BuyAllowed && g_MG_SellAllowed) confl_val = "SÓ VENDA";
         else if(g_MG_BuyAllowed && g_MG_SellAllowed) confl_val = "LIVRE";
         else confl_val = "BLOQUEADO";
         confl_mg_ok = (g_MG_BuyAllowed || g_MG_SellAllowed);
      }
      DROW_DYN("Filtro MktGlance", confl_val, !confl_mg_ok);
      
      string not_val = d_not ? "BLOQUEADO" : "LIVRE";
      if(g_ProximaNoticiaName != "" && g_ProximaNoticiaTime > TimeCurrent()) {
         int m_l = (int)((g_ProximaNoticiaTime - TimeCurrent()) / 60);
         not_val = (d_not ? "BLOQ " : "") + g_ProximaNoticiaName + " (" + IntegerToString(m_l) + "m)";
      }
      DROW_DYN("Filtro Notícia", not_val, d_not);
      s_rdy = (!any_glb && u_flx && c_canal && g_ReadyFluxo);
   }`;

const newDiagTab2 = `   if(g_DiagTab==2){
      bool u_flx = InpUseFluxo;
      bool is_rot_ok = IsFluxoAllowedForCurrentSymbol();
      bool c_canal = (g_CachedCanalHigh > 0 && g_CachedCanalLow > 0);
      bool c_vol = (InpUseVolumeFilter && g_CachedVolMed > 0);
      bool c_parede = !g_FluxoParedeAtiva;
      bool t_ok = (g_CachedTrendDir != 0);
      string t_txt = (g_CachedTrendDir == 1) ? "ALTA (COMPRA)" : ((g_CachedTrendDir == -1) ? "BAIXA (VENDA)" : "NEUTRO");
      
      DROW_DYN("Uso Estratégia", u_flx ? "sim" : "OFF", !u_flx);
      DROW_DYN("Roteamento Ativo", is_rot_ok ? "PERMITIDO" : "BLOQUEADO (PAR RANGE)", !is_rot_ok);
      DROW_DYN("Canal L1 (H2)", c_canal ? "MAPEADO (OK)" : "AGUARDANDO", !c_canal);
      DROW_DYN("Tendência / EMA", t_txt, !t_ok);
      DROW_DYN("Volume Médio L1", c_vol ? "LIVRE (OK)" : "PADRÃO", false);
      DROW_DYN("Anti-Parede FR", c_parede ? "LIVRE" : "PAREDE ATIVA", !c_parede);
      DROW_DYN("Anti-Exaustão ATR", "ATIVO", false);
      
      bool confl_mg_ok = true; string confl_val = "OFF";
      if(g_ModoConfluencia > 0) {
         if(g_MG_BuyAllowed && !g_MG_SellAllowed) confl_val = "SÓ COMPRA";
         else if(!g_MG_BuyAllowed && g_MG_SellAllowed) confl_val = "SÓ VENDA";
         else if(g_MG_BuyAllowed && g_MG_SellAllowed) confl_val = "LIVRE";
         else confl_val = "BLOQUEADO";
         confl_mg_ok = (g_MG_BuyAllowed || g_MG_SellAllowed);
      }
      DROW_DYN("Filtro MktGlance", confl_val, !confl_mg_ok);
      
      string not_val = d_not ? "BLOQUEADO" : "LIVRE";
      if(g_ProximaNoticiaName != "" && g_ProximaNoticiaTime > TimeCurrent()) {
         int m_l = (int)((g_ProximaNoticiaTime - TimeCurrent()) / 60);
         not_val = (d_not ? "BLOQ " : "") + g_ProximaNoticiaName + " (" + IntegerToString(m_l) + "m)";
      }
      DROW_DYN("Filtro Notícia", not_val, d_not);
      s_rdy = (!any_glb && u_flx && is_rot_ok && c_canal && t_ok && confl_mg_ok && c_parede);
   }`;

if (code.includes('if(g_DiagTab==2){')) {
  code = code.replace(oldDiagTab2, newDiagTab2);
  console.log('✔ Requisitos do Diagnóstico do FLUXO expandidos e 100% calibrados!');
}

fs.writeFileSync(mq5Path, code, 'utf8');
console.log('✔ Fibbo_Sniper_v28.5_H2.mq5 atualizado!');
