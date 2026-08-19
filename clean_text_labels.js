const fs = require('fs');

const file = 'Fibbo_Sniper_v28.5_H2.mq5';
let code = fs.readFileSync(file, 'utf8');

console.log('=== REMOVENDO NOMES EXTENSOS E PADRONIZANDO COM SÍMBOLOS PUROS (▲ / ▼) ===\n');

// 1. LIMPAR TEXTOS NO MODO ZEN DO FR
const oldZenFR = `      if(fr_zen_show) {
         DrawVisualZoneRect("FR_Top", 0, 0, clrNONE, false);
         DrawVisualZoneRect("FR_Bot", 0, 0, clrNONE, false);
         DrawVisualSegment("FR_TxtT", t_col_fr, t_col_fr, g_CachedFRTop - mag_tol, C'140,55,55', "▼ [FR " + tf_fr_zen + "] Topo", true, t_col_fr, g_ReadyFR ? C'235,75,75' : C'140,55,55');
         DrawVisualSegment("FR_TxtB", t_col_fr, t_col_fr, g_CachedFRFundo + mag_tol, C'140,55,55', "▲ [FR " + tf_fr_zen + "] Fundo", true, t_col_fr, g_ReadyFR ? C'235,75,75' : C'140,55,55');
      }`;

const newZenFR = `      if(fr_zen_show) {
         DrawVisualZoneRect("FR_Top", 0, 0, clrNONE, false);
         DrawVisualZoneRect("FR_Bot", 0, 0, clrNONE, false);
         DrawVisualSegment("FR_TxtT", t_col_fr, t_col_fr, g_CachedFRTop - mag_tol, C'140,55,55', "▼", true, t_col_fr, g_ReadyFR ? C'235,75,75' : C'140,55,55');
         DrawVisualSegment("FR_TxtB", t_col_fr, t_col_fr, g_CachedFRFundo + mag_tol, C'140,55,55', "▲", true, t_col_fr, g_ReadyFR ? C'235,75,75' : C'140,55,55');
      }`;

if (code.includes(oldZenFR)) {
  code = code.replace(oldZenFR, newZenFR);
  console.log('✔ FR no Modo Zen padronizado com símbolos limpos (▼ / ▲)!');
}

// 2. LIMPAR TEXTOS NO MODO ZEN DA FIBO
code = code.replace('"▼ [FIBO H4] 18.0%"', '"▼"');
code = code.replace('"▼ [FIBO H4] 28.0%"', '"▼"');
code = code.replace('"▼ [FIBO H4] 38.2%"', '"▼"');

code = code.replace('"▲ [FIBO H4] 18.0%"', '"▲"');
code = code.replace('"▲ [FIBO H4] 28.0%"', '"▲"');
code = code.replace('"▲ [FIBO H4] 38.2%"', '"▲"');

console.log('✔ Fibo no Modo Zen padronizada com símbolos limpos (▼ / ▲)!');

// 3. LIMPEZA TOTAL DE OBJETOS COM NOMES ANTIGOS AO TROCAR MODOS / INICIALIZAR
const oldLimparGrafico = `void LimparGrafico() {
   ObjectsDeleteAll(0, "FS_");
   ObjectsDeleteAll(0, ORD_LINE_PFX);
   ObjectsDeleteAll(0, "AN_VISUAL_");
   ObjectsDeleteAll(0, "SniperLine_");
   ObjectsDeleteAll(0, "SniperText_");
   ObjectsDeleteAll(0, "SniperZoneTxt_");
}`;

if (!code.includes('ObjectsDeleteAll(0, "SniperZoneTxt_");')) {
  code = code.replace('ObjectsDeleteAll(0, "SniperText_");', 'ObjectsDeleteAll(0, "SniperText_");\n   ObjectsDeleteAll(0, "SniperZoneTxt_");\n   ObjectsDeleteAll(0, "AN_VISUAL_Txt_");');
  console.log('✔ Limpeza completa de rótulos e textos residuais adicionada!');
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

console.log('\n✔ Limpeza e sincronização concluídas!');
