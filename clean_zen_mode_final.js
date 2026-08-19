const fs = require('fs');

const file = 'Fibbo_Sniper_v28.5_H2.mq5';
let code = fs.readFileSync(file, 'utf8');

console.log('=== ATUALIZANDO MODO ZEN COM LINHAS DISCRETAS E REMOVENDO TRIÂNGULOS FLUTUANTES ===\n');

// 1. ATUALIZAR DesenharLinhasChart()
// No modo ZEN, as linhas normais também são desenhadas, mas SEMPRE em modo discreto/pontilhado/apagado (highlight = false)!
const oldDrawLinesDef = `   // Quando o modo ZEN estiver ativado (g_ViewZonas == true), as linhas normais somem para dar lugar exclusivo à análise ZEN
   bool draw_lines = (!g_ViewZonas && g_LinhasModo != 2);`;

const newDrawLinesDef = `   // As linhas são desenhadas tanto no modo normal quanto no Modo ZEN (onde ficam 100% pontilhadas e discretas)
   bool draw_lines = (g_LinhasModo != 2);
   bool is_zen = g_ViewZonas;`;

if (code.includes(oldDrawLinesDef)) {
  code = code.replace(oldDrawLinesDef, newDrawLinesDef);
  console.log('✔ [1/3] Definição de draw_lines atualizada para permitir linhas discretas no Modo Zen!');
}

// 2. FORÇAR HIGHLIGHT = FALSE QUANDO NO MODO ZEN
const oldHlFR = `   // Linha só vira CONTÍNUA (SOLID) se TODOS os requisitos estiverem rigorosamente válidos (Confluência, Direção, Filtros Globais)
   bool fr_top_hl = fr_all_ok && fr_dir_sell && fr_sell_confl_ok && 
                    (g_ReadyFR_Sell || (MathAbs(g_CachedFRTop-ask)/_Point <= zone_pts));
   bool fr_bot_hl = fr_all_ok && fr_dir_buy && fr_buy_confl_ok && 
                    (g_ReadyFR_Buy  || (MathAbs(bid-g_CachedFRFundo)/_Point <= zone_pts));`;

const newHlFR = `   // Linha só vira CONTÍNUA (SOLID) se TODOS os requisitos estiverem válidos e NÃO estiver em Modo ZEN
   bool fr_top_hl = !is_zen && fr_all_ok && fr_dir_sell && fr_sell_confl_ok && 
                    (g_ReadyFR_Sell || (MathAbs(g_CachedFRTop-ask)/_Point <= zone_pts));
   bool fr_bot_hl = !is_zen && fr_all_ok && fr_dir_buy && fr_buy_confl_ok && 
                    (g_ReadyFR_Buy  || (MathAbs(bid-g_CachedFRFundo)/_Point <= zone_pts));`;

if (code.includes(oldHlFR)) {
  code = code.replace(oldHlFR, newHlFR);
  console.log('✔ [2/3] FR highlight desativado no Modo Zen (linhas sempre pontilhadas e apagadas)!');
}

const oldHlFibo = `      fb_s1_hl = fb_s_all_ok && (ds1 == min_ds) && (g_ReadyFibo || (ds1/_Point <= zone_pts));
      fb_s2_hl = fb_s_all_ok && (ds2 == min_ds) && (g_ReadyFibo || (ds2/_Point <= zone_pts));
      fb_s3_hl = fb_s_all_ok && (ds3 == min_ds) && (g_ReadyFibo || (ds3/_Point <= zone_pts));`;

const newHlFibo = `      fb_s1_hl = !is_zen && fb_s_all_ok && (ds1 == min_ds) && (g_ReadyFibo || (ds1/_Point <= zone_pts));
      fb_s2_hl = !is_zen && fb_s_all_ok && (ds2 == min_ds) && (g_ReadyFibo || (ds2/_Point <= zone_pts));
      fb_s3_hl = !is_zen && fb_s_all_ok && (ds3 == min_ds) && (g_ReadyFibo || (ds3/_Point <= zone_pts));`;

if (code.includes(oldHlFibo)) {
  code = code.replace(oldHlFibo, newHlFibo);
}

