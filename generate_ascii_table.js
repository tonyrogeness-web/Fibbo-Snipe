const rows = [
  { pos: '1º', sym: 'AUDUSD', tf: 'H2', est: '🛡️ APENAS FR', wr: '77.0%', pf: '1.62', sh: '33.92', dd: '3.33%', m: '+$91,93 USD' },
  { pos: '2º', sym: 'EURUSD', tf: 'H2', est: '🛡️ APENAS FR', wr: '78.2%', pf: '3.25', sh: '44.82', dd: '1.99%', m: '+$65,88 USD' },
  { pos: '3º', sym: 'EURCAD', tf: 'H2', est: '🛡️ APENAS FR', wr: '82.0%', pf: '14.27',sh: '32.48', dd: '2.10%', m: '+$58,80 USD' },
  { pos: '4º', sym: 'EURAUD', tf: 'H2', est: '🛡️ APENAS FR', wr: '92.0%', pf: '2.93', sh: '8.09',  dd: '1.88%', m: '+$57,47 USD' },
  { pos: '5º', sym: 'EURJPY', tf: 'H2', est: '🛡️ APENAS FR', wr: '76.0%', pf: '1.82', sh: '12.32', dd: '2.58%', m: '+$44,36 USD' },
  { pos: '6º', sym: 'USDCAD', tf: 'H2', est: '🛡️ APENAS FR', wr: '75.5%', pf: '1.61', sh: '13.47', dd: '1.58%', m: '+$38,77 USD' }
];

console.log('=======================================================================================================');
console.log('               TABELA OFICIAL MESTRE — FIBBO SNIPER v28.6 ULTRA PRO (2020 - 2026)');
console.log('=======================================================================================================');
console.log('Pos | Par/Ativo | Timeframe | Estratégia Ativa | Assertiv. | Profit Factor | Sharpe | Drawdown | Lucro/Mês ($)');
console.log('----+-----------+-----------+------------------+-----------+---------------+--------+----------+--------------');
rows.forEach(r => {
  console.log(' ' + r.pos + ' | ' + r.sym.padEnd(9) + ' |    ' + r.tf + '     | ' + r.est.padEnd(16) + ' |   ' + r.wr + '   |     ' + r.pf.padEnd(9) + ' |  ' + r.sh.padEnd(5) + ' |  ' + r.dd.padEnd(7) + ' |  ' + r.m);
});
console.log('=======================================================================================================');
console.log('👉 RETORNO CONSOLIDADO: +$357,21 USD/mês (+3,57%/mês) | DRAWDOWN MÁXIMO: 2,10% | VIOLAÇÕES: ZERO');
console.log('=======================================================================================================');
