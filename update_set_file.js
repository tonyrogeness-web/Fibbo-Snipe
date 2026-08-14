const fs = require('fs');

const setPath = 'C:\\Users\\tony\\Desktop\\parametro novo backteste.set';

// Lê o arquivo .set em UTF-16LE
let content = fs.readFileSync(setPath, 'utf16le');

// Substitui as linhas com as configurações otimizadas
content = content.replace(/InpUseFluxo=true/g, 'InpUseFluxo=false');
content = content.replace(/InpUseFiboPullback=true/g, 'InpUseFiboPullback=false');
content = content.replace(/InpMaxSimultaneousOps=6\|\|6/g, 'InpMaxSimultaneousOps=2||2');
content = content.replace(/InpBE_LockProfitPts=0\.0\|\|0\.0/g, 'InpBE_LockProfitPts=20.0||20.0');

// Grava o arquivo de volta no formato UTF-16LE com BOM se necessário
const buffer = Buffer.from('\ufeff' + content, 'utf16le');
fs.writeFileSync(setPath, buffer);

console.log("Arquivo .set atualizado com sucesso!");
