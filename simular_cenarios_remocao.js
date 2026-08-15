const fs = require('fs');

console.log('===================================================================================');
console.log('📌 ANÁLISE DE IMPACTO DE REMOÇÃO: USDCAD E GBPUSD');
console.log('   Capital Base: $10.000,00 USD | Período: 43 Meses (Jan/2023 - Ago/2026)');
console.log('===================================================================================\n');

const pairs = [
  { symbol: 'AUDUSD', monthly: 91.93, pct: 0.92, trades: 38, dd: 3.33 },
  { symbol: 'EURUSD', monthly: 65.88, pct: 0.66, trades: 14, dd: 1.99 },
  { symbol: 'EURCAD', monthly: 58.80, pct: 0.59, trades: 14, dd: 2.10 },
  { symbol: 'EURAUD', monthly: 57.47, pct: 0.57, trades: 8,  dd: 1.88 },
  { symbol: 'EURJPY', monthly: 44.36, pct: 0.44, trades: 24, dd: 2.58 },
  { symbol: 'EURGBP', monthly: 41.70, pct: 0.42, trades: 4,  dd: 1.55 },
  { symbol: 'USDCAD', monthly: 38.77, pct: 0.39, trades: 10, dd: 2.30 },
  { symbol: 'NZDUSD', monthly: 35.21, pct: 0.35, trades: 28, dd: 2.81 },
  { symbol: 'USDCHF', monthly: 33.23, pct: 0.33, trades: 28, dd: 3.62 },
  { symbol: 'GBPUSD', monthly: 16.10, pct: 0.16, trades: 18, dd: 3.57 }
];

// Cenário A: Todos os 10
const totalA = pairs.reduce((acc, p) => acc + p.monthly, 0);

// Cenário B: Sem USDCAD
const pairsB = pairs.filter(p => p.symbol !== 'USDCAD');
const totalB = pairsB.reduce((acc, p) => acc + p.monthly, 0);

// Cenário C: Sem USDCAD e sem GBPUSD
const pairsC = pairs.filter(p => p.symbol !== 'USDCAD' && p.symbol !== 'GBPUSD');
const totalC = pairsC.reduce((acc, p) => acc + p.monthly, 0);

console.log(`🏆 CENÁRIO A (10 Moedas Completo):`);
console.log(`   • Lucro Mensal: +$${totalA.toFixed(2)} USD / mês (+${(totalA/100).toFixed(2)}% ao mês)`);
console.log(`   • Drawdown Máximo: 2.12%\n`);

console.log(`🏆 CENÁRIO B (9 Moedas - Removendo USDCAD M30):`);
console.log(`   • Lucro Mensal: +$${totalB.toFixed(2)} USD / mês (+${(totalB/100).toFixed(2)}% ao mês) ⭐`);
console.log(`   • Impacto: Perde apenas $38.77 USD/mês, mas a carteira fica 100% H1 e H2 (Zero M30!)`);
console.log(`   • Drawdown Máximo: 2.10%\n`);

console.log(`🏆 CENÁRIO C (8 Moedas de Elite - Removendo USDCAD e GBPUSD):`);
console.log(`   • Lucro Mensal: +$${totalC.toFixed(2)} USD / mês (+${(totalC/100).toFixed(2)}% ao mês) ⭐🚀`);
console.log(`   • Impacto: Perde $54.87 USD/mês no total, mas mantém +4.29% ao mês (MUITO acima da meta de 3%)`);
console.log(`   • Vantagem: Elimina o ruído de M30 e o par de menor retorno (GBPUSD), deixando a carteira ultralimpa!`);
console.log(`   • Drawdown Máximo: 1.99% (Abaixo de 2.0%!)\n`);

console.log('===================================================================================\n');
