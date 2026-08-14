const fs = require('fs');
const path = require('path');

// ====================================================================
// SIMULADOR BACKTEST FIBBO SNIPER - CENÁRIO C (2023 - 2026)
// CONFIGURAÇÃO: APENAS FALSO ROMPIMENTO (FR)
// RISCO: 1.2% POR TRADE | TP1: 1.0x (50% BE) | TP2: 3.0x (50%)
// TOTAL WIN CHEIO = +2.4% (+$240) | LOSS STACK = -1.2% (-$120)
// ====================================================================

const HIST_DIR = path.join(__dirname, '..', 'Orion_U2_Hedge', 'Historico Moedas');

const PAIRS = [
  { name: 'EURUSD', file: 'EURUSD_M15_202301030000_202608051445.csv', pipSize: 0.0001, isInverse: false, spreadPips: 1.2 },
  { name: 'GBPUSD', file: 'GBPUSD_M15_202301030000_202608051445.csv', pipSize: 0.0001, isInverse: false, spreadPips: 1.5 },
  { name: 'USDCAD', file: 'USDCAD_M15_202301030000_202608051445.csv', pipSize: 0.0001, isInverse: true,  spreadPips: 1.5 },
  { name: 'USDJPY', file: 'USDJPY_M15_202301030000_202608051445.csv', pipSize: 0.01,   isInverse: true,  spreadPips: 1.5 },
  { name: 'USDCHF', file: 'USDCHF_M15_202301030000_202608051445.csv', pipSize: 0.0001, isInverse: true,  spreadPips: 1.5 },
  { name: 'EURJPY', file: 'EURJPY_M15_202401020000_202608042345.csv', pipSize: 0.01,   isInverse: true,  spreadPips: 1.8 }
];

console.log('🔄 Carregando dados históricos M15 de alta precisão (2023 - 2026)...');

const candleIndexMap = {};
const pairCandlesList = {};
const allTimestampsSet = new Set();
const pairAtrMap = {};
const pairRsiMap = {};

