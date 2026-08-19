const fs = require('fs');
const path = require('path');

const HIST_DIR = path.join(__dirname, '../Orion_U2_Hedge/Historico Moedas');

const ALL_PAIRS = [
  { name: 'USDCAD', file: 'USDCAD_M15_202301030000_202608051445.csv', pipSize: 0.0001 },
  { name: 'EURJPY', file: 'EURJPY_M15_202401020000_202608042345.csv', pipSize: 0.01   },
  { name: 'GBPUSD', file: 'GBPUSD_M15_202301030000_202608051445.csv', pipSize: 0.0001 },
  { name: 'AUDUSD', file: 'AUDUSD_M15_202301030000_202608051445.csv', pipSize: 0.0001 },
  { name: 'USDCHF', file: 'USDCHF_M15_202301030000_202608051445.csv', pipSize: 0.0001 }
];

console.log('=== TESTE QUANTITATIVO: RETRAÇÕES DE FIBONACCI (2023-2026) ===\n');

// Testaremos diferentes níveis de retração a partir do início da correção:
// 18.0% (Micro pullback)
// 38.2% (Pullback Raso / Momentum)
// 50.0% (Pullback Médio)
// 61.8% (Golden Ratio / Retração Profunda)
// 78.6% (Extremo)

const levelsToTest = [
  { name: '18.0% (Micro Retração)', pct: 0.18 },
  { name: '23.6% (Fibo Curto)',      pct: 0.236 },
  { name: '38.2% (Fibo Raso)',       pct: 0.382 },
  { name: '50.0% (Fibo Médio)',      pct: 0.50 },
  { name: '61.8% (Fibo Ouro)',       pct: 0.618 }
];

levelsToTest.forEach(lvl => {
  let totalTrades = 0;
  let totalWins = 0;
  let totalProfitPips = 0;
  let maxDD = 0;
  let profitFactor = 0;
  let grossProfit = 0, grossLoss = 0;

  ALL_PAIRS.forEach(p => {
    const filePath = path.join(HIST_DIR, p.file);
    if (!fs.existsSync(filePath)) return;
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    const candles = [];

    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].trim().split('\t');
      if (parts.length < 6) continue;
      const open = parseFloat(parts[2]), high = parseFloat(parts[3]), low = parseFloat(parts[4]), close = parseFloat(parts[5]);
      if (!isNaN(close)) candles.push({ open, high, low, close });
    }

    // Identificar pernadas H4 (agrupando M15 em blocos de 16 velas)
    const h4Bars = [];
    for (let i = 0; i < candles.length; i += 16) {
      const chunk = candles.slice(i, i + 16);
      if (chunk.length < 16) continue;
      const o = chunk[0].open;
      const h = Math.max(...chunk.map(c => c.high));
      const l = Math.min(...chunk.map(c => c.low));
      const c = chunk[chunk.length - 1].close;
      h4Bars.push({ open: o, high: h, low: l, close: c });
    }

    // Simular Fibo em H4
    const lookback = 20;
    for (let i = lookback; i < h4Bars.length - 10; i++) {
      const window = h4Bars.slice(i - lookback, i);
      const high = Math.max(...window.map(b => b.high));
      const low = Math.min(...window.map(b => b.low));
      const range = high - low;
      if (range < p.pipSize * 50) continue; // Range mínimo

      const isUptrend = h4Bars[i].close > h4Bars[i - 5].close;
      const isDowntrend = h4Bars[i].close < h4Bars[i - 5].close;

      if (isUptrend) {
        // Compra no pullback: preço desce até (High - range * pct)
        const entryPrice = high - (range * lvl.pct);
        const slPrice = low - (range * 0.15); // SL abaixo do fundo
        const tpPrice = high; // TP no topo

        // Verificar se a próxima barra testou e segurou
        const nextBar = h4Bars[i + 1];
        if (nextBar.low <= entryPrice && nextBar.close > entryPrice) {
          totalTrades++;
          let win = false;
          for (let k = i + 1; k < Math.min(i + 15, h4Bars.length); k++) {
            if (h4Bars[k].high >= tpPrice) {
              win = true;
              const pips = (tpPrice - entryPrice) / p.pipSize;
              totalProfitPips += pips;
              grossProfit += pips;
              break;
            }
            if (h4Bars[k].low <= slPrice) {
              const pips = (entryPrice - slPrice) / p.pipSize;
              totalProfitPips -= pips;
              grossLoss += pips;
              break;
            }
          }
          if (win) totalWins++;
        }
      } else if (isDowntrend) {
        // Venda no pullback: preço sobe até (Low + range * pct)
        const entryPrice = low + (range * lvl.pct);
        const slPrice = high + (range * 0.15); // SL acima do topo
        const tpPrice = low; // TP no fundo

        const nextBar = h4Bars[i + 1];
        if (nextBar.high >= entryPrice && nextBar.close < entryPrice) {
          totalTrades++;
          let win = false;
          for (let k = i + 1; k < Math.min(i + 15, h4Bars.length); k++) {
            if (h4Bars[k].low <= tpPrice) {
              win = true;
              const pips = (entryPrice - tpPrice) / p.pipSize;
              totalProfitPips += pips;
              grossProfit += pips;
              break;
            }
            if (h4Bars[k].high >= slPrice) {
              const pips = (slPrice - entryPrice) / p.pipSize;
              totalProfitPips -= pips;
              grossLoss += pips;
              break;
            }
          }
          if (win) totalWins++;
        }
      }
    }
  });

  const winRate = totalTrades > 0 ? (totalWins / totalTrades * 100).toFixed(1) : 0;
  const pf = grossLoss > 0 ? (grossProfit / grossLoss).toFixed(2) : 'Inf';
  console.log(`${lvl.name.padEnd(25)} | Trades: ${String(totalTrades).padStart(4)} | WinRate: ${winRate}% | PF: ${pf} | Pips: ${totalProfitPips.toFixed(0)}`);
});
