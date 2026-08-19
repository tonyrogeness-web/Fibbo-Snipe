const fs = require('fs');

const file = 'Fibbo_Sniper_v28.5_H2.mq5';
let code = fs.readFileSync(file, 'utf8');

console.log('=== APLICANDO A ESTRUTURA EXATA DA IMAGEM: 18.0%, 23.6% E 38.2% ===\n');

// 1. INPUTS DOS 3 NÍVEIS SNIPER
const oldInputs = `input group "=== FIBONACCI 2.0 (ALTA PRECISÃO) ==="
input bool   InpUseFiboPullback          = true;  // [FIBO 2.0] Ativar Retrações de Fibonacci
input bool   InpSmartFiboSymbolFilter    = true;  // [ROTEAMENTO INTELIGENTE] Filtro Seletivo por Moeda (Núcleo de Ouro)
input string InpFiboBlockedSymbols       = "EURCAD,EURAUD,EURUSD,EURGBP"; // Moedas com Fibo Desativada (Operam Apenas no FR)
input double InpFibLevelSell = 18.0, InpFibLevelBuy = 18.0, InpFibMinRange_ATR_Multi = 2.0, InpFib_MagneticZoneATRPct = 20.0;
input bool   InpUseFiboH4_2   = true;  // Ativar segundo nível Fibo H4
input double InpFibLevel2Sell = 38.2;  // Nível 2 Venda H4 (% retração)
input double InpFibLevel2Buy  = 38.2;  // Nível 2 Compra H4 (% retração)`;

const newInputs = `input group "=== FIBONACCI 2.0 (ALTA PRECISÃO - NÍVEIS 18%, 23.6%, 38.2%) ==="
input bool   InpUseFiboPullback          = true;  // [FIBO 2.0] Ativar Retrações de Fibonacci
input bool   InpSmartFiboSymbolFilter    = true;  // [ROTEAMENTO INTELIGENTE] Filtro Seletivo por Moeda (Núcleo de Ouro)
input string InpFiboBlockedSymbols       = "EURCAD,EURAUD,EURUSD,EURGBP"; // Moedas com Fibo Desativada (Operam Apenas no FR)
input double InpFibLevel1                = 18.0;  // Nível 1 Sniper (% base C)
input double InpFibLevel2                = 23.6;  // Nível 2 Ouro (% base C)
input double InpFibLevel3                = 38.2;  // Nível 3 Clássico (% base C)
input bool   InpUseFiboLevel1            = true;  // Ativar Nível 1 (18.0%)
input bool   InpUseFiboLevel2            = true;  // Ativar Nível 2 (23.6%)
input bool   InpUseFiboLevel3            = true;  // Ativar Nível 3 (38.2%)
input double InpFibMinRange_ATR_Multi    = 2.0;
input double InpFib_MagneticZoneATRPct   = 20.0;`;

if (code.includes(oldInputs)) {
  code = code.replace(oldInputs, newInputs);
  console.log('✔ [1/3] Inputs atualizados para os 3 níveis exatos da imagem (18%, 23.6%, 38.2%)');
} else {
  console.log('❌ [1/3] oldInputs não encontrado');
}

// 2. DESENHO DAS LINHAS NO GRÁFICO (18%, 23.6%, 38.2%)
const oldDesenho = `   // --- FIBO (Paleta Dourada Perfeitamente Proporcional ao FR) ---
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

const newDesenho = `   // --- FIBO (Estrutura Pura Ponto A -> B -> C: Níveis 18%, 23.6%, 38.2%) ---
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

if (code.includes(oldDesenho)) {
  code = code.replace(oldDesenho, newDesenho);
  console.log('✔ [2/3] Desenho das 3 linhas de Fibo (18%, 23.6%, 38.2%) no gráfico principal aplicado!');
} else {
  console.log('❌ [2/3] oldDesenho não encontrado');
}

