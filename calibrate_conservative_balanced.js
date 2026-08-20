const fs = require('fs');
const path = require('path');

const file = 'Fibbo_Sniper_v28.5_H2.mq5';
let code = fs.readFileSync(file, 'utf8');

console.log('=== CALIBRANDO FIBBO SNIPER V28.5 PRO: MODO CONSERVADOR HARMONIZADO ===\n');

// 1. Risco por Trade: 1.0%
code = code.replace(
  /input double InpBaseRisk_L1\s*=\s*[0-9.]+;[^\n]*/,
  'input double InpBaseRisk_L1 = 1.0;  // [CONSERVADOR] Risco base 1.0% por trade ($100 USD em 10k -> Win Cheio = +$235.00 USD)'
);

code = code.replace(
  /input double InpPropMaxRiskPct\s*=\s*[0-9.]+;[^\n]*/,
  'input double InpPropMaxRiskPct        = 1.0;   // [CONSERVADOR] Risco Máx. por Trade 1.0% ($100 USD em 10k)'
);

// 2. Trava Diária: 2.0%
code = code.replace(
  /input double InpPerdaMaximaGlobalPct\s*=\s*[0-9.]+\s*,\s*InpPerdaMaximaMoedaPct\s*=\s*[0-9.]+\s*,\s*InpLucroAlvoMoedaPct\s*=\s*[0-9.]+;[^\n]*/,
  'input double InpPerdaMaximaGlobalPct = 2.0, InpPerdaMaximaMoedaPct = 2.0, InpLucroAlvoMoedaPct = 4.0; // Trava Loss 2.0% (Permite 2 stops) e Meta 4.0%'
);

code = code.replace(
  /input double InpPropMaxDailyLossPct\s*=\s*[0-9.]+;[^\n]*/,
  'input double InpPropMaxDailyLossPct   = 2.0;   // [SWEET SPOT] Perda Diária Máx. Prop 2.0% da conta (-$200 USD em 10k)'
);

// 3. Salvar no arquivo local
fs.writeFileSync(file, code);
console.log('✔ Fibbo_Sniper_v28.5_H2.mq5 atualizado para Risco 1.0% e Trava Diária 2.0%!');

// 4. Sincronizar com as pastas de Experts do MT5
const expertPaths = [
  'C:\\Users\\tony\\AppData\\Roaming\\MetaQuotes\\Terminal\\59C07D676775FCCF79E223EC24AB0D86\\MQL5\\Experts\\Fibbo_Sniper_v28.5_H2.mq5',
  'C:\\Users\\tony\\AppData\\Roaming\\MetaQuotes\\Terminal\\10CE948A1DFC9A8C27E56E827008EBD4\\MQL5\\Experts\\Fibbo_Sniper_v28.5_H2.mq5'
];

expertPaths.forEach(p => {
  try {
    fs.writeFileSync(p, fs.readFileSync(file));
    console.log('✔ .MQ5 sincronizado em:', p);
  } catch (err) {
    console.log('Erro ao salvar em:', p, err.message);
  }
});

// 5. Regenerar todos os arquivos .SET perfeitamente
const setEntries = [];
setEntries.push("InpPerfil=1||0||0||0||N");

const lines = code.split('\n');

for (let i = 0; i < lines.length; i++) {
  let line = lines[i].trim();
  if (line.startsWith('input ') && !line.startsWith('input group') && !line.includes('InpPerfil')) {
    let raw = line.substring(6).trim();
    if (raw.includes('//')) raw = raw.split('//')[0].trim();
    if (raw.endsWith(';')) raw = raw.slice(0, -1).trim();

    const firstSpace = raw.indexOf(' ');
    if (firstSpace > 0) {
      const rest = raw.substring(firstSpace).trim();
      const parts = rest.split(',');
      parts.forEach(p => {
        const eq = p.split('=');
        if (eq.length === 2) {
          const name = eq[0].trim();
          let val = eq[1].trim();
          if (val.startsWith('"') && val.endsWith('"')) {
            val = val.slice(1, -1);
          }
          if (val === 'PERFIL_CONSERVADOR') val = '0';
          else if (val === 'PERFIL_MODERADO') val = '1';
          else if (val === 'PERFIL_AGRESSIVO') val = '2';
          
          setEntries.push(name + '=' + val + '||0||0||0||N');
        }
      });
    }
  }
}

const setContent = '\ufeff' + setEntries.join('\r\n') + '\r\n';
const setBuffer = Buffer.from(setContent, 'utf16le');

const setPaths = [
  'Fibbo_Sniper_v28.5_H2.set',
  'Fibbo_High_Precision_Dual_Engine.set',
  'Cenario_3_H2_Maior_Lucro.set',
  'C:\\Users\\tony\\AppData\\Roaming\\MetaQuotes\\Terminal\\59C07D676775FCCF79E223EC24AB0D86\\MQL5\\Profiles\\Tester\\Fibbo_Sniper_v28.5_H2.set',
  'C:\\Users\\tony\\AppData\\Roaming\\MetaQuotes\\Terminal\\59C07D676775FCCF79E223EC24AB0D86\\MQL5\\Presets\\Fibbo_Sniper_v28.5_H2.set',
  'C:\\Users\\tony\\AppData\\Roaming\\MetaQuotes\\Terminal\\10CE948A1DFC9A8C27E56E827008EBD4\\MQL5\\Profiles\\Tester\\Fibbo_Sniper_v28.5_H2.set',
  'C:\\Users\\tony\\AppData\\Roaming\\MetaQuotes\\Terminal\\10CE948A1DFC9A8C27E56E827008EBD4\\MQL5\\Presets\\Fibbo_Sniper_v28.5_H2.set'
];

setPaths.forEach(p => {
  try {
    const dir = path.dirname(p);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(p, setBuffer);
    console.log('✔ .SET gravado em:', p);
  } catch (err) {
    console.log('Erro ao salvar em:', p, err.message);
  }
});

console.log('\n=== CALIBRAGEM CONSERVADORA HARMONIZADA COM SUCESSO! ===');
