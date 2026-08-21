const fs = require('fs');
const content = fs.readFileSync('Fibbo_Sniper_v28.5_H2.mq5', 'utf8');
const lines = content.split('\n');

let startLine = -1;
let endLine = -1;

lines.forEach((l, idx) => {
  if (l.includes('MOTOR 3: FIBONACCI')) startLine = idx;
  if (l.includes('void OnTradeTransaction')) endLine = idx;
});

console.log(`startLine: ${startLine + 1}, endLine: ${endLine + 1}`);

if (startLine !== -1 && endLine !== -1) {
  const newLines = lines.slice(0, startLine - 1).concat(['}', '']).concat(lines.slice(endLine - 4));
  fs.writeFileSync('Fibbo_Sniper_v28.5_H2.mq5', newLines.join('\n'), 'utf8');
  console.log('✔ Linhas do Motor 3 Fibo deletadas com sucesso!');
}
