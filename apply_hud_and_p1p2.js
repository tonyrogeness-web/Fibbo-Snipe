const fs = require('fs');

const file = 'Fibbo_Sniper_v28.5_H2.mq5';
let code = fs.readFileSync(file, 'utf8');

console.log('=== APLICANDO TIMEFRAMES NOS CARDS E LINHAS + AGRUPAMENTO P1/P2 ===\n');

// 1. TIMEFRAMES NAS LINHAS DO GRÁFICO (FR e FIBO)
const oldFRDraw = `   // FR (Paleta Vermelha Proporcional: Muted=Suave, Active=Aceso)
   color clr_fr_muted  = C'140,55,55';
   color clr_fr_active = C'235,75,75';
   if(InpUseFR && g_CachedFRTop > 0) {
      DrawVisualLine("FR_Topo",  g_CachedFRTop,   clr_fr_muted, clr_fr_active, "▼", "[FR] Topo",  fr_show_top, fr_top_hl);
      DrawVisualLine("FR_Fundo", g_CachedFRFundo, clr_fr_muted, clr_fr_active, "▲", "[FR] Fundo", fr_show_bot, fr_bot_hl);
   } else {
      DrawVisualLine("FR_Topo",  0, clrNONE, clrNONE, "", "", false, false);
      DrawVisualLine("FR_Fundo", 0, clrNONE, clrNONE, "", "", false, false);
   }`;

const newFRDraw = `   // FR (Paleta Vermelha Proporcional: Muted=Suave, Active=Aceso)
   color clr_fr_muted  = C'140,55,55';
   color clr_fr_active = C'235,75,75';
   string tf_fr_str = StringSubstr(EnumToString(g_TF_L1), 7); // ex: H2, H4, H1
   if(InpUseFR && g_CachedFRTop > 0) {
      DrawVisualLine("FR_Topo",  g_CachedFRTop,   clr_fr_muted, clr_fr_active, "▼", "[FR " + tf_fr_str + "] Topo",  fr_show_top, fr_top_hl);
      DrawVisualLine("FR_Fundo", g_CachedFRFundo, clr_fr_muted, clr_fr_active, "▲", "[FR " + tf_fr_str + "] Fundo", fr_show_bot, fr_bot_hl);
   } else {
      DrawVisualLine("FR_Topo",  0, clrNONE, clrNONE, "", "", false, false);
      DrawVisualLine("FR_Fundo", 0, clrNONE, clrNONE, "", "", false, false);
   }`;

if (code.includes(oldFRDraw)) {
  code = code.replace(oldFRDraw, newFRDraw);
  console.log('✔ [1/4] Timeframe adicionado nos rótulos de linha do FR');
} else {
  console.log('❌ [1/4] oldFRDraw não encontrado');
}

