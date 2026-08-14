const fs = require('fs');

const mq5Content = fs.readFileSync('c:\\Users\\tony\\.gemini\\antigravity-ide\\scratch\\FibboSniper\\Fibbo_Sniper_v28.5_H2.mq5', 'utf8');

console.log('===================================================================================');
console.log('🔍 VARREDURA PROFUNDA DE CÓDIGO FONTE MQL5 (Fibbo_Sniper_v28.5_H2.mq5)');
console.log('===================================================================================\n');

// 1. Verifica AutoSelecionarTF
const autoTFMatch = mq5Content.match(/void AutoSelecionarTF\(\)[\s\S]*?^\}/m);
if (autoTFMatch) {
  console.log('📌 FUNÇÃO AutoSelecionarTF ENCONTRADA:');
  console.log(autoTFMatch[0]);
} else {
  console.log('❌ AutoSelecionarTF NÃO ENCONTRADA!');
}

// 2. Verifica se AutoSelecionarTF é chamada em OnInit
console.log('\n📌 VERIFICAÇÃO DE CHAMADA NO OnInit():');
const onInitMatch = mq5Content.match(/int OnInit\(\)[\s\S]*?return\(INIT_SUCCEEDED\);/m);
if (onInitMatch) {
  console.log('OnInit snippet:');
  console.log(onInitMatch[0].substring(0, 500));
  console.log('OnInit chama AutoSelecionarTF()?', onInitMatch[0].includes('AutoSelecionarTF()'));
} else {
  console.log('❌ OnInit() snippet não localizado via regex simples.');
}

// 3. Verifica Inputs Padrão
console.log('\n📌 VERIFICAÇÃO DOS PARÂMETROS INPUT PADRÃO:');
const inputsToCheck = [
  'InpPerfil',
  'InpBaseRisk_L1',
  'InpTP_Parcial_Multi',
  'InpTP_Final_Multi',
  'InpPerdaMaximaGlobalPct',
  'InpLucroAlvoMoedaPct',
  'InpAutoTF'
];

inputsToCheck.forEach(inp => {
  const reg = new RegExp(`(input|sinput).*?${inp}\\s*=\\s*([^;]+);`, 'i');
  const m = mq5Content.match(reg);
  if (m) {
    console.log(`  • ${inp}: ${m[2].trim()}`);
  } else {
    console.log(`  • ${inp}: Não encontrado diretamente com = `);
  }
});

console.log('===================================================================================\n');
