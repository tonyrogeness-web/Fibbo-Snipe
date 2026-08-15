const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'Fibbo_Sniper_v28.5_H2.mq5');
let content = fs.readFileSync(filePath, 'utf8');

const targetSection = `   int cw_fr = show_fibo_card ? ((pw - (pad * 2) - 4) / 2) : (pw - (pad * 2));
   {
      int ox=px+pad-2;
      bool is_ready_fr = InpUseFR && (g_ReadyFR || in_rd_fr) && fr_cd;
      
      // Quando ATIVO/ARMADO -> Vermelho com Borda Clara (Img 3). Quando INATIVO/ESPERA -> Cinza Neutro
      color c_fr_ico = is_ready_fr ? C'245,80,80' : CLR_MUTED;
      color bg_fr    = is_ready_fr ? C'38,14,18'  : CLR_BG_CARD;
      color txt_fr   = is_ready_fr ? CLR_TXT_WHITE : CLR_TXT_LABEL;
      color c_fr_st  = !InpUseFR ? CLR_MUTED : (g_ReadyFR ? C'0,255,136' : (in_rd_fr ? C'255,193,7' : CLR_TXT_LABEL));
      string s_fr2   = !InpUseFR ? "OFF" : (g_ReadyFR ? "GATILHO!" : (in_rd_fr ? "ARMADO!" : "Prox.Vela"));
      
      PModuleCardH("fr_card",ox,cur,cw_fr,ch,c_fr_ico,bg_fr);
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
      bool is_ready_fb = IsFiboActiveForSymbol() && (g_ReadyFibo || in_rd_fb) && fb_cd;
      
      // Quando ATIVO/ARMADO -> Amarelo/Dourado (Img 2). Quando INATIVO/ESPERA -> Cinza Neutro (Img 1)
      color c_fb_ico = is_ready_fb ? CLR_AMBER : CLR_MUTED;
      color bg_fb    = is_ready_fb ? CLR_AMBER_DIM : CLR_BG_CARD;
      color txt_fb   = is_ready_fb ? CLR_TXT_WHITE : CLR_TXT_LABEL;
      color c_fb_st  = !IsFiboActiveForSymbol() ? CLR_MUTED : (g_ReadyFibo ? C'0,255,136' : (in_rd_fb ? CLR_AMBER : CLR_TXT_LABEL));
      string s_fb    = !IsFiboActiveForSymbol() ? "OFF" : (g_ReadyFibo ? "GATILHO!" : (in_rd_fb ? "ARMADO!" : "Prox.Vela"));
      
      PModuleCardH("fb_card",ox,cur,cw2,ch,c_fb_ico,bg_fb);
      PLabel("fb_n1",ox+ico_x,cur+nome_y,"FIBO"+m_dir,txt_fb,InpPanelFontSize,true);
      PLabel("fb_st",ox+ico_x,cur+st_y,s_fb,c_fb_ico,InpPanelFontSize,true);
      string sr_fb=StringFormat("%dW/%dT",g_FiboWins,g_FiboTotal);
      if(g_FiboTotal>0)sr_fb+=" ("+IntegerToString((int)((g_FiboWins*100.0)/g_FiboTotal))+"%)";
      PLabel("fb_wr",ox+ico_x,cur+wr_y,sr_fb,(is_ready_fb && g_FiboWins>=g_FiboTotal/2.0&&g_FiboTotal>0)?CLR_TEAL:CLR_TXT_LABEL,InpPanelFontSize-2);
   }`;

