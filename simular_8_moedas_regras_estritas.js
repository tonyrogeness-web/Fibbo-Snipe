const fs = require('fs');

// ====================================================================
// SIMULAÇÃO ULTRA-ESTRITA DE 8 PARES (COM TODAS AS TRAVAS DO ROBÔ 100%)
// PARES: EURUSD, EURAUD, GBPUSD, AUDUSD, USDCAD, USDJPY, GBPJPY, EURJPY
// ====================================================================

const PAIRS = [
  { symbol: "EURUSD", winRate: 0.747, avgRR: 1.85, avgDurationHours: 4 },
  { symbol: "EURAUD", winRate: 0.685, avgRR: 1.82, avgDurationHours: 6 },
  { symbol: "GBPUSD", winRate: 0.730, avgRR: 1.90, avgDurationHours: 5 },
  { symbol: "AUDUSD", winRate: 0.719, avgRR: 1.80, avgDurationHours: 5 },
  { symbol: "USDCAD", winRate: 0.735, avgRR: 1.78, avgDurationHours: 4 },
  { symbol: "USDJPY", winRate: 0.725, avgRR: 1.86, avgDurationHours: 5 },
  { symbol: "GBPJPY", winRate: 0.690, avgRR: 1.92, avgDurationHours: 6 },
  { symbol: "EURJPY", winRate: 0.709, avgRR: 1.88, avgDurationHours: 5 }
];

const INITIAL_BALANCE = 10000.0;
const MAX_SIMULTANEOUS_OPS_GLOBAL = 2; // Trava InpMaxSimultaneousOps = 2 no robô
const DAILY_GOAL_PCT = 1.0;            // Meta Moeda (+1.0%)
const DAILY_LOSS_PCT = 1.5;            // Risco Moeda (-1.5%)
const GLOBAL_DAILY_LOSS_PCT = 1.5;     // Trava Global Diária (-1.5%)
const RISK_PER_TRADE_USD = 50.0;       // Risco Fixo de $50 USD por trade (0.5% de $10k)

function runStrictStateSimulation() {
    let balance = INITIAL_BALANCE;
    let seed = 98765;

    function pseudoRandom() {
        let x = Math.sin(seed++) * 10000;
        return x - Math.floor(x);
    }

    let monthsCount = 43; // Jan/2023 a Jul/2026
    let totalTradesExecuted = 0;
    let totalWins = 0;
    let totalLosses = 0;

    let blockedByMaxOpsCount = 0;
    let blockedByDailyGoalCount = 0;
    let blockedByDailyLossCount = 0;
    let daysWithZeroTrades = 0;

    let pairStats = {};
    PAIRS.forEach(p => {
        pairStats[p.symbol] = { trades: 0, wins: 0, losses: 0, profitUsd: 0 };
    });

    let monthlyData = [];

    for (let m = 0; m < monthsCount; m++) {
        let monthStartBalance = balance;
        let monthTrades = 0;
        let monthWins = 0;
        let monthLosses = 0;

        for (let day = 1; day <= 22; day++) {
            let dailyGlobalPL = 0;
            let pairDailyPL = {};
            let pairBlocked = {};

            PAIRS.forEach(p => {
                pairDailyPL[p.symbol] = 0;
                pairBlocked[p.symbol] = false;
            });

            let globalBlocked = false;
            let currentOpenPositions = []; // Simula posições abertas no robô
            let dayHadTrades = false;

            // Simula o dia hora a hora (das 10h às 22h = 12 horas de sessão)
            for (let hour = 10; hour < 22; hour++) {
                // Atualiza posições abertas e fecha as que venceram o tempo
                currentOpenPositions = currentOpenPositions.filter(pos => {
                    if (hour >= pos.closeHour) {
                        // Computa P&L da posição encerrada
                        dailyGlobalPL += pos.profitUsd;
                        pairDailyPL[pos.symbol] += pos.profitUsd;

                        if (pos.profitUsd > 0) {
                            monthWins++;
                            totalWins++;
                            pairStats[pos.symbol].wins++;
                        } else {
                            monthLosses++;
                            totalLosses++;
                            pairStats[pos.symbol].losses++;
                        }
                        pairStats[pos.symbol].profitUsd += pos.profitUsd;
                        balance += pos.profitUsd;
                        return false;
                    }
                    return true;
                });

                if (globalBlocked) continue;

                // Verifica Trava Global Diária (-1.5%)
                if (dailyGlobalPL <= -(balance * (GLOBAL_DAILY_LOSS_PCT / 100.0))) {
                    globalBlocked = true;
                    blockedByDailyLossCount++;
                    // Fechar todas as posições imediatamente
                    currentOpenPositions.forEach(pos => {
                        let lossUsd = -RISK_PER_TRADE_USD;
                        dailyGlobalPL += lossUsd;
                        balance += lossUsd;
                        monthLosses++; totalLosses++;
                        pairStats[pos.symbol].losses++;
                        pairStats[pos.symbol].profitUsd += lossUsd;
                    });
                    currentOpenPositions = [];
                    continue;
                }

                // Tenta gerar sinal nos 8 pares
                for (let pIdx = 0; pIdx < PAIRS.length; pIdx++) {
                    let pair = PAIRS[pIdx];

                    // Checa se par bateu Meta (+1.0%) ou Risco (-1.5%) no dia
                    if (pairDailyPL[pair.symbol] >= (balance * (DAILY_GOAL_PCT / 100.0)) ||
                        pairDailyPL[pair.symbol] <= -(balance * (DAILY_LOSS_PCT / 100.0))) {
                        pairBlocked[pair.symbol] = true;
                    }

                    if (pairBlocked[pair.symbol]) {
                        blockedByDailyGoalCount++;
                        continue;
                    }

                    // TRAVA ESTREITA #1: Max Posições Simultâneas no Robô (InpMaxSimultaneousOps = 2)
                    if (currentOpenPositions.length >= MAX_SIMULTANEOUS_OPS_GLOBAL) {
                        blockedByMaxOpsCount++;
                        continue; // NENHUM OUTRO PAR PODE ABRIR!
                    }

                    // Checa oportunidade de sinal FR (probabilidade de gatilho por hora ~2.5%)
                    if (pseudoRandom() < 0.025) {
                        dayHadTrades = true;
                        monthTrades++;
                        totalTradesExecuted++;
                        pairStats[pair.symbol].trades++;

                        let outcome = pseudoRandom();
                        let profitUsd = 0;

                        if (outcome < pair.winRate * 0.55) {
                            profitUsd = (RISK_PER_TRADE_USD * pair.avgRR) - 2.50; // TP2
                        } else if (outcome < pair.winRate) {
                            profitUsd = (RISK_PER_TRADE_USD * 1.1) - 2.50; // TP1
                        } else if (outcome < pair.winRate + 0.10) {
                            profitUsd = -2.50; // BE
                        } else {
                            profitUsd = -RISK_PER_TRADE_USD - 2.50; // Stop
                        }

                        currentOpenPositions.push({
                            symbol: pair.symbol,
                            closeHour: hour + pair.avgDurationHours,
                            profitUsd: profitUsd
                        });
                    }
                }
            }

            // Fecha ordens remanescentes do dia
            currentOpenPositions.forEach(pos => {
                dailyGlobalPL += pos.profitUsd;
                pairDailyPL[pos.symbol] += pos.profitUsd;
                if (pos.profitUsd > 0) {
                    monthWins++; totalWins++;
                    pairStats[pos.symbol].wins++;
                } else {
                    monthLosses++; totalLosses++;
                    pairStats[pos.symbol].losses++;
                }
                pairStats[pos.symbol].profitUsd += pos.profitUsd;
                balance += pos.profitUsd;
            });

            if (!dayHadTrades) daysWithZeroTrades++;
        }

        let mProfit = balance - monthStartBalance;
        monthlyData.push({
            monthIndex: m + 1,
            startBal: monthStartBalance,
            endBal: balance,
            profitUsd: mProfit,
            profitPct: (mProfit / monthStartBalance) * 100.0,
            trades: monthTrades,
            wins: monthWins,
            losses: monthLosses
        });
    }

    return {
        initialBalance: INITIAL_BALANCE,
        finalBalance: balance,
        totalNetProfitUsd: balance - INITIAL_BALANCE,
        totalNetProfitPct: ((balance - INITIAL_BALANCE) / INITIAL_BALANCE) * 100.0,
        totalTradesExecuted,
        totalWins,
        totalLosses,
        winRate: ((totalWins / totalTradesExecuted) * 100).toFixed(1),
        blockedByMaxOpsCount,
        blockedByDailyGoalCount,
        daysWithZeroTrades,
        monthlyData,
        pairStats
    };
}

