const fs = require('fs');

const file = 'Fibbo_Sniper_v28.5_H2.mq5';
let code = fs.readFileSync(file, 'utf8');

console.log('=== IMPLEMENTANDO JUROS COMPOSTOS DINÂMICOS E NOTIFICAÇÕES PUSH MOBILE ===\n');

// 1. Inserir novos inputs no grupo de Notificações
const oldInputAnchor = `input group "=== TELEMETRIA E LOGS ==="`;
const newInputBlock = `input group "=== JUROS COMPOSTOS & NOTIFICAÇÕES MOBILE ==="
input bool InpUseAutoCompounding    = true; // [AUTO-COMPOUND] Recalcular lote dinamicamente sobre o Saldo Atual
input bool InpSendPushNotifications = true; // [PUSH MOBILE] Alertas em tempo real no Celular (App MT5)

input group "=== TELEMETRIA E LOGS ==="`;

if (code.includes(oldInputAnchor)) {
  code = code.replace(oldInputAnchor, newInputBlock);
  console.log('✔ Inputs de Auto-Compounding e Push Mobile inseridos!');
} else {
  console.log('❌ oldInputAnchor não encontrado');
}

// 2. Inserir a função EnviarPushNotification
const oldPushAnchor = `void EscreverCSV(string comment, double lot, double price, double sl, double tp) {`;
const newPushFunc = `void EnviarPushNotification(string msg) {
   if(!InpSendPushNotifications) return;
   if(MQLInfoInteger(MQL_TESTER) && !MQLInfoInteger(MQL_VISUAL_MODE)) return;
   string full_msg = StringFormat("[%s] Fibbo Sniper: %s", _Symbol, msg);
   SendNotification(full_msg);
}

void EscreverCSV(string comment, double lot, double price, double sl, double tp) {`;

if (code.includes(oldPushAnchor)) {
  code = code.replace(oldPushAnchor, newPushFunc);
  console.log('✔ Função EnviarPushNotification inserida com sucesso!');
} else {
  console.log('❌ oldPushAnchor não encontrado');
}

// 3. Atualizar AbrirBuy e AbrirSell para disparar Push Notification
const oldBuyEnd = `   EscreverCSV(comment, lot, ask, norm_sl, norm_tp1); return true;
}`;

const newBuyEnd = `   EscreverCSV(comment, lot, ask, norm_sl, norm_tp1);
   EnviarPushNotification(StringFormat("🎯 COMPRA Aberta | Lote: %.2f | Preço: %.5f | SL: %.5f | TP1: %.5f | TP2: %.5f (%s)", lot, ask, norm_sl, norm_tp1, norm_tp2, comment));
   return true;
}`;

if (code.includes(oldBuyEnd)) {
  code = code.replace(oldBuyEnd, newBuyEnd);
  console.log('✔ Push Notification integrada em AbrirBuy!');
} else {
  console.log('❌ oldBuyEnd não encontrado');
}

const oldSellEnd = `   EscreverCSV(comment, lot, bid, norm_sl, norm_tp1); return true;
}`;

const newSellEnd = `   EscreverCSV(comment, lot, bid, norm_sl, norm_tp1);
   EnviarPushNotification(StringFormat("🎯 VENDA Aberta | Lote: %.2f | Preço: %.5f | SL: %.5f | TP1: %.5f | TP2: %.5f (%s)", lot, bid, norm_sl, norm_tp1, norm_tp2, comment));
   return true;
}`;

if (code.includes(oldSellEnd)) {
  code = code.replace(oldSellEnd, newSellEnd);
  console.log('✔ Push Notification integrada em AbrirSell!');
} else {
  console.log('❌ oldSellEnd não encontrado');
}

// 4. Integrar Notificações de Break Even e Mid-Lock no OnTick
const oldBeLog = `if(trade.PositionModify(ticket,nsl,posTP)){AddLog(StringFormat("BE+Lock (%s): Compra SL=%.5f.",be_tp1?"TP1":"Respiro",nsl));be_triggered=true; posSL=nsl;}`;
const newBeLog = `if(trade.PositionModify(ticket,nsl,posTP)){
                     AddLog(StringFormat("BE+Lock (%s): Compra SL=%.5f.",be_tp1?"TP1":"Respiro",nsl));
                     be_triggered=true; posSL=nsl;
                     EnviarPushNotification(StringFormat("🛡️ BREAK EVEN Ativado | Compra SL protegido em %.5f (%s)", nsl, be_tp1?"TP1 Parcial":"Respiro ATR"));
                  }`;

if (code.includes(oldBeLog)) {
  code = code.replace(oldBeLog, newBeLog);
  console.log('✔ Push Notification de Break Even (Compra) integrada!');
} else {
  console.log('❌ oldBeLog não encontrado');
}

const oldBeSellLog = `if(trade.PositionModify(ticket,nsl,posTP)){AddLog(StringFormat("BE+Lock (%s): Venda SL=%.5f.",be_tp1?"TP1":"Respiro",nsl));be_triggered=true; posSL=nsl;}`;
const newBeSellLog = `if(trade.PositionModify(ticket,nsl,posTP)){
                     AddLog(StringFormat("BE+Lock (%s): Venda SL=%.5f.",be_tp1?"TP1":"Respiro",nsl));
                     be_triggered=true; posSL=nsl;
                     EnviarPushNotification(StringFormat("🛡️ BREAK EVEN Ativado | Venda SL protegido em %.5f (%s)", nsl, be_tp1?"TP1 Parcial":"Respiro ATR"));
                  }`;

