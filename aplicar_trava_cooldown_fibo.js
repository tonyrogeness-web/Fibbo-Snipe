const fs = require('fs');

const file = 'c:\\Users\\tony\\.gemini\\antigravity-ide\\scratch\\FibboSniper\\Fibbo_Sniper_v28.5_H2.mq5';
let content = fs.readFileSync(file, 'utf8');

console.log('🔄 Adicionando Trava Anti-Overtrading (Cooldown) ao Motor 3 (Fibonacci)...');

// Adiciona variáveis globais de cooldown para Fibo se não existirem
if (!content.includes('datetime l_fibo_sell_ts = 0')) {
  content = content.replace(
    'datetime f_h4_buy = 0, f_h4_sell = 0, f_h4_buy2 = 0, f_h4_sell2 = 0;',
    'datetime f_h4_buy = 0, f_h4_sell = 0, f_h4_buy2 = 0, f_h4_sell2 = 0;\ndatetime l_fibo_buy_ts = 0, l_fibo_sell_ts = 0; // [COOLDOWN FIBO] Previne overtrading'
  );
}

// Injeta checagem de cooldown em minutos no Fibo (InpFR_CooldownMinutes * 60)
const oldFiboBlock = `if(InpUseFiboPullback && !block_fibo) {`;
const newFiboBlock = `if(InpUseFiboPullback && !block_fibo) {
      int cooldown_sec = InpFR_CooldownMinutes * 60;
      bool fibo_cd_buy  = (cooldown_sec <= 0 || (TimeCurrent() - l_fibo_buy_ts >= cooldown_sec));
      bool fibo_cd_sell = (cooldown_sec <= 0 || (TimeCurrent() - l_fibo_sell_ts >= cooldown_sec));`;

if (content.includes(oldFiboBlock)) {
  content = content.replace(oldFiboBlock, newFiboBlock);
}

// Atualiza chamadas de AbrirSell e AbrirBuy no Fibo para checar cooldown e salvar timestamp
content = content.replace(
  `if(AbrirSell(l_h4,bid,sl_f,InpTP_Parcial_Multi,InpTP_Final_Multi,"Fibo_Sell_H4"))f_h4_sell=cb_h4;`,
  `if(fibo_cd_sell && AbrirSell(l_h4,bid,sl_f,InpTP_Parcial_Multi,InpTP_Final_Multi,"Fibo_Sell_H4")){ f_h4_sell=cb_h4; l_fibo_sell_ts=TimeCurrent(); }`
);

content = content.replace(
  `if(AbrirBuy (l_h4,ask,sl_f,InpTP_Parcial_Multi,InpTP_Final_Multi,"Fibo_Buy_H4")) f_h4_buy=cb_h4;`,
  `if(fibo_cd_buy && AbrirBuy (l_h4,ask,sl_f,InpTP_Parcial_Multi,InpTP_Final_Multi,"Fibo_Buy_H4")){ f_h4_buy=cb_h4; l_fibo_buy_ts=TimeCurrent(); }`
);

content = content.replace(
  `if(AbrirSell(l_h4_2,bid,sl_f,InpTP_Parcial_Multi,InpTP_Final_Multi,"Fibo_Sell_H4_2"))f_h4_sell2=cb_h4;`,
  `if(fibo_cd_sell && AbrirSell(l_h4_2,bid,sl_f,InpTP_Parcial_Multi,InpTP_Final_Multi,"Fibo_Sell_H4_2")){ f_h4_sell2=cb_h4; l_fibo_sell_ts=TimeCurrent(); }`
);

content = content.replace(
  `if(AbrirBuy (l_h4_2,ask,sl_f,InpTP_Parcial_Multi,InpTP_Final_Multi,"Fibo_Buy_H4_2")) f_h4_buy2=cb_h4;`,
  `if(fibo_cd_buy && AbrirBuy (l_h4_2,ask,sl_f,InpTP_Parcial_Multi,InpTP_Final_Multi,"Fibo_Buy_H4_2")){ f_h4_buy2=cb_h4; l_fibo_buy_ts=TimeCurrent(); }`
);

fs.writeFileSync(file, content);
console.log('🎉 Trava Anti-Overtrading (Cooldown) adicionada com sucesso no código MQL5!');
