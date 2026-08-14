const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'Fibbo_Sniper_v28.5_H2.mq5');
let content = fs.readFileSync(filePath, 'utf8').replace(/\r\n/g, '\n');

// 1. Corrigir warning de POSITION_COMMISSION
const oldComm = `c_posProfit=PositionGetDouble(POSITION_PROFIT)+PositionGetDouble(POSITION_SWAP)+PositionGetDouble(POSITION_COMMISSION);`;
const newComm = `c_posProfit=PositionGetDouble(POSITION_PROFIT)+PositionGetDouble(POSITION_SWAP);`;

if (content.includes(oldComm)) {
  content = content.replace(oldComm, newComm);
  console.log('✔ Warning POSITION_COMMISSION corrigido!');
}

// 2. Corrigir erro de redeclaração int bw5 / bx5 na linha 2357
const oldDecl2 = `   // 3. SEÇÃO CONFLUÊNCIA MARKETGLANCE
   CFG_LBLC("3", cur, "🔍 FILTRO CONFLUÊNCIA", CLR_TXT_PRIMARY); cur += 15;
   int bw5 = 46, bx5 = cpx + (cpw - (5 * 46 + 4 * 4)) / 2;`;

const newDecl2 = `   // 3. SEÇÃO CONFLUÊNCIA MARKETGLANCE
   CFG_LBLC("3", cur, "🔍 FILTRO CONFLUÊNCIA", CLR_TXT_PRIMARY); cur += 15;
   bw5 = 46; bx5 = cpx + (cpw - (5 * 46 + 4 * 4)) / 2;`;

if (content.includes(oldDecl2)) {
  content = content.replace(oldDecl2, newDecl2);
  console.log('✔ Erro de redeclaração bw5/bx5 corrigido!');
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('🎉 CORREÇÃO COMPLETA APLICADA COM SUCESSO!');
