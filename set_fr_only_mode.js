const fs = require('fs');

const file = 'Fibbo_Sniper_v28.5_H2.mq5';
let code = fs.readFileSync(file, 'utf8');

console.log('=== CONFIGURANDO OFICIALMENTE: APENAS FR (FIBONACCI DESATIVADA) ===\n');

// 1. Atualizar InpUseFiboPullback = false por padrão
const oldFiboInput = `input bool   InpUseFiboPullback          = true;  // [FIBO 2.0] Ativar Retrações de Fibonacci`;
const newFiboInput = `input bool   InpUseFiboPullback          = false; // [FIBO 2.0] Desativado (Modo Oficial: APENAS FR 100% Ativo)`;

if (code.includes(oldFiboInput)) {
  code = code.replace(oldFiboInput, newFiboInput);
  console.log('✔ InpUseFiboPullback alterado para false por padrão!');
} else {
  console.log('Aviso: oldFiboInput não encontrado de forma exata, checando outras variações...');
  code = code.replace(/input bool\s+InpUseFiboPullback\s*=\s*(true|false);[^\n]*/, newFiboInput);
  console.log('✔ InpUseFiboPullback atualizado via regex!');
}

fs.writeFileSync(file, code);

// Sincroniza com as pastas de Experts do MT5
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

console.log('\n✔ Código atualizado com sucesso!');
