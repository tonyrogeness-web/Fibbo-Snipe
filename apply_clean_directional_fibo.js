const fs = require('fs');

const file = 'Fibbo_Sniper_v28.5_H2.mq5';
let code = fs.readFileSync(file, 'utf8');

console.log('=== APLICANDO LIMPEZA VISUAL FIBONACCI: 28.0% + DIRECIONAL ESTRITO + APENAS A MAIS PRÓXIMA ACESA ===\n');

// 1. INPUTS
const oldInputs = `input group "=== FIBONACCI 2.0 (ALTA PRECISÃO - NÍVEIS 18%, 23.6%, 38.2%) ==="
input bool   InpUseFiboPullback          = true;  // [FIBO 2.0] Ativar Retrações de Fibonacci
input bool   InpSmartFiboSymbolFilter    = true;  // [ROTEAMENTO INTELIGENTE] Filtro Seletivo por Moeda (Núcleo de Ouro)
input string InpFiboBlockedSymbols       = "EURCAD,EURAUD,EURUSD,EURGBP"; // Moedas com Fibo Desativada (Operam Apenas no FR)
input double InpFibLevel1                = 18.0;  // Nível 1 Sniper (% base C)
input double InpFibLevel2                = 23.6;  // Nível 2 Ouro (% base C)
input double InpFibLevel3                = 38.2;  // Nível 3 Clássico (% base C)
input bool   InpUseFiboLevel1            = true;  // Ativar Nível 1 (18.0%)
input bool   InpUseFiboLevel2            = true;  // Ativar Nível 2 (23.6%)
input bool   InpUseFiboLevel3            = true;  // Ativar Nível 3 (38.2%)`;

const newInputs = `input group "=== FIBONACCI 2.0 (ALTA PRECISÃO - NÍVEIS 18%, 28%, 38.2%) ==="
input bool   InpUseFiboPullback          = true;  // [FIBO 2.0] Ativar Retrações de Fibonacci
input bool   InpSmartFiboSymbolFilter    = true;  // [ROTEAMENTO INTELIGENTE] Filtro Seletivo por Moeda (Núcleo de Ouro)
input string InpFiboBlockedSymbols       = "EURCAD,EURAUD,EURUSD,EURGBP"; // Moedas com Fibo Desativada (Operam Apenas no FR)
input double InpFibLevel1                = 18.0;  // Nível 1 Sniper (% base C)
input double InpFibLevel2                = 28.0;  // Nível 2 Médio (% base C - entre 18% e 38.2%)
input double InpFibLevel3                = 38.2;  // Nível 3 Clássico (% base C)
input bool   InpUseFiboLevel1            = true;  // Ativar Nível 1 (18.0%)
input bool   InpUseFiboLevel2            = true;  // Ativar Nível 2 (28.0%)
input bool   InpUseFiboLevel3            = true;  // Ativar Nível 3 (38.2%)`;

if (code.includes(oldInputs)) {
  code = code.replace(oldInputs, newInputs);
  console.log('✔ [1/3] Inputs atualizados com Nível 2 = 28.0%');
} else {
  console.log('❌ [1/3] oldInputs não encontrado');
}