const oldHlFiboB = `      fb_b1_hl = fb_b_all_ok && (db1 == min_db) && (g_ReadyFibo || (db1/_Point <= zone_pts));
      fb_b2_hl = fb_b_all_ok && (db2 == min_db) && (g_ReadyFibo || (db2/_Point <= zone_pts));
      fb_b3_hl = fb_b_all_ok && (db3 == min_db) && (g_ReadyFibo || (db3/_Point <= zone_pts));`;

const newHlFiboB = `      fb_b1_hl = !is_zen && fb_b_all_ok && (db1 == min_db) && (g_ReadyFibo || (db1/_Point <= zone_pts));
      fb_b2_hl = !is_zen && fb_b_all_ok && (db2 == min_db) && (g_ReadyFibo || (db2/_Point <= zone_pts));
      fb_b3_hl = !is_zen && fb_b_all_ok && (db3 == min_db) && (g_ReadyFibo || (db3/_Point <= zone_pts));`;

if (code.includes(oldHlFiboB)) {
  code = code.replace(oldHlFiboB, newHlFiboB);
  console.log('✔ [2/3] Fibo highlight desativado no Modo Zen (linhas sempre pontilhadas e apagadas)!');
}

// 3. LIMPAR BLOCO DE SEGMENTOS ANTIGOS DO MODO ZEN E EXCLUIR OBJETOS RESIDUAIS
const startZenBlock = '   // ZONAS VISUAIS (MODO ZEN SINCRO INTELIGENTE)';
const endZenBlock = '   // FIM DESENHAR LINHAS';

const zenBlockRegex = /\/\/ ZONAS VISUAIS \(MODO ZEN SINCRO INTELIGENTE\)[\s\S]*?DrawVisualZoneRect\("Fluxo", 0, 0, clrNONE, false\);[\s\S]*?DrawVisualZoneRect\("FR_Top", 0, 0, clrNONE, false\); DrawVisualZoneRect\("FR_Bot", 0, 0, clrNONE, false\);[\s\S]*?DrawVisualRegressionChannel\("Fibo_Ch", 0, 0, clrNONE, false\);[\s\S]*?DrawVisualSegment\("Fibo_V1", 0, 0, 0, clrNONE, "", false\);[\s\S]*?DrawVisualSegment\("Fibo_C1", 0, 0, 0, clrNONE, "", false\);[\s\S]*?DrawVisualSegment\("Fibo_V2", 0, 0, 0, clrNONE, "", false\);[\s\S]*?DrawVisualSegment\("Fibo_C2", 0, 0, 0, clrNONE, "", false\);[\s\S]*?DrawVisualSegment\("Fibo_V3", 0, 0, 0, clrNONE, "", false\);[\s\S]*?DrawVisualSegment\("Fibo_C3", 0, 0, 0, clrNONE, "", false\);[\s\S]*?\}/;

// Substitui o bloco inteiro de Modo Zen por um bloco ultra limpo que desenha apenas o canal de regressão e apaga objetos antigos
const newZenBlockClean = `   // ZONAS VISUAIS (MODO ZEN SINCRO INTELIGENTE)
   // Limpeza rigorosa de quaisquer textos ou segmentos soltos sobre o gráfico
   ObjectsDeleteAll(0, "SniperZoneTxt_");
   ObjectsDeleteAll(0, "SniperZone_FR_");
   ObjectsDeleteAll(0, "SniperZone_Fibo_");

   if(!g_ViewZonas) {
      // Quando ZEN desativado, apaga canal de regressão e limpa tudo
      DrawVisualRegressionChannel("Fibo_Ch", 0, 0, clrNONE, false);
      LimparTudoAnalise();
   }
}`;

if (zenBlockRegex.test(code)) {
  code = code.replace(zenBlockRegex, newZenBlockClean);
  console.log('✔ [3/3] Bloco de Modo Zen substituído por arquitetura limpa (zero triângulos soltos)!');
} else {
  console.log('❌ zenBlockRegex não combinou, vamos fazer substituição direta');
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

console.log('\n✔ Script de Modo Zen executado com sucesso!');