// 2. TIMEFRAMES NOS CARDS DO HUD
const oldCardLabels = `      PModuleCardH("fr_card",ox,cur,cw_fr,ch,c_fr_ico,bg_fr);
      PLabel("fr_n1",ox+ico_x,cur+nome_y,show_fibo_card?"F.ROMP"+m_dir:"FALSO ROMPIMENTO (F.ROMP)"+m_dir,txt_fr,InpPanelFontSize,true);
      PLabel("fr_st",ox+ico_x,cur+st_y,s_fr2,c_fr_st,InpPanelFontSize,true);
      PLabel("fr_req",ox+ico_x,cur+req_y,show_fibo_card?(fr_all_ok?"Req: ✔ OK":"Req: ✖ BLOQ"):s_fr_req,is_ready_fr?c_fr_req_clr:CLR_TXT_DIM,InpPanelFontSize-2,true);
      string sr_fr=StringFormat(show_fibo_card?"%dW/%dT":"Assertividade: %dW / %dT",g_FrWins,g_FrTotal);
      if(g_FrTotal>0)sr_fr+=" ("+IntegerToString((int)((g_FrWins*100.0)/g_FrTotal))+"%)";
      PLabel("fr_wr",ox+ico_x,cur+wr_y,sr_fr,(is_ready_fr && g_FrWins>=g_FrTotal/2.0&&g_FrTotal>0)?C'0,230,118':CLR_TXT_LABEL,InpPanelFontSize-2);
   }

   if(show_fibo_card) {
      int cw2 = (pw - (pad * 2) - 4) / 2;
      int ox=px+pad-2+cw2+4;
      
      // --- VALIDAÇÃO DE LINHA CONTÍNUA E ARMADO REAL DA FIBO ---
      double nSell_chk = 0, nBuy_chk = 0;
      if(g_CachedFiboH > 0) {
         double range_chk = g_CachedFiboH - g_CachedFiboLow;
         if(range_chk >= (g_CachedFiboATR * InpFibMinRange_ATR_Multi)) {
            nSell_chk = g_CachedFiboLow + range_chk * (InpFibLevelSell / 100.0);
            nBuy_chk  = g_CachedFiboH   - range_chk * (InpFibLevelBuy / 100.0);
         }
      }
      bool fb_dir_sell_chk = (mkt_lateral || tDir == -1);
      bool fb_dir_buy_chk  = (mkt_lateral || tDir == 1);
      if(g_ModoConfluencia > 0) {
         if(!g_MG_SellAllowed) fb_dir_sell_chk = false;
         if(!g_MG_BuyAllowed)  fb_dir_buy_chk  = false;
      }
      bool fb_line_solid = (fb_dir_sell_chk && (g_ReadyFibo || (MathAbs(nSell_chk-ask_p)/_Point <= zone_p))) ||
                           (fb_dir_buy_chk  && (g_ReadyFibo || (MathAbs(bid_p-nBuy_chk)/_Point <= zone_p)));
      
      bool fb_all_ok = (!glb_blocked && IsFiboActiveForSymbol() && fb_cd && (g_CachedFiboH > 0 && g_CachedFiboLow > 0 && g_CachedFiboATR > 0));
      bool is_ready_fb = fb_all_ok && (g_ReadyFibo || (in_rd_fb && fb_line_solid));
      
      // Quando ARMADO E COM LINHA CONTÍNUA -> Amarelo (Img 2). Quando PONTILHADO/ESPERA/BLOQ -> 100% Cinza Neutro (Img 1)
      color c_fb_ico = is_ready_fb ? CLR_AMBER : CLR_MUTED;
      color bg_fb    = is_ready_fb ? CLR_AMBER_DIM : CLR_BG_CARD;
      color txt_fb   = is_ready_fb ? CLR_TXT_WHITE : CLR_TXT_LABEL;
      color c_fb_st  = is_ready_fb ? (g_ReadyFibo ? C'0,255,136' : CLR_AMBER) : CLR_MUTED;
      string s_fb    = !IsFiboActiveForSymbol() ? "OFF" : (is_ready_fb ? (g_ReadyFibo ? "GATILHO!" : "ARMADO!") : "Prox.Vela");
      
      PModuleCardH("fb_card",ox,cur,cw2,ch,c_fb_ico,bg_fb);
      PLabel("fb_n1",ox+ico_x,cur+nome_y,"FIBO"+m_dir,txt_fb,InpPanelFontSize,true);`;

