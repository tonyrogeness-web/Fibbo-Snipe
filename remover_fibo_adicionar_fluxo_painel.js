const fs = require('fs');
const path = require('path');

console.log('=== REMOVENDO FIBO E INTEGRANDO FLUXO AO PAINEL, DIAGNÓSTICO E GRÁFICO ===\n');

const mq5Path = path.join(__dirname, 'Fibbo_Sniper_v28.5_H2.mq5');
let code = fs.readFileSync(mq5Path, 'utf8');

// 1. Substituir variáveis globais da Fibo por variáveis do Fluxo se necessário
code = code.replace(/bool\s+g_ViewFibo\s*=\s*true;/g, 'bool g_ViewFluxo = true;');
code = code.replace(/int\s+g_FiboWins\s*=\s*0,\s*g_FiboTotal\s*=\s*0;/g, 'int g_FluxoWins = 0, g_FluxoTotal = 0;');

// 2. Atualizar DesenharLinhasChart: Remover Fibo lines e colocar Fluxo lines
const oldFiboLinesStart = code.indexOf('// --- FIBONACCI 2.0 ---');
const oldFiboLinesEnd = code.indexOf('// --- PONTOS HISTÓRICOS DE ENTRADA (SETAS) ---');

if (oldFiboLinesStart !== -1 && oldFiboLinesEnd !== -1) {
  const newFluxoLinesCode = `// --- FLUXO INSTITUCIONAL L1 (CANAIS & MIRA LASER) ---
   bool show_fluxo_lines = IsFluxoAllowedForCurrentSymbol() && InpUseFluxo && g_ViewFluxo && draw_lines;
   double c_high = g_CachedCanalHigh, c_low = g_CachedCanalLow;
   if(show_fluxo_lines && c_high > 0 && c_low > 0) {
      color clr_flx_muted  = C'40,90,140';
      color clr_flx_active = C'0,180,255';
      string tf_flx_str = StringSubstr(EnumToString(g_TF_L1), 7);
      
      bool flx_high_hl = !is_zen && g_ReadyFluxo && (ask >= c_high - g_CachedATR * 0.2);
      bool flx_low_hl  = !is_zen && g_ReadyFluxo && (bid <= c_low + g_CachedATR * 0.2);
      
      DrawVisualLine("FLX_High", c_high, clr_flx_muted, clr_flx_active, "▲", "[FLUXO " + tf_flx_str + "] Romp. Alta", true, flx_high_hl);
      DrawVisualLine("FLX_Low",  c_low,  clr_flx_muted, clr_flx_active, "▼", "[FLUXO " + tf_flx_str + "] Romp. Baixa", true, flx_low_hl);
      
      // Mira Laser do Fluxo
      if(g_ReadyFluxo && !is_zen && g_FastNPosSymbol == 0) {
         datetime c_t_l1 = iTime(_Symbol, g_TF_L1, 0);
         datetime c_next = c_t_l1 + PeriodSeconds(g_TF_L1);
         int sec_left = (int)(c_next - TimeCurrent());
         if(sec_left < 0) sec_left = 0;
         string s_cd = StringFormat("%dm %02ds", sec_left / 60, sec_left % 60);
         
         if(flx_high_hl) {
            MG_HLine("FLX_Trig_Buy", c_high, C'0,255,136', STYLE_DOT, 1, "⚡ Gatilho Compra Fluxo", C'0,255,136');
            MG_Text("FLX_Trig_Buy_LBL", c_next, c_high, "⚡ GATILHO COMPRA FLUXO (Fecha em " + s_cd + ")", C'0,255,136', 8, ANCHOR_LEFT_LOWER);
         } else {
            ObjectDelete(0, MG_PREFIX + "FLX_Trig_Buy");
            ObjectDelete(0, MG_PREFIX + "FLX_Trig_Buy_LBL");
         }
         
         if(flx_low_hl) {
            MG_HLine("FLX_Trig_Sell", c_low, C'0,255,136', STYLE_DOT, 1, "⚡ Gatilho Venda Fluxo", C'0,255,136');
            MG_Text("FLX_Trig_Sell_LBL", c_next, c_low, "⚡ GATILHO VENDA FLUXO (Fecha em " + s_cd + ")", C'0,255,136', 8, ANCHOR_LEFT_UPPER);
         } else {
            ObjectDelete(0, MG_PREFIX + "FLX_Trig_Sell");
            ObjectDelete(0, MG_PREFIX + "FLX_Trig_Sell_LBL");
         }
      } else {
         ObjectDelete(0, MG_PREFIX + "FLX_Trig_Buy"); ObjectDelete(0, MG_PREFIX + "FLX_Trig_Buy_LBL");
         ObjectDelete(0, MG_PREFIX + "FLX_Trig_Sell"); ObjectDelete(0, MG_PREFIX + "FLX_Trig_Sell_LBL");
      }
   } else {
      ObjectDelete(0, MG_PREFIX + "FLX_High"); ObjectDelete(0, MG_PREFIX + "FLX_Low");
      ObjectDelete(0, MG_PREFIX + "FLX_Trig_Buy"); ObjectDelete(0, MG_PREFIX + "FLX_Trig_Buy_LBL");
      ObjectDelete(0, MG_PREFIX + "FLX_Trig_Sell"); ObjectDelete(0, MG_PREFIX + "FLX_Trig_Sell_LBL");
   }

   `;
  code = code.slice(0, oldFiboLinesStart) + newFluxoLinesCode + code.slice(oldFiboLinesEnd);
  console.log('✔ Desenho de linhas da Fibo substituído pelas Linhas e Mira Laser do Fluxo.');
}

