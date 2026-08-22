const fs = require('fs');
const path = require('path');

const cacheDirs = [
  "C:\\Users\\tony\\AppData\\Roaming\\MetaQuotes\\Terminal\\59C07D676775FCCF79E223EC24AB0D86\\Tester\\cache",
  "C:\\Users\\tony\\AppData\\Roaming\\MetaQuotes\\Terminal\\D0E8209F77C8CF37AD8BF550E51FF075\\Tester\\cache"
];

console.log('=== LIMPANDO CACHE DO TESTADOR PARA DESTRAVAR A 9ª MOEDA ===\n');

cacheDirs.forEach(dir => {
  if (fs.existsSync(dir)) {
    const files = fs.readdirSync(dir);
    files.forEach(f => {
      if (f.toLowerCase().includes('fibbo_sniper') && f.endsWith('.opt')) {
        try {
          fs.unlinkSync(path.join(dir, f));
          console.log(`✔ Cache removido: ${f} em ${dir}`);
        } catch(e) {
          console.log(`⚠ Não foi possível remover ${f}: ${e.message}`);
        }
      }
    });
  }
});

console.log('\n=== CACHE DO TESTADOR 100% LIMPO! ===');
