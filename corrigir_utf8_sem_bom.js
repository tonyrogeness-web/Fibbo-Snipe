const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'Fibbo_Sniper_v28.5_H2.mq5');
const buf = fs.readFileSync(filePath);

// Converte para string e limpa qualquer BOM ou caractere nulo
let text = buf.toString('utf8');
if (text.charCodeAt(0) === 0xFEFF) {
  text = text.slice(1);
}
text = text.replace(/\0/g, '');

// Salva em UTF-8 SEM BOM puro
fs.writeFileSync(filePath, Buffer.from(text, 'utf8'));
console.log('✅ Arquivo Fibbo_Sniper_v28.5_H2.mq5 salvo em UTF-8 puro (sem BOM)!');
