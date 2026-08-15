const fs = require('fs');

console.log('===================================================================================');
console.log('📋 GERANDO TABELA EXCLUSIVA DA ESTRATÉGIA FIBONACCI (FIXO EM H2) PARA GUARDAR');
console.log('===================================================================================\n');

const fiboTable = [
  { ranking: '🥇 1º', symbol: 'AUDUSD', tf: 'H2', trades: 34, monthlyOps: '~0,8 ops / mês', monthlyProfit: '+$7,86 / mês',  pf: 1.56, sharpe: 33.92, totalProfit: '+$338,15 USD',  perfil: '🚀 O Rei do Lucro Fibo' },
  { ranking: '🥈 2º', symbol: 'EURJPY', tf: 'H2', trades: 92, monthlyOps: '~2,1 ops / mês', monthlyProfit: '+$7,72 / mês',  pf: 1.16, sharpe: 12.32, totalProfit: '+$332,09 USD',  perfil: '⚡ Expansivo no Iene (Mais Ativo)' },
  { ranking: '🥉 3º', symbol: 'EURUSD', tf: 'H2', trades: 22, monthlyOps: '~0,5 ops / mês', monthlyProfit: '+$5,26 / mês',  pf: 1.86, sharpe: 44.82, totalProfit: '+$226,24 USD',  perfil: '⭐ Maior Sharpe do Fibo (44.8)' },
  { ranking: '4º',   symbol: 'EURAUD', tf: 'H2', trades: 16, monthlyOps: '~0,4 ops / mês', monthlyProfit: '+$4,09 / mês',  pf: 1.70, sharpe: 24.46, totalProfit: '+$175,94 USD',  perfil: '🛡️ Alta Precisão em H2' },
  { ranking: '5º',   symbol: 'USDCAD', tf: 'H2', trades: 12, monthlyOps: '~0,3 ops / mês', monthlyProfit: '+$3,97 / mês',  pf: 2.22, sharpe: 13.47, totalProfit: '+$170,56 USD',  perfil: '🛡️ Menor Drawdown (1.58%)' },
  { ranking: '6º',   symbol: 'EURGBP', tf: 'H2', trades: 10, monthlyOps: '~0,2 ops / mês', monthlyProfit: '+$3,82 / mês',  pf: 2.28, sharpe: 9.02,  totalProfit: '+$164,43 USD',  perfil: '🎯 Sniper Passivo Fibo' },
  { ranking: '7º',   symbol: 'NZDUSD', tf: 'H2', trades: 8,  monthlyOps: '~0,2 ops / mês', monthlyProfit: '+$3,76 / mês',  pf: 2.31, sharpe: 8.45,  totalProfit: '+$161,66 USD',  perfil: '🔹 Estável no Kiwi' },
  { ranking: '8º',   symbol: 'EURCAD', tf: 'H2', trades: 18, monthlyOps: '~0,4 ops / mês', monthlyProfit: '+$2,14 / mês',  pf: 1.18, sharpe: 2.10,  totalProfit: '+$92,10 USD',   perfil: '⚠️ Requer Trava Cooldown (Faltou no Teste)' },
  { ranking: '9º',   symbol: 'USDCHF', tf: 'H2', trades: 14, monthlyOps: '~0,3 ops / mês', monthlyProfit: '+$1,98 / mês',  pf: 1.15, sharpe: 1.80,  totalProfit: '+$85,40 USD',   perfil: '⚠️ Requer Trava Cooldown (Faltou no Teste)' }
];

console.log('Ranking | Ativo / Par | Timeframe | Volume (3.5 Anos) | Média Mensal (Trades) | Média Mensal ($) | Profit Factor | Sharpe Ratio | Lucro Total ($) | Papel na Carteira Fibo');
console.log('---------------------------------------------------------------------------------------------------------------------------------------------------------------------');
fiboTable.forEach(row => {
  console.log(`${row.ranking.padEnd(7)} | ${row.symbol.padEnd(11)} | ${row.tf.padEnd(9)} | ${row.trades.toString().padEnd(17)} | ${row.monthlyOps.padEnd(21)} | ${row.monthlyProfit.padEnd(16)} | ${row.pf.toFixed(2).padEnd(13)} | ${row.sharpe.toFixed(2).padEnd(12)} | ${row.totalProfit.padEnd(15)} | ${row.perfil}`);
});

console.log('\n===================================================================================\n');
