const fs = require('fs');
const path = require('path');

const file = 'Fibbo_Sniper_v28.5_H2.mq5';
const code = fs.readFileSync(file, 'utf8');

const setEntries = [];
setEntries.push('InpPerfil=1||0||0||0||N');

const lines = code.split('\n');

for (let i = 0; i < lines.length; i++) {
  let line = lines[i].trim();
  if (line.startsWith('input ') && !line.startsWith('input group') && !line.includes('InpPerfil')) {
    let raw = line.substring(6).trim();
    if (raw.includes('//')) raw = raw.split('//')[0].trim();
    if (raw.endsWith(';')) raw = raw.slice(0, -1).trim();

    const firstSpace = raw.indexOf(' ');
    if (firstSpace > 0) {
      const rest = raw.substring(firstSpace).trim();
      const parts = rest.split(',');
      parts.forEach(p => {
        const eq = p.split('=');
        if (eq.length === 2) {
          const name = eq[0].trim();
          let val = eq[1].trim();
          if (val.startsWith('"') && val.endsWith('"')) {
            val = val.slice(1, -1);
          }
          if (val === 'PERFIL_CONSERVADOR') val = '0';
          else if (val === 'PERFIL_MODERADO') val = '1';
          else if (val === 'PERFIL_AGRESSIVO') val = '2';
          
          setEntries.push(name + '=' + val + '||0||0||0||N');
        }
      });
    }
  }
}

const setContent = '\ufeff' + setEntries.join('\r\n') + '\r\n';
const setBuffer = Buffer.from(setContent, 'utf16le');

const setPaths = [
  'Fibbo_Sniper_v28.5_H2.set',
  'C:\\Users\\tony\\AppData\\Roaming\\MetaQuotes\\Terminal\\59C07D676775FCCF79E223EC24AB0D86\\MQL5\\Profiles\\Tester\\Fibbo_Sniper_v28.5_H2.set',
  'C:\\Users\\tony\\AppData\\Roaming\\MetaQuotes\\Terminal\\59C07D676775FCCF79E223EC24AB0D86\\MQL5\\Presets\\Fibbo_Sniper_v28.5_H2.set',
  'C:\\Users\\tony\\AppData\\Roaming\\MetaQuotes\\Terminal\\10CE948A1DFC9A8C27E56E827008EBD4\\MQL5\\Profiles\\Tester\\Fibbo_Sniper_v28.5_H2.set',
  'C:\\Users\\tony\\AppData\\Roaming\\MetaQuotes\\Terminal\\10CE948A1DFC9A8C27E56E827008EBD4\\MQL5\\Presets\\Fibbo_Sniper_v28.5_H2.set'
];

setPaths.forEach(p => {
  try {
    const dir = path.dirname(p);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(p, setBuffer);
    console.log('✔ Gravado com sucesso em:', p);
  } catch (err) {
    console.log('Erro ao gravar:', p, err.message);
  }
});

console.log('\n=== TODOS OS ARQUIVOS .SET SINCRONIZADOS COM SUCESSO! ===');
