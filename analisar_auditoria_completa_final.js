const fs = require('fs');

console.log('=== AUDITORIA QUANTITATIVA TOTAL DO PORTFÓLIO 9 MOEDAS ===\n');

const fluxoPairs = [
  { symbol: "XAUUSD", profit: 347.72, pf: 179.32, dd: 0.88, trades: 4, sharpe: 5.54, payoff: 87.42, recovery: 3.83 },
  { symbol: "GBPUSD", profit: 172.93, pf: 1.94, dd: 3.15, trades: 12, sharpe: 20.29, payoff: 14.41, recovery: 0.54 },
  { symbol: "EURJPY", profit: 171.78, pf: 1.93, dd: 2.50, trades: 10, sharpe: 12.28, payoff: 17.18, recovery: 0.67 },
  { symbol: "GBPJPY", profit: 127.33, pf: 3.42, dd: 1.81, trades: 6, sharpe: 3.92, payoff: 21.22, recovery: 0.70 }
];

const frPairs = [
  { symbol: "AUDNZD", profit: 350.06, pf: 3.09, dd: 1.92, trades: 8, sharpe: 12.43, payoff: 43.76, recovery: 1.82 },
  { symbol: "EURCAD", profit: 298.86, pf: 86.38, dd: 0.55, trades: 2, sharpe: 2.40, payoff: 151.18, recovery: 5.32 },
  { symbol: "EURAUD", profit: 264.29, pf: 7.59, dd: 3.07, trades: 8, sharpe: 8.08, payoff: 33.04, recovery: 0.83 },
  { symbol: "EURUSD", profit: 253.99, pf: 1.78, dd: 3.48, trades: 18, sharpe: 28.00, payoff: 14.11, recovery: 0.71 },
  { symbol: "NZDUSD", profit: 216.67, pf: 2.17, dd: 2.89, trades: 14, sharpe: 22.36, payoff: 15.48, recovery: 0.74 }
];

const allPairs = [...fluxoPairs, ...frPairs];

const totalProfit = allPairs.reduce((acc, p) => acc + p.profit, 0);
const totalTrades = allPairs.reduce((acc, p) => acc + p.trades, 0);
const maxDD = Math.max(...allPairs.map(p => p.dd));
const avgSharpe = allPairs.reduce((acc, p) => acc + p.sharpe, 0) / allPairs.length;

// Período: 2020.01.01 a 2026.08.21 = ~6.64 anos = 79.7 meses
const totalMonths = 79.7;
const avgMonthlyProfitUsd = totalProfit / totalMonths;
const avgMonthlyReturnPct = (avgMonthlyProfitUsd / 10000) * 100;
const avgTradesPerMonth = totalTrades / totalMonths;
const avgTradesPerWeek = avgTradesPerMonth / 4.33;

console.log(`Lucro Total: $${totalProfit.toFixed(2)} USD (+${((totalProfit/10000)*100).toFixed(2)}%)`);
console.log(`Total de Operações: ${totalTrades} trades`);
console.log(`Média de Lucro Mensal: $${avgMonthlyProfitUsd.toFixed(2)} USD / mês (${avgMonthlyReturnPct.toFixed(2)}% a.m.)`);
console.log(`Média de Operações: ${avgTradesPerMonth.toFixed(1)} trades/mês (~${avgTradesPerWeek.toFixed(1)} trades/semana)`);
console.log(`Drawdown Máximo do Portfólio: ${maxDD.toFixed(2)}%`);
console.log(`Sharpe Ratio Médio: ${avgSharpe.toFixed(2)}`);
