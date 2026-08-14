const fs = require('fs');
const path = require('path');

// ====================================================================
// SIMULADOR DE ALTA PRECISÃO FIBBO SNIPER (2023 - 2026)
// COMPARATIVO REALISTA CÂNDALO A CÂNDALO: M15 vs M30 vs H1
// ====================================================================

const HIST_DIR = path.join(__dirname, '..', 'Orion_U2_Hedge', 'Historico Moedas');

const PAIRS = [
  { name: 'EURUSD', file: 'EURUSD_M15_202301030000_202608051445.csv', pipSize: 0.0001, isInverse: false, spreadPips: 1.2 },
  { name: 'GBPUSD', file: 'GBPUSD_M15_202301030000_202608051445.csv', pipSize: 0.0001, isInverse: false, spreadPips: 1.5 },
  { name: 'USDCAD', file: 'USDCAD_M15_202301030000_202608051445.csv', pipSize: 0.0001, isInverse: true,  spreadPips: 1.5 },
  { name: 'USDJPY', file: 'USDJPY_M15_202301030000_202608051445.csv', pipSize: 0.01,   isInverse: true,  spreadPips: 1.5 },
  { name: 'USDCHF', file: 'USDCHF_M15_202301030000_202608051445.csv', pipSize: 0.0001, isInverse: true,  spreadPips: 1.5 }
];

console.log('🔄 Carregando histórico M15 de alta fidelidade (Jan/2023 - Ago/2026)...');

// Função para ler velas M15 e agrupar para M15, M30 e H1
function loadAndResampleData() {
  const data = {};

  PAIRS.forEach(p => {
    const filePath = path.join(HIST_DIR, p.file);
    if (!fs.existsSync(filePath)) return;

    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    const m15Candles = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      const parts = line.split('\t');
      if (parts.length < 6) continue;
      const dateStr = parts[0].replace(/\./g, '-');
      const timeStr = parts[1];
      const open = parseFloat(parts[2]);
      const high = parseFloat(parts[3]);
      const low = parseFloat(parts[4]);
      const close = parseFloat(parts[5]);
      if (isNaN(open) || isNaN(high) || isNaN(low) || isNaN(close)) continue;

      const timestamp = new Date(`${dateStr}T${timeStr}Z`).getTime();
      m15Candles.push({ dateStr, timeStr, timestamp, open, high, low, close });
    }

    m15Candles.sort((a, b) => a.timestamp - b.timestamp);

    // Constrói M30 e H1
    const m30Candles = [];
    const h1Candles = [];

    // Resample M30 (a cada 2 velas M15)
    for (let i = 0; i < m15Candles.length; i += 2) {
      const c1 = m15Candles[i];
      const c2 = m15Candles[i + 1] || c1;
      m30Candles.push({
        dateStr: c1.dateStr,
        timeStr: c1.timeStr,
        timestamp: c1.timestamp,
        open: c1.open,
        high: Math.max(c1.high, c2.high),
        low: Math.min(c1.low, c2.low),
        close: c2.close
      });
    }

    // Resample H1 (a cada 4 velas M15)
    for (let i = 0; i < m15Candles.length; i += 4) {
      const group = m15Candles.slice(i, i + 4);
      if (group.length === 0) continue;
      const cFirst = group[0];
      const cLast = group[group.length - 1];
      const high = Math.max(...group.map(c => c.high));
      const low = Math.min(...group.map(c => c.low));
      h1Candles.push({
        dateStr: cFirst.dateStr,
        timeStr: cFirst.timeStr,
        timestamp: cFirst.timestamp,
        open: cFirst.open,
        high,
        low,
        close: cLast.close
      });
    }

    data[p.name] = {
      pairInfo: p,
      M15: computeIndicators(m15Candles),
      M30: computeIndicators(m30Candles),
      H1: computeIndicators(h1Candles)
    };
  });

  return data;
}

function computeIndicators(candles) {
  const periodATR = 14;
  const periodRSI = 14;
  let atr = 0;
  let gains = 0, losses = 0;
  let prevClose = candles[0] ? candles[0].close : 0;
  atr = candles[0] ? (candles[0].high - candles[0].low) : 0;

  return candles.map((c, i) => {
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

    return { ...c, atr, rsi };
  });
}

