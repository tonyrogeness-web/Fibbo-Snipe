const fs = require('fs');

console.log('===================================================================================');
console.log('📊 DIAGNÓSTICO DETALHADO DO TESTE DUAL ENGINE (FR + FIBO)');
console.log('===================================================================================\n');

const results = [
  { symbol: 'AUDUSD', profit: 338.15, pf: 1.56, sharpe: 33.92, dd: 3.60, trades: 34, status: 'LUCRO EXCELENTE ✅' },
  { symbol: 'EURUSD', profit: 226.24, pf: 1.86, sharpe: 44.82, dd: 2.43, trades: 22, status: 'LUCRO EXCELENTE ✅' },
  { symbol: 'EURAUD', profit: 175.94, pf: 1.70, sharpe: 24.46, dd: 2.86, trades: 16, status: 'LUCRO EXCELENTE ✅' },
  { symbol: 'USDCAD', profit: 170.56, pf: 2.22, sharpe: 13.47, dd: 1.58, trades: 12, status: 'LUCRO EXCELENTE ✅' },
  { symbol: 'EURGBP', profit: 164.43, pf: 2.28, sharpe: 9.02,  dd: 2.45, trades: 10, status: 'LUCRO EXCELENTE ✅' },
  { symbol: 'NZDUSD', profit: 161.66, pf: 2.31, sharpe: 8.45,  dd: 2.02, trades: 8,  status: 'LUCRO EXCELENTE ✅' },
  { symbol: 'USDCHF', profit: -1687.02, pf: 0.82, sharpe: -2.31, dd: 18.74, trades: 442, status: 'OVERTRADING (442 ordens!) ❌' },
  { symbol: 'EURCAD', profit: -4467.51, pf: 0.58, sharpe: -5.00, dd: 46.42, trades: 518, status: 'OVERTRADING (518 ordens!) ❌' }
];

console.log('📌 DESEMPENHO DOS 6 PARES CAMPEÕES EM H2 DUAL:');
let sumProf6 = 0;
results.slice(0, 6).forEach(r => {
  console.log(`   • ${r.symbol.padEnd(8)}: +$${r.profit.toFixed(2).padStart(7)} USD | PF: ${r.pf.toFixed(2)} | Sharpe: ${r.sharpe.toFixed(2).padStart(5)} | DD: ${r.dd}% | Trades: ${r.trades}`);
  sumProf6 += r.profit;
});
console.log(`\n👉 TOTAL LUCRO DOS 6 PARES: +$${sumProf6.toFixed(2)} USD (Lucro em 100% das 6 moedas!)\n`);

console.log('📌 O PROBLEMA DO OVERTRADING NOS 2 PARES RESTANTES:');
console.log(`   • USDCHF  : -$1.687,02 USD | Trades: 442 ordens consecutivas em consolidação!`);
console.log(`   • EURCAD  : -$4.467,51 USD | Trades: 518 ordens consecutivas em consolidação!`);
console.log(`\n💡 MOTIVO TÉCNICO: O Fibo Pullback sem trava de Cooldown por barra abriu ordens em CADA candle consecutivo durante a consolidação em EURCAD e USDCHF.`);

console.log('===================================================================================\n');
