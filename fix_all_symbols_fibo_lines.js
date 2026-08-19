const fs = require('fs');

const file = 'Fibbo_Sniper_v28.5_H2.mq5';
let code = fs.readFileSync(file, 'utf8');

console.log('=== CORRIGINDO EXIBIÇÃO DE LINHAS FIBO PARA TODAS AS 6 MOEDAS (NUNCA SUMIR) ===\n');

const oldFiboConflBlock = `      if(g_ModoConfluencia > 0) {
         if(!g_MG_SellAllowed) fb_dir_sell = false;
         if(!g_MG_BuyAllowed)  fb_dir_buy  = false;
      }

      // [SINCRONIA RIGOROSA]: A linha só vira CONTÍNUA (highlight=true) se a vela NÃO tiver sido operada e TODOS os requisitos estiverem OK
      bool fb_s_all_ok = fb_all_ok && fb_bar_sell_ok;
      bool fb_b_all_ok = fb_all_ok && fb_bar_buy_ok;`;

const newFiboConflBlock = `      // [CONFLUÊNCIA DE ENTRADA]: Confluência bloqueia apenas a linha contínua/ordem, mas NUNCA apaga a linha pontilhada do gráfico
      bool fb_confl_s_ok = (g_ModoConfluencia > 0) ? g_MG_SellAllowed : true;
      bool fb_confl_b_ok = (g_ModoConfluencia > 0) ? g_MG_BuyAllowed  : true;

      // [SINCRONIA RIGOROSA]: A linha só vira CONTÍNUA (highlight=true) se Confluência OK, vela NÃO operada e TODOS os requisitos válidos
      bool fb_s_all_ok = fb_all_ok && fb_bar_sell_ok && fb_confl_s_ok;
      bool fb_b_all_ok = fb_all_ok && fb_bar_buy_ok && fb_confl_b_ok;`;

if (code.includes(oldFiboConflBlock)) {
  code = code.replace(oldFiboConflBlock, newFiboConflBlock);
  console.log('✔ Linhas da Fibonacci desbloqueadas para exibirem pontilhadas em todas as 6 moedas!');
} else {
  console.log('❌ oldFiboConflBlock não encontrado');
}

// Também garantir que o FR siga a mesma regra de exibição (não sumir se MarketGlance bloquear, apenas ficar pontilhada)
const oldFrConflBlock = `   bool fr_sell_confl_ok = (g_ModoConfluencia > 0) ? g_MG_SellAllowed : true;
   bool fr_buy_confl_ok  = (g_ModoConfluencia > 0) ? g_MG_BuyAllowed : true;
   if(!fr_sell_confl_ok) fr_dir_sell = false;
   if(!fr_buy_confl_ok)  fr_dir_buy  = false;`;

const newFrConflBlock = `   bool fr_sell_confl_ok = (g_ModoConfluencia > 0) ? g_MG_SellAllowed : true;
   bool fr_buy_confl_ok  = (g_ModoConfluencia > 0) ? g_MG_BuyAllowed : true;`;

if (code.includes(oldFrConflBlock)) {
  code = code.replace(oldFrConflBlock, newFrConflBlock);
  console.log('✔ Linhas do FR desbloqueadas para exibirem pontilhadas em todas as moedas!');
} else {
  console.log('❌ oldFrConflBlock não encontrado');
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

console.log('\n✔ ' + file + ' salvo e sincronizado com sucesso!');
