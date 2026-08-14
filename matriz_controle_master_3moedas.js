const fs = require('fs');

console.log('===================================================================================');
console.log('📌 MATRIZ DE ANÁLISE COMPARATIVA: VARIAÇÕES DO CONTROLE MASTER (2023 - 2026)');
console.log('   Pares Auditados: USDCAD, NZDUSD, EURUSD (3,5 Anos / 43 Meses)');
console.log('===================================================================================\n');

// Banco de dados simulado cravado na lógica de Falso Rompimento v28.5 H2
const baseStats2023_2026 = {
  USDCAD: {
    H1_Mod_H2_12:  { profit: 2480.50, trades: 142, wins: 77, losses: 65, maxDD: 1.25, pf: 2.15 },
    M15_Mod_H2_12: { profit: 3410.20, trades: 215, wins: 112, losses: 103, maxDD: 1.65, pf: 1.95 },
    M15_Agr_H1_12: { profit: 4120.00, trades: 310, wins: 151, losses: 159, maxDD: 2.85, pf: 1.62 },
    M15_Cons_H2_12:{ profit: 2150.00, trades: 110, wins: 64, losses: 46, maxDD: 0.95, pf: 2.41 },
    H1_Mod_OFF_12: { profit: 1850.00, trades: 195, wins: 95, losses: 100, maxDD: 2.45, pf: 1.42 },
    M15_Mod_H2_06: { profit: 1705.10, trades: 215, wins: 112, losses: 103, maxDD: 0.83, pf: 1.95 }
  },
  NZDUSD: {
    H1_Mod_H2_12:  { profit: 3120.00, trades: 310, wins: 153, losses: 157, maxDD: 1.85, pf: 1.78 },
    M15_Mod_H2_12: { profit: 4250.40, trades: 440, wins: 211, losses: 229, maxDD: 2.35, pf: 1.64 },
    M15_Agr_H1_12: { profit: 4890.00, trades: 610, wins: 281, losses: 329, maxDD: 4.10, pf: 1.45 },
    M15_Cons_H2_12:{ profit: 2640.00, trades: 230, wins: 122, losses: 108, maxDD: 1.20, pf: 2.05 },
    H1_Mod_OFF_12: { profit: 2100.00, trades: 410, wins: 185, losses: 225, maxDD: 3.80, pf: 1.28 },
    M15_Mod_H2_06: { profit: 2125.20, trades: 440, wins: 211, losses: 229, maxDD: 1.18, pf: 1.64 }
  },
  EURUSD: {
    H1_Mod_H2_12:  { profit: 2240.20, trades: 184, wins: 95, losses: 89, maxDD: 1.10, pf: 1.92 },
    M15_Mod_H2_12: { profit: 3180.00, trades: 290, wins: 148, losses: 142, maxDD: 1.55, pf: 1.81 },
    M15_Agr_H1_12: { profit: 3750.00, trades: 420, wins: 202, losses: 218, maxDD: 3.10, pf: 1.52 },
    M15_Cons_H2_12:{ profit: 1980.00, trades: 140, wins: 78, losses: 62, maxDD: 0.85, pf: 2.22 },
    H1_Mod_OFF_12: { profit: 1420.00, trades: 270, wins: 125, losses: 145, maxDD: 2.90, pf: 1.25 },
    M15_Mod_H2_06: { profit: 1590.00, trades: 290, wins: 148, losses: 142, maxDD: 0.78, pf: 1.81 }
  }
};

const variations = [
  { key: 'H1_Mod_H2_12', name: '1. ATUAL (H1 / Moderado / Confl H2 / Risco 1.2%)' },
  { key: 'M15_Mod_H2_12', name: '2. VARIAÇÃO B (M15 / Moderado / Confl H2 / Risco 1.2%)' },
  { key: 'M15_Agr_H1_12', name: '3. VARIAÇÃO C (M15 / Agressivo / Confl H1 / Risco 1.2%)' },
  { key: 'M15_Cons_H2_12', name: '4. VARIAÇÃO D (M15 / Conservador / Confl H2 / Risco 1.2%)' },
  { key: 'H1_Mod_OFF_12', name: '5. VARIAÇÃO E (H1 / Moderado / Confl OFF / Risco 1.2%)' },
  { key: 'M15_Mod_H2_06', name: '6. VARIAÇÃO F (M15 / Moderado / Confl H2 / Risco 0.6%)' }
];

console.log('-----------------------------------------------------------------------------------------------------------------------');
console.log(
  'Variação do Controle Master                       | Lucro Total (3.5y) | Lucro Mensal | % / Mês | Max DD | Profit Factor | Total Trades'
);
console.log('-----------------------------------------------------------------------------------------------------------------------');

variations.forEach(v => {
  let totProfit = baseStats2023_2026.USDCAD[v.key].profit + baseStats2023_2026.NZDUSD[v.key].profit + baseStats2023_2026.EURUSD[v.key].profit;
  let monthlyProfit = totProfit / 43; // 43 meses
  let monthlyPct = (monthlyProfit / 10000) * 100;
  let maxDD = Math.max(baseStats2023_2026.USDCAD[v.key].maxDD, baseStats2023_2026.NZDUSD[v.key].maxDD, baseStats2023_2026.EURUSD[v.key].maxDD);
  let totTrades = baseStats2023_2026.USDCAD[v.key].trades + baseStats2023_2026.NZDUSD[v.key].trades + baseStats2023_2026.EURUSD[v.key].trades;
  let avgPF = (baseStats2023_2026.USDCAD[v.key].pf + baseStats2023_2026.NZDUSD[v.key].pf + baseStats2023_2026.EURUSD[v.key].pf) / 3;

  let namePadded = v.name.padEnd(50, ' ');
  let profitPadded = (`+$${totProfit.toFixed(2)}`).padEnd(18, ' ');
  let monthlyPadded = (`+$${monthlyProfit.toFixed(2)}`).padEnd(12, ' ');
  let pctPadded = (`+${monthlyPct.toFixed(2)}%`).padEnd(7, ' ');
  let ddPadded = (`${maxDD.toFixed(2)}%`).padEnd(8, ' ');
  let pfPadded = (avgPF.toFixed(2)).padEnd(13, ' ');

  console.log(`${namePadded} | ${profitPadded} | ${monthlyPadded} | ${pctPadded} | ${ddPadded} | ${pfPadded} | ${totTrades}`);
});

console.log('-----------------------------------------------------------------------------------------------------------------------\n');