// 3. Atualizar AtualizarPainel(): Substituir Card Fibo pelo Card do FLUXO
const oldPanelCardsStart = code.indexOf('bool show_fibo_card = IsFiboActiveForSymbol();');
const oldPanelCardsEnd = code.indexOf('if(g_FastNPosSymbol > 0) {', oldPanelCardsStart);

if (oldPanelCardsStart !== -1 && oldPanelCardsEnd !== -1) {
  const newPanelCardsCode = `bool is_fr_allowed = IsFRAllowedForCurrentSymbol();
   bool is_fluxo_allowed = IsFluxoAllowedForCurrentSymbol();
   
   // Determina se mostramos 2 cards ou 1 card expandido
   bool show_two_cards = (is_fr_allowed && is_fluxo_allowed) || (!is_fr_allowed && !is_fluxo_allowed);
   bool show_only_fluxo = (!is_fr_allowed && is_fluxo_allowed);
   bool show_only_fr = (is_fr_allowed && !is_fluxo_allowed);
   
   // Limpar objetos antigos se necessário
   ObjectDelete(0, PANEL_PREFIX + "fb_card"); ObjectDelete(0, PANEL_PREFIX + "fb_card_bg"); ObjectDelete(0, PANEL_PREFIX + "fb_card_acc");
   ObjectDelete(0, PANEL_PREFIX + "fb_n1"); ObjectDelete(0, PANEL_PREFIX + "fb_st"); ObjectDelete(0, PANEL_PREFIX + "fb_req"); ObjectDelete(0, PANEL_PREFIX + "fb_wr");

   // --- CARD 1: FALSO ROMPIMENTO (FR) ---
   if(!show_only_fluxo) {
      int cw_fr = show_two_cards ? ((pw - (pad * 2) - 4) / 2) : (pw - (pad * 2));
      int ox = px + pad - 2;
      
      bool fr_dir_sell_chk = true, fr_dir_buy_chk = true;
      GetFR_DirecaoOk(g_CachedMedDir, g_CachedRSI, fr_dir_sell_chk, fr_dir_buy_chk);
      bool fr_sell_confl_chk = (g_ModoConfluencia > 0) ? g_MG_SellAllowed : true;
      bool fr_buy_confl_chk  = (g_ModoConfluencia > 0) ? g_MG_BuyAllowed : true;
      if(!fr_sell_confl_chk) fr_dir_sell_chk = false;
      if(!fr_buy_confl_chk)  fr_dir_buy_chk  = false;

      bool fr_line_solid = (fr_dir_sell_chk && fr_sell_confl_chk && (g_ReadyFR_Sell || (MathAbs(g_CachedFRTop-ask_p)/_Point <= zone_p))) ||
                           (fr_dir_buy_chk  && fr_buy_confl_chk  && (g_ReadyFR_Buy  || (MathAbs(bid_p-g_CachedFRFundo)/_Point <= zone_p)));
      bool is_ready_fr = is_fr_allowed && InpUseFR && fr_all_ok && (fr_dir_sell_chk || fr_dir_buy_chk) && (g_ReadyFR || (in_rd_fr && fr_line_solid));

      color c_fr_ico = is_ready_fr ? C'245,80,80' : CLR_MUTED;
      color bg_fr    = is_ready_fr ? C'38,14,18'  : CLR_BG_CARD;
      color txt_fr   = is_ready_fr ? CLR_TXT_WHITE : CLR_TXT_LABEL;
      color c_fr_st  = is_ready_fr ? (g_ReadyFR ? C'0,255,136' : C'255,193,7') : CLR_MUTED;
      string s_fr2   = !InpUseFR ? "OFF" : (!is_fr_allowed ? "OFF (Roteamento)" : (tem_flx_pos ? "BLOQ (Fluxo)" : (is_ready_fr ? (g_ReadyFR ? "⚡ DISPARO IMEDIATO!" : ("ARMADO! (Fecha em " + s_next + ")")) : "Prox.Vela")));
      
      string tf_fr_card = StringSubstr(EnumToString(g_TF_L1), 7);
      PModuleCardH("fr_card", ox, cur, cw_fr, ch, c_fr_ico, bg_fr);
      PLabel("fr_n1", ox+ico_x, cur+nome_y, show_two_cards ? ("F.ROMP ["+tf_fr_card+"]"+m_dir) : ("FALSO ROMPIMENTO ["+tf_fr_card+"]"+m_dir), txt_fr, InpPanelFontSize, true);
      PLabel("fr_st", ox+ico_x, cur+st_y, s_fr2, c_fr_st, InpPanelFontSize-2, true);
      PLabel("fr_req", ox+ico_x, cur+req_y, show_two_cards ? (fr_all_ok ? "Req: ✔ OK" : "Req: ✖ BLOQ") : s_fr_req, is_ready_fr ? c_fr_req_clr : CLR_TXT_DIM, InpPanelFontSize-2, true);
      string sr_fr = StringFormat(show_two_cards ? "%dW/%dT" : "Assertividade: %dW / %dT", g_FrWins, g_FrTotal);
      if(g_FrTotal > 0) sr_fr += " (" + IntegerToString((int)((g_FrWins * 100.0) / g_FrTotal)) + "%)";
      PLabel("fr_wr", ox+ico_x, cur+wr_y, sr_fr, (is_ready_fr && g_FrWins >= g_FrTotal/2.0 && g_FrTotal > 0) ? C'0,230,118' : CLR_TXT_LABEL, InpPanelFontSize-2);
   } else {
      ObjectDelete(0, PANEL_PREFIX + "fr_card"); ObjectDelete(0, PANEL_PREFIX + "fr_card_bg"); ObjectDelete(0, PANEL_PREFIX + "fr_card_acc");
      ObjectDelete(0, PANEL_PREFIX + "fr_n1"); ObjectDelete(0, PANEL_PREFIX + "fr_st"); ObjectDelete(0, PANEL_PREFIX + "fr_req"); ObjectDelete(0, PANEL_PREFIX + "fr_wr");
   }

   // --- CARD 2: FLUXO INSTITUCIONAL ---
   if(!show_only_fr) {
      int cw_flx = show_two_cards ? ((pw - (pad * 2) - 4) / 2) : (pw - (pad * 2));
      int ox = show_two_cards ? (px + pad - 2 + cw_flx + 4) : (px + pad - 2);
      
      bool flx_all_ok = (!glb_blocked && is_fluxo_allowed && InpUseFluxo && !tem_fr_pos && g_CachedFluxoCdOk && g_CachedCanalHigh > 0 && g_CachedCanalLow > 0);
      bool is_ready_flx = flx_all_ok && g_ReadyFluxo;
      
      color c_flx_ico = is_ready_flx ? C'0,180,255' : CLR_MUTED;
      color bg_flx    = is_ready_flx ? C'10,25,45'   : CLR_BG_CARD;
      color txt_flx   = is_ready_flx ? CLR_TXT_WHITE : CLR_TXT_LABEL;
      color c_flx_st  = is_ready_flx ? C'0,255,136' : (flx_all_ok ? C'0,180,255' : CLR_MUTED);
      string s_flx    = !InpUseFluxo ? "OFF" : (!is_fluxo_allowed ? "OFF (Roteamento)" : (tem_fr_pos ? "BLOQ (FR)" : (is_ready_flx ? "⚡ DISPARO FLUXO!" : (flx_all_ok ? ("ARMADO! (" + s_next + ")") : "Aguardando"))));
      
      string tf_flx_card = StringSubstr(EnumToString(g_TF_L1), 7);
      PModuleCardH("flx_card", ox, cur, cw_flx, ch, c_flx_ico, bg_flx);
      PLabel("flx_n1", ox+ico_x, cur+nome_y, show_two_cards ? ("FLUXO ["+tf_flx_card+"]"+m_dir) : ("FLUXO INSTITUCIONAL ["+tf_flx_card+"]"+m_dir), txt_flx, InpPanelFontSize, true);
      PLabel("flx_st", ox+ico_x, cur+st_y, s_flx, c_flx_st, InpPanelFontSize-2, true);
      PLabel("flx_req", ox+ico_x, cur+req_y, flx_all_ok ? "Req: ✔ OK (PRONTO)" : (!is_fluxo_allowed ? "Req: ✖ Bloq Roteamento" : "Req: ✖ Aguardando"), is_ready_flx ? C'0,230,118' : CLR_TXT_DIM, InpPanelFontSize-2, true);
      string sr_flx = StringFormat(show_two_cards ? "%dW/%dT" : "Assertividade: %dW / %dT", g_FluxoWins, g_FluxoTotal);
      if(g_FluxoTotal > 0) sr_flx += " (" + IntegerToString((int)((g_FluxoWins * 100.0) / g_FluxoTotal)) + "%)";
      PLabel("flx_wr", ox+ico_x, cur+wr_y, sr_flx, (is_ready_flx && g_FluxoWins >= g_FluxoTotal/2.0 && g_FluxoTotal > 0) ? C'0,230,118' : CLR_TXT_LABEL, InpPanelFontSize-2);
   } else {
      ObjectDelete(0, PANEL_PREFIX + "flx_card"); ObjectDelete(0, PANEL_PREFIX + "flx_card_bg"); ObjectDelete(0, PANEL_PREFIX + "flx_card_acc");
      ObjectDelete(0, PANEL_PREFIX + "flx_n1"); ObjectDelete(0, PANEL_PREFIX + "flx_st"); ObjectDelete(0, PANEL_PREFIX + "flx_req"); ObjectDelete(0, PANEL_PREFIX + "flx_wr");
   }
   cur += ch + 22;

   `;
  code = code.slice(0, oldPanelCardsStart) + newPanelCardsCode + code.slice(oldPanelCardsEnd);
  console.log('✔ Cards do Painel atualizados: FLUXO integrado perfeitamente no lugar da Fibo.');
}

