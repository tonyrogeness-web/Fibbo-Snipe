const fs = require('fs');
const mq5 = fs.readFileSync('Fibbo_Sniper_v28.5_H2.mq5', 'utf8');

const blockedMatch = mq5.match(/input string InpFiboBlockedSymbols\s*=\s*"([^"]*)"/);
console.log('InpFiboBlockedSymbols no MQ5:', blockedMatch ? blockedMatch[1] : 'NÃO ACHOU');

const blockedList = blockedMatch[1].split(',').map(s => s.trim().toUpperCase());

const charts = ['AUDUSD', 'EURUSD', 'EURCAD', 'EURAUD', 'EURJPY', 'USDCAD'];

console.log('\n--- RESULTADO DAS 6 ABAS DO SEU METATRADER 5 ---');
let frCount = 0, dualCount = 0;
charts.forEach(sym => {
  const isBlocked = blockedList.some(b => sym.toUpperCase().includes(b));
  if (isBlocked) frCount++; else dualCount++;
  const mode = isBlocked ? 'APENAS FR (Fibo Bloqueada 🛡️)' : 'FR + FIBO (Dual Engine 🚀)';
  console.log(sym.padEnd(8) + ' -> ' + mode);
});

console.log(`\nTOTAL: ${dualCount} Moedas com FR + FIBO e ${frCount} Moedas com APENAS FR!`);
