const fs = require('fs');
const path = require('path');

console.log('=== ATIVANDO FIBO + FR EM TODAS AS 6 MOEDAS (SEM BLOQUEIOS) ===\n');

// 1. ATUALIZAR MQ5
const mq5File = 'Fibbo_Sniper_v28.5_H2.mq5';
let mq5 = fs.readFileSync(mq5File, 'utf8');

const oldRouting = `input bool   InpSmartFiboSymbolFilter    = true;  // [ROTEAMENTO INTELIGENTE] Filtro Seletivo por Moeda (Núcleo de Ouro)
input string InpFiboBlockedSymbols       = "EURCAD,EURAUD,EURUSD,EURGBP"; // Moedas com Fibo Desativada (Operam Apenas no FR)`;

const newRouting = `input bool   InpSmartFiboSymbolFilter    = false; // [ROTEAMENTO INTELIGENTE] false = Opera FIBO em TODAS as Moedas
input string InpFiboBlockedSymbols       = ""; // Nenhuma moeda bloqueada (FIBO + FR 100% ativas em todas as 6 moedas)`;

if (mq5.includes(oldRouting)) {
  mq5 = mq5.replace(oldRouting, newRouting);
  fs.writeFileSync(mq5File, mq5);
  console.log('✔ MQ5 atualizado com FIBO ativada em TODAS as moedas!');
} else {
  console.log('❌ oldRouting não encontrado no MQ5');
}

// 2. ATUALIZAR SET FILES
const setLines = [
  "InpPerfil=1||0||0||0||N",
  "InpAutoRegimeSwitch=true||0||0||0||N",
  "InpBaseRisk_L1=1.5||0||0||0||N",
  "InpMaxAutoRisk=3.0||0||0||0||N",
  "InpVolPartialPct=50.0||0||0||0||N",
  "InpTP_Parcial_Multi=1.0||0||0||0||N",
  "InpTP_Final_Multi=3.5||0||0||0||N",
  "InpMagic=111||0||0||0||N",
  "InpMaxSimultaneousOps=6||0||0||0||N",
  "InpMaxDayTrades=2||0||0||0||N",
  "InpMaxFRSwingTrades=1||0||0||0||N",
  "InpMaxFiboTrades=1||0||0||0||N",
  "InpMaxConsecLosses=3||0||0||0||N",
  "InpTP_Min_Multi=0.3||0||0||0||N",
  "InpTP_Max_Multi=5.0||0||0||0||N",
  "InpMinViableATR_Multi=1.0||0||0||0||N",
  "InpAutoTF=true||0||0||0||N",
  "InpTF=16388||0||0||0||N",
  "InpCandlesToLook=14||0||0||0||N",
  "InpUseTrendFilter=true||0||0||0||N",
  "InpShortEMA_Period=9||0||0||0||N",
  "InpUseFluxo=false||0||0||0||N",
  "InpFluxo_GatilhoPrecoce=true||0||0||0||N",
  "InpFluxo_IgnoreWallStrong=true||0||0||0||N",
  "InpUseVolumeFilter=true||0||0||0||N",
  "InpFluxo_UseExhaustion=true||0||0||0||N",
  "InpUseFR=true||0||0||0||N",
  "InpFR_UseRSI=true||0||0||0||N",
  "InpFR_RSI_Period=14||0||0||0||N",
  "InpFR_MagneticZoneATRPct=15.0||0||0||0||N",
  "InpFR_RequireWickRejection=true||0||0||0||N",
  "InpFR_WickBodyRatio=0.5||0||0||0||N",
  "InpFR_WickRangeMinPct=35.0||0||0||0||N",
  "InpFR_BodyRangeMinPct=20.0||0||0||0||N",
  "InpFR_RequireQuadrantClose=true||0||0||0||N",
  "InpFR_CloseQuadrantPct=35.0||0||0||0||N",
  "InpFR_MaxPenetrationATR=0.75||0||0||0||N",
  "InpFR_RequireVolumeAbsorption=true||0||0||0||N",
  "InpFR_MinVolumeRatio=0.90||0||0||0||N",
  "InpFR_UseStructuralTP2=true||0||0||0||N",
  "InpFR_AdaptiveRSI=true||0||0||0||N",
  "InpFR_RSI_LateralRelax=8.0||0||0||0||N",
  "InpFR_NeutralDirByRSI=true||0||0||0||N",
  "InpFR_NeutralRSI_Sell=55.0||0||0||0||N",
  "InpFR_NeutralRSI_Buy=45.0||0||0||0||N",
  "InpFR_ProgressiveZone=true||0||0||0||N",
  "InpFR_ZoneCooldown=true||0||0||0||N",
  "InpFR_CooldownMinutes=30||0||0||0||N",
  "InpFR_Direct_Entries=true||0||0||0||N",
  "InpFR_Direct_ZoneATRPct=20.0||0||0||0||N",
  "InpFR_Direct_IgnoreFiltros=false||0||0||0||N",
  "InpUseBreakEven=true||0||0||0||N",
  "InpBE_Trigger_Normal=0.50||0||0||0||N",
  "InpBE_Trigger_Fibo=0.50||0||0||0||N",
  "InpBE_LockProfitPts=0.0||0||0||0||N",
  "InpBE_UseATRBreathing=true||0||0||0||N",
  "InpBE_BreathingATRPct=20.0||0||0||0||N",
  "InpUseTrailStop=true||0||0||0||N",
  "InpTrail_ATR_Multi=1.0||0||0||0||N",
  "InpUseADX=true||0||0||0||N",
  "InpADX_Period=14||0||0||0||N",
  "InpUseFechamentoMoeda=true||0||0||0||N",
  "InpPerdaMaximaGlobalPct=2.0||0||0||0||N",
  "InpPerdaMaximaMoedaPct=2.0||0||0||0||N",
  "InpLucroAlvoMoedaPct=4.0||0||0||0||N",
  "InpUseFiboPullback=true||0||0||0||N",
  "InpSmartFiboSymbolFilter=false||0||0||0||N",
  "InpFiboBlockedSymbols=||0||0||0||N",
  "InpFibLevel1=18.0||0||0||0||N",
  "InpFibLevel2=28.0||0||0||0||N",
  "InpFibLevel3=38.2||0||0||0||N",
  "InpUseFiboLevel1=true||0||0||0||N",
  "InpUseFiboLevel2=true||0||0||0||N",
  "InpUseFiboLevel3=true||0||0||0||N",
  "InpFibMinRange_ATR_Multi=2.0||0||0||0||N",
  "InpFib_MagneticZoneATRPct=20.0||0||0||0||N",
  "InpFib_RequireWickRejection=true||0||0||0||N",
  "InpFib_RequireQuadrantClose=true||0||0||0||N",
  "InpFib_MaxPenetrationATR=0.75||0||0||0||N",
  "InpFib_RequireVolumeAbsorption=true||0||0||0||N",
  "InpFib_MinVolumeRatio=0.90||0||0||0||N",
  "InpFib_UseStructuralTP2=true||0||0||0||N",
  "InpUseSessionFilter=true||0||0||0||N",
  "InpSessionStartHour=10||0||0||0||N",
  "InpSessionEndHour=22||0||0||0||N",
  "InpSession_IgnoreOnSpike=true||0||0||0||N",
  "InpCloseDaily=false||0||0||0||N",
  "InpDailyCloseHour=23||0||0||0||N",
  "InpDailyCloseMinute=30||0||0||0||N",
  "InpFridayCloseHour=23||0||0||0||N",
  "InpFridayCloseMinute=30||0||0||0||N",
  "InpATR_Period=14||0||0||0||N",
  "InpAntiExaustao_ATR_Multi=2.5||0||0||0||N",
  "InpShowPanel=true||0||0||0||N",
  "InpPanelX=20||0||0||0||N",
  "InpPanelY=20||0||0||0||N",
  "InpPanelFontSize=9||0||0||0||N",
  "InpBlockLowLiquidity=true||0||0||0||N",
  "InpBlockRollover=true||0||0||0||N",
  "InpUseDynamicLiquidity=true||0||0||0||N",
  "InpMinTickVolume=20||0||0||0||N",
  "InpUseConfluencia=true||0||0||0||N",
  "InpConfluenciaMinimoZonas=1||0||0||0||N",
  "InpConfluenciaMargemPts=100||0||0||0||N",
  "InpConfluenciaTimeoutSec=300||0||0||0||N",
  "InpConfluenciaUsarFibo=true||0||0||0||N",
  "InpConfluenciaUsarFR=true||0||0||0||N",
  "InpConfluenciaUsarFluxo=false||0||0||0||N",
  "InpConfluenciaDirecional=true||0||0||0||N",
  "InpConfluenciaModo=1||0||0||0||N",
  "InpPropFirmMode=false||0||0||0||N",
  "InpPropFirmMaxDDLimitPct=5.0||0||0||0||N",
  "InpPropFirmDailyLossLimitPct=3.0||0||0||0||N",
  "InpPropFirmMaxBalancePerTradePct=1.5||0||0||0||N",
  "InpPropFase1TargetPct=8.0||0||0||0||N",
  "InpPropFase2TargetPct=5.0||0||0||0||N"
];