function runSimulationForTF(tfName, marketData, config) {
  const {
    initialBalance = 10000.0,
    riskPerTradePct = 1.2,
    dailyStopLossPct = 2.5,
    dailyProfitTargetPct = 3.0,
    maxSimultaneousTrades = 2,
    tp1Multi = 1.0,
    tp2Multi = 3.0,
    rsiOverbought = 68,
    rsiOversold = 32,
    wickRatio = 0.35
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

  let noiseStops = 0; // Quantidade de stops provocados por pavios de ruído curto

  let openPositions = [];
  let currentDateStr = '';
  let dailyPnlUsd = 0;
  let dailyBlocked = false;

  const pairList = Object.keys(marketData);
  const lastEntryTime = {};
  pairList.forEach(p => lastEntryTime[p] = 0);

  // Alinha todas as velas ordenadas por timestamp
  const allTimestamps = new Set();
  pairList.forEach(p => {
    marketData[p][tfName].forEach(c => allTimestamps.add(c.timestamp));
  });
  const sortedTs = Array.from(allTimestamps).sort((a, b) => a - b);

  // Mapeamento por timestamp
  const candleMap = {};
  pairList.forEach(p => {
    candleMap[p] = {};
    marketData[p][tfName].forEach(c => {
      candleMap[p][c.timestamp] = c;
    });
  });

  for (let tsIdx = 0; tsIdx < sortedTs.length; tsIdx++) {
    const ts = sortedTs[tsIdx];
    const sampleCandle = candleMap[pairList[0]][ts] || candleMap[pairList[1]][ts];
    if (!sampleCandle) continue;

    const dateStr = sampleCandle.dateStr;

    if (dateStr !== currentDateStr) {
      currentDateStr = dateStr;
      dailyPnlUsd = 0;
      dailyBlocked = false;
    }

    // 1. Atualizar e fechar posições abertas
    for (let i = openPositions.length - 1; i >= 0; i--) {
      const pos = openPositions[i];
      const candle = candleMap[pos.pairName][ts];
      if (!candle) continue;

      let closed = false;
      let reason = '';

      if (pos.type === 'BUY') {
        if (candle.low <= pos.slPrice) {
          closed = true;
          reason = pos.tp1Hit ? 'BE' : 'SL';
          if (!pos.tp1Hit) {
            // Se o SL ocorreu com uma oscilação menor que 1.5x ATR, foi ruído de mercado
            if ((pos.openPrice - candle.low) < candle.atr * 1.5) noiseStops++;
          }
        } else if (!pos.tp1Hit && candle.high >= pos.tp1Price) {
          pos.tp1Hit = true;
          pos.slPrice = pos.openPrice; // Move SL para Breakeven
          const p1Usd = pos.part1Usd * tp1Multi;
          grossProfitUsd += p1Usd;
          balance += p1Usd;
          dailyPnlUsd += p1Usd;
        } else if (pos.tp1Hit && candle.high >= pos.tp2Price) {
          closed = true;
          reason = 'TP2';
        }
      } else { // SELL
        if (candle.high >= pos.slPrice) {
          closed = true;
          reason = pos.tp1Hit ? 'BE' : 'SL';
          if (!pos.tp1Hit) {
            if ((candle.high - pos.openPrice) < candle.atr * 1.5) noiseStops++;
          }
        } else if (!pos.tp1Hit && candle.low <= pos.tp1Price) {
          pos.tp1Hit = true;
          pos.slPrice = pos.openPrice;
          const p1Usd = pos.part1Usd * tp1Multi;
          grossProfitUsd += p1Usd;
          balance += p1Usd;
          dailyPnlUsd += p1Usd;
        } else if (pos.tp1Hit && candle.low <= pos.tp2Price) {
          closed = true;
          reason = 'TP2';
        }
      }

      if (closed) {
        if (reason === 'TP2') {
          const p2Usd = pos.part2Usd * tp2Multi;
          grossProfitUsd += p2Usd;
          balance += p2Usd;
          dailyPnlUsd += p2Usd;
          winningTrades++;
        } else if (reason === 'BE') {
          breakevenTrades++;
        } else if (reason === 'SL') {
          const lossUsd = pos.riskMoneyUsd;
          grossLossUsd += lossUsd;
          balance -= lossUsd;
          dailyPnlUsd -= lossUsd;
          losingTrades++;
        }

        totalTrades++;
        openPositions.splice(i, 1);

        if (balance > peakBalance) peakBalance = balance;
        const currentDDUsd = peakBalance - balance;
        const currentDDPct = (currentDDUsd / peakBalance) * 100;
        if (currentDDUsd > maxDDUsd) maxDDUsd = currentDDUsd;
        if (currentDDPct > maxDDPct) maxDDPct = currentDDPct;
      }
    }

    // 2. Travas Diárias
    const dailyStopLimit = balance * (dailyStopLossPct / 100.0);
    const dailyTargetLimit = balance * (dailyProfitTargetPct / 100.0);

    if (!dailyBlocked) {
      if (dailyPnlUsd <= -dailyStopLimit || dailyPnlUsd >= dailyTargetLimit) {
        dailyBlocked = true;
        openPositions = [];
      }
    }

    if (dailyBlocked) continue;

    // 3. Procura novos sinais Falso Rompimento (FR)
    for (let pIdx = 0; pIdx < pairList.length; pIdx++) {
      if (openPositions.length >= maxSimultaneousTrades) break;

      const pName = pairList[pIdx];
      // Cooldown adaptativo baseado no TF
      const cooldownMs = tfName === 'M15' ? 3600000 : (tfName === 'M30' ? 5400000 : 7200000);
      if (ts - (lastEntryTime[pName] || 0) < cooldownMs) continue;

      const candle = candleMap[pName][ts];
      if (!candle || !candle.atr || !candle.rsi) continue;

      const timeParts = candle.timeStr.split(':');
      const hour = parseInt(timeParts[0], 10);
      if (hour < 7 || hour >= 18) continue; // Janela Operacional Londres/NY

      const body = Math.abs(candle.close - candle.open);
      const upperWick = candle.high - Math.max(candle.open, candle.close);
      const lowerWick = Math.min(candle.open, candle.close) - candle.low;
      const totalRange = candle.high - candle.low;

      if (totalRange < candle.atr * 0.4) continue;

      let signal = null;
      if (candle.rsi > rsiOverbought && upperWick >= body * 0.5 && upperWick >= totalRange * wickRatio) {
        signal = 'SELL';
      } else if (candle.rsi < rsiOversold && lowerWick >= body * 0.5 && lowerWick >= totalRange * wickRatio) {
        signal = 'BUY';
      }

      if (signal) {
        const riskMoneyUsd = balance * (riskPerTradePct / 100.0);
        const slDist = candle.atr * 1.2;
        const tp1Dist = slDist * tp1Multi;
        const tp2Dist = slDist * tp2Multi;

        const slPrice = signal === 'BUY' ? candle.close - slDist : candle.close + slDist;
        const tp1Price = signal === 'BUY' ? candle.close + tp1Dist : candle.close - tp1Dist;
        const tp2Price = signal === 'BUY' ? candle.close + tp2Dist : candle.close - tp2Dist;

        openPositions.push({
          pairName: pName,
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

        lastEntryTime[pName] = ts;
      }
    }
  }

  const netProfitUsd = balance - initialBalance;
  const netProfitPct = (netProfitUsd / initialBalance) * 100;
  const winRatePct = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;
  const pf = grossLossUsd > 0 ? grossProfitUsd / grossLossUsd : 0;
  const tradesPerMonth = totalTrades / 43; // 43 meses (2023 - 2026)
  const monthlyProfitPct = netProfitPct / 43;
  const monthlyProfitUsd = netProfitUsd / 43;
  const noiseRatioPct = losingTrades > 0 ? (noiseStops / losingTrades) * 100 : 0;

  return {
    tfName,
    initialBalance,
    finalBalance: Math.round(balance * 100) / 100,
    netProfitUsd: Math.round(netProfitUsd * 100) / 100,
    netProfitPct: Math.round(netProfitPct * 10) / 10,
    monthlyProfitUsd: Math.round(monthlyProfitUsd * 100) / 100,
    monthlyProfitPct: Math.round(monthlyProfitPct * 100) / 100,
    maxDDUsd: Math.round(maxDDUsd * 100) / 100,
    maxDDPct: Math.round(maxDDPct * 100) / 100,
    winRatePct: Math.round(winRatePct * 10) / 10,
    pf: Math.round(pf * 100) / 100,
    totalTrades,
    winningTrades,
    losingTrades,
    breakevenTrades,
    tradesPerMonth: Math.round(tradesPerMonth * 10) / 10,
    noiseRatioPct: Math.round(noiseRatioPct * 10) / 10
  };
}

// EXECUÇÃO DO TESTE COMPARATIVO REALISTA
const marketData = loadAndResampleData();

console.log('\n==================================================================================================');
console.log('📌 MATRIZ AUDITADA DE PERFORMANCE: M15 vs M30 vs H1 (PERIOD DE 43 MESES | 2023 - 2026)');
console.log('==================================================================================================\n');

const resM15 = runSimulationForTF('M15', marketData, { riskPerTradePct: 1.2 });
const resM30 = runSimulationForTF('M30', marketData, { riskPerTradePct: 1.2 });
const resH1  = runSimulationForTF('H1',  marketData, { riskPerTradePct: 1.2 });

console.log('Timeframe  | Lucro Total (3.5y) | Lucro Mensal ($) | % Mensal | Max DD (%) | Win Rate | Profit Factor | Trades/Mês | Nível de Ruído');
console.log('---------------------------------------------------------------------------------------------------------------------------------');

[resM15, resM30, resH1].forEach(r => {
  const tf = r.tfName.padEnd(10, ' ');
  const totProfit = (`+$${r.netProfitUsd.toFixed(2)} (${r.netProfitPct.toFixed(1)}%)`).padEnd(18, ' ');
  const mProfit = (`+$${r.monthlyProfitUsd.toFixed(2)}`).padEnd(16, ' ');
  const mPct = (`+${r.monthlyProfitPct.toFixed(2)}%`).padEnd(8, ' ');
  const dd = (`${r.maxDDPct.toFixed(2)}%`).padEnd(10, ' ');
  const wr = (`${r.winRatePct.toFixed(1)}%`).padEnd(8, ' ');
  const pf = (r.pf.toFixed(2)).padEnd(13, ' ');
  const tpm = (`~${r.tradesPerMonth} ops`).padEnd(10, ' ');
  const noise = `${r.noiseRatioPct}% (Stops por ruído)`;

  console.log(`${tf} | ${totProfit} | ${mProfit} | ${mPct} | ${dd} | ${wr} | ${pf} | ${tpm} | ${noise}`);
});

console.log('\n---------------------------------------------------------------------------------------------------------------------------------\n');
