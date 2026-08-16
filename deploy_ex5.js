const fs = require('fs');
const path = require('path');

const ex5 = path.join(__dirname, 'Fibbo_Sniper_v28.5_H2.ex5');

const targets = [
  'C:\\Users\\tony\\AppData\\Roaming\\MetaQuotes\\Terminal\\59C07D676775FCCF79E223EC24AB0D86\\MQL5\\Experts',
  'C:\\Users\\tony\\AppData\\Roaming\\MetaQuotes\\Terminal\\D0E8209F77C8CF37AD8BF550E51FF075\\MQL5\\Experts',
  'C:\\Users\\tony\\AppData\\Roaming\\MetaQuotes\\Terminal\\10CE948A1DFC9A8C27E56E827008EBD4\\MQL5\\Experts'
];

targets.forEach(dir => {
  if (fs.existsSync(dir)) {
    const dest = path.join(dir, 'Fibbo_Sniper_v28.5_H2.ex5');
    fs.copyFileSync(ex5, dest);
    console.log('✅ EX5 atualizado em:', dest);
  }
});
