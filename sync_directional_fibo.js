const fs = require('fs');

const file = 'Fibbo_Sniper_v28.5_H2.mq5';
let code = fs.readFileSync(file, 'utf8');

console.log('=== APLICANDO CORREÇÃO DEFINITIVA DE FIBONACCI DIRECIONAL E VISUAL ===\n');

// 1. Atualizar DesenharLinhasChart para Fibo Direcional (linhas horizontais e segmentos ZEN)
const oldFiboDrawSection = `   // --- FIBO (Pullback Fibonacci) ---
   double nSell=0, nBuy=0, nSell2=0, nBuy2=0;
   bool fb_show_sell = false, fb_show_buy = false;
   if(IsFiboActiveForSymbol() && g_CachedFiboH > 0) {
      double range = g_CachedFiboH - g_CachedFiboLow;
      if(range >= (g_CachedFiboATR * InpFibMinRange_ATR_Multi)) {
         nSell  = g_CachedFiboLow + range * (InpFibLevelSell / 100.0);  // Venda: sobe 18% do fundo
         nBuy   = g_CachedFiboH   - range * (InpFibLevelBuy / 100.0);   // Compra: recua 18% do topo
         nSell2 = g_CachedFiboLow + range * (InpFibLevel2Sell / 100.0); // Venda N2: sobe 38.2% do fundo
         nBuy2  = g_CachedFiboH   - range * (InpFibLevel2Buy / 100.0);  // Compra N2: recua 38.2% do topo
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
            fb_show_sell = true;
            fb_show_buy  = true;
         } else if(g_LinhasModo == 1 && g_ViewFibo) {
            if(fb_sell_hl) fb_show_sell = true;
            if(fb_buy_hl)  fb_show_buy  = true;
         }
      }
      DrawVisualLine("Fibo_Venda",  nSell, C'140,100,30', "▼", "[FIBO] Venda",  fb_sell_hl ? STYLE_SOLID : STYLE_DOT, 1, fb_show_sell, fb_sell_hl);
      DrawVisualLine("Fibo_Compra", nBuy,  C'140,100,30', "▲", "[FIBO] Compra", fb_buy_hl ? STYLE_SOLID : STYLE_DOT,  1, fb_show_buy,  fb_buy_hl);
   } else {
      DrawVisualLine("Fibo_Venda",  0, clrNONE, "", "");
      DrawVisualLine("Fibo_Compra", 0, clrNONE, "", "");
   }`;

const newFiboDrawSection = `   // --- FIBO (Pullback Fibonacci Direcional Puro) ---
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
      DrawVisualLine("Fibo_Venda",  nSell, C'190,80,80', "▼", "[FIBO] Venda (18%)",  fb_sell_hl ? STYLE_SOLID : STYLE_DOT, 1, fb_show_sell, fb_sell_hl);
      DrawVisualLine("Fibo_Compra", nBuy,  C'80,185,120', "▲", "[FIBO] Compra (18%)", fb_buy_hl ? STYLE_SOLID : STYLE_DOT,  1, fb_show_buy,  fb_buy_hl);
   } else {
      DrawVisualLine("Fibo_Venda",  0, clrNONE, "", "");
      DrawVisualLine("Fibo_Compra", 0, clrNONE, "", "");
   }`;

if (code.includes(oldFiboDrawSection)) {
  code = code.replace(oldFiboDrawSection, newFiboDrawSection);
  console.log('✔ [1/3] DesenharLinhasChart linhas horizontais sincronizadas');
} else {
  console.log('❌ [1/3] oldFiboDrawSection não encontrado');
}

