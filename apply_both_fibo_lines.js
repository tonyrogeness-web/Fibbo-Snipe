const fs = require('fs');

const file = 'Fibbo_Sniper_v28.5_H2.mq5';
let code = fs.readFileSync(file, 'utf8');

console.log('=== ATUALIZANDO DESENHO DE AMBOS OS NÍVEIS DE FIBO (N1 E N2) NO GRÁFICO ===\n');

const oldDrawFiboLines = `      // Linha só vira CONTÍNUA (SOLID) se TODOS os requisitos estiverem OK (fb_all_ok == true)
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
      DrawVisualLine("Fibo_Venda",  nSell, clr_fb_muted, clr_fb_active, "▼", "[FIBO H4] Venda (" + DoubleToString(InpFibLevelSell, 1) + "%)",  fb_show_sell, fb_sell_hl);
      DrawVisualLine("Fibo_Compra", nBuy,  clr_fb_muted, clr_fb_active, "▲", "[FIBO H4] Compra (" + DoubleToString(InpFibLevelBuy, 1) + "%)", fb_show_buy,  fb_buy_hl);
   } else {
      DrawVisualLine("Fibo_Venda",  0, clrNONE, clrNONE, "", "", false, false);
      DrawVisualLine("Fibo_Compra", 0, clrNONE, clrNONE, "", "", false, false);
   }`;

const newDrawFiboLines = `      // Linha só vira CONTÍNUA (SOLID) se TODOS os requisitos estiverem OK (fb_all_ok == true)
      bool fb_sell1_hl = fb_all_ok && (fb_dir_sell && (g_ReadyFibo || (MathAbs(nSell-ask)/_Point <= zone_pts)));
      bool fb_buy1_hl  = fb_all_ok && (fb_dir_buy  && (g_ReadyFibo || (MathAbs(bid-nBuy)/_Point <= zone_pts)));
      bool fb_sell2_hl = fb_all_ok && (fb_dir_sell && (g_ReadyFibo || (MathAbs(nSell2-ask)/_Point <= zone_pts)));
      bool fb_buy2_hl  = fb_all_ok && (fb_dir_buy  && (g_ReadyFibo || (MathAbs(bid-nBuy2)/_Point <= zone_pts)));

      if(draw_lines) {
         if(g_LinhasModo == 0 && g_ViewFibo) {
            fb_show_sell = fb_dir_sell; // [DIRECIONAL] Em alta NÃO desenha venda
            fb_show_buy  = fb_dir_buy;  // [DIRECIONAL] Em baixa NÃO desenha compra
         } else if(g_LinhasModo == 1 && g_ViewFibo) {
            if(fb_sell1_hl || fb_sell2_hl) fb_show_sell = true;
            if(fb_buy1_hl  || fb_buy2_hl)  fb_show_buy  = true;
         }
      }
      
      // Limpa nomes antigos
      ObjectDelete(0, "SniperLine_Fibo_Venda"); ObjectDelete(0, "SniperText_Fibo_Venda");
      ObjectDelete(0, "SniperLine_Fibo_Compra"); ObjectDelete(0, "SniperText_Fibo_Compra");

      // Nível 1 (18.0%) e Nível 2 (38.2%) desenhados no gráfico principal
      DrawVisualLine("Fibo_V1", nSell,  clr_fb_muted, clr_fb_active, "▼", "[FIBO H4] V1 (" + DoubleToString(InpFibLevelSell, 1) + "%)",  fb_show_sell, fb_sell1_hl);
      DrawVisualLine("Fibo_C1", nBuy,   clr_fb_muted, clr_fb_active, "▲", "[FIBO H4] C1 (" + DoubleToString(InpFibLevelBuy, 1) + "%)",   fb_show_buy,  fb_buy1_hl);
      
      if(InpUseFiboH4_2) {
         DrawVisualLine("Fibo_V2", nSell2, clr_fb_muted, clr_fb_active, "▼", "[FIBO H4] V2 (" + DoubleToString(InpFibLevel2Sell, 1) + "%)", fb_show_sell, fb_sell2_hl);
         DrawVisualLine("Fibo_C2", nBuy2,  clr_fb_muted, clr_fb_active, "▲", "[FIBO H4] C2 (" + DoubleToString(InpFibLevel2Buy, 1) + "%)",  fb_show_buy,  fb_buy2_hl);
      } else {
         DrawVisualLine("Fibo_V2", 0, clrNONE, clrNONE, "", "", false, false);
         DrawVisualLine("Fibo_C2", 0, clrNONE, clrNONE, "", "", false, false);
      }
   } else {
      DrawVisualLine("Fibo_V1", 0, clrNONE, clrNONE, "", "", false, false);
      DrawVisualLine("Fibo_C1", 0, clrNONE, clrNONE, "", "", false, false);
      DrawVisualLine("Fibo_V2", 0, clrNONE, clrNONE, "", "", false, false);
      DrawVisualLine("Fibo_C2", 0, clrNONE, clrNONE, "", "", false, false);
   }`;

if (code.includes(oldDrawFiboLines)) {
  code = code.replace(oldDrawFiboLines, newDrawFiboLines);
  console.log('✔ Níveis N1 (18%) e N2 (38.2%) desenhados no gráfico principal com clareza!');
} else {
  console.log('❌ oldDrawFiboLines não encontrado');
}

fs.writeFileSync(file, code);
console.log('\n✔ ' + file + ' salvo com sucesso!');