const setContent = '\ufeff' + setLines.join('\r\n') + '\r\n';
const setBuffer = Buffer.from(setContent, 'utf16le');

const setPaths = [
  'Fibbo_Sniper_v28.5_H2.set',
  'C:\\Users\\tony\\AppData\\Roaming\\MetaQuotes\\Terminal\\59C07D676775FCCF79E223EC24AB0D86\\MQL5\\Profiles\\Tester\\Fibbo_Sniper_v28.5_H2.set',
  'C:\\Users\\tony\\AppData\\Roaming\\MetaQuotes\\Terminal\\10CE948A1DFC9A8C27E56E827008EBD4\\MQL5\\Profiles\\Tester\\Fibbo_Sniper_v28.5_H2.set'
];

setPaths.forEach(p => {
  try {
    const dir = path.dirname(p);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(p, setBuffer);
    console.log('✔ .SET atualizado em:', p);
  } catch (err) {
    console.log('Erro ao salvar em:', p, err.message);
  }
});

// 3. COPIAR MQ5 ATUALIZADO PARA PASTAS EXPERTS
const mq5Content = fs.readFileSync(mq5File);
const expertPaths = [
  'C:\\Users\\tony\\AppData\\Roaming\\MetaQuotes\\Terminal\\59C07D676775FCCF79E223EC24AB0D86\\MQL5\\Experts\\Fibbo_Sniper_v28.5_H2.mq5',
  'C:\\Users\\tony\\AppData\\Roaming\\MetaQuotes\\Terminal\\10CE948A1DFC9A8C27E56E827008EBD4\\MQL5\\Experts\\Fibbo_Sniper_v28.5_H2.mq5'
];

expertPaths.forEach(p => {
  try {
    const dir = path.dirname(p);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(p, mq5Content);
    console.log('✔ .MQ5 copiado para:', p);
  } catch (err) {
    console.log('Erro ao copiar em:', p, err.message);
  }
});

console.log('\n=== TUDO ATUALIZADO: FIBO + FR ATIVAS EM TODAS AS 6 MOEDAS! ===');
