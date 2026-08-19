const fs = require('fs');

const file = 'Fibbo_Sniper_v28.5_H2.mq5';
let code = fs.readFileSync(file, 'utf8');

console.log('=== APLICANDO BLINDAGEM COMPLETA DOS GATILHOS FIBONACCI ===\n');

// 1. VOLUME ABSORPTION (SHIFT 1 OU SHIFT 0)
const oldVol = `         // [PILAR 3] Absorção de Volume na Retração de Fibo
         bool v_ok = true;
         if(InpFib_RequireVolumeAbsorption && g_CachedVolMed > 0) {
            long vb[1];
            if(CopyTickVolume(_Symbol, g_TF_L1, 0, 1, vb) >= 1) v_ok = ((double)vb[0] >= (g_CachedVolMed * InpFib_MinVolumeRatio));
         } else if(InpUseVolumeFilter && g_CachedVolMed > 0) {
            long vb[1];
            if(CopyTickVolume(_Symbol, g_TF_L1, 0, 1, vb) >= 1) v_ok = ((double)vb[0] > g_CachedVolMed);
         }`;

const newVol = `         // [PILAR 3] Absorção de Volume Institucional (Valida Vela Fechada [1] ou Vela Atual [0])
         bool v_ok = true;
         if(InpFib_RequireVolumeAbsorption && g_CachedVolMed > 0) {
            long vb[2];
            if(CopyTickVolume(_Symbol, g_TF_L1, 0, 2, vb) >= 2) {
               v_ok = ((double)vb[1] >= (g_CachedVolMed * InpFib_MinVolumeRatio) || (double)vb[0] >= (g_CachedVolMed * InpFib_MinVolumeRatio * 0.5));
            }
         } else if(InpUseVolumeFilter && g_CachedVolMed > 0) {
            long vb[2];
            if(CopyTickVolume(_Symbol, g_TF_L1, 0, 2, vb) >= 2) {
               v_ok = ((double)vb[1] > g_CachedVolMed || (double)vb[0] > (g_CachedVolMed * 0.5));
            }
         }`;

if (code.includes(oldVol)) {
  code = code.replace(oldVol, newVol);
  console.log('✔ [1/2] Filtro de volume institucional ajustado para reconhecer vela fechada [1] e atual [0]!');
} else {
  console.log('❌ [1/2] oldVol não encontrado');
}

// 2. G_READYFIBO PARA TODOS OS 3 NÍVEIS (NÃO APENAS NÍVEL 1)
const oldReadyFibo = `            bool fb_s1_pen = ((iHigh(_Symbol, g_TF_L1, 0) - nSell1) <= max_pen_fibo);
            bool fb_b1_pen = ((nBuy1 - iLow(_Symbol, g_TF_L1, 0)) <= max_pen_fibo);
            g_ReadyFibo = (a_ok && dso && v_ok && fibo_rev_s && fb_s1_pen) || 
                          (a_ok && dbo && v_ok && fibo_rev_b && fb_b1_pen);`;

const newReadyFibo = `            double min_l_pen = MathMin(iLow(_Symbol, g_TF_L1, 0), iLow(_Symbol, g_TF_L1, 1));
            double max_h_pen = MathMax(iHigh(_Symbol, g_TF_L1, 0), iHigh(_Symbol, g_TF_L1, 1));
            bool fb_s1_pen = ((max_h_pen - nSell1) <= max_pen_fibo);
            bool fb_b1_pen = ((nBuy1 - min_l_pen) <= max_pen_fibo);
            bool fb_s2_pen = ((max_h_pen - nSell2) <= max_pen_fibo);
            bool fb_b2_pen = ((nBuy2 - min_l_pen) <= max_pen_fibo);
            bool fb_s3_pen = ((max_h_pen - nSell3) <= max_pen_fibo);
            bool fb_b3_pen = ((nBuy3 - min_l_pen) <= max_pen_fibo);

            bool fb_pen_s_any = (InpUseFiboLevel1 && fb_s1_pen) || (InpUseFiboLevel2 && fb_s2_pen) || (InpUseFiboLevel3 && fb_s3_pen);
            bool fb_pen_b_any = (InpUseFiboLevel1 && fb_b1_pen) || (InpUseFiboLevel2 && fb_b2_pen) || (InpUseFiboLevel3 && fb_b3_pen);

            g_ReadyFibo = (a_ok && dso && v_ok && fibo_rev_s && fb_pen_s_any) || 
                          (a_ok && dbo && v_ok && fibo_rev_b && fb_pen_b_any);`;

if (code.includes(oldReadyFibo)) {
  code = code.replace(oldReadyFibo, newReadyFibo);
  console.log('✔ [2/2] g_ReadyFibo agora reconhece o gatilho em qualquer um dos 3 níveis (18%, 28%, 38.2%)!');
} else {
  console.log('❌ [2/2] oldReadyFibo não encontrado');
}

fs.writeFileSync(file, code);

// Sincroniza com as pastas de Experts do MT5
const expertPaths = [
  'C:\\Users\\tony\\AppData\\Roaming\\MetaQuotes\\Terminal\\59C07D676775FCCF79E223EC24AB0D86\\MQL5\\Experts\\Fibbo_Sniper_v28.5_H2.mq5',
  'C:\\Users\\tony\\AppData\\Roaming\\MetaQuotes\\Terminal\\10CE948A1DFC9A8C27E56E827008EBD4\\MQL5\\Experts\\Fibbo_Sniper_v28.5_H2.mq5'
];
expertPaths.forEach(p => {
  try {
    fs.writeFileSync(p, fs.readFileSync(file));
    console.log('✔ .MQ5 sincronizado em:', p);
  } catch (err) {
    console.log('Erro ao salvar em:', p, err.message);
  }
});

console.log('\n✔ ' + file + ' salvo e sincronizado com sucesso!');