// 2. DESENHO DAS LINHAS NO GRÁFICO (DIRECIONAL ESTRITO + APENAS MAIS PRÓXIMA ACESA)
const oldDesenho = `   // --- FIBO (Estrutura Pura Ponto A -> B -> C: Níveis 18%, 23.6%, 38.2%) ---
   color clr_fb_muted  = C'140,110,35';
   color clr_fb_active = C'240,185,45';
   
   double nSell1=0, nBuy1=0, nSell2=0, nBuy2=0, nSell3=0, nBuy3=0;
   bool fb_show_sell = false, fb_show_buy = false;
   if(IsFiboActiveForSymbol() && g_CachedFiboH > 0 && g_CachedFiboLow > 0) {
      double range = g_CachedFiboH - g_CachedFiboLow;
      if(range >= (g_CachedFiboATR * InpFibMinRange_ATR_Multi)) {
         // Em ALTA: Compra na base do pullback C (18%, 23.6%, 38.2% a partir do fundo A)
         nBuy1 = g_CachedFiboLow + range * (InpFibLevel1 / 100.0);
         nBuy2 = g_CachedFiboLow + range * (InpFibLevel2 / 100.0);
         nBuy3 = g_CachedFiboLow + range * (InpFibLevel3 / 100.0);

         // Em BAIXA: Venda no topo do repique C (18%, 23.6%, 38.2% a partir do topo A)
         nSell1 = g_CachedFiboH - range * (InpFibLevel1 / 100.0);
         nSell2 = g_CachedFiboH - range * (InpFibLevel2 / 100.0);
         nSell3 = g_CachedFiboH - range * (InpFibLevel3 / 100.0);
      }
      
      bool fb_dir_sell = (is_lateral || t_dir == -1);
      bool fb_dir_buy  = (is_lateral || t_dir == 1);
      if(g_ModoConfluencia > 0) {
         if(!g_MG_SellAllowed) fb_dir_sell = false;
         if(!g_MG_BuyAllowed) fb_dir_buy = false;
      }

      bool fb_s1_hl = fb_all_ok && fb_dir_sell && (g_ReadyFibo || (MathAbs(nSell1-ask)/_Point <= zone_pts));
      bool fb_s2_hl = fb_all_ok && fb_dir_sell && (g_ReadyFibo || (MathAbs(nSell2-ask)/_Point <= zone_pts));
      bool fb_s3_hl = fb_all_ok && fb_dir_sell && (g_ReadyFibo || (MathAbs(nSell3-ask)/_Point <= zone_pts));

      bool fb_b1_hl = fb_all_ok && fb_dir_buy  && (g_ReadyFibo || (MathAbs(bid-nBuy1)/_Point <= zone_pts));
      bool fb_b2_hl = fb_all_ok && fb_dir_buy  && (g_ReadyFibo || (MathAbs(bid-nBuy2)/_Point <= zone_pts));
      bool fb_b3_hl = fb_all_ok && fb_dir_buy  && (g_ReadyFibo || (MathAbs(bid-nBuy3)/_Point <= zone_pts));

      if(draw_lines) {
         if(g_LinhasModo == 0 && g_ViewFibo) {
            fb_show_sell = fb_dir_sell;
            fb_show_buy  = fb_dir_buy;
         } else if(g_LinhasModo == 1 && g_ViewFibo) {
            if(fb_s1_hl || fb_s2_hl || fb_s3_hl) fb_show_sell = true;
            if(fb_b1_hl || fb_b2_hl || fb_b3_hl) fb_show_buy  = true;
         }
      }
      
      // Limpa nomes antigos
      ObjectDelete(0, "SniperLine_Fibo_Venda"); ObjectDelete(0, "SniperText_Fibo_Venda");
      ObjectDelete(0, "SniperLine_Fibo_Compra"); ObjectDelete(0, "SniperText_Fibo_Compra");

      // Níveis 18.0%, 23.6% e 38.2% desenhados no gráfico principal com precisão
      if(InpUseFiboLevel1) {
         DrawVisualLine("Fibo_V1", nSell1, clr_fb_muted, clr_fb_active, "▼", "[FIBO H4] V1 (18.0%)", fb_show_sell, fb_s1_hl);
         DrawVisualLine("Fibo_C1", nBuy1,  clr_fb_muted, clr_fb_active, "▲", "[FIBO H4] C1 (18.0%)", fb_show_buy,  fb_b1_hl);
      } else { DrawVisualLine("Fibo_V1",0,clrNONE,clrNONE,"",""); DrawVisualLine("Fibo_C1",0,clrNONE,clrNONE,"",""); }

      if(InpUseFiboLevel2) {
         DrawVisualLine("Fibo_V2", nSell2, clr_fb_muted, clr_fb_active, "▼", "[FIBO H4] V2 (23.6%)", fb_show_sell, fb_s2_hl);
         DrawVisualLine("Fibo_C2", nBuy2,  clr_fb_muted, clr_fb_active, "▲", "[FIBO H4] C2 (23.6%)", fb_show_buy,  fb_b2_hl);
      } else { DrawVisualLine("Fibo_V2",0,clrNONE,clrNONE,"",""); DrawVisualLine("Fibo_C2",0,clrNONE,clrNONE,"",""); }

      if(InpUseFiboLevel3) {
         DrawVisualLine("Fibo_V3", nSell3, clr_fb_muted, clr_fb_active, "▼", "[FIBO H4] V3 (38.2%)", fb_show_sell, fb_s3_hl);
         DrawVisualLine("Fibo_C3", nBuy3,  clr_fb_muted, clr_fb_active, "▲", "[FIBO H4] C3 (38.2%)", fb_show_buy,  fb_b3_hl);
      } else { DrawVisualLine("Fibo_V3",0,clrNONE,clrNONE,"",""); DrawVisualLine("Fibo_C3",0,clrNONE,clrNONE,"",""); }
   } else {
      DrawVisualLine("Fibo_V1", 0, clrNONE, clrNONE, "", "", false, false);
      DrawVisualLine("Fibo_C1", 0, clrNONE, clrNONE, "", "", false, false);
      DrawVisualLine("Fibo_V2", 0, clrNONE, clrNONE, "", "", false, false);
      DrawVisualLine("Fibo_C2", 0, clrNONE, clrNONE, "", "", false, false);
      DrawVisualLine("Fibo_V3", 0, clrNONE, clrNONE, "", "", false, false);
      DrawVisualLine("Fibo_C3", 0, clrNONE, clrNONE, "", "", false, false);
   }`;

