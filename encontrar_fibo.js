const fs = require('fs');
const content = fs.readFileSync('Fibbo_Sniper_v28.5_H2.mq5', 'utf8');
const lines = content.split('\n');

lines.forEach((l, idx) => {
  if (l.toLowerCase().includes('fibo') && !l.includes('Fibbo_Sniper') && !l.includes('property')) {
    console.log(`L${idx+1}: ${l.trim().substring(0, 100)}`);
  }
});
