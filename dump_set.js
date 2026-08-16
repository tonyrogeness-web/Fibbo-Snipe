const fs = require('fs');
const path = require('path');

function readUtf16orUtf8(filePath) {
  const buf = fs.readFileSync(filePath);
  if (buf[0] === 0xff && buf[1] === 0xfe) {
    return buf.toString('utf16le');
  }
  return buf.toString('utf8');
}

const setFile = path.join(__dirname, 'Fibbo_Sniper_v28.5_H2.set');
const content = readUtf16orUtf8(setFile);
console.log('=== CONTEÚDO COMPLETO DO ARQUIVO .SET ATUAL ===');
console.log(content);
