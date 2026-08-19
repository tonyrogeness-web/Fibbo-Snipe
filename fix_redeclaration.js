const fs = require('fs');

const file = 'Fibbo_Sniper_v28.5_H2.mq5';
let code = fs.readFileSync(file, 'utf8');

console.log('=== CORRIGINDO DECLARAÇÃO DUPLICADA DE VARIÁVEIS NA FIBONACCI ===\n');

// Bloco atual com re-declarações
const oldBlock = `            // --- EXECUÇÃO NÍVEL 2 (28.0%) ---
            tem_fibo_aberta = JaExistePosicaoDaEstrategia("Fibo_");
            bool fb_s2_pen = ((max_h_chk - nSell2) <= max_pen_fibo);
            bool fb_b2_pen = ((nBuy2 - min_l_chk) <= max_pen_fibo);
            bool volta_b2 = (min_l_chk <= nBuy2 + gat_f) && (ask >= nBuy2 - gat_f * 0.5) && fibo_rev_b && fb_b2_pen;
            bool volta_s2 = (max_h_chk >= nSell2 - gat_f) && (bid <= nSell2 + gat_f * 0.5) && fibo_rev_s && fb_s2_pen;

            if(InpUseFiboLevel2 && !tem_fibo_aberta) {
               if(a_ok && dso && volta_s2 && v_ok && cb_h4 != f_h4_sell) {
                  if(fibo_cd_sell && AbrirSell(l_h4, bid, sl_f, InpTP_Parcial_Multi, tp2_fibo_sell, "Fibo_Sell_H4_2")) { 
                     f_h4_sell = cb_h4; l_fibo_sell_ts = TimeCurrent(); 
                  }
               }
               if(a_ok && dbo && volta_b2 && v_ok && cb_h4 != f_h4_buy) {
                  if(fibo_cd_buy && AbrirBuy(l_h4, ask, sl_f, InpTP_Parcial_Multi, tp2_fibo_buy, "Fibo_Buy_H4_2")) { 
                     f_h4_buy = cb_h4; l_fibo_buy_ts = TimeCurrent(); 
                  }
               }
            }

            // --- EXECUÇÃO NÍVEL 3 (38.2%) ---
            tem_fibo_aberta = JaExistePosicaoDaEstrategia("Fibo_");
            bool fb_s3_pen = ((max_h_chk - nSell3) <= max_pen_fibo);
            bool fb_b3_pen = ((nBuy3 - min_l_chk) <= max_pen_fibo);
            bool volta_b3 = (min_l_chk <= nBuy3 + gat_f) && (ask >= nBuy3 - gat_f * 0.5) && fibo_rev_b && fb_b3_pen;
            bool volta_s3 = (max_h_chk >= nSell3 - gat_f) && (bid <= nSell3 + gat_f * 0.5) && fibo_rev_s && fb_s3_pen;`;

const newBlock = `            // --- EXECUÇÃO NÍVEL 2 (28.0%) ---
            tem_fibo_aberta = JaExistePosicaoDaEstrategia("Fibo_");
            bool volta_b2 = (min_l_chk <= nBuy2 + gat_f) && (ask >= nBuy2 - gat_f * 0.5) && fibo_rev_b && fb_b2_pen;
            bool volta_s2 = (max_h_chk >= nSell2 - gat_f) && (bid <= nSell2 + gat_f * 0.5) && fibo_rev_s && fb_s2_pen;

            if(InpUseFiboLevel2 && !tem_fibo_aberta) {
               if(a_ok && dso && volta_s2 && v_ok && cb_h4 != f_h4_sell) {
                  if(fibo_cd_sell && AbrirSell(l_h4, bid, sl_f, InpTP_Parcial_Multi, tp2_fibo_sell, "Fibo_Sell_H4_2")) { 
                     f_h4_sell = cb_h4; l_fibo_sell_ts = TimeCurrent(); 
                  }
               }
               if(a_ok && dbo && volta_b2 && v_ok && cb_h4 != f_h4_buy) {
                  if(fibo_cd_buy && AbrirBuy(l_h4, ask, sl_f, InpTP_Parcial_Multi, tp2_fibo_buy, "Fibo_Buy_H4_2")) { 
                     f_h4_buy = cb_h4; l_fibo_buy_ts = TimeCurrent(); 
                  }
               }
            }

            // --- EXECUÇÃO NÍVEL 3 (38.2%) ---
            tem_fibo_aberta = JaExistePosicaoDaEstrategia("Fibo_");
            bool volta_b3 = (min_l_chk <= nBuy3 + gat_f) && (ask >= nBuy3 - gat_f * 0.5) && fibo_rev_b && fb_b3_pen;
            bool volta_s3 = (max_h_chk >= nSell3 - gat_f) && (bid <= nSell3 + gat_f * 0.5) && fibo_rev_s && fb_s3_pen;`;

if (code.includes(oldBlock)) {
  code = code.replace(oldBlock, newBlock);
  console.log('✔ Re-declarações de variáveis removidas com sucesso!');
} else {
  console.log('❌ oldBlock não encontrado');
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
