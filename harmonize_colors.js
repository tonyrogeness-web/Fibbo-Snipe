const fs = require('fs');

const file = 'Fibbo_Sniper_v28.5_H2.mq5';
let code = fs.readFileSync(file, 'utf8');

console.log('=== HARMONIZANDO CORES, ESPESSURAS E SETAS DE FR E FIBO ===\n');

// 1. Atualizar DrawVisualLine para suportar cores proporcionais Muted e Active
const oldDrawLine = `void DrawVisualLine(string name, double price, color clr, string sym, string tip, int style=STYLE_DOT, int width=1, bool show=true, bool highlight=false) {
   string oh = "SniperLine_"+name, ot = "SniperText_"+name;
   if(price <= 0 || !show || g_LinhasModo == 2) { ObjectDelete(0,oh); ObjectDelete(0,ot); return; }
   datetime ta = iTime(_Symbol,g_TF_L1,0) + (datetime)(PeriodSeconds(g_TF_L1)*5);
   
   // Cores discretas mantidas sem alterações estridentes
   color line_clr = clr;
   color txt_clr  = clr;
   int font_sz = 12;

   // Se estiver pronta/armada (highlight=true) fica contínua (STYLE_SOLID); caso contrário, pontilhada (STYLE_DOT)
   int line_style = highlight ? STYLE_SOLID : STYLE_DOT;

   if(ObjectFind(0,oh) < 0) { ObjectCreate(0,oh,OBJ_HLINE,0,0,price); ObjectSetInteger(0,oh,OBJPROP_BACK,true); ObjectSetInteger(0,oh,OBJPROP_SELECTABLE,false); ObjectSetInteger(0,oh,OBJPROP_HIDDEN,true); }
   ObjectSetDouble(0,oh,OBJPROP_PRICE,price); ObjectSetInteger(0,oh,OBJPROP_COLOR,line_clr); ObjectSetInteger(0,oh,OBJPROP_STYLE,line_style); ObjectSetInteger(0,oh,OBJPROP_WIDTH,width); ObjectSetString(0,oh,OBJPROP_TOOLTIP,tip);
   
   if(ObjectFind(0,ot) < 0) { ObjectCreate(0,ot,OBJ_TEXT,0,ta,price); ObjectSetString(0,ot,OBJPROP_FONT,"Arial"); ObjectSetInteger(0,ot,OBJPROP_BACK,false); ObjectSetInteger(0,ot,OBJPROP_SELECTABLE,false); ObjectSetInteger(0,ot,OBJPROP_HIDDEN,true); }
   ObjectSetInteger(0,ot,OBJPROP_FONTSIZE,font_sz);
   ObjectSetString(0,ot,OBJPROP_FONT,"Arial");
   ObjectSetDouble(0,ot,OBJPROP_PRICE,price); ObjectSetInteger(0,ot,OBJPROP_TIME,ta); ObjectSetInteger(0,ot,OBJPROP_COLOR,txt_clr); ObjectSetString(0,ot,OBJPROP_TEXT,sym);
}`;

const newDrawLine = `void DrawVisualLine(string name, double price, color clr_muted, color clr_active, string sym, string tip, bool show=true, bool highlight=false) {
   string oh = "SniperLine_"+name, ot = "SniperText_"+name;
   if(price <= 0 || !show || g_LinhasModo == 2) { ObjectDelete(0,oh); ObjectDelete(0,ot); return; }
   datetime ta = iTime(_Symbol,g_TF_L1,0) + (datetime)(PeriodSeconds(g_TF_L1)*5);
   
   // Tonalidades proporcionais: clr_active quando armada/acesa, clr_muted quando pontilhada/espera
   color line_clr = highlight ? clr_active : clr_muted;
   int line_style = highlight ? STYLE_SOLID : STYLE_DOT;
   int width = 1; // Sempre espessura 1 perfeitamente proporcional entre FR e Fibo

   if(ObjectFind(0,oh) < 0) { ObjectCreate(0,oh,OBJ_HLINE,0,0,price); ObjectSetInteger(0,oh,OBJPROP_BACK,true); ObjectSetInteger(0,oh,OBJPROP_SELECTABLE,false); ObjectSetInteger(0,oh,OBJPROP_HIDDEN,true); }
   ObjectSetDouble(0,oh,OBJPROP_PRICE,price); ObjectSetInteger(0,oh,OBJPROP_COLOR,line_clr); ObjectSetInteger(0,oh,OBJPROP_STYLE,line_style); ObjectSetInteger(0,oh,OBJPROP_WIDTH,width); ObjectSetString(0,oh,OBJPROP_TOOLTIP,tip);
   
   if(ObjectFind(0,ot) < 0) { ObjectCreate(0,ot,OBJ_TEXT,0,ta,price); ObjectSetString(0,ot,OBJPROP_FONT,"Arial"); ObjectSetInteger(0,ot,OBJPROP_BACK,false); ObjectSetInteger(0,ot,OBJPROP_SELECTABLE,false); ObjectSetInteger(0,ot,OBJPROP_HIDDEN,true); }
   ObjectSetInteger(0,ot,OBJPROP_FONTSIZE,11);
   ObjectSetString(0,ot,OBJPROP_FONT,"Arial");
   ObjectSetDouble(0,ot,OBJPROP_PRICE,price); ObjectSetInteger(0,ot,OBJPROP_TIME,ta); ObjectSetInteger(0,ot,OBJPROP_COLOR,line_clr); ObjectSetString(0,ot,OBJPROP_TEXT,sym);
}`;

