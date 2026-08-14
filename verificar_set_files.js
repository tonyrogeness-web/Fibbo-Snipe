const fs = require('fs');
const path = require('path');

console.log('🔍 Verificando os arquivos .set no diretório do MT5...');

const testerDir = 'C:\\Users\\tony\\AppData\\Roaming\\MetaQuotes\\Terminal\\59C07D676775FCCF79E223EC24AB0D86\\MQL5\\Profiles\\Tester';

const filesToCheck = [
  'Teste_EURAUD_EURGBP_H1.set',
  'Opcao_C_Portfolio_Mestre.set',
  'Cenario_3_H2_Maior_Lucro.set'
];

filesToCheck.forEach(file => {
  const p = path.join(testerDir, file);
  if (fs.existsSync(p)) {
    console.log(`✅ Arquivo presente e pronto: ${file}`);
  } else {
    console.log(`❌ Arquivo ausente: ${file}`);
  }
});
