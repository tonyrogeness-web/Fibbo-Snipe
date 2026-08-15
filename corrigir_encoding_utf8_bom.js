const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const filePath = path.join(__dirname, 'Fibbo_Sniper_v28.5_H2.mq5');
const buf = fs.readFileSync(filePath);

// Detecta se é UTF-16LE
let text = '';
if (buf[0] === 0xff && buf[1] === 0xfe) {
  text = buf.toString('utf16le');
} else if (buf.includes('\0')) {
  text = buf.toString('utf16le');
} else {
  text = buf.toString('utf8');
}

// Remove qualquer caractere NUL remanescente se houver
text = text.replace(/\0/g, '');

// Salva em UTF-8 com BOM (padrão universal que abre perfeitamente no VSCode e no MetaEditor)
const utf8BomBuf = Buffer.concat([Buffer.from([0xef, 0xbb, 0xbf]), Buffer.from(text, 'utf8')]);
fs.writeFileSync(filePath, utf8BomBuf);

console.log('✅ Arquivo Fibbo_Sniper_v28.5_H2.mq5 convertido para UTF-8 com BOM!');
