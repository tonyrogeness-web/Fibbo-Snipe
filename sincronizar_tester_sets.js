const fs = require('fs');
const path = require('path');

const setContent = `InpPerfil=1||0||0||2||N
InpAutoRegimeSwitch=true||0||0||0||N
InpBaseRisk_L1=1.5||0.6||0.1||3.0||N
InpMaxAutoRisk=3.0||0.0||0.0||0.0||N
InpVolPartialPct=50.0||0.0||0.0||0.0||N
InpTP_Parcial_Multi=1.0||0.0||0.0||0.0||N
InpTP_Final_Multi=3.5||2.0||0.5||5.0||N
InpMagic=111||0||0||0||N
InpMaxSimultaneousOps=6||0||0||0||N
InpMaxDayTrades=2||0||0||0||N
InpMaxFRSwingTrades=1||0||0||0||N
InpMaxFiboTrades=1||0||0||0||N
InpMaxConsecLosses=3||0||0||0||N
InpTP_Min_Multi=0.3||0.0||0.0||0.0||N
InpTP_Max_Multi=5.0||0.0||0.0||0.0||N
InpMinViableATR_Multi=1.0||0.0||0.0||0.0||N
InpAutoTF=true||0||0||0||N
InpTF=16388||0||0||0||N
InpCandlesToLook=14||0||0||0||N
InpUseTrendFilter=true||0||0||0||N
InpShortEMA_Period=9||0||0||0||N
InpUseFluxo=false||0||0||0||N
InpFluxo_GatilhoPrecoce=true||0||0||0||N
InpFluxo_IgnoreWallStrong=true||0||0||0||N
InpUseVolumeFilter=true||0||0||0||N
InpFluxo_UseExhaustion=true||0||0||0||N
InpUseFR=true||0||0||0||N
InpFR_UseRSI=true||0||0||0||N
InpFR_RSI_Period=14||0||0||0||N
InpFR_MagneticZoneATRPct=15.0||0.0||0.0||0.0||N
InpFR_RequireWickRejection=true||0||0||0||N
InpFR_WickBodyRatio=0.5||0.0||0.0||0.0||N
InpFR_WickRangeMinPct=35.0||0.0||0.0||0.0||N
InpFR_BodyRangeMinPct=20.0||0.0||0.0||0.0||N
InpFR_RequireQuadrantClose=true||0||0||0||N
InpFR_CloseQuadrantPct=35.0||0.0||0.0||0.0||N
InpFR_MaxPenetrationATR=0.75||0.0||0.0||0.0||N
InpFR_RequireVolumeAbsorption=true||0||0||0||N
InpFR_MinVolumeRatio=0.90||0.0||0.0||0.0||N
InpFR_UseStructuralTP2=true||0||0||0||N
InpFR_AdaptiveRSI=true||0||0||0||N
InpFR_RSI_LateralRelax=8.0||0.0||0.0||0.0||N
InpFR_NeutralDirByRSI=true||0||0||0||N
InpFR_NeutralRSI_Sell=55.0||0.0||0.0||0.0||N
InpFR_NeutralRSI_Buy=45.0||0.0||0.0||0.0||N
InpFR_ProgressiveZone=true||0||0||0||N
InpFR_ZoneCooldown=true||0||0||0||N
InpFR_CooldownMinutes=30||0||0||0||N
InpFR_Direct_Entries=true||0||0||0||N
InpFR_Direct_ZoneATRPct=20.0||0.0||0.0||0.0||N
InpFR_Direct_IgnoreFiltros=false||0||0||0||N
InpUseBreakEven=true||0||0||0||N
InpBE_Trigger_Normal=0.50||0.0||0.0||0.0||N
InpBE_Trigger_Fibo=0.50||0.0||0.0||0.0||N
InpBE_LockProfitPts=0.0||0.0||0.0||0.0||N
InpBE_UseATRBreathing=true||0||0||0||N
InpBE_BreathingATRPct=20.0||0.0||0.0||0.0||N
InpUseTrailStop=true||0||0||0||N
InpTrail_ATR_Multi=1.0||0.0||0.0||0.0||N
InpUseADX=true||0||0||0||N
InpADX_Period=14||0||0||0||N
InpUseFechamentoMoeda=true||0||0||0||N
InpPerdaMaximaGlobalPct=2.0||0.0||0.0||0.0||N
InpPerdaMaximaMoedaPct=2.0||0.0||0.0||0.0||N
InpLucroAlvoMoedaPct=4.0||0.0||0.0||0.0||N
InpUseFiboPullback=false||0||0||0||N
InpFibLevelSell=61.8||0.0||0.0||0.0||N
InpFibLevelBuy=18.0||0.0||0.0||0.0||N
InpFibMinRange_ATR_Multi=2.0||0.0||0.0||0.0||N
InpFib_MagneticZoneATRPct=20.0||0.0||0.0||0.0||N
InpUseFiboH4_2=true||0||0||0||N
InpFibLevel2Sell=38.2||0.0||0.0||0.0||N
InpFibLevel2Buy=38.2||0.0||0.0||0.0||N
InpUseSessionFilter=true||0||0||0||N
InpSessionStartHour=10||0||0||0||N
InpSessionEndHour=22||0||0||0||N
InpSession_IgnoreOnSpike=true||0||0||0||N
InpCloseDaily=false||0||0||0||N
InpDailyCloseHour=23||0||0||0||N
InpDailyCloseMinute=30||0||0||0||N
InpFridayCloseHour=23||0||0||0||N
InpFridayCloseMinute=30||0||0||0||N
InpATR_Period=14||0||0||0||N
InpAntiExaustao_ATR_Multi=2.5||0.0||0.0||0.0||N
InpShowPanel=true||0||0||0||N
InpPanelX=20||0||0||0||N
InpPanelY=20||0||0||0||N
InpPanelFontSize=9||0||0||0||N
InpBlockLowLiquidity=true||0||0||0||N
InpBlockRollover=true||0||0||0||N
InpUseDynamicLiquidity=true||0||0||0||N
InpMinTickVolume=20||0||0||0||N
InpUseCaixoteFilter=true||0||0||0||N
InpCaixoteBars=13||0||0||0||N
InpCaixoteATR_Multi=0.8||0.0||0.0||0.0||N
InpUseOscillationFilter=true||0||0||0||N
InpMinATRPts=30.0||0.0||0.0||0.0||N
InpUseNewsFilter=true||0||0||0||N
InpNewsMinutesBefore=30||0||0||0||N
InpNewsMinutesAfter=30||0||0||0||N
InpSendPushAlert=false||0||0||0||N
InpLogCSV=true||0||0||0||N
InpPropFirmMode=true||0||0||0||N
InpPropMaxDailyLossPct=2.0||0.0||0.0||0.0||N
InpPropFirmDailyLimitPct=4.0||0.0||0.0||0.0||N
InpPropFirmMaxDDLimitPct=10.0||0.0||0.0||0.0||N
InpPropFase1TargetPct=10.0||0.0||0.0||0.0||N
InpPropFase2TargetPct=4.0||0.0||0.0||0.0||N
InpPropMaxRiskPct=1.2||0.0||0.0||0.0||N
InpPropMaxPos=2||0||0||0||N
InpPropConsistencyPct=35.0||0.0||0.0||0.0||N
`;