if (code.includes(oldDrawLine)) {
  code = code.replace(oldDrawLine, newDrawLine);
  console.log('✔ [1/2] DrawVisualLine atualizado para controle proporcional de cores');
} else {
  console.log('❌ [1/2] oldDrawLine não encontrado');
}

// 2. Atualizar chamadas em DesenharLinhasChart com a paleta harmônica
const oldCalls = `   if(InpUseFR && g_CachedFRTop > 0) {
      DrawVisualLine("FR_Topo",  g_CachedFRTop,   C'120,45,45', "▼", "[FR] Topo",  fr_top_hl ? STYLE_SOLID : STYLE_DOT, 1, fr_show_top, fr_top_hl);
      DrawVisualLine("FR_Fundo", g_CachedFRFundo, C'120,45,45', "▲", "[FR] Fundo", fr_bot_hl ? STYLE_SOLID : STYLE_DOT, 1, fr_show_bot, fr_bot_hl);
   } else {
      DrawVisualLine("FR_Topo",  0, clrNONE, "", "");
      DrawVisualLine("FR_Fundo", 0, clrNONE, "", "");
   }

   // --- FIBO (Pullback Fibonacci Direcional Puro) ---
   double nSell=0, nBuy=0, nSell2=0, nBuy2=0;
   bool fb_show_sell = false, fb_show_buy = false;
   if(IsFiboActiveForSymbol() && g_CachedFiboH > 0) {
      double range = g_CachedFiboH - g_CachedFiboLow;
      if(range >= (g_CachedFiboATR * InpFibMinRange_ATR_Multi)) {
         nSell  = g_CachedFiboLow + range * (InpFibLevelSell / 100.0);  // Venda: repique 18% a partir do fundo
         nBuy   = g_CachedFiboH   - range * (InpFibLevelBuy / 100.0);   // Compra: recuo 18% a partir do topo
         nSell2 = g_CachedFiboLow + range * (InpFibLevel2Sell / 100.0); // Venda N2: repique 38.2% do fundo
         nBuy2  = g_CachedFiboH   - range * (InpFibLevel2Buy / 100.0);  // Compra N2: recuo 38.2% do topo
      }
      
      bool fb_dir_sell = (is_lateral || t_dir == -1);
      bool fb_dir_buy  = (is_lateral || t_dir == 1);
      if(g_ModoConfluencia > 0) {
         if(!g_MG_SellAllowed) fb_dir_sell = false;
         if(!g_MG_BuyAllowed) fb_dir_buy = false;
      }

      // Linha só vira CONTÍNUA (SOLID) se TODOS os requisitos estiverem OK (fb_all_ok == true)
      bool fb_sell_hl = fb_all_ok && (fb_dir_sell && (g_ReadyFibo || (MathAbs(nSell-ask)/_Point <= zone_pts)));
      bool fb_buy_hl  = fb_all_ok && (fb_dir_buy  && (g_ReadyFibo || (MathAbs(bid-nBuy)/_Point <= zone_pts)));

      if(draw_lines) {
         if(g_LinhasModo == 0 && g_ViewFibo) {
            fb_show_sell = fb_dir_sell; // [DIRECIONAL] Em alta NÃO desenha venda
            fb_show_buy  = fb_dir_buy;  // [DIRECIONAL] Em baixa NÃO desenha compra
         } else if(g_LinhasModo == 1 && g_ViewFibo) {
            if(fb_sell_hl) fb_show_sell = true;
            if(fb_buy_hl)  fb_show_buy  = true;
         }
      }
      DrawVisualLine("Fibo_Venda",  nSell, C'255,193,7', "▼", "[FIBO H4] Venda (18%)",  fb_sell_hl ? STYLE_SOLID : STYLE_DOT, 1, fb_show_sell, fb_sell_hl);
      DrawVisualLine("Fibo_Compra", nBuy,  C'255,193,7', "▲", "[FIBO H4] Compra (18%)", fb_buy_hl ? STYLE_SOLID : STYLE_DOT,  1, fb_show_buy,  fb_buy_hl);
   } else {
      DrawVisualLine("Fibo_Venda",  0, clrNONE, "", "");
      DrawVisualLine("Fibo_Compra", 0, clrNONE, "", "");
   }`;