const newCardLabels = `      string tf_fr_card = StringSubstr(EnumToString(g_TF_L1), 7);
      PModuleCardH("fr_card",ox,cur,cw_fr,ch,c_fr_ico,bg_fr);
      PLabel("fr_n1",ox+ico_x,cur+nome_y,show_fibo_card?("F.ROMP ["+tf_fr_card+"]"+m_dir):("FALSO ROMPIMENTO ["+tf_fr_card+"]"+m_dir),txt_fr,InpPanelFontSize,true);
      PLabel("fr_st",ox+ico_x,cur+st_y,s_fr2,c_fr_st,InpPanelFontSize,true);
      PLabel("fr_req",ox+ico_x,cur+req_y,show_fibo_card?(fr_all_ok?"Req: ✔ OK":"Req: ✖ BLOQ"):s_fr_req,is_ready_fr?c_fr_req_clr:CLR_TXT_DIM,InpPanelFontSize-2,true);
      string sr_fr=StringFormat(show_fibo_card?"%dW/%dT":"Assertividade: %dW / %dT",g_FrWins,g_FrTotal);
      if(g_FrTotal>0)sr_fr+=" ("+IntegerToString((int)((g_FrWins*100.0)/g_FrTotal))+"%)";
      PLabel("fr_wr",ox+ico_x,cur+wr_y,sr_fr,(is_ready_fr && g_FrWins>=g_FrTotal/2.0&&g_FrTotal>0)?C'0,230,118':CLR_TXT_LABEL,InpPanelFontSize-2);
   }

   if(show_fibo_card) {
      int cw2 = (pw - (pad * 2) - 4) / 2;
      int ox=px+pad-2+cw2+4;
      
      // --- VALIDAÇÃO DE LINHA CONTÍNUA E ARMADO REAL DA FIBO ---
      double nSell_chk = 0, nBuy_chk = 0;
      if(g_CachedFiboH > 0) {
         double range_chk = g_CachedFiboH - g_CachedFiboLow;
         if(range_chk >= (g_CachedFiboATR * InpFibMinRange_ATR_Multi)) {
            nSell_chk = g_CachedFiboLow + range_chk * (InpFibLevelSell / 100.0);
            nBuy_chk  = g_CachedFiboH   - range_chk * (InpFibLevelBuy / 100.0);
         }
      }
      bool fb_dir_sell_chk = (mkt_lateral || tDir == -1);
      bool fb_dir_buy_chk  = (mkt_lateral || tDir == 1);
      if(g_ModoConfluencia > 0) {
         if(!g_MG_SellAllowed) fb_dir_sell_chk = false;
         if(!g_MG_BuyAllowed)  fb_dir_buy_chk  = false;
      }
      bool fb_line_solid = (fb_dir_sell_chk && (g_ReadyFibo || (MathAbs(nSell_chk-ask_p)/_Point <= zone_p))) ||
                           (fb_dir_buy_chk  && (g_ReadyFibo || (MathAbs(bid_p-nBuy_chk)/_Point <= zone_p)));
      
      bool fb_all_ok = (!glb_blocked && IsFiboActiveForSymbol() && fb_cd && (g_CachedFiboH > 0 && g_CachedFiboLow > 0 && g_CachedFiboATR > 0));
      bool is_ready_fb = fb_all_ok && (g_ReadyFibo || (in_rd_fb && fb_line_solid));
      
      // Quando ARMADO E COM LINHA CONTÍNUA -> Amarelo (Img 2). Quando PONTILHADO/ESPERA/BLOQ -> 100% Cinza Neutro (Img 1)
      color c_fb_ico = is_ready_fb ? CLR_AMBER : CLR_MUTED;
      color bg_fb    = is_ready_fb ? CLR_AMBER_DIM : CLR_BG_CARD;
      color txt_fb   = is_ready_fb ? CLR_TXT_WHITE : CLR_TXT_LABEL;
      color c_fb_st  = is_ready_fb ? (g_ReadyFibo ? C'0,255,136' : CLR_AMBER) : CLR_MUTED;
      string s_fb    = !IsFiboActiveForSymbol() ? "OFF" : (is_ready_fb ? (g_ReadyFibo ? "GATILHO!" : "ARMADO!") : "Prox.Vela");
      
      PModuleCardH("fb_card",ox,cur,cw2,ch,c_fb_ico,bg_fb);
      PLabel("fb_n1",ox+ico_x,cur+nome_y,"FIBO [H4]"+m_dir,txt_fb,InpPanelFontSize,true);`;

if (code.includes(oldCardLabels)) {
  code = code.replace(oldCardLabels, newCardLabels);
  console.log('✔ [2/4] Timeframes adicionados nos Cards do HUD (F.ROMP [H2] e FIBO [H4])');
} else {
  console.log('❌ [2/4] oldCardLabels não encontrado');
}

// 3. AGRUPAMENTO P1/P2 NO CONTADOR DE PERDAS
const oldLossMethod = `int GetStrategyLossStatus_ByTag(string filter1, string filter2="", string excludeFilter="") {
   int losses = 0;
   static datetime last_hs_time = 0;
   if(TimeCurrent() - last_hs_time > 1) {
       HistorySelect(TimeCurrent() - (86400*3), TimeCurrent() + 1);
       last_hs_time = TimeCurrent();
   }
   
   ulong processed_pos[32];
   int proc_count = 0;
   
   for(int i = HistoryDealsTotal()-1; i >= 0; i--) {
      ulong tk = HistoryDealGetTicket(i);
      if(HistoryDealGetInteger(tk, DEAL_ENTRY) != DEAL_ENTRY_OUT || 
         HistoryDealGetInteger(tk, DEAL_MAGIC) != InpMagic || 
         HistoryDealGetString(tk, DEAL_SYMBOL) != _Symbol) continue;
      
      ulong pos_id = HistoryDealGetInteger(tk, DEAL_POSITION_ID);
      
      // Evita contar duas vezes posicoes com parciais P1 e P2 fechadas juntas
      bool already_proc = false;
      for(int p_idx = 0; p_idx < proc_count; p_idx++) {
         if(processed_pos[p_idx] == pos_id) { already_proc = true; break; }
      }
      if(already_proc) continue;
      
      string comm = HistoryDealGetString(tk, DEAL_COMMENT);
      
      // [ITEM B FIX] Se o deal de saída foi rotulado pelo MT5 como [sl ...] ou [tp ...], busca a tag original no deal de entrada
      if(StringFind(comm, "[") == 0 || (StringFind(comm, filter1) < 0 && (filter2 == "" || StringFind(comm, filter2) < 0))) {
         if(pos_id > 0) {
            for(int j = HistoryDealsTotal()-1; j >= 0; j--) {
               ulong in_tk = HistoryDealGetTicket(j);
               if(HistoryDealGetInteger(in_tk, DEAL_POSITION_ID) == pos_id && HistoryDealGetInteger(in_tk, DEAL_ENTRY) == DEAL_ENTRY_IN) {
                  comm = HistoryDealGetString(in_tk, DEAL_COMMENT);
                  break;
               }
            }
         }
      }
      
      if(StringFind(comm, filter1) < 0) continue;
      if(filter2 != "" && StringFind(comm, filter2) < 0) continue;
      if(excludeFilter != "" && StringFind(comm, excludeFilter) >= 0) continue;
      
      if(proc_count < 32) processed_pos[proc_count++] = pos_id;
      
      double p = HistoryDealGetDouble(tk, DEAL_PROFIT) + HistoryDealGetDouble(tk, DEAL_SWAP) + HistoryDealGetDouble(tk, DEAL_COMMISSION);
      if(p < -0.01) losses++; 
      else if(p >= -0.01) break;
   }
   return losses;
}`;