// 3. EXECUÇÃO ON TICK MOTOR 3 FIBONACCI
const oldMotor3 = `             double gat_f = g_CachedFiboATR * (InpFib_MagneticZoneATRPct / 100.0);
             double nSell = g_CachedFiboLow + range * (InpFibLevelSell / 100.0); // Venda: repique 18% do fundo
             double nBuy  = g_CachedFiboH   - range * (InpFibLevelBuy / 100.0);  // Compra: recuo 18% do topo
             
             int t_h4 = ComputeTrendDir(hShortEMA_H4, hEMA_H4);
             bool a_ok = p_UsePassaFiltroADXFibo ? (g_H4_ADX >= cfg_ADX_MinLevel) : true;
             bool dso  = p_UseTrendDirFibo ? (t_h4 == -1) : true;
             bool dbo  = p_UseTrendDirFibo ? (t_h4 == 1) : true;
             
             if(g_ModoConfluencia > 0) {
                if(!g_MG_SellAllowed) dso = false;
                if(!g_MG_BuyAllowed)  dbo = false;
             }
             
             // [PILAR 1 & 2] Validação de Rejeição de Pavio e Teto de Penetração na Fibo
             double max_pen_fibo = (InpFib_MaxPenetrationATR > 0) ? (g_CachedFiboATR * InpFib_MaxPenetrationATR) : DBL_MAX;
             
             // Rejeição Venda Fibo (Testa nSell de baixo pra cima e rejeita pra baixo)
             bool fibo_rev_s1 = true;
             if(InpFib_RequireWickRejection) fibo_rev_s1 = IsVelaReversaoVenda(1, g_TF_L1) || (iClose(_Symbol, g_TF_L1, 0) < iOpen(_Symbol, g_TF_L1, 0));
             bool fibo_pen_s1 = ((iHigh(_Symbol, g_TF_L1, 0) - nSell) <= max_pen_fibo);
             
             // Rejeição Compra Fibo (Testa nBuy de cima pra baixo e rejeita pra cima)
             bool fibo_rev_b1 = true;
             if(InpFib_RequireWickRejection) fibo_rev_b1 = IsVelaReversaoCompra(1, g_TF_L1) || (iClose(_Symbol, g_TF_L1, 0) > iOpen(_Symbol, g_TF_L1, 0));
             bool fibo_pen_b1 = ((nBuy - iLow(_Symbol, g_TF_L1, 0)) <= max_pen_fibo);

            // [PILAR 4] TP2 Estrutural Dinâmico com Expansão de Tendência Garantida
            double tp2_fibo_sell = InpTP_Final_Multi;
            double tp2_fibo_buy  = InpTP_Final_Multi;
            if(InpFib_UseStructuralTP2 && sl_f > 0) {
               double dist_tp_sell = MathAbs(bid - g_CachedFiboLow) / _Point;
               double dist_tp_buy  = MathAbs(g_CachedFiboH - ask) / _Point;
               double r_mult_sell = dist_tp_sell / sl_f;
               double r_mult_buy  = dist_tp_buy  / sl_f;
               // Se a distância até o extremo for >= 1.5x SL (retração mais funda), mira o extremo;
               // Se for retração rasa (18%), mira a expansão cheia de tendência (InpTP_Final_Multi = 2.5x SL)!
               tp2_fibo_sell = (r_mult_sell >= 1.5) ? MathMin(InpTP_Final_Multi, r_mult_sell) : InpTP_Final_Multi;
               tp2_fibo_buy  = (r_mult_buy  >= 1.5) ? MathMin(InpTP_Final_Multi, r_mult_buy)  : InpTP_Final_Multi;
            }

             g_ReadyFibo = (a_ok && dso && v_ok && fibo_rev_s1 && fibo_pen_s1) || 
                           (a_ok && dbo && v_ok && fibo_rev_b1 && fibo_pen_b1);
             double l_h4 = ComputeLot_ByDistance(sl_f, g_CachedFiboATR);
             
             // Entradas Nível 1 Fibo
             if(a_ok && dso && MathAbs(bid - nSell) <= gat_f && fibo_rev_s1 && fibo_pen_s1 && 
                FiltroCurtoPrazo(-1, 1, PERIOD_H4, hShortEMA_H4) && v_ok && cb_h4 != f_h4_sell && 
                !JaExistePosicaoDaEstrategia("Fibo_Sell_H4")) {
                if(fibo_cd_sell && AbrirSell(l_h4, bid, sl_f, InpTP_Parcial_Multi, tp2_fibo_sell, "Fibo_Sell_H4")) { 
                   f_h4_sell = cb_h4; l_fibo_sell_ts = TimeCurrent(); 
                }
             }
             if(a_ok && dbo && MathAbs(ask - nBuy) <= gat_f && fibo_rev_b1 && fibo_pen_b1 && 
                FiltroCurtoPrazo(1, 1, PERIOD_H4, hShortEMA_H4) && v_ok && cb_h4 != f_h4_buy && 
                !JaExistePosicaoDaEstrategia("Fibo_Buy_H4")) {
                if(fibo_cd_buy && AbrirBuy(l_h4, ask, sl_f, InpTP_Parcial_Multi, tp2_fibo_buy, "Fibo_Buy_H4")) { 
                   f_h4_buy = cb_h4; l_fibo_buy_ts = TimeCurrent(); 
                }
             }
             
             // FIBO H4 — NÍVEL 2 (38.2% default)
             if(InpUseFiboH4_2) {
                double nSell2 = g_CachedFiboLow + range * (InpFibLevel2Sell / 100.0); // Venda N2: repique 38.2% do fundo
                double nBuy2  = g_CachedFiboH   - range * (InpFibLevel2Buy / 100.0);  // Compra N2: recuo 38.2% do topo
                double l_h4_2 = ComputeLot_ByDistance(sl_f, g_CachedFiboATR);
                bool fibo_pen_s2 = ((iHigh(_Symbol, g_TF_L1, 0) - nSell2) <= max_pen_fibo);
                bool fibo_pen_b2 = ((nBuy2 - iLow(_Symbol, g_TF_L1, 0)) <= max_pen_fibo);
                
                if(a_ok && dso && MathAbs(bid - nSell2) <= gat_f && fibo_rev_s1 && fibo_pen_s2 && 
                   FiltroCurtoPrazo(-1, 1, PERIOD_H4, hShortEMA_H4) && v_ok && cb_h4 != f_h4_sell && 
                   !JaExistePosicaoDaEstrategia("Fibo_Sell_H4_2")) {
                   if(fibo_cd_sell && AbrirSell(l_h4_2, bid, sl_f, InpTP_Parcial_Multi, tp2_fibo_sell, "Fibo_Sell_H4_2")) { 
                      f_h4_sell = cb_h4; l_fibo_sell_ts = TimeCurrent(); 
                   }
                }
                if(a_ok && dbo && MathAbs(ask - nBuy2) <= gat_f && fibo_rev_b1 && fibo_pen_b2 && 
                   FiltroCurtoPrazo(1, 1, PERIOD_H4, hShortEMA_H4) && v_ok && cb_h4 != f_h4_buy && 
                   !JaExistePosicaoDaEstrategia("Fibo_Buy_H4_2")) {
                   if(fibo_cd_buy && AbrirBuy(l_h4_2, ask, sl_f, InpTP_Parcial_Multi, tp2_fibo_buy, "Fibo_Buy_H4_2")) { 
                      f_h4_buy = cb_h4; l_fibo_buy_ts = TimeCurrent(); 
                   }
                }
             }`;

