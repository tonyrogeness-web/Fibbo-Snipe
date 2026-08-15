const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'Fibbo_Sniper_v28.5_H2.mq5');
let content = fs.readFileSync(filePath, 'utf8');

// Trecho antigo a ser substituído
const targetCode = `   int cw_fr = show_fibo_card ? ((pw - (pad * 2) - 4) / 2) : (pw - (pad * 2));
   {
      int ox=px+pad-2;
      bool is_ready=(g_ReadyFR||in_rd_fr)&&fr_cd;
      color c_fr_st  = !InpUseFR ? CLR_MUTED : (g_ReadyFR ? C'0,255,136' : (in_rd_fr ? C'255,193,7' : C'255,107,107'));
      string s_fr2   = !InpUseFR ? "OFF" : (g_ReadyFR ? "GATILHO!" : (in_rd_fr ? "ARMADO!" : "MASTER P.A."));
      color c_fr_ico = fr_all_ok ? C'0,230,118' : CLR_RED; // Borda e Acento Verde Neon quando 100% OK (PRONTO), Vermelho se bloqueado
      color bg_fr    = fr_all_ok ? C'10,30,15' : C'30,10,12'; // Fundo Verde Translúcido quando 100% OK, Vinho quando bloqueado
      color txt_fr   = CLR_TXT_WHITE; // Título em Branco Neve Puro
      
      PModuleCardH("fr_card",ox,cur,cw_fr,ch,c_fr_ico,bg_fr);
      PLabel("fr_n1",ox+ico_x,cur+nome_y,show_fibo_card?"F.ROMP"+m_dir:"FALSO ROMPIMENTO (F.ROMP)"+m_dir,txt_fr,InpPanelFontSize,true);
      PLabel("fr_st",ox+ico_x,cur+st_y,s_fr2,c_fr_st,InpPanelFontSize,true);
      PLabel("fr_req",ox+ico_x,cur+req_y,show_fibo_card?(fr_all_ok?"Req: ✔ OK":"Req: ✖ BLOQ"):s_fr_req,c_fr_req_clr,InpPanelFontSize-2,true);
      string sr_fr=StringFormat(show_fibo_card?"%dW/%dT":"Assertividade: %dW / %dT",g_FrWins,g_FrTotal);
      if(g_FrTotal>0)sr_fr+=" ("+IntegerToString((int)((g_FrWins*100.0)/g_FrTotal))+"%)";
      PLabel("fr_wr",ox+ico_x,cur+wr_y,sr_fr,(g_FrWins>=g_FrTotal/2.0&&g_FrTotal>0)?C'0,230,118':C'220,220,220',InpPanelFontSize-2);
   }

   if(show_fibo_card) {
      int cw2 = (pw - (pad * 2) - 4) / 2;
      int ox=px+pad-2+cw2+4; color c_fb=!IsFiboActiveForSymbol()?CLR_MUTED:(fb_cd?CLR_AMBER:CLR_MUTED); string s_fb=!IsFiboActiveForSymbol()?"OFF":(g_ReadyFibo?"GATILHO!":(in_rd_fb?"ARMADO!":"Prox.Vela"));
      if(c_fb==CLR_AMBER&&!g_ReadyFibo&&!in_rd_fb)c_fb=CLR_LIGHT_GRAY; bool is_ready=(g_ReadyFibo||in_rd_fb)&&fb_cd;
      color c_fb_ico=is_ready?CLR_AMBER:c_fb; color bg_fb=is_ready?CLR_AMBER_DIM:CLR_BG_CARD; color txt_fb=is_ready?CLR_TXT_WHITE:CLR_TXT_LABEL;
      PModuleCardH("fb_card",ox,cur,cw2,ch,c_fb_ico,bg_fb);
      PLabel("fb_n1",ox+ico_x,cur+nome_y,"FIBO"+m_dir,txt_fb,InpPanelFontSize,true);
      PLabel("fb_st",ox+ico_x,cur+st_y,s_fb,c_fb_ico,InpPanelFontSize,true);
      string sr_fb=StringFormat("%dW/%dT",g_FiboWins,g_FiboTotal);
      if(g_FiboTotal>0)sr_fb+=" ("+IntegerToString((int)((g_FiboWins*100.0)/g_FiboTotal))+"%)";
      PLabel("fb_wr",ox+ico_x,cur+wr_y,sr_fb,(g_FiboWins>=g_FiboTotal/2.0&&g_FiboTotal>0)?CLR_TEAL:CLR_TXT_LABEL,InpPanelFontSize-2);
   }`;

// Novo código padronizado com CINZA quando inativo, VERMELHO quando FR armado e AMARELO quando Fibo armada
const replacementCode = `   int cw_fr = show_fibo_card ? ((pw - (pad * 2) - 4) / 2) : (pw - (pad * 2));
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
      PLabel("fb_st",ox+ico_x,cur+st_y,s_fb,c_fb_st,InpPanelFontSize,true);
      string sr_fb=StringFormat("%dW/%dT",g_FiboWins,g_FiboTotal);
      if(g_FiboTotal>0)sr_fb+=" ("+IntegerToString((int)((g_FiboWins*100.0)/g_FiboTotal))+"%)";
      PLabel("fb_wr",ox+ico_x,cur+wr_y,sr_fb,(is_ready_fb && g_FiboWins>=g_FiboTotal/2.0&&g_FiboTotal>0)?CLR_TEAL:CLR_TXT_LABEL,InpPanelFontSize-2);
   }`;

if (content.includes(targetCode)) {
  content = content.replace(targetCode, replacementCode);
  fs.writeFileSync(filePath, Buffer.from(content, 'utf8'));
  console.log('✅ Cores e estados visuais dos Cards (FR Vermelho / Fibo Amarelo / Espera Cinza) atualizados com sucesso!');
} else {
  console.log('⚠️ Target code não encontrado para substituição direta!');
}
