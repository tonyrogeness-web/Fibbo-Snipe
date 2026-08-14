const fs = require('fs');
const path = require('path');

console.log('🔄 Criando e salvando o arquivo de parâmetros .set Agressivo...');

const testerDir = 'C:\\Users\\tony\\AppData\\Roaming\\MetaQuotes\\Terminal\\59C07D676775FCCF79E223EC24AB0D86\\MQL5\\Profiles\\Tester';
const localDir = 'c:\\Users\\tony\\.gemini\\antigravity-ide\\scratch\\FibboSniper';

// Configuração Cenário 3 - H2 Maior Lucro no PERFIL_AGRESSIVO (InpPerfil = 2)
const setContent = `InpPerfil=2||0||0||2||N
InpAutoRegimeSwitch=true||false||0||true||N
InpBaseRisk_L1=2.0||0.6||0.1||3.0||N
InpMaxAutoRisk=3.0||0.0||0.000000||0.000000||N
InpVolPartialPct=50.0||0.0||0.000000||0.000000||N
InpTP_Parcial_Multi=1.0||0.0||0.000000||0.000000||N
InpTP_Final_Multi=3.5||2.0||0.5||5.0||N
InpMagic=111||0||0||0||N
InpMaxSimultaneousOps=6||0||0||0||N
InpMaxDayTrades=2||0||0||0||N
InpMaxFRSwingTrades=1||0||0||0||N
InpMaxFiboTrades=1||0||0||0||N
InpMaxConsecLosses=3||0||0||0||N
InpTP_Min_Multi=0.3||0.0||0.000000||0.000000||N
InpTP_Max_Multi=5.0||0.0||0.000000||0.000000||N
InpMinViableATR_Multi=1.0||0.0||0.000000||0.000000||N
InpAutoTF=true||false||0||true||N
InpTF=16388||0||0||0||N
InpCandlesToLook=14||0||0||0||N
InpUseTrendFilter=true||false||0||true||N
InpShortEMA_Period=9||0||0||0||N
InpUseFluxo=false||false||0||true||N
InpFluxo_GatilhoPrecoce=true||false||0||true||N
InpFluxo_IgnoreWallStrong=true||false||0||true||N
InpUseVolumeFilter=true||false||0||true||N
InpFluxo_UseExhaustion=true||false||0||true||N
InpUseFR=true||false||0||true||N
InpFR_UseRSI=true||false||0||true||N
InpFR_RSI_Period=14||0||0||0||N
InpFR_MagneticZoneATRPct=15.0||0.0||0.000000||0.000000||N
InpFR_RequireWickRejection=true||false||0||true||N
InpFR_WickBodyRatio=0.35||0.0||0.000000||0.000000||N
InpFR_WickRangeMinPct=30.0||0.0||0.000000||0.000000||N
InpFR_BodyRangeMinPct=15.0||0.0||0.000000||0.000000||N
InpFR_AdaptiveRSI=true||false||0||true||N
InpFR_RSI_LateralRelax=8.0||0.0||0.000000||0.000000||N
InpFR_NeutralDirByRSI=true||false||0||true||N
InpFR_NeutralRSI_Sell=55.0||0.0||0.000000||0.000000||N
InpFR_NeutralRSI_Buy=45.0||0.0||0.000000||0.000000||N
InpFR_ProgressiveZone=true||false||0||true||N
InpFR_ZoneCooldown=true||false||0||true||N
InpFR_CooldownMinutes=30||0||0||0||N
InpFR_Direct_Entries=true||false||0||true||N
InpFR_Direct_ZoneATRPct=20.0||0.0||0.000000||0.000000||N
InpFR_Direct_IgnoreFiltros=false||false||0||true||N
InpUseBreakEven=true||false||0||true||N
InpBE_Trigger_Normal=0.5||0.0||0.000000||0.000000||N
InpBE_Trigger_Fibo=0.5||0.0||0.000000||0.000000||N
InpBE_LockProfitPts=0.0||0.0||0.000000||0.000000||N
InpUseTrailStop=true||false||0||true||N
InpTrail_ATR_Multi=1.0||0.0||0.000000||0.000000||N
InpUseADX=true||false||0||true||N
InpADX_Period=14||0||0||0||N
InpUseFechamentoMoeda=true||false||0||true||N
InpPerdaMaximaGlobalPct=2.0||0.0||0.000000||0.000000||N
InpPerdaMaximaMoedaPct=2.0||0.0||0.000000||0.000000||N
InpLucroAlvoMoedaPct=4.0||0.0||0.000000||0.000000||N
InpUseFiboPullback=false||false||0||true||N
InpFibLevelSell=61.8||0.0||0.000000||0.000000||N
InpFibLevelBuy=18.0||0.0||0.000000||0.000000||N
InpFibMinRange_ATR_Multi=2.0||0.0||0.000000||0.000000||N
InpFib_MagneticZoneATRPct=20.0||0.0||0.000000||0.000000||N
InpUseFiboH4_2=true||false||0||true||N
InpFibLevel2Sell=38.2||0.0||0.000000||0.000000||N
InpFibLevel2Buy=38.2||0.0||0.000000||0.000000||N
InpUseSessionFilter=true||false||0||true||N
InpSessionStartHour=10||0||0||0||N
InpSessionEndHour=22||0||0||0||N
InpSession_IgnoreOnSpike=true||false||0||true||N
InpCloseDaily=false||false||0||true||N
InpDailyCloseHour=23||0||0||0||N
InpDailyCloseMinute=30||0||0||0||N
InpFridayCloseHour=23||0||0||0||N
InpFridayCloseMinute=30||0||0||0||N
InpATR_Period=14||0||0||0||N
InpAntiExaustao_ATR_Multi=2.5||0.0||0.000000||0.000000||N
InpShowPanel=true||false||0||true||N
InpPanelX=20||0||0||0||N
InpPanelY=20||0||0||0||N
InpPanelFontSize=9||0||0||0||N
InpBlockLowLiquidity=true||false||0||true||N
InpBlockRollover=true||false||0||true||N
InpUseDynamicLiquidity=true||false||0||true||N
InpMinTickVolume=20||0||0||0||N
InpUseCaixoteFilter=true||false||0||true||N
InpCaixoteBars=13||0||0||0||N
InpCaixoteATR_Multi=0.8||0.0||0.000000||0.000000||N
InpUseOscillationFilter=true||false||0||true||N
InpMinATRPts=30.0||0.0||0.000000||0.000000||N
InpUseNewsFilter=true||false||0||true||N
InpNewsMinutesBefore=30||0||0||0||N
InpNewsMinutesAfter=30||0||0||0||N
InpSendPushAlert=false||false||0||true||N
InpLogCSV=true||false||0||true||N
InpPropFirmMode=true||false||0||true||N
InpPropMaxDailyLossPct=2.0||0.0||0.000000||0.000000||N
InpPropFirmDailyLimitPct=4.0||0.0||0.000000||0.000000||N
InpPropFirmMaxDDLimitPct=10.0||0.0||0.000000||0.000000||N
InpPropFase1TargetPct=10.0||0.0||0.000000||0.000000||N
InpPropFase2TargetPct=4.0||0.0||0.000000||0.000000||N
InpPropMaxRiskPct=1.2||0.0||0.000000||0.000000||N
InpPropMaxPos=2||0||0||0||N
InpPropConsistencyPct=35.0||0.0||0.000000||0.000000||N
`;

function writeUtf16LE(filePath, contentStr) {
  const outBuf = Buffer.concat([Buffer.from([0xff, 0xfe]), Buffer.from(contentStr, 'utf16le')]);
  fs.writeFileSync(filePath, outBuf);
  console.log(`✅ Salvo com sucesso: ${path.basename(filePath)}`);
}

const fileName = 'Cenario_3_H2_Maior_Lucro_agressivo.set';
writeUtf16LE(path.join(testerDir, fileName), setContent);
writeUtf16LE(path.join(localDir, fileName), setContent);

console.log('🎉 ARQUIVO DE PARÂMETROS AGRESSIVO SALVO COM SUCESSO!');
