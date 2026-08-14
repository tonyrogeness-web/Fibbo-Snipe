const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'Fibbo_Sniper_v28.5_H2.mq5');
let content = fs.readFileSync(filePath, 'utf8').replace(/\r\n/g, '\n');

// 1. Atualizar btns[] em DesenharPainelConfig()
const oldBtns = `"tf_m15","tf_h1","tf_h2","tf_h4",`;
const newBtns = `"tf_m15","tf_m30","tf_h1","tf_h2","tf_h4",`;

if (content.includes(oldBtns)) {
  content = content.replace(oldBtns, newBtns);
}

// 2. Atualizar layout de botões de Timeframe em DesenharPainelConfig()
const oldTFLayout = `   // 1. SEÇÃO TIMEFRAME EXECUÇÃO
   CFG_LBLC("1", cur, "⏱ TIMEFRAME EXECUÇÃO", CLR_TXT_PRIMARY); cur += 15;
   int bw4 = 58, bx4 = cpx + (cpw - (4 * 58 + 3 * 4)) / 2;
   CFG_BTN("tf_m15", bx4,              cur, bw4, 20, "M15", g_TF_L1 == PERIOD_M15, CLR_TEAL);
   CFG_BTN("tf_h1",  bx4 + bw4 + 4,     cur, bw4, 20, "H1",  g_TF_L1 == PERIOD_H1,  CLR_TEAL);
   CFG_BTN("tf_h2",  bx4 + (bw4+4)*2,   cur, bw4, 20, "H2",  g_TF_L1 == PERIOD_H2,  CLR_TEAL);
   CFG_BTN("tf_h4",  bx4 + (bw4+4)*3,   cur, bw4, 20, "H4",  g_TF_L1 == PERIOD_H4,  CLR_TEAL);`;

const newTFLayout = `   // 1. SEÇÃO TIMEFRAME EXECUÇÃO
   CFG_LBLC("1", cur, "⏱ TIMEFRAME EXECUÇÃO", CLR_TXT_PRIMARY); cur += 15;
   int bw5 = 46, bx5 = cpx + (cpw - (5 * 46 + 4 * 4)) / 2;
   CFG_BTN("tf_m15", bx5,              cur, bw5, 20, "M15", g_TF_L1 == PERIOD_M15, CLR_TEAL);
   CFG_BTN("tf_m30", bx5 + bw5 + 4,     cur, bw5, 20, "M30", g_TF_L1 == PERIOD_M30, CLR_TEAL);
   CFG_BTN("tf_h1",  bx5 + (bw5+4)*2,   cur, bw5, 20, "H1",  g_TF_L1 == PERIOD_H1,  CLR_TEAL);
   CFG_BTN("tf_h2",  bx5 + (bw5+4)*3,   cur, bw5, 20, "H2",  g_TF_L1 == PERIOD_H2,  CLR_TEAL);
   CFG_BTN("tf_h4",  bx5 + (bw5+4)*4,   cur, bw5, 20, "H4",  g_TF_L1 == PERIOD_H4,  CLR_TEAL);`;

if (content.includes(oldTFLayout)) {
  content = content.replace(oldTFLayout, newTFLayout);
}

// 3. Atualizar OnChartEvent() para processar clique no M30
const oldOnChart = `else if(btn==PANEL_PREFIX+"CFG_btn_tf_m15"){ g_TF_L1=PERIOD_M15; TF_L2=(g_TF_L1<=PERIOD_H2)?PERIOD_H4:PERIOD_D1; g_AutoTF=false; InicializarHandles(); AplicarPerfil(g_CurrentPerfil); g_PanelHash=""; DesenharPainel(); DesenharPainelConfig(); DesenharLinhasChart(); }`;

const newOnChart = `else if(btn==PANEL_PREFIX+"CFG_btn_tf_m15"){ g_TF_L1=PERIOD_M15; TF_L2=(g_TF_L1<=PERIOD_H2)?PERIOD_H4:PERIOD_D1; g_AutoTF=false; InicializarHandles(); AplicarPerfil(g_CurrentPerfil); g_PanelHash=""; DesenharPainel(); DesenharPainelConfig(); DesenharLinhasChart(); }
        else if(btn==PANEL_PREFIX+"CFG_btn_tf_m30"){ g_TF_L1=PERIOD_M30; TF_L2=(g_TF_L1<=PERIOD_H2)?PERIOD_H4:PERIOD_D1; g_AutoTF=false; InicializarHandles(); AplicarPerfil(g_CurrentPerfil); g_PanelHash=""; DesenharPainel(); DesenharPainelConfig(); DesenharLinhasChart(); }`;

if (content.includes(oldOnChart)) {
  content = content.replace(oldOnChart, newOnChart);
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('🎉 M30 ADICIONADO AO PAINEL CONFIG COM SUCESSO!');
