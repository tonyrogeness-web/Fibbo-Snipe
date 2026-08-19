const fs = require('fs');

const file = 'Fibbo_Sniper_v28.5_H2.mq5';
let code = fs.readFileSync(file, 'utf8');

console.log('=== APLICANDO ARQUITETURA SNIPER FIBO (18% + 38.2%) ===\n');

// 1. Atualizar Inputs
const oldInputs = 'input double InpFibLevelSell = 61.8, InpFibLevelBuy = 61.8, InpFibMinRange_ATR_Multi = 2.0, InpFib_MagneticZoneATRPct = 20.0;';
const newInputs = 'input double InpFibLevelSell = 18.0, InpFibLevelBuy = 18.0, InpFibMinRange_ATR_Multi = 2.0, InpFib_MagneticZoneATRPct = 20.0; // Nível 1: 18% Retração Rápida';

if (code.includes(oldInputs)) {
  code = code.replace(oldInputs, newInputs);
  console.log('✔ [1/5] Inputs atualizados para Nível 1 = 18.0%');
} else {
  console.log('❌ [1/5] oldInputs não encontrado');
}

// 2. Fórmulas em DesenharLinhasChart
// nSell (Venda): Preço sobe 18% a partir do fundo (Low + Range * 0.18)
// nBuy (Compra): Preço recua 18% a partir do topo (High - Range * 0.18)
// nSell2 (Venda N2): Preço sobe 38.2% a partir do fundo (Low + Range * 0.382)
// nBuy2 (Compra N2): Preço recua 38.2% a partir do topo (High - Range * 0.382)

const oldChartCalc = `         nSell = g_CachedFiboH - range * (InpFibLevelSell / 100.0);
         nBuy  = g_CachedFiboLow + range * (InpFibLevelBuy / 100.0);
         nSell2 = g_CachedFiboH - range * (InpFibLevel2Sell / 100.0);
         nBuy2  = g_CachedFiboLow + range * (InpFibLevel2Buy / 100.0);`;

const newChartCalc = `         nSell  = g_CachedFiboLow + range * (InpFibLevelSell / 100.0);  // Venda: sobe 18% do fundo
         nBuy   = g_CachedFiboH   - range * (InpFibLevelBuy / 100.0);   // Compra: recua 18% do topo
         nSell2 = g_CachedFiboLow + range * (InpFibLevel2Sell / 100.0); // Venda N2: sobe 38.2% do fundo
         nBuy2  = g_CachedFiboH   - range * (InpFibLevel2Buy / 100.0);  // Compra N2: recua 38.2% do topo`;

if (code.includes(oldChartCalc)) {
  code = code.replace(oldChartCalc, newChartCalc);
  console.log('✔ [2a/5] Fórmulas em DesenharLinhasChart alinhadas');
} else {
  console.log('❌ [2a/5] oldChartCalc não encontrado');
}

// Atualizar Rótulos no Gráfico (18% e 38.2%)
const oldLabels = `         DrawVisualSegment("Fibo_V1", t_col_fb1, t_col_fb1, nSell, C'55,95,145', "▼ V FB1", fb_v_ok, t_col_fb1, g_ReadyFibo ? C'80,185,120' : C'55,95,145');
         DrawVisualSegment("Fibo_C1", t_col_fb1, t_col_fb1, nBuy, C'55,95,145', "▲ C FB1", fb_c_ok, t_col_fb1, g_ReadyFibo ? C'80,185,120' : C'55,95,145');
         
         if(InpUseFiboH4_2) {
            DrawVisualSegment("Fibo_V2", t_col_fb2, t_col_fb2, nSell2, C'130,95,30', "▼ V FB2", fb_v_ok, t_col_fb2, g_ReadyFibo ? C'80,185,120' : C'130,95,30');
            DrawVisualSegment("Fibo_C2", t_col_fb2, t_col_fb2, nBuy2, C'130,95,30', "▲ C FB2", fb_c_ok, t_col_fb2, g_ReadyFibo ? C'80,185,120' : C'130,95,30');
         }`;

const newLabels = `         DrawVisualSegment("Fibo_V1", t_col_fb1, t_col_fb1, nSell, C'55,95,145', "▼ V FB1 (18%)", fb_v_ok, t_col_fb1, g_ReadyFibo ? C'80,185,120' : C'55,95,145');
         DrawVisualSegment("Fibo_C1", t_col_fb1, t_col_fb1, nBuy, C'55,95,145', "▲ C FB1 (18%)", fb_c_ok, t_col_fb1, g_ReadyFibo ? C'80,185,120' : C'55,95,145');
         
         if(InpUseFiboH4_2) {
            DrawVisualSegment("Fibo_V2", t_col_fb2, t_col_fb2, nSell2, C'130,95,30', "▼ V FB2 (38.2%)", fb_v_ok, t_col_fb2, g_ReadyFibo ? C'80,185,120' : C'130,95,30');
            DrawVisualSegment("Fibo_C2", t_col_fb2, t_col_fb2, nBuy2, C'130,95,30', "▲ C FB2 (38.2%)", fb_c_ok, t_col_fb2, g_ReadyFibo ? C'80,185,120' : C'130,95,30');
         }`;

