const fs = require('fs');
const path = require('path');

function readUtf16orUtf8(filePath) {
  const buf = fs.readFileSync(filePath);
  if (buf[0] === 0xff && buf[1] === 0xfe) {
    return buf.toString('utf16le');
  }
  return buf.toString('utf8');
}

const mq5 = fs.readFileSync(path.join(__dirname, 'Fibbo_Sniper_v28.5_H2.mq5'), 'utf8');
const set = readUtf16orUtf8(path.join(__dirname, 'Fibbo_Sniper_v28.5_H2.set'));

// Parse set keys
const setMap = new Map();
set.split(/\r?\n/).forEach(l => {
  l = l.trim();
  if (!l || l.startsWith(';')) return;
  const eq = l.indexOf('=');
  if (eq > -1) {
    const k = l.substring(0, eq).trim();
    const v = l.substring(eq + 1).split('||')[0].trim();
    setMap.set(k, v);
  }
});

// Let's find all 'input' and 'sinput' in mq5
const mq5Inputs = [];
const lines = mq5.split(/\r?\n/);
for (let i = 0; i < lines.length; i++) {
  let l = lines[i].trim();
  if (l.startsWith('input group')) continue;
  if (l.startsWith('input ') || l.startsWith('sinput ')) {
    let stmt = l;
    while (!stmt.includes(';') && i < lines.length - 1) {
      i++;
      stmt += ' ' + lines[i].trim();
    }
    // remove comments
    let code = stmt.replace(/\/\/.*/, '').replace(/;$/, '').trim();
    code = code.replace(/^(?:input|sinput)\s+/, '');
    const spaceIdx = code.indexOf(' ');
    const type = code.substring(0, spaceIdx).trim();
    const varsPart = code.substring(spaceIdx + 1);
    
    let inString = false;
    let curVar = '';
    for (let c = 0; c < varsPart.length; c++) {
      const char = varsPart[c];
      if (char === '"') inString = !inString;
      if (char === ',' && !inString) {
        processVar(curVar, type, i + 1);
        curVar = '';
      } else {
        curVar += char;
      }
    }
    if (curVar.trim()) {
      processVar(curVar, type, i + 1);
    }
  }
}

function processVar(vStr, type, line) {
  vStr = vStr.trim();
  const eq = vStr.indexOf('=');
  let name = vStr;
  let defVal = '';
  if (eq > -1) {
    name = vStr.substring(0, eq).trim();
    defVal = vStr.substring(eq + 1).trim();
  }
  mq5Inputs.push({ name, type, defVal, line });
}

console.log('MQ5 Total de Inputs extraídos:', mq5Inputs.length);
console.log('SET Total de Chaves extraídas:', setMap.size);

let missingInSet = [];
mq5Inputs.forEach(inp => {
  if (!setMap.has(inp.name)) {
    missingInSet.push(inp);
  }
});

console.log('\n--- INPUTS DO MQ5 QUE NÃO ESTÃO NO .SET ---');
if (missingInSet.length === 0) {
  console.log('>> [PERFEITO] 0 inputs faltando no .SET! Todos os ' + mq5Inputs.length + ' inputs do MQ5 estão no .SET!');
} else {
  missingInSet.forEach(m => console.log('Falta: ' + m.name + ' (' + m.type + ') = ' + m.defVal));
}

let extraInSet = [];
for (const [k, v] of setMap.entries()) {
  if (!mq5Inputs.some(inp => inp.name === k)) {
    extraInSet.push({ k, v });
  }
}

console.log('\n--- CHAVES NO .SET QUE NÃO ESTÃO NO MQ5 ---');
if (extraInSet.length === 0) {
  console.log('>> [PERFEITO] 0 chaves obsoletas no .SET!');
} else {
  extraInSet.forEach(e => console.log('Extra: ' + e.k + ' = ' + e.v));
}

console.log('\n--- CHECKLIST DOS PARÂMETROS CRUCIAIS PARA O TESTE ---');
const checkList = [
  'InpPerfil',
  'InpTF',
  'InpAutoTF',
  'InpUseFR',
  'InpUseFiboPullback',
  'InpSmartFiboSymbolFilter',
  'InpFiboBlockedSymbols',
  'InpUseFluxo',
  'InpBaseRisk_L1',
  'InpTP_Parcial_Multi',
  'InpTP_Final_Multi',
  'InpBE_Trigger_Normal',
  'InpBE_UseATRBreathing',
  'InpFR_RequireQuadrantClose',
  'InpFR_RequireVolumeAbsorption',
  'InpFR_UseStructuralTP2',
  'InpFib_RequireQuadrantClose',
  'InpFib_RequireVolumeAbsorption',
  'InpFib_UseStructuralTP2',
  'InpCloseDaily',
  'InpPropFirmMode',
  'InpPropMaxDailyLossPct',
  'InpPerdaMaximaGlobalPct',
  'InpLucroAlvoMoedaPct'
];

checkList.forEach(k => {
  const mq = mq5Inputs.find(i => i.name === k);
  const setV = setMap.get(k);
  console.log(`${k}: Code=[${mq ? mq.defVal : 'N/A'}] | .SET=[${setV || 'N/A'}]`);
});
