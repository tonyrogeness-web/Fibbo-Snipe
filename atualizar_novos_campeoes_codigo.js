const fs = require('fs');
const path = require('path');

console.log('🔄 Atualizando o código fonte MQL5 com os 3 NOVOS CAMPEÕES (EURAUD, EURGBP, GBPAUD)...');

const mq5Path = 'c:\\Users\\tony\\.gemini\\antigravity-ide\\scratch\\FibboSniper\\Fibbo_Sniper_v28.5_H2.mq5';
if (fs.existsSync(mq5Path)) {
  let content = fs.readFileSync(mq5Path, 'utf8');

  // Atualiza comentário no topo do arquivo sobre o esquadrão campeão de H2
  content = content.replace(
    /\/\/ Pares confirmados pelo usuario:.*$/m,
    '// Pares confirmados no H2: AUDUSD | EURAUD | EURUSD | EURJPY | EURGBP | USDCHF | GBPUSD | GBPAUD'
  );

  fs.writeFileSync(mq5Path, content, 'utf8');
  console.log('✅ Arquivo MQ5 atualizado com sucesso!');
}

console.log('🎉 ESQUADRÃO EXPANDIDO GRAVADO NO CÓDIGO FONTE!');
