const fs = require('fs');
const code = fs.readFileSync('Fibbo_Sniper_v28.5_H2.mq5', 'utf8');

console.log('=== AUDITORIA COMPLETA DE CÓDIGO MQ5 ===\n');

// 1. Verificar inputs
const inputLines = code.split('\n').filter(l => l.trim().startsWith('input '));
console.log('Inputs encontrados:', inputLines.length);
inputLines.forEach(l => {
  if (l.includes('Fibo') || l.includes('Fib') || l.includes('ATR') || l.includes('RSI')) {
    console.log('  ', l.trim());
  }
});

// 2. Verificar cálculos de nSell e nBuy
console.log('\n--- Fórmulas de nSell e nBuy ---');
code.split('\n').forEach((l, idx) => {
  if (l.includes('nSell') || l.includes('nBuy')) {
    console.log('L' + (idx+1) + ': ' + l.trim());
  }
});

// 3. Verificar inicialização de handles
console.log('\n--- Handles nos métodos ---');
['InicializarHandles', 'LiberarTodosHandles', 'AplicarModoFiltro', 'AplicarPerfil', 'RefreshBarCache'].forEach(fn => {
  const match = code.match(new RegExp('(void|bool)\\s+' + fn + '\\s*\\([^)]*\\)\\s*\\{([\\s\\S]*?)\\n\\}', 'm'));
  if (match) {
    console.log('\nFunção ' + fn + ':');
    console.log(match[0].split('\n').slice(0, 25).join('\n'));
  }
});
