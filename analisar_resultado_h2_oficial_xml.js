const fs = require('fs');

const testResults = [
  { symbol: 'EURCAD', profit: 460.31, trades: 10, pf: 27.065, sharpe: 28.25, dd: 1.1886, payoff: 46.03, rf: 3.73 },
  { symbol: 'EURJPY', profit: 381.46, trades: 28, pf: 1.958,  sharpe: 41.09, dd: 4.8024, payoff: 13.62, rf: 0.77 },
  { symbol: 'AUDUSD', profit: 293.35, trades: 6,  pf: 100.44, sharpe: 9.56,  dd: 0.9913, payoff: 49.38, rf: 2.88 },
  { symbol: 'USDCAD', profit: 269.14, trades: 26, pf: 1.527,  sharpe: 53.06, dd: 3.4742, payoff: 10.35, rf: 0.76 },
  { symbol: 'EURUSD', profit: 259.57, trades: 22, pf: 2.050,  sharpe: 44.65, dd: 2.5757, payoff: 11.80, rf: 0.99 },
  { symbol: 'EURGBP', profit: 251.99, trades: 76, pf: 1.190,  sharpe: 13.73, dd: 5.9470, payoff: 3.32,  rf: 0.42 },
  { symbol: 'EURAUD', profit: 207.04, trades: 52, pf: 1.199,  sharpe: 15.68, dd: 4.1601, payoff: 3.98,  rf: 0.50 }
];

const months = 43.5; // Jan/2023 - Ago/2026

let totalProfit = 0;
let totalTrades = 0;

testResults.forEach(r => {
  totalProfit += r.profit;
  totalTrades += r.trades;
});

const monthlyUsd = totalProfit / months;
const monthlyPct = (monthlyUsd / 10000) * 100;
const tradesPerMonth = totalTrades / months;

console.log('========================================================================');
console.log('📊 AUDITORIA DO TESTE OFICIAL MT5: FR + FIBO NO H2 (7 MOEDAS)');
console.log('   Período: 2023.01.01 a 2026.08.13 (43.5 Meses) | Conta: $10.000 USD');
console.log('========================================================================\n');

console.log(`• Lucro Total Acumulado:       +$${totalProfit.toFixed(2)} USD (+${(totalProfit/100).toFixed(2)}%)`);
console.log(`• Lucro Médio Mensal:          +$${monthlyUsd.toFixed(2)} USD / mês (+${monthlyPct.toFixed(2)}% a.m.)`);
console.log(`• Total de Operações:          ${totalTrades} trades`);
console.log(`• Frequência de Trades:        ~${tradesPerMonth.toFixed(1)} trades por mês`);
console.log(`• Assertividade / Lucrativas:  TODAS AS 7 MOEDAS FORAM POSITIVAS (100% Win por Ativo!)\n`);

console.log('------------------------------------------------------------------------');
console.log('📋 CLASSIFICAÇÃO DETALHADA POR EFICIÊNCIA & SEGURANÇA:');
console.log('------------------------------------------------------------------------');

testResults.forEach(r => {
  const pUsd = r.profit / months;
  const tM = r.trades / months;
  console.log(`${r.symbol.padEnd(8)} | Lucro: +$${r.profit.toFixed(2).padStart(6)} (+$${pUsd.toFixed(2)}/m) | PF: ${r.pf.toFixed(2).padStart(6)} | Sharpe: ${r.sharpe.toFixed(2).padStart(5)} | DD: ${r.dd.toFixed(2)}% | Trades: ${r.trades.toString().padStart(2)} (${tM.toFixed(1)}/m)`);
});
