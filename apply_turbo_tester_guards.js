const fs = require('fs');

const file = 'Fibbo_Sniper_v28.5_H2.mq5';
let code = fs.readFileSync(file, 'utf8');

console.log('=== ATIVANDO MODO TURBO DE ALTA VELOCIDADE NO TESTADOR DO MT5 ===\n');

// Inserir guarda nos métodos visuais para pular renderização pesada no backtest não-visual
const guard = '   if(MQLInfoInteger(MQL_TESTER) && !MQLInfoInteger(MQL_VISUAL_MODE)) return;\n';

const funcsToTurbo = [
  'void DesenharPainel() {',
  'void DesenharLinhasChart() {',
  'void DesenharLinhasOrdens() {',
  'void DesenharPainelDiag() {',
  'void DesenharPainelConfig() {',
  'void DesenharPainelPropFirm() {',
  'void DesenharLinhasAnalise() {'
];

funcsToTurbo.forEach(fn => {
  if (code.includes(fn)) {
    // Insere a guarda logo após a abertura da função
    if (!code.includes(fn + '\n' + guard)) {
      code = code.replace(fn, fn + '\n' + guard);
      console.log('✔ Modo Turbo ativado em:', fn);
    }
  }
});

fs.writeFileSync(file, code);

// Sincronizar com as pastas de Experts do MT5
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

console.log('\n=== MODO TURBO ATIVADO COM SUCESSO! ===');
