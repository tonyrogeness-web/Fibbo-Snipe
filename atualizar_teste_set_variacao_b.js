const fs = require('fs');
const path = require('path');

const setPath = path.join(__dirname, 'teste.set');
const setCenarioPath = path.join(__dirname, 'Cenario_C_Fibbo_Sniper.set');

let setContent = fs.readFileSync(setPath, 'utf8').replace(/\r\n/g, '\n');

// 1. Atualizar InpTF de H1 (16385) para M15 (15)
setContent = setContent.replace(/^InpTF=.*$/m, 'InpTF=15||0||0||0||N');

// 2. Garantir Risco 1.2% e Perfil Moderado (1)
setContent = setContent.replace(/^InpPerfil=.*$/m, 'InpPerfil=1||0||0||2||N');
setContent = setContent.replace(/^InpBaseRisk_L1=.*$/m, 'InpBaseRisk_L1=1.2||0.6||0.1||3.0||Y');
setContent = setContent.replace(/^InpPropMaxRiskPct=.*$/m, 'InpPropMaxRiskPct=1.2||0.0||0.0||0.0||N');
setContent = setContent.replace(/^InpTP_Final_Multi=.*$/m, 'InpTP_Final_Multi=3.0||2.0||0.5||5.0||Y');
setContent = setContent.replace(/^InpLucroAlvoMoedaPct=.*$/m, 'InpLucroAlvoMoedaPct=3.0||0.0||0.0||0.0||N');
setContent = setContent.replace(/^InpPerdaMaximaGlobalPct=.*$/m, 'InpPerdaMaximaGlobalPct=2.5||0.0||0.0||0.0||N');

// Salvar em teste.set e Cenario_C_Fibbo_Sniper.set
fs.writeFileSync(setPath, setContent, 'utf8');
fs.writeFileSync(setCenarioPath, setContent, 'utf8');

console.log('🎉 ARQUIVO teste.set ATUALIZADO PARA A VARIAÇÃO B (M15 / MODERADO / RISCO 1.2%)!');
