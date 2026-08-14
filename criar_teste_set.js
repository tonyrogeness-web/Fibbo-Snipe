const fs = require('fs');
const path = require('path');

const srcPath = path.join(__dirname, 'Cenario_C_Fibbo_Sniper.set');
const destPath = path.join(__dirname, 'teste.set');

if (fs.existsSync(srcPath)) {
  const content = fs.readFileSync(srcPath, 'utf8');
  fs.writeFileSync(destPath, content, 'utf8');
  console.log('✔ teste.set criado com sucesso!');
} else {
  console.log('Source file Cenario_C_Fibbo_Sniper.set not found!');
}
