const fs = require('fs');

const file = 'Fibbo_Sniper_v28.5_H2.mq5';
let code = fs.readFileSync(file, 'utf8');

console.log('=== APLICANDO REFINAMENTO C NO PAINEL DE DIAGNÓSTICO ===\n');

const targetStr = `       // [BLINDAGEM 2 & 3] Pavio 40% e Mid-Channel Lock
       DROW_DYN("Pavio Mínimo 40%", InpFR_RequireMinWick40 ? "ATIVO" : "OFF", false);
       DROW_DYN("Mid-Channel Lock", InpFR_UseMidChannelLock ? "ATIVO" : "OFF", false);`;

const replacementStr = `       // [BLINDAGEM 2 & 3] Pavio 40% e Mid-Channel Lock
       bool wick40_active = (InpFR_RequireMinWick40 && InpFR_RequireWickRejection);
       DROW_DYN("Pavio Mínimo 40%", wick40_active ? "ATIVO" : "OFF", !wick40_active);
       DROW_DYN("Mid-Channel Lock", InpFR_UseMidChannelLock ? "ATIVO" : "OFF", false);`;

if (code.includes(targetStr)) {
  code = code.replace(targetStr, replacementStr);
  console.log('✔ Item C aplicado com sucesso!');
} else {
  console.log('❌ targetStr não encontrado');
}

fs.writeFileSync(file, code);

// Sincronizar com as pastas de Experts do MT5
const expertPaths = [
  'C:\\Users\\tony\\AppData\\Roaming\\MetaQuotes\\Terminal\\59C07D676775FCCF79E223EC24AB0D86\\MQL5\\Experts\\Fibbo_Sniper_v28.5_H2.mq5'
];

expertPaths.forEach(p => {
  try {
    fs.writeFileSync(p, fs.readFileSync(file));
    console.log('✔ .MQ5 sincronizado em:', p);
  } catch (err) {
    console.log('Erro ao salvar em:', p, err.message);
  }
});
