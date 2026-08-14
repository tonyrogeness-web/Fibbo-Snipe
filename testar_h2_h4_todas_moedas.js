const fs = require('fs');
const path = require('path');

const HIST_DIR = path.join(__dirname, '..', 'Orion_U2_Hedge', 'Historico Moedas');

const ALL_CSV_PAIRS = [
  { name: 'EURUSD', file: 'EURUSD_M15_202301030000_202608051445.csv' },
  { name: 'USDCAD', file: 'USDCAD_M15_202301030000_202608051445.csv' },
  { name: 'NZDUSD', file: 'AUDUSD_M15_202301030000_202608051445.csv' }, // Usa dataset longo como proxy
  { name: 'GBPUSD', file: 'GBPUSD_M15_202301030000_202608051445.csv' },
  { name: 'USDCHF', file: 'USDCHF_M15_202301030000_202608051445.csv' },
  { name: 'USDJPY', file: 'USDJPY_M15_202301030000_202608051445.csv' },
  { name: 'EURJPY', file: 'EURJPY_M15_202401020000_202608042345.csv' }
];

console.log('🔄 Testando H2 e H4 com SL 3.0% e TP 3.5% (ou 3.5x RR) em todas as moedas...\n');

function runTFSimulation(tfHours, riskPct, tpMulti) {
  console.log(`===================================================================================`);
  console.log(`📌 SIMULAÇÃO EM ${tfHours} HORA(S) (${tfHours === 2 ? 'H2' : 'H4'}) | RISCO: ${riskPct}% | TP2: ${tpMulti}x`);
  console.log(`===================================================================================`);

  ALL_CSV_PAIRS.forEach(p => {
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
      const open = parseFloat(parts[2]);
      const high = parseFloat(parts[3]);
      const low = parseFloat(parts[4]);
      const close = parseFloat(parts[5]);
      if (isNaN(open) || isNaN(high) || isNaN(low) || isNaN(close)) continue;
      m15Candles.push({ dateStr: parts[0], timeStr: parts[1], open, high, low, close });
    }

    const groupSize = tfHours * 4;
    const tfCandles = [];
    for (let i = 0; i < m15Candles.length; i += groupSize) {
      const g = m15Candles.slice(i, i + groupSize);
      if (g.length === 0) continue;
      tfCandles.push({
        open: g[0].open,
        high: Math.max(...g.map(c => c.high)),
        low: Math.min(...g.map(c => c.low)),
        close: g[g.length - 1].close
      });
    }

    // Indicadores simples
    let balance = 10000.0;
    let peak = 10000.0;
    let maxDD = 0;
    let trades = 0, wins = 0, losses = 0, grossProfit = 0, grossLoss = 0;

    for (let i = 20; i < tfCandles.length; i++) {
      const c = tfCandles[i];
      const prev = tfCandles[i-1];
      const body = Math.abs(c.close - c.open);
      const upperWick = c.high - Math.max(c.open, c.close);
      const lowerWick = Math.min(c.open, c.close) - c.low;
      const totalRange = c.high - c.low;

      let signal = null;
      if (upperWick >= body * 0.5 && upperWick >= totalRange * 0.35) signal = 'SELL';
      else if (lowerWick >= body * 0.5 && lowerWick >= totalRange * 0.35) signal = 'BUY';

      if (signal) {
        trades++;
        const riskUsd = balance * (riskPct / 100.0);
        const isWin = (signal === 'BUY' && c.close > prev.close) || (signal === 'SELL' && c.close < prev.close);

        if (isWin) {
          wins++;
          const profit = riskUsd * (tpMulti * 0.5 + 1.0 * 0.5); // TP1 + TP2
          grossProfit += profit;
          balance += profit;
        } else {
          losses++;
          grossLoss += riskUsd;
          balance -= riskUsd;
        }

        if (balance > peak) peak = balance;
        const dd = ((peak - balance) / peak) * 100;
        if (dd > maxDD) maxDD = dd;
      }
    }

    const netProfit = balance - 10000.0;
    const pf = grossLoss > 0 ? grossProfit / grossLoss : (grossProfit > 0 ? 99 : 0);
    const winRate = trades > 0 ? (wins / trades) * 100 : 0;
    const tradesPerMonth = trades / 43;

    console.log(`${p.name.padEnd(8, ' ')} | Profit: +$${netProfit.toFixed(2).padEnd(9, ' ')} | WinRate: ${winRate.toFixed(1)}% | PF: ${pf.toFixed(2)} | MaxDD: ${maxDD.toFixed(2)}% | Trades/Mês: ~${tradesPerMonth.toFixed(1)} ops (Total: ${trades})`);
  });
  console.log('\n');
}

runTFSimulation(2, 3.0, 3.5);
runTFSimulation(4, 3.0, 3.5);
