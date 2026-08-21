const fs = require('fs');
const path = require('path');

console.log('=== CORRIGINDO HANDLER DE CLIQUE NA ABA FLUXO ===\n');

const mq5Path = path.join(__dirname, 'Fibbo_Sniper_v28.5_H2.mq5');
let code = fs.readFileSync(mq5Path, 'utf8');

const targetLines = `      else if(btn==PANEL_PREFIX+"D_btn_tab_fl"){ ObjectDelete(0,btn); }
      else if(btn==PANEL_PREFIX+"D_btn_tab_fr"){ g_DiagTab=1; ObjectSetInteger(0,btn,OBJPROP_STATE,false); g_PanelHash=""; DesenharPainelDiag(); }
      else if(btn==PANEL_PREFIX+"D_btn_tab_fb"){ g_DiagTab=2; ObjectSetInteger(0,btn,OBJPROP_STATE,false); g_PanelHash=""; DesenharPainelDiag(); }`;

const replacementLines = `      else if(btn==PANEL_PREFIX+"D_btn_tab_fl"){ g_DiagTab=2; ObjectSetInteger(0,btn,OBJPROP_STATE,false); g_PanelHash=""; DesenharPainelDiag(); }
      else if(btn==PANEL_PREFIX+"D_btn_tab_fr"){ g_DiagTab=1; ObjectSetInteger(0,btn,OBJPROP_STATE,false); g_PanelHash=""; DesenharPainelDiag(); }`;

if (code.includes(targetLines)) {
  code = code.replace(targetLines, replacementLines);
  fs.writeFileSync(mq5Path, code, 'utf8');
  console.log('✔ Handler corrigido com sucesso! Clicar em FLUXO agora faz g_DiagTab=2.');
} else {
  console.log('⚠ targetLines não encontrado de forma idêntica. Fazendo substituição por regex...');
  code = code.replace(/else\s+if\(btn==PANEL_PREFIX\+"D_btn_tab_fl"\)\{\s*ObjectDelete\(0,btn\);\s*\}/g, 'else if(btn==PANEL_PREFIX+"D_btn_tab_fl"){ g_DiagTab=2; ObjectSetInteger(0,btn,OBJPROP_STATE,false); g_PanelHash=""; DesenharPainelDiag(); }');
  code = code.replace(/else\s+if\(btn==PANEL_PREFIX\+"D_btn_tab_fb"\)\{\s*g_DiagTab=2;[^\}]+\}/g, '');
  fs.writeFileSync(mq5Path, code, 'utf8');
  console.log('✔ Handler substituído via regex com sucesso!');
}
