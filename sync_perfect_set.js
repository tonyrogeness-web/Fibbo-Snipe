const fs = require('fs');
const path = require('path');

const mq5 = fs.readFileSync('Fibbo_Sniper_v28.5_H2.mq5', 'utf8');
const lines = mq5.split('\n');

const setLines = [];
lines.forEach(l => {
  const trimmed = l.trim();
  if (trimmed.startsWith('input ') && !trimmed.startsWith('input group')) {
    const cleaned = trimmed.replace(/^input\s+[A-Za-z0-9_]+\s+/, '').split(';')[0];
    const assignments = cleaned.split(',');
    assignments.forEach(a => {
      const parts = a.split('=');
      if (parts.length === 2) {
        const key = parts[0].trim();
        let val = parts[1].trim();
        val = val.split('//')[0].trim();
        if (val === 'PERFIL_MODERADO') val = '1';
        else if (val === 'PERFIL_CONSERVADOR') val = '0';
        else if (val === 'PERFIL_AGRESSIVO') val = '2';
        else if (val === 'PERIOD_H2') val = '16388';
        else if (val === 'PERIOD_H1') val = '16385';
        else if (val === 'PERIOD_H4') val = '16388';
        else if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
        
        setLines.push(key + '=' + val + '||0||0||0||N');
      }
    });
  }
});

const setFileContent = setLines.join('\n') + '\n';
console.log('Total parameters in set:', setLines.length);

const buffer = Buffer.from('\ufeff' + setFileContent, 'utf16le');

const targetDirs = [
  'C:\\Users\\tony\\AppData\\Roaming\\MetaQuotes\\Terminal\\59C07D676775FCCF79E223EC24AB0D86\\MQL5\\Profiles\\Tester',
  'C:\\Users\\tony\\AppData\\Roaming\\MetaQuotes\\Terminal\\D0E8209F77C8CF37AD8BF550E51FF075\\MQL5\\Profiles\\Tester',
  'C:\\Users\\tony\\AppData\\Roaming\\MetaQuotes\\Terminal\\10CE948A1DFC9A8C27E56E827008EBD4\\MQL5\\Profiles\\Tester',
  __dirname
];

targetDirs.forEach(dir => {
  if (fs.existsSync(dir)) {
    const p = path.join(dir, 'Fibbo_Sniper_v28.5_H2.set');
    fs.writeFileSync(p, buffer);
    console.log('✅ SET perfeitamente sincronizado com o MQ5:', p);
  }
});
