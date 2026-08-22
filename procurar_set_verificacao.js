const fs = require('fs');
const path = require('path');

const dirs = [
  __dirname,
  "C:\\Users\\tony\\AppData\\Roaming\\MetaQuotes\\Terminal\\59C07D676775FCCF79E223EC24AB0D86\\MQL5\\Profiles\\Tester",
  "C:\\Users\\tony\\AppData\\Roaming\\MetaQuotes\\Terminal\\59C07D676775FCCF79E223EC24AB0D86\\MQL5\\Presets",
  "C:\\Users\\tony\\AppData\\Roaming\\MetaQuotes\\Terminal\\D0E8209F77C8CF37AD8BF550E51FF075\\MQL5\\Profiles\\Tester",
  "C:\\Users\\tony\\AppData\\Roaming\\MetaQuotes\\Terminal\\D0E8209F77C8CF37AD8BF550E51FF075\\MQL5\\Presets",
  "C:\\Users\\tony\\AppData\\Roaming\\MetaQuotes\\Terminal\\59C07D676775FCCF79E223EC24AB0D86\\Tester",
  "C:\\Users\\tony\\AppData\\Roaming\\MetaQuotes\\Terminal\\D0E8209F77C8CF37AD8BF550E51FF075\\Tester"
];

console.log('=== PROCURANDO ARQUIVO DE VERIFICAÇÃO SALVO PELO USUÁRIO ===\n');

dirs.forEach(dir => {
  if (fs.existsSync(dir)) {
    const files = fs.readdirSync(dir);
    files.forEach(f => {
      if (f.toLowerCase().includes('verif') || f.toLowerCase().includes('teste') || f.toLowerCase().includes('fluxo') || f.toLowerCase().includes('fr')) {
        const full = path.join(dir, f);
        console.log(`Encontrado: ${full}`);
        if (f.toLowerCase().includes('verif')) {
          console.log(`--- Conteúdo de ${f} ---`);
          try {
            const content = fs.readFileSync(full, 'utf16le');
            const lines = content.split('\r\n');
            lines.forEach(l => {
              if (l.startsWith('InpUse') || l.startsWith('InpSmart') || l.startsWith('InpTF') || l.startsWith('InpFR') || l.startsWith('InpFluxo')) {
                console.log('  ' + l);
              }
            });
          } catch(e) {
            try {
              const content = fs.readFileSync(full, 'utf8');
              const lines = content.split('\n');
              lines.forEach(l => {
                if (l.startsWith('InpUse') || l.startsWith('InpSmart') || l.startsWith('InpTF') || l.startsWith('InpFR') || l.startsWith('InpFluxo')) {
                  console.log('  ' + l.trim());
                }
              });
            } catch(e2) {}
          }
        }
      }
    });
  }
});
