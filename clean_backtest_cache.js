const fs = require('fs');
const path = require('path');

const appData = process.env.APPDATA;
const testerDir = path.join(appData, 'MetaQuotes', 'Tester', '59C07D676775FCCF79E223EC24AB0D86');

console.log('=== LIMPANDO ARQUIVOS TEMPORÁRIOS DE BACKTESTES ANTIGOS ===\n');

let deletedCount = 0;
let deletedBytes = 0;

function cleanDir(dir) {
  try {
    const files = fs.readdirSync(dir);
    for (const f of files) {
      const fp = path.join(dir, f);
      try {
        const stat = fs.statSync(fp);
        if (stat.isDirectory()) {
          cleanDir(fp);
        } else if (f.endsWith('.tmp') || f.endsWith('.opt') || f.endsWith('.cache')) {
          deletedBytes += stat.size;
          deletedCount++;
          fs.unlinkSync(fp);
        }
      } catch (err) {
        // Ignora arquivos bloqueados por processos ativos
      }
    }
  } catch (e) {}
}

if (fs.existsSync(testerDir)) {
  cleanDir(testerDir);
}

// Também limpar a pasta temp do próprio Terminal 59C0...
const termTempDir = path.join(appData, 'MetaQuotes', 'Terminal', '59C07D676775FCCF79E223EC24AB0D86', 'temp');
if (fs.existsSync(termTempDir)) {
  cleanDir(termTempDir);
}

const freedGB = (deletedBytes / (1024 * 1024 * 1024)).toFixed(2);
console.log(`✔ Limpeza concluída com sucesso!`);
console.log(`✔ Total de arquivos temporários de backtest excluídos: ${deletedCount}`);
console.log(`🎉 Espaço em disco LIBERADO no seu HD: ${freedGB} GB!`);