const buffer = Buffer.from('\ufeff' + setContent, 'utf16le');

const targetDirs = [
  'C:\\Users\\tony\\AppData\\Roaming\\MetaQuotes\\Terminal\\59C07D676775FCCF79E223EC24AB0D86\\MQL5\\Profiles\\Tester',
  'C:\\Users\\tony\\AppData\\Roaming\\MetaQuotes\\Terminal\\D0E8209F77C8CF37AD8BF550E51FF075\\MQL5\\Profiles\\Tester',
  'C:\\Users\\tony\\AppData\\Roaming\\MetaQuotes\\Terminal\\10CE948A1DFC9A8C27E56E827008EBD4\\MQL5\\Profiles\\Tester',
  __dirname
];

const fileNames = [
  'Fibbo_Sniper_v28.5_H2.set',
  'Cenario_3_H2_Maior_Lucro.set',
  'Fibbo_High_Precision_Dual_Engine.set',
  'Top_8_Moedas_FR_Sniper.set',
  'Cenario_C_Fibbo_Sniper.set'
];

targetDirs.forEach(dir => {
  if (fs.existsSync(dir)) {
    fileNames.forEach(fn => {
      const p = path.join(dir, fn);
      fs.writeFileSync(p, buffer);
      console.log('✅ Atualizado:', p);
    });
  }
});
