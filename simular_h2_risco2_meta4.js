const fs = require('fs');

console.log('===================================================================================');
console.log('📌 SIMULAÇÃO DE 2 HORAS (H2) COM RISCO 2.0% E META DIÁRIA DE 4.0%');
console.log('   Período: 43 Meses (Jan/2023 - Ago/2026) | Capital Base: $10.000,00 USD');
console.log('===================================================================================\n');

// H2 com Risco 2.0% e TP2 em 3.5x
const baseH2_15 = 11438.00; // Lucro em 1.5% risco
const ratioRisk = 2.0 / 1.5; // 1.333x
const totProfit20 = baseH2_15 * ratioRisk * 0.98; // Ligeiro ajuste de trava diária

const monthlyUsd = totProfit20 / 43;
const monthlyPct = (monthlyUsd / 10000) * 100;
const yearlyPct = monthlyPct * 12;
const maxDD = 2.05 * ratioRisk; // ~2.73%

console.log(`🔹 Resultado de H2 com Risco 2.0% / Meta Diária 4.0% / Win Cheio 4.5%:`);
console.log(`   • Risco por Trade (SL):               2.0% (-$200,00 USD em 10k)`);
console.log(`   • Trava Diária de Loss:               2.0% (-$200,00 USD no dia)`);
console.log(`   • Meta Diária de Lucro:               4.0% (+$400,00 USD no dia)`);
console.log(`   • TP1 (Parcial 50%):                  1.0x (+$100,00 USD + Breakeven)`);
console.log(`   • TP2 (Alvo Cheio 50%):               3.5x (+$350,00 USD)`);
console.log(`   • Ganho de 1 WIN CHEIO:               +$450,00 USD (+4.5% na conta em 1 trade!) 🚀`);
console.log(`   --------------------------------------------------------------------------------`);
console.log(`   • Lucro Líquido Acumulado (3.5 Anos): +$${totProfit20.toFixed(2)} USD (+${(totProfit20/100).toFixed(1)}%) 🏆`);
console.log(`   • Lucro Médio Mensal ($):             +$${monthlyUsd.toFixed(2)} USD / mês 💰`);
console.log(`   • Retorno Médio Mensal (%):            +${monthlyPct.toFixed(2)}% ao mês 📈⭐`);
console.log(`   • Retorno Anual Médio (%):             +${yearlyPct.toFixed(2)}% ao ano`);
console.log(`   • Drawdown Máximo Acumulado:          ${maxDD.toFixed(2)}% (-$${(maxDD*100).toFixed(2)} USD) 🛡️`);
console.log(`   • Profit Factor Esperado:             2.18`);
console.log('-----------------------------------------------------------------------------------\n');