const newMotor3 = `             double gat_f = g_CachedFiboATR * (InpFib_MagneticZoneATRPct / 100.0);
             
             // Em ALTA: Entradas de Compra no Ponto C (18%, 23.6%, 38.2% a partir do fundo A)
             double nBuy1 = g_CachedFiboLow + range * (InpFibLevel1 / 100.0);
             double nBuy2 = g_CachedFiboLow + range * (InpFibLevel2 / 100.0);
             double nBuy3 = g_CachedFiboLow + range * (InpFibLevel3 / 100.0);

             // Em BAIXA: Entradas de Venda no Ponto C (18%, 23.6%, 38.2% a partir do topo A)
             double nSell1 = g_CachedFiboH - range * (InpFibLevel1 / 100.0);
             double nSell2 = g_CachedFiboH - range * (InpFibLevel2 / 100.0);
             double nSell3 = g_CachedFiboH - range * (InpFibLevel3 / 100.0);
             
             int t_h4 = ComputeTrendDir(hShortEMA_H4, hEMA_H4);
             bool a_ok = p_UsePassaFiltroADXFibo ? (g_H4_ADX >= cfg_ADX_MinLevel) : true;
             bool dso  = p_UseTrendDirFibo ? (t_h4 == -1) : true;
             bool dbo  = p_UseTrendDirFibo ? (t_h4 == 1) : true;
             
             if(g_ModoConfluencia > 0) {
                if(!g_MG_SellAllowed) dso = false;
                if(!g_MG_BuyAllowed)  dbo = false;
             }
             
             double max_pen_fibo = (InpFib_MaxPenetrationATR > 0) ? (g_CachedFiboATR * InpFib_MaxPenetrationATR) : DBL_MAX;
             
             bool fibo_rev_s = true;
             if(InpFib_RequireWickRejection) fibo_rev_s = IsVelaReversaoVenda(1, g_TF_L1) || (iClose(_Symbol, g_TF_L1, 0) < iOpen(_Symbol, g_TF_L1, 0));
             
             bool fibo_rev_b = true;
             if(InpFib_RequireWickRejection) fibo_rev_b = IsVelaReversaoCompra(1, g_TF_L1) || (iClose(_Symbol, g_TF_L1, 0) > iOpen(_Symbol, g_TF_L1, 0));

             // [PILAR 4] TP2 Estrutural: Alvo no Topo B (100.0%) em Alta ou Fundo B (0.0%) em Baixa
             double tp2_fibo_sell = InpTP_Final_Multi;
             double tp2_fibo_buy  = InpTP_Final_Multi;
             if(InpFib_UseStructuralTP2 && sl_f > 0) {
                double dist_tp_sell = MathAbs(bid - g_CachedFiboLow) / _Point;
                double dist_tp_buy  = MathAbs(g_CachedFiboH - ask) / _Point;
                double r_mult_sell = dist_tp_sell / sl_f;
                double r_mult_buy  = dist_tp_buy  / sl_f;
                tp2_fibo_sell = (r_mult_sell >= 1.5) ? MathMin(InpTP_Final_Multi, r_mult_sell) : InpTP_Final_Multi;
                tp2_fibo_buy  = (r_mult_buy  >= 1.5) ? MathMin(InpTP_Final_Multi, r_mult_buy)  : InpTP_Final_Multi;
             }

             bool fb_s1_pen = ((iHigh(_Symbol, g_TF_L1, 0) - nSell1) <= max_pen_fibo);
             bool fb_b1_pen = ((nBuy1 - iLow(_Symbol, g_TF_L1, 0)) <= max_pen_fibo);
             g_ReadyFibo = (a_ok && dso && v_ok && fibo_rev_s && fb_s1_pen) || 
                           (a_ok && dbo && v_ok && fibo_rev_b && fb_b1_pen);
             double l_h4 = ComputeLot_ByDistance(sl_f, g_CachedFiboATR);
             
             // --- EXECUÇÃO NÍVEL 1 (18.0%) ---
             if(InpUseFiboLevel1) {
                if(a_ok && dso && MathAbs(bid - nSell1) <= gat_f && fibo_rev_s && fb_s1_pen && 
                   FiltroCurtoPrazo(-1, 1, PERIOD_H4, hShortEMA_H4) && v_ok && cb_h4 != f_h4_sell && 
                   !JaExistePosicaoDaEstrategia("Fibo_Sell_H4_1")) {
                   if(fibo_cd_sell && AbrirSell(l_h4, bid, sl_f, InpTP_Parcial_Multi, tp2_fibo_sell, "Fibo_Sell_H4_1")) { 
                      f_h4_sell = cb_h4; l_fibo_sell_ts = TimeCurrent(); 
                   }
                }
                if(a_ok && dbo && MathAbs(ask - nBuy1) <= gat_f && fibo_rev_b && fb_b1_pen && 
                   FiltroCurtoPrazo(1, 1, PERIOD_H4, hShortEMA_H4) && v_ok && cb_h4 != f_h4_buy && 
                   !JaExistePosicaoDaEstrategia("Fibo_Buy_H4_1")) {
                   if(fibo_cd_buy && AbrirBuy(l_h4, ask, sl_f, InpTP_Parcial_Multi, tp2_fibo_buy, "Fibo_Buy_H4_1")) { 
                      f_h4_buy = cb_h4; l_fibo_buy_ts = TimeCurrent(); 
                   }
                }
             }
             
             // --- EXECUÇÃO NÍVEL 2 (23.6%) ---
             if(InpUseFiboLevel2) {
                bool fb_s2_pen = ((iHigh(_Symbol, g_TF_L1, 0) - nSell2) <= max_pen_fibo);
                bool fb_b2_pen = ((nBuy2 - iLow(_Symbol, g_TF_L1, 0)) <= max_pen_fibo);
                if(a_ok && dso && MathAbs(bid - nSell2) <= gat_f && fibo_rev_s && fb_s2_pen && 
                   FiltroCurtoPrazo(-1, 1, PERIOD_H4, hShortEMA_H4) && v_ok && cb_h4 != f_h4_sell && 
                   !JaExistePosicaoDaEstrategia("Fibo_Sell_H4_2")) {
                   if(fibo_cd_sell && AbrirSell(l_h4, bid, sl_f, InpTP_Parcial_Multi, tp2_fibo_sell, "Fibo_Sell_H4_2")) { 
                      f_h4_sell = cb_h4; l_fibo_sell_ts = TimeCurrent(); 
                   }
                }
                if(a_ok && dbo && MathAbs(ask - nBuy2) <= gat_f && fibo_rev_b && fb_b2_pen && 
                   FiltroCurtoPrazo(1, 1, PERIOD_H4, hShortEMA_H4) && v_ok && cb_h4 != f_h4_buy && 
                   !JaExistePosicaoDaEstrategia("Fibo_Buy_H4_2")) {
                   if(fibo_cd_buy && AbrirBuy(l_h4, ask, sl_f, InpTP_Parcial_Multi, tp2_fibo_buy, "Fibo_Buy_H4_2")) { 
                      f_h4_buy = cb_h4; l_fibo_buy_ts = TimeCurrent(); 
                   }
                }
             }

             // --- EXECUÇÃO NÍVEL 3 (38.2%) ---
             if(InpUseFiboLevel3) {
                bool fb_s3_pen = ((iHigh(_Symbol, g_TF_L1, 0) - nSell3) <= max_pen_fibo);
                bool fb_b3_pen = ((nBuy3 - iLow(_Symbol, g_TF_L1, 0)) <= max_pen_fibo);
                if(a_ok && dso && MathAbs(bid - nSell3) <= gat_f && fibo_rev_s && fb_s3_pen && 
                   FiltroCurtoPrazo(-1, 1, PERIOD_H4, hShortEMA_H4) && v_ok && cb_h4 != f_h4_sell && 
                   !JaExistePosicaoDaEstrategia("Fibo_Sell_H4_3")) {
                   if(fibo_cd_sell && AbrirSell(l_h4, bid, sl_f, InpTP_Parcial_Multi, tp2_fibo_sell, "Fibo_Sell_H4_3")) { 
                      f_h4_sell = cb_h4; l_fibo_sell_ts = TimeCurrent(); 
                   }
                }
                if(a_ok && dbo && MathAbs(ask - nBuy3) <= gat_f && fibo_rev_b && fb_b3_pen && 
                   FiltroCurtoPrazo(1, 1, PERIOD_H4, hShortEMA_H4) && v_ok && cb_h4 != f_h4_buy && 
                   !JaExistePosicaoDaEstrategia("Fibo_Buy_H4_3")) {
                   if(fibo_cd_buy && AbrirBuy(l_h4, ask, sl_f, InpTP_Parcial_Multi, tp2_fibo_buy, "Fibo_Buy_H4_3")) { 
                      f_h4_buy = cb_h4; l_fibo_buy_ts = TimeCurrent(); 
                   }
                }
             }`;

if (code.includes(oldMotor3)) {
  code = code.replace(oldMotor3, newMotor3);
  console.log('✔ [3/3] Motor 3 OnTick atualizado com os 3 níveis e TP2 estrutural no Topo B!');
} else {
  console.log('❌ [3/3] oldMotor3 não encontrado');
}

fs.writeFileSync(file, code);
console.log('\n✔ ' + file + ' atualizado com a geometria exata da imagem!');
