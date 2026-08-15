const fs = require('fs');

const text = fs.readFileSync('c:\\Users\\tony\\.gemini\\antigravity-ide\\scratch\\FibboSniper\\Fibbo_Sniper_v28.5_H2.mq5', 'utf8');

const lines = text.split('\n');

for (let i = 1750; i < 1850; i++) {
  if (lines[i]) {
    console.log(`Line ${i+1}: ${lines[i]}`);
  }
}
