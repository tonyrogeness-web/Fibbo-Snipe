const fs = require('fs');
const path = require('path');

const srcMq5 = path.join(__dirname, 'Fibbo_Sniper_v28.5_H2.mq5');
const srcEx5 = path.join(__dirname, 'Fibbo_Sniper_v28.5_H2.ex5');

const dests = [
  "C:\\Users\\tony\\AppData\\Roaming\\MetaQuotes\\Terminal\\59C07D676775FCCF79E223EC24AB0D86\\MQL5\\Experts",
  "C:\\Users\\tony\\AppData\\Roaming\\MetaQuotes\\Terminal\\59C07D676775FCCF79E223EC24AB0D86\\MQL5\\Experts\\Advisors",
  "C:\\Users\\tony\\AppData\\Roaming\\MetaQuotes\\Terminal\\59C07D676775FCCF79E223EC24AB0D86\\MQL5\\Experts\\Free Robots",
  "C:\\Users\\tony\\AppData\\Roaming\\MetaQuotes\\Terminal\\D0E8209F77C8CF37AD8BF550E51FF075\\MQL5\\Experts",
  "C:\\Users\\tony\\AppData\\Roaming\\MetaQuotes\\Terminal\\D0E8209F77C8CF37AD8BF550E51FF075\\MQL5\\Experts\\Advisors",
  "C:\\Users\\tony\\AppData\\Roaming\\MetaQuotes\\Terminal\\D0E8209F77C8CF37AD8BF550E51FF075\\MQL5\\Experts\\Free Robots"
];

console.log('=== DISTRIBUINDO MQ5 E EX5 EM TODAS AS PASTAS POSSÍVEIS DO MT5 ===\n');

dests.forEach(d => {
  if (fs.existsSync(d)) {
    fs.copyFileSync(srcMq5, path.join(d, 'Fibbo_Sniper_v28.5_H2.mq5'));
    fs.copyFileSync(srcEx5, path.join(d, 'Fibbo_Sniper_v28.5_H2.ex5'));
    console.log(`✔ Copiado .mq5 e .ex5 para: ${d}`);
  }
});