const newLossMethod = `int GetStrategyLossStatus_ByTag(string filter1, string filter2="", string excludeFilter="") {
   int losses = 0;
   static datetime last_hs_time = 0;
   if(TimeCurrent() - last_hs_time > 1) {
       HistorySelect(TimeCurrent() - (86400*3), TimeCurrent() + 1);
       last_hs_time = TimeCurrent();
   }
   
   ulong processed_pos[32];
   datetime processed_open_times[32];
   int proc_count = 0;
   
   for(int i = HistoryDealsTotal()-1; i >= 0; i--) {
      ulong tk = HistoryDealGetTicket(i);
      if(HistoryDealGetInteger(tk, DEAL_ENTRY) != DEAL_ENTRY_OUT || 
         HistoryDealGetInteger(tk, DEAL_MAGIC) != InpMagic || 
         HistoryDealGetString(tk, DEAL_SYMBOL) != _Symbol) continue;
      
      ulong pos_id = HistoryDealGetInteger(tk, DEAL_POSITION_ID);
      
      bool already_proc = false;
      for(int p_idx = 0; p_idx < proc_count; p_idx++) {
         if(processed_pos[p_idx] == pos_id) { already_proc = true; break; }
      }
      if(already_proc) continue;
      
      string comm = HistoryDealGetString(tk, DEAL_COMMENT);
      datetime in_time = (datetime)HistoryDealGetInteger(tk, DEAL_TIME);
      
      // [ITEM B FIX] Se o deal de saída foi rotulado pelo MT5 como [sl ...] ou [tp ...], busca a tag original e timestamp no deal de entrada
      if(pos_id > 0) {
         for(int j = HistoryDealsTotal()-1; j >= 0; j--) {
            ulong in_tk = HistoryDealGetTicket(j);
            if(HistoryDealGetInteger(in_tk, DEAL_POSITION_ID) == pos_id && HistoryDealGetInteger(in_tk, DEAL_ENTRY) == DEAL_ENTRY_IN) {
               comm = HistoryDealGetString(in_tk, DEAL_COMMENT);
               in_time = (datetime)HistoryDealGetInteger(in_tk, DEAL_TIME);
               break;
            }
         }
      }
      
      if(StringFind(comm, filter1) < 0) continue;
      if(filter2 != "" && StringFind(comm, filter2) < 0) continue;
      if(excludeFilter != "" && StringFind(comm, excludeFilter) >= 0) continue;
      
      // Agrupamento de P1 e P2: se ambas foram abertas no mesmo trade (dentro de 15 segundos), conta como 1 único loss
      bool same_trade_group = false;
      for(int p_idx = 0; p_idx < proc_count; p_idx++) {
         if(MathAbs(processed_open_times[p_idx] - in_time) <= 15) { same_trade_group = true; break; }
      }
      
      if(proc_count < 32) {
         processed_pos[proc_count] = pos_id;
         processed_open_times[proc_count] = in_time;
         proc_count++;
      }
      
      double p = HistoryDealGetDouble(tk, DEAL_PROFIT) + HistoryDealGetDouble(tk, DEAL_SWAP) + HistoryDealGetDouble(tk, DEAL_COMMISSION);
      if(p < -0.01) {
         if(!same_trade_group) losses++;
      } else if(p >= -0.01) {
         break;
      }
   }
   return losses;
}`;

