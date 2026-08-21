const fs = require('fs');
const path = require('path');

console.log('=== REMOVENDO MOTOR 3 FIBO ===\n');

const mq5Path = path.join(__dirname, 'Fibbo_Sniper_v28.5_H2.mq5');
let code = fs.readFileSync(mq5Path, 'utf8');

const cutStart = code.indexOf('//================================================================\n   // MOTOR 3: FIBONACCI 2.0 DE ALTA PRECISÃO');
const cutEnd = code.indexOf('//+------------------------------------------------------------------+\n//  FIM — Fibbo_Sniper_v28.5_H2.mq5');

if (cutStart !== -1 && cutEnd !== -1) {
  code = code.slice(0, cutStart) + '}\n' + code.slice(cutEnd);
  fs.writeFileSync(mq5Path, code, 'utf8');
  console.log('✔ Motor 3 (Fibo) 100% excluído da execução real!');
} else {
  console.log('⚠ Não encontrou marcadores:', cutStart, cutEnd);
}
