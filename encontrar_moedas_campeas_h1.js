const fs = require('fs');
const path = require('path');

const HIST_DIR = path.join(__dirname, '..', 'Orion_U2_Hedge', 'Historico Moedas');

const ALL_CSV_PAIRS = [
  { name: 'EURUSD', file: 'EURUSD_M15_202301030000_202608051445.csv', pipSize: 0.0001 },
  { name: 'GBPUSD', file: 'GBPUSD_M15_202301030000_202608051445.csv', pipSize: 0.0001 },
  { name: 'AUDUSD', file: 'AUDUSD_M15_202301030000_202608051445.csv', pipSize: 0.0001 },
  { name: 'USDCAD', file: 'USDCAD_M15_202301030000_202608051445.csv', pipSize: 0.0001 },
  { name: 'USDJPY', file: 'USDJPY_M15_202301030000_202608051445.csv', pipSize: 0.01   },
  { name: 'USDCHF', file: 'USDCHF_M15_202301030000_202608051445.csv', pipSize: 0.0001 },
  { name: 'EURJPY', file: 'EURJPY_M15_202401020000_202608042345.csv', pipSize: 0.01   },
  { name: 'EURGBP', file: 'EURGBP_M15_202401020000_202608042345.csv', pipSize: 0.0001 },
  { name: 'GBPJPY', file: 'GBPJPY_M15_202401020000_202608042345.csv', pipSize: 0.01   },
  { name: 'EURAUD', file: 'EURAUD_M15_202401020000_202608042345.csv', pipSize: 0.0001 },
  { name: 'AUDCAD', file: 'AUDCAD_M15_202401020000_202608042345.csv', pipSize: 0.0001 }
];

console.log('🔄 Varrendo e auditando todas as moedas disponíveis no banco de dados...\n');

const results = [];

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

  // Resample H1
  const h1Candles = [];
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

  // Indicadores
  const periodATR = 14, periodRSI = 14;
  let atr = 0, gains = 0, losses = 0;
  let prevClose = h1Candles[0] ? h1Candles[0].close : 0;
  atr = h1Candles[0] ? (h1Candles[0].high - h1Candles[0].low) : 0;

  const h1Processed = h1Candles.map((c, i) => {
    if (i === 0) {
      prevClose = c.close;
    } else {
      const tr = Math.max(c.high - c.low, Math.abs(c.high - prevClose), Math.abs(c.low - prevClose));
      atr = (atr * (periodATR - 1) + tr) / periodATR;
      const change = c.close - prevClose;
      const gain = change > 0 ? change : 0;
      const loss = change < 0 ? -change : 0;
      if (i <= periodRSI) { gains += gain; losses += loss; }
      else { gains = (gains * 13 + gain) / 14; losses = (losses * 13 + loss) / 14; }
      prevClose = c.close;
    }
    const rs = losses === 0 ? 100 : gains / losses;
    const rsi = 100 - (100 / (1 + rs));
    return { ...c, atr, rsi };
  });

  // Simulação H1
  let balance = 10000.0;
  let peak = 10000.0;
  let maxDD = 0;
  let trades = 0, wins = 0, lossesCount = 0, grossProfit = 0, grossLoss = 0;
  let lastEntry = 0;

  for (let i = 20; i < h1Processed.length; i++) {
    const c = h1Processed[i];
    if (!c.atr || !c.rsi) continue;
    const hour = parseInt(c.timeStr.split(':')[0], 10);
    if (hour < 7 || hour >= 18) continue; // Sessão

    if (c.timestamp - lastEntry < 7200000) continue; // Cooldown 2h

    const body = Math.abs(c.close - c.open);
    const upperWick = c.high - Math.max(c.open, c.close);
    const lowerWick = Math.min(c.open, c.close) - c.low;
    const totalRange = c.high - c.low;

    let signal = null;
    if (c.rsi > 68 && upperWick >= body * 0.5 && upperWick >= totalRange * 0.35) signal = 'SELL';
    else if (c.rsi < 32 && lowerWick >= body * 0.5 && lowerWick >= totalRange * 0.35) signal = 'BUY';

    if (signal) {
      lastEntry = c.timestamp;
      trades++;
      const risk = balance * 0.015; // 1.5%
      // Simula resultado com base em win rate do par em H1
      const isWin = (signal === 'BUY' && c.close > c.open) || (signal === 'SELL' && c.close < c.open);
      if (isWin) {
        wins++;
        const profit = risk * 2.0; // 1 Win Cheio
        grossProfit += profit;
        balance += profit;
      } else {
        lossesCount++;
        grossLoss += risk;
        balance -= risk;
      }

      if (balance > peak) peak = balance;
      const dd = ((peak - balance) / peak) * 100;
      if (dd > maxDD) maxDD = dd;
    }
  }

  const netProfit = balance - 10000.0;
  const pf = grossLoss > 0 ? grossProfit / grossLoss : (grossProfit > 0 ? 99 : 0);
  const winRate = trades > 0 ? (wins / trades) * 100 : 0;

  results.push({
    name: p.name,
    trades,
    wins,
    losses: lossesCount,
    netProfit: Math.round(netProfit * 100) / 100,
    pf: Math.round(pf * 100) / 100,
    winRate: Math.round(winRate * 10) / 10,
    maxDD: Math.round(maxDD * 100) / 100
  });
});

console.log('Pair     | Profit ($) | Win Rate (%) | Profit Factor | Max DD (%) | Trades');
console.log('-------------------------------------------------------------------------');
results.sort((a, b) => b.netProfit - a.netProfit).forEach(r => {
  const pName = r.name.padEnd(8, ' ');
  const prof = (`+$${r.netProfit.toFixed(2)}`).padEnd(11, ' ');
  const wr = (`${r.winRate.toFixed(1)}%`).padEnd(13, ' ');
  const pf = (r.pf.toFixed(2)).padEnd(14, ' ');
  const dd = (`${r.maxDD.toFixed(2)}%`).padEnd(11, ' ');
  console.log(`${pName} | ${prof} | ${wr} | ${pf} | ${dd} | ${r.trades}`);
});

console.log('-------------------------------------------------------------------------\n');
