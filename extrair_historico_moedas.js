const fs = require('fs');
const readline = require('readline');
const path = require('path');

const transcriptPath = 'C:\\Users\\tony\\.gemini\\antigravity-ide\\brain\\540b05a5-b8a6-4da9-acbf-97c133369373\\.system_generated\\logs\\transcript.jsonl';

if (!fs.existsSync(transcriptPath)) {
  console.log('Transcript file not found:', transcriptPath);
  process.exit(1);
}

const fileStream = fs.createReadStream(transcriptPath);
const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

let userPrompts = [];
let modelResponses = [];

rl.on('line', (line) => {
  try {
    const obj = JSON.parse(line);
    if (obj.type === 'USER_INPUT' && obj.content) {
      userPrompts.push({ step: obj.step_index, content: obj.content });
    }
    if (obj.type === 'PLANNER_RESPONSE' && obj.content && (obj.content.includes('USDCAD') || obj.content.includes('EURUSD') || obj.content.includes('Lucro') || obj.content.includes('Cenário'))) {
      modelResponses.push({ step: obj.step_index, content: obj.content });
    }
  } catch (e) {}
});

rl.on('close', () => {
  console.log('=== USER PROMPTS SUMMARY (' + userPrompts.length + ') ===');
  userPrompts.forEach((p) => {
    console.log(`[Step ${p.step}]: ${p.content.substring(0, 150)}...`);
  });

  console.log('\n=== KEY SIMULATION & BACKTEST RESPONSES ===');
  modelResponses.forEach((m) => {
    const lines = m.content.split('\n');
    lines.forEach((l) => {
      if (l.includes('USD') || l.includes('PF') || l.includes('Lucro') || l.includes('Win Rate') || l.includes('Drawdown') || l.includes('Cenário')) {
        console.log(`[Step ${m.step}]: ${l}`);
      }
    });
  });
});