PAIRS.forEach(p => {
  candleIndexMap[p.name] = {};
  pairCandlesList[p.name] = [];
  pairAtrMap[p.name] = {};
  pairRsiMap[p.name] = {};

  const filePath = path.join(HIST_DIR, p.file);
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️ Arquivo não encontrado: ${p.file}`);
    return;
  }

  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  const periodATR = 14;
  let atr = 0;
  let gains = 0, losses = 0;
  const periodRSI = 14;

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const parts = line.split('\t');
    if (parts.length < 6) continue;
    const dateStr = parts[0];
    const open = parseFloat(parts[2]);
    const high = parseFloat(parts[3]);
    const low = parseFloat(parts[4]);
    const close = parseFloat(parts[5]);
    if (isNaN(open) || isNaN(high) || isNaN(low) || isNaN(close)) continue;

    const dateFormatted = dateStr.replace(/\./g, '-');
    const timeStr = parts[1];
    const timestamp = new Date(`${dateFormatted}T${timeStr}Z`).getTime();
    const candleObj = { dateStr, timeStr, timestamp, open, high, low, close };

    candleIndexMap[p.name][timestamp] = candleObj;
    pairCandlesList[p.name].push(candleObj);
    allTimestampsSet.add(timestamp);
  }

  pairCandlesList[p.name].sort((a,b) => a.timestamp - b.timestamp);
  const list = pairCandlesList[p.name];
  let prevClose = list[0] ? list[0].close : 0;
  atr = list[0] ? (list[0].high - list[0].low) : 0;

  for (let i = 0; i < list.length; i++) {
    const c = list[i];
    if (i === 0) {
      prevClose = c.close;
    } else {
      const tr = Math.max(c.high - c.low, Math.abs(c.high - prevClose), Math.abs(c.low - prevClose));
      atr = (atr * (periodATR - 1) + tr) / periodATR;
      const change = c.close - prevClose;
      const gain = change > 0 ? change : 0;
      const loss = change < 0 ? -change : 0;

      if (i <= periodRSI) {
        gains += gain; losses += loss;
      } else {
        gains = (gains * 13 + gain) / 14;
        losses = (losses * 13 + loss) / 14;
      }
      prevClose = c.close;
    }

    const rs = losses === 0 ? 100 : gains / losses;
    const rsi = 100 - (100 / (1 + rs));

    pairAtrMap[p.name][c.timestamp] = atr;
    pairRsiMap[p.name][c.timestamp] = rsi;
  }
});

const sortedTimestamps = Array.from(allTimestampsSet).sort((a, b) => a - b);

function runCenarioCSimulation(pairsList, config) {
  const {
    name,
    initialBalance = 10000.0,
    riskPerTradePct = 1.2,
    dailyStopLossPct = 2.5,
    dailyProfitTargetPct = 3.0,
    maxSimultaneousTrades = 2,
    tp1Multi = 1.0,
    tp2Multi = 3.0
  } = config;

  let balance = initialBalance;
  let peakBalance = initialBalance;
  let maxDDUsd = 0;
  let maxDDPct = 0;

  let totalTrades = 0;
  let winningTrades = 0;
  let losingTrades = 0;
  let breakevenTrades = 0;
  let grossProfitUsd = 0;
  let grossLossUsd = 0;

  let openPositions = [];
  let currentDateStr = '';
  let dailyPnlUsd = 0;
  let dailyBlocked = false;
  let dailyStopsHit = 0;
  let dailyTargetsHit = 0;

  const yearlyStats = {};
  const pairStats = {};
  pairsList.forEach(p => {
    pairStats[p.name] = { trades: 0, wins: 0, losses: 0, profit: 0 };
  });

  const lastEntryTime = {};
  pairsList.forEach(p => lastEntryTime[p.name] = 0);

  for (let tsIdx = 0; tsIdx < sortedTimestamps.length; tsIdx++) {
    const ts = sortedTimestamps[tsIdx];
    const sampleCandle = candleIndexMap['EURUSD'][ts] || candleIndexMap[pairsList[0].name][ts];
    if (!sampleCandle) continue;

    const dateStr = sampleCandle.dateStr;
    const yearStr = dateStr.substring(0, 4);

    if (!yearlyStats[yearStr]) {
      yearlyStats[yearStr] = { profit: 0, trades: 0, wins: 0, losses: 0, targets: 0, stops: 0 };
    }

    if (dateStr !== currentDateStr) {
      currentDateStr = dateStr;
      dailyPnlUsd = 0;
      dailyBlocked = false;
    }

    // 1. Atualiza posições abertas
    for (let i = openPositions.length - 1; i >= 0; i--) {
      const pos = openPositions[i];
      const candle = candleIndexMap[pos.pairName][ts];
      if (!candle) continue;

      let closed = false;
      let closePrice = 0;
      let profitUsd = 0;
      let reason = '';

      if (pos.type === 'BUY') {
        // Checa SL
        if (candle.low <= pos.slPrice) {
          closed = true;
          closePrice = pos.slPrice;
          reason = pos.tp1Hit ? 'BE' : 'SL';
        } else if (!pos.tp1Hit && candle.high >= pos.tp1Price) {
          // Ativa TP1
          pos.tp1Hit = true;
          pos.slPrice = pos.openPrice; // Move SL para o Zero (Breakeven)
          const p1Usd = pos.part1Usd * tp1Multi;
          profitUsd += p1Usd;
          grossProfitUsd += p1Usd;
          balance += p1Usd;
          dailyPnlUsd += p1Usd;
        } else if (pos.tp1Hit && candle.high >= pos.tp2Price) {
          // Ativa TP2
          closed = true;
          closePrice = pos.tp2Price;
          reason = 'TP2';
        }
      } else { // SELL
        if (candle.high >= pos.slPrice) {
          closed = true;
          closePrice = pos.slPrice;
          reason = pos.tp1Hit ? 'BE' : 'SL';
        } else if (!pos.tp1Hit && candle.low <= pos.tp1Price) {
          pos.tp1Hit = true;
          pos.slPrice = pos.openPrice;
          const p1Usd = pos.part1Usd * tp1Multi;
          profitUsd += p1Usd;
          grossProfitUsd += p1Usd;
          balance += p1Usd;
          dailyPnlUsd += p1Usd;
        } else if (pos.tp1Hit && candle.low <= pos.tp2Price) {
          closed = true;
          closePrice = pos.tp2Price;
          reason = 'TP2';
        }
      }

      if (closed) {
        if (reason === 'TP2') {
          const p2Usd = pos.part2Usd * tp2Multi;
          profitUsd += p2Usd;
          grossProfitUsd += p2Usd;
          balance += p2Usd;
          dailyPnlUsd += p2Usd;
          winningTrades++;
          pairStats[pos.pairName].wins++;
        } else if (reason === 'BE') {
          breakevenTrades++;
        } else if (reason === 'SL') {
          const lossUsd = pos.riskMoneyUsd;
          profitUsd -= lossUsd;
          grossLossUsd += lossUsd;
          balance -= lossUsd;
          dailyPnlUsd -= lossUsd;
          losingTrades++;
          pairStats[pos.pairName].losses++;
        }

        totalTrades++;
        pairStats[pos.pairName].trades++;
        pairStats[pos.pairName].profit += profitUsd;

        yearlyStats[yearStr].trades++;
        yearlyStats[yearStr].profit += profitUsd;
        if (profitUsd > 0) yearlyStats[yearStr].wins++;

        openPositions.splice(i, 1);

        if (balance > peakBalance) peakBalance = balance;
        const currentDDUsd = peakBalance - balance;
        const currentDDPct = (currentDDUsd / peakBalance) * 100;
        if (currentDDUsd > maxDDUsd) maxDDUsd = currentDDUsd;
        if (currentDDPct > maxDDPct) maxDDPct = currentDDPct;
      }
    }

    // 2. Checa Travas Diárias
    const dailyStopLimit = balance * (dailyStopLossPct / 100.0);
    const dailyTargetLimit = balance * (dailyProfitTargetPct / 100.0);

    if (!dailyBlocked) {
      if (dailyPnlUsd <= -dailyStopLimit) {
        dailyBlocked = true;
        dailyStopsHit++;
        yearlyStats[yearStr].stops++;
        // Fecha posições abertas
        openPositions = [];
      } else if (dailyPnlUsd >= dailyTargetLimit) {
        dailyBlocked = true;
        dailyTargetsHit++;
        yearlyStats[yearStr].targets++;
      }
    }

    if (dailyBlocked) continue;

    // 3. Procura novos sinais de Falso Rompimento (FR)
    for (let pIdx = 0; pIdx < pairsList.length; pIdx++) {
      if (openPositions.length >= maxSimultaneousTrades) break;

      const p = pairsList[pIdx];
      if (ts - (lastEntryTime[p.name] || 0) < 3600000) continue; // Cooldown 1h

      const candle = candleIndexMap[p.name][ts];
      const atr = pairAtrMap[p.name][ts];
      const rsi = pairRsiMap[p.name][ts];
      if (!candle || !atr || !rsi) continue;

      const timeParts = candle.timeStr.split(':');
      const hour = parseInt(timeParts[0], 10);

      // Filtro de Sessão Líquida (Londres / NY: 07:00 a 18:00 GMT)
      if (hour < 7 || hour >= 18) continue;

      const body = Math.abs(candle.close - candle.open);
      const upperWick = candle.high - Math.max(candle.open, candle.close);
      const lowerWick = Math.min(candle.open, candle.close) - candle.low;
      const totalRange = candle.high - candle.low;

      if (totalRange < atr * 0.4) continue; // Filtro ATR relativo

      let signal = null;
      // Falso Rompimento de Alta (Rejeição de Topo -> Venda)
      if (rsi > 68 && upperWick >= body * 0.5 && upperWick >= totalRange * 0.35) {
        signal = 'SELL';
      }
      // Falso Rompimento de Baixa (Rejeição de Fundo -> Compra)
      else if (rsi < 32 && lowerWick >= body * 0.5 && lowerWick >= totalRange * 0.35) {
        signal = 'BUY';
      }

      if (signal) {
        const riskMoneyUsd = balance * (riskPerTradePct / 100.0);
        const slDist = atr * 1.2;
        const tp1Dist = slDist * tp1Multi;
        const tp2Dist = slDist * tp2Multi;

        let slPrice, tp1Price, tp2Price;

        if (signal === 'BUY') {
          slPrice = candle.close - slDist;
          tp1Price = candle.close + tp1Dist;
          tp2Price = candle.close + tp2Dist;
        } else {
          slPrice = candle.close + slDist;
          tp1Price = candle.close - tp1Dist;
          tp2Price = candle.close - tp2Dist;
        }

        openPositions.push({
          pairName: p.name,
          type: signal,
          openPrice: candle.close,
          slPrice,
          tp1Price,
          tp2Price,
          tp1Hit: false,
          riskMoneyUsd,
          part1Usd: riskMoneyUsd * 0.5,
          part2Usd: riskMoneyUsd * 0.5
        });

        lastEntryTime[p.name] = ts;
      }
    }
  }

  const netProfitUsd = balance - initialBalance;
  const netProfitPct = (netProfitUsd / initialBalance) * 100;
  const winRatePct = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;
  const pf = grossLossUsd > 0 ? grossProfitUsd / grossLossUsd : 0;

  return {
    name,
    initialBalance,
    finalBalance: Math.round(balance * 100) / 100,
    netProfitUsd: Math.round(netProfitUsd * 100) / 100,
    netProfitPct: Math.round(netProfitPct * 10) / 10,
    maxDDUsd: Math.round(maxDDUsd * 100) / 100,
    maxDDPct: Math.round(maxDDPct * 10) / 10,
    winRatePct: Math.round(winRatePct * 10) / 10,
    pf: Math.round(pf * 100) / 100,
    totalTrades,
    winningTrades,
    losingTrades,
    breakevenTrades,
    dailyStopsHit,
    dailyTargetsHit,
    yearlyStats,
    pairStats
  };
}

const TOP5_PAIRS = PAIRS.filter(p => ['EURUSD', 'USDJPY', 'USDCHF', 'USDCAD', 'GBPUSD'].includes(p.name));
const TOP6_PAIRS = PAIRS;

const resTop5 = runCenarioCSimulation(TOP5_PAIRS, {
  name: 'Fibbo Sniper - Cenário C (Top 5 Pares em FR: Risco 1.2%, TP1 1.0x, TP2 3.0x)'
});

const resTop6 = runCenarioCSimulation(TOP6_PAIRS, {
  name: 'Fibbo Sniper - Cenário C (Top 6 Pares + EURJPY: Risco 1.2%, TP1 1.0x, TP2 3.0x)'
});

[resTop5, resTop6].forEach(r => {
  console.log(`===================================================================================`);
  console.log(`📌 SIMULAÇÃO DE BACKTEST: ${r.name}`);
  console.log(`   • Capital Inicial:          $${r.initialBalance.toFixed(2)}`);
  console.log(`   • Capital Final:            $${r.finalBalance.toFixed(2)}`);
  console.log(`   • Lucro Líquido Total:      +$${r.netProfitUsd.toFixed(2)} (+${r.netProfitPct}%)`);
  console.log(`   • Lucro Médio Mensal:       +$${(r.netProfitUsd / 43).toFixed(2)} (+${(r.netProfitPct / 43).toFixed(2)}%/mês)`);
  console.log(`   • Retorno Médio Anual:      +${((r.netProfitPct / 43) * 12).toFixed(2)}% / ano`);
  console.log(`   • Drawdown Máximo Real:     $${r.maxDDUsd.toFixed(2)} (${r.maxDDPct}%)`);
  console.log(`   • Profit Factor:            ${r.pf}`);
  console.log(`   • Assertividade (Win Rate): ${r.winRatePct}% (${r.winningTrades} Wins / ${r.losingTrades} Stops / ${r.breakevenTrades} BE) em ${r.totalTrades} trades`);
  console.log(`   • Dias com Alvo Batido (+3%): ${r.dailyTargetsHit} dias`);
  console.log(`   • Dias com Trava Ativada (-2.5%): ${r.dailyStopsHit} dias (Escudo de Segurança)`);
  console.log(`   • Desempenho Ano a Ano:`);
  Object.keys(r.yearlyStats).forEach(y => {
    const ys = r.yearlyStats[y];
    console.log(`       - ${y}: +$${ys.profit.toFixed(2)} | ${ys.trades} trades | Wins: ${ys.wins} | Metas: ${ys.targets}d | Stops: ${ys.stops}d`);
  });
  console.log(`-----------------------------------------------------------------------------------`);
});
