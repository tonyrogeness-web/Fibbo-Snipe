const fs = require('fs');
const path = require('path');

const iniDirs = [
  "C:\\Users\\tony\\AppData\\Roaming\\MetaQuotes\\Terminal\\59C07D676775FCCF79E223EC24AB0D86\\MQL5\\Profiles\\Tester",
  "C:\\Users\\tony\\AppData\\Roaming\\MetaQuotes\\Terminal\\D0E8209F77C8CF37AD8BF550E51FF075\\MQL5\\Profiles\\Tester",
  "C:\\Users\\tony\\AppData\\Roaming\\MetaQuotes\\Terminal\\59C07D676775FCCF79E223EC24AB0D86\\Tester",
  "C:\\Users\\tony\\AppData\\Roaming\\MetaQuotes\\Terminal\\D0E8209F77C8CF37AD8BF550E51FF075\\Tester"
];

console.log('=== VERIFICANDO ARQUIVOS INI E CONFIGS SALVAS NO TESTADOR ===\n');

iniDirs.forEach(dir => {
  if (fs.existsSync(dir)) {
    const files = fs.readdirSync(dir);
    files.forEach(f => {
      if (f.toLowerCase().includes('fibbo_sniper') && f.endsWith('.ini')) {
        const full = path.join(dir, f);
        console.log(`Arquivo: ${full}`);
        try {
          const content = fs.readFileSync(full, 'utf8');
          console.log(content.slice(0, 300));
        } catch(e) {}
      }
    });
  }
});