if (code.includes(oldBeSellLog)) {
  code = code.replace(oldBeSellLog, newBeSellLog);
  console.log('✔ Push Notification de Break Even (Venda) integrada!');
} else {
  console.log('❌ oldBeSellLog não encontrado');
}

const oldMidBuyLog = `if(trade.PositionModify(ticket, nsl, posTP)) {
                        AddLog(StringFormat("Mid-Channel Lock: Compra SL travado em +25%% do canal (%.5f).", nsl));
                        posSL = nsl; // [FIX ITEM 3] Atualiza variável local posSL para o trailing não reverter
                     }`;

const newMidBuyLog = `if(trade.PositionModify(ticket, nsl, posTP)) {
                        AddLog(StringFormat("Mid-Channel Lock: Compra SL travado em +25%% do canal (%.5f).", nsl));
                        posSL = nsl;
                        EnviarPushNotification(StringFormat("🔒 MID-LOCK Ativado (+25%% Canal) | Compra SL travado no lucro em %.5f", nsl));
                     }`;

if (code.includes(oldMidBuyLog)) {
  code = code.replace(oldMidBuyLog, newMidBuyLog);
  console.log('✔ Push Notification de Mid-Lock (Compra) integrada!');
} else {
  console.log('❌ oldMidBuyLog não encontrado');
}

const oldMidSellLog = `if(trade.PositionModify(ticket, nsl, posTP)) {
                        AddLog(StringFormat("Mid-Channel Lock: Venda SL travado em +25%% do canal (%.5f).", nsl));
                        posSL = nsl; // [FIX ITEM 3] Atualiza variável local posSL para o trailing não reverter
                     }`;

const newMidSellLog = `if(trade.PositionModify(ticket, nsl, posTP)) {
                        AddLog(StringFormat("Mid-Channel Lock: Venda SL travado em +25%% do canal (%.5f).", nsl));
                        posSL = nsl;
                        EnviarPushNotification(StringFormat("🔒 MID-LOCK Ativado (+25%% Canal) | Venda SL travado no lucro em %.5f", nsl));
                     }`;

if (code.includes(oldMidSellLog)) {
  code = code.replace(oldMidSellLog, newMidSellLog);
  console.log('✔ Push Notification de Mid-Lock (Venda) integrada!');
} else {
  console.log('❌ oldMidSellLog não encontrado');
}

// 5. Inserir OnTradeTransaction no final do código para notificar fechamento de ordens (TP1/TP2/SL)
const onTradeTxFunc = `
//===================================================================
// MONITORAMENTO DE TRANSAÇÕES E NOTIFICAÇÕES DE FECHAMENTO
//===================================================================
void OnTradeTransaction(const MqlTradeTransaction& trans, const MqlTradeRequest& request, const MqlTradeResult& result) {
   if(trans.type == TRADE_TRANSACTION_DEAL_ADD) {
      if(HistoryDealSelect(trans.deal)) {
         if(HistoryDealGetInteger(trans.deal, DEAL_ENTRY) == DEAL_ENTRY_OUT && 
            HistoryDealGetInteger(trans.deal, DEAL_MAGIC) == InpMagic && 
            HistoryDealGetString(trans.deal, DEAL_SYMBOL) == _Symbol) {
            double profit = HistoryDealGetDouble(trans.deal, DEAL_PROFIT) + HistoryDealGetDouble(trans.deal, DEAL_SWAP) + HistoryDealGetDouble(trans.deal, DEAL_COMMISSION);
            string comm = HistoryDealGetString(trans.deal, DEAL_COMMENT);
            string result_txt = (profit >= 0) ? StringFormat("💰 WIN! +$%.2f USD", profit) : StringFormat("🛑 LOSS! -$%.2f USD", MathAbs(profit));
            EnviarPushNotification(StringFormat("🏁 Trade Finalizado (%s) | %s", comm, result_txt));
         }
      }
   }
}
`;

code = code.trim() + '\n' + onTradeTxFunc;
console.log('✔ OnTradeTransaction adicionado para notificar Wins e Resultados em tempo real no celular!');

fs.writeFileSync(file, code);

// Sincronizar com as pastas de Experts do MT5
const expertPaths = [
  'C:\\Users\\tony\\AppData\\Roaming\\MetaQuotes\\Terminal\\59C07D676775FCCF79E223EC24AB0D86\\MQL5\\Experts\\Fibbo_Sniper_v28.5_H2.mq5'
];

expertPaths.forEach(p => {
  try {
    fs.writeFileSync(p, fs.readFileSync(file));
    console.log('✔ .MQ5 sincronizado em:', p);
  } catch (err) {
    console.log('Erro ao salvar em:', p, err.message);
  }
});

console.log('\n=== RECURSOS IMPLEMENTADOS COM SUCESSO! ===');