const newDesenho = `   // --- FIBO (Estrutura Pura Ponto A -> B -> C: Níveis 18%, 28%, 38.2%) ---
   color clr_fb_muted  = C'140,110,35';
   color clr_fb_active = C'240,185,45';
   
   double nSell1=0, nBuy1=0, nSell2=0, nBuy2=0, nSell3=0, nBuy3=0;
   bool fb_show_sell = false, fb_show_buy = false;
   bool fb_s1_hl = false, fb_s2_hl = false, fb_s3_hl = false;
   bool fb_b1_hl = false, fb_b2_hl = false, fb_b3_hl = false;

   if(IsFiboActiveForSymbol() && g_CachedFiboH > 0 && g_CachedFiboLow > 0) {
      double range = g_CachedFiboH - g_CachedFiboLow;
      if(range >= (g_CachedFiboATR * InpFibMinRange_ATR_Multi)) {
         // Em ALTA: Compra na base do pullback C (18%, 28%, 38.2% a partir do fundo A)
         nBuy1 = g_CachedFiboLow + range * (InpFibLevel1 / 100.0);
         nBuy2 = g_CachedFiboLow + range * (InpFibLevel2 / 100.0);
         nBuy3 = g_CachedFiboLow + range * (InpFibLevel3 / 100.0);

         // Em BAIXA: Venda no topo do repique C (18%, 28%, 38.2% a partir do topo A)
         nSell1 = g_CachedFiboH - range * (InpFibLevel1 / 100.0);
         nSell2 = g_CachedFiboH - range * (InpFibLevel2 / 100.0);
         nSell3 = g_CachedFiboH - range * (InpFibLevel3 / 100.0);
      }
      
      // [DIRECIONAL ESTRITO ANTI-POLUIÇÃO]
      // Em Baixa: mostra APENAS VENDA (nunca compra). Em Alta: mostra APENAS COMPRA (nunca venda).
      bool fb_dir_sell = (t_dir == -1) || (t_dir == 0 && ask > (g_CachedFiboLow + range * 0.5));
      bool fb_dir_buy  = (t_dir == 1)  || (t_dir == 0 && bid < (g_CachedFiboLow + range * 0.5));
      
      if(fb_dir_sell) fb_dir_buy = false;
      else if(fb_dir_buy) fb_dir_sell = false;

      if(g_ModoConfluencia > 0) {
         if(!g_MG_SellAllowed) fb_dir_sell = false;
         if(!g_MG_BuyAllowed)  fb_dir_buy  = false;
      }

      // [APENAS A MAIS PRÓXIMA ACESA]
      if(fb_dir_sell) {
         double ds1 = MathAbs(nSell1 - ask);
         double ds2 = MathAbs(nSell2 - ask);
         double ds3 = MathAbs(nSell3 - ask);
         double min_ds = MathMin(ds1, MathMin(ds2, ds3));
         
         fb_s1_hl = fb_all_ok && (ds1 == min_ds) && (g_ReadyFibo || (ds1/_Point <= zone_pts));
         fb_s2_hl = fb_all_ok && (ds2 == min_ds) && (g_ReadyFibo || (ds2/_Point <= zone_pts));
         fb_s3_hl = fb_all_ok && (ds3 == min_ds) && (g_ReadyFibo || (ds3/_Point <= zone_pts));
      }

      if(fb_dir_buy) {
         double db1 = MathAbs(bid - nBuy1);
         double db2 = MathAbs(bid - nBuy2);
         double db3 = MathAbs(bid - nBuy3);
         double min_db = MathMin(db1, MathMin(db2, db3));
         
         fb_b1_hl = fb_all_ok && (db1 == min_db) && (g_ReadyFibo || (db1/_Point <= zone_pts));
         fb_b2_hl = fb_all_ok && (db2 == min_db) && (g_ReadyFibo || (db2/_Point <= zone_pts));
         fb_b3_hl = fb_all_ok && (db3 == min_db) && (g_ReadyFibo || (db3/_Point <= zone_pts));
      }

      if(draw_lines) {
         if(g_LinhasModo == 0 && g_ViewFibo) {
            fb_show_sell = fb_dir_sell;
            fb_show_buy  = fb_dir_buy;
         } else if(g_LinhasModo == 1 && g_ViewFibo) {
            if(fb_s1_hl || fb_s2_hl || fb_s3_hl) fb_show_sell = true;
            if(fb_b1_hl || fb_b2_hl || fb_b3_hl) fb_show_buy  = true;
         }
      }
      
      // Limpa nomes antigos
      ObjectDelete(0, "SniperLine_Fibo_Venda"); ObjectDelete(0, "SniperText_Fibo_Venda");
      ObjectDelete(0, "SniperLine_Fibo_Compra"); ObjectDelete(0, "SniperText_Fibo_Compra");

      // Níveis 18.0%, 28.0% e 38.2% desenhados no gráfico principal com precisão direcional
      if(InpUseFiboLevel1 && fb_show_sell) DrawVisualLine("Fibo_V1", nSell1, clr_fb_muted, clr_fb_active, "▼", "[FIBO H4] V1 (18.0%)", true, fb_s1_hl);
      else DrawVisualLine("Fibo_V1", 0, clrNONE, clrNONE, "", "", false, false);

      if(InpUseFiboLevel1 && fb_show_buy)  DrawVisualLine("Fibo_C1", nBuy1,  clr_fb_muted, clr_fb_active, "▲", "[FIBO H4] C1 (18.0%)", true, fb_b1_hl);
      else DrawVisualLine("Fibo_C1", 0, clrNONE, clrNONE, "", "", false, false);

      if(InpUseFiboLevel2 && fb_show_sell) DrawVisualLine("Fibo_V2", nSell2, clr_fb_muted, clr_fb_active, "▼", "[FIBO H4] V2 (28.0%)", true, fb_s2_hl);
      else DrawVisualLine("Fibo_V2", 0, clrNONE, clrNONE, "", "", false, false);

      if(InpUseFiboLevel2 && fb_show_buy)  DrawVisualLine("Fibo_C2", nBuy2,  clr_fb_muted, clr_fb_active, "▲", "[FIBO H4] C2 (28.0%)", true, fb_b2_hl);
      else DrawVisualLine("Fibo_C2", 0, clrNONE, clrNONE, "", "", false, false);

      if(InpUseFiboLevel3 && fb_show_sell) DrawVisualLine("Fibo_V3", nSell3, clr_fb_muted, clr_fb_active, "▼", "[FIBO H4] V3 (38.2%)", true, fb_s3_hl);
      else DrawVisualLine("Fibo_V3", 0, clrNONE, clrNONE, "", "", false, false);

      if(InpUseFiboLevel3 && fb_show_buy)  DrawVisualLine("Fibo_C3", nBuy3,  clr_fb_muted, clr_fb_active, "▲", "[FIBO H4] C3 (38.2%)", true, fb_b3_hl);
      else DrawVisualLine("Fibo_C3", 0, clrNONE, clrNONE, "", "", false, false);
   } else {
      DrawVisualLine("Fibo_V1", 0, clrNONE, clrNONE, "", "", false, false);
      DrawVisualLine("Fibo_C1", 0, clrNONE, clrNONE, "", "", false, false);
      DrawVisualLine("Fibo_V2", 0, clrNONE, clrNONE, "", "", false, false);
      DrawVisualLine("Fibo_C2", 0, clrNONE, clrNONE, "", "", false, false);
      DrawVisualLine("Fibo_V3", 0, clrNONE, clrNONE, "", "", false, false);
      DrawVisualLine("Fibo_C3", 0, clrNONE, clrNONE, "", "", false, false);
   }`;

