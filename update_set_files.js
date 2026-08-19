const fs = require('fs');

const setFiles = fs.readdirSync('.').filter(f => f.endsWith('.set'));
console.log('Verificando arquivos .set:', setFiles.length);

setFiles.forEach(f => {
  let content = fs.readFileSync(f, 'utf8');
  if (content.includes('InpFibLevelBuy=18.0') || content.includes('InpFibLevelBuy=18')) {
    content = content.replace(/InpFibLevelBuy=18\.0/g, 'InpFibLevelBuy=61.8');
    content = content.replace(/InpFibLevelBuy=18/g, 'InpFibLevelBuy=61.8');
    fs.writeFileSync(f, content);
    console.log('✔ Atualizado .set:', f);
  }
});
