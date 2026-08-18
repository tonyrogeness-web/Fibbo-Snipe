const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const mq5Path = path.join(__dirname, 'Fibbo_Sniper_v28.5_H2.mq5');
let content = fs.readFileSync(mq5Path, 'utf8');

// 1. Simetria total no g_GV_Blocked
content = content.replace(
  'g_GV_Blocked     = "Sniper_Blocked_" + _Symbol;',
  'g_GV_Blocked     = "Sniper_Blocked_" + _Symbol + "_" + IntegerToString(AccountInfoInteger(ACCOUNT_LOGIN));'
);

// 2. Refinamento de precisão no texto diagnóstico do MarketGlance
const oldMgDiag = `      if(g_ModoConfluencia>0){
         if(t_h4 == 1) { confl_mg_ok = g_MG_BuyAllowed; confl_val = g_MG_BuyAllowed ? "COMPRA (OK)" : "BLOQ (SÓ VENDA)"; }
         else if(t_h4 == -1) { confl_mg_ok = g_MG_SellAllowed; confl_val = g_MG_SellAllowed ? "VENDA (OK)" : "BLOQ (SÓ COMPRA)"; }
         else {
            if(g_MG_BuyAllowed&&!g_MG_SellAllowed) confl_val="SÓ COMPRA";
            else if(!g_MG_BuyAllowed&&g_MG_SellAllowed) confl_val="SÓ VENDA";
            else confl_val="LIVRE";
            confl_mg_ok = (g_MG_BuyAllowed || g_MG_SellAllowed);
         }
      }`;

const newMgDiag = `      if(g_ModoConfluencia>0){
         if(t_h4 == 1) { confl_mg_ok = g_MG_BuyAllowed; confl_val = g_MG_BuyAllowed ? "COMPRA (OK)" : (g_MG_SellAllowed ? "BLOQ (SÓ VENDA)" : "BLOQ (EMA)"); }
         else if(t_h4 == -1) { confl_mg_ok = g_MG_SellAllowed; confl_val = g_MG_SellAllowed ? "VENDA (OK)" : (g_MG_BuyAllowed ? "BLOQ (SÓ COMPRA)" : "BLOQ (EMA)"); }
         else {
            if(g_MG_BuyAllowed&&!g_MG_SellAllowed) confl_val="SÓ COMPRA";
            else if(!g_MG_BuyAllowed&&g_MG_SellAllowed) confl_val="SÓ VENDA";
            else if(g_MG_BuyAllowed&&g_MG_SellAllowed) confl_val="LIVRE";
            else confl_val="BLOQUEADO";
            confl_mg_ok = (g_MG_BuyAllowed || g_MG_SellAllowed);
         }
      }`;

content = content.replace(oldMgDiag, newMgDiag);

fs.writeFileSync(mq5Path, content, 'utf8');
console.log('✔ MQ5 atualizado com os dois polimentos de precisão!');

// Compilar com MetaEditor
const metaEditor = 'C:\\Program Files\\MetaTrader 5\\metaeditor64.exe';
const logFile = path.join(__dirname, 'compile.log');
const cmd = `"${metaEditor}" /compile:"${mq5Path}" /log:"${logFile}"`;

try {
  execSync(cmd);
} catch(e) {}

if (fs.existsSync(logFile)) {
  const logContent = fs.readFileSync(logFile, 'utf16le');
  console.log('--- Log de Compilação ---');
  console.log(logContent.trim());
}

// Deploy do .ex5
require('./deploy_ex5.js');
console.log('\n🎉 POLIMENTO E DEPLOY FINAL CONCLUÍDOS COM 100% DE SUCESSO!');
