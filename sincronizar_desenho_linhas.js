const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'Fibbo_Sniper_v28.5_H2.mq5');
let content = fs.readFileSync(filePath, 'utf8');

const targetStart = 'void DesenharLinhasChart() {';
const targetEnd = '// ZONAS VISUAIS (MODO ZEN SINCRO INTELIGENTE)';

const startIdx = content.indexOf(targetStart);
const endIdx = content.indexOf(targetEnd);

if (startIdx !== -1 && endIdx !== -1) {
  const replacement = `void DesenharLinhasChart() {
   if(g_LocalGlobalBlock || g_LocalBlocked || g_BotPaused) return;
   bool is_lateral = IsMercadoLateral(); int t_dir = g_CachedTrendDir;
   color cor_h = C'28,85,58', cor_l = C'28,85,58'; string sym_h = is_lateral ? "▼" : "▲", sym_l = is_lateral ? "▲" : "▼";
   double ask = SymbolInfoDouble(_Symbol,SYMBOL_ASK), bid = SymbolInfoDouble(_Symbol,SYMBOL_BID); double zone_pts = (g_CachedATR > 0) ? (g_CachedATR / _Point) * 2.0 : 0;
   
   // --- CHECAGEM GERAL DE REQUISITOS (SE HOUVER BLOQUEIO, NENHUMA LINHA VIRA CONTÍNUA) ---
   int cur_spread = (int)SymbolInfoInteger(_Symbol, SYMBOL_SPREAD);
   int max_spread = InpMaxSpread;
   bool d_sess = !IsHorarioSessao();
   bool d_spr  = (cur_spread > max_spread);
   bool d_liq  = IsLowLiquidityWindow(), d_osc = IsLowOscillationWindow();
   bool d_not  = g_CachedNoticiaBlock, d_cax = g_LocalConsolidation;
   bool d_mpos = (g_FastNPos >= InpMaxSimultaneousOps || (g_NPosDay >= InpMaxDayTrades && g_NPosSwingFR >= InpMaxFRSwingTrades && g_NPosSwingFibo >= InpMaxFiboTrades));
   bool glb_blocked = (d_sess || d_spr || d_liq || d_osc || d_not || d_cax || d_mpos);

   bool fr_all_ok = (!glb_blocked && InpUseFR && g_CachedFrCdOk && (g_CachedFRTop > 0 && g_CachedFRFundo > 0));
   bool fb_all_ok = (!glb_blocked && IsFiboActiveForSymbol() && g_CachedFiboCdOk && (g_CachedFiboH > 0 && g_CachedFiboLow > 0 && g_CachedFiboATR > 0));

   // Quando o modo ZEN estiver ativado (g_ViewZonas == true), as linhas normais somem para dar lugar exclusivo à análise ZEN
   bool draw_lines = (!g_ViewZonas && g_LinhasModo != 2);
   
   // --- FR (Falso Rompimento) ---
   bool fr_dir_sell = true, fr_dir_buy = true;
   GetFR_DirecaoOk(g_CachedMedDir, g_CachedRSI, fr_dir_sell, fr_dir_buy);
   if(g_ModoConfluencia > 0) {
      if(!g_MG_SellAllowed) fr_dir_sell = false;
      if(!g_MG_BuyAllowed) fr_dir_buy = false;
   }

   // Linha só vira CONTÍNUA (SOLID) se TODOS os requisitos estiverem OK (fr_all_ok == true)
   bool fr_top_hl = fr_all_ok && (fr_dir_sell && (g_ReadyFR_Sell || (MathAbs(g_CachedFRTop-ask)/_Point <= zone_pts && g_MG_SellAllowed)));
   bool fr_bot_hl = fr_all_ok && (fr_dir_buy  && (g_ReadyFR_Buy  || (MathAbs(bid-g_CachedFRFundo)/_Point <= zone_pts && g_MG_BuyAllowed)));
   
   bool fr_show_top = false, fr_show_bot = false;
   if(draw_lines) {
      if(g_LinhasModo == 0 && g_ViewFR) {
         fr_show_top = true;
         fr_show_bot = true;
      } else if(g_LinhasModo == 1 && g_ViewFR) {
         if(fr_top_hl) fr_show_top = true;
         if(fr_bot_hl) fr_show_bot = true;
      }
   }
   if(InpUseFR && g_CachedFRTop > 0) {
      DrawVisualLine("FR_Topo",  g_CachedFRTop,   C'120,45,45', "▼", "[FR] Topo",  fr_top_hl ? STYLE_SOLID : STYLE_DOT, 1, fr_show_top, fr_top_hl);
      DrawVisualLine("FR_Fundo", g_CachedFRFundo, C'120,45,45', "▲", "[FR] Fundo", fr_bot_hl ? STYLE_SOLID : STYLE_DOT, 1, fr_show_bot, fr_bot_hl);
   } else {
      DrawVisualLine("FR_Topo",  0, clrNONE, "", "");
      DrawVisualLine("FR_Fundo", 0, clrNONE, "", "");
   }

   // --- FIBO (Pullback Fibonacci) ---
   double nSell=0, nBuy=0, nSell2=0, nBuy2=0;
   bool fb_show_sell = false, fb_show_buy = false;
   if(IsFiboActiveForSymbol() && g_CachedFiboH > 0) {
      double range = g_CachedFiboH - g_CachedFiboLow;
      if(range >= (g_CachedFiboATR * InpFibMinRange_ATR_Multi)) {
         nSell = g_CachedFiboH - range * (InpFibLevelSell / 100.0);
         nBuy  = g_CachedFiboLow + range * (InpFibLevelBuy / 100.0);
         nSell2 = g_CachedFiboH - range * (InpFibLevel2Sell / 100.0);
         nBuy2  = g_CachedFiboLow + range * (InpFibLevel2Buy / 100.0);
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
   }
   
   `;

  content = content.slice(0, startIdx) + replacement + content.slice(endIdx);
  fs.writeFileSync(filePath, Buffer.from(content, 'utf8'));
  console.log('✅ DesenharLinhasChart sincronizado com fr_all_ok e fb_all_ok com sucesso!');
} else {
  console.log('⚠️ Marcadores não encontrados!');
}