// 4. Inserir tem_fr_pos antes dos cards
if (!code.includes('bool tem_fr_pos = TemPosicaoAbertaNoAtivoComPrefixo("FR_");')) {
  code = code.replace(
    'bool tem_flx_pos = TemPosicaoAbertaNoAtivoComPrefixo("Fluxo_");',
    'bool tem_flx_pos = TemPosicaoAbertaNoAtivoComPrefixo("Fluxo_");\n   bool tem_fr_pos = TemPosicaoAbertaNoAtivoComPrefixo("FR_");'
  );
  console.log('✔ tem_fr_pos adicionado em AtualizarPainel().');
}

// 5. Atualizar Botões de Controle: de btn_leg_fb para btn_leg_fl ("● FLUXO")
code = code.replace(
  'PButton("btn_leg_fb",px+pad-2+tw+3,cur,tw,15,g_ViewFibo?"● FIBO":"○ FIBO",CLR_BG_CARD,g_ViewFibo?CLR_AMBER:CLR_MUTED);',
  'PButton("btn_leg_fl",px+pad-2+tw+3,cur,tw,15,g_ViewFluxo?"● FLUXO":"○ FLUXO",CLR_BG_CARD,g_ViewFluxo?C\'0,180,255\':CLR_MUTED);'
);

