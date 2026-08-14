const fs = require('fs');
const path = require('path');

console.log('🔄 Atualizando a matriz de roteamento do Euro no código fonte MQ5...');

const mq5Path = 'c:\\Users\\tony\\.gemini\\antigravity-ide\\scratch\\FibboSniper\\Fibbo_Sniper_v28.5_H2.mq5';
if (fs.existsSync(mq5Path)) {
  let content = fs.readFileSync(mq5Path, 'utf8');

  // Atualiza a função AutoSelecionarTF para incluir todos os pares de Euro no H1
  const oldAutoTF = `void AutoSelecionarTF()
{
   if(!InpAutoTF) return;
   
   string sym = _Symbol;
   if(sym == "EURUSD" || sym == "NZDUSD") {
      g_TF_L1 = PERIOD_H1;
      TF_L2   = PERIOD_H4;
   } else if(sym == "USDCAD") {
      g_TF_L1 = PERIOD_M30;
      TF_L2   = PERIOD_H4;
   } else {
      g_TF_L1 = PERIOD_H2;
      TF_L2   = PERIOD_H4;
   }
}`;

  const newAutoTF = `void AutoSelecionarTF()
{
   if(!InpAutoTF) return;
   
   string sym = _Symbol;
   // Pares de Alta Precisao no H1 (Euro & Kiwi)
   if(sym == "EURUSD" || sym == "NZDUSD" || sym == "EURAUD" || sym == "EURGBP" || sym == "EURCAD" || sym == "EURNZD" || sym == "EURCHF") {
      g_TF_L1 = PERIOD_H1;
      TF_L2   = PERIOD_H4;
   } else if(sym == "USDCAD") {
      g_TF_L1 = PERIOD_M30;
      TF_L2   = PERIOD_H4;
   } else {
      g_TF_L1 = PERIOD_H2;
      TF_L2   = PERIOD_H4;
   }
}`;

  if (content.includes('void AutoSelecionarTF()')) {
    content = content.replace(/void AutoSelecionarTF\(\)[\s\S]*?^\}/m, newAutoTF);
    fs.writeFileSync(mq5Path, content, 'utf8');
    console.log('✅ Matriz de roteamento MQL5 para todos os pares de Euro no H1 atualizada com sucesso!');
  }
}

console.log('🎉 SISTEMA PRONTO PARA TESTES DOS PARES DE EURO EM H1!');
