const fs = require('fs');

console.log('===================================================================================');
console.log('📊 ANÁLISE DETALHADA DO NOVO TESTE H2 COM FIBO');
console.log('===================================================================================\n');

const results = [
  { symbol: 'AUDUSD', profit: 338.15, pf: 1.56, sharpe: 33.92, dd: 3.60, trades: 34 },
  { symbol: 'EURJPY', profit: 332.09, pf: 1.16, sharpe: 12.32, dd: 6.84, trades: 92 },
  { symbol: 'EURUSD', profit: 226.24, pf: 1.86, sharpe: 44.82, dd: 2.43, trades: 22 },
  { symbol: 'EURAUD', profit: 175.94, pf: 1.70, sharpe: 24.46, dd: 2.86, trades: 16 },
  { symbol: 'USDCAD', profit: 170.56, pf: 2.22, sharpe: 13.47, dd: 1.58, trades: 12 },
  { symbol: 'EURGBP', profit: 164.43, pf: 2.28, sharpe: 9.02,  dd: 2.45, trades: 10 },
  { symbol: 'NZDUSD', profit: 161.66, pf: 2.31, sharpe: 8.45,  dd: 2.02, trades: 8  },
  { symbol: 'USDCHF', profit: -1681.39, pf: 0.82, sharpe: -2.28, dd: 18.68, trades: 442 }
];

console.log('🏆 7 MOEDAS VITORIOSAS E SEUS GANHOS:');
let sumWinners = 0;
results.slice(0, 7).forEach(r => {
  console.log(`   • ${r.symbol.padEnd(8)}: +$${r.profit.toFixed(2).padStart(7)} USD | PF: ${r.pf.toFixed(2)} | Sharpe: ${r.sharpe.toFixed(2).padStart(5)} | DD: ${r.dd}% | Trades: ${r.trades}`);
  sumWinners += r.profit;
});

console.log(`\n👉 TOTAL GANHO NAS 7 MOEDAS CAMPEÃS: +$${sumWinners.toFixed(2)} USD\n`);

console.log('🔍 A MOEDA QUE FALTOU NESTE TESTE:');
console.log('   • EURCAD (Era a 9ª moeda na fila 2/1 do processador que não concluiu antes de salvar).\n');

console.log('===================================================================================\n');
