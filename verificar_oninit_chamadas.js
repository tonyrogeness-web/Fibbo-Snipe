const fs = require('fs');

const text = fs.readFileSync('c:\\Users\\tony\\.gemini\\antigravity-ide\\scratch\\FibboSniper\\Fibbo_Sniper_v28.5_H2.mq5', 'utf8');

const lines = text.split('\n');
let onInitStart = -1;
let onInitEnd = -1;

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('int OnInit()')) {
    onInitStart = i;
  }
  if (onInitStart !== -1 && lines[i].includes('return(INIT_SUCCEEDED);')) {
    onInitEnd = i;
    break;
  }
}

console.log(`OnInit starts at line ${onInitStart + 1}, ends at line ${onInitEnd + 1}`);
if (onInitStart !== -1 && onInitEnd !== -1) {
  const snippet = lines.slice(onInitStart, onInitEnd + 5).join('\n');
  console.log('\n--- OnInit Body ---');
  console.log(snippet);
  console.log('\nChama AutoSelecionarTF()?', snippet.includes('AutoSelecionarTF()'));
}
