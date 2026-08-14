const fs = require('fs');

// ====================================================================
// SIMULAÇÃO COMPARATIVA: RISCO FIXO $50 USD (SEM JUROS COMPOSTOS) VS COMPOSTO
// ====================================================================

const PAIRS = [
  { symbol: "EURUSD", baseSpread: 1.2, atrPips: 65, winRateBase: 0.72, avgRiskReward: 1.85 },
  { symbol: "GBPUSD", baseSpread: 1.5, atrPips: 85, winRateBase: 0.69, avgRiskReward: 1.90 },
  { symbol: "AUDUSD", baseSpread: 1.4, atrPips: 58, winRateBase: 0.70, avgRiskReward: 1.80 },
  { symbol: "USDCHF", baseSpread: 1.5, atrPips: 62, winRateBase: 0.71, avgRiskReward: 1.82 },
  { symbol: "USDCAD", baseSpread: 1.6, atrPips: 70, winRateBase: 0.68, avgRiskReward: 1.78 },
  { symbol: "NZDUSD", baseSpread: 1.8, atrPips: 55, winRateBase: 0.67, avgRiskReward: 1.75 },
  { symbol: "EURGBP", baseSpread: 1.5, atrPips: 42, winRateBase: 0.66, avgRiskReward: 1.70 },
  { symbol: "EURJPY", baseSpread: 1.8, atrPips: 95, winRateBase: 0.68, avgRiskReward: 1.88 }
];

const INITIAL_CAPITAL = 10000.0;
const FIXED_RISK_USD = 50.0; // Risco fixo de 0.5% em conta de $10.000 USD sem aumentar o lote

function runFixedRiskSimulation() {
    let totalNetProfitUsd = 0;
    let totalTradesAll = 0;
    let totalWinsAll = 0;
    let totalLossesAll = 0;

    let pairMonthlyStats = {};

    PAIRS.forEach(p => {
        pairMonthlyStats[p.symbol] = {
            trades: 0,
            wins: 0,
            losses: 0,
            profitUsd: 0
        };
    });

    let seed = 12345;
    let months = 43;

    for (let m = 0; m < months; m++) {
        for (let day = 1; day <= 22; day++) {
            let dayTrades = 0;

            for (let pIdx = 0; pIdx < PAIRS.length; pIdx++) {
                if (dayTrades >= 2) break;
                let pair = PAIRS[pIdx];

                function pseudoRandom() {
                    let x = Math.sin(seed++) * 10000;
                    return x - Math.floor(x);
                }

                if (pseudoRandom() < 0.15) {
                    dayTrades++;
                    totalTradesAll++;
                    pairMonthlyStats[pair.symbol].trades++;

                    let outcome = pseudoRandom();
                    let riskUsd = FIXED_RISK_USD;
                    let spreadPenalty = 2.50; // $2.50 de comissão/spread

                    if (outcome < pair.winRateBase * 0.55) {
                        let profit = (riskUsd * pair.avgRiskReward) - spreadPenalty;
                        totalNetProfitUsd += profit;
                        totalWinsAll++;
                        pairMonthlyStats[pair.symbol].wins++;
                        pairMonthlyStats[pair.symbol].profitUsd += profit;
                    } else if (outcome < pair.winRateBase) {
                        let profit = (riskUsd * 1.1) - spreadPenalty;
                        totalNetProfitUsd += profit;
                        totalWinsAll++;
                        pairMonthlyStats[pair.symbol].wins++;
                        pairMonthlyStats[pair.symbol].profitUsd += profit;
                    } else if (outcome < pair.winRateBase + 0.10) {
                        let loss = spreadPenalty;
                        totalNetProfitUsd -= loss;
                        pairMonthlyStats[pair.symbol].profitUsd -= loss;
                    } else {
                        let loss = riskUsd + spreadPenalty;
                        totalNetProfitUsd -= loss;
                        totalLossesAll++;
                        pairMonthlyStats[pair.symbol].losses++;
                        pairMonthlyStats[pair.symbol].profitUsd -= loss;
                    }
                }
            }
        }
    }

    return {
        totalNetProfitUsd,
        totalTradesAll,
        totalWinsAll,
        totalLossesAll,
        pairMonthlyStats,
        months
    };
}

const fixedRes = runFixedRiskSimulation();

console.log("========================================================================");
console.log("    ANÁLISE DE RISCO FIXO (SEM JUROS COMPOSTOS / LOTE FIXO DE 0.5%)");
console.log("    CAPITAL: $10.000 USD | RISCO FIXO: $50 USD / TRADE");
console.log("========================================================================");
console.log(`Lucro Acumulado 3 anos (8 pares somados):  +$${fixedRes.totalNetProfitUsd.toFixed(2)} USD (+${((fixedRes.totalNetProfitUsd/INITIAL_CAPITAL)*100).toFixed(1)}%)`);
console.log(`Lucro Médio Mensal (Somando os 8 pares):    +$${(fixedRes.totalNetProfitUsd / fixedRes.months).toFixed(2)} USD / mês (+${((fixedRes.totalNetProfitUsd / fixedRes.months / INITIAL_CAPITAL)*100).toFixed(2)}% ao mês)`);
console.log("========================================================================\n");

console.log("--- RENDIMENTO MÉDIO MENSAL POR PAR INDIVIDUAL (LOTE FIXO) ---");
Object.keys(fixedRes.pairMonthlyStats).forEach(sym => {
    let p = fixedRes.pairMonthlyStats[sym];
    let avgMonthlyUsd = p.profitUsd / fixedRes.months;
    let avgMonthlyPct = (avgMonthlyUsd / INITIAL_CAPITAL) * 100.0;
    let wr = p.trades > 0 ? ((p.wins / p.trades) * 100).toFixed(1) : "0.0";
    let sign = avgMonthlyUsd >= 0 ? "+" : "";
    console.log(`${sym.padEnd(8)} | Trades: ${p.trades} | ${p.wins}W / ${p.losses}L (${wr}%) | Média Mensal: ${sign}$${avgMonthlyUsd.toFixed(2)} (${sign}${avgMonthlyPct.toFixed(2)}%/mês)`);
});
