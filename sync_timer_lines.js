const fs = require('fs');

const file = 'Fibbo_Sniper_v28.5_H2.mq5';
let code = fs.readFileSync(file, 'utf8');

console.log('=== ATUALIZANDO S_CHART_HASH PARA SINCRONISMO DINÂMICO DE LINHAS NO ONTIMER ===\n');

const oldTimerHash = `   // [H1 FIX] Atualizar linhas do chart apenas se houve mudanca nos precos ou configuracoes
   static string s_chart_hash = "";
   string new_chart_hash = StringFormat("%.5f|%.5f|%.5f|%.5f|%d|%d",
      g_CachedCanalHigh, g_CachedCanalLow, g_CachedFRTop, g_CachedFRFundo,
      g_FastNPosSymbol, (int)g_ViewZonas);
   if(new_chart_hash != s_chart_hash) {
      s_chart_hash = new_chart_hash;
      DesenharLinhasChart();
   }`;

const newTimerHash = `   // [SINCRONIA DINÂMICA]: Atualiza as linhas sempre que confluência, requisitos, prontidão ou preços mudarem
   static string s_chart_hash = "";
   string new_chart_hash = StringFormat("%.5f|%.5f|%.5f|%.5f|%d|%d|%d|%d|%d|%d|%d|%d|%d|%d|%d|%d",
      g_CachedCanalHigh, g_CachedCanalLow, g_CachedFRTop, g_CachedFRFundo,
      g_FastNPosSymbol, (int)g_ViewZonas, (int)g_ViewFR, (int)g_ViewFibo,
      (int)g_LinhasModo, (int)g_MG_BuyAllowed, (int)g_MG_SellAllowed,
      (int)g_ReadyFR_Sell, (int)g_ReadyFR_Buy, (int)g_ReadyFibo,
      (int)f_h4_buy, (int)f_h4_sell);
   if(new_chart_hash != s_chart_hash) {
      s_chart_hash = new_chart_hash;
      DesenharLinhasChart();
   }`;

if (code.includes(oldTimerHash)) {
  code = code.replace(oldTimerHash, newTimerHash);
  console.log('✔ s_chart_hash expandido com todas as variáveis de confluência e requisitos!');
} else {
  console.log('❌ oldTimerHash não encontrado');
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

console.log('\n✔ Sincronização dinâmica aplicada com sucesso!');
