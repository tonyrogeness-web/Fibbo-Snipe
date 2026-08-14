const fs = require('fs');

console.log('🔄 Atualizando matriz de roteamento MQL5 definitiva para os 10 Campeões Mestre...');

const mq5Path = 'c:\\Users\\tony\\.gemini\\antigravity-ide\\scratch\\FibboSniper\\Fibbo_Sniper_v28.5_H2.mq5';
if (fs.existsSync(mq5Path)) {
  let content = fs.readFileSync(mq5Path, 'utf8');

  const finalAutoTF = `void AutoSelecionarTF()
{
   if(!InpAutoTF) return;
   
   string sym = _Symbol;
   // Pares Campeoes em H1 (Euro & Kiwi de Alta Precisao)
   if(sym == "EURUSD" || sym == "NZDUSD" || sym == "EURCAD" || sym == "EURAUD") {
      g_TF_L1 = PERIOD_H1;
      TF_L2   = PERIOD_H4;
   } else if(sym == "USDCAD") {
      g_TF_L1 = PERIOD_M30;
      TF_L2   = PERIOD_H4;
   } else {
      // Pares Campeoes em H2 (AUDUSD, EURJPY, EURGBP, USDCHF, GBPUSD)
      g_TF_L1 = PERIOD_H2;
      TF_L2   = PERIOD_H4;
   }
}`;

  if (content.includes('void AutoSelecionarTF()')) {
    content = content.replace(/void AutoSelecionarTF\(\)[\s\S]*?^\}/m, finalAutoTF);
    fs.writeFileSync(mq5Path, content, 'utf8');
    console.log('✅ Matriz de roteamento MQL5 definitiva atualizada com sucesso!');
  }
}

console.log('🎉 PORTFÓLIO MESTRE DE 10 MOEDAS 100% REGISTRADO NO CÓDIGO FONTE!');