const strictRes = runStrictStateSimulation();

console.log("========================================================================");
console.log("    SIMULAÇÃO ULTRA-ESTRITA DE ALTO REALISMO (43 MESES)");
console.log("    TODAS AS TRAVAS ATIVAS: Max 2 Posições simultâneas, Meta +1%, Risco -1.5%");
console.log("========================================================================");
console.log(`Capital Inicial:                  $${strictRes.initialBalance.toFixed(2)} USD`);
console.log(`Capital Final:                    $${strictRes.finalBalance.toFixed(2)} USD`);
console.log(`Lucro Líquido Acumulado (Lote Fixo): +$${strictRes.totalNetProfitUsd.toFixed(2)} USD (+${strictRes.totalNetProfitPct.toFixed(2)}%)`);
console.log(`Lucro Médio Mensal da Carteira:    +$${(strictRes.totalNetProfitUsd / strictRes.monthlyData.length).toFixed(2)} USD/mês (+${(strictRes.totalNetProfitPct / strictRes.monthlyData.length).toFixed(2)}% ao mês)`);
console.log(`Média de Stops por Mês:          ${(strictRes.totalLosses / strictRes.monthlyData.length).toFixed(1)} stops/mês`);
console.log(`Total de Operações Executadas:    ${strictRes.totalTradesExecuted} trades`);
console.log(`Taxa de Assertividade (WinRate):   ${strictRes.winRate}% (${strictRes.totalWins}W / ${strictRes.totalLosses}L)`);
console.log(`Sinais Bloqueados por Max 2 Ops:  ${strictRes.blockedByMaxOpsCount} impedimentos de entrada simultânea`);
console.log(`Dias sem NENHUMA operação (Filtros): ${strictRes.daysWithZeroTrades} dias de mercado parado/sem sinal\n`);

console.log("--- DESEMPENHO MENSAL MÉDIO POR MOEDA COM TODAS AS TRAVAS E REGRAS ---");
Object.keys(strictRes.pairStats).forEach(sym => {
    let p = strictRes.pairStats[sym];
    let avgMonthlyUsd = p.profitUsd / strictRes.monthlyData.length;
    let avgMonthlyPct = (avgMonthlyUsd / INITIAL_BALANCE) * 100.0;
    let wr = p.trades > 0 ? ((p.wins / p.trades) * 100).toFixed(1) : "0.0";
    let sign = avgMonthlyUsd >= 0 ? "+" : "";
    console.log(`${sym.padEnd(8)} | Trades: ${p.trades.toString().padStart(3)} | ${p.wins}W / ${p.losses}L (${wr}%) | Média Mensal: ${sign}$${avgMonthlyUsd.toFixed(2)} (${sign}${avgMonthlyPct.toFixed(2)}%/mês)`);
});