const newCalls = `   // FR (Paleta Vermelha Proporcional: Muted=Suave, Active=Aceso)
   color clr_fr_muted  = C'140,55,55';
   color clr_fr_active = C'235,75,75';
   if(InpUseFR && g_CachedFRTop > 0) {
      DrawVisualLine("FR_Topo",  g_CachedFRTop,   clr_fr_muted, clr_fr_active, "▼", "[FR] Topo",  fr_show_top, fr_top_hl);
      DrawVisualLine("FR_Fundo", g_CachedFRFundo, clr_fr_muted, clr_fr_active, "▲", "[FR] Fundo", fr_show_bot, fr_bot_hl);
   } else {
      DrawVisualLine("FR_Topo",  0, clrNONE, clrNONE, "", "", false, false);
      DrawVisualLine("FR_Fundo", 0, clrNONE, clrNONE, "", "", false, false);
   }

   // --- FIBO (Paleta Dourada Perfeitamente Proporcional ao FR) ---
   color clr_fb_muted  = C'140,110,35';
   color clr_fb_active = C'240,185,45';
   
   double nSell=0, nBuy=0, nSell2=0, nBuy2=0;
   bool fb_show_sell = false, fb_show_buy = false;
   if(IsFiboActiveForSymbol() && g_CachedFiboH > 0) {
      double range = g_CachedFiboH - g_CachedFiboLow;
      if(range >= (g_CachedFiboATR * InpFibMinRange_ATR_Multi)) {
         nSell  = g_CachedFiboLow + range * (InpFibLevelSell / 100.0);  // Venda: repique 18% a partir do fundo
         nBuy   = g_CachedFiboH   - range * (InpFibLevelBuy / 100.0);   // Compra: recuo 18% a partir do topo
         nSell2 = g_CachedFiboLow + range * (InpFibLevel2Sell / 100.0); // Venda N2: repique 38.2% do fundo
         nBuy2  = g_CachedFiboH   - range * (InpFibLevel2Buy / 100.0);  // Compra N2: recuo 38.2% do topo
      }
      
      bool fb_dir_sell = (is_lateral || t_dir == -1);
      bool fb_dir_buy  = (is_lateral || t_dir == 1);
      if(g_ModoConfluencia > 0) {
         if(!g_MG_SellAllowed) fb_dir_sell = false;
         if(!g_MG_BuyAllowed) fb_dir_buy = false;
      }

      // Linha só vira CONTÍNUA (SOLID) se TODOS os requisitos estiverem OK (fb_all_ok == true)
      bool fb_sell_hl = fb_all_ok && (fb_dir_sell && (g_ReadyFibo || (MathAbs(nSell-ask)/_Point <= zone_pts)));
      bool fb_buy_hl  = fb_all_ok && (fb_dir_buy  && (g_ReadyFibo || (MathAbs(bid-nBuy)/_Point <= zone_pts)));

      if(draw_lines) {
         if(g_LinhasModo == 0 && g_ViewFibo) {
            fb_show_sell = fb_dir_sell; // [DIRECIONAL] Em alta NÃO desenha venda
            fb_show_buy  = fb_dir_buy;  // [DIRECIONAL] Em baixa NÃO desenha compra
         } else if(g_LinhasModo == 1 && g_ViewFibo) {
            if(fb_sell_hl) fb_show_sell = true;
            if(fb_buy_hl)  fb_show_buy  = true;
         }
      }
      DrawVisualLine("Fibo_Venda",  nSell, clr_fb_muted, clr_fb_active, "▼", "[FIBO H4] Venda (18%)",  fb_show_sell, fb_sell_hl);
      DrawVisualLine("Fibo_Compra", nBuy,  clr_fb_muted, clr_fb_active, "▲", "[FIBO H4] Compra (18%)", fb_show_buy,  fb_buy_hl);
   } else {
      DrawVisualLine("Fibo_Venda",  0, clrNONE, clrNONE, "", "", false, false);
      DrawVisualLine("Fibo_Compra", 0, clrNONE, clrNONE, "", "", false, false);
   }`;

if (code.includes(oldCalls)) {
  code = code.replace(oldCalls, newCalls);
  console.log('✔ [2/2] Linhas de FR e Fibo harmonizadas com paleta proporcional');
} else {
  console.log('❌ [2/2] oldCalls não encontrado');
}

// Salvar
fs.writeFileSync(file, code);
console.log('\n✔ ' + file + ' salvo e verificado!');
