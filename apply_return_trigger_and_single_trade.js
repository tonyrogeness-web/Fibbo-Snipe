const fs = require('fs');

const file = 'Fibbo_Sniper_v28.5_H2.mq5';
let code = fs.readFileSync(file, 'utf8');

console.log('=== APLICANDO REGRA: ENTRADA NA VOLTA DO PULLBACK + LIMITE DE 1 OPERAÇÃO ÚNICA ===\n');

const oldExecBlock = `            // --- EXECUÇÃO NÍVEL 1 (18.0%) ---
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

const newExecBlock = `            // [REGRA SNIPER]: Apenas UMA operação de Fibo aberta por vez no par
            bool tem_fibo_aberta = JaExistePosicaoDaEstrategia("Fibo_");

            // [REGRA DO GATILHO]: O preço passou pelo nível (furou) e na volta da tendência dispara!
            // Compra: iLow furou nBuy1 e o preço atual (Ask) está voltando para cima do nível com confirmação
            bool volta_b1 = (iLow(_Symbol, g_TF_L1, 0) <= nBuy1 + gat_f) && (ask >= nBuy1 - gat_f * 0.5) && fibo_rev_b && fb_b1_pen;
            // Venda: iHigh furou nSell1 e o preço atual (Bid) está voltando para baixo do nível com confirmação
            bool volta_s1 = (iHigh(_Symbol, g_TF_L1, 0) >= nSell1 - gat_f) && (bid <= nSell1 + gat_f * 0.5) && fibo_rev_s && fb_s1_pen;

            // --- EXECUÇÃO NÍVEL 1 (18.0%) ---
            if(InpUseFiboLevel1 && !tem_fibo_aberta) {
               if(a_ok && dso && volta_s1 && FiltroCurtoPrazo(-1, 1, PERIOD_H4, hShortEMA_H4) && v_ok && cb_h4 != f_h4_sell) {
                  if(fibo_cd_sell && AbrirSell(l_h4, bid, sl_f, InpTP_Parcial_Multi, tp2_fibo_sell, "Fibo_Sell_H4_1")) { 
                     f_h4_sell = cb_h4; l_fibo_sell_ts = TimeCurrent(); 
                  }
               }
               if(a_ok && dbo && volta_b1 && FiltroCurtoPrazo(1, 1, PERIOD_H4, hShortEMA_H4) && v_ok && cb_h4 != f_h4_buy) {
                  if(fibo_cd_buy && AbrirBuy(l_h4, ask, sl_f, InpTP_Parcial_Multi, tp2_fibo_buy, "Fibo_Buy_H4_1")) { 
                     f_h4_buy = cb_h4; l_fibo_buy_ts = TimeCurrent(); 
                  }
               }
            }
            
            // --- EXECUÇÃO NÍVEL 2 (23.6%) ---
            tem_fibo_aberta = JaExistePosicaoDaEstrategia("Fibo_");
            bool fb_s2_pen = ((iHigh(_Symbol, g_TF_L1, 0) - nSell2) <= max_pen_fibo);
            bool fb_b2_pen = ((nBuy2 - iLow(_Symbol, g_TF_L1, 0)) <= max_pen_fibo);
            bool volta_b2 = (iLow(_Symbol, g_TF_L1, 0) <= nBuy2 + gat_f) && (ask >= nBuy2 - gat_f * 0.5) && fibo_rev_b && fb_b2_pen;
            bool volta_s2 = (iHigh(_Symbol, g_TF_L1, 0) >= nSell2 - gat_f) && (bid <= nSell2 + gat_f * 0.5) && fibo_rev_s && fb_s2_pen;

            if(InpUseFiboLevel2 && !tem_fibo_aberta) {
               if(a_ok && dso && volta_s2 && FiltroCurtoPrazo(-1, 1, PERIOD_H4, hShortEMA_H4) && v_ok && cb_h4 != f_h4_sell) {
                  if(fibo_cd_sell && AbrirSell(l_h4, bid, sl_f, InpTP_Parcial_Multi, tp2_fibo_sell, "Fibo_Sell_H4_2")) { 
                     f_h4_sell = cb_h4; l_fibo_sell_ts = TimeCurrent(); 
                  }
               }
               if(a_ok && dbo && volta_b2 && FiltroCurtoPrazo(1, 1, PERIOD_H4, hShortEMA_H4) && v_ok && cb_h4 != f_h4_buy) {
                  if(fibo_cd_buy && AbrirBuy(l_h4, ask, sl_f, InpTP_Parcial_Multi, tp2_fibo_buy, "Fibo_Buy_H4_2")) { 
                     f_h4_buy = cb_h4; l_fibo_buy_ts = TimeCurrent(); 
                  }
               }
            }

            // --- EXECUÇÃO NÍVEL 3 (38.2%) ---
            tem_fibo_aberta = JaExistePosicaoDaEstrategia("Fibo_");
            bool fb_s3_pen = ((iHigh(_Symbol, g_TF_L1, 0) - nSell3) <= max_pen_fibo);
            bool fb_b3_pen = ((nBuy3 - iLow(_Symbol, g_TF_L1, 0)) <= max_pen_fibo);
            bool volta_b3 = (iLow(_Symbol, g_TF_L1, 0) <= nBuy3 + gat_f) && (ask >= nBuy3 - gat_f * 0.5) && fibo_rev_b && fb_b3_pen;
            bool volta_s3 = (iHigh(_Symbol, g_TF_L1, 0) >= nSell3 - gat_f) && (bid <= nSell3 + gat_f * 0.5) && fibo_rev_s && fb_s3_pen;

            if(InpUseFiboLevel3 && !tem_fibo_aberta) {
               if(a_ok && dso && volta_s3 && FiltroCurtoPrazo(-1, 1, PERIOD_H4, hShortEMA_H4) && v_ok && cb_h4 != f_h4_sell) {
                  if(fibo_cd_sell && AbrirSell(l_h4, bid, sl_f, InpTP_Parcial_Multi, tp2_fibo_sell, "Fibo_Sell_H4_3")) { 
                     f_h4_sell = cb_h4; l_fibo_sell_ts = TimeCurrent(); 
                  }
               }
               if(a_ok && dbo && volta_b3 && FiltroCurtoPrazo(1, 1, PERIOD_H4, hShortEMA_H4) && v_ok && cb_h4 != f_h4_buy) {
                  if(fibo_cd_buy && AbrirBuy(l_h4, ask, sl_f, InpTP_Parcial_Multi, tp2_fibo_buy, "Fibo_Buy_H4_3")) { 
                     f_h4_buy = cb_h4; l_fibo_buy_ts = TimeCurrent(); 
                  }
               }
            }`;

if (code.includes(oldExecBlock)) {
  code = code.replace(oldExecBlock, newExecBlock);
  console.log('✔ Regra aplicada: "Passou pelo nível, na volta entra" + "Apenas 1 operação aberta em um dos 3 níveis"!');
} else {
  console.log('❌ oldExecBlock não encontrado');
}

fs.writeFileSync(file, code);
console.log('\n✔ ' + file + ' salvo com sucesso!');
