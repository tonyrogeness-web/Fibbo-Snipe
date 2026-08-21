const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'Fibbo_Sniper_v28.5_H2.mq5');
let lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/);

let idx = -1;
for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('if((g_MG_FR_H4_Sup > 0 || g_MG_FR_D1_Sup > 0) && !perto_sup) confl_b_ok = false;')) {
        idx = i;
        break;
    }
}

if (idx !== -1) {
    console.log(`Found marker at line ${idx + 1}: ${lines[idx]}`);
    // Check next lines for closing braces
    let insertIdx = idx + 1;
    while (insertIdx < lines.length && (lines[insertIdx].trim() === '}' || lines[insertIdx].trim() === '')) {
        insertIdx++;
    }
    
    const codeToInsert = [
        "",
        "          // [BLINDAGEM 1] Trava Anti-Super-Tendência L1 (Execução Real Day Trade + Direct)",
        "          if(InpFR_BlockAgainstSuperTrend && g_H4_ADX >= InpFR_SuperTrend_ADX) {",
        "              double e200_l1 = (g_MG_EMA200 > 0) ? g_MG_EMA200 : 0;",
        "              if(e200_l1 > 0) {",
        "                 if(bid > e200_l1) { confl_s_ok = false; m_sell = false; } // Super-Alta: Proibido vender topo",
        "                 if(ask < e200_l1) { confl_b_ok = false; m_buy  = false; } // Super-Baixa: Proibido comprar fundo",
        "              }",
        "          }",
        ""
    ];
    
    lines.splice(insertIdx, 0, ...codeToInsert);
    fs.writeFileSync(filePath, lines.join('\r\n'), 'utf8');
    console.log(`✅ Inserido com sucesso na linha ${insertIdx + 1}!`);
} else {
    console.log("❌ Marcador não encontrado!");
}
