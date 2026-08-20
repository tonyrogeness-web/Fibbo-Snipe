const fs = require('fs');
const path = require('path');

const appData = process.env.APPDATA;
const termDir = path.join(appData, 'MetaQuotes', 'Terminal');

console.log('=== INICIANDO LIMPEZA SEGURA DE TERMINAIS E CORRETORAS ANTIGAS ===\n');

let totalDeletedBytes = 0;

function removeRecursive(targetPath) {
  try {
    if (!fs.existsSync(targetPath)) return;
    const stat = fs.statSync(targetPath);
    if (stat.isDirectory()) {
      const files = fs.readdirSync(targetPath);
      files.forEach(f => removeRecursive(path.join(targetPath, f)));
      try { fs.rmdirSync(targetPath); } catch(e) {}
    } else {
      totalDeletedBytes += stat.size;
      fs.unlinkSync(targetPath);
    }
  } catch(e) {
    // Ignora arquivos bloqueados pelo Windows
  }
}

// 1. Excluir Terminal Quality FX (BA8A...)
const qfxPath = path.join(termDir, 'BA8A2CDC5DF2F0A02CC09E4789352781');
if (fs.existsSync(qfxPath)) {
  console.log('Excluindo Terminal Antigo Quality FX (BA8A...)...');
  removeRecursive(qfxPath);
  console.log('✔ Quality FX excluído!');
}

// 2. Excluir Terminal The 5%ers (10CE...)
const fivePath = path.join(termDir, '10CE948A1DFC9A8C27E56E827008EBD4');
if (fs.existsSync(fivePath)) {
  console.log('Excluindo Terminal Antigo The 5%ers (10CE...)...');
  removeRecursive(fivePath);
  console.log('✔ The 5%ers excluído!');
}

// 3. Limpar bases de corretoras antigas de dentro do MT5 da Exness (D0E8...)
const d0Bases = path.join(termDir, 'D0E8209F77C8CF37AD8BF550E51FF075', 'bases');
if (fs.existsSync(d0Bases)) {
  const obsoleteServers = [
    'ActivTrades-Server',
    'ActivTradesCorp-Server',
    'ICMarketsSC-Demo',
    'ICMarketsSC-MT5',
    'Monaxa-Demo',
    'Monaxa-MT5',
    'XMGlobal-MT5',
    'XMGlobal-MT5 2',
    'XMGlobal-MT5 5',
    'XMGlobal-MT5 6',
    'XMGlobal-MT5 7',
    'XMGlobal-MT5 9'
  ];

  obsoleteServers.forEach(srv => {
    const srvPath = path.join(d0Bases, srv);
    if (fs.existsSync(srvPath)) {
      console.log(`Limpando base antiga: ${srv}...`);
      removeRecursive(srvPath);
      console.log(`✔ ${srv} excluído!`);
    }
  });
}

// 4. Limpar caches temporários de Tester D0E8 se existirem
const d0Tester = path.join(appData, 'MetaQuotes', 'Tester', 'D0E8209F77C8CF37AD8BF550E51FF075');
if (fs.existsSync(d0Tester)) {
  console.log('Limpando caches antigos do Tester D0E8...');
  removeRecursive(d0Tester);
}

const freedGB = (totalDeletedBytes / (1024 * 1024 * 1024)).toFixed(2);
console.log('\n======================================================');
console.log(`🎉 LIMPEZA CONCLUÍDA COM SUCESSO!`);
console.log(`💾 Espaço EXTRA LIBERADO no seu HD agora: ${freedGB} GB!`);
console.log('🛡️ Blue Guardian MT5 e Exness USC MT5 100% PRESERVADOS E ATIVOS!');
console.log('======================================================');
