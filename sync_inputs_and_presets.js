const fs = require('fs');

const file = 'Fibbo_Sniper_v28.5_H2.mq5';
let code = fs.readFileSync(file, 'utf8');

console.log('=== ATUALIZANDO INPUTS E SINCRONIZANDO PRESETS ===\n');

const oldLine = `input bool InpSendPushAlert = false, InpLogCSV = true;`;
const newLine = `input bool InpSendPushNotifications = true; // [PUSH MOBILE] Alertas em tempo real no Celular (App MT5)
input bool InpUseAutoCompounding    = true; // [AUTO-COMPOUND] Recalcular lote dinamicamente sobre o Saldo Atual
input bool InpSendPushAlert = true, InpLogCSV = true;`;

if (code.includes(oldLine)) {
  code = code.replace(oldLine, newLine);
  console.log('✔ Inputs inseridos com sucesso!');
} else {
  console.log('❌ oldLine não encontrado');
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

// Regenerar presets
require('./sync_all_set_files.js');