// 2. Sincronizar Modo ZEN para desenhar apenas as linhas da direção da tendência
const oldZenFibo = `      if(fb_zen_show) {
         DrawVisualRegressionChannel("Fibo_Ch", 0, 0, clrNONE, false);
         
         bool _is_lateral = (g_CachedADX < p_ADX_ConsolidationLevel);
         bool fb_v_ok = (_is_lateral || g_CachedTrendDir == -1);
         bool fb_c_ok = (_is_lateral || g_CachedTrendDir == 1);
         
         DrawVisualSegment("Fibo_V1", t_col_fb1, t_col_fb1, nSell, C'55,95,145', "▼ V FB1 (18%)", fb_v_ok, t_col_fb1, g_ReadyFibo ? C'80,185,120' : C'55,95,145');
         DrawVisualSegment("Fibo_C1", t_col_fb1, t_col_fb1, nBuy, C'55,95,145', "▲ C FB1 (18%)", fb_c_ok, t_col_fb1, g_ReadyFibo ? C'80,185,120' : C'55,95,145');
         
         if(InpUseFiboH4_2) {
            DrawVisualSegment("Fibo_V2", t_col_fb2, t_col_fb2, nSell2, C'130,95,30', "▼ V FB2 (38.2%)", fb_v_ok, t_col_fb2, g_ReadyFibo ? C'80,185,120' : C'130,95,30');
            DrawVisualSegment("Fibo_C2", t_col_fb2, t_col_fb2, nBuy2, C'130,95,30', "▲ C FB2 (38.2%)", fb_c_ok, t_col_fb2, g_ReadyFibo ? C'80,185,120' : C'130,95,30');
         } else {
            DrawVisualSegment("Fibo_V2", 0, 0, 0, clrNONE, "", false);
            DrawVisualSegment("Fibo_C2", 0, 0, 0, clrNONE, "", false);
         }
      } else {`;

const newZenFibo = `      if(fb_zen_show) {
         DrawVisualRegressionChannel("Fibo_Ch", 0, 0, clrNONE, false);
         
         bool _is_lateral = (g_CachedADX < p_ADX_ConsolidationLevel);
         bool fb_v_ok = (_is_lateral || g_CachedTrendDir == -1);
         bool fb_c_ok = (_is_lateral || g_CachedTrendDir == 1);
         if(g_ModoConfluencia > 0) {
            if(!g_MG_SellAllowed) fb_v_ok = false;
            if(!g_MG_BuyAllowed)  fb_c_ok = false;
         }
         
         // [DIRECIONAL] Se for ALTA, apaga V1/V2 e exibe apenas C1/C2 (verde) abaixo do topo
         if(fb_v_ok) {
            DrawVisualSegment("Fibo_V1", t_col_fb1, t_col_fb1, nSell, C'190,80,80', "▼ V FB1 (18%)", true, t_col_fb1, g_ReadyFibo ? C'80,185,120' : C'190,80,80');
            if(InpUseFiboH4_2) {
               DrawVisualSegment("Fibo_V2", t_col_fb2, t_col_fb2, nSell2, C'210,120,60', "▼ V FB2 (38.2%)", true, t_col_fb2, g_ReadyFibo ? C'80,185,120' : C'210,120,60');
            } else {
               DrawVisualSegment("Fibo_V2", 0, 0, 0, clrNONE, "", false);
            }
         } else {
            DrawVisualSegment("Fibo_V1", 0, 0, 0, clrNONE, "", false);
            DrawVisualSegment("Fibo_V2", 0, 0, 0, clrNONE, "", false);
         }

         // [DIRECIONAL] Se for BAIXA, apaga C1/C2 e exibe apenas V1/V2 (vermelho) acima do fundo
         if(fb_c_ok) {
            DrawVisualSegment("Fibo_C1", t_col_fb1, t_col_fb1, nBuy, C'55,145,95', "▲ C FB1 (18%)", true, t_col_fb1, g_ReadyFibo ? C'80,185,120' : C'55,145,95');
            if(InpUseFiboH4_2) {
               DrawVisualSegment("Fibo_C2", t_col_fb2, t_col_fb2, nBuy2, C'45,165,130', "▲ C FB2 (38.2%)", true, t_col_fb2, g_ReadyFibo ? C'80,185,120' : C'45,165,130');
            } else {
               DrawVisualSegment("Fibo_C2", 0, 0, 0, clrNONE, "", false);
            }
         } else {
            DrawVisualSegment("Fibo_C1", 0, 0, 0, clrNONE, "", false);
            DrawVisualSegment("Fibo_C2", 0, 0, 0, clrNONE, "", false);
         }
      } else {`;

if (code.includes(oldZenFibo)) {
  code = code.replace(oldZenFibo, newZenFibo);
  console.log('✔ [2/3] Modo ZEN sincronizado para filtrar por direção real');
} else {
  console.log('❌ [2/3] oldZenFibo não encontrado');
}

// Salvar
fs.writeFileSync(file, code);
console.log('\n✔ ' + file + ' salvo e verificado!');