if (code.includes(oldLossMethod)) {
  code = code.replace(oldLossMethod, newLossMethod);
  console.log('✔ [3/4] Agrupamento de P1/P2 unificado no contador de perdas (mesmo trade = 1 loss)');
} else {
  console.log('❌ [3/4] oldLossMethod não encontrado');
}

// 4. LIMPAR BLOCO REDUNDANTE EM DesenharLinhasAnalise
const oldRedundantBlock = `   // Armazena diagnostico em variaveis globais para o painel principal ler
   g_MG_DiagText  = diag_short;
   g_MG_DiagColor = diagClr;
   
   // Atualiza permissoes globais de confluencia
   g_MG_BuyAllowed = true;
   g_MG_SellAllowed = true;
   
   double b5[1], b2[1];
   bool chk_m15 = (g_MG_CurrentTF == PERIOD_M15);
   bool chk_h1  = (g_MG_CurrentTF == PERIOD_M15 || g_MG_CurrentTF == PERIOD_H1);
   bool chk_h2  = (g_MG_CurrentTF == PERIOD_M15 || g_MG_CurrentTF == PERIOD_H1 || g_MG_CurrentTF == PERIOD_H2);
   bool chk_h4  = (g_MG_CurrentTF == PERIOD_M15 || g_MG_CurrentTF == PERIOD_H1 || g_MG_CurrentTF == PERIOD_H2 || g_MG_CurrentTF == PERIOD_H4);

   if(chk_m15 && g_MG_hEMA50_M15 != INVALID_HANDLE && g_MG_hEMA200_M15 != INVALID_HANDLE) {
       if(CopyBuffer(g_MG_hEMA50_M15,0,0,1,b5)>0 && CopyBuffer(g_MG_hEMA200_M15,0,0,1,b2)>0) {
           if(b5[0] <= b2[0]) g_MG_BuyAllowed = false;
           if(b5[0] >= b2[0]) g_MG_SellAllowed = false;
       }
   }
   if(chk_h1 && g_MG_hEMA50_H1 != INVALID_HANDLE && g_MG_hEMA200_H1 != INVALID_HANDLE) {
       if(CopyBuffer(g_MG_hEMA50_H1,0,0,1,b5)>0 && CopyBuffer(g_MG_hEMA200_H1,0,0,1,b2)>0) {
           if(b5[0] <= b2[0]) g_MG_BuyAllowed = false;
           if(b5[0] >= b2[0]) g_MG_SellAllowed = false;
       }
   }
   if(chk_h2 && g_MG_hEMA50_H2 != INVALID_HANDLE && g_MG_hEMA200_H2 != INVALID_HANDLE) {
       if(CopyBuffer(g_MG_hEMA50_H2,0,0,1,b5)>0 && CopyBuffer(g_MG_hEMA200_H2,0,0,1,b2)>0) {
           if(b5[0] <= b2[0]) g_MG_BuyAllowed = false;
           if(b5[0] >= b2[0]) g_MG_SellAllowed = false;
       }
   }
   if(chk_h4 && g_MG_hEMA50_H4 != INVALID_HANDLE && g_MG_hEMA200_H4 != INVALID_HANDLE) {
       if(CopyBuffer(g_MG_hEMA50_H4,0,0,1,b5)>0 && CopyBuffer(g_MG_hEMA200_H4,0,0,1,b2)>0) {
           if(b5[0] <= b2[0]) g_MG_BuyAllowed = false;
           if(b5[0] >= b2[0]) g_MG_SellAllowed = false;
       }
   }

   if(g_MG_EMA50 > 0 && g_MG_EMA200 > 0) {
       if(g_MG_EMA50 <= g_MG_EMA200) g_MG_BuyAllowed = false; // Tendencia Baixa (bloqueia compra)
       if(g_MG_EMA50 >= g_MG_EMA200) g_MG_SellAllowed = false; // Tendencia Alta (bloqueia venda)
   }
   
   DesenharLegendaAnaliseMG(leg_count, leg_text, leg_color, diag_full, diagClr);`;

const newCleanBlock = `   // Armazena diagnostico em variaveis globais para o painel principal ler
   g_MG_DiagText  = diag_short;
   g_MG_DiagColor = diagClr;
   
   DesenharLegendaAnaliseMG(leg_count, leg_text, leg_color, diag_full, diagClr);`;

if (code.includes(oldRedundantBlock)) {
  code = code.replace(oldRedundantBlock, newCleanBlock);
  console.log('✔ [4/4] Bloco redundante de confluência removido de DesenharLinhasAnalise');
} else {
  console.log('❌ [4/4] oldRedundantBlock não encontrado');
}

// Salvar
fs.writeFileSync(file, code);
console.log('\n✔ ' + file + ' atualizado com sucesso!');
