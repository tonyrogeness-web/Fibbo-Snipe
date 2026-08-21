const fs = require('fs');
const content = fs.readFileSync('Fibbo_Sniper_v28.5_H2.mq5', 'utf8');
const lines = content.split('\n');

lines.forEach((line, idx) => {
  if (line.trim().startsWith('input ')) {
    console.log(`Line ${idx+1}: ${line.trim()}`);
  }
});
