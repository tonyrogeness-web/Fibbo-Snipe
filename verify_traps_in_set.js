const fs = require('fs');

const p = 'C:\\Users\\tony\\AppData\\Roaming\\MetaQuotes\\Terminal\\59C07D676775FCCF79E223EC24AB0D86\\MQL5\\Profiles\\Tester\\teste.set';
if (fs.existsSync(p)) {
  const buf = fs.readFileSync(p);
  let str = (buf[0] === 0xff && buf[1] === 0xfe) ? buf.toString('utf16le') : buf.toString('utf8');
  console.log('=== TRAPS IN TESTE.SET ===');
  str.split(/\r?\n/).forEach(line => {
    if (line.includes('InpPerdaMaxima') || line.includes('InpLucroAlvo')) {
      console.log(line);
    }
  });
}
