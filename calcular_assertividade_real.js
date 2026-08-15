const fs = require('fs');

const portfolioData = [
  { symbol: 'AUDUSD', strategy: 'FR + FIBO', trades: 6,  wins: 6, losses: 0, pf: 100.44 },
  { symbol: 'EURCAD', strategy: 'FR + FIBO', trades: 10, wins: 9, losses: 1, pf: 27.07 },
  { symbol: 'EURGBP', strategy: 'APENAS FR', trades: 4,  wins: 4, losses: 0, pf: 54.53 },
  { symbol: 'EURAUD', strategy: 'APENAS FR', trades: 6,  wins: 5, losses: 1, pf: 48.49 },
  { symbol: 'EURUSD', strategy: 'FR + FIBO', trades: 22, wins: 16,losses: 6, pf: 2.05 },
  { symbol: 'EURJPY', strategy: 'FR + FIBO', trades: 28, wins: 20,losses: 8, pf: 1.96 },
  { symbol: 'USDCAD', strategy: 'FR + FIBO', trades: 26, wins: 18,losses: 8, pf: 1.53 }
];

let totalTrades = 0;
let totalWins = 0;
let totalLosses = 0;

portfolioData.forEach(p => {
  totalTrades += p.trades;
  totalWins += p.wins;
  totalLosses += p.losses;
});

const overallWinRate = (totalWins / totalTrades) * 100;

console.log('========================================================================');
console.log('🎯 AUDITORIA DE ASSERTIVIDADE (TAXA DE ACERTO REAL): FR + FIBO SELETIVO');
console.log('========================================================================\n');
console.log(`• Total Geral de Trades:   ${totalTrades} operações`);
console.log(`• Trades Vencedores:       ${totalWins} WINS 🟢`);
console.log(`• Trades Perdedores:       ${totalLosses} LOSSES 🔴`);
console.log(`• Taxa de Acerto Geral:    ${overallWinRate.toFixed(1)}% DE ASSERTIVIDADE! 🏆\n`);

portfolioData.forEach(p => {
  const wr = ((p.wins / p.trades) * 100).toFixed(1);
  console.log(`${p.symbol.padEnd(8)} | ${p.strategy.padEnd(12)} | Trades: ${p.trades.toString().padStart(2)} | Wins: ${p.wins.toString().padStart(2)} | Losses: ${p.losses.toString().padStart(2)} | Assertividade: ${wr}% | PF: ${p.pf}`);
});
