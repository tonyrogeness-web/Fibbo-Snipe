const fs = require('fs');
const path = require('path');

function readUtf16orUtf8(filePath) {
  const buf = fs.readFileSync(filePath);
  if (buf[0] === 0xff && buf[1] === 0xfe) {
    return buf.toString('utf16le');
  }
  return buf.toString('utf8');
}

const mq5File = path.join(__dirname, 'Fibbo_Sniper_v28.5_H2.mq5');
const setFile = path.join(__dirname, 'Fibbo_Sniper_v28.5_H2.set');

const mq5Content = fs.readFileSync(mq5File, 'utf8');
const setContent = readUtf16orUtf8(setFile);

// Parse all inputs in MQ5 cleanly
const lines = mq5Content.split(/\r?\n/);
const mq5Inputs = {};

let currentBlock = null;
for (let i = 0; i < lines.length; i++) {
  let line = lines[i].trim();
  if (line.startsWith('//')) continue;
  
  if (line.startsWith('input ') || line.startsWith('sinput ')) {
    // Found input line
    let fullDecl = line;
    while (!fullDecl.includes(';') && i < lines.length - 1) {
      i++;
      fullDecl += ' ' + lines[i].trim();
    }
    
    // Remove input/sinput
    let declBody = fullDecl.replace(/^(?:input|sinput)\s+/, '');
    // Split by comment
    if (declBody.includes('//')) {
      declBody = declBody.split('//')[0];
    }
    declBody = declBody.replace(/;$/, '').trim();
    
    // Type is first token
    const firstSpace = declBody.indexOf(' ');
    const type = declBody.substring(0, firstSpace).trim();
    const rest = declBody.substring(firstSpace).trim();
    
    // Split multiple declarations if separated by comma
    // e.g. bool InpUseFluxo = false, InpFluxo_GatilhoPrecoce = true;
    const varDecls = rest.split(',');
    for (let v of varDecls) {
      v = v.trim();
      const eqIdx = v.indexOf('=');
      if (eqIdx !== -1) {
        const varName = v.substring(0, eqIdx).trim();
        const varVal = v.substring(eqIdx + 1).trim();
        mq5Inputs[varName] = { type, defaultVal: varVal, lineNum: i + 1 };
      } else {
        const varName = v.trim();
        mq5Inputs[varName] = { type, defaultVal: '', lineNum: i + 1 };
      }
    }
  }
}

// Parse SET inputs
const setInputs = {};
const setLines = setContent.split(/\r?\n/);
setLines.forEach((line, idx) => {
  line = line.trim();
  if (!line || line.startsWith(';') || line.startsWith('//')) return;
  const parts = line.split('=');
  if (parts.length >= 2) {
    const key = parts[0].trim();
    const valParts = parts[1].split('||');
    const val = valParts[0].trim();
    setInputs[key] = {
      val: val,
      raw: line,
      lineNum: idx + 1
    };
  }
});

console.log('=== AUDITORIA COMPLETA DE SINCRONIZAÇÃO: .MQ5 vs .SET ===');
console.log('Total de Inputs no Código MQ5:', Object.keys(mq5Inputs).length);
console.log('Total de Parâmetros no Arquivo .SET:', Object.keys(setInputs).length);

console.log('\n--- 1. PARÂMETROS DO MQ5 FALTANDO NO .SET ---');
let missingInSet = [];
for (const key in mq5Inputs) {
  if (!(key in setInputs)) {
    missingInSet.push({ name: key, ...mq5Inputs[key] });
  }
}
if (missingInSet.length === 0) {
  console.log('>> [100% OK] Nenhum parâmetro do MQ5 está faltando no .SET!');
} else {
  console.log(`>> ATENÇÃO: ${missingInSet.length} parâmetros no MQ5 não estão no .SET:`);
  missingInSet.forEach(m => console.log(`   - ${m.name} (${m.type}) = ${m.defaultVal} (Linha MQ5: ${m.lineNum})`));
}

console.log('\n--- 2. PARÂMETROS NO .SET QUE NÃO EXISTEM NO MQ5 (OBSOLETOS) ---');
let extraInSet = [];
for (const key in setInputs) {
  if (!(key in mq5Inputs)) {
    extraInSet.push({ name: key, ...setInputs[key] });
  }
}
if (extraInSet.length === 0) {
  console.log('>> [100% OK] Nenhum parâmetro obsoleto no .SET!');
} else {
  console.log(`>> ATENÇÃO: ${extraInSet.length} parâmetros no .SET não existem no MQ5:`);
  extraInSet.forEach(e => console.log(`   - ${e.name} = ${e.val}`));
}

console.log('\n--- 3. COMPARATIVO DETALHADO DOS VALORES (DEFAULT MQ5 vs .SET) ---');
let diffs = [];
for (const key in mq5Inputs) {
  if (key in setInputs) {
    let mqVal = mq5Inputs[key].defaultVal;
    let setVal = setInputs[key].val;
    
    // Normalizações de enums e tipos
    let match = false;
    if (mqVal.toLowerCase() === setVal.toLowerCase()) {
      match = true;
    } else if (parseFloat(mqVal) === parseFloat(setVal)) {
      match = true;
    } else if (mqVal.replace(/"/g, '') === setVal.replace(/"/g, '')) {
      match = true;
    } else if (mqVal === 'PERFIL_MODERADO' && setVal === '1') {
      match = true;
    } else if (mqVal === 'PERIOD_H2' && setVal === '16388') {
      match = true;
    } else if (mqVal === 'PERIOD_H1' && setVal === '16385') {
      match = true;
    } else if (mqVal === 'PERIOD_M15' && setVal === '15') {
      match = true;
    } else if (mqVal === 'PERIOD_M30' && setVal === '30') {
      match = true;
    }
    
    if (!match) {
      diffs.push({ key, mqVal, setVal });
    }
  }
}

if (diffs.length === 0) {
  console.log('>> [100% SINCRONIZADO] Todos os valores no .SET são exatamente idênticos aos defaults do código MQ5!');
} else {
  console.log(`>> Existem ${diffs.length} diferenças entre o Default do MQ5 e o .SET:`);
  diffs.forEach(d => console.log(`   - ${d.key}: MQ5 Default = [${d.mqVal}] | .SET = [${d.setVal}]`));
}

console.log('\n--- 4. ESTADO DAS ESTRATÉGIAS PARA O TESTE (CONFORME .SET) ---');
const keyParams = [
  'InpPerfil',
  'InpTF',
  'InpAutoTF',
  'InpUseFR',
  'InpUseFibbo',
  'InpUseFluxo',
  'InpBaseRisk_L1',
  'InpTP_Parcial_Multi',
  'InpTP_Final_Multi',
  'InpBE_Trigger_Normal',
  'InpBE_LockProfitPts',
  'InpFR_RequireWickRejection',
  'InpFR_RequireVolumeAbsorption',
  'InpFR_UseStructuralTP2',
  'InpFib_FilterByATR',
  'InpMaxSimultaneousOps',
  'InpMaxDayTrades',
  'InpTravaDiariaGlobalPct',
  'InpMetaDiariaGlobalPct'
];

keyParams.forEach(k => {
  const setV = setInputs[k] ? setInputs[k].val : (mq5Inputs[k] ? mq5Inputs[k].defaultVal : 'NÃO ENCONTRADO');
  console.log(`   * ${k}: ${setV}`);
});