const replacementSection = `   // --- VALIDAÇÃO EXATA DE LINHA CONTÍNUA / ARMADO REAL DO FR ---
   bool fr_dir_sell_chk = true, fr_dir_buy_chk = true;
   GetFR_DirecaoOk(g_CachedMedDir, g_CachedRSI, fr_dir_sell_chk, fr_dir_buy_chk);
   if(g_ModoConfluencia > 0) {
      if(!g_MG_SellAllowed) fr_dir_sell_chk = false;
      if(!g_MG_BuyAllowed)  fr_dir_buy_chk  = false;
   }
   bool fr_line_solid = (fr_dir_sell_chk && (g_ReadyFR_Sell || (MathAbs(g_CachedFRTop-ask_p)/_Point <= zone_p && g_MG_SellAllowed))) ||
                        (fr_dir_buy_chk  && (g_ReadyFR_Buy  || (MathAbs(bid_p-g_CachedFRFundo)/_Point <= zone_p && g_MG_BuyAllowed)));
   bool is_ready_fr = InpUseFR && fr_all_ok && (g_ReadyFR || (in_rd_fr && fr_line_solid));

   int cw_fr = show_fibo_card ? ((pw - (pad * 2) - 4) / 2) : (pw - (pad * 2));
   {
      int ox=px+pad-2;
      
      // Quando ARMADO E COM LINHA CONTÍNUA -> Vermelho (Img 3). Quando PONTILHADO/ESPERA -> 100% Cinza Neutro (Img 1)
      color c_fr_ico = is_ready_fr ? C'245,80,80' : CLR_MUTED;
      color bg_fr    = is_ready_fr ? C'38,14,18'  : CLR_BG_CARD;
      color txt_fr   = is_ready_fr ? CLR_TXT_WHITE : CLR_TXT_LABEL;
      color c_fr_st  = is_ready_fr ? (g_ReadyFR ? C'0,255,136' : C'255,193,7') : CLR_MUTED;
      string s_fr2   = !InpUseFR ? "OFF" : (is_ready_fr ? (g_ReadyFR ? "GATILHO!" : "ARMADO!") : "Prox.Vela");
      
      PModuleCardH("fr_card",ox,cur,cw_fr,ch,c_fr_ico,bg_fr);
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
      
      // --- VALIDAÇÃO EXATA DE LINHA CONTÍNUA / ARMADO REAL DA FIBO ---
      double nSell_chk = 0, nBuy_chk = 0;
      if(g_CachedFiboH > 0) {
         double range_chk = g_CachedFiboH - g_CachedFiboLow;
         if(range_chk >= (g_CachedFiboATR * InpFibMinRange_ATR_Multi)) {
            nSell_chk = g_CachedFiboH - range_chk * (InpFibLevelSell / 100.0);
            nBuy_chk  = g_CachedFiboLow + range_chk * (InpFibLevelBuy / 100.0);
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
      
      // Quando ARMADO E COM LINHA CONTÍNUA -> Amarelo (Img 2). Quando PONTILHADO/ESPERA -> 100% Cinza Neutro (Img 1)
      color c_fb_ico = is_ready_fb ? CLR_AMBER : CLR_MUTED;
      color bg_fb    = is_ready_fb ? CLR_AMBER_DIM : CLR_BG_CARD;
      color txt_fb   = is_ready_fb ? CLR_TXT_WHITE : CLR_TXT_LABEL;
      color c_fb_st  = is_ready_fb ? (g_ReadyFibo ? C'0,255,136' : CLR_AMBER) : CLR_MUTED;
      string s_fb    = !IsFiboActiveForSymbol() ? "OFF" : (is_ready_fb ? (g_ReadyFibo ? "GATILHO!" : "ARMADO!") : "Prox.Vela");
      
      PModuleCardH("fb_card",ox,cur,cw2,ch,c_fb_ico,bg_fb);
      PLabel("fb_n1",ox+ico_x,cur+nome_y,"FIBO"+m_dir,txt_fb,InpPanelFontSize,true);
      PLabel("fb_st",ox+ico_x,cur+st_y,s_fb,c_fb_st,InpPanelFontSize,true);
      string sr_fb=StringFormat("%dW/%dT",g_FiboWins,g_FiboTotal);
      if(g_FiboTotal>0)sr_fb+=" ("+IntegerToString((int)((g_FiboWins*100.0)/g_FiboTotal))+"%)";
      PLabel("fb_wr",ox+ico_x,cur+wr_y,sr_fb,(is_ready_fb && g_FiboWins>=g_FiboTotal/2.0&&g_FiboTotal>0)?CLR_TEAL:CLR_TXT_LABEL,InpPanelFontSize-2);
   }`;

if (content.includes(targetSection)) {
  content = content.replace(targetSection, replacementSection);
  fs.writeFileSync(filePath, Buffer.from(content, 'utf8'));
  console.log('✅ Sincronização estrita de Linhas Contínuas vs Pontilhadas aplicada com sucesso!');
} else {
  console.log('⚠️ Target section não encontrado para substituição direta!');
}