if (code.includes(oldLabels)) {
  code = code.replace(oldLabels, newLabels);
  console.log('✔ [2b/5] Rótulos de linhas no gráfico atualizados');
} else {
  console.log('❌ [2b/5] oldLabels não encontrado');
}

// 3. Fórmulas no Radar do Painel / Validação
const oldRadar = `            double nS=g_CachedFiboH-r_f*(InpFibLevelSell/100.0),nB=g_CachedFiboLow+r_f*(InpFibLevelBuy/100.0);`;
const newRadar = `            double nS=g_CachedFiboLow+r_f*(InpFibLevelSell/100.0),nB=g_CachedFiboH-r_f*(InpFibLevelBuy/100.0);`;
if (code.includes(oldRadar)) {
  code = code.replace(oldRadar, newRadar);
  console.log('✔ [3a/5] Radar do painel atualizado');
} else {
  console.log('❌ [3a/5] oldRadar não encontrado');
}

const oldChk = `            nSell_chk = g_CachedFiboH - range_chk * (InpFibLevelSell / 100.0);
            nBuy_chk  = g_CachedFiboLow + range_chk * (InpFibLevelBuy / 100.0);`;
const newChk = `            nSell_chk = g_CachedFiboLow + range_chk * (InpFibLevelSell / 100.0);
            nBuy_chk  = g_CachedFiboH   - range_chk * (InpFibLevelBuy / 100.0);`;
if (code.includes(oldChk)) {
  code = code.replace(oldChk, newChk);
  console.log('✔ [3b/5] Validação de linha contínua do painel atualizada');
} else {
  console.log('❌ [3b/5] oldChk não encontrado');
}

// 4. Fórmulas em OnTick (Execução de Operações)
const oldTickFibo = `            double nSell = g_CachedFiboH - range * (InpFibLevelSell / 100.0);
            double nBuy  = g_CachedFiboLow + range * (InpFibLevelBuy / 100.0);`;
const newTickFibo = `            double nSell = g_CachedFiboLow + range * (InpFibLevelSell / 100.0); // Venda: sobe 18% do fundo
            double nBuy  = g_CachedFiboH   - range * (InpFibLevelBuy / 100.0);  // Compra: recua 18% do topo`;
if (code.includes(oldTickFibo)) {
  code = code.replace(oldTickFibo, newTickFibo);
  console.log('✔ [4a/5] OnTick Nível 1 atualizado');
} else {
  console.log('❌ [4a/5] oldTickFibo não encontrado');
}

const oldTickFibo2 = `               double nSell2 = g_CachedFiboH - range * (InpFibLevel2Sell / 100.0);
               double nBuy2  = g_CachedFiboLow + range * (InpFibLevel2Buy / 100.0);`;
const newTickFibo2 = `               double nSell2 = g_CachedFiboLow + range * (InpFibLevel2Sell / 100.0); // Venda N2: sobe 38.2% do fundo
               double nBuy2  = g_CachedFiboH   - range * (InpFibLevel2Buy / 100.0);  // Compra N2: recua 38.2% do topo`;
if (code.includes(oldTickFibo2)) {
  code = code.replace(oldTickFibo2, newTickFibo2);
  console.log('✔ [4b/5] OnTick Nível 2 atualizado');
} else {
  console.log('❌ [4b/5] oldTickFibo2 não encontrado');
}

// Salvar
fs.writeFileSync(file, code);
console.log('\n✔ ' + file + ' atualizado com sucesso com o setup 18% + 38.2%!');

// 5. Atualizar Arquivos .set
const files = fs.readdirSync('.').filter(f => f.endsWith('.set'));
files.forEach(f => {
  let buf = fs.readFileSync(f);
  let isUtf16 = buf[0] === 0xFF && buf[1] === 0xFE;
  let str = isUtf16 ? buf.toString('utf16le') : buf.toString('utf8');
  str = str.replace(/InpFibLevelSell=(61\.8|18\.0|18)/g, 'InpFibLevelSell=18.0');
  str = str.replace(/InpFibLevelBuy=(61\.8|18\.0|18)/g, 'InpFibLevelBuy=18.0');
  str = str.replace(/InpFibLevel2Sell=(38\.2|38)/g, 'InpFibLevel2Sell=38.2');
  str = str.replace(/InpFibLevel2Buy=(38\.2|38)/g, 'InpFibLevel2Buy=38.2');
  let outBuf = isUtf16 ? Buffer.from(str, 'utf16le') : Buffer.from(str, 'utf8');
  fs.writeFileSync(f, outBuf);
  console.log('✔ .set atualizado com 18% + 38.2%:', f);
});
