const fs = require('fs');
const path = require('path');

const dirs = [
  "C:\\Users\\tony\\AppData\\Roaming\\MetaQuotes\\Terminal\\59C07D676775FCCF79E223EC24AB0D86\\Tester\\logs",
  "C:\\Users\\tony\\AppData\\Roaming\\MetaQuotes\\Terminal\\59C07D676775FCCF79E223EC24AB0D86\\MQL5\\Logs"
];

console.log('=== VERIFICANDO ERROS RECENTES NOS LOGS ===\n');

dirs.forEach(d => {
  if (fs.existsSync(d)) {
    const files = fs.readdirSync(d).sort().reverse();
    if (files.length > 0) {
      const latestFile = path.join(d, files[0]);
      console.log(`--- Log em: ${latestFile} ---`);
      try {
        const lines = fs.readFileSync(latestFile, 'utf16le').split('\n');
        lines.slice(-30).forEach(l => console.log(l.trim()));
      } catch(e) {
        try {
          const lines = fs.readFileSync(latestFile, 'utf8').split('\n');
          lines.slice(-30).forEach(l => console.log(l.trim()));
        } catch(e2) {}
      }
      console.log('\n');
    }
  }
});