// 6. Atualizar OnChartEvent: clique em btn_leg_fl
code = code.replace(
  'else if(btn==PANEL_PREFIX+"btn_leg_fb"){ g_ViewFibo=!g_ViewFibo;',
  'else if(btn==PANEL_PREFIX+"btn_leg_fl"){ g_ViewFluxo=!g_ViewFluxo;'
);

// 7. Atualizar Painel de Diagnóstico: Aba 2 vira "FLUXO"
const oldDiagTabs = `{string _bn=DP+"btn_tab_fb";if(ObjectFind(0,_bn)<0)ObjectCreate(0,_bn,OBJ_BUTTON,0,0,0);ObjectSetInteger(0,_bn,OBJPROP_XDISTANCE,dlx+tw+2);ObjectSetInteger(0,_bn,OBJPROP_YDISTANCE,cur+2);ObjectSetInteger(0,_bn,OBJPROP_XSIZE,tw);ObjectSetInteger(0,_bn,OBJPROP_YSIZE,20);ObjectSetString(0,_bn,OBJPROP_TEXT,"FIBO"+m_dir);ObjectSetInteger(0,_bn,OBJPROP_BGCOLOR,g_DiagTab==2?CLR_AMBER:CLR_BG_CARD);ObjectSetInteger(0,_bn,OBJPROP_COLOR,g_DiagTab==2?CLR_TXT_WHITE:CLR_TXT_LABEL);ObjectSetInteger(0,_bn,OBJPROP_BORDER_COLOR,CLR_LINE_HARD);ObjectSetString(0,_bn,OBJPROP_FONT,"Arial Bold");ObjectSetInteger(0,_bn,OBJPROP_FONTSIZE,8);ObjectSetInteger(0,_bn,OBJPROP_CORNER,CORNER_LEFT_UPPER);ObjectSetInteger(0,_bn,OBJPROP_SELECTABLE,false);ObjectSetInteger(0,_bn,OBJPROP_HIDDEN,true);ObjectSetInteger(0,_bn,OBJPROP_STATE,false);ObjectSetInteger(0,_bn,OBJPROP_ZORDER,310);}`;
const newDiagTabs = `{string _bn=DP+"btn_tab_fl";if(ObjectFind(0,_bn)<0)ObjectCreate(0,_bn,OBJ_BUTTON,0,0,0);ObjectSetInteger(0,_bn,OBJPROP_XDISTANCE,dlx+tw+2);ObjectSetInteger(0,_bn,OBJPROP_YDISTANCE,cur+2);ObjectSetInteger(0,_bn,OBJPROP_XSIZE,tw);ObjectSetInteger(0,_bn,OBJPROP_YSIZE,20);ObjectSetString(0,_bn,OBJPROP_TEXT,"FLUXO"+m_dir);ObjectSetInteger(0,_bn,OBJPROP_BGCOLOR,g_DiagTab==2?C'0,180,255':CLR_BG_CARD);ObjectSetInteger(0,_bn,OBJPROP_COLOR,g_DiagTab==2?CLR_TXT_WHITE:CLR_TXT_LABEL);ObjectSetInteger(0,_bn,OBJPROP_BORDER_COLOR,CLR_LINE_HARD);ObjectSetString(0,_bn,OBJPROP_FONT,"Arial Bold");ObjectSetInteger(0,_bn,OBJPROP_FONTSIZE,8);ObjectSetInteger(0,_bn,OBJPROP_CORNER,CORNER_LEFT_UPPER);ObjectSetInteger(0,_bn,OBJPROP_SELECTABLE,false);ObjectSetInteger(0,_bn,OBJPROP_HIDDEN,true);ObjectSetInteger(0,_bn,OBJPROP_STATE,false);ObjectSetInteger(0,_bn,OBJPROP_ZORDER,310);}`;