if (code.includes(oldDesenho)) {
  code = code.replace(oldDesenho, newDesenho);
  console.log('✔ [2/3] Desenho Direcional Estrito + Apenas a Mais Próxima Acesa aplicado com perfeição!');
} else {
  console.log('❌ [2/3] oldDesenho não encontrado');
}

// 3. MODO ZEN ATUALIZADO COM 28.0% E SEM POLUIÇÃO
const oldZen = `            if(InpUseFiboLevel2) DrawVisualSegment("Fibo_V2", t_col_fb2, t_col_fb2, nSell2, C'255,160,0', "▼ V FB2 H4 (23.6%)", true, t_col_fb2, g_ReadyFibo ? C'80,185,120' : C'255,160,0');
            else DrawVisualSegment("Fibo_V2", 0, 0, 0, clrNONE, "", false);`;

const newZen = `            if(InpUseFiboLevel2) DrawVisualSegment("Fibo_V2", t_col_fb2, t_col_fb2, nSell2, C'255,160,0', "▼ V FB2 H4 (28.0%)", true, t_col_fb2, g_ReadyFibo ? C'80,185,120' : C'255,160,0');
            else DrawVisualSegment("Fibo_V2", 0, 0, 0, clrNONE, "", false);`;

const oldZenBuy = `            if(InpUseFiboLevel2) DrawVisualSegment("Fibo_C2", t_col_fb2, t_col_fb2, nBuy2, C'255,160,0', "▲ C FB2 H4 (23.6%)", true, t_col_fb2, g_ReadyFibo ? C'80,185,120' : C'255,160,0');
            else DrawVisualSegment("Fibo_C2", 0, 0, 0, clrNONE, "", false);`;

const newZenBuy = `            if(InpUseFiboLevel2) DrawVisualSegment("Fibo_C2", t_col_fb2, t_col_fb2, nBuy2, C'255,160,0', "▲ C FB2 H4 (28.0%)", true, t_col_fb2, g_ReadyFibo ? C'80,185,120' : C'255,160,0');
            else DrawVisualSegment("Fibo_C2", 0, 0, 0, clrNONE, "", false);`;

if (code.includes(oldZen) && code.includes(oldZenBuy)) {
  code = code.replace(oldZen, newZen).replace(oldZenBuy, newZenBuy);
  console.log('✔ [3/3] Modo ZEN atualizado com 28.0%!');
} else {
  console.log('❌ [3/3] oldZen ou oldZenBuy não encontrado');
}

fs.writeFileSync(file, code);
console.log('\n✔ ' + file + ' salvo e pronto para compilar!');
