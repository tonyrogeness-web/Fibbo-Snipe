const fs = require('fs');

const file = 'Fibbo_Sniper_v28.5_H2.mq5';
let code = fs.readFileSync(file, 'utf8');

console.log('=== ATUALIZANDO MODO ZEN PARA VISUALIZAR DINAMICAMENTE NO TIMEFRAME ATUAL DA TELA ===\n');

const oldZenTimeCalc = `   // CANAIS DE REGRESSAO (Tempo de inicio e fim)
   g_MG_TimeMacroEnd = iTime(_Symbol, g_MG_CurrentTF, 0);
   g_MG_TimeMacroStart = iTime(_Symbol, g_MG_CurrentTF, 150); // 150 velas para tras
   
   g_MG_TimeMicroEnd = iTime(_Symbol, g_MG_CurrentTF, 0);
   g_MG_TimeMicroStart = iTime(_Symbol, g_MG_CurrentTF, 45); // 45 velas para tras`;

const newZenTimeCalc = `   // CANAIS DE REGRESSAO (Visualização Dinâmica no Timeframe ATUAL da tela: H4, H2, H1, etc.)
   ENUM_TIMEFRAMES tf_vis = _Period; // Pega automaticamente o TF em que o gráfico estiver aberto
   g_MG_TimeMacroEnd = iTime(_Symbol, tf_vis, 0);
   g_MG_TimeMacroStart = iTime(_Symbol, tf_vis, 150); // 150 velas do TF atual da tela
   
   g_MG_TimeMicroEnd = iTime(_Symbol, tf_vis, 0);
   g_MG_TimeMicroStart = iTime(_Symbol, tf_vis, 45);  // 45 velas do TF atual da tela`;

if (code.includes(oldZenTimeCalc)) {
  code = code.replace(oldZenTimeCalc, newZenTimeCalc);
  console.log('✔ Cálculo de tempo dos canais Zen atualizado para usar o Timeframe dinâmico da tela (_Period)!');
} else {
  console.log('❌ oldZenTimeCalc não encontrado');
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

console.log('\n✔ Atualização dinâmica do Modo Zen concluída com sucesso!');