if (code.includes(oldDiagTabs)) {
  code = code.replace(oldDiagTabs, newDiagTabs);
  console.log('✔ Aba do Diagnóstico atualizada de FIBO para FLUXO.');
}

// 8. Atualizar conteúdo da Tab 2 no Diagnóstico
const oldDiagContentStart = code.indexOf('if(g_DiagTab==2){');
const oldDiagContentEnd = code.indexOf('} else {', oldDiagContentStart);

if (oldDiagContentStart !== -1 && oldDiagContentEnd !== -1) {
  const newFluxoDiagCode = `if(g_DiagTab==2){
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
   `;
  code = code.slice(0, oldDiagContentStart) + newFluxoDiagCode + code.slice(oldDiagContentEnd);
  console.log('✔ Conteúdo do Diagnóstico da Tab 2 atualizado com requisitos do FLUXO.');
}

// 9. Atualizar seleção automática de Tab do Diagnóstico com base no ativo
code = code.replace(
  'if(g_DiagTab == 0) g_DiagTab = 1;',
  'if(g_DiagTab == 0) { g_DiagTab = IsFluxoAllowedForCurrentSymbol() && !IsFRAllowedForCurrentSymbol() ? 2 : 1; }'
);

// 10. Atualizar clique de Tab no Diagnóstico
code = code.replace(
  'else if(btn==DP+"btn_tab_fb"){ g_DiagTab=2; }',
  'else if(btn==DP+"btn_tab_fl" || btn==DP+"btn_tab_fb"){ g_DiagTab=2; }'
);

// 11. Remover Motor 3 (Fibo) do OnTick
const motor3Start = code.indexOf('// MOTOR 3: FIBONACCI 2.0 DE ALTA PRECISÃO');
const motor3End = code.indexOf('//================================================================\n   // ATUALIZAÇÃO DO PAINEL E LINHAS', motor3Start);

if (motor3Start !== -1 && motor3End !== -1) {
  code = code.slice(0, motor3Start) + '// [REMOVIDO] Motor Fibo descontinuado em prol do Fluxo Institucional L1\n   ' + code.slice(motor3End);
  console.log('✔ Motor 3 (Fibo) descontinuado e removido do OnTick.');
}

fs.writeFileSync(mq5Path, code, 'utf8');
console.log('✔ Fibbo_Sniper_v28.5_H2.mq5 atualizado e limpo com sucesso!');
