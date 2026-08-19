const fs = require('fs');

const file = 'Fibbo_Sniper_v28.5_H2.mq5';
let code = fs.readFileSync(file, 'utf8');

console.log('=== APLICANDO BLINDAGEM DE TP2 EXPANSÃO E LABELS DINÂMICOS NO MODO ZEN ===\n');

// 1. LABELS DINÂMICOS NO MODO ZEN
const oldZenLabels = `         // [DIRECIONAL] Em Tendência de BAIXA: exibe V1 e V2 em Amarelo/Âmbar acima do fundo
         if(fb_v_ok) {
            DrawVisualSegment("Fibo_V1", t_col_fb1, t_col_fb1, nSell, C'255,193,7', "▼ V FB1 H4 (18%)", true, t_col_fb1, g_ReadyFibo ? C'80,185,120' : C'255,193,7');
            if(InpUseFiboH4_2) {
               DrawVisualSegment("Fibo_V2", t_col_fb2, t_col_fb2, nSell2, C'255,160,0', "▼ V FB2 H4 (38.2%)", true, t_col_fb2, g_ReadyFibo ? C'80,185,120' : C'255,160,0');
            } else {
               DrawVisualSegment("Fibo_V2", 0, 0, 0, clrNONE, "", false);
            }
         } else {
            DrawVisualSegment("Fibo_V1", 0, 0, 0, clrNONE, "", false);
            DrawVisualSegment("Fibo_V2", 0, 0, 0, clrNONE, "", false);
         }

         // [DIRECIONAL] Em Tendência de ALTA: exibe C1 e C2 em Amarelo/Âmbar abaixo do topo
         if(fb_c_ok) {
            DrawVisualSegment("Fibo_C1", t_col_fb1, t_col_fb1, nBuy, C'255,193,7', "▲ C FB1 H4 (18%)", true, t_col_fb1, g_ReadyFibo ? C'80,185,120' : C'255,193,7');
            if(InpUseFiboH4_2) {
               DrawVisualSegment("Fibo_C2", t_col_fb2, t_col_fb2, nBuy2, C'255,160,0', "▲ C FB2 H4 (38.2%)", true, t_col_fb2, g_ReadyFibo ? C'80,185,120' : C'255,160,0');
            } else {
               DrawVisualSegment("Fibo_C2", 0, 0, 0, clrNONE, "", false);
            }
         } else {
            DrawVisualSegment("Fibo_C1", 0, 0, 0, clrNONE, "", false);
            DrawVisualSegment("Fibo_C2", 0, 0, 0, clrNONE, "", false);
         }`;

const newZenLabels = `         // [DIRECIONAL] Em Tendência de BAIXA: exibe V1 e V2 em Amarelo/Âmbar acima do fundo
         if(fb_v_ok) {
            DrawVisualSegment("Fibo_V1", t_col_fb1, t_col_fb1, nSell, C'255,193,7', "▼ V FB1 H4 (" + DoubleToString(InpFibLevelSell, 1) + "%)", true, t_col_fb1, g_ReadyFibo ? C'80,185,120' : C'255,193,7');
            if(InpUseFiboH4_2) {
               DrawVisualSegment("Fibo_V2", t_col_fb2, t_col_fb2, nSell2, C'255,160,0', "▼ V FB2 H4 (" + DoubleToString(InpFibLevel2Sell, 1) + "%)", true, t_col_fb2, g_ReadyFibo ? C'80,185,120' : C'255,160,0');
            } else {
               DrawVisualSegment("Fibo_V2", 0, 0, 0, clrNONE, "", false);
            }
         } else {
            DrawVisualSegment("Fibo_V1", 0, 0, 0, clrNONE, "", false);
            DrawVisualSegment("Fibo_V2", 0, 0, 0, clrNONE, "", false);
         }

         // [DIRECIONAL] Em Tendência de ALTA: exibe C1 e C2 em Amarelo/Âmbar abaixo do topo
         if(fb_c_ok) {
            DrawVisualSegment("Fibo_C1", t_col_fb1, t_col_fb1, nBuy, C'255,193,7', "▲ C FB1 H4 (" + DoubleToString(InpFibLevelBuy, 1) + "%)", true, t_col_fb1, g_ReadyFibo ? C'80,185,120' : C'255,193,7');
            if(InpUseFiboH4_2) {
               DrawVisualSegment("Fibo_C2", t_col_fb2, t_col_fb2, nBuy2, C'255,160,0', "▲ C FB2 H4 (" + DoubleToString(InpFibLevel2Buy, 1) + "%)", true, t_col_fb2, g_ReadyFibo ? C'80,185,120' : C'255,160,0');
            } else {
               DrawVisualSegment("Fibo_C2", 0, 0, 0, clrNONE, "", false);
            }
         } else {
            DrawVisualSegment("Fibo_C1", 0, 0, 0, clrNONE, "", false);
            DrawVisualSegment("Fibo_C2", 0, 0, 0, clrNONE, "", false);
         }`;

if (code.includes(oldZenLabels)) {
  code = code.replace(oldZenLabels, newZenLabels);
  console.log('✔ [1/2] Labels do Modo ZEN atualizados para formato 100% dinâmico!');
} else {
  console.log('❌ [1/2] oldZenLabels não encontrado');
}

// 2. TP2 ESTRUTURAL COM EXPANSÃO DE TENDÊNCIA GARANTIDA
const oldTP2Calc = `            // [PILAR 4] TP2 Estrutural Dinâmico mirando o topo/fundo da pernada Fibo (0.0%)
            double tp2_fibo_sell = InpTP_Final_Multi;
            double tp2_fibo_buy  = InpTP_Final_Multi;
            if(InpFib_UseStructuralTP2 && sl_f > 0) {
               double dist_tp_sell = MathAbs(bid - g_CachedFiboLow) / _Point;
               double dist_tp_buy  = MathAbs(g_CachedFiboH - ask) / _Point;
               tp2_fibo_sell = MathMax(InpTP_Min_Multi, MathMin(InpTP_Final_Multi, dist_tp_sell / sl_f));
               tp2_fibo_buy  = MathMax(InpTP_Min_Multi, MathMin(InpTP_Final_Multi, dist_tp_buy / sl_f));
            }`;

const newTP2Calc = `            // [PILAR 4] TP2 Estrutural Dinâmico com Expansão de Tendência Garantida
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
            }`;

if (code.includes(oldTP2Calc)) {
  code = code.replace(oldTP2Calc, newTP2Calc);
  console.log('✔ [2/2] TP2 Estrutural blindado com Expansão de Tendência quando retração for rasa (18%)!');
} else {
  console.log('❌ [2/2] oldTP2Calc não encontrado');
}

fs.writeFileSync(file, code);
console.log('\n✔ ' + file + ' salvo com sucesso!');
