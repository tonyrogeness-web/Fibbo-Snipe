const fs = require('fs');
const path = require('path');

console.log('=== VERIFICANDO E ATUALIZANDO ARQUIVO .SET OFICIAL ===\n');

function buildSetLines(overrides = {}) {
  const defaults = {
    "InpPerfil": "1",
    "InpAutoRegimeSwitch": "true",
    "InpBaseRisk_L1": "1.5",
    "InpMaxAutoRisk": "3.0",
    "InpVolPartialPct": "50.0",
    "InpTP_Parcial_Multi": "1.0",
    "InpTP_Final_Multi": "3.5",
    "InpMagic": "111",
    "InpMaxSimultaneousOps": "6",
    "InpMaxDayTrades": "2",
    "InpMaxFRSwingTrades": "1",
    "InpMaxConsecLosses": "3",
    "InpTP_Min_Multi": "0.3",
    "InpTP_Max_Multi": "5.0",
    "InpMinViableATR_Multi": "1.0",
    "InpSmartRouting": "true",
    "InpFR_BlockedSymbols": "GBPJPY,GBPUSD,XAUUSD,GOLD",
    "InpFluxo_BlockedSymbols": "EURUSD,EURJPY,EURCAD,NZDUSD,EURAUD,AUDNZD",
    "InpAutoTF": "true",
    "InpTF": "16388", // PERIOD_H2
    "InpCandlesToLook": "14",
    "InpUseTrendFilter": "true",
    "InpShortEMA_Period": "9",
    "InpUseFluxo": "true",
    "InpFluxo_GatilhoPrecoce": "false",
    "InpFluxo_IgnoreWallStrong": "false",
    "InpUseVolumeFilter": "true",
    "InpFluxo_UseExhaustion": "true",
    "InpUseFR": "true",
    "InpFR_UseRSI": "true",
    "InpFR_RSI_Period": "14",
    "InpFR_MagneticZoneATRPct": "15.0",
    "InpFR_RequireWickRejection": "true",
    "InpFR_WickBodyRatio": "0.5",
    "InpFR_WickRangeMinPct": "35.0",
    "InpFR_BodyRangeMinPct": "20.0",
    "InpFR_RequireQuadrantClose": "true",
    "InpFR_CloseQuadrantPct": "35.0",
    "InpFR_MaxPenetrationATR": "0.75",
    "InpFR_RequireVolumeAbsorption": "true",
    "InpFR_MinVolumeRatio": "0.90",
    "InpFR_UseStructuralTP2": "true",
    "InpFR_AdaptiveRSI": "true",
    "InpFR_RSI_LateralRelax": "8.0",
    "InpFR_NeutralDirByRSI": "true",
    "InpFR_NeutralRSI_Sell": "55.0",
    "InpFR_NeutralRSI_Buy": "45.0",
    "InpFR_ProgressiveZone": "true",
    "InpFR_ZoneCooldown": "true",
    "InpFR_CooldownMinutes": "30",
    "InpFR_BlockAgainstSuperTrend": "true",
    "InpFR_SuperTrend_ADX": "30.0",
    "InpFR_RequireMinWick40": "true",
    "InpFR_MinWickRatioPct": "40.0",
    "InpFR_UseMidChannelLock": "true",
    "InpFR_Direct_Entries": "true",
    "InpFR_Direct_ZoneATRPct": "20.0",
    "InpFR_Direct_IgnoreFiltros": "false",
    "InpUseBreakEven": "true",
    "InpBE_Trigger_Normal": "0.50",
    "InpBE_Trigger_Fibo": "0.50",
    "InpBE_LockProfitPts": "0.0",
    "InpBE_UseATRBreathing": "true",
    "InpBE_BreathingATRPct": "20.0",
    "InpUseTrailStop": "true",
    "InpTrail_ATR_Multi": "1.0",
    "InpUseADX": "true",
    "InpADX_Period": "14",
    "InpUseFechamentoMoeda": "true",
    "InpPerdaMaximaGlobalPct": "3.0",
    "InpPerdaMaximaMoedaPct": "3.0",
    "InpLucroAlvoMoedaPct": "4.5",
    "InpUseSessionFilter": "true",
    "InpSessionStartHour": "10",
    "InpSessionEndHour": "22",
    "InpSession_IgnoreOnSpike": "true",
    "InpCloseDaily": "false",
    "InpDailyCloseHour": "23",
    "InpDailyCloseMinute": "30",
    "InpFridayCloseHour": "23",
    "InpFridayCloseMinute": "30",
    "InpATR_Period": "14",
    "InpAntiExaustao_ATR_Multi": "2.5",
    "InpShowPanel": "true",
    "InpPanelX": "20",
    "InpPanelY": "20",
    "InpPanelTheme": "0",
    "InpPanelFontSize": "9",
    "InpSendPushNotifications": "false",
    "InpLogCSV": "false",
    "InpUseOscillationFilter": "true",
    "InpMinATRPts": "50.0",
    "InpBlockRollover": "true",
    "InpBlockLowLiquidity": "true",
    "InpUseDynamicLiquidity": "true",
    "InpMinTickVolume": "50",
    "InpUseHighImpactNewsFilter": "true",
    "InpNewsMinsBefore": "30",
    "InpNewsMinsAfter": "30",
    "InpBlockSpikeConsolidation": "true",
    "InpSpikeLookbackBars": "5",
    "InpSpikeRangeMultiplier": "2.0",
    "InpModoConfluencia": "4",
    "InpPropFirmMode": "true",
    "InpPropFirmMaxDDLimitPct": "6.0",
    "InpPropMaxDailyLossPct": "3.0",
    "InpPropConsistencyPct": "35.0",
    "InpPropFase1TargetPct": "8.0",
    "InpPropFase2TargetPct": "5.0",
    "InpPropHighWatermark": "0.0",
    "InpPropBreachLevel": "0.0",
    "InpPropAutoStopLossAdjust": "true",
    "InpPropMaxRiskPct": "1.5",
    "InpPropDaysToComplete": "4"
  };

  const finalParams = { ...defaults, ...overrides };
  const lines = Object.entries(finalParams).map(([k, v]) => `${k}=${v}||0||0||0||N`);
  return '\ufeff' + lines.join('\r\n') + '\r\n';
}

const filename = "Fibbo_Sniper_v28.5_H2_FR+Fluxo.set";
const setContent = buildSetLines();

const targetDirs = [
  __dirname,
  "C:\\Users\\tony\\AppData\\Roaming\\MetaQuotes\\Terminal\\59C07D676775FCCF79E223EC24AB0D86\\MQL5\\Profiles\\Tester",
  "C:\\Users\\tony\\AppData\\Roaming\\MetaQuotes\\Terminal\\59C07D676775FCCF79E223EC24AB0D86\\MQL5\\Presets",
  "C:\\Users\\tony\\AppData\\Roaming\\MetaQuotes\\Terminal\\D0E8209F77C8CF37AD8BF550E51FF075\\MQL5\\Profiles\\Tester",
  "C:\\Users\\tony\\AppData\\Roaming\\MetaQuotes\\Terminal\\D0E8209F77C8CF37AD8BF550E51FF075\\MQL5\\Presets"
];

targetDirs.forEach(dir => {
  if (fs.existsSync(dir)) {
    fs.writeFileSync(path.join(dir, filename), setContent, 'utf16le');
    console.log(`✔ Salvo e sincronizado: ${filename} em ${dir}`);
  }
});

console.log('\n=== TUDO 100% PRONTO E SINCRONIZADO! ===');
